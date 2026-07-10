'use client';
import { useState } from 'react';
import { useLazyGetMyAccountAddressQuery } from '../../services/accountMasterApi';
import { formatReadableAmount } from '../../lib/convertNumberToWord';
import { downloadPdf } from '../../lib/downloadPdf';

const COMPANY_CODE = parseInt(process.env.NEXT_PUBLIC_COMPANY_CODE || '4');
const CompanyNameUpdatedDate = '2025-07-10';
const newCompanyName = 'JK Sugars And Commodities Pvt. Ltd.';
const oldFormerlyName = '(Formerly known as JK eBuySugar Pvt. Ltd.)';

async function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

function fmtDateDisplay(s) {
    if (!s) return '';
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
}

async function generateLedgerPDF({ rows, fromDate, toDate, totals }) {
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    await import('../../lib/fonts/Signika-Bold-normal');
    await import('../../lib/fonts/Signika-Regular-normal');

    const doc = new jsPDF({ orientation: 'portrait' });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let currentY = 9;

    const docDate = new Date(toDate || new Date());
    const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);
    const shouldUseImage = docDate >= cnameUpdatedDate;
    const foormerlyName = fromDate < CompanyNameUpdatedDate ? oldFormerlyName : '';

    const [logoImg, headerImg, footerImg, footerImg1] = await Promise.all([
        loadImage('/jklogo.png'),
        loadImage('/HeaderJK.png'),
        loadImage('/FooterJK.png'),
        loadImage('/FooterJK1.png'),
    ]);

    doc.setFont('Signika-Regular');

    if (shouldUseImage && headerImg) {
        doc.addImage(headerImg, 'PNG', 0, 6, 180, 34);
    } else if (logoImg) {
        doc.addImage(logoImg, 'PNG', 10, currentY, 30, 30);
        doc.setFont('Signika-Bold');
        doc.setFontSize(14);
        doc.text(newCompanyName, 45, currentY + 5);
        doc.setFont('Signika-Regular');
        doc.setFontSize(9);
        doc.text(foormerlyName, 45, currentY + 9);
    }

    doc.setDrawColor(80, 80, 80);
    doc.line(10, 44, 200, 44);
    currentY += 40;

    doc.setFont('Signika-Bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 128, 0);
    doc.text('LEDGER ACCOUNT', pageWidth / 2, 49, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    doc.line(10, 52, 200, 52);
    currentY += 2;

    const openingBalance = rows[0]?.TRAN_TYPE === 'OP' ? parseFloat(rows[0]?.Balance || 0) : 0;
    const net = parseFloat((totals.debit || 0) - (totals.credit || 0));

    // Summary box (right side)
    const summaryX = 135;
    let rightY = currentY;
    doc.setFont('Signika-Regular');
    doc.setFontSize(8);
    doc.text(`Ledger from ${fmtDateDisplay(fromDate)} to ${fmtDateDisplay(toDate)}`, summaryX, rightY + 5);
    rightY += 5;
    doc.setFont('Signika-Bold');
    doc.text('SUMMARY', summaryX, rightY + 5);
    rightY += 5;
    doc.setFont('Signika-Regular');
    doc.text('Opening Balance', summaryX, rightY + 5);
    doc.text(`${formatReadableAmount(openingBalance)} Cr.`, summaryX + 60, rightY + 5, { align: 'right' });
    rightY += 5;
    doc.text('Credited Amount', summaryX, rightY + 5);
    doc.text(`${formatReadableAmount(totals.credit || 0)} Cr.`, summaryX + 60, rightY + 5, { align: 'right' });
    rightY += 5;
    doc.text('Debited Amount', summaryX, rightY + 5);
    doc.text(`${formatReadableAmount(totals.debit || 0)} Dr.`, summaryX + 60, rightY + 5, { align: 'right' });
    rightY += 5;
    doc.text('Closing Balance', summaryX, rightY + 5);
    doc.line(summaryX, rightY + 2, 195, rightY + 2);
    doc.setFont('Signika-Bold');
    doc.text(`${formatReadableAmount(Math.abs(net))} ${net > 0 ? 'Dr.' : 'Cr.'}`, summaryX + 60, rightY + 5, { align: 'right' });
    doc.line(summaryX, rightY + 7, 195, rightY + 7);

    currentY = Math.max(currentY + 40, rightY + 8);

    const drawTableHeader = () => {
        doc.setFont('Signika-Bold');
        doc.setFontSize(8);
        doc.line(10, currentY - 4, 200, currentY - 4);
        doc.text('Date', 12, currentY);
        doc.text('Particulars', 35, currentY);
        doc.text('Vch Type', 95, currentY, { align: 'center' });
        doc.text('Vch No.', 113, currentY, { align: 'center' });
        doc.text('Debit', 140, currentY, { align: 'right' });
        doc.text('Credit', 165, currentY, { align: 'right' });
        doc.text('Balance', 190, currentY, { align: 'right' });
        doc.line(10, currentY + 2, 200, currentY + 2);
        currentY += 5;
    };

    const drawFooter = (pageNum, totalPages, showFullFooter = false) => {
        const footerImageHeight = 40;
        const footerImageY = pageHeight - footerImageHeight - 12;
        const pageNumberY = pageHeight - 5;
        if (showFullFooter) {
            if (shouldUseImage && footerImg) {
                doc.addImage(footerImg, 'PNG', 0, footerImageY, 260, footerImageHeight);
            } else if (footerImg1) {
                doc.addImage(footerImg1, 'PNG', 0, footerImageY, 210, footerImageHeight);
            }
        }
        doc.setFont('Signika-Regular');
        doc.setFontSize(8);
        doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageNumberY, { align: 'center' });
    };

    drawTableHeader();
    doc.setFont('Signika-Regular');
    doc.setFontSize(8);

    const footerHeight = 35;
    const usablePageHeight = pageHeight - footerHeight;

    for (let i = 0; i < rows.length; i++) {
        const item = rows[i];
        const narrationMaxWidth = 55;
        const lineHeight = 5;
        const narrationLines = doc.splitTextToSize(item.NARRATION || '', narrationMaxWidth);
        const requiredHeight = narrationLines.length * lineHeight;

        if (currentY + 10 > usablePageHeight) {
            doc.addPage();
            currentY = 10;
            drawTableHeader();
            doc.setFont('Signika-Regular');
            doc.setFontSize(8);
        }

        doc.text(item.DOC_DATE || '', 12, currentY + 1);
        doc.text(item.TRAN_TYPE || '', 95, currentY + 1, { align: 'center' });
        doc.text(String(item.DOC_NO || ''), 113, currentY + 1, { align: 'center' });
        doc.text(formatReadableAmount(item.debit || 0), 140, currentY + 1, { align: 'right' });
        doc.text(formatReadableAmount(item.credit || 0), 165, currentY + 1, { align: 'right' });
        doc.text(formatReadableAmount(Math.abs(item.Balance || 0)), 190, currentY + 1, { align: 'right' });
        doc.text(item.drcr || '', 191, currentY + 1, { align: 'left' });

        narrationLines.forEach((line, idx) => {
            doc.text(line, 35, currentY + 1 + idx * lineHeight);
        });
        currentY += requiredHeight;
    }

    currentY += 8;
    doc.setFont('Signika-Regular');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('***END OF LEDGER***', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.setFontSize(7.5);
    doc.text('This is a system-generated ledger statement and does not require a signature.', pageWidth / 2, currentY, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(i, totalPages, i === totalPages);
    }

    return doc;
}

export default function GeneralLedgerPrint({ rows, fromDate, toDate, totals }) {
    const [getAddress] = useLazyGetMyAccountAddressQuery();
    const [loading, setLoading] = useState(false);

    const handlePrint = async () => {
        if (loading || !rows || rows.length === 0) return;
        setLoading(true);
        try {
            await getAddress(COMPANY_CODE);
            const doc = await generateLedgerPDF({ rows, fromDate, toDate, totals });
            await downloadPdf(doc, `Ledger_${fromDate}_to_${toDate}.pdf`);
        } catch (err) {
            console.error('Ledger PDF error:', err);
            alert('Failed to generate ledger PDF');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button onClick={handlePrint} disabled={loading}
            style={{ padding: '5px 10px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, fontSize: 11, fontWeight: 700, color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5, opacity: loading ? 0.7 : 1 }}>
            {loading ? (
                <><span style={{ display: 'inline-block', width: 10, height: 10, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />PDF...</>
            ) : (
                <>🖨 Print</>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </button>
    );
}
