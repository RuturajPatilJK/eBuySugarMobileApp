'use client';
import { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/layout/AppLayout';
import { useGetMeQuery } from '../../services/authApi';
import { useGetSystemMasterHelpQuery, useGetAccountMastersLimitedQuery } from '../../services/accountMasterApi';
import { useCreateTenderMutation, useGetMaxTenderNoQuery } from '../../services/tenderApi';
import { myesalesaudaApi } from '../../services/myesalesaudaApi';

const COMPANY_CODE = parseInt(process.env.NEXT_PUBLIC_COMPANY_CODE) || 4;
const YEAR_CODE    = parseInt(process.env.NEXT_PUBLIC_YEAR_CODE)    || 1;
const today = new Date().toISOString().split('T')[0];

function Field({ label, children, error, required }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                {label}{required && <span style={{ color: '#ef3837' }}> *</span>}
            </label>
            {children}
            {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>⚠ {error}</p>}
        </div>
    );
}

function iStyle(focused, error) {
    return {
        width: '100%', padding: '12px 14px', background: 'white',
        border: `2px solid ${error ? '#ef4444' : focused ? '#7c3aed' : '#e5e7eb'}`,
        borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#111827',
        outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s',
        boxShadow: focused && !error ? '0 0 0 3px rgba(124,58,237,0.1)' : error ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
    };
}

function TextInput({ value, onChange, placeholder, type = 'text', readOnly, error }) {
    const [f, setF] = useState(false);
    return <input type={type} value={value || ''} onChange={e => onChange && onChange(e.target.value)} placeholder={placeholder} readOnly={readOnly}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{ ...iStyle(f, error), cursor: readOnly ? 'not-allowed' : 'text', background: readOnly ? '#f9fafb' : 'white' }} />;
}

function PickerInput({ value, onChange, options, placeholder, error }) {
    const [f, setF] = useState(false);
    return (
        <select value={value || ''} onChange={e => onChange(e.target.value)}
            onFocus={() => setF(true)} onBlur={() => setF(false)}
            style={{ ...iStyle(f, error), appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 36 }}>
            <option value="">{placeholder || 'Select…'}</option>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    );
}

function MillSearchInput({ value, onChange, accounts, error }) {
    const [query, setQuery]   = useState('');
    const [open, setOpen]     = useState(false);
    const [focused, setFocused] = useState(false);

    const filtered = useMemo(() => {
        if (!query.trim()) return accounts.slice(0, 40);
        const q = query.toLowerCase();
        return accounts.filter(a => (a.Ac_Name_E || '').toLowerCase().includes(q) || String(a.Ac_Code || '').includes(q)).slice(0, 40);
    }, [accounts, query]);

    const selected = accounts.find(a => a.Ac_Code === parseInt(value));

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ ...iStyle(focused || open, error), display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                onClick={() => { setOpen(o => !o); setFocused(true); }}>
                <span style={{ flex: 1, color: selected ? '#111827' : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14, fontWeight: selected ? 700 : 400 }}>
                    {selected ? `${selected.Ac_Code} — ${selected.Ac_Name_E}` : 'Search mill / account…'}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => { setOpen(false); setFocused(false); }} />
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 60, background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 240, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
                                <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Type to search…"
                                    style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                            </div>
                            <div style={{ overflowY: 'auto' }}>
                                {filtered.length === 0
                                    ? <p style={{ padding: '12px 14px', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>No results</p>
                                    : filtered.map(a => (
                                        <button key={a.Ac_Code} type="button"
                                            onClick={() => { onChange(a.Ac_Code, a.accoid); setOpen(false); setQuery(''); setFocused(false); }}
                                            style={{ width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: a.Ac_Code === parseInt(value) ? '#f5f3ff' : 'white', cursor: 'pointer', fontFamily: 'inherit', borderBottom: '1px solid #f9fafb' }}>
                                            <span style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', marginRight: 8 }}>{a.Ac_Code}</span>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{a.Ac_Name_E}</span>
                                        </button>
                                    ))
                                }
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function AddSalePage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { data: user } = useGetMeQuery();
    const { data: itemData = [] } = useGetSystemMasterHelpQuery({ SystemType: 'I', CompanyCode: COMPANY_CODE });
    const { data: gradeData = [] } = useGetSystemMasterHelpQuery({ SystemType: 'S', CompanyCode: COMPANY_CODE });
    const { data: accountData = [] } = useGetAccountMastersLimitedQuery();
    const { data: maxTenderNo } = useGetMaxTenderNoQuery(COMPANY_CODE);
    const [createTender, { isLoading: saving }] = useCreateTenderMutation();

    const [form, setForm] = useState({
        Tender_Date: today, Lifting_Date: today,
        Mill_Code: '', mc: 0,
        itemcode: '', ic: 0,
        Grade: '', gradeid: 0, gradeCode: 0,
        Quantal: '', Packing: '50', Mill_Rate: '', season: '',
        Payment_To: 0, pt: 0,
    });
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const itemOptions = useMemo(() => itemData.map(i => ({ value: i.Category_Code, label: `${i.Category_Code} – ${i.Category_Name}`, accoid: i.accoid })), [itemData]);
    const gradeOptions = useMemo(() => gradeData.map(g => ({ value: g.Category_Name, label: g.Category_Name, gradeid: g.accoid || 0, gradeCode: g.Category_Code || 0 })), [gradeData]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(p => ({ ...p, show: false })), 3500);
    };

    const set = field => val => setForm(f => ({ ...f, [field]: val }));

    const validate = () => {
        const e = {};
        if (!form.Mill_Code)        e.Mill_Code    = 'Mill is required';
        if (!form.itemcode)          e.itemcode     = 'Item is required';
        if (!form.Grade)             e.Grade        = 'Grade is required';
        if (!form.Lifting_Date)      e.Lifting_Date = 'Lifting date is required';
        if (!form.season?.trim())    e.season       = 'Season is required (e.g. 2024-25)';
        const q = parseFloat(form.Quantal);
        if (!form.Quantal)           e.Quantal      = 'Quantal is required';
        else if (isNaN(q) || q <= 0) e.Quantal      = 'Must be a positive number';
        else if (q % 5 !== 0)        e.Quantal      = 'Must be a multiple of 5';
        const r = parseFloat(form.Mill_Rate);
        if (!form.Mill_Rate)         e.Mill_Rate    = 'Sale rate is required';
        else if (isNaN(r) || r <= 0) e.Mill_Rate    = 'Must be > 0';
        const p = parseInt(form.Packing);
        if (!form.Packing)           e.Packing      = 'Packing is required';
        else if (isNaN(p) || p <= 0) e.Packing      = 'Must be > 0';
        return e;
    };

    const handleSubmit = async () => {
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); showToast('Please fix the errors below', 'error'); return; }
        setErrors({});
        const itemOpt = itemOptions.find(o => String(o.value) === String(form.itemcode));
        const payload = {
            Company_Code: COMPANY_CODE, Year_Code: YEAR_CODE,
            Tender_No: parseInt(maxTenderNo || 0),
            Tender_Date: form.Tender_Date, Lifting_Date: form.Lifting_Date,
            Mill_Code: parseInt(form.Mill_Code || 0), mc: parseInt(form.mc || 0),
            itemcode: parseInt(form.itemcode || 0), ic: itemOpt?.accoid || 0,
            Grade: form.Grade,
            Quantal: parseFloat(form.Quantal || 0),
            Packing: parseInt(form.Packing || 0),
            Mill_Rate: parseFloat(form.Mill_Rate || 0),
            season: form.season,
            Payment_To: 0, pt: 0,
            EbuySelectedParty: null, EbuySelectedAccoid: null,
            grade_details: form.gradeid ? [{
                gradeCode: form.gradeCode || 0,
                gradeid: form.gradeid,
                gradeRate: parseFloat(form.Mill_Rate || 0),
                Purchase_Rate: parseFloat(form.Mill_Rate || 0),
                rowaction: 'add',
            }] : [],
        };
        try {
            await createTender(payload).unwrap();
            dispatch(myesalesaudaApi.util.invalidateTags(['Myesalesauda']));
            showToast('Sale sauda created successfully!', 'success');
            setTimeout(() => router.replace('/my-esales'), 1200);
        } catch (err) {
            const detail = err?.data?.detail;
            let msg = 'Failed to create sauda';
            if (typeof detail === 'string') msg = detail;
            else if (Array.isArray(detail)) msg = detail[0]?.msg || msg;
            showToast(msg, 'error');
        }
    };

    const estAmt = parseFloat(form.Quantal) * parseFloat(form.Mill_Rate);

    return (
        <AppLayout title="New Sale Sauda" showBack>
            <AnimatePresence>
                {toast.show && (
                    <motion.div initial={{ opacity: 0, y: -60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -60 }}
                        style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 14, fontWeight: 700, fontSize: 14, background: toast.type === 'success' ? '#059669' : '#ef4444', color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', whiteSpace: 'nowrap', fontFamily: 'Signika, sans-serif' }}>
                        {toast.type === 'success' ? '✓' : '✕'} {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ padding: '12px 16px 100px', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', borderRadius: 16, padding: '14px 16px', marginBottom: 18, boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>TENDER #{parseInt(maxTenderNo || 0)}</p>
                    <p style={{ color: 'white', fontSize: 18, fontWeight: 900 }}>Create eSale Sauda</p>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>Fill all required fields to list your sugar for sale</p>
                </motion.div>

                <div style={{ background: 'white', borderRadius: 18, padding: '18px 16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 14 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>Mill / Seller</p>

                    <Field label="Mill / Account" required error={errors.Mill_Code}>
                        <MillSearchInput value={form.Mill_Code} onChange={(code, accoid) => setForm(f => ({ ...f, Mill_Code: code, mc: accoid || 0 }))} accounts={accountData} error={errors.Mill_Code} />
                    </Field>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Field label="Tender Date">
                            <TextInput type="date" value={form.Tender_Date} onChange={set('Tender_Date')} />
                        </Field>
                        <Field label="Lifting Date" required error={errors.Lifting_Date}>
                            <TextInput type="date" value={form.Lifting_Date} onChange={set('Lifting_Date')} error={errors.Lifting_Date} />
                        </Field>
                    </div>
                </div>

                <div style={{ background: 'white', borderRadius: 18, padding: '18px 16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 14 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>Product Details</p>

                    <Field label="Item / Sugar Type" required error={errors.itemcode}>
                        <PickerInput value={form.itemcode} onChange={val => {
                            const opt = itemOptions.find(o => String(o.value) === String(val));
                            setForm(f => ({ ...f, itemcode: val, ic: opt?.accoid || 0 }));
                        }} options={itemOptions} placeholder="Select item…" error={errors.itemcode} />
                    </Field>

                    <Field label="Grade" required error={errors.Grade}>
                        <PickerInput value={form.Grade} onChange={val => {
                            const opt = gradeOptions.find(o => o.value === val);
                            setForm(f => ({ ...f, Grade: val, gradeid: opt?.gradeid || 0, gradeCode: opt?.gradeCode || 0 }));
                        }} options={gradeOptions} placeholder="Select grade…" error={errors.Grade} />
                    </Field>

                    <Field label="Season" required error={errors.season}>
                        <TextInput value={form.season} onChange={set('season')} placeholder="e.g. 2024-25" error={errors.season} />
                    </Field>
                </div>

                <div style={{ background: 'white', borderRadius: 18, padding: '18px 16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 14 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>Quantity & Pricing</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Field label="Quantal (qtl)" required error={errors.Quantal}>
                            <TextInput type="number" value={form.Quantal} onChange={set('Quantal')} placeholder="Multiple of 5" error={errors.Quantal} />
                        </Field>
                        <Field label="Sale Rate (₹/qtl)" required error={errors.Mill_Rate}>
                            <TextInput type="number" value={form.Mill_Rate} onChange={set('Mill_Rate')} placeholder="e.g. 3600" error={errors.Mill_Rate} />
                        </Field>
                    </div>

                    <Field label="Packing (kg/bag)" required error={errors.Packing}>
                        <TextInput type="number" value={form.Packing} onChange={set('Packing')} placeholder="50" error={errors.Packing} />
                    </Field>

                    {!isNaN(estAmt) && estAmt > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{ background: '#f5f3ff', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed' }}>Estimated Amount</span>
                            <span style={{ fontSize: 16, fontWeight: 900, color: '#7c3aed' }}>₹{estAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </motion.div>
                    )}
                </div>

                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={saving}
                    style={{ width: '100%', padding: '16px', background: saving ? '#f3f4f6' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 800, color: saving ? '#9ca3af' : 'white', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: saving ? 'none' : '0 4px 16px rgba(124,58,237,0.35)' }}>
                    {saving ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.15)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Saving…</> : '✅ Create Sale Sauda'}
                </motion.button>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </AppLayout>
    );
}
