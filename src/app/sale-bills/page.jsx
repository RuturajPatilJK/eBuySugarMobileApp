'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, RotateCcw, Search, X, ChevronDown } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useGetCustomerSaleBillsQuery } from '../../services/customerSaleBillsApi';
import SaleBillPrint from '../../components/print/SaleBillPrint';

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayYmd = ymd(new Date());

function dmy(s) {
    if (!s) return '—';
    const [y, m, d] = s.split('-');
    return `${d}-${m}-${y}`;
}
function parseLocal(s) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
}
function fmtAmt(n) {
    return (parseFloat(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

const QUICK = [
    { label: 'Today',      get: () => ({ from: todayYmd, to: todayYmd }) },
    { label: 'This Week',  get: () => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return { from: ymd(d), to: todayYmd }; } },
    { label: 'This Month', get: () => { const n = new Date(); return { from: ymd(new Date(n.getFullYear(), n.getMonth(), 1)), to: todayYmd }; } },
    { label: 'Last Month', get: () => { const n = new Date(); return { from: ymd(new Date(n.getFullYear(), n.getMonth() - 1, 1)), to: ymd(new Date(n.getFullYear(), n.getMonth(), 0)) }; } },
];

function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-card">
            <div className="flex justify-between mb-3">
                <div className="skeleton h-4 w-2/5 rounded-lg" />
                <div className="skeleton h-5 w-16 rounded-lg" />
            </div>
            <div className="skeleton h-3 w-1/3 rounded mb-3" />
            <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(j => <div key={j} className="skeleton h-10 rounded-xl" />)}
            </div>
        </div>
    );
}

export default function SaleBillsPage() {
    const defaultRange = QUICK[0].get();

    const [fromDate,   setFromDate]   = useState(defaultRange.from);
    const [toDate,     setToDate]     = useState(defaultRange.to);
    const [applied,    setApplied]    = useState({ from: defaultRange.from, to: defaultRange.to });
    const [activeQ,    setActiveQ]    = useState('Today');
    const [millSearch, setMillSearch] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [expanded,   setExpanded]   = useState(null);

    const { data: allBills = [], isLoading } = useGetCustomerSaleBillsQuery();

    const filtered = useMemo(() => {
        const from = parseLocal(applied.from);
        const to   = parseLocal(applied.to);
        to.setHours(23, 59, 59, 999);
        return allBills.filter(b => {
            const docDate = b.doc_date ? new Date(b.doc_date) : null;
            if (!docDate || docDate < from || docDate > to) return false;
            if (!millSearch.trim()) return true;
            const q = millSearch.toLowerCase().trim();
            return (b.Mill_Name || b.millname || '').toLowerCase().includes(q)
                || (b.billto || '').toLowerCase().includes(q);
        });
    }, [allBills, applied, millSearch]);

    const applyPreset = (q) => {
        const r = q.get();
        setFromDate(r.from); setToDate(r.to);
        setApplied({ from: r.from, to: r.to });
        setActiveQ(q.label);
    };

    const applyFilter = () => { setApplied({ from: fromDate, to: toDate }); setShowFilter(false); };
    const resetFilter = () => {
        const r = QUICK[0].get();
        setFromDate(r.from); setToDate(r.to); setApplied(r); setActiveQ('Today'); setMillSearch('');
    };

    return (
        <AppLayout title="Sale Bills" showBack>
            <div className="px-4 pt-3 pb-10">

                {/* Search bar — always visible */}
                <div className="relative mb-3">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} strokeWidth={2.5} />
                    <input
                        value={millSearch}
                        onChange={e => setMillSearch(e.target.value)}
                        placeholder="Search mill or party name…"
                        className="w-full pl-10 pr-9 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none shadow-card transition-all focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />
                    {millSearch && (
                        <button onClick={() => setMillSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                            <X size={11} className="text-gray-500" />
                        </button>
                    )}
                </div>

                {/* Section header */}
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-base font-black text-gray-900 leading-tight">Customer Sale Bills</h2>
                        <p className="text-xs text-gray-400 mt-0.5 font-medium">
                            {activeQ ? `${activeQ} · ${dmy(applied.from)}${applied.from !== applied.to ? ` – ${dmy(applied.to)}` : ''}` : `${dmy(applied.from)} – ${dmy(applied.to)}`}
                            {!isLoading && filtered.length > 0 && ` · ${filtered.length} bills`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={resetFilter} className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                            <RotateCcw size={14} strokeWidth={2.2} />
                        </button>
                        <button onClick={() => setShowFilter(v => !v)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                            style={{ background: showFilter ? '#ef3837' : 'white', border: `1.5px solid ${showFilter ? '#ef3837' : '#e5e7eb'}`, color: showFilter ? 'white' : '#374151' }}>
                            <SlidersHorizontal size={13} strokeWidth={2.5} /> Filter
                        </button>
                    </div>
                </div>

                {/* Collapsible filter */}
                <AnimatePresence>
                    {showFilter && (
                        <motion.div key="filter"
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 14 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.22 }}
                            className="overflow-hidden">
                            <div className="bg-white rounded-2xl p-4 shadow-card-md border border-gray-100">
                                {/* Presets */}
                                <div className="flex gap-2 mb-4 overflow-x-auto pb-0.5">
                                    {QUICK.map(q => (
                                        <button key={q.label} onClick={() => applyPreset(q)}
                                            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
                                            style={{
                                                background: activeQ === q.label ? '#ef3837' : '#f3f4f6',
                                                color: activeQ === q.label ? 'white' : '#6b7280',
                                                border: `1.5px solid ${activeQ === q.label ? '#ef3837' : 'transparent'}`,
                                                boxShadow: activeQ === q.label ? '0 3px 10px rgba(239,56,55,0.25)' : 'none',
                                            }}>
                                            {q.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Date range */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {[{ label: 'From', val: fromDate, set: setFromDate }, { label: 'To', val: toDate, set: setToDate }].map(f => (
                                        <div key={f.label}>
                                            <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">{f.label}</label>
                                            <input type="date" value={f.val}
                                                onChange={e => { f.set(e.target.value); setActiveQ(null); }}
                                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-red-400 focus:bg-white transition-all" />
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <motion.button whileTap={{ scale: 0.97 }} onClick={applyFilter}
                                        className="flex-1 py-3 rounded-xl text-sm font-extrabold text-white"
                                        style={{ background: 'linear-gradient(135deg,#ef3837,#b91c1c)', boxShadow: '0 4px 14px rgba(239,56,55,0.28)' }}>
                                        Apply Filter
                                    </motion.button>
                                    <button onClick={resetFilter}
                                        className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                                        <RotateCcw size={15} className="text-gray-500" strokeWidth={2.2} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bills list */}
                {isLoading ? (
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="text-5xl mb-3">🧾</div>
                        <p className="font-black text-gray-700 text-base mb-1">No sale bills found</p>
                        <p className="text-gray-400 text-sm">
                            {millSearch ? 'No bills match your search.' : `No bills for ${activeQ || 'the selected range'}.`}
                        </p>
                    </motion.div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filtered.map((bill, i) => {
                            const id = bill.saleid || i;
                            const isOpen = expanded === id;
                            const total = parseFloat(bill.sale_rate || 0) * parseFloat(bill.doqntl || 0);

                            return (
                                <motion.div key={id}
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(i * 0.04, 0.35) }}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">

                                    {/* Card header — always visible, tap to expand */}
                                    <button onClick={() => setExpanded(isOpen ? null : id)}
                                        className="w-full text-left p-4">
                                        <div className="flex items-start justify-between mb-2.5">
                                            <div className="flex-1 min-w-0 mr-3">
                                                <p className="font-black text-sm text-gray-900 truncate">
                                                    {bill.Mill_Name || bill.millname || 'Mill'}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5 font-medium">
                                                    {dmy(bill.doc_date?.split('T')[0])}
                                                    {bill.billto ? ` · ${bill.billto}` : ''}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <p className="font-black text-base text-emerald-600">₹{fmtAmt(total)}</p>
                                                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                                    <ChevronDown size={16} className="text-gray-400" />
                                                </motion.div>
                                            </div>
                                        </div>

                                        {/* Quick stats — always visible */}
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { label: 'Grade',    value: bill.Grade || '—',   bg: bill.Grade ? '#f5f3ff' : '#f9fafb', color: bill.Grade ? '#7c3aed' : '#9ca3af' },
                                                { label: 'Qty (qtl)',value: parseFloat(bill.doqntl || 0).toFixed(2), bg: '#f9fafb', color: '#374151' },
                                                { label: 'Rate',     value: `₹${parseFloat(bill.sale_rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, bg: '#eff6ff', color: '#1d4ed8' },
                                            ].map(({ label, value, bg, color }) => (
                                                <div key={label} className="rounded-xl py-2 px-2 text-center" style={{ background: bg }}>
                                                    <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                                                    <p className="text-xs font-black truncate" style={{ color }}>{value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </button>

                                    {/* Expanded details */}
                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div key="exp"
                                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                className="overflow-hidden">
                                                <div className="border-t border-gray-50 px-4 pb-4 pt-3">
                                                    {/* Extra info row */}
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
                                                            {bill.truck_no && <><span>🚛</span><span>{bill.truck_no}</span></>}
                                                        </div>
                                                        {bill.saleid && <SaleBillPrint saleid={bill.saleid} />}
                                                    </div>

                                                    {/* Additional fields */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {[
                                                            { label: 'Bill To',   value: bill.billto || '—' },
                                                            { label: 'Season',    value: bill.season || '—' },
                                                            { label: 'Doc Date',  value: dmy(bill.doc_date?.split('T')[0]) },
                                                            { label: 'Total Amt', value: `₹${fmtAmt(total)}`, bold: true, color: '#059669' },
                                                        ].map(({ label, value, bold, color }) => (
                                                            <div key={label} className="bg-gray-50 rounded-xl px-3 py-2">
                                                                <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                                                                <p className="text-xs font-bold" style={{ color: color || '#374151', fontWeight: bold ? 900 : 700 }}>{value}</p>
                                                            </div>
                                                        ))}
                                                    </div>
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
        </AppLayout>
    );
}
