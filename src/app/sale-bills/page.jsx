'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';
import { useGetCustomerSaleBillsQuery } from '../../services/customerSaleBillsApi';
import SaleBillPrint from '../../components/print/SaleBillPrint';

const today = new Date().toISOString().split('T')[0];
const firstOfMonth = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; })();

const QUICK = [
    { label: 'Today', f: today, t: today },
    { label: 'This Month', f: firstOfMonth, t: today },
];

function fmtDate(s) {
    if (!s) return '—';
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
}
function fmtAmt(n) {
    const v = parseFloat(n) || 0;
    return v.toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

export default function SaleBillsPage() {
    const [fromDate, setFromDate] = useState(firstOfMonth);
    const [toDate, setToDate] = useState(today);
    const [applied, setApplied] = useState({ from: firstOfMonth, to: today });
    const [activeQ, setActiveQ] = useState('This Month');
    const { data: bills = [], isLoading, refetch } = useGetCustomerSaleBillsQuery({
        from_date: applied.from,
        to_date: applied.to,
    });

    const totalAmt = bills.reduce((s, b) => s + (parseFloat(b.sale_rate || 0) * parseFloat(b.doqntl || 0)), 0);

    const inputStyle = { padding: '11px 12px', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#111827', outline: 'none', fontFamily: 'inherit', width: '100%' };

    return (
        <AppLayout title="Customer Sale Bills" showBack>
            <div style={{ padding: '12px 16px 32px', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>

                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'linear-gradient(135deg,#059669,#047857)', borderRadius: 18, padding: '16px 18px', marginBottom: 18, boxShadow: '0 6px 20px rgba(5,150,105,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700 }}>TOTAL BILLED</p>
                            <p style={{ color: 'white', fontSize: 20, fontWeight: 900 }}>₹{fmtAmt(totalAmt)}</p>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 500 }}>{bills.length} bill{bills.length !== 1 ? 's' : ''} · {fmtDate(applied.from)} – {fmtDate(applied.to)}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                            <span style={{ fontSize: 28 }}>🧾</span>
                            {bills.length > 0 && (
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => {
                                        const csv = ['Bill Date,Mill Name,Bill To,Grade,Qty (qtl),Rate,Amount,Truck No',
                                            ...bills.map(b => [b.doc_date, `"${(b.Mill_Name || b.millname || '').replace(/"/g, '""')}"`, `"${(b.billto || '').replace(/"/g, '""')}"`, b.Grade || '', parseFloat(b.doqntl || 0).toFixed(2), parseFloat(b.sale_rate || 0).toFixed(2), (parseFloat(b.sale_rate || 0) * parseFloat(b.doqntl || 0)).toFixed(2), b.truck_no || ''].join(','))
                                        ].join('\n');
                                        const a = document.createElement('a');
                                        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                                        a.download = `sale-bills-${applied.from}-${applied.to}.csv`;
                                        a.click();
                                    }} style={{ padding: '5px 10px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, fontSize: 11, fontWeight: 700, color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
                                        ⬇ CSV
                                    </button>
                                    <button onClick={() => window.print()} style={{ padding: '5px 10px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, fontSize: 11, fontWeight: 700, color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
                                        🖨 Print All
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Quick presets */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    {QUICK.map(q => (
                        <button key={q.label} onClick={() => { setFromDate(q.f); setToDate(q.t); setApplied({ from: q.f, to: q.t }); setActiveQ(q.label); }}
                            style={{ padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${activeQ === q.label ? '#059669' : '#e5e7eb'}`, background: activeQ === q.label ? '#f0fdf4' : 'white', color: activeQ === q.label ? '#047857' : '#6b7280', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {q.label}
                        </button>
                    ))}
                </div>

                {/* Filter */}
                <div style={{ background: 'white', borderRadius: 16, padding: '14px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginBottom: 16, border: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>From</label>
                            <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setActiveQ(null); }} style={inputStyle} onFocus={e => { e.target.style.borderColor = '#059669'; e.target.style.background = 'white'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>To</label>
                            <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setActiveQ(null); }} style={inputStyle} onFocus={e => { e.target.style.borderColor = '#059669'; e.target.style.background = 'white'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }} />
                        </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setApplied({ from: fromDate, to: toDate })}
                        style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg,#059669,#047857)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Apply Filter
                    </motion.button>
                </div>

                {/* Bills list */}
                {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ background: 'white', borderRadius: 14, padding: '14px', border: '1px solid #f3f4f6' }}>
                                <div className="skeleton" style={{ height: 16, width: '50%', marginBottom: 8 }} />
                                <div className="skeleton" style={{ height: 12, width: '70%', marginBottom: 8 }} />
                                <div className="skeleton" style={{ height: 20, width: '35%' }} />
                            </div>
                        ))}
                    </div>
                ) : bills.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '56px 20px', background: 'white', borderRadius: 18, border: '1.5px dashed #e5e7eb' }}>
                        <div style={{ fontSize: 44, marginBottom: 12 }}>🧾</div>
                        <p style={{ fontWeight: 700, color: '#374151', marginBottom: 4 }}>No sale bills found</p>
                        <p style={{ color: '#9ca3af', fontSize: 13 }}>No bills for the selected date range.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {bills.map((bill, i) => (
                            <motion.div key={bill.saleid || i}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.4) }}
                                style={{ background: 'white', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <div>
                                        <p style={{ fontWeight: 800, fontSize: 14, color: '#111827', marginBottom: 3 }}>
                                            {bill.Mill_Name || bill.millname || 'Mill'}
                                        </p>
                                        <p style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>
                                            {fmtDate(bill.doc_date)} · {bill.billto || ''}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                        <p style={{ fontWeight: 900, fontSize: 16, color: '#059669' }}>
                                            ₹{fmtAmt(parseFloat(bill.sale_rate || 0) * parseFloat(bill.doqntl || 0))}
                                        </p>
                                        <SaleBillPrint saleid={bill.saleid} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                                    {[
                                        { label: 'Grade', value: bill.Grade || '—' },
                                        { label: 'Qty', value: `${parseFloat(bill.doqntl || 0).toFixed(2)} qtl` },
                                        { label: 'Rate', value: `₹${parseFloat(bill.sale_rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                                    ].map(({ label, value }) => (
                                        <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: '6px 8px' }}>
                                            <p style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>{label}</p>
                                            <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
                                        </div>
                                    ))}
                                </div>
                                {bill.truck_no && (
                                    <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginTop: 8 }}>🚛 {bill.truck_no}</p>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            {/* Print-only view (all bills table) */}
            {bills.length > 0 && (
                <div className="print-only" style={{ display: 'none', fontFamily: 'Signika, sans-serif', padding: 20 }}>
                    <h2 style={{ textAlign: 'center', marginBottom: 6 }}>Sale Bills</h2>
                    <p style={{ textAlign: 'center', fontSize: 12, marginBottom: 12 }}>{fmtDate(applied.from)} to {fmtDate(applied.to)} · {bills.length} bills · Total ₹{fmtAmt(totalAmt)}</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                            <tr style={{ background: '#059669', color: 'white' }}>
                                {['Date', 'Mill Name', 'Bill To', 'Grade', 'Qty (qtl)', 'Rate (₹)', 'Amount (₹)', 'Truck'].map(h => (
                                    <th key={h} style={{ padding: '6px 8px', border: '1px solid #ccc', textAlign: 'left' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {bills.map((b, i) => (
                                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f0fdf4' }}>
                                    <td style={{ padding: '5px 8px', border: '1px solid #e5e7eb' }}>{fmtDate(b.doc_date)}</td>
                                    <td style={{ padding: '5px 8px', border: '1px solid #e5e7eb' }}>{b.Mill_Name || b.millname}</td>
                                    <td style={{ padding: '5px 8px', border: '1px solid #e5e7eb' }}>{b.billto}</td>
                                    <td style={{ padding: '5px 8px', border: '1px solid #e5e7eb' }}>{b.Grade}</td>
                                    <td style={{ padding: '5px 8px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{parseFloat(b.doqntl || 0).toFixed(2)}</td>
                                    <td style={{ padding: '5px 8px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{parseFloat(b.sale_rate || 0).toFixed(2)}</td>
                                    <td style={{ padding: '5px 8px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{(parseFloat(b.sale_rate || 0) * parseFloat(b.doqntl || 0)).toFixed(2)}</td>
                                    <td style={{ padding: '5px 8px', border: '1px solid #e5e7eb' }}>{b.truck_no}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: '#ecfdf5', fontWeight: 700 }}>
                                <td colSpan={6} style={{ padding: '6px 8px', border: '1px solid #e5e7eb', textAlign: 'right' }}>Total:</td>
                                <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{fmtAmt(totalAmt)}</td>
                                <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }} />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
            <style>{`
                @media print {
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    body * { visibility: hidden !important; }
                    .print-only, .print-only * { visibility: visible !important; }
                    .print-only { position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; background: white !important; z-index: 9999 !important; }
                }
            `}</style>
            </div>
        </AppLayout>
    );
}
