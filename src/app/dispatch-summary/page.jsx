'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';
import { useGetDispatchSummaryQuery } from '../../services/dispatchSummaryApi';

const today = new Date().toISOString().split('T')[0];
const firstOfMonth = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; })();

function fmtDate(s) {
    if (!s) return '—';
    const dt = new Date(s);
    if (isNaN(dt)) return s;
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}
function fmtAmt(n) {
    const v = parseFloat(n) || 0;
    return v.toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

export default function DispatchSummaryPage() {
    const [fromDate, setFromDate] = useState(firstOfMonth);
    const [toDate, setToDate] = useState(today);
    const [search, setSearch] = useState('');
    const [activeQ, setActiveQ] = useState('This Month');

    const { data: allData = [], isLoading } = useGetDispatchSummaryQuery();

    const filtered = useMemo(() => {
        return allData.filter(item => {
            const dt = new Date(item.doc_date);
            const from = new Date(fromDate); from.setHours(0, 0, 0, 0);
            const to = new Date(toDate); to.setHours(23, 59, 59, 999);
            const inRange = dt >= from && dt <= to;
            const matchSearch = !search || (item.millname || '').toLowerCase().includes(search.toLowerCase()) || (item.Grade || '').toLowerCase().includes(search.toLowerCase());
            return inRange && matchSearch;
        });
    }, [allData, fromDate, toDate, search]);

    const grandTotal = filtered.reduce((s, i) => s + parseFloat(i.Buyer_Quantal || 0), 0);

    const grouped = useMemo(() => {
        const g = {};
        filtered.forEach(item => {
            const mill = item.millname || 'Unknown Mill';
            if (!g[mill]) g[mill] = { items: [], total: 0 };
            g[mill].items.push(item);
            g[mill].total += parseFloat(item.Buyer_Quantal || 0);
        });
        return g;
    }, [filtered]);

    const QUICK = [
        { label: 'Today', f: today, t: today },
        { label: 'This Month', f: firstOfMonth, t: today },
    ];

    const inputStyle = { padding: '11px 12px', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#111827', outline: 'none', fontFamily: 'inherit', width: '100%' };

    return (
        <AppLayout title="Dispatch Summary" showBack>
            <div style={{ padding: '12px 16px 32px', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>

                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: 18, padding: '16px 18px', marginBottom: 18, boxShadow: '0 6px 20px rgba(245,158,11,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 700 }}>TOTAL DISPATCHED</p>
                            <p style={{ color: 'white', fontSize: 20, fontWeight: 900 }}>{grandTotal.toFixed(2)} Qtl</p>
                            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 500 }}>{filtered.length} dispatch{filtered.length !== 1 ? 'es' : ''}</p>
                        </div>
                        <span style={{ fontSize: 32 }}>🚚</span>
                    </div>
                </motion.div>

                {/* Quick presets */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    {QUICK.map(q => (
                        <button key={q.label} onClick={() => { setFromDate(q.f); setToDate(q.t); setActiveQ(q.label); }}
                            style={{ padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${activeQ === q.label ? '#f59e0b' : '#e5e7eb'}`, background: activeQ === q.label ? '#fffbeb' : 'white', color: activeQ === q.label ? '#b45309' : '#6b7280', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {q.label}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div style={{ background: 'white', borderRadius: 16, padding: '14px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginBottom: 16, border: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>From</label>
                            <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setActiveQ(null); }} style={inputStyle} onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.background = 'white'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>To</label>
                            <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setActiveQ(null); }} style={inputStyle} onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.background = 'white'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }} />
                        </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by mill or grade..." style={{ ...inputStyle, paddingLeft: 36 }} />
                    </div>
                </div>

                {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[1, 2].map(i => (
                            <div key={i} style={{ background: 'white', borderRadius: 16, padding: 16, border: '1px solid #f3f4f6' }}>
                                <div className="skeleton" style={{ height: 18, width: '60%', marginBottom: 12 }} />
                                {[1, 2, 3].map(j => <div key={j} className="skeleton" style={{ height: 12, width: '90%', marginBottom: 8 }} />)}
                            </div>
                        ))}
                    </div>
                ) : Object.keys(grouped).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '56px 20px', background: 'white', borderRadius: 18, border: '1.5px dashed #e5e7eb' }}>
                        <div style={{ fontSize: 44, marginBottom: 12 }}>🚚</div>
                        <p style={{ fontWeight: 700, color: '#374151', marginBottom: 4 }}>No dispatches found</p>
                        <p style={{ color: '#9ca3af', fontSize: 13 }}>No dispatch records for the selected filters.</p>
                    </div>
                ) : (
                    Object.entries(grouped).map(([mill, group], mi) => (
                        <motion.div key={mill} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: mi * 0.07 }}
                            style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6', marginBottom: 14 }}>
                            {/* Mill header */}
                            <div style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fde68a' }}>
                                <div>
                                    <p style={{ fontWeight: 800, fontSize: 14, color: '#92400e' }}>{mill}</p>
                                    <p style={{ fontSize: 11, color: '#b45309', fontWeight: 600 }}>{group.items.length} dispatch{group.items.length !== 1 ? 'es' : ''}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: 10, color: '#b45309', fontWeight: 700 }}>TOTAL</p>
                                    <p style={{ fontWeight: 900, fontSize: 16, color: '#92400e' }}>{group.total.toFixed(2)} Qtl</p>
                                </div>
                            </div>
                            {/* Rows */}
                            {group.items.map((item, ii) => (
                                <div key={ii} style={{ padding: '12px 16px', borderBottom: ii < group.items.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>{fmtDate(item.doc_date)}</span>
                                                {item.Grade && <span style={{ fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: 4 }}>{item.Grade}</span>}
                                                {item.Packing && <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>{item.Packing}</span>}
                                            </div>
                                            <p style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{item.billto || item.saudaname || '—'}</p>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                                            <p style={{ fontWeight: 800, fontSize: 14, color: '#111827' }}>{parseFloat(item.Buyer_Quantal || 0).toFixed(2)} Qtl</p>
                                            {item.sale_rate && <p style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>₹{item.sale_rate}/qtl</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ))
                )}
            </div>
        </AppLayout>
    );
}
