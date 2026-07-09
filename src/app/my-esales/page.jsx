'use client';
import { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';
import { useGetMyesalesaudaQuery, myesalesaudaApi } from '../../services/myesalesaudaApi';
import { useUpdateTenderRatesAndQuantalMutation, useDeleteTenderMutation } from '../../services/tenderApi';

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

const QUICK = [
    { label: 'Today', f: today, t: today },
    { label: 'This Month', f: firstOfMonth, t: today },
];

const inputSt = {
    width: '100%', padding: '11px 12px', background: '#f9fafb',
    border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14,
    fontWeight: 600, color: '#111827', outline: 'none', fontFamily: 'inherit',
};

export default function MyESalesPage() {
    const dispatch = useDispatch();
    const [fromDate, setFromDate] = useState(firstOfMonth);
    const [toDate, setToDate] = useState(today);
    const [applied, setApplied] = useState({ from: firstOfMonth, to: today });
    const [activeQ, setActiveQ] = useState('This Month');
    const [search, setSearch] = useState('');
    const [editItem, setEditItem] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [editErrors, setEditErrors] = useState({});
    const [deleteItem, setDeleteItem] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const { data: allSales = [], isLoading } = useGetMyesalesaudaQuery({
        dateFrom: applied.from,
        dateTo: applied.to,
    });
    const [updateSauda, { isLoading: isUpdating }] = useUpdateTenderRatesAndQuantalMutation();
    const [deleteTender, { isLoading: isDeleting }] = useDeleteTenderMutation();

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(p => ({ ...p, show: false })), 3500);
    };

    const filtered = useMemo(() => {
        if (!search) return allSales;
        const q = search.toLowerCase();
        return allSales.filter(item =>
            (item.Ac_Name_E || '').toLowerCase().includes(q) ||
            (item.Short_Name || '').toLowerCase().includes(q) ||
            (item.gradeName || '').toLowerCase().includes(q)
        );
    }, [allSales, search]);

    const totalQty   = filtered.reduce((s, i) => s + parseFloat(i.Buyer_Quantal || 0), 0);
    const totalAvail = filtered.reduce((s, i) => s + parseFloat(i.Balance || 0), 0);
    const totalSold  = filtered.reduce((s, i) => s + parseFloat(i.Sold || 0), 0);

    const openEdit = (item) => {
        setEditItem(item);
        setEditForm({
            Sale_Rate:     item.Sale_Rate || '',
            Buyer_Quantal: item.Buyer_Quantal || '',
            Lifting_Date:  item.Lifting_Date ? String(item.Lifting_Date).split('T')[0] : today,
            from_software: (item.from_software || '').trim(),
            Quantal:       item.Quantal || item.Buyer_Quantal || '',
        });
        setEditErrors({});
    };

    const handleEditSave = async () => {
        const errs = {};
        const q = parseFloat(editForm.Buyer_Quantal);
        if (!editForm.Buyer_Quantal)          errs.Buyer_Quantal = 'Required';
        else if (isNaN(q) || q <= 0)          errs.Buyer_Quantal = 'Must be > 0';
        else if (q % 5 !== 0)                 errs.Buyer_Quantal = 'Must be a multiple of 5';
        const r = parseFloat(editForm.Sale_Rate);
        if (!editForm.Sale_Rate)              errs.Sale_Rate = 'Required';
        else if (isNaN(r) || r <= 0)          errs.Sale_Rate = 'Must be > 0';
        if (Object.keys(errs).length > 0) { setEditErrors(errs); return; }
        setEditErrors({});

        try {
            await updateSauda({
                id:                 editItem.tenderid,
                Tender_Date:        String(editItem.Sauda_Date || new Date().toISOString()).split('T')[0],
                Mill_Rate:          parseFloat(editForm.Sale_Rate),
                Narration:          '',
                Party_Bill_Rate:    parseFloat(editForm.Sale_Rate),
                Quantal:            parseFloat(editForm.Quantal || editForm.Buyer_Quantal),
                ebuy_quantal:       parseFloat(editForm.Buyer_Quantal),
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
            let msg = 'Failed to delete sauda';
            if (typeof detail === 'string') msg = detail;
            showToast(msg, 'error');
        }
    };

    return (
        <AppLayout title="My E-Sales Sauda" showBack>
            <AnimatePresence>
                {toast.show && (
                    <motion.div initial={{ opacity: 0, y: -60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -60 }}
                        style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 14, fontWeight: 700, fontSize: 14, background: toast.type === 'success' ? '#059669' : '#ef4444', color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', whiteSpace: 'nowrap', fontFamily: 'Signika, sans-serif' }}>
                        {toast.type === 'success' ? '✓' : '✕'} {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ padding: '12px 16px 32px', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>

                {/* ── Header banner ── */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', borderRadius: 18, padding: '16px 18px', marginBottom: 18, boxShadow: '0 6px 20px rgba(124,58,237,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700, margin: 0 }}>MY E-SALES SAUDA</p>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80', display: 'inline-block', animation: 'wsping 2s ease-in-out infinite' }} title="Live updates" />
                            </div>
                            <p style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: '2px 0' }}>{totalQty.toFixed(2)} Qtl</p>
                            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 500, margin: 0 }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                            <span style={{ fontSize: 28 }}>🏆</span>
                            <div style={{ display: 'flex', gap: 14 }}>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>Available</p>
                                    <p style={{ color: '#4ade80', fontSize: 14, fontWeight: 900, margin: 0 }}>{totalAvail.toFixed(2)}</p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>Sold</p>
                                    <p style={{ color: '#fbbf24', fontSize: 14, fontWeight: 900, margin: 0 }}>{totalSold.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── Quick date presets ── */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {QUICK.map(q => (
                        <button key={q.label}
                            onClick={() => { setFromDate(q.f); setToDate(q.t); setApplied({ from: q.f, to: q.t }); setActiveQ(q.label); }}
                            style={{ padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${activeQ === q.label ? '#7c3aed' : '#e5e7eb'}`, background: activeQ === q.label ? '#f5f3ff' : 'white', color: activeQ === q.label ? '#7c3aed' : '#6b7280', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {q.label}
                        </button>
                    ))}
                </div>

                {/* ── Date filter ── */}
                <div style={{ background: 'white', borderRadius: 16, padding: '14px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginBottom: 14, border: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>From</label>
                            <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setActiveQ(null); }} style={inputSt}
                                onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.background = 'white'; }}
                                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>To</label>
                            <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setActiveQ(null); }} style={inputSt}
                                onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.background = 'white'; }}
                                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }} />
                        </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setApplied({ from: fromDate, to: toDate })}
                        style={{ width: '100%', padding: '11px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Apply Filter
                    </motion.button>
                </div>

                {/* ── Search ── */}
                <div style={{ position: 'relative', marginBottom: 14 }}>
                    <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by mill or grade..."
                        style={{ ...inputSt, paddingLeft: 36 }}
                        onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.background = 'white'; }}
                        onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }} />
                </div>

                {/* ── List ── */}
                {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ background: 'white', borderRadius: 14, padding: 14, border: '1px solid #f3f4f6' }}>
                                <div className="skeleton" style={{ height: 16, width: '55%', marginBottom: 8 }} />
                                <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 10 }} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                                    {[1, 2, 3].map(j => <div key={j} className="skeleton" style={{ height: 40, borderRadius: 8 }} />)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '56px 20px', background: 'white', borderRadius: 18, border: '1.5px dashed #e5e7eb' }}>
                        <div style={{ fontSize: 44, marginBottom: 12 }}>🏆</div>
                        <p style={{ fontWeight: 700, color: '#374151', marginBottom: 4 }}>No e-sale records</p>
                        <p style={{ color: '#9ca3af', fontSize: 13 }}>No records for the selected date range.</p>
                    </div>
                ) : (
                    <>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 10 }}>
                            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {filtered.map((item, i) => {
                                const qty   = parseFloat(item.Buyer_Quantal || 0);
                                const avail = parseFloat(item.Balance || 0);
                                const sold  = parseFloat(item.Sold || 0);
                                const rate  = parseFloat(item.Sale_Rate || 0);
                                const isSoldOut = avail <= 0;
                                const isStopped = item.stop_resume_trading === 'Y';
                                const isExpired = item.stop_resume_trading === 'E';
                                return (
                                    <motion.div key={item.tenderdetailid || i}
                                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(i * 0.05, 0.4) }}
                                        style={{
                                            background: isSoldOut ? '#f0fdf4' : isExpired ? '#fff5f5' : 'white',
                                            borderRadius: 14,
                                            padding: '14px 16px',
                                            boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                                            border: `1px solid ${isSoldOut ? '#bbf7d0' : isExpired ? '#fecaca' : '#f3f4f6'}`,
                                        }}>
                                        {/* Title row */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                    <p style={{ fontWeight: 800, fontSize: 14, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {item.Ac_Name_E || item.Short_Name || 'Mill'}
                                                    </p>
                                                    {isSoldOut  && <span style={{ fontSize: 9, fontWeight: 800, background: '#dcfce7', color: '#16a34a', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>SOLD OUT</span>}
                                                    {isStopped && !isSoldOut && <span style={{ fontSize: 9, fontWeight: 800, background: '#fef3c7', color: '#d97706', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>STOPPED</span>}
                                                    {isExpired  && <span style={{ fontSize: 9, fontWeight: 800, background: '#fee2e2', color: '#ef4444', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>EXPIRED</span>}
                                                </div>
                                                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                                    {[item.gradeName, item.Packing ? `${item.Packing} Kg` : null, item.season].filter(Boolean).map((tag, j) => (
                                                        <span key={j} style={{ fontSize: 10, fontWeight: 700, background: '#f3f4f6', color: '#6b7280', padding: '2px 7px', borderRadius: 5 }}>{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                                                <button onClick={() => openEdit(item)}
                                                    style={{ padding: '5px 10px', background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#7c3aed', cursor: 'pointer', fontFamily: 'inherit' }}>
                                                    ✏️ Edit
                                                </button>
                                                <button onClick={() => setDeleteItem(item)}
                                                    style={{ padding: '5px 10px', background: '#fff1f0', border: '1px solid #fecaca', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit' }}>
                                                    🗑
                                                </button>
                                            </div>
                                        </div>

                                        {/* 3 qty cards */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
                                            {[
                                                { label: 'Display Qty', value: qty.toFixed(2),   color: '#4338ca', bg: '#eef2ff' },
                                                { label: 'Available',   value: avail.toFixed(2), color: '#16a34a', bg: '#f0fdf4' },
                                                { label: 'Sold',        value: sold.toFixed(2),  color: '#d97706', bg: '#fffbeb' },
                                            ].map(({ label, value, color, bg }) => (
                                                <div key={label} style={{ background: bg, borderRadius: 8, padding: '7px 8px', textAlign: 'center' }}>
                                                    <p style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 2px' }}>{label}</p>
                                                    <p style={{ fontSize: 13, fontWeight: 900, color, margin: 0 }}>{value}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Footer row */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <p style={{ fontSize: 13, fontWeight: 800, color: '#7c3aed', margin: 0 }}>
                                                ₹{fmtAmt(rate)}/qtl
                                            </p>
                                            <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, margin: 0 }}>
                                                {item.Tender_No ? `Tender #${item.Tender_No} · ` : ''}{fmtDate(item.Sauda_Date)}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* ── Edit bottom-sheet ── */}
            <AnimatePresence>
                {editItem && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setEditItem(null)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }} />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 70, background: 'white', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px', maxHeight: '92vh', overflowY: 'auto', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>

                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                                <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e5e7eb' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                                <div>
                                    <h3 style={{ fontWeight: 900, fontSize: 16, color: '#111827', margin: 0 }}>Edit eSale Sauda</h3>
                                    <p style={{ fontSize: 12, color: '#6b7280', marginTop: 3, marginBottom: 0 }}>Update sauda details below</p>
                                </div>
                                <button onClick={() => setEditItem(null)}
                                    style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#6b7280' }}>×</button>
                            </div>

                            {/* Read-only record info */}
                            <div style={{ background: '#f9fafb', borderRadius: 12, padding: '12px 14px', marginBottom: 18 }}>
                                <p style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Record Info</p>
                                {[
                                    { label: 'Mill',          value: `${editItem.Ac_Name_E || ''}${editItem.Mill_Code ? ' · ' + editItem.Mill_Code : ''}` || '—' },
                                    { label: 'Short Name',    value: editItem.Short_Name || '—' },
                                    { label: 'Grade',         value: `${editItem.gradeName || '—'}${editItem.Packing ? ' (' + editItem.Packing + ' Kg)' : ''}` },
                                    { label: 'Season',        value: editItem.season || '—' },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 6, marginBottom: 6, borderBottom: '1px solid #f3f4f6' }}>
                                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', flexShrink: 0 }}>{label}</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textAlign: 'right', marginLeft: 12 }}>{value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Sale Rate */}
                            <div style={{ marginBottom: 14 }}>
                                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                                    Sale Rate (₹/qtl) <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input type="number" value={editForm.Sale_Rate || ''} placeholder="0.00"
                                    disabled={editForm.from_software !== 'S'}
                                    onChange={e => setEditForm(f => ({ ...f, Sale_Rate: e.target.value }))}
                                    onFocus={e => { if (editForm.from_software === 'S') { e.target.style.borderColor = '#7c3aed'; e.target.style.background = 'white'; } }}
                                    onBlur={e => { e.target.style.borderColor = editErrors.Sale_Rate ? '#ef4444' : '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                                    style={{ ...inputSt, borderColor: editErrors.Sale_Rate ? '#ef4444' : '#e5e7eb', opacity: editForm.from_software !== 'S' ? 0.55 : 1, cursor: editForm.from_software !== 'S' ? 'not-allowed' : 'text' }} />
                                {editErrors.Sale_Rate && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>⚠ {editErrors.Sale_Rate}</p>}
                                {editForm.from_software !== 'S' && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Rate is not editable for this sauda type.</p>}
                            </div>

                            {/* Buyer Quantal + Lifting Date */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                                        Buyer Qty (Qtl) <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input type="number" value={editForm.Buyer_Quantal || ''} placeholder="Multiple of 5" step="5" min="5"
                                        onChange={e => setEditForm(f => ({ ...f, Buyer_Quantal: e.target.value }))}
                                        onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.background = 'white'; }}
                                        onBlur={e => { e.target.style.borderColor = editErrors.Buyer_Quantal ? '#ef4444' : '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                                        style={{ ...inputSt, borderColor: editErrors.Buyer_Quantal ? '#ef4444' : '#e5e7eb' }} />
                                    {editErrors.Buyer_Quantal && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>⚠ {editErrors.Buyer_Quantal}</p>}
                                    <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 3, marginBottom: 0 }}>Multiples of 5 only</p>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Lifting Date</label>
                                    <input type="date" value={editForm.Lifting_Date || ''}
                                        onChange={e => setEditForm(f => ({ ...f, Lifting_Date: e.target.value }))}
                                        onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.background = 'white'; }}
                                        onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                                        style={inputSt} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                                <button onClick={() => setEditItem(null)}
                                    style={{ padding: '14px', background: '#f3f4f6', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
                                    Cancel
                                </button>
                                <motion.button whileTap={{ scale: 0.97 }} onClick={handleEditSave} disabled={isUpdating}
                                    style={{ padding: '14px', background: isUpdating ? '#c4b5fd' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800, color: 'white', cursor: isUpdating ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    {isUpdating
                                        ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Saving…</>
                                        : '💾 Save Changes'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Delete confirmation ── */}
            <AnimatePresence>
                {deleteItem && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setDeleteItem(null)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }} />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 70, background: 'white', borderRadius: 20, padding: '24px 20px', width: 'calc(100% - 48px)', maxWidth: 360, fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>
                            {(() => {
                                const hasSold = parseFloat(deleteItem.Sold || 0) > 0;
                                return (
                                    <>
                                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                            <div style={{ fontSize: 40, marginBottom: 8 }}>{hasSold ? '⚠️' : '🗑️'}</div>
                                            <h3 style={{ fontWeight: 900, fontSize: 16, color: '#111827', marginBottom: 4 }}>
                                                {hasSold ? 'Partially Sold Sauda' : 'Delete Sauda?'}
                                            </h3>
                                            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>This action cannot be undone</p>
                                        </div>
                                        <div style={{ background: '#f9fafb', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
                                            {[
                                                { label: 'Mill',        value: deleteItem.Ac_Name_E || deleteItem.Short_Name || '—' },
                                                { label: 'Grade · Season', value: `${deleteItem.gradeName || '—'} · ${deleteItem.season || '—'}` },
                                                { label: 'Total Qty',   value: `${parseFloat(deleteItem.Buyer_Quantal || 0).toFixed(2)} Qtl` },
                                                ...(hasSold ? [{ label: 'Already Sold', value: `${parseFloat(deleteItem.Sold).toFixed(2)} Qtl`, warn: true }] : []),
                                            ].map(({ label, value, warn }) => (
                                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6, marginBottom: 6, borderBottom: '1px solid #f3f4f6' }}>
                                                    <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{label}</span>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: warn ? '#d97706' : '#374151' }}>{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <p style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, marginBottom: 16, textAlign: 'center', lineHeight: 1.5 }}>
                                            {hasSold
                                                ? <><strong style={{ color: '#d97706' }}>{parseFloat(deleteItem.Sold).toFixed(2)} Qtl</strong> already sold. Record will be reduced to sold quantity; unsold stock will be released.</>
                                                : 'Are you sure you want to permanently delete this eSale record?'}
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            <button onClick={() => setDeleteItem(null)}
                                                style={{ padding: '12px', background: '#f3f4f6', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
                                                Cancel
                                            </button>
                                            <button onClick={handleDelete} disabled={isDeleting}
                                                style={{ padding: '12px', background: isDeleting ? '#fca5a5' : hasSold ? '#f59e0b' : '#ef4444', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 800, color: 'white', cursor: isDeleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                {isDeleting
                                                    ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />…</>
                                                    : hasSold ? 'Reduce & Delete' : '🗑 Delete'}
                                            </button>
                                        </div>
                                    </>
                                );
                            })()}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes wsping { 0%,100% { opacity: 1; box-shadow: 0 0 6px #4ade80; } 50% { opacity: 0.45; box-shadow: 0 0 3px #4ade80; } }
            `}</style>
        </AppLayout>
    );
}
