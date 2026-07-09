'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, RotateCcw, ChevronDown } from 'lucide-react';
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
const dmy = (s) => { if (!s) return '—'; const [y, m, d] = String(s).split('-'); return `${d}-${m}-${y}`; };

const mergeOpeningBalance = (openingBalance, allData) => {
    let opRows = [];
    if (!openingBalance || openingBalance.length === 0) {
        opRows.push({ AC_CODE: 0, Ac_Name_E: 'Opening Balance', Balance: 0, DOC_DATE: '', DOC_NO: '', NARRATION: 'Opening balance', TRAN_TYPE: 'OP', credit: 0, debit: 0, DRCR: '' });
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
        const i = new Image(); i.crossOrigin = 'anonymous';
        i.onload = () => resolve(i); i.onerror = reject; i.src = src;
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
    const hData      = addressData || {};
    const docDate    = new Date(toDate || new Date());
    const cnameDate  = new Date(CompanyNameUpdatedDate);
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
        doc.setFont('Signika-Bold'); doc.setFontSize(14);
        doc.text(newCompanyName, 45, currentY + 5);
        doc.setFont('Signika-Regular'); doc.setFontSize(9);
        doc.text(foormerlyName, 45, currentY + 9);
        doc.text(hData.AL2 || '', 45, currentY + 13);
        doc.text(hData.AL3 || '', 45, currentY + 17);
        doc.text(hData.AL4 || '', 45, currentY + 21);
        doc.text(hData.Other || '', 45, currentY + 25);
        if (hData.BillFooter) doc.text(hData.BillFooter, 45, currentY + 29);
    }

    doc.setDrawColor(80, 80, 80); doc.line(10, 44, 200, 44); currentY += 40;
    doc.setFont('Signika-Bold'); doc.setFontSize(10); doc.setTextColor(0, 128, 0);
    doc.text('LEDGER ACCOUNT', pageWidth / 2, 49, { align: 'center' });
    doc.setTextColor(0, 0, 0); doc.line(10, 52, 200, 52); currentY += 2;

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
    doc.setFont('Signika-Bold'); doc.text('SUMMARY', summaryX, rightY + 5); rightY += 5;
    doc.setFont('Signika-Regular');
    doc.text('Opening Balance', summaryX, rightY + 5);
    doc.text(`${formatReadableAmount(openingBal)} Cr.`, summaryX + 60, rightY + 5, { align: 'right' }); rightY += 5;
    doc.text('Credited Amount', summaryX, rightY + 5);
    doc.text(`${formatReadableAmount(totals.credit)} Cr.`, summaryX + 60, rightY + 5, { align: 'right' }); rightY += 5;
    doc.text('Debited Amount', summaryX, rightY + 5);
    doc.text(`${formatReadableAmount(totals.debit)} Dr.`, summaryX + 60, rightY + 5, { align: 'right' }); rightY += 5;
    doc.text('Closing Balance', summaryX, rightY + 5);
    doc.line(summaryX, rightY + 2, 195, rightY + 2);
    doc.setFont('Signika-Bold');
    doc.text(`${formatReadableAmount(Math.abs(net))} ${net > 0 ? 'Dr.' : 'Cr.'}`, summaryX + 60, rightY + 5, { align: 'right' });
    doc.line(summaryX, rightY + 7, 195, rightY + 7);

    currentY = Math.max(leftY + 40, rightY + 8);
    const drawTableHeader = () => {
        doc.setFont('Signika-Bold'); doc.line(10, currentY - 4, 200, currentY - 4);
        doc.text('Date', 12, currentY); doc.text('Particulars', 35, currentY);
        doc.text('Vch Type', 95, currentY, { align: 'center' }); doc.text('Vch No.', 113, currentY, { align: 'center' });
        doc.text('Debit', 140, currentY, { align: 'right' }); doc.text('Credit', 165, currentY, { align: 'right' });
        doc.text('Balance', 190, currentY, { align: 'right' }); doc.line(10, currentY + 2, 200, currentY + 2); currentY += 5;
    };
    const drawFooter = (pageNum, totalPages, showFull) => {
        const fImgH = 40, fImgY = pageHeight - fImgH - 12;
        if (showFull) {
            if (shouldUseImage && footerImg) doc.addImage(footerImg, 'PNG', 0, fImgY, 260, fImgH);
            else if (footerImg1) doc.addImage(footerImg1, 'PNG', 0, fImgY, 210, fImgH);
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
        if (currentY + 10 > usableH) { doc.addPage(); currentY = 10; drawTableHeader(); doc.setFont('Signika-Regular'); }
        doc.text(item.DOC_DATE || '', 12, currentY + 1);
        doc.text(item.TRAN_TYPE || '', 95, currentY + 1, { align: 'center' });
        doc.text(String(item.DOC_NO || ''), 113, currentY + 1, { align: 'center' });
        doc.text(formatReadableAmount(item.debit || 0), 140, currentY + 1, { align: 'right' });
        doc.text(formatReadableAmount(item.credit || 0), 165, currentY + 1, { align: 'right' });
        doc.text(formatReadableAmount(Math.abs(item.Balance || 0)), 190, currentY + 1, { align: 'right' });
        doc.text(item.drcr || '', 191, currentY + 1);
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

const VOUCHER_TYPES = [
    ['All','All Transactions'],['CR','Cash Receipt'],['CP','Cash Payment'],
    ['BR','Bank Receipt'],['BP','Bank Payment'],['JV','Journal Voucher'],
    ['SB','Sale Bill'],['PS','Purchase'],['DN','Debit Note'],['CN','Credit Note'],
];

export default function GeneralLedgerPage() {
    const today = getTodayDate();
    const [fromDate,     setFromDate]     = useState(today);
    const [toDate,       setToDate]       = useState(today);
    const [transType,    setTransType]    = useState('All');
    const [activePreset, setActivePreset] = useState('Today');
    const [showFilter,   setShowFilter]   = useState(false);
    const [ledgerData,   setLedgerData]   = useState([]);
    const [showReport,   setShowReport]   = useState(false);
    const [pdfLoading,   setPdfLoading]   = useState(false);
    const [expanded,     setExpanded]     = useState(null);

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
            if (result) { setLedgerData(computeRunningBalance(result)); setShowReport(true); setShowFilter(false); }
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
            { label: 'This Week',  from: (() => { const d = new Date(); d.setDate(d.getDate()-d.getDay()); return fmt(d); })(), to: today },
            { label: 'This Month', from: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`; })(), to: today },
            { label: 'Last Month', from: (() => { const n = new Date(); return fmt(new Date(n.getFullYear(),n.getMonth()-1,1)); })(), to: (() => { const n = new Date(); return fmt(new Date(n.getFullYear(),n.getMonth(),0)); })() },
        ];
    }, [today]);

    const openingBal = filteredData[0]?.TRAN_TYPE === 'OP' ? parseFloat(filteredData[0]?.Balance || 0) : 0;
    const netBalance = totals.debit - totals.credit;

    return (
        <AppLayout title="Account Statement">
            <div className="px-4 pt-3 pb-10">

                {/* Section header */}
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="font-black text-base text-gray-900">Account Statement</p>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">{dmy(fromDate)} – {dmy(toDate)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowFilter(p => !p)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                            style={{ background: showFilter ? '#ef3837' : 'white', border: `1.5px solid ${showFilter ? '#ef3837' : '#e5e7eb'}`, color: showFilter ? 'white' : '#374151' }}>
                            <SlidersHorizontal size={13} /> Filter
                        </button>
                    </div>
                </div>

                {/* Collapsible filter */}
                <AnimatePresence initial={false}>
                    {showFilter && (
                        <motion.div key="gl-filter"
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }} className="overflow-hidden">
                            <div className="bg-white rounded-2xl p-4 mb-3.5 border border-gray-100 shadow-card-md">

                                {/* Presets */}
                                <div className="flex gap-2 mb-3.5 overflow-x-auto pb-0.5">
                                    {presets.map(p => (
                                        <button key={p.label}
                                            onClick={() => { setFromDate(p.from); setToDate(p.to); setActivePreset(p.label); }}
                                            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
                                            style={{ background: activePreset === p.label ? '#ef3837' : '#f3f4f6', color: activePreset === p.label ? 'white' : '#374151', border: `1.5px solid ${activePreset === p.label ? '#ef3837' : 'transparent'}`, boxShadow: activePreset === p.label ? '0 3px 10px rgba(239,56,55,0.25)' : 'none' }}>
                                            {p.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Date inputs */}
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    {[{ label: 'From', val: fromDate, set: setFromDate }, { label: 'To', val: toDate, set: setToDate }].map(f => (
                                        <div key={f.label}>
                                            <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">{f.label}</label>
                                            <input type="date" value={f.val}
                                                onChange={e => { f.set(e.target.value); setActivePreset('Custom'); }}
                                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-red-400 focus:bg-white transition-all" />
                                        </div>
                                    ))}
                                </div>

                                {/* Voucher type */}
                                <div className="mb-3">
                                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">Voucher Type</label>
                                    <select value={transType} onChange={e => setTransType(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-red-400 focus:bg-white transition-all">
                                        {VOUCHER_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </select>
                                </div>

                                <motion.button whileTap={{ scale: 0.97 }} onClick={handleFetch} disabled={isLoading}
                                    className="w-full py-3 rounded-2xl text-sm font-extrabold text-white transition-opacity"
                                    style={{ background: 'linear-gradient(135deg,#ef3837,#d92300)', opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                                    {isLoading ? 'Fetching…' : 'Get Ledger'}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Summary cards */}
                {showReport && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 gap-2.5 mb-3.5">
                        {[
                            { label: 'Opening Bal',  val: formatReadableAmount(openingBal),      color: '#6366f1', bg: '#f5f3ff', border: '#a5b4fc' },
                            { label: 'Total Debit',  val: formatReadableAmount(totals.debit),    color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
                            { label: 'Total Credit', val: formatReadableAmount(totals.credit),   color: '#D92300', bg: '#FFF1EE', border: '#fecaca' },
                            { label: 'Closing Net',  val: `${formatReadableAmount(Math.abs(netBalance))} ${netBalance >= 0 ? 'Dr' : 'Cr'}`, color: '#1e293b', bg: '#f8fafc', border: '#e2e8f0' },
                        ].map((s, i) => (
                            <div key={i} className="rounded-2xl p-3.5 border-l-[3px]" style={{ background: s.bg, borderLeftColor: s.color, border: `1px solid ${s.border}` }}>
                                <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
                                <p className="text-base font-black" style={{ color: '#1a1a2e' }}>{s.val}</p>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Print PDF button */}
                {showReport && filteredData.length > 0 && (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handlePrint} disabled={pdfLoading}
                        className="w-full mb-3.5 py-3.5 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2 transition-opacity"
                        style={{ background: '#1e293b', opacity: pdfLoading ? 0.7 : 1, cursor: pdfLoading ? 'not-allowed' : 'pointer' }}>
                        {pdfLoading ? (
                            <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Generating PDF…</>
                        ) : '🖨 Print Ledger PDF'}
                    </motion.button>
                )}

                {/* Transactions */}
                {isLoading ? (
                    <div className="flex flex-col gap-3">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
                                <div className="skeleton h-3.5 w-3/5 rounded-lg mb-2" />
                                <div className="skeleton h-2.5 w-2/5 rounded mb-3" />
                                <div className="flex gap-2">
                                    {[1,2,3].map(j => <div key={j} className="skeleton flex-1 h-10 rounded-xl" />)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : showReport && filteredData.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                        {filteredData.map((item, i) => {
                            const id = `txn-${i}`;
                            const isOpen = expanded === id;
                            const hasDebit  = parseFloat(item.debit  || 0) > 0;
                            const hasCredit = parseFloat(item.credit || 0) > 0;

                            return (
                                <motion.div key={i}
                                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(i * 0.015, 0.3) }}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">

                                    {/* Tap to expand */}
                                    <button onClick={() => setExpanded(isOpen ? null : id)} className="w-full text-left p-3.5">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1 min-w-0 pr-2">
                                                <p className="text-xs font-bold text-gray-900 leading-snug">{item.NARRATION || 'Opening Balance'}</p>
                                                <div className="flex gap-1.5 flex-wrap items-center mt-1">
                                                    {item.DOC_DATE && <span className="text-[10px] text-gray-400 font-semibold">{item.DOC_DATE}</span>}
                                                    {item.TRAN_TYPE && item.TRAN_TYPE !== 'OP' && (
                                                        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{item.TRAN_TYPE}</span>
                                                    )}
                                                    {item.DOC_NO && <span className="text-[10px] text-gray-400 font-semibold">#{item.DOC_NO}</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-lg"
                                                    style={{ color: item.drcr === 'Dr' ? '#d97706' : '#059669', background: item.drcr === 'Dr' ? '#fffbeb' : '#f0fdf4', border: `1px solid ${item.drcr === 'Dr' ? '#fde68a' : '#bbf7d0'}` }}>
                                                    {item.drcr}
                                                </span>
                                                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                                    <ChevronDown size={14} className="text-gray-400" />
                                                </motion.div>
                                            </div>
                                        </div>

                                        {/* Mini stats */}
                                        <div className="flex justify-between">
                                            {[
                                                { label: 'Debit',   val: hasDebit  ? formatReadableAmount(item.debit)  : '—', color: hasDebit  ? '#d97706' : '#9ca3af' },
                                                { label: 'Credit',  val: hasCredit ? formatReadableAmount(item.credit) : '—', color: hasCredit ? '#059669' : '#9ca3af' },
                                                { label: 'Balance', val: formatReadableAmount(Math.abs(item.Balance || 0)), color: '#111827' },
                                            ].map(f => (
                                                <div key={f.label} className="text-center flex-1">
                                                    <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5">{f.label}</p>
                                                    <p className="text-[11px] font-black" style={{ color: f.color }}>{f.val}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </button>

                                    {/* Expanded — full detail row */}
                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div key="exp"
                                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: 'easeInOut' }}
                                                className="overflow-hidden">
                                                <div className="border-t border-gray-50 px-3.5 pt-3 pb-3.5">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {[
                                                            { label: 'Transaction Type', value: item.TRAN_TYPE || '—' },
                                                            { label: 'Voucher No',       value: item.DOC_NO ? `#${item.DOC_NO}` : '—' },
                                                            { label: 'Date',             value: item.DOC_DATE || '—' },
                                                            { label: 'Running Balance',  value: `${formatReadableAmount(Math.abs(item.Balance || 0))} ${item.drcr || ''}`, color: item.drcr === 'Dr' ? '#d97706' : '#059669' },
                                                        ].map(({ label, value, color }) => (
                                                            <div key={label} className="bg-gray-50 rounded-xl px-3 py-2">
                                                                <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                                                                <p className="text-xs font-bold" style={{ color: color || '#374151' }}>{value}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {item.NARRATION && item.NARRATION !== 'Opening balance' && (
                                                        <div className="mt-2 bg-gray-50 rounded-xl px-3 py-2">
                                                            <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5">Narration</p>
                                                            <p className="text-xs font-medium text-gray-700 leading-snug">{item.NARRATION}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}

                        {/* Totals footer */}
                        <div className="rounded-2xl p-4 flex justify-between" style={{ background: '#1e293b' }}>
                            {[
                                { label: 'Total Debit',  val: formatReadableAmount(totals.debit),  color: '#fbbf24' },
                                { label: 'Total Credit', val: formatReadableAmount(totals.credit), color: '#86efac' },
                                { label: 'Net Balance',  val: `${formatReadableAmount(Math.abs(netBalance))} ${netBalance >= 0 ? 'Dr' : 'Cr'}`, color: 'white' },
                            ].map(f => (
                                <div key={f.label} className="text-center flex-1">
                                    <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider mb-0.5">{f.label}</p>
                                    <p className="text-sm font-black" style={{ color: f.color }}>{f.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : showReport ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="text-5xl mb-3">📒</div>
                        <p className="font-black text-gray-700 text-base mb-1.5">No transactions found</p>
                        <p className="text-gray-400 text-sm">Try changing the date range or voucher type.</p>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="text-5xl mb-3">📊</div>
                        <p className="font-black text-gray-700 text-base mb-1.5">Account Statement</p>
                        <p className="text-gray-400 text-sm">Open the filter and tap "Get Ledger" to load transactions.</p>
                    </motion.div>
                )}
            </div>
        </AppLayout>
    );
}
