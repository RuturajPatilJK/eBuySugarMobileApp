'use client';
import { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    SlidersHorizontal, RotateCcw, Search, X,
    ChevronDown, Pencil, Trash2, Plus, TrendingUp,
} from 'lucide-react';

function EditIcon({ size = 14, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );
}
function TrashIcon({ size = 14, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
        </svg>
    );
}
import AppLayout from '../../components/layout/AppLayout';
import { useGetMyesalesaudaQuery, myesalesaudaApi } from '../../services/myesalesaudaApi';
import { useUpdateTenderRatesAndQuantalMutation, useDeleteTenderMutation } from '../../services/tenderApi';

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const todayYmd = ymd(new Date());

function fmtDate(s) {
    if (!s) return '—';
    const dt = new Date(s);
    if (isNaN(dt)) return s;
    return `${String(dt.getDate()).padStart(2,'0')}-${String(dt.getMonth()+1).padStart(2,'0')}-${dt.getFullYear()}`;
}
function dmy(s) {
    if (!s) return '—';
    const [y,m,d] = s.split('-');
    return `${d}-${m}-${y}`;
}
function fmtAmt(n) {
    return (parseFloat(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}
function fmtNum(n) {
    return (parseFloat(n) || 0).toFixed(2);
}

const QUICK = [
    { label: 'Today',      get: () => ({ from: todayYmd, to: todayYmd }) },
    { label: 'This Week',  get: () => { const d = new Date(); d.setDate(d.getDate()-d.getDay()); return { from: ymd(d), to: todayYmd }; } },
    { label: 'This Month', get: () => { const n = new Date(); return { from: ymd(new Date(n.getFullYear(),n.getMonth(),1)), to: todayYmd }; } },
    { label: 'Last Month', get: () => { const n = new Date(); return { from: ymd(new Date(n.getFullYear(),n.getMonth()-1,1)), to: ymd(new Date(n.getFullYear(),n.getMonth(),0)) }; } },
];

const STATUS_FILTERS = [
    { label: 'All',      match: () => true },
    { label: 'Active',   match: (i) => parseFloat(i.Balance||0) > 0 && i.stop_resume_trading !== 'Y' && i.stop_resume_trading !== 'E' },
    { label: 'Sold Out', match: (i) => parseFloat(i.Balance||0) <= 0 },
    { label: 'Stopped',  match: (i) => i.stop_resume_trading === 'Y' },
    { label: 'Expired',  match: (i) => i.stop_resume_trading === 'E' },
];

function Spinner({ size = 16 }) {
    return <div className="animate-lspin rounded-full border-2 border-white/30 border-t-white flex-shrink-0" style={{ width: size, height: size }} />;
}

function StatusBadge({ item }) {
    const avail   = parseFloat(item.Balance || 0);
    const isSoldOut = avail <= 0;
    const isStopped = item.stop_resume_trading === 'Y';
    const isExpired = item.stop_resume_trading === 'E';
    if (isExpired) return (
        <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full tracking-wide"
            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
            ● EXPIRED
        </span>
    );
    if (isStopped) return (
        <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full tracking-wide"
            style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
            ■ STOPPED
        </span>
    );
    if (isSoldOut) return (
        <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full tracking-wide"
            style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
            ✓ SOLD OUT
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full tracking-wide"
            style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
            ▶ ACTIVE
        </span>
    );
}

function cardAccent(item) {
    if (item.stop_resume_trading === 'E') return '#ef4444';
    if (item.stop_resume_trading === 'Y') return '#f59e0b';
    if (parseFloat(item.Balance || 0) <= 0) return '#22c55e';
    return '#7c3aed';
}

function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="px-4 pt-4 pb-3">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 mr-3">
                        <div className="skeleton h-4 w-3/5 rounded-lg mb-2" />
                        <div className="skeleton h-3 w-2/5 rounded" />
                    </div>
                    <div className="skeleton h-5 w-16 rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {[1,2,3].map(j => <div key={j} className="skeleton h-16 rounded-xl" />)}
                </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
                <div className="skeleton h-5 w-20 rounded" />
                <div className="flex gap-2">
                    <div className="skeleton h-7 w-16 rounded-xl" />
                    <div className="skeleton h-7 w-16 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

export default function MyESalesPage() {
    const dispatch = useDispatch();
    const router   = useRouter();

    const def = QUICK[0].get();
    const [fromDate,     setFromDate]   = useState(def.from);
    const [toDate,       setToDate]     = useState(def.to);
    const [applied,      setApplied]    = useState({ from: def.from, to: def.to });
    const [activeQ,      setActiveQ]    = useState('Today');
    const [showFilter,   setShowFilter] = useState(false);
    const [search,       setSearch]     = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [expanded,     setExpanded]   = useState(null);
    const [editItem,     setEditItem]   = useState(null);
    const [editForm,     setEditForm]   = useState({});
    const [editErrors,   setEditErrors] = useState({});
    const [deleteItem,   setDeleteItem] = useState(null);
    const [toast,        setToast]      = useState({ show: false, message: '', type: 'success' });

    const { data: allSales = [], isLoading } = useGetMyesalesaudaQuery({ dateFrom: applied.from, dateTo: applied.to });
    const [updateSauda,  { isLoading: isUpdating }] = useUpdateTenderRatesAndQuantalMutation();
    const [deleteTender, { isLoading: isDeleting }] = useDeleteTenderMutation();

    const showToast = (msg, type = 'success') => {
        setToast({ show: true, message: msg, type });
        setTimeout(() => setToast(p => ({ ...p, show: false })), 3500);
    };

    const statusMatcher = STATUS_FILTERS.find(f => f.label === statusFilter)?.match ?? (() => true);

    const statusCounts = useMemo(() => {
        const result = {};
        STATUS_FILTERS.forEach(f => { result[f.label] = allSales.filter(f.match).length; });
        return result;
    }, [allSales]);

    const filtered = useMemo(() => {
        let list = allSales;
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(item =>
                (item.Ac_Name_E || '').toLowerCase().includes(q) ||
                (item.Short_Name || '').toLowerCase().includes(q) ||
                (item.gradeName || '').toLowerCase().includes(q)
            );
        }
        return list.filter(statusMatcher);
    }, [allSales, search, statusMatcher]);

    const totalQty   = filtered.reduce((s, i) => s + parseFloat(i.Buyer_Quantal || 0), 0);
    const totalAvail = filtered.reduce((s, i) => s + parseFloat(i.Balance || 0), 0);
    const totalSold  = filtered.reduce((s, i) => s + parseFloat(i.Sold || 0), 0);

    const openEdit = (item) => {
        setEditItem(item);
        setEditForm({
            Sale_Rate:     item.Sale_Rate || '',
            Buyer_Quantal: item.Buyer_Quantal || '',
            Lifting_Date:  item.Lifting_Date ? String(item.Lifting_Date).split('T')[0] : todayYmd,
            from_software: (item.from_software || '').trim(),
            Quantal:       item.Quantal || item.Buyer_Quantal || '',
        });
        setEditErrors({});
    };

    const handleEditSave = async () => {
        const errs = {};
        const q = parseFloat(editForm.Buyer_Quantal);
        const r = parseFloat(editForm.Sale_Rate);
        if (!editForm.Buyer_Quantal)    errs.Buyer_Quantal = 'Required';
        else if (isNaN(q) || q <= 0)   errs.Buyer_Quantal = 'Must be > 0';
        else if (q % 5 !== 0)          errs.Buyer_Quantal = 'Must be a multiple of 5';
        if (!editForm.Sale_Rate)        errs.Sale_Rate = 'Required';
        else if (isNaN(r) || r <= 0)   errs.Sale_Rate = 'Must be > 0';
        if (Object.keys(errs).length > 0) { setEditErrors(errs); return; }
        setEditErrors({});
        try {
            await updateSauda({
                id: editItem.tenderid,
                Tender_Date:        String(editItem.Sauda_Date || new Date().toISOString()).split('T')[0],
                Mill_Rate:          r,
                Narration:          '',
                Party_Bill_Rate:    r,
                Quantal:            parseFloat(editForm.Quantal || editForm.Buyer_Quantal),
                ebuy_quantal:       q,
                tenderdetailid:     editItem.tenderdetailid,
                Lifting_Date:       editForm.Lifting_Date,
                EbuySelectedParty:  null,
                EbuySelectedAccoid: null,
            }).unwrap();
            dispatch(myesalesaudaApi.util.invalidateTags(['Myesalesauda']));
            setEditItem(null);
            showToast('Sauda updated successfully!', 'success');
        } catch (err) {
            const detail = err?.data?.detail;
            let msg = 'Failed to update sauda';
            if (typeof detail === 'string') msg = detail;
            else if (Array.isArray(detail)) msg = detail[0]?.msg || msg;
            showToast(msg, 'error');
        }
    };

    const handleDelete = async () => {
        if (!deleteItem) return;
        try {
            await deleteTender({ tenderId: deleteItem.tenderid, tenderdetailid: deleteItem.tenderdetailid }).unwrap();
            dispatch(myesalesaudaApi.util.invalidateTags(['Myesalesauda']));
            setDeleteItem(null);
            showToast('Sauda deleted!', 'success');
        } catch (err) {
            const detail = err?.data?.detail;
            showToast(typeof detail === 'string' ? detail : 'Failed to delete sauda', 'error');
        }
    };

    return (
        <AppLayout title="My eSale Sauda" showBack>

            {/* Toast */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div initial={{ opacity: 0, y: -60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -60 }}
                        className="fixed top-[72px] left-4 right-4 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-2xl font-bold text-sm text-white"
                        style={{ background: toast.type === 'success' ? '#059669' : '#ef4444', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                        <span className="text-base">{toast.type === 'success' ? '✓' : '✕'}</span>
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-4 pt-3 pb-10">

                {/* ── Header row ── */}
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-base font-black text-gray-900">My eSale Sauda</h2>
                        <p className="text-xs text-gray-400 mt-0.5 font-medium">
                            {activeQ
                                ? `${activeQ} · ${dmy(applied.from)}${applied.from !== applied.to ? ` – ${dmy(applied.to)}` : ''}`
                                : `${dmy(applied.from)} – ${dmy(applied.to)}`}
                            {!isLoading && filtered.length > 0 && ` · ${filtered.length} records`}
                        </p>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/add-sale')}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-extrabold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#ef3837,#d92300)', boxShadow: '0 4px 14px rgba(239,56,55,0.30)' }}>
                        <Plus size={15} strokeWidth={2.8} /> New Sauda
                    </motion.button>
                </div>

                {/* ── Summary banner ── */}
                {!isLoading && allSales.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl p-4 mb-3 relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 6px 24px rgba(124,58,237,0.30)' }}>
                        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
                        <div className="absolute right-8 bottom-0 w-14 h-14 rounded-full bg-white/08" />
                        <div className="absolute left-0 bottom-0 w-20 h-20 rounded-full bg-white/05" />
                        <div className="flex items-center justify-between relative">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <TrendingUp size={11} className="text-white/60" />
                                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Total Quantity</p>
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-wsping" />
                                </div>
                                <p className="text-white text-2xl font-black leading-none">
                                    {totalQty.toFixed(2)}
                                    <span className="text-sm font-semibold text-white/50 ml-1.5">Qtl</span>
                                </p>
                            </div>
                            <div className="flex gap-5">
                                {[
                                    { label: 'Available', value: totalAvail.toFixed(2), color: '#4ade80' },
                                    { label: 'Sold',      value: totalSold.toFixed(2),  color: '#fbbf24' },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="text-right">
                                        <p className="text-white/50 text-[10px] font-extrabold uppercase tracking-wider mb-0.5">{label}</p>
                                        <p className="text-lg font-black" style={{ color }}>{value}</p>
                                        <p className="text-white/40 text-[9px] font-semibold">Qtl</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── Search + Filter toggle ── */}
                <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} strokeWidth={2.5} />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search mill or grade…"
                            className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none shadow-card transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                                <X size={10} className="text-gray-500" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => { const r=QUICK[0].get(); setFromDate(r.from); setToDate(r.to); setApplied(r); setActiveQ('Today'); setSearch(''); setStatusFilter('All'); setShowFilter(false); }}
                            className="w-10 h-10 rounded-2xl border border-gray-200 bg-white flex items-center justify-center">
                            <RotateCcw size={14} className="text-gray-500" strokeWidth={2.2} />
                        </button>
                        <button onClick={() => setShowFilter(v => !v)}
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-bold flex-shrink-0 transition-all border"
                            style={{ background: showFilter ? '#7c3aed' : 'white', borderColor: showFilter ? '#7c3aed' : '#e5e7eb', color: showFilter ? 'white' : '#374151' }}>
                            <SlidersHorizontal size={13} /> Filter
                        </button>
                    </div>
                </div>

                {/* ── Sale type / Status filter pills — always visible ── */}
                <div className="flex gap-2 mb-3 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
                    {STATUS_FILTERS.map(f => {
                        const isActive = statusFilter === f.label;
                        const count = statusCounts[f.label] ?? 0;
                        return (
                            <button key={f.label} onClick={() => setStatusFilter(f.label)}
                                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
                                style={{
                                    background: isActive ? '#7c3aed' : '#f5f3ff',
                                    color:      isActive ? 'white' : '#7c3aed',
                                    border:     `1.5px solid ${isActive ? '#7c3aed' : '#ddd6fe'}`,
                                    boxShadow:  isActive ? '0 3px 12px rgba(124,58,237,0.30)' : 'none',
                                }}>
                                {f.label}
                                {count > 0 && (
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                                        style={{ background: isActive ? 'rgba(255,255,255,0.25)' : '#ede9fe', color: isActive ? 'white' : '#7c3aed' }}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ── Collapsible date filter ── */}
                <AnimatePresence>
                    {showFilter && (
                        <motion.div key="filter" initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 14 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                            <div className="bg-white rounded-2xl p-4 border border-gray-100" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2.5">Date Range</p>
                                <div className="flex gap-2 mb-4 overflow-x-auto pb-0.5">
                                    {QUICK.map(q => (
                                        <button key={q.label}
                                            onClick={() => { const r=q.get(); setFromDate(r.from); setToDate(r.to); setApplied({from:r.from,to:r.to}); setActiveQ(q.label); }}
                                            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
                                            style={{ background: activeQ===q.label?'#7c3aed':'#f3f4f6', color: activeQ===q.label?'white':'#6b7280', border: `1.5px solid ${activeQ===q.label?'#7c3aed':'transparent'}`, boxShadow: activeQ===q.label?'0 3px 10px rgba(124,58,237,0.25)':'none' }}>
                                            {q.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {[{label:'From',val:fromDate,set:setFromDate},{label:'To',val:toDate,set:setToDate}].map(f=>(
                                        <div key={f.label}>
                                            <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">{f.label}</label>
                                            <input type="date" value={f.val} onChange={e=>{f.set(e.target.value);setActiveQ(null);}}
                                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-violet-400 focus:bg-white transition-all" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <motion.button whileTap={{scale:0.97}}
                                        onClick={() => { setApplied({from:fromDate,to:toDate}); setShowFilter(false); }}
                                        className="flex-1 py-3 rounded-xl text-sm font-extrabold text-white"
                                        style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 14px rgba(124,58,237,0.28)' }}>
                                        Apply Filter
                                    </motion.button>
                                    <button onClick={() => { const r=QUICK[0].get(); setFromDate(r.from); setToDate(r.to); setApplied(r); setActiveQ('Today'); setSearch(''); setStatusFilter('All'); setShowFilter(false); }}
                                        className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                                        <RotateCcw size={15} className="text-gray-500" strokeWidth={2.2} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Cards list ── */}
                {isLoading ? (
                    <div className="flex flex-col gap-3">
                        {[1,2,3].map(i => <SkeletonCard key={i} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto mb-3">
                            <TrendingUp size={24} className="text-violet-400" />
                        </div>
                        <p className="font-black text-gray-700 text-base mb-1">No data found</p>
                        <p className="text-gray-400 text-sm">No records for the selected date range.</p>
                    </motion.div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filtered.map((item, i) => {
                            const id     = item.tenderdetailid || i;
                            const isOpen = expanded === id;
                            const qty    = parseFloat(item.Buyer_Quantal || 0);
                            const avail  = parseFloat(item.Balance || 0);
                            const sold   = parseFloat(item.Sold || 0);
                            const rate   = parseFloat(item.Sale_Rate || 0);
                            const accent = cardAccent(item);

                            return (
                                <motion.div key={id}
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(i * 0.04, 0.35) }}
                                    className="bg-white rounded-2xl overflow-hidden"
                                    style={{
                                        borderLeft: `4px solid ${accent}`,
                                        boxShadow: '0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)',
                                    }}>

                                    {/* ── Card header — gradient tint ── */}
                                    <div className="px-4 pt-4 pb-3.5"
                                        style={{ background: `linear-gradient(135deg, ${accent}10 0%, ${accent}04 60%, transparent 100%)` }}>

                                        {/* Mill name row */}
                                        <div className="flex items-start justify-between mb-2">
                                            <p className="font-black text-[15px] text-gray-900 leading-snug flex-1 mr-3">
                                                {item.Ac_Name_E || item.Short_Name || 'Mill'}
                                            </p>
                                            <StatusBadge item={item} />
                                        </div>

                                        {/* Tags row — grade, packing, season, tender no */}
                                        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                                            {[item.gradeName, item.Packing ? `${item.Packing}kg` : null, item.season].filter(Boolean).map((t, j) => (
                                                <span key={j} className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                                                    style={{ background: `${accent}15`, color: accent }}>
                                                    {t}
                                                </span>
                                            ))}
                                            {item.Tender_No && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500">
                                                    #{item.Tender_No}
                                                </span>
                                            )}
                                        </div>

                                        {/* ── 3-column quantity stats ── */}
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { label: 'Display Qty', value: fmtNum(qty),   color: accent,    bg: `${accent}12` },
                                                { label: 'Available',   value: fmtNum(avail), color: '#16a34a', bg: '#f0fdf4' },
                                                { label: 'Sold',        value: fmtNum(sold),  color: '#d97706', bg: '#fffbeb' },
                                            ].map(({ label, value, color, bg }) => (
                                                <div key={label} className="rounded-xl py-3 px-2 text-center" style={{ background: bg }}>
                                                    <p className="text-[16px] font-black leading-none mb-0.5" style={{ color }}>{value}</p>
                                                    <p className="text-[8px] font-extrabold text-gray-400 uppercase tracking-wider">Qtl</p>
                                                    <p className="text-[9px] text-gray-500 font-semibold mt-0.5 leading-tight">{label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ── Footer: Rate + Icon buttons ── */}
                                    <div className="px-4 py-2.5 flex items-center justify-between"
                                        style={{ borderTop: `1px solid ${accent}18` }}>
                                        <div>
                                            <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider mb-0.5">Sale Rate</p>
                                            <p className="font-black text-[16px] leading-none" style={{ color: accent }}>
                                                ₹{fmtAmt(rate)}
                                                <span className="text-[10px] font-semibold text-gray-400 ml-1">/qtl</span>
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Edit — 34×34 icon-only (same SVG as Edit Profile contacts) */}
                                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => openEdit(item)}
                                                style={{ width: 34, height: 34, border: 'none', borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                <EditIcon size={14} color="#2563eb" />
                                            </motion.button>
                                            {/* Delete — 34×34 icon-only (same SVG as Edit Profile contacts) */}
                                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setDeleteItem(item)}
                                                style={{ width: 34, height: 34, border: 'none', borderRadius: 10, background: '#fff5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                <TrashIcon size={14} color="#ef3837" />
                                            </motion.button>
                                            {/* Expand toggle — 34×34 */}
                                            <button onClick={() => setExpanded(isOpen ? null : id)}
                                                style={{ width: 34, height: 34, border: 'none', borderRadius: 10, background: isOpen ? `${accent}18` : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                                    <ChevronDown size={15} color={isOpen ? accent : '#9ca3af'} />
                                                </motion.div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* ── Expanded details ── */}
                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div key="exp"
                                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                className="overflow-hidden">
                                                <div className="px-4 pt-3 pb-4 border-t" style={{ background: `${accent}05`, borderColor: `${accent}15` }}>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {[
                                                            { label: 'Tender No',    value: item.Tender_No ? `#${item.Tender_No}` : '—' },
                                                            { label: 'Sauda Date',   value: fmtDate(item.Sauda_Date) },
                                                            { label: 'Lifting Date', value: fmtDate(item.Lifting_Date) },
                                                            { label: 'Total Value',  value: `₹${fmtAmt(rate * qty)}`, color: accent, bold: true },
                                                        ].map(({ label, value, color, bold }) => (
                                                            <div key={label} className="bg-white rounded-xl px-3 py-2.5 border border-gray-100">
                                                                <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                                                                <p className="text-xs truncate" style={{ color: color || '#374151', fontWeight: bold ? 900 : 700 }}>{value}</p>
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

            {/* ── Edit bottom-sheet ── */}
            <AnimatePresence>
                {editItem && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setEditItem(null)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl px-5 pt-4 pb-10 max-h-[92vh] overflow-y-auto">

                            <div className="flex justify-center mb-4">
                                <div className="w-10 h-1 rounded-full bg-gray-200" />
                            </div>

                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#ede9fe' }}>
                                        <Pencil size={18} style={{ color: '#7c3aed' }} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-base text-gray-900">Edit eSale Sauda</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">Update sauda details</p>
                                    </div>
                                </div>
                                <button onClick={() => setEditItem(null)}
                                    className="w-8 h-8 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 text-xl">×</button>
                            </div>

                            <div className="bg-gray-50 rounded-2xl px-4 py-3.5 mb-5 border border-gray-100">
                                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2.5">Record Info</p>
                                {[
                                    { label: 'Mill',   value: `${editItem.Ac_Name_E || ''}${editItem.Mill_Code ? ' · '+editItem.Mill_Code : ''}` || '—' },
                                    { label: 'Grade',  value: `${editItem.gradeName || '—'}${editItem.Packing ? ' ('+editItem.Packing+' Kg)' : ''}` },
                                    { label: 'Season', value: editItem.season || '—' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                                        <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">{label}</span>
                                        <span className="text-xs font-bold text-gray-700 text-right ml-3 max-w-[60%] truncate">{value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mb-4">
                                <label className="block text-[11px] font-extrabold text-gray-600 uppercase tracking-wider mb-2">
                                    Sale Rate (₹/qtl) <span className="text-red-500">*</span>
                                </label>
                                <input type="number" value={editForm.Sale_Rate || ''} placeholder="0.00"
                                    disabled={editForm.from_software !== 'S'}
                                    onChange={e => setEditForm(f => ({ ...f, Sale_Rate: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 border rounded-2xl text-sm font-bold text-gray-900 outline-none focus:border-violet-400 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ borderColor: editErrors.Sale_Rate ? '#ef4444' : '#e5e7eb' }} />
                                {editErrors.Sale_Rate && <p className="text-xs text-red-500 mt-1.5 font-semibold">⚠ {editErrors.Sale_Rate}</p>}
                                {editForm.from_software !== 'S' && <p className="text-xs text-gray-400 mt-1">Rate is not editable for this sauda type.</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div>
                                    <label className="block text-[11px] font-extrabold text-gray-600 uppercase tracking-wider mb-2">
                                        Buyer Qty (Qtl) <span className="text-red-500">*</span>
                                    </label>
                                    <input type="number" value={editForm.Buyer_Quantal || ''} placeholder="Multiple of 5" step="5" min="5"
                                        onChange={e => setEditForm(f => ({ ...f, Buyer_Quantal: e.target.value }))}
                                        className="w-full px-4 py-3 bg-gray-50 border rounded-2xl text-sm font-bold text-gray-900 outline-none focus:border-violet-400 focus:bg-white transition-all"
                                        style={{ borderColor: editErrors.Buyer_Quantal ? '#ef4444' : '#e5e7eb' }} />
                                    {editErrors.Buyer_Quantal && <p className="text-xs text-red-500 mt-1.5 font-semibold">⚠ {editErrors.Buyer_Quantal}</p>}
                                </div>
                                <div>
                                    <label className="block text-[11px] font-extrabold text-gray-600 uppercase tracking-wider mb-2">Lifting Date</label>
                                    <input type="date" value={editForm.Lifting_Date || ''}
                                        onChange={e => setEditForm(f => ({ ...f, Lifting_Date: e.target.value }))}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:border-violet-400 focus:bg-white transition-all" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setEditItem(null)}
                                    className="py-3.5 rounded-2xl bg-gray-100 text-sm font-bold text-gray-700 border border-gray-200">
                                    Cancel
                                </button>
                                <motion.button whileTap={{ scale: 0.97 }} onClick={handleEditSave} disabled={isUpdating}
                                    className="py-3.5 rounded-2xl text-sm font-extrabold text-white flex items-center justify-center gap-2"
                                    style={{ background: isUpdating ? '#c4b5fd' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', cursor: isUpdating ? 'not-allowed' : 'pointer', boxShadow: isUpdating ? 'none' : '0 4px 14px rgba(124,58,237,0.28)' }}>
                                    {isUpdating ? <><Spinner />Saving…</> : '💾 Save Changes'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Delete confirm modal ── */}
            <AnimatePresence>
                {deleteItem && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setDeleteItem(null)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" />
                        <motion.div initial={{ opacity: 0, scale: 0.88, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.88, y: 20 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] bg-white rounded-3xl p-6 w-[calc(100%-40px)] max-w-sm"
                            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                            {(() => {
                                const hasSold = parseFloat(deleteItem.Sold || 0) > 0;
                                return (
                                    <>
                                        <div className="flex justify-center mb-4">
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                                style={{ background: hasSold ? '#fef3c7' : '#fff1f0' }}>
                                                {hasSold
                                                    ? <span className="text-3xl">⚠️</span>
                                                    : <Trash2 size={26} style={{ color: '#ef4444' }} strokeWidth={2} />}
                                            </div>
                                        </div>
                                        <h3 className="font-black text-base text-gray-900 text-center mb-1">
                                            {hasSold ? 'Partially Sold Sauda' : 'Delete Sauda?'}
                                        </h3>
                                        <p className="text-xs text-gray-400 text-center mb-4">This action cannot be undone</p>

                                        <div className="bg-gray-50 rounded-2xl px-4 py-3 mb-4 border border-gray-100">
                                            {[
                                                { label: 'Mill',       value: deleteItem.Ac_Name_E || '—' },
                                                { label: 'Grade',      value: `${deleteItem.gradeName || '—'} · ${deleteItem.season || '—'}` },
                                                { label: 'Total Qty',  value: `${parseFloat(deleteItem.Buyer_Quantal||0).toFixed(2)} Qtl` },
                                                ...(hasSold ? [{ label: 'Already Sold', value: `${parseFloat(deleteItem.Sold).toFixed(2)} Qtl`, warn: true }] : []),
                                            ].map(({ label, value, warn }) => (
                                                <div key={label} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
                                                    <span className="text-[11px] text-gray-400 font-semibold">{label}</span>
                                                    <span className="text-xs font-bold" style={{ color: warn ? '#d97706' : '#374151' }}>{value}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {hasSold && (
                                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4 text-center leading-relaxed">
                                                <strong>{parseFloat(deleteItem.Sold).toFixed(2)} Qtl</strong> already sold. Record will be reduced to sold quantity; unsold stock released.
                                            </p>
                                        )}

                                        <div className="grid grid-cols-2 gap-2.5">
                                            <button onClick={() => setDeleteItem(null)}
                                                className="py-3.5 rounded-2xl bg-gray-100 text-sm font-bold text-gray-700 border border-gray-200">
                                                Cancel
                                            </button>
                                            <motion.button whileTap={{ scale: 0.96 }} onClick={handleDelete} disabled={isDeleting}
                                                className="py-3.5 rounded-2xl text-sm font-extrabold text-white flex items-center justify-center gap-2"
                                                style={{ background: isDeleting ? '#fca5a5' : hasSold ? '#f59e0b' : '#ef4444', cursor: isDeleting ? 'not-allowed' : 'pointer' }}>
                                                {isDeleting ? <><Spinner size={14} />Deleting…</> : hasSold ? 'Reduce & Delete' : '🗑 Delete'}
                                            </motion.button>
                                        </div>
                                    </>
                                );
                            })()}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
