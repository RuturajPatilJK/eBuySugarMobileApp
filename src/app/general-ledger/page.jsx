'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';
import { useLazyGetMyLedgerReportQuery } from '../../services/generalLedgerApi';
import { useLazyGetMyAccountAddressQuery } from '../../services/accountMasterApi';
import { formatReadableAmount } from '../../lib/convertNumberToWord';

const COMPANY_CODE = parseInt(process.env.NEXT_PUBLIC_COMPANY_CODE) || 4;
const CompanyNameUpdatedDate = '2025-07-10';
const newCompanyName = 'JK Sugars And Commodities Pvt. Ltd.';
const oldFormerlyName = '(Formerly known as JK eBuySugar Pvt. Ltd.)';

const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmtDisplayDate = (v) => {
    if (!v) return '';
    const [y, m, d] = String(v).split('-');
    return `${d}/${m}/${y}`;
};

const mergeOpeningBalance = (openingBalance, allData) => {
    let opRows = [];
    if (!openingBalance || openingBalance.length === 0) {
        opRows.push({
            AC_CODE: 0, Ac_Name_E: 'Opening Balance', Balance: 0, DOC_DATE: '', DOC_NO: '',
            NARRATION: 'Opening balance', TRAN_TYPE: 'OP', credit: 0, debit: 0, DRCR: '',
        });
    } else {
        opRows = openingBalance.map(b => ({
            AC_CODE: b.AC_CODE, Ac_Name_E: 'Opening Balance',
            Balance: b.OpBal ? Math.abs(parseFloat(b.OpBal)) : 0,
            DOC_DATE: '', DOC_NO: '', NARRATION: 'Opening balance', TRAN_TYPE: 'OP',
            credit: b.OpBal < 0 ? Math.abs(parseFloat(b.OpBal)) : 0,
            debit:  b.OpBal > 0 ? Math.abs(parseFloat(b.OpBal)) : 0,
            DRCR:   b.OpBal > 0 ? 'D' : 'C',
        }));
    }
    return [...opRows, ...allData];
};

const computeRunningBalance = (details) => {
    const LedgerData = details.all_data || [];
    const OpBalData  = details.Opening_Balance || [];
    let running = OpBalData.length > 0 ? parseFloat(OpBalData[0].OpBal || 0) : 0;
    return mergeOpeningBalance(OpBalData, LedgerData).map(entry => {
        const amount = parseFloat(entry.AMOUNT || 0);
        if (entry.drcr === 'D') running += amount;
        else if (entry.drcr === 'C') running -= amount;
        return { ...entry, Balance: Math.abs(running).toFixed(2), drcr: running >= 0 ? 'Dr' : 'Cr' };
    });
};

const sumTotals = (rows) => rows.reduce(
    (acc, r) => { acc.debit += parseFloat(r.debit || 0); acc.credit += parseFloat(r.credit || 0); return acc; },
    { debit: 0, credit: 0 }
);

async function loadImg(src) {
    return new Promise((resolve, reject) => {
        const i = new Image();
        i.crossOrigin = 'anonymous';
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = src;
    });
}

async function generateLedgerPDF({ filteredData, totals, fromDate, toDate, addressData }) {
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    await import('../../lib/fonts/Signika-Bold-normal');
    await import('../../lib/fonts/Signika-Regular-normal');
    await import('../../lib/fonts/Signika-Medium-normal');

    const doc = new jsPDF('portrait');
    const pageWidth  = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const hData    = addressData || {};
    const docDate  = new Date(toDate || new Date());
    const cnameDate = new Date(CompanyNameUpdatedDate);
    const shouldUseImage = docDate >= cnameDate;
    const foormerlyName  = fromDate < CompanyNameUpdatedDate ? oldFormerlyName : (hData.AL1 || '');

    const [logoImg, headerImg, footerImg, footerImg1] = await Promise.all([
        loadImg('/jklogo.png').catch(() => null),
        loadImg('/HeaderJK.png').catch(() => null),
        loadImg('/FooterJK.png').catch(() => null),
        loadImg('/FooterJK1.png').catch(() => null),
    ]);

    let currentY = 9;

    if (shouldUseImage && headerImg) {
        doc.addImage(headerImg, 'PNG', 0, 6, 180, 34);
    } else if (logoImg) {
        doc.addImage(logoImg, 'PNG', 10, currentY, 30, 30);
        doc.setFont('Signika-Bold');    doc.setFontSize(14);
        doc.text(newCompanyName, 45, currentY + 5);
        doc.setFont('Signika-Regular'); doc.setFontSize(9);
        doc.text(foormerlyName,       45, currentY + 9);
        doc.text(hData.AL2  || '',    45, currentY + 13);
        doc.text(hData.AL3  || '',    45, currentY + 17);
        doc.text(hData.AL4  || '',    45, currentY + 21);
        doc.text(hData.Other || '',   45, currentY + 25);
        if (hData.BillFooter) doc.text(hData.BillFooter, 45, currentY + 29);
    }

    doc.setDrawColor(80, 80, 80);
    doc.line(10, 44, 200, 44);
    currentY += 40;

    doc.setFont('Signika-Bold'); doc.setFontSize(10); doc.setTextColor(0, 128, 0);
    doc.text('LEDGER ACCOUNT', pageWidth / 2, 49, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    doc.line(10, 52, 200, 52);
    currentY += 2;

    const leftY = currentY;
    doc.setFont('Signika-Regular'); doc.setFontSize(8);
    doc.text('To,', 12, leftY + 5);
    doc.setFont('Signika-Bold'); doc.setTextColor(0, 128, 0);
    doc.text(hData.Ac_Name_E || '', 12, leftY + 10);
    doc.setFont('Signika-Regular'); doc.setTextColor(0, 0, 0);

    const addrLines = doc.splitTextToSize(hData.Address_E || '', 100);
    addrLines.forEach((l, i) => doc.text(l, 12, leftY + 15 + i * 5));
    let nextY = leftY + 15 + addrLines.length * 5;
    doc.text(`City: ${hData.cityname || ''} (${hData.State_Name || ''} - ${hData.GSTStateCode || ''})`, 12, nextY); nextY += 5;
    doc.text(`GST: ${hData.Gst_No || ''}`, 12, nextY); nextY += 5;
    if (hData.Email) doc.text(`Email: ${hData.Email}`, 12, nextY);

    const summaryX = 135;
    let rightY = currentY;
    const openingBal = filteredData[0]?.TRAN_TYPE === 'OP' ? parseFloat(filteredData[0]?.Balance || 0) : 0;
    const net = totals.debit - totals.credit;

    doc.setFont('Signika-Regular');
    doc.text(`Ledger from ${fmtDisplayDate(fromDate)} to ${fmtDisplayDate(toDate)}`, summaryX, rightY + 5); rightY += 5;
    doc.setFont('Signika-Bold');
    doc.text('SUMMARY', summaryX, rightY + 5); rightY += 5;
    doc.setFont('Signika-Regular');
    doc.text('Opening Balance', summaryX, rightY + 5);
    doc.text(`${formatReadableAmount(openingBal)} Cr.`, summaryX + 60, rightY + 5, { align: 'right' }); rightY += 5;
    doc.text('Credited Amount', summaryX, rightY + 5);
    doc.text(`${formatReadableAmount(totals.credit)} Cr.`, summaryX + 60, rightY + 5, { align: 'right' }); rightY += 5;
    doc.text('Debited Amount',  summaryX, rightY + 5);
    doc.text(`${formatReadableAmount(totals.debit)} Dr.`,  summaryX + 60, rightY + 5, { align: 'right' }); rightY += 5;
    doc.text('Closing Balance', summaryX, rightY + 5);
    doc.line(summaryX, rightY + 2, 195, rightY + 2);
    doc.setFont('Signika-Bold');
    doc.text(`${formatReadableAmount(Math.abs(net))} ${net > 0 ? 'Dr.' : 'Cr.'}`, summaryX + 60, rightY + 5, { align: 'right' });
    doc.line(summaryX, rightY + 7, 195, rightY + 7);

    currentY = Math.max(leftY + 40, rightY + 8);

    const drawTableHeader = () => {
        doc.setFont('Signika-Bold');
        doc.line(10, currentY - 4, 200, currentY - 4);
        doc.text('Date',      12,  currentY);
        doc.text('Particulars', 35, currentY);
        doc.text('Vch Type',  95,  currentY, { align: 'center' });
        doc.text('Vch No.',   113, currentY, { align: 'center' });
        doc.text('Debit',     140, currentY, { align: 'right' });
        doc.text('Credit',    165, currentY, { align: 'right' });
        doc.text('Balance',   190, currentY, { align: 'right' });
        doc.line(10, currentY + 2, 200, currentY + 2);
        currentY += 5;
    };

    const drawFooter = (pageNum, totalPages, showFull) => {
        const fImgH = 40, fImgY = pageHeight - fImgH - 12;
        if (showFull) {
            if (shouldUseImage && footerImg)  doc.addImage(footerImg,  'PNG', 0, fImgY, 260, fImgH);
            else if (footerImg1)              doc.addImage(footerImg1, 'PNG', 0, fImgY, 210, fImgH);
        }
        doc.setFont('Signika-Regular'); doc.setFontSize(8);
        doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
    };

    drawTableHeader();
    doc.setFont('Signika-Regular');
    const usableH = pageHeight - 35;

    for (const item of filteredData) {
        const narLines = doc.splitTextToSize(item.NARRATION || '', 55);
        const rowH = narLines.length * 5;
        if (currentY + 10 > usableH) {
            doc.addPage(); currentY = 10;
            drawTableHeader(); doc.setFont('Signika-Regular');
        }
        doc.text(item.DOC_DATE || '',                               12,  currentY + 1);
        doc.text(item.TRAN_TYPE || '',                              95,  currentY + 1, { align: 'center' });
        doc.text(String(item.DOC_NO || ''),                         113, currentY + 1, { align: 'center' });
        doc.text(formatReadableAmount(item.debit  || 0),            140, currentY + 1, { align: 'right' });
        doc.text(formatReadableAmount(item.credit || 0),            165, currentY + 1, { align: 'right' });
        doc.text(formatReadableAmount(Math.abs(item.Balance || 0)), 190, currentY + 1, { align: 'right' });
        doc.text(item.drcr || '',                                   191, currentY + 1);
        narLines.forEach((l, idx) => doc.text(l, 35, currentY + 1 + idx * 5));
        currentY += rowH;
    }

    currentY += 8;
    doc.setFont('Signika-Regular'); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
    doc.text('***END OF LEDGER***', pageWidth / 2, currentY, { align: 'center' }); currentY += 5;
    doc.setFontSize(7.5);
    doc.text('This is a system-generated ledger statement and does not require a signature.', pageWidth / 2, currentY, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) { doc.setPage(p); drawFooter(p, totalPages, p === totalPages); }

    doc.save(`Ledger_${fromDate}_to_${toDate}.pdf`);
}

export default function GeneralLedgerPage() {
    const today = getTodayDate();
    const [fromDate,     setFromDate]     = useState(today);
    const [toDate,       setToDate]       = useState(today);
    const [transType,    setTransType]    = useState('All');
    const [activePreset, setActivePreset] = useState('Today');
    const [ledgerData,   setLedgerData]   = useState([]);
    const [showReport,   setShowReport]   = useState(false);
    const [pdfLoading,   setPdfLoading]   = useState(false);

    const [triggerGetReport, { isLoading }] = useLazyGetMyLedgerReportQuery();
    const [triggerGetAddress]               = useLazyGetMyAccountAddressQuery();

    const filteredData = useMemo(() => {
        if (!transType || transType === 'All') return ledgerData;
        return ledgerData.filter(r => r.TRAN_TYPE?.toUpperCase() === transType.toUpperCase());
    }, [ledgerData, transType]);

    const totals = useMemo(() => sumTotals(filteredData), [filteredData]);

    const handleFetch = async () => {
        if (!fromDate || !toDate) { alert('Select both dates'); return; }
        try {
            const result = await triggerGetReport({ Company_Code: COMPANY_CODE, from_date: fromDate, to_date: toDate }).unwrap();
            if (result) { setLedgerData(computeRunningBalance(result)); setShowReport(true); }
        } catch { alert('Failed to fetch ledger'); }
    };

    const handlePrint = async () => {
        if (pdfLoading || filteredData.length === 0) return;
        setPdfLoading(true);
        try {
            const addrResult = await triggerGetAddress(COMPANY_CODE);
            const addressData = addrResult?.data?.[0] || {};
            await generateLedgerPDF({ filteredData, totals, fromDate, toDate, addressData });
        } catch (err) {
            console.error('Ledger PDF error', err);
            alert('Failed to generate PDF');
        } finally { setPdfLoading(false); }
    };

    const presets = useMemo(() => {
        const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        return [
            { label: 'Today',      from: today, to: today },
            { label: 'This Week',  from: (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return fmt(d); })(), to: today },
            { label: 'This Month', from: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`; })(), to: today },
            { label: 'Last Month', from: (() => { const n = new Date(); return fmt(new Date(n.getFullYear(), n.getMonth()-1, 1)); })(), to: (() => { const n = new Date(); return fmt(new Date(n.getFullYear(), n.getMonth(), 0)); })() },
        ];
    }, [today]);

    const openingBal = filteredData[0]?.TRAN_TYPE === 'OP' ? parseFloat(filteredData[0]?.Balance || 0) : 0;
    const netBalance = totals.debit - totals.credit;

    const VOUCHER_TYPES = [
        ['All','All Transactions'],['CR','Cash Receipt'],['CP','Cash Payment'],
        ['BR','Bank Receipt'],['BP','Bank Payment'],['JV','Journal Voucher'],
        ['SB','Sale Bill'],['PS','Purchase'],['DN','Debit Note'],['CN','Credit Note'],
    ];

    return (
        <AppLayout title="Account Statement">
            <div style={{ padding: '12px 16px 32px', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>

                {/* Filter card */}
                <div style={{ background: 'white', borderRadius: 14, padding: '12px 14px', marginBottom: 14, border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

                    <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                        {presets.map(p => (
                            <button key={p.label}
                                onClick={() => { setFromDate(p.from); setToDate(p.to); setActivePreset(p.label); }}
                                style={{ flex: 1, padding: '7px 2px', borderRadius: 8, border: `1.5px solid ${activePreset === p.label ? '#ef3837' : '#e5e7eb'}`, background: activePreset === p.label ? '#fff1f0' : 'white', color: activePreset === p.label ? '#ef3837' : '#6b7280', fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                        {[{ label: 'From', val: fromDate, set: setFromDate }, { label: 'To', val: toDate, set: setToDate }].map(f => (
                            <div key={f.label}>
                                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#9ca3af', marginBottom: 4 }}>{f.label}</label>
                                <input type="date" value={f.val}
                                    onChange={e => { f.set(e.target.value); setActivePreset('Custom'); }}
                                    style={{ width: '100%', padding: '9px 10px', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#111827', boxSizing: 'border-box' }} />
                            </div>
                        ))}
                    </div>

                    <div style={{ marginBottom: 10 }}>
                        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#9ca3af', marginBottom: 4 }}>VOUCHER TYPE</label>
                        <select value={transType} onChange={e => setTransType(e.target.value)}
                            style={{ width: '100%', padding: '9px 10px', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#111827' }}>
                            {VOUCHER_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </div>

                    <button onClick={handleFetch} disabled={isLoading}
                        style={{ width: '100%', padding: '11px', background: 'linear-gradient(135deg,#ef3837,#d92300)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 800, cursor: isLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: isLoading ? 0.7 : 1 }}>
                        {isLoading ? 'Fetching…' : 'Get Ledger'}
                    </button>
                </div>

                {/* Summary cards */}
                {showReport && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                        {[
                            { label: 'Opening Bal',  val: formatReadableAmount(openingBal),                                                                   color: '#6366f1', bg: '#f5f3ff' },
                            { label: 'Total Debit',  val: formatReadableAmount(totals.debit),                                                                  color: '#059669', bg: '#f0fdf4' },
                            { label: 'Total Credit', val: formatReadableAmount(totals.credit),                                                                 color: '#D92300', bg: '#FFF1EE' },
                            { label: 'Closing Net',  val: `${formatReadableAmount(Math.abs(netBalance))} ${netBalance >= 0 ? 'Dr' : 'Cr'}`, color: '#1e293b', bg: '#f8fafc' },
                        ].map((s, i) => (
                            <div key={i} style={{ background: s.bg, borderRadius: 12, padding: '12px 14px', borderLeft: `3px solid ${s.color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                                <p style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>{s.label}</p>
                                <p style={{ fontSize: 15, fontWeight: 900, color: '#1a1a2e' }}>{s.val}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Print PDF button */}
                {showReport && filteredData.length > 0 && (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handlePrint} disabled={pdfLoading}
                        style={{ width: '100%', marginBottom: 14, padding: '12px', background: '#1e293b', border: 'none', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 800, cursor: pdfLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: pdfLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {pdfLoading ? (
                            <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'lspin 0.7s linear infinite', display: 'inline-block' }} />Generating PDF…</>
                        ) : '🖨 Print Ledger PDF'}
                        <style>{`@keyframes lspin { to { transform: rotate(360deg); } }`}</style>
                    </motion.button>
                )}

                {/* Transactions */}
                {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[1,2,3,4,5].map(i => (
                            <div key={i} style={{ background: 'white', borderRadius: 12, padding: '12px 14px', border: '1px solid #f3f4f6' }}>
                                <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8, borderRadius: 6 }} />
                                <div className="skeleton" style={{ height: 10, width: '40%', marginBottom: 12, borderRadius: 6 }} />
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[1,2,3].map(j => <div key={j} className="skeleton" style={{ flex: 1, height: 10, borderRadius: 6 }} />)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : showReport && filteredData.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {filteredData.map((item, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(i * 0.015, 0.3) }}
                                style={{ background: 'white', borderRadius: 12, padding: '12px 14px', border: '1px solid #f3f4f6', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 4, lineHeight: 1.4 }}>{item.NARRATION || 'Opening Balance'}</p>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                            {item.DOC_DATE ? <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>{item.DOC_DATE}</span> : null}
                                            {item.TRAN_TYPE && item.TRAN_TYPE !== 'OP' && (
                                                <span style={{ fontSize: 10, fontWeight: 700, background: '#eff6ff', color: '#2563eb', borderRadius: 4, padding: '1px 6px' }}>{item.TRAN_TYPE}</span>
                                            )}
                                            {item.DOC_NO ? <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>#{item.DOC_NO}</span> : null}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: item.drcr === 'Dr' ? '#d97706' : '#059669', background: item.drcr === 'Dr' ? '#fffbeb' : '#f0fdf4', border: `1px solid ${item.drcr === 'Dr' ? '#fde68a' : '#bbf7d0'}`, borderRadius: 6, padding: '3px 8px', flexShrink: 0 }}>
                                        {item.drcr}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f9fafb', paddingTop: 8 }}>
                                    {[
                                        { label: 'Debit',   val: parseFloat(item.debit  || 0) > 0 ? formatReadableAmount(item.debit)  : '—', color: '#d97706' },
                                        { label: 'Credit',  val: parseFloat(item.credit || 0) > 0 ? formatReadableAmount(item.credit) : '—', color: '#059669' },
                                        { label: 'Balance', val: formatReadableAmount(Math.abs(item.Balance || 0)),                           color: '#111827' },
                                    ].map(f => (
                                        <div key={f.label} style={{ textAlign: 'center', flex: 1 }}>
                                            <p style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>{f.label}</p>
                                            <p style={{ fontSize: 11, fontWeight: 800, color: f.color }}>{f.val}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}

                        {/* Totals footer */}
                        <div style={{ background: '#1e293b', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between' }}>
                            {[
                                { label: 'Total Debit',  val: formatReadableAmount(totals.debit),   color: '#fbbf24' },
                                { label: 'Total Credit', val: formatReadableAmount(totals.credit),  color: '#86efac' },
                                { label: 'Net Balance',  val: `${formatReadableAmount(Math.abs(netBalance))} ${netBalance >= 0 ? 'Dr' : 'Cr'}`, color: 'white' },
                            ].map(f => (
                                <div key={f.label} style={{ textAlign: 'center', flex: 1 }}>
                                    <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 3 }}>{f.label}</p>
                                    <p style={{ fontSize: 13, fontWeight: 900, color: f.color }}>{f.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : showReport ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 20, border: '1.5px dashed #e5e7eb' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📒</div>
                        <p style={{ fontWeight: 800, color: '#374151', marginBottom: 6, fontSize: 16 }}>No transactions found</p>
                        <p style={{ color: '#9ca3af', fontSize: 13 }}>Try changing the date range or voucher type.</p>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 20, border: '1.5px dashed #e5e7eb' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
                        <p style={{ fontWeight: 800, color: '#374151', marginBottom: 6, fontSize: 16 }}>Account Statement</p>
                        <p style={{ color: '#9ca3af', fontSize: 13 }}>Select a date range and tap "Get Ledger".</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
