'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';
import { useGetMyOrdersQuery } from '../../services/myOrdersApi';
import {
    useGetMyPendingOrdersQuery,
    useCreatePendingDeliveryOrderMutation,
    useUpdatePendingDeliveryOrderMutation,
    useSoftDeletePendingDeliveryOrderMutation,
    useGetLiveBalanceQuery,
} from '../../services/pendingDeliveryOrderApi';
import { useGetMeQuery } from '../../services/authApi';
import { useGetMyAccountQuery } from '../../services/accountMasterApi';
import GstAccountPicker from '../../components/GstAccountPicker';

const COMPANY_CODE = parseInt(process.env.NEXT_PUBLIC_COMPANY_CODE) || 4;
const YEAR_CODE    = parseInt(process.env.NEXT_PUBLIC_YEAR_CODE)    || 1;

const fmtDate = (v) => {
    if (!v) return '—';
    const s = String(v).trim();
    const dmy = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    if (dmy) return `${dmy[1]}-${dmy[2]}-${dmy[3]}`;
    const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymd) return `${ymd[3]}-${ymd[2]}-${ymd[1]}`;
    return s.slice(0, 10);
};
// Converts any date format → YYYY-MM-DD for API payloads
const toApiDate = (v) => {
    if (!v) return null;
    const s = String(v).trim();
    const dmy = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
    const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
    try { const d = new Date(v); return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]; } catch { return null; }
};
const fmtQty = (v) => parseFloat(v || 0).toFixed(2);
const gradeFirst = (v) => v ? v.split(' - ')[0].trim() : '—';
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

const inputStyle = {
    width: '100%', padding: '11px 12px', background: '#f9fafb',
    border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14,
    fontWeight: 600, color: '#111827', outline: 'none', fontFamily: 'inherit',
};

function OrderCard({ order, index, onCreateDO }) {
    const isPending = parseFloat(order.BALANCE || 0) > 0;
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.4), type: 'spring', stiffness: 300, damping: 25 }}
            style={{ background: 'white', borderRadius: 16, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6', marginBottom: 10 }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#111827', marginBottom: 3 }}>
                        {order.Mill_Code ? `${order.Mill_Code} | ${order.millshortname || ''}` : order.millshortname || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>
                        {fmtDate(order.Sauda_Date)} · {gradeFirst(order.Grade)} · {order.season || ''}
                    </div>
                </div>
                <span style={{
                    fontSize: 11, fontWeight: 800, borderRadius: 8, padding: '4px 10px',
                    background: isPending ? '#fff7ed' : '#f0fdf4',
                    color: isPending ? '#c2410c' : '#15803d',
                    border: `1px solid ${isPending ? '#fed7aa' : '#bbf7d0'}`,
                    flexShrink: 0, marginLeft: 8,
                }}>
                    {isPending ? 'Pending' : 'Done'}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
                {[
                    { label: 'Purchase', value: fmtQty(order.Buyer_Quantal) + ' qtl', color: '#374151' },
                    { label: 'Dispatched', value: fmtQty(order.DESPATCH) + ' qtl', color: '#059669' },
                    { label: 'In Transit', value: fmtQty(order.inTransit) + ' qtl', color: '#f59e0b' },
                    { label: 'Balance', value: fmtQty(order.BALANCE) + ' qtl', color: isPending ? '#c2410c' : '#059669' },
                    { label: 'Rate', value: order.Sale_Rate ? `₹${parseFloat(order.Sale_Rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—', color: '#2563eb' },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: '7px 6px', textAlign: 'center' }}>
                        <p style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>{label}</p>
                        <p style={{ fontSize: 11, fontWeight: 800, color }}>{value}</p>
                    </div>
                ))}
            </div>

            {order.Lifting_DateConverted && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
                    Lifting: {fmtDate(order.Lifting_DateConverted)}
                </div>
            )}

            {isPending && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => onCreateDO(order)}
                        style={{ padding: '7px 14px', background: 'linear-gradient(135deg,#ef3837,#dc2626)', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, color: 'white', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 2px 8px rgba(239,56,55,0.3)' }}>
                        🚚 Create DO
                    </motion.button>
                </div>
            )}
        </motion.div>
    );
}

function PendingDOCard({ order, index, onEdit, onDelete }) {
    const isDel = !!order.isDeleted;
    const isLocked = !!order.isLocked && !isDel;
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.4), type: 'spring', stiffness: 300, damping: 25 }}
            style={{ background: 'white', borderRadius: 16, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6', marginBottom: 10, opacity: isDel ? 0.55 : 1 }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#111827', marginBottom: 3, textDecoration: isDel ? 'line-through' : 'none' }}>
                        {order.mill_short || order.mill_name || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>
                        DO #{order.pendingDoid} · {gradeFirst(order.Grade)} · {order.Season || ''}
                    </div>
                </div>
                <span style={{
                    fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '3px 9px',
                    background: isDel ? '#fef2f2' : isLocked ? '#fffbeb' : '#eff6ff',
                    color: isDel ? '#dc2626' : isLocked ? '#d97706' : '#2563eb',
                    border: `1px solid ${isDel ? '#fecaca' : isLocked ? '#fde68a' : '#bfdbfe'}`,
                    flexShrink: 0, marginLeft: 8,
                }}>
                    {isDel ? 'Deleted' : isLocked ? 'Locked' : 'Pending'}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                {[
                    { label: 'Lifting Qty', value: fmtQty(order.Lifting_Quintal) + ' qtl' },
                    { label: 'Rate', value: order.Sale_Rate ? `₹${parseFloat(order.Sale_Rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—' },
                    { label: 'Created', value: fmtDate(order.Created_Date) },
                ].map(({ label, value }) => (
                    <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: '7px 8px' }}>
                        <p style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>{label}</p>
                        <p style={{ fontSize: 11, fontWeight: 800, color: '#111827' }}>{value}</p>
                    </div>
                ))}
            </div>

            {(order.TruckNo || order.DriverMobileNo) && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {order.TruckNo && (
                        <span style={{ fontSize: 11, fontWeight: 700, background: '#fef9c3', color: '#92400e', borderRadius: 6, padding: '2px 8px' }}>🚚 {order.TruckNo}</span>
                    )}
                    {order.DriverMobileNo && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>📱 {order.DriverMobileNo}</span>
                    )}
                </div>
            )}

            {!isDel && !isLocked && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button onClick={() => onEdit(order)}
                        style={{ flex: 1, padding: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#2563eb', cursor: 'pointer', fontFamily: 'inherit' }}>✏️ Edit</button>
                    <button onClick={() => onDelete(order)}
                        style={{ flex: 1, padding: '8px', background: '#fff1f0', border: '1px solid #fecaca', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit' }}>🗑 Delete</button>
                </div>
            )}
        </motion.div>
    );
}

export default function MyOrdersPage() {
    const [tab, setTab] = useState('orders');
    const [pendingOnly, setPendingOnly] = useState(true);
    const [doDate, setDoDate] = useState({ from: todayStr(), to: todayStr() });
    const [activeDoPreset, setActiveDoPreset] = useState('Today');

    const [selectedOrderForDO, setSelectedOrderForDO] = useState(null);
    const emptyDOForm = { Lifting_Quintal: '', DOc_Date: todayStr(), TruckNo: '', DriverMobileNo: '', Narration: '', Amount: '', Payment_Details: '' };
    const [doForm, setDoForm] = useState(emptyDOForm);
    const [doErrors, setDoErrors] = useState({});
    const [doToast, setDoToast] = useState({ show: false, message: '', type: 'error' });

    const { data: user } = useGetMeQuery();
    const isAdmin = user?.Ac_type === 'Z';
    const effectivePendingOnly = isAdmin ? true : pendingOnly;

    const { data: orders = [], isLoading: ordersLoading, refetch: refetchOrders } =
        useGetMyOrdersQuery(effectivePendingOnly);

    const { data: pendingDOs = [], isLoading: doLoading } =
        useGetMyPendingOrdersQuery(
            { company_code: COMPANY_CODE, from_date: doDate.from, to_date: doDate.to },
            { skip: tab !== 'pending' }
        );

    const { data: myAccount } = useGetMyAccountQuery(COMPANY_CODE, { skip: !user });
    const { data: liveBalData } = useGetLiveBalanceQuery(
        selectedOrderForDO?.tenderdetailid,
        { skip: !selectedOrderForDO }
    );
    const liveBalance = liveBalData?.available ?? (selectedOrderForDO ? parseFloat(selectedOrderForDO.BALANCE || 0) : 0);
    const [createDO, { isLoading: isCreatingDO }] = useCreatePendingDeliveryOrderMutation();
    const [updateDO, { isLoading: isUpdatingDO }] = useUpdatePendingDeliveryOrderMutation();
    const [deleteDO, { isLoading: isDeletingDO }] = useSoftDeletePendingDeliveryOrderMutation();

    const [editDOItem, setEditDOItem] = useState(null);
    const [editDOForm, setEditDOForm] = useState({});
    const [editDOErrors, setEditDOErrors] = useState({});
    const [deleteDOItem, setDeleteDOItem] = useState(null);

    // Bill To / Ship To — Create DO
    const [billTo, setBillTo] = useState(null);
    const [shipTo, setShipTo] = useState(null);
    const [billShipSame, setBillShipSame] = useState(false);

    // Bill To / Ship To — Edit DO
    const [editBillTo, setEditBillTo] = useState(null);
    const [editShipTo, setEditShipTo] = useState(null);
    const [editBillShipSame, setEditBillShipSame] = useState(false);

    const pendingCnt = orders.filter(o => parseFloat(o.BALANCE || 0) > 0).length;
    const totalQty = useMemo(() => orders.reduce((s, o) => s + parseFloat(o.Buyer_Quantal || 0), 0), [orders]);

    const showDoToast = (msg, type = 'error') => {
        setDoToast({ show: true, message: msg, type });
        setTimeout(() => setDoToast(p => ({ ...p, show: false })), 3500);
    };

    const buildAccountFromMyAccount = (acc) => acc ? {
        Ac_Code:      acc.Ac_Code,
        accoid:       acc.accoid,
        Ac_Name_E:    acc.Ac_Name_E,
        Gst_No:       acc.Gst_No       || null,
        cityname:     acc.cityname      || null,
        State_Name:   acc.State_Name    || null,
        Address_E:    acc.Address_E     || null,
        GSTStateCode: acc.GSTStateCode  || null,
    } : null;

    const handleBillToSelect = (account) => {
        setBillTo(account);
        if (billShipSame) setShipTo(account);
    };
    const handleBillShipSameToggle = (checked) => {
        setBillShipSame(checked);
        if (checked && billTo) setShipTo(billTo);
    };

    const handleEditBillToSelect = (account) => {
        setEditBillTo(account);
        if (editBillShipSame) setEditShipTo(account);
    };
    const handleEditBillShipSameToggle = (checked) => {
        setEditBillShipSame(checked);
        if (checked && editBillTo) setEditShipTo(editBillTo);
    };

    const openEditDO = (order) => {
        setEditDOItem(order);
        setEditDOForm({
            Lifting_Quintal: order.Lifting_Quintal || '',
            TruckNo: order.TruckNo || '',
            DriverMobileNo: order.DriverMobileNo || '',
            DOc_Date: order.DOc_Date ? order.DOc_Date.split('T')[0] : todayStr(),
        });
        setEditDOErrors({});
        const acct = buildAccountFromMyAccount(myAccount);
        setEditBillTo(acct);
        setEditShipTo(acct);
        setEditBillShipSame(false);
    };

    const handleEditDO = async () => {
        const errs = {};
        const lq = parseFloat(editDOForm.Lifting_Quintal);
        if (!editDOForm.Lifting_Quintal) errs.Lifting_Quintal = 'Required';
        else if (isNaN(lq) || lq <= 0) errs.Lifting_Quintal = 'Must be > 0';
        else if (lq % 5 !== 0) errs.Lifting_Quintal = 'Must be multiple of 5';
        if (Object.keys(errs).length > 0) { setEditDOErrors(errs); return; }
        setEditDOErrors({});
        try {
            await updateDO({
                pendingDoid:      editDOItem.pendingDoid,
                Lifting_Quintal:  lq,
                TruckNo:          editDOForm.TruckNo || '',
                DriverMobileNo:   editDOForm.DriverMobileNo || '',
                DOc_Date:         editDOForm.DOc_Date,
                BillTo_Ac_Code:   editBillTo?.Ac_Code  ?? null,
                BillTo_Accoid:    editBillTo?.accoid    ?? null,
                ShipTo_Ac_Code:   editShipTo?.Ac_Code  ?? null,
                ShipTo_Accoid:    editShipTo?.accoid    ?? null,
            }).unwrap();
            setEditDOItem(null);
            showDoToast('Delivery Order updated!', 'success');
        } catch (err) {
            const detail = err?.data?.detail;
            let msg = 'Failed to update DO';
            if (typeof detail === 'string') msg = detail;
            showDoToast(msg, 'error');
        }
    };

    const handleDeleteDO = async () => {
        if (!deleteDOItem) return;
        try {
            await deleteDO(deleteDOItem.pendingDoid).unwrap();
            setDeleteDOItem(null);
            showDoToast('Delivery Order deleted!', 'success');
        } catch (err) {
            const detail = err?.data?.detail;
            let msg = 'Failed to delete DO';
            if (typeof detail === 'string') msg = detail;
            showDoToast(msg, 'error');
        }
    };

    const handleOpenDO = (order) => {
        setSelectedOrderForDO(order);
        setDoForm({ ...emptyDOForm, DOc_Date: todayStr(), Lifting_Quintal: fmtQty(parseFloat(order.BALANCE || 0)) });
        setDoErrors({});
        const acct = buildAccountFromMyAccount(myAccount);
        setBillTo(acct);
        setShipTo(acct);
        setBillShipSame(false);
    };

    const handleCreateDO = async () => {
        const errs = {};
        const lq = parseFloat(doForm.Lifting_Quintal);
        if (!doForm.Lifting_Quintal) errs.Lifting_Quintal = 'Required';
        else if (isNaN(lq) || lq <= 0) errs.Lifting_Quintal = 'Must be > 0';
        else if (lq % 5 !== 0) errs.Lifting_Quintal = 'Must be a multiple of 5';
        else if (liveBalance > 0 && lq > liveBalance) errs.Lifting_Quintal = `Max ${liveBalance.toFixed(2)} qtl available`;
        if (!doForm.DOc_Date) errs.DOc_Date = 'Required';
        if (doForm.DriverMobileNo && doForm.DriverMobileNo.length !== 10) errs.DriverMobileNo = `Must be 10 digits (${doForm.DriverMobileNo.length} entered)`;
        if (!billTo) errs.billTo = 'Bill To account is required';
        if (!shipTo) errs.shipTo = 'Ship To account is required';
        if (Object.keys(errs).length > 0) { setDoErrors(errs); return; }
        setDoErrors({});

        const order = selectedOrderForDO;
        const payload = {
            tenderdetailid: order.tenderdetailid,
            tenderid: order.tenderid || 0,
            company_code: COMPANY_CODE,
            Year_Code: YEAR_CODE,
            gradeid: order.gradeid || 0,
            gradeCode: order.gradeCode || '',
            Mill_Code: order.Mill_Code || 0,
            mc: order.mc || 0,
            Item_Code: order.Item_Code || order.itemcode || 0,
            ic: order.ic || 0,
            Gst_Code: order.Gst_Code ? parseInt(order.Gst_Code) : null,
            Approved: 'N',
            DOc_Date: doForm.DOc_Date,
            Sauda_Date: toApiDate(order.Sauda_Date) || doForm.DOc_Date,
            Lifting_Date: toApiDate(order.Lifting_DateConverted || order.Lifting_Date) || doForm.DOc_Date,
            Grade: order.Grade || '',
            Season: order.season || '',
            Sale_Rate: parseFloat(order.Sale_Rate || 0),
            Purchase_Quintal: parseFloat(order.Buyer_Quantal || 0),
            Lifting_Quintal: lq,
            Amount: doForm.Amount !== '' ? parseFloat(doForm.Amount) : lq * parseFloat(order.Sale_Rate || 0),
            Narration: doForm.Narration.trim() || '',
            TruckNo: doForm.TruckNo.trim() || '',
            DriverMobileNo: doForm.DriverMobileNo.trim() || '',
            Payment_Details: doForm.Payment_Details.trim() || '',
            target_buyer_code: myAccount?.Ac_Code || '',
            BillTo_Ac_Code:    billTo?.Ac_Code  ?? myAccount?.Ac_Code ?? '',
            BillTo_Accoid:     billTo?.accoid    ?? myAccount?.accoid  ?? 0,
            ShipTo_Ac_Code:    shipTo?.Ac_Code  ?? myAccount?.Ac_Code ?? '',
            ShipTo_Accoid:     shipTo?.accoid    ?? myAccount?.accoid  ?? 0,
        };

        try {
            await createDO(payload).unwrap();
            showDoToast('Delivery Order created successfully!', 'success');
            setSelectedOrderForDO(null);
        } catch (err) {
            const detail = err?.data?.detail;
            let msg = 'Failed to create Delivery Order';
            if (typeof detail === 'string') msg = detail;
            else if (Array.isArray(detail)) msg = detail[0]?.msg || msg;
            showDoToast(msg, 'error');
        }
    };

    return (
        <AppLayout title="My Orders">
            <AnimatePresence>
                {doToast.show && (
                    <motion.div initial={{ opacity: 0, y: -60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -60 }}
                        style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 14, fontWeight: 700, fontSize: 14, background: doToast.type === 'success' ? '#059669' : '#ef4444', color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}>
                        {doToast.type === 'success' ? '✓' : '✕'} {doToast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ padding: '12px 16px', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>

                {/* Tab bar */}
                <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 14, padding: 4, marginBottom: 16 }}>
                    {[
                        { id: 'orders', label: isAdmin ? 'All Orders' : 'My Orders', icon: '📦' },
                        { id: 'pending', label: 'Pending DOs', icon: '🚚' },
                    ].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            style={{ flex: 1, padding: '10px 8px', border: 'none', cursor: 'pointer', borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s', background: tab === t.id ? 'white' : 'transparent', color: tab === t.id ? '#ef3837' : '#6b7280', boxShadow: tab === t.id ? '0 1px 6px rgba(0,0,0,0.08)' : 'none' }}>
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {/* ── My Orders tab ── */}
                {tab === 'orders' && (
                    <>
                        {!isAdmin && (
                            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                                {[
                                    { id: false, label: 'All Orders' },
                                    { id: true, label: 'Pending Only' },
                                ].map(opt => (
                                    <button key={String(opt.id)} onClick={() => setPendingOnly(opt.id)}
                                        style={{ flex: 1, padding: '9px 12px', border: `2px solid ${pendingOnly === opt.id ? '#ef3837' : '#e5e7eb'}`, cursor: 'pointer', borderRadius: 10, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', background: pendingOnly === opt.id ? '#fff1f0' : 'white', color: pendingOnly === opt.id ? '#ef3837' : '#6b7280', transition: 'all 0.2s' }}>
                                        {opt.label}
                                        {opt.id === true && pendingCnt > 0 && <span style={{ marginLeft: 6, background: '#ef3837', color: 'white', borderRadius: 10, padding: '1px 6px', fontSize: 10 }}>{pendingCnt}</span>}
                                    </button>
                                ))}
                            </div>
                        )}

                        {!ordersLoading && orders.length > 0 && (
                            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                                <div style={{ flex: 1, background: 'white', borderRadius: 12, padding: '10px 14px', border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                                    <p style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>Total Orders</p>
                                    <p style={{ fontWeight: 900, fontSize: 18, color: '#111827' }}>{orders.length}</p>
                                </div>
                                <div style={{ flex: 1, background: 'white', borderRadius: 12, padding: '10px 14px', border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                                    <p style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>Total Qty</p>
                                    <p style={{ fontWeight: 900, fontSize: 18, color: '#2563eb' }}>{fmtQty(totalQty)} qtl</p>
                                </div>
                                <div style={{ flex: 1, background: 'white', borderRadius: 12, padding: '10px 14px', border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                                    <p style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>Pending</p>
                                    <p style={{ fontWeight: 900, fontSize: 18, color: '#c2410c' }}>{pendingCnt}</p>
                                </div>
                            </div>
                        )}

                        {ordersLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{ background: 'white', borderRadius: 16, padding: 16 }}>
                                        <div className="skeleton" style={{ height: 16, width: '55%', marginBottom: 8 }} />
                                        <div className="skeleton" style={{ height: 12, width: '35%', marginBottom: 14 }} />
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
                                            {[1,2,3,4,5].map(j => <div key={j} className="skeleton" style={{ height: 40, borderRadius: 8 }} />)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : orders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                                <p style={{ fontWeight: 700, color: '#374151', marginBottom: 4 }}>No orders found</p>
                                <p style={{ color: '#9ca3af', fontSize: 13 }}>Your orders will appear here after purchase.</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <p style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
                                    <button onClick={refetchOrders} style={{ background: 'none', border: 'none', color: '#ef3837', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>↻ Refresh</button>
                                </div>
                                {orders.map((order, i) => <OrderCard key={order.tenderdetailid ?? i} order={order} index={i} onCreateDO={handleOpenDO} />)}
                            </>
                        )}
                    </>
                )}

                {/* ── Pending DOs tab ── */}
                {tab === 'pending' && (
                    <>
                        <div style={{ background: 'white', borderRadius: 14, padding: '12px 14px', marginBottom: 14, border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto', paddingBottom: 2 }}>
                                {[
                                    { label: 'Today', from: todayStr(), to: todayStr() },
                                    { label: 'Last 7D', from: (() => { const d = new Date(); d.setDate(d.getDate()-6); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(), to: todayStr() },
                                    { label: 'This Month', from: (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-01`; })(), to: todayStr() },
                                    { label: 'Last Month', from: (() => { const d = new Date(new Date().getFullYear(), new Date().getMonth()-1, 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`; })(), to: (() => { const d = new Date(new Date().getFullYear(), new Date().getMonth(), 0); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })() },
                                ].map(p => (
                                    <button key={p.label} onClick={() => { setDoDate({ from: p.from, to: p.to }); setActiveDoPreset(p.label); }}
                                        style={{ flexShrink: 0, padding: '7px 13px', background: activeDoPreset === p.label ? '#fff1f0' : '#f3f4f6', border: `1.5px solid ${activeDoPreset === p.label ? '#ef3837' : 'transparent'}`, borderRadius: 20, fontSize: 11, fontWeight: 700, color: activeDoPreset === p.label ? '#ef3837' : '#374151', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {['from', 'to'].map(key => (
                                    <div key={key}>
                                        <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 5 }}>{key === 'from' ? 'From Date' : 'To Date'}</label>
                                        <input type="date" value={doDate[key]} onChange={e => { setDoDate(p => ({ ...p, [key]: e.target.value })); setActiveDoPreset(null); }}
                                            style={{ width: '100%', padding: '10px 12px', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#111827' }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {doLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{ background: 'white', borderRadius: 16, padding: 16 }}>
                                        <div className="skeleton" style={{ height: 16, width: '55%', marginBottom: 8 }} />
                                        <div className="skeleton" style={{ height: 12, width: '35%', marginBottom: 14 }} />
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                                            {[1,2,3].map(j => <div key={j} className="skeleton" style={{ height: 40, borderRadius: 8 }} />)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : pendingDOs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 20, border: '1.5px dashed #e5e7eb' }}>
                                <div style={{ fontSize: 48, marginBottom: 12 }}>🚚</div>
                                <p style={{ fontWeight: 700, color: '#374151', marginBottom: 4 }}>No pending DOs</p>
                                <p style={{ color: '#9ca3af', fontSize: 13 }}>No delivery orders found for the selected period.</p>
                            </div>
                        ) : (
                            <>
                                <p style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 10 }}>{pendingDOs.length} delivery order{pendingDOs.length !== 1 ? 's' : ''}</p>
                                {pendingDOs.map((order, i) => <PendingDOCard key={order.pendingDoid ?? i} order={order} index={i} onEdit={openEditDO} onDelete={setDeleteDOItem} />)}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* ── Create DO bottom-sheet modal ── */}
            <AnimatePresence>
                {selectedOrderForDO && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrderForDO(null)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }} />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 70, background: 'white', borderRadius: '20px 20px 0 0', padding: '20px 20px 36px', maxHeight: '92vh', overflowY: 'auto', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>

                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                                <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e5e7eb' }} />
                            </div>

                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div>
                                    <h3 style={{ fontWeight: 900, fontSize: 17, color: '#111827', margin: 0 }}>Create Delivery Order</h3>
                                    <p style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, marginTop: 3 }}>
                                        {selectedOrderForDO.millshortname || selectedOrderForDO.Mill_Code} · Order #{selectedOrderForDO.tenderdetailid}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedOrderForDO(null)}
                                    style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>×</button>
                            </div>

                            {/* Qty cards (Purchase / Dispatched / Balance) */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                                {[
                                    { label: 'Purchase', value: fmtQty(selectedOrderForDO.Buyer_Quantal), bg: '#eef2ff', border: '#c7d2fe', color: '#3730a3' },
                                    { label: 'Dispatched', value: fmtQty(selectedOrderForDO.DESPATCH), bg: '#f0fdf4', border: '#bbf7d0', color: '#14532d' },
                                    { label: 'Balance', value: fmtQty(liveBalance), bg: '#fffbeb', border: '#fde68a', color: '#92400e' },
                                ].map(c => (
                                    <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                                        <p style={{ fontSize: 9, fontWeight: 800, color: c.color, textTransform: 'uppercase', margin: '0 0 3px' }}>{c.label}</p>
                                        <p style={{ fontSize: 15, fontWeight: 900, color: c.color, margin: 0 }}>{c.value}</p>
                                        <p style={{ fontSize: 9, fontWeight: 600, color: '#9ca3af', margin: 0 }}>Quintal</p>
                                    </div>
                                ))}
                            </div>

                            {/* Order Information (read-only) */}
                            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
                                <p style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Order Information</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    {[
                                        { label: 'Sauda Date', value: fmtDate(selectedOrderForDO.Sauda_Date) },
                                        { label: 'Lifting Date', value: fmtDate(selectedOrderForDO.Lifting_DateConverted || selectedOrderForDO.Lifting_Date) },
                                        { label: 'Grade', value: gradeFirst(selectedOrderForDO.Grade) },
                                        { label: 'Season', value: selectedOrderForDO.season || '—' },
                                    ].map(({ label, value }) => (
                                        <div key={label}>
                                            <p style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>{label}</p>
                                            <p style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{value}</p>
                                        </div>
                                    ))}
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <p style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>Sale Rate</p>
                                        <p style={{ fontSize: 13, fontWeight: 900, color: '#2563eb' }}>₹{parseFloat(selectedOrderForDO.Sale_Rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}/Qtl</p>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Details */}
                            <p style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Delivery Details</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>DO Date <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input type="date" value={doForm.DOc_Date}
                                        onChange={e => setDoForm(f => ({ ...f, DOc_Date: e.target.value }))}
                                        onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.background = 'white'; }} onBlur={e => { e.target.style.borderColor = doErrors.DOc_Date ? '#ef4444' : '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                                        style={{ ...inputStyle, borderColor: doErrors.DOc_Date ? '#ef4444' : '#e5e7eb' }} />
                                    {doErrors.DOc_Date && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>⚠ {doErrors.DOc_Date}</p>}
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Lifting Qty (qtl) <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input type="number" value={doForm.Lifting_Quintal} placeholder="Multiple of 5"
                                        min="0" step="5"
                                        onChange={e => setDoForm(f => ({ ...f, Lifting_Quintal: e.target.value }))}
                                        onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.background = 'white'; }} onBlur={e => { e.target.style.borderColor = doErrors.Lifting_Quintal ? '#ef4444' : '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                                        style={{ ...inputStyle, borderColor: doErrors.Lifting_Quintal ? '#ef4444' : '#e5e7eb' }} />
                                    {doErrors.Lifting_Quintal
                                        ? <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>⚠ {doErrors.Lifting_Quintal}</p>
                                        : <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 3, fontWeight: 600 }}>Multiple of 5 · Max: {fmtQty(liveBalance)} qtl</p>
                                    }
                                </div>
                            </div>

                            {/* Amount calculation display */}
                            {doForm.Lifting_Quintal && !isNaN(parseFloat(doForm.Lifting_Quintal)) && parseFloat(doForm.Lifting_Quintal) > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                                    {[
                                        { label: 'Lifting Qty', value: `${fmtQty(parseFloat(doForm.Lifting_Quintal))} Qtl`, color: '#111827' },
                                        { label: 'Sale Rate', value: `₹${parseFloat(selectedOrderForDO.Sale_Rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}/Qtl`, color: '#065f46' },
                                        { label: 'Total', value: `₹${(parseFloat(doForm.Lifting_Quintal) * parseFloat(selectedOrderForDO.Sale_Rate || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#1e40af' },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} style={{ background: '#f8f9fb', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px' }}>
                                            <p style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 3 }}>{label}</p>
                                            <p style={{ fontSize: 11, fontWeight: 800, color }}>{value}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ marginBottom: 14 }}>
                                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Note / Narration</label>
                                <input type="text" value={doForm.Narration} placeholder="Optional remarks…"
                                    onChange={e => setDoForm(f => ({ ...f, Narration: e.target.value }))}
                                    onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.background = 'white'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                                    style={inputStyle} />
                            </div>

                            {/* Payment Details */}
                            <p style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Payment Details</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Amount ₹</label>
                                    <input type="number" value={doForm.Amount} placeholder="Optional"
                                        min="0" step="1"
                                        onChange={e => setDoForm(f => ({ ...f, Amount: e.target.value }))}
                                        onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.background = 'white'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                                        style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Payment Details (UTR / Reference)</label>
                                    <textarea value={doForm.Payment_Details} placeholder="Enter UTR, bank reference, payment mode…"
                                        rows={2}
                                        onChange={e => setDoForm(f => ({ ...f, Payment_Details: e.target.value }))}
                                        onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.background = 'white'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                                        style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} />
                                </div>
                            </div>

                            {/* Transport Details */}
                            <p style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Transport Details</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Truck / Vehicle No</label>
                                    <input type="text" value={doForm.TruckNo} placeholder="MH09AA1234"
                                        onChange={e => setDoForm(f => ({ ...f, TruckNo: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                                        onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.background = 'white'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                                        style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.06em' }} maxLength={15} />
                                    <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 3, fontWeight: 600 }}>Uppercase · Letters &amp; numbers only</p>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Driver Mobile No</label>
                                    <input type="tel" value={doForm.DriverMobileNo} placeholder="10-digit number"
                                        onChange={e => setDoForm(f => ({ ...f, DriverMobileNo: e.target.value.replace(/\D/g, '') }))}
                                        onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.background = 'white'; }} onBlur={e => { e.target.style.borderColor = doErrors.DriverMobileNo ? '#ef4444' : '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                                        style={{ ...inputStyle, borderColor: doErrors.DriverMobileNo ? '#ef4444' : '#e5e7eb' }} maxLength={10} inputMode="numeric" />
                                    {doForm.DriverMobileNo && doForm.DriverMobileNo.length !== 10
                                        ? <p style={{ fontSize: 10, color: '#ef4444', marginTop: 3, fontWeight: 600 }}>Must be 10 digits ({doForm.DriverMobileNo.length}/10)</p>
                                        : <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 3, fontWeight: 600 }}>Exactly 10 digits</p>
                                    }
                                </div>
                            </div>

                            {/* Bill To & Ship To Same toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f0f4ff', borderRadius: 10, border: '1.5px solid #c7d2fe', marginBottom: 12 }}>
                                <input type="checkbox" id="do-bill-ship-same" checked={billShipSame} onChange={e => handleBillShipSameToggle(e.target.checked)}
                                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#7c3aed', flexShrink: 0 }} />
                                <label htmlFor="do-bill-ship-same" style={{ fontSize: 13, fontWeight: 700, color: '#374151', cursor: 'pointer', userSelect: 'none', margin: 0 }}>
                                    Bill To &amp; Ship To are Same
                                </label>
                            </div>

                            {/* Bill To */}
                            <div style={{ background: '#f9fafb', border: `1.5px solid ${doErrors.billTo ? '#fecaca' : '#e5e7eb'}`, borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
                                <p style={{ fontSize: 10, fontWeight: 800, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    Bill To
                                    {!billTo && <span style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700 }}>⚠ Required</span>}
                                    {billTo && <span style={{ color: '#15803d', fontSize: 10, fontWeight: 700 }}>✓</span>}
                                </p>
                                <GstAccountPicker selected={billTo} onSelect={handleBillToSelect} yearCode={selectedOrderForDO?.Year_Code} />
                                {doErrors.billTo && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 6, fontWeight: 600 }}>⚠ {doErrors.billTo}</p>}
                            </div>

                            {/* Ship To */}
                            <div style={{ background: '#f9fafb', border: `1.5px solid ${doErrors.shipTo ? '#fecaca' : '#e5e7eb'}`, borderRadius: 12, padding: '12px 14px', marginBottom: 16, opacity: billShipSame ? 0.65 : 1, pointerEvents: billShipSame ? 'none' : 'auto' }}>
                                <p style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    Ship To
                                    {billShipSame
                                        ? <span style={{ color: '#6366f1', fontSize: 10, fontWeight: 700 }}>↑ Same as Bill To</span>
                                        : !shipTo
                                            ? <span style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700 }}>⚠ Required</span>
                                            : <span style={{ color: '#15803d', fontSize: 10, fontWeight: 700 }}>✓</span>
                                    }
                                </p>
                                <GstAccountPicker selected={shipTo} onSelect={setShipTo} yearCode={selectedOrderForDO?.Year_Code} />
                                {doErrors.shipTo && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 6, fontWeight: 600 }}>⚠ {doErrors.shipTo}</p>}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <button onClick={() => setSelectedOrderForDO(null)}
                                    style={{ padding: '14px', background: '#f3f4f6', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
                                    Cancel
                                </button>
                                <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreateDO} disabled={isCreatingDO}
                                    style={{ padding: '14px', background: isCreatingDO ? '#93c5fd' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800, color: 'white', cursor: isCreatingDO ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    {isCreatingDO ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Creating...</> : '🚚 Create DO'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            {/* ── Edit DO bottom-sheet ── */}
            <AnimatePresence>
                {editDOItem && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setEditDOItem(null)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 80 }} />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 90, background: 'white', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px', maxHeight: '85vh', overflowY: 'auto', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                                <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e5e7eb' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <h3 style={{ fontWeight: 900, fontSize: 16, color: '#111827', margin: 0 }}>Edit Delivery Order</h3>
                                <button onClick={() => setEditDOItem(null)}
                                    style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>×</button>
                            </div>

                            {[
                                { label: 'Lifting Quantity (qtl) *', field: 'Lifting_Quintal', type: 'number', placeholder: 'Multiple of 5' },
                                { label: 'DO Date', field: 'DOc_Date', type: 'date', placeholder: '' },
                                { label: 'Truck No', field: 'TruckNo', type: 'text', placeholder: 'MH12AB1234' },
                                { label: 'Driver Mobile', field: 'DriverMobileNo', type: 'tel', placeholder: '9876543210' },
                            ].map(({ label, field, type, placeholder }) => (
                                <div key={field} style={{ marginBottom: 14 }}>
                                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</label>
                                    <input type={type} value={editDOForm[field] || ''} placeholder={placeholder}
                                        onChange={e => {
                                            const raw = e.target.value;
                                            setEditDOForm(f => ({ ...f, [field]: field === 'TruckNo' ? raw.toUpperCase().replace(/[^A-Z0-9]/g, '') : raw }));
                                        }}
                                        onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.background = 'white'; }}
                                        onBlur={e => { e.target.style.borderColor = editDOErrors[field] ? '#ef4444' : '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                                        style={{ ...inputStyle, borderColor: editDOErrors[field] ? '#ef4444' : '#e5e7eb', ...(field === 'TruckNo' ? { textTransform: 'uppercase', letterSpacing: '0.06em' } : {}) }} />
                                    {editDOErrors[field] && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>⚠ {editDOErrors[field]}</p>}
                                </div>
                            ))}

                            {/* Edit — Bill To & Ship To Same toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f0f4ff', borderRadius: 10, border: '1.5px solid #c7d2fe', marginBottom: 12 }}>
                                <input type="checkbox" id="edit-bill-ship-same" checked={editBillShipSame} onChange={e => handleEditBillShipSameToggle(e.target.checked)}
                                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#7c3aed', flexShrink: 0 }} />
                                <label htmlFor="edit-bill-ship-same" style={{ fontSize: 13, fontWeight: 700, color: '#374151', cursor: 'pointer', userSelect: 'none', margin: 0 }}>
                                    Bill To &amp; Ship To are Same
                                </label>
                            </div>

                            {/* Edit — Bill To */}
                            <div style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
                                <p style={{ fontSize: 10, fontWeight: 800, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    Bill To {editBillTo && <span style={{ color: '#15803d', fontSize: 10 }}>✓</span>}
                                </p>
                                <GstAccountPicker selected={editBillTo} onSelect={handleEditBillToSelect} yearCode={editDOItem?.Year_Code} />
                            </div>

                            {/* Edit — Ship To */}
                            <div style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', marginBottom: 16, opacity: editBillShipSame ? 0.65 : 1, pointerEvents: editBillShipSame ? 'none' : 'auto' }}>
                                <p style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    Ship To
                                    {editBillShipSame
                                        ? <span style={{ color: '#6366f1', fontSize: 10 }}>↑ Same as Bill To</span>
                                        : editShipTo && <span style={{ color: '#15803d', fontSize: 10 }}>✓</span>
                                    }
                                </p>
                                <GstAccountPicker selected={editShipTo} onSelect={setEditShipTo} yearCode={editDOItem?.Year_Code} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 6 }}>
                                <button onClick={() => setEditDOItem(null)}
                                    style={{ padding: '14px', background: '#f3f4f6', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                                <motion.button whileTap={{ scale: 0.97 }} onClick={handleEditDO} disabled={isUpdatingDO}
                                    style={{ padding: '14px', background: isUpdatingDO ? '#93c5fd' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800, color: 'white', cursor: isUpdatingDO ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    {isUpdatingDO ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Saving…</> : '💾 Save Changes'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Delete DO confirmation ── */}
            <AnimatePresence>
                {deleteDOItem && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setDeleteDOItem(null)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 80 }} />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 90, background: 'white', borderRadius: 20, padding: '24px 20px', width: 'calc(100% - 48px)', maxWidth: 360, fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>
                            <div style={{ textAlign: 'center', marginBottom: 18 }}>
                                <div style={{ fontSize: 40, marginBottom: 8 }}>🗑️</div>
                                <h3 style={{ fontWeight: 900, fontSize: 16, color: '#111827', marginBottom: 6 }}>Delete Delivery Order?</h3>
                                <p style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
                                    DO #{deleteDOItem.pendingDoid} for <strong>{deleteDOItem.mill_short || deleteDOItem.mill_name}</strong>?<br />
                                    This cannot be undone.
                                </p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <button onClick={() => setDeleteDOItem(null)}
                                    style={{ padding: '12px', background: '#f3f4f6', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                                <button onClick={handleDeleteDO} disabled={isDeletingDO}
                                    style={{ padding: '12px', background: isDeletingDO ? '#fca5a5' : '#ef4444', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 800, color: 'white', cursor: isDeletingDO ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    {isDeletingDO ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />…</> : '🗑 Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }`}</style>
        </AppLayout>
    );
}
