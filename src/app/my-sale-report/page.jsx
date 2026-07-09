'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useGetTodaysSalesQuery } from '../../services/todaysSaleApi';

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const todayYmd = ymd(new Date());

function fmtDate(s) {
    if (!s) return '—';
    const d = new Date(s);
    if (isNaN(d)) return s.slice(0, 10);
    return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
}
function dmy(s) {
    if (!s) return '—';
    const [y,m,d] = s.split('-');
    return `${d}-${m}-${y}`;
}
function fmtAmt(n) {
    return (parseFloat(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

const QUICK = [
    { label: 'Today',      get: () => ({ from: todayYmd, to: todayYmd }) },
    { label: 'This Week',  get: () => { const d = new Date(); d.setDate(d.getDate()-d.getDay()); return { from: ymd(d), to: todayYmd }; } },
    { label: 'This Month', get: () => { const n = new Date(); return { from: ymd(new Date(n.getFullYear(),n.getMonth(),1)), to: todayYmd }; } },
    { label: 'Last Month', get: () => { const n = new Date(); return { from: ymd(new Date(n.getFullYear(),n.getMonth()-1,1)), to: ymd(new Date(n.getFullYear(),n.getMonth(),0)) }; } },
];

export default function MySaleReportPage() {
    const def = QUICK[0].get();
    const [fromDate, setFromDate] = useState(def.from);
    const [toDate, setToDate] = useState(def.to);
    const [applied, setApplied] = useState({ from_date: def.from, to_date: def.to });
    const [activeQ, setActiveQ] = useState('Today');
    const [showFilter, setShowFilter] = useState(false);
    const [expandedTender, setExpandedTender] = useState(null);
    const [search, setSearch] = useState('');

    const { data: saleData = [], isLoading, isFetching } = useGetTodaysSalesQuery({
        from_date: applied.from_date,
        to_date: applied.to_date,
    });

    const tenderGroups = useMemo(() => {
        const map = new Map();
        saleData.forEach(row => {
            const key = row.Tender_No || '__unknown__';
            if (!map.has(key)) {
                map.set(key, {
                    tenderNo: row.Tender_No,
                    tenderDate: row.Tender_Date,
                    millName: row.Ac_Name_E,
                    grade: row.Grade,
                    season: row.season,
                    tenderQty: row.Quantal,
                    rows: [],
                });
            }
            map.get(key).rows.push(row);
        });
        return Array.from(map.values());
    }, [saleData]);

    const filteredGroups = useMemo(() => {
        if (!search) return tenderGroups;
        const q = search.toLowerCase();
        return tenderGroups.filter(g =>
            (g.millName || '').toLowerCase().includes(q) ||
            (g.grade || '').toLowerCase().includes(q) ||
            String(g.tenderNo || '').includes(q)
        );
    }, [tenderGroups, search]);

    const totalBuyerQty = saleData.reduce((s, r) => s + parseFloat(r.Buyer_Quantal || 0), 0);
    const totalAmt = saleData.reduce((s, r) => s + parseFloat(r.Buyer_Quantal || 0) * parseFloat(r.Sale_Rate || 0), 0);

    const inputStyle = {
        padding: '10px 12px', background: '#f9fafb', border: '1.5px solid #e5e7eb',
        borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#111827',
        outline: 'none', fontFamily: 'Signika, sans-serif', width: '100%', boxSizing: 'border-box',
    };

    return (
        <AppLayout title="My Sale Report" showBack>
            <div style={{ padding: '12px 16px 32px', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>

                {/* Section header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#111827' }}>My Sale Report</h2>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>
                            {activeQ ? `${activeQ} · ${dmy(applied.from_date)}${applied.from_date !== applied.to_date ? ` – ${dmy(applied.to_date)}` : ''}` : `${dmy(applied.from_date)} – ${dmy(applied.to_date)}`}
                            {!isLoading && filteredGroups.length > 0 && ` · ${filteredGroups.length} tender${filteredGroups.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                    <button onClick={() => setShowFilter(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: showFilter ? '#2563eb' : 'white', border: `1.5px solid ${showFilter ? '#2563eb' : '#e5e7eb'}`, color: showFilter ? 'white' : '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent' }}>
                        <SlidersHorizontal size={14} strokeWidth={2.5} /> Filter
                    </button>
                </div>

                {/* Filter card */}
                <AnimatePresence>
                    {showFilter && (
                        <motion.div key="filter" initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 16 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
                            <div style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', gap: 7, marginBottom: 14, flexWrap: 'wrap' }}>
                                    {QUICK.map(q => (
                                        <button key={q.label} onClick={() => { const r=q.get(); setFromDate(r.from); setToDate(r.to); setApplied({from_date:r.from,to_date:r.to}); setActiveQ(q.label); }} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: `1.5px solid ${activeQ===q.label?'#2563eb':'#e5e7eb'}`, background: activeQ===q.label?'#2563eb':'#f9fafb', color: activeQ===q.label?'white':'#6b7280', cursor: 'pointer', fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent', boxShadow: activeQ===q.label?'0 3px 10px rgba(37,99,235,0.25)':'none' }}>
                                            {q.label}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                                    {[{label:'From',val:fromDate,set:setFromDate},{label:'To',val:toDate,set:setToDate}].map(f=>(
                                        <div key={f.label}>
                                            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{f.label}</label>
                                            <input type="date" value={f.val} onChange={e=>{f.set(e.target.value);setActiveQ(null);}} style={inputStyle} onFocus={e=>{e.target.style.borderColor='#2563eb';e.target.style.background='white';}} onBlur={e=>{e.target.style.borderColor='#e5e7eb';e.target.style.background='#f9fafb';}} />
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Search Mill / Grade</label>
                                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by mill, grade or tender #…" style={inputStyle} onFocus={e=>{e.target.style.borderColor='#2563eb';e.target.style.background='white';}} onBlur={e=>{e.target.style.borderColor='#e5e7eb';e.target.style.background='#f9fafb';}} />
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setApplied({ from_date: fromDate, to_date: toDate }); setShowFilter(false); }} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', border: 'none', fontSize: 13, fontWeight: 800, color: 'white', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(37,99,235,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        {isFetching ? <><div style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.7s linear infinite' }} />Loading…</> : 'Apply Filter'}
                                    </motion.button>
                                    <button onClick={() => { const r=QUICK[0].get(); setFromDate(r.from); setToDate(r.to); setApplied({from_date:r.from,to_date:r.to}); setActiveQ('Today'); setSearch(''); }} style={{ width:44,height:44,borderRadius:12,flexShrink:0,background:'#f5f5f5',border:'1.5px solid #e5e7eb',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',WebkitTapHighlightColor:'transparent' }}>
                                        <RotateCcw size={15} color="#6b7280" strokeWidth={2.2} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Summary banner */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', borderRadius: 18, padding: '16px 18px', marginBottom: 16, boxShadow: '0 6px 20px rgba(37,99,235,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700 }}>MY SALE REPORT</p>
                            <p style={{ color: 'white', fontSize: 20, fontWeight: 900 }}>{fmtAmt(totalBuyerQty)} Qtl</p>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 500 }}>
                                {filteredGroups.length} tender{filteredGroups.length !== 1 ? 's' : ''} · ₹{fmtAmt(totalAmt)}
                            </p>
                        </div>
                        <span style={{ fontSize: 32 }}>📈</span>
                    </div>
                </motion.div>

                {/* Search standalone */}
                <div style={{ position: 'relative', marginBottom: 14 }}>
                    <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by mill, grade or tender #…"
                        style={{ ...inputStyle, paddingLeft: 34 }}
                        onFocus={e=>{e.target.style.borderColor='#2563eb';e.target.style.background='white';}} onBlur={e=>{e.target.style.borderColor='#e5e7eb';e.target.style.background='#f9fafb';}} />
                </div>

                {/* Export/Print buttons */}
                {!isLoading && saleData.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
                        <button onClick={() => {
                            const csv = ['Tender#,Mill Name,Grade,Season,Sauda Date,Lifting Date,Qty (qtl),Rate (₹),Amount (₹)',
                                ...saleData.map(r => [r.Tender_No, `"${(r.Ac_Name_E || '').replace(/"/g, '""')}"`, r.Grade || '', r.season || '', r.Sauda_Date || '', r.Lifting_Date || '', parseFloat(r.Buyer_Quantal || 0).toFixed(2), parseFloat(r.Sale_Rate || 0).toFixed(2), (parseFloat(r.Buyer_Quantal || 0) * parseFloat(r.Sale_Rate || 0)).toFixed(2)].join(','))
                            ].join('\n');
                            const a = document.createElement('a');
                            a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                            a.download = `my-sale-report-${applied.from_date}-${applied.to_date}.csv`;
                            a.click();
                        }} style={{ padding: '7px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#059669', cursor: 'pointer', fontFamily: 'inherit' }}>
                            ⬇ CSV
                        </button>
                        <button onClick={() => window.print()} style={{ padding: '7px 12px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#4338ca', cursor: 'pointer', fontFamily: 'inherit' }}>
                            🖨 Print
                        </button>
                    </div>
                )}

                {/* Groups */}
                {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ background: 'white', borderRadius: 14, padding: 14, border: '1px solid #f3f4f6' }}>
                                <div className="skeleton" style={{ height: 18, width: '65%', marginBottom: 8 }} />
                                <div className="skeleton" style={{ height: 12, width: '45%', marginBottom: 10 }} />
                                <div className="skeleton" style={{ height: 12, width: '80%' }} />
                            </div>
                        ))}
                    </div>
                ) : filteredGroups.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '56px 20px', background: 'white', borderRadius: 16, border: '1.5px dashed #e5e7eb' }}>
                        <div style={{ fontSize: 48, marginBottom: 10 }}>📈</div>
                        <p style={{ fontWeight: 800, color: '#374151', fontSize: 15, marginBottom: 4 }}>No sale records found</p>
                        <p style={{ color: '#9ca3af', fontSize: 13 }}>Try a different date range or check back later.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {filteredGroups.map((grp, i) => {
                            const totalQty = grp.rows.reduce((s, r) => s + parseFloat(r.Buyer_Quantal || 0), 0);
                            const isOpen = expandedTender === (grp.tenderNo || i);
                            return (
                                <motion.div key={grp.tenderNo || i}
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(i * 0.05, 0.4) }}
                                    style={{ background: 'white', borderRadius: 14, border: '1px solid #f3f4f6', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

                                    {/* Tender header */}
                                    <button
                                        onClick={() => setExpandedTender(isOpen ? null : (grp.tenderNo || i))}
                                        style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isOpen ? '1px solid #f3f4f6' : 'none' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 800 }}>
                                                    #{grp.tenderNo || '—'}
                                                </span>
                                                <span style={{ fontWeight: 800, fontSize: 13, color: '#111827' }}>{grp.millName || 'Mill'}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {[grp.grade, grp.season].filter(Boolean).map((t, j) => (
                                                    <span key={j} style={{ fontSize: 10, fontWeight: 700, background: '#f3f4f6', color: '#6b7280', padding: '2px 7px', borderRadius: 5 }}>{t}</span>
                                                ))}
                                                <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>{fmtDate(grp.tenderDate)}</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                                            <p style={{ fontSize: 14, fontWeight: 900, color: '#059669' }}>{fmtAmt(totalQty)}</p>
                                            <p style={{ fontSize: 9, color: '#9ca3af', fontWeight: 600 }}>Qtl · {grp.rows.length} records</p>
                                            <p style={{ fontSize: 16, marginTop: 2 }}>{isOpen ? '▲' : '▼'}</p>
                                        </div>
                                    </button>

                                    {/* Expanded rows */}
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                                                style={{ overflow: 'hidden' }}>
                                                {grp.rows.map((row, ri) => (
                                                    <div key={ri} style={{ padding: '11px 16px', borderBottom: ri < grp.rows.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                            <div>
                                                                <p style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Sauda: {fmtDate(row.Sauda_Date)}</p>
                                                                {row.Sauda_Time && <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>{String(row.Sauda_Time).substring(0, 5)}</p>}
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <p style={{ fontSize: 13, fontWeight: 900, color: '#059669' }}>
                                                                    {fmtAmt(row.Buyer_Quantal)} <span style={{ fontSize: 10, color: '#9ca3af' }}>Qtl</span>
                                                                </p>
                                                                {row.Sale_Rate && <p style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>₹{parseFloat(row.Sale_Rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}/qtl</p>}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                            <span style={{ fontSize: 10, color: '#6b7280' }}>Lifting: {fmtDate(row.Lifting_Date)}</span>
                                                            {row.tenderdetailid && <span style={{ fontSize: 10, color: '#9ca3af' }}>Order #{row.tenderdetailid}</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                                <div style={{ background: '#f0fdf4', borderTop: '2px dashed #6ee7b7', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: 12, fontWeight: 800, color: '#374151' }}>Total Buyer Qty</span>
                                                    <span style={{ fontSize: 14, fontWeight: 900, color: '#059669' }}>{fmtAmt(totalQty)} Qtl</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
            {/* Print-only view */}
            {saleData.length > 0 && (
                <div className="print-only" style={{ display: 'none' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: 6 }}>My Sale Report</h2>
                    <p style={{ textAlign: 'center', fontSize: 12, marginBottom: 12 }}>{fmtDate(applied.from_date)} to {fmtDate(applied.to_date)} · {saleData.length} records · {fmtAmt(totalBuyerQty)} Qtl · ₹{fmtAmt(totalAmt)}</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                        <thead>
                            <tr style={{ background: '#2563eb', color: 'white' }}>
                                {['Tender#', 'Mill Name', 'Grade', 'Season', 'Sauda Date', 'Lifting Date', 'Qty (Qtl)', 'Rate (₹)', 'Amount (₹)'].map(h => (
                                    <th key={h} style={{ padding: '5px 7px', border: '1px solid #ccc', textAlign: 'left' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {saleData.map((r, i) => (
                                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#eff6ff' }}>
                                    <td style={{ padding: '4px 7px', border: '1px solid #e5e7eb' }}>{r.Tender_No}</td>
                                    <td style={{ padding: '4px 7px', border: '1px solid #e5e7eb' }}>{r.Ac_Name_E}</td>
                                    <td style={{ padding: '4px 7px', border: '1px solid #e5e7eb' }}>{r.Grade}</td>
                                    <td style={{ padding: '4px 7px', border: '1px solid #e5e7eb' }}>{r.season}</td>
                                    <td style={{ padding: '4px 7px', border: '1px solid #e5e7eb' }}>{r.Sauda_Date ? fmtDate(r.Sauda_Date) : ''}</td>
                                    <td style={{ padding: '4px 7px', border: '1px solid #e5e7eb' }}>{r.Lifting_Date ? fmtDate(r.Lifting_Date) : ''}</td>
                                    <td style={{ padding: '4px 7px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{parseFloat(r.Buyer_Quantal || 0).toFixed(2)}</td>
                                    <td style={{ padding: '4px 7px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{parseFloat(r.Sale_Rate || 0).toFixed(2)}</td>
                                    <td style={{ padding: '4px 7px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{(parseFloat(r.Buyer_Quantal || 0) * parseFloat(r.Sale_Rate || 0)).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: '#dbeafe', fontWeight: 700 }}>
                                <td colSpan={6} style={{ padding: '5px 7px', border: '1px solid #e5e7eb', textAlign: 'right' }}>Total:</td>
                                <td style={{ padding: '5px 7px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{fmtAmt(totalBuyerQty)}</td>
                                <td style={{ padding: '5px 7px', border: '1px solid #e5e7eb' }} />
                                <td style={{ padding: '5px 7px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{fmtAmt(totalAmt)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .skeleton { background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
                @keyframes shimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }
                @media print {
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    body * { visibility: hidden !important; }
                    .print-only, .print-only * { visibility: visible !important; }
                    .print-only { position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; background: white !important; z-index: 9999 !important; }
                }
            `}</style>
        </AppLayout>
    );
}
