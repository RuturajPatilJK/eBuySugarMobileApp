'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/layout/AppLayout';

const today = new Date().toISOString().split('T')[0];
const DEFAULT_FORM = {
    mill: 'B',
    product: 'Sugar',
    deliverFrom: 'Ex Mill',
    lastDateOfPayment: today,
    startDate: today,
    startTime: '11:00',
    endDate: today,
    endTime: '18:00',
    liftingDate: today,
    season: '2024-2025',
    packaging: '50kg',
    sugarType: 'Domestic',
    grade: 'S1',
    quantity: '',
    baseRate: '',
    gst: '155',
    termsAndConditions: '',
    isMspApplicable: false,
    deposit100: false,
    deposit200: false,
};

export default function AddAuctionPage() {
    const router = useRouter();
    const [form, setForm] = useState(DEFAULT_FORM);
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
    const [submitted, setSubmitted] = useState(false);

    const includingGst = form.baseRate && form.gst ? (parseFloat(form.baseRate) + parseFloat(form.gst)).toFixed(2) : '—';

    const showToast = (msg, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast(p => ({ ...p, show: false })), 3500);
    };

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => {
            showToast('E-Auction submitted successfully!', 'success');
            setTimeout(() => router.push('/sell'), 1500);
        }, 800);
    };

    const inputStyle = { width: '100%', padding: '12px 14px', background: '#f9fafb', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#111827', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
    const focusEvt = { onFocus: e => Object.assign(e.target.style, { borderColor: '#ef3837', background: 'white', boxShadow: '0 0 0 3px rgba(239,56,55,0.1)' }), onBlur: e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; } };
    const labelStyle = { display: 'block', fontSize: 11, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 };

    return (
        <AppLayout title="Add E-Auction" showBack>
            <AnimatePresence>
                {toast.show && (
                    <motion.div initial={{ opacity: 0, y: -60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -60 }}
                        style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '12px 20px', borderRadius: 14, fontWeight: 700, fontSize: 14, background: toast.type === 'success' ? '#059669' : '#ef4444', color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}>
                        {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ padding: '12px 16px 32px', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>
                <div style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', borderRadius: 16, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 28 }}>🔨</span>
                    <div>
                        <div style={{ color: 'white', fontWeight: 900, fontSize: 15 }}>Add Live E-Auction</div>
                        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 500 }}>Competitive bidding for sugar lots</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ background: 'white', borderRadius: 20, padding: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 12, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 18 }}>Auction Details</h3>

                        {[
                            { label: 'Mill', name: 'mill', opts: [{ v: 'B', l: 'Bhogawati SSK' }] },
                            { label: 'Product', name: 'product', opts: [{ v: 'Sugar', l: 'Sugar' }] },
                            { label: 'Deliver From', name: 'deliverFrom', opts: [{ v: 'Ex Mill', l: 'Ex Mill' }] },
                            { label: 'Season', name: 'season', opts: [{ v: '2024-2025', l: '2024-2025' }, { v: '2025-2026', l: '2025-2026' }] },
                            { label: 'Packaging', name: 'packaging', opts: [{ v: '50kg', l: '50kg' }, { v: '100kg', l: '100kg' }] },
                            { label: 'Sugar Type', name: 'sugarType', opts: [{ v: 'Domestic', l: 'Domestic' }, { v: 'Export', l: 'Export' }] },
                        ].map(f => (
                            <div key={f.name} style={{ marginBottom: 14 }}>
                                <label style={labelStyle}>{f.label} <span style={{ color: '#ef4444' }}>*</span></label>
                                <select name={f.name} value={form[f.name]} onChange={handleChange} required style={inputStyle} {...focusEvt}>
                                    {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                                </select>
                            </div>
                        ))}

                        <div style={{ marginBottom: 14 }}>
                            <label style={labelStyle}>Grade <span style={{ color: '#ef4444' }}>*</span></label>
                            <input type="text" name="grade" value={form.grade} onChange={handleChange} required placeholder="e.g. S1" style={inputStyle} {...focusEvt} />
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={labelStyle}>Quantity (Quintals) <span style={{ color: '#ef4444' }}>*</span></label>
                            <input type="number" name="quantity" value={form.quantity} onChange={handleChange} required min="1" placeholder="Enter quantity" style={inputStyle} {...focusEvt} />
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={labelStyle}>Base / Starting Rate (₹/Qtl) <span style={{ color: '#ef4444' }}>*</span></label>
                            <input type="number" name="baseRate" value={form.baseRate} onChange={handleChange} required min="0" placeholder="e.g. 3200" style={inputStyle} {...focusEvt} />
                        </div>

                        <div style={{ background: '#faf5ff', border: '1.5px solid #e9d5ff', borderRadius: 12, padding: '14px', marginBottom: 14 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 4 }}>INCLUDING GST RATE</div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: '#5b21b6' }}>₹{includingGst}</div>
                        </div>
                    </div>

                    <div style={{ background: 'white', borderRadius: 20, padding: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 12, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 18 }}>Auction Schedule</h3>

                        {[
                            { label: 'Last Date of Payment', name: 'lastDateOfPayment', type: 'date' },
                            { label: 'Auction Start Date', name: 'startDate', type: 'date' },
                            { label: 'Auction Start Time', name: 'startTime', type: 'time' },
                            { label: 'Auction End Date', name: 'endDate', type: 'date' },
                            { label: 'Auction End Time', name: 'endTime', type: 'time' },
                            { label: 'Lifting Date', name: 'liftingDate', type: 'date' },
                        ].map(f => (
                            <div key={f.name} style={{ marginBottom: 14 }}>
                                <label style={labelStyle}>{f.label} <span style={{ color: '#ef4444' }}>*</span></label>
                                <input type={f.type} name={f.name} value={form[f.name]} onChange={handleChange} required style={inputStyle} {...focusEvt} />
                            </div>
                        ))}
                    </div>

                    <div style={{ background: 'white', borderRadius: 20, padding: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 12, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 18 }}>Options</h3>

                        {[
                            { name: 'deposit100', label: 'Rs. 100/Qnt deposit within 24 Hrs.' },
                            { name: 'deposit200', label: 'Rs. 200/Qnt deposit within 24 Hrs.' },
                            { name: 'isMspApplicable', label: 'MSP/govt. tax increase applicable on buyer' },
                        ].map(opt => (
                            <label key={opt.name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, cursor: 'pointer' }}>
                                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${form[opt.name] ? '#7c3aed' : '#d1d5db'}`, background: form[opt.name] ? '#7c3aed' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
                                    onClick={() => setForm(f => ({ ...f, [opt.name]: !f[opt.name] }))}>
                                    {form[opt.name] && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                                </div>
                                <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{opt.label}</span>
                            </label>
                        ))}

                        <label style={labelStyle}>Terms & Conditions</label>
                        <textarea name="termsAndConditions" value={form.termsAndConditions} onChange={handleChange} rows={3} placeholder="Enter auction terms..."
                            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                            {...focusEvt} />
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={submitted}
                            style={{ flex: 1, padding: '16px', background: submitted ? '#d1d5db' : 'linear-gradient(135deg,#7c3aed,#5b21b6)', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 800, color: 'white', cursor: submitted ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
                            {submitted ? 'Submitting...' : 'Submit Auction'}
                        </motion.button>
                        <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => setForm(DEFAULT_FORM)}
                            style={{ padding: '16px 20px', background: 'white', border: '2px solid #e5e7eb', borderRadius: 16, fontSize: 15, fontWeight: 800, color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit' }}>
                            Reset
                        </motion.button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
