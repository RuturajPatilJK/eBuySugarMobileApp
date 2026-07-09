'use client';
import { useState } from 'react';
import { useLazyGetSaleBillDetailQuery } from '../../services/customerSaleBillPrintApi';
import { ConvertNumberToWord, formatReadableAmount } from '../../lib/convertNumberToWord';

const CompanyNameUpdatedDate = '2025-07-10';
const newCompanyName = 'JK Sugars And Commodities Pvt. Ltd.';
const oldFormerlyName = '(Formerly known as JK eBuySugar Pvt. Ltd.)';
const TCSApplicable = 'Y';

async function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function generateSaleBillPDF(allData) {
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    await import('../../lib/fonts/Signika-Bold-normal');
    await import('../../lib/fonts/Signika-Regular-normal');
    await import('../../lib/fonts/Signika-Medium-normal');
    const QRCode = (await import('qrcode')).default;

    const pdf = new jsPDF({ orientation: 'portrait' });
    const docDate = new Date(allData.doc_date);
    const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);
    const shouldUseImage = docDate >= cnameUpdatedDate;

    const displayCompanyName = shouldUseImage ? allData.Company_Name_E : newCompanyName;
    const logoSrc = shouldUseImage ? '/jk.png' : '/jklogo.png';
    const signSrc = shouldUseImage ? '/DirectorSign.png' : '/DirectorSign1.png';
    const foormerlyName = shouldUseImage ? (allData.AL1 || '') : oldFormerlyName;

    pdf.setFont('Signika-Regular');
    pdf.setFontSize(8);

    const [logoImg, signImg, headerImg, footerImg, footerImg1] = await Promise.all([
        loadImage(logoSrc).catch(() => null),
        loadImage(signSrc).catch(() => null),
        loadImage('/HeaderJK.png').catch(() => null),
        loadImage('/FooterJK.png').catch(() => null),
        loadImage('/FooterJK1.png').catch(() => null),
    ]);

    const qrCodeData = `GSTN of Supplier : ${allData.companyGSTNo || ''}\nGSTIN of Buyer : ${allData.billtogstno || ''}\nDocument No. : ${allData.doc_no || ''}\nDocument Type : Tax Invoice\nDate : ${allData.doc_date || ''}\nHSN : ${allData.HSN || ''}\nIRN : ${allData.einvoiceno || ''}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData.trim());

    // Header
    if (shouldUseImage && headerImg) {
        pdf.addImage(headerImg, 'PNG', 0, 6, 180, 34);
    } else if (logoImg) {
        pdf.addImage(logoImg, 'PNG', 10, 9, 30, 30);
        pdf.setFontSize(14);
        pdf.setFont('Signika-Bold');
        pdf.text(displayCompanyName, 45, 14);
        pdf.setFont('Signika-Regular');
        pdf.setFontSize(9);
        pdf.text(foormerlyName, 45, 18);
        pdf.text(allData.AL2 || '', 45, 22);
        pdf.text(allData.AL3 || '', 45, 26);
        pdf.text(allData.AL4 || '', 45, 30);
        pdf.text(allData.Other || '', 45, 34);
        pdf.text(allData.BillFooter || '', 45, 38);
    }
    pdf.addImage(qrCodeDataUrl, 'PNG', 170, 9, 30, 30);

    pdf.setFontSize(10);
    pdf.setFont('Signika-Bold');
    pdf.setDrawColor(80, 80, 80);
    pdf.line(10, 44, 200, 44);
    pdf.setTextColor(41, 122, 14);
    pdf.text('TAX INVOICE', 95, 49);
    pdf.setLineWidth(0.3);
    pdf.line(10, 52, 200, 52);
    pdf.setTextColor(0, 0, 0);

    let y = 45;
    pdf.setFontSize(9);

    const fieldPairs = [
        [`Invoice No. :  SB${allData.year}-${allData.doc_no}`, `Invoice Date : ${allData.doc_dateConverted}`, 'Lorry No.', allData.LORRYNO],
        [`DO No. : ${allData.DO_No}`, `Date of Supply : ${allData.doc_dateConverted}`, 'Transport Mode', 'Road'],
        [`E-Way Bill No.: ${allData.EWay_Bill_No}`, `EwayBill ValidDate: ${allData.EwayBillValidDate}`, 'From', `${allData.millshortname} (${allData.millstatename} - ${allData.millstatecode})`],
        [`Acknowledge: ${allData.ackno}`, '', 'Place Of Supply', `${allData.shiptocityname} (${allData.shiptocitystate} - ${allData.shiptogststatecode})`],
        [`E-Invoice No.: ${allData.einvoiceno}`, '', 'Ref By', allData.shiptoshortname],
        ['', '', 'Reverse Charge', 'No'],
    ];

    fieldPairs.forEach(([left1, left2, rightLabel, rightValue]) => {
        const leftX = 12, middleX = 60, rightX = 110, wrapWidth = 85, lineHeight = 4;
        const [rawLeftLabel, ...rawLeftValParts] = (left1 ?? '').split(':');
        const leftLabel = rawLeftLabel?.trim() ? `${rawLeftLabel.trim()}:` : '';
        const leftValue = rawLeftValParts.join(':').trim();
        const leftValueLines = pdf.splitTextToSize(leftValue, wrapWidth - pdf.getTextWidth(leftLabel));
        const left2Lines = pdf.splitTextToSize(left2 ?? '', wrapWidth);
        const rightLabelText = rightLabel?.trim() ? `${rightLabel.trim()}:` : '';
        const rightValueText = (rightValue ?? '').toString().trim();
        const rightValueLines = pdf.splitTextToSize(rightValueText, wrapWidth - pdf.getTextWidth(rightLabelText));
        const maxLines = Math.max(leftValueLines.length, left2Lines.length, rightValueLines.length);

        for (let i = 0; i < maxLines; i++) {
            const yOffset = y + i * lineHeight + 17;
            if (i === 0 && leftLabel) {
                pdf.setFont('Signika-Medium');
                pdf.text(leftLabel, leftX, yOffset);
                pdf.setFont('Signika-Regular');
                pdf.text(leftValueLines[i] ?? '', leftX + pdf.getTextWidth(leftLabel) + 1, yOffset);
            } else if (leftValueLines[i]) {
                pdf.setFont('Signika-Regular');
                pdf.text(leftValueLines[i], leftX, yOffset);
            }
            if (left2Lines[i]) {
                pdf.setFont('Signika-Regular');
                pdf.text(left2Lines[i], middleX, yOffset);
            }
            if (i === 0 && rightLabelText) {
                pdf.setFont('Signika-Medium');
                pdf.text(rightLabelText, rightX, yOffset);
                pdf.setFont('Signika-Regular');
                pdf.text(rightValueLines[i] ?? '', rightX + pdf.getTextWidth(rightLabelText) + 1, yOffset);
            } else if (rightValueLines[i]) {
                pdf.setFont('Signika-Regular');
                pdf.text(rightValueLines[i], rightX, yOffset);
            }
        }
        y += maxLines * lineHeight;
    });

    pdf.setDrawColor(80, 80, 80);
    pdf.setLineWidth(0.3);
    pdf.line(105, 59, 105, y + 12);
    pdf.line(10, y + 18, 200, y + 18);

    // Address block helper
    const addressBlock = (x, yStart, title, lines) => {
        let ay = yStart;
        const lineHeight = 4;
        pdf.setFont('Signika-Medium');
        pdf.setTextColor(0, 0, 0);
        pdf.text(title, x, ay + 10);
        ay += lineHeight;
        lines.forEach((line, index) => {
            const wrapped = pdf.splitTextToSize(String(line ?? ''), 85);
            pdf.setFont(index === 0 ? 'Signika-Bold' : 'Signika-Regular');
            pdf.setTextColor(index === 0 ? 41 : 0, index === 0 ? 122 : 0, index === 0 ? 14 : 0);
            wrapped.forEach(wLine => { pdf.text(wLine, x, ay + 10); ay += lineHeight; });
        });
        return ay;
    };

    const isRegular = allData.carporateSaleDoc !== 0 && allData.carporateSaleDoc !== '' && allData.selling_type === 'P' && allData.Delivery_type === 'C';

    const fssaiNo = isRegular ? allData.FSSAI_BillTo : (allData.carporateBillToFSSAI || allData.FSSAI_BillTo);
    const tanNo = isRegular ? allData.BillToTanNo : (allData.Carporate_Tanno || allData.BillToTanNo);

    const billToLines = [
        isRegular ? allData.billtoname : (allData.CarporateBillTo_Name || allData.billtoname),
        isRegular ? `${allData.billtoaddress}, ${allData.billtocitystate} ${allData.billtopincode}` : `${allData.Carporate_Address}, ${allData.carporateBillToStateName} ${allData.carporateBillToPincode}`,
        `City: ${isRegular ? `${allData.billtopin} (${allData.billtocitystate} - ${allData.billtogststatecode})` : (allData.carporateBillToCityName ? `${allData.carporateBillToCityName} (${allData.carporateBillToStateName} - ${allData.CarporateState_Code})` : `${allData.billtopin} (${allData.billtocitystate} - ${allData.billtogststatecode})`)}`,
        `GST: ${isRegular ? allData.billtogstno : (allData.CarporateBillToGst_No || allData.billtogstno)}`,
        `PAN: ${isRegular ? allData.billtopanno : (allData.Carporate_Pan || allData.billtopanno)}`,
        fssaiNo ? `FSSAI: ${fssaiNo}` : null,
        tanNo ? `TAN: ${tanNo}` : null,
    ].filter(Boolean);

    const shipToLines = [
        allData.shiptoname,
        allData.shiptoaddress,
        `City: ${allData.shiptocityname} (${allData.shiptocitystate} - ${allData.shiptogststatecode})`,
        `GST: ${allData.shiptogstno}`,
        `PAN: ${allData.shiptopanno}`,
        allData.FSSAI_ShipTo ? `FSSAI: ${allData.FSSAI_ShipTo}` : null,
        allData.ShipToTanNo ? `TAN: ${allData.ShipToTanNo}` : null,
    ].filter(Boolean);

    const addressStartY = y + 17;
    const endYBill = addressBlock(12, addressStartY, 'Buyer (Bill to):', billToLines);
    const endYShip = addressBlock(110, addressStartY, 'Consignee (Ship to):', shipToLines);
    pdf.line(105, addressStartY + 6, 105, Math.max(endYBill, endYShip) + 7);
    pdf.line(10, Math.max(endYBill, endYShip) + 13, 200, Math.max(endYBill, endYShip) + 13);
    y = Math.max(endYBill, endYShip) + 11;

    // Product table header
    pdf.setFont('Signika-Medium');
    pdf.setTextColor(41, 122, 14);
    pdf.text('Particulars', 12, y + 7);
    pdf.text('Short Name', 50, y + 7, { align: 'left' });
    pdf.text('HSN', 80, y + 7);
    pdf.text('Grade', 100, y + 7);
    pdf.text('Season', 120, y + 7);
    pdf.text('Quintal', 140, y + 7);
    pdf.text('Rate', 160, y + 7);
    pdf.text('Value', 182, y + 7);
    y += 5;
    pdf.line(10, y + 5, 200, y + 5);

    pdf.setFont('Signika-Medium');
    pdf.setTextColor(0, 0, 0);
    pdf.text(String(allData.itemname ?? 'Sugar'), 12, y + 9);
    pdf.setFont('Signika-Regular');
    pdf.text(String(allData.millshortname ?? ''), 50, y + 9);
    pdf.text(String(allData.HSN ?? ''), 80, y + 9);
    pdf.text(String(allData.grade ?? ''), 100, y + 9);
    pdf.text(String(allData.season ?? ''), 120, y + 9);

    const value = parseFloat(allData.subTotal || 0);
    const rate = parseFloat(allData.Quantal) ? (value / parseFloat(allData.Quantal)).toFixed(2) : 0;
    const amountX = 197, rateX = 170, labelX = 140;
    pdf.text(Number(allData.Quantal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), labelX, y + 9);
    pdf.text(Number(rate).toLocaleString('en-IN', { minimumFractionDigits: 2 }), rateX, y + 9, { align: 'right' });
    pdf.text(Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 }), amountX, y + 9, { align: 'right' });

    y += 8;
    pdf.setFont('Signika-Regular');
    const wrappedMillName = pdf.splitTextToSize(String(allData.millname ?? '-'), 90);
    pdf.text('Mill Name:', 12, y + 11);
    pdf.text(wrappedMillName, 28, y + 11);

    const millNameHeight = (wrappedMillName.length - 1) * 5;
    let currentY = y + 16 + millNameHeight;

    let fssai = String(allData.MillFSSAI_No ?? '').trim();
    if (fssai !== '') {
        if (fssai.length > 25 && !fssai.includes(' ')) {
            fssai = fssai.match(/.{1,20}/g).join(' ');
        }
        const wrappedFSSAI = pdf.splitTextToSize(fssai, 100);
        pdf.text('Mill FSSAI:', 12, currentY);
        pdf.text(wrappedFSSAI, 28, currentY);
    }

    y += 8;

    // Tax breakdown
    const igstRate = parseFloat(allData.IGSTRate) || 0;
    const igstAmt = parseFloat(allData.IGSTAmount) || 0;
    const cgstRate = parseFloat(allData.CGSTRate) || 0;
    const cgstAmt = parseFloat(allData.CGSTAmount) || 0;
    const sgstRate = parseFloat(allData.SGSTRate) || 0;
    const sgstAmt = parseFloat(allData.SGSTAmount) || 0;
    const taxRows = igstRate > 0 ? [['IGST', igstRate, igstAmt]] : [['CGST', cgstRate, cgstAmt], ['SGST', sgstRate, sgstAmt]];
    const freightRows = (!allData.carporateSaleDoc || allData.carporateSaleDoc === '' || allData.carporateSaleDoc === null) && parseFloat(allData.freight) !== 0
        ? [['Freight', allData.LESS_FRT_RATE, allData.freight]] : [];
    const summaryFields = [
        ...freightRows,
        ['Taxable Amount', '', allData.TaxableAmount],
        ...taxRows,
        ['Rate Diff/Qntl', '', allData.RateDiff],
        ['Other Expense', '', allData.OTHER_AMT],
        ['Round Off', '', allData.RoundOff],
        ...(TCSApplicable === 'N' ? [] : [['TCS', allData.TCS_Rate, allData.TCS_Amt], ['TCS Net Payable', '', allData.TCS_Net_Payable]]),
    ];

    summaryFields.forEach(([label, rateVal, amount]) => {
        pdf.setFont('Signika-Regular');
        pdf.text(`${label}:`, 130, y + 3);
        const rateLabel = (label === 'IGST' || label === 'CGST' || label === 'SGST') ? '%' : '/Qntl';
        if (rateVal !== null && rateVal !== undefined && rateVal !== '') {
            pdf.text(`${formatReadableAmount(rateVal)}${rateLabel}`, 165, y + 3, { align: 'center' });
        }
        pdf.text(formatReadableAmount(amount), 197, y + 3, { align: 'right' });
        y += 5;
    });

    pdf.line(10, y + 4, 200, y + 4);
    const totalInWords = ConvertNumberToWord(parseFloat(allData.TCS_Net_Payable));
    pdf.setFont('Signika-Regular');
    pdf.text(`Rs: ${totalInWords}.`, 12, y + 9);
    const formattedTotal = Number(allData.TCS_Net_Payable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    pdf.setFont('Signika-Bold');
    pdf.setTextColor(41, 122, 14);
    pdf.text('Total Amount:', 150, y + 9);
    pdf.text(`₹ ${formattedTotal}`, amountX, y + 9, { align: 'right' });

    y += 5;
    pdf.line(10, y + 7, 200, y + 7);

    // Terms
    pdf.setFont('Signika-Bold');
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(8);
    pdf.text('Terms & Conditions:', 12, y + 12);
    pdf.setFont('Signika-Regular');
    const notes = [
        '- If there is no insurance of the goods, after dispatch from the destination,',
        '   we are not responsible for non delivery, damage or any kind of loss.',
        '- Buyer must inspect and confirm quality & quantity of the goods before dispatch from godown.',
        '   Once loaded and truck leaves godown, Said all responsibilities will be transfer to buyers account.',
        '- Please send the full amount in our account through RTGS before despatch the goods.',
        '   If the amount is not received in our account, Interest of 24% P.A. will be charged to the buyer.',
        `- Subject to ${allData.companyCity} jurisdiction.`,
    ];
    notes.forEach((n, i) => pdf.text(n, 12, y + 13 + (i + 1) * 3));

    y += 25;
    if (allData.SBNarration) pdf.text(allData.SBNarration, 12, y + 12);

    // Signature
    const signY = y - 10;
    pdf.setFont('Signika-Bold');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    const forText = `For. ${String(displayCompanyName ?? '')}`;
    pdf.text(forText, 197 - pdf.getTextWidth(forText), signY);

    const signWidth = 240;
    const signHeight = signWidth / 5;
    y -= 20;
    if (signImg) pdf.addImage(signImg, 'PNG', 157, y + 11, signWidth, signHeight);
    pdf.text('Authorised Signatory', 168, y + 28);

    // Footer
    const footerY = 252;
    const footerHeight = 37;
    if (shouldUseImage && footerImg) {
        pdf.addImage(footerImg, 'PNG', 0, footerY, 260, footerHeight);
    } else if (footerImg1) {
        pdf.addImage(footerImg1, 'PNG', 0, footerY, 210, footerHeight);
    }
    pdf.setFont('Signika-Medium');
    pdf.setFontSize(7);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Powered by: Sugarian.app', 12, footerY + footerHeight + 3);

    return { pdf, allData, rate };
}

export default function SaleBillPrint({ saleid, label = 'Print' }) {
    const [getBillDetail, { isFetching }] = useLazyGetSaleBillDetailQuery();
    const [loading, setLoading] = useState(false);

    const handlePrint = async () => {
        if (loading || isFetching) return;
        setLoading(true);
        try {
            const result = await getBillDetail(saleid).unwrap();
            const dataArray = Array.isArray(result) ? result : (result.all_data || [result]);
            const allData = dataArray[0];
            if (!allData) { alert('No bill data found'); return; }
            const { pdf, allData: d } = await generateSaleBillPDF(allData);
            const docNo = `SB${d.year || ''}-${d.doc_no || ''}`;
            const truck = d.LORRYNO ? `_${String(d.LORRYNO).trim()}` : '';
            const buyer = d.billtoname ? `_${String(d.billtoname).trim().toUpperCase()}` : '';
            pdf.save(`SaleBill_${docNo}${truck}${buyer}.pdf`);
        } catch (err) {
            console.error('Sale bill print error:', err);
            alert('Failed to generate bill PDF');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button onClick={handlePrint} disabled={loading || isFetching}
            style={{ padding: '5px 11px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#4338ca', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5, opacity: loading ? 0.7 : 1 }}>
            {loading ? (
                <><span style={{ display: 'inline-block', width: 10, height: 10, border: '2px solid rgba(67,56,202,0.3)', borderTopColor: '#4338ca', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />PDF...</>
            ) : (
                <>&#128424; {label}</>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </button>
    );
}
