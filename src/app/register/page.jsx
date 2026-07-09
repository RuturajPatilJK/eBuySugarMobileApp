'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    useRegisterMutation,
    useGetCitiesQuery,
    useGetStatesQuery,
    useSearchTaxpayerMutation,
} from '../../services/authApi';

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        mobile_no: '', firm_name: '', person_name: '', email: '',
        gst_no: '', address: '', city_id: '', state_id: '', pincode: '',
    });
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
    const [step, setStep] = useState(1);

    const { data: cities = [] } = useGetCitiesQuery();
    const { data: states = [] } = useGetStatesQuery();
    const [register, { isLoading: isRegistering }] = useRegisterMutation();
    const [searchTaxpayer, { isLoading: isSearching }] = useSearchTaxpayerMutation();

    useEffect(() => {
        const mobile = sessionStorage.getItem('ebs_mobile');
        if (mobile) setForm(f => ({ ...f, mobile_no: mobile }));
    }, []);

    const showToast = (message, type = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(p => ({ ...p, show: false })), 4000);
    };

    const handleGSTLookup = async () => {
        if (!form.gst_no || form.gst_no.length < 15) { showToast('Enter a valid 15-digit GSTIN', 'error'); return; }
        try {
            const result = await searchTaxpayer({ gstin: form.gst_no }).unwrap();
            if (result?.tradeName || result?.legalName) {
                setForm(f => ({
                    ...f,
                    firm_name: result.tradeName || result.legalName || f.firm_name,
                    address: result.address || f.address,
                }));
                showToast('GST details auto-filled!', 'success');
            }
        } catch {
            showToast('GSTIN lookup failed. Fill manually.', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const required = ['mobile_no', 'firm_name', 'person_name'];
        for (const key of required) {
            if (!form[key]) { showToast(`${key.replace('_', ' ')} is required.`, 'error'); return; }
        }
        try {
            await register(form).unwrap();
            showToast('Registration successful! Waiting for admin approval.', 'success');
            setTimeout(() => router.replace('/dashboard'), 2500);
        } catch (err) {
            showToast(err.data?.detail || 'Registration failed. Please try again.', 'error');
        }
    };

    const inputStyle = {
        width: '100%', padding: '14px 16px', background: '#f9fafb',
        border: '2px solid #e5e7eb', borderRadius: 12,
        fontSize: 14, fontWeight: 600, color: '#111827', outline: 'none',
        fontFamily: 'inherit', transition: 'all 0.2s',
    };

    const labelStyle = { display: 'block', fontSize: 11, fontWeight: 800, color: '#374151', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 };

    return (
        <>
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -60 }}
                        style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 14, fontWeight: 700, fontSize: 14, background: toast.type === 'success' ? '#059669' : '#ef4444', color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
                    >
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{toast.type === 'success' ? '✓' : '✕'}</div>
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ minHeight: '100dvh', background: '#f9fafb', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif', padding: '24px 20px 80px' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 480, margin: '0 auto' }}>

                    {/* Header */}
                    <div style={{ marginBottom: 28 }}>
                        <button onClick={() => router.push('/login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontFamily: 'inherit', padding: 0 }}>
                            ← Back
                        </button>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,#ef3837,#d92300)', borderRadius: 14, padding: '8px 16px', boxShadow: '0 4px 16px rgba(239,56,55,0.3)', marginBottom: 20 }}>
                            <span style={{ color: 'white', fontWeight: 900, fontSize: 18 }}>eBuySugar</span>
                        </div>
                        <h1 style={{ fontSize: 'clamp(24px,7vw,32px)', fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>
                            Register Your <span style={{ color: '#ef3837' }}>Business</span>
                        </h1>
                        <p style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, lineHeight: 1.6 }}>
                            Get full access to buy, sell & track sugar tenders.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ background: 'white', borderRadius: 20, padding: '24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 20 }}>Contact Information</h3>

                            {/* Mobile (readonly) */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}>Mobile Number</label>
                                <input value={form.mobile_no} readOnly style={{ ...inputStyle, background: '#f3f4f6', color: '#9ca3af', cursor: 'not-allowed' }} />
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}>Person / Contact Name *</label>
                                <input
                                    type="text" value={form.person_name} placeholder="Your full name"
                                    onChange={e => setForm(f => ({ ...f, person_name: e.target.value }))}
                                    style={inputStyle}
                                    onFocus={e => { e.target.style.borderColor = '#ef3837'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(239,56,55,0.1)'; }}
                                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>

                            <div style={{ marginBottom: 0 }}>
                                <label style={labelStyle}>Email Address</label>
                                <input
                                    type="email" value={form.email} placeholder="your@email.com"
                                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    style={inputStyle}
                                    onFocus={e => { e.target.style.borderColor = '#ef3837'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(239,56,55,0.1)'; }}
                                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>

                        <div style={{ background: 'white', borderRadius: 20, padding: '24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 20 }}>Business Details</h3>

                            {/* GST lookup */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}>GSTIN (optional)</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                        type="text" value={form.gst_no} placeholder="27AAECJ8332R1ZV"
                                        maxLength={15}
                                        onChange={e => setForm(f => ({ ...f, gst_no: e.target.value.toUpperCase() }))}
                                        style={{ ...inputStyle, flex: 1 }}
                                        onFocus={e => { e.target.style.borderColor = '#ef3837'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(239,56,55,0.1)'; }}
                                        onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; }}
                                    />
                                    <button type="button" onClick={handleGSTLookup} disabled={isSearching}
                                        style={{ padding: '0 16px', background: 'linear-gradient(135deg,#ef3837,#d92300)', border: 'none', borderRadius: 12, color: 'white', fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {isSearching ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : null}
                                        Auto-fill
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}>Firm / Business Name *</label>
                                <input
                                    type="text" value={form.firm_name} placeholder="Your business name"
                                    onChange={e => setForm(f => ({ ...f, firm_name: e.target.value }))}
                                    style={inputStyle}
                                    onFocus={e => { e.target.style.borderColor = '#ef3837'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(239,56,55,0.1)'; }}
                                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}>Address</label>
                                <textarea
                                    value={form.address} placeholder="Full address" rows={2}
                                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                    style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                                    onFocus={e => { e.target.style.borderColor = '#ef3837'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(239,56,55,0.1)'; }}
                                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                <div>
                                    <label style={labelStyle}>City</label>
                                    <select value={form.city_id} onChange={e => setForm(f => ({ ...f, city_id: e.target.value }))} style={{ ...inputStyle, appearance: 'none' }}>
                                        <option value="">Select city</option>
                                        {cities.map(c => <option key={c.cityid || c.id} value={c.cityid || c.id}>{c.City_Name_E || c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>State</label>
                                    <select value={form.state_id} onChange={e => setForm(f => ({ ...f, state_id: e.target.value }))} style={{ ...inputStyle, appearance: 'none' }}>
                                        <option value="">Select state</option>
                                        {states.map(s => <option key={s.id || s.state_code} value={s.id || s.state_code}>{s.state_name || s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Pincode</label>
                                <input
                                    type="text" value={form.pincode} placeholder="400001" maxLength={6}
                                    onChange={e => setForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '') }))}
                                    style={inputStyle}
                                    onFocus={e => { e.target.style.borderColor = '#ef3837'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(239,56,55,0.1)'; }}
                                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>

                        <motion.button
                            type="submit" disabled={isRegistering}
                            whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.01, y: -2 }}
                            style={{
                                width: '100%', padding: '17px',
                                background: 'linear-gradient(135deg,#ef3837,#d92300)',
                                color: 'white', fontSize: 15, fontWeight: 800,
                                border: 'none', borderRadius: 16, cursor: isRegistering ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                boxShadow: '0 4px 20px rgba(239,56,55,0.35)', opacity: isRegistering ? 0.7 : 1,
                                fontFamily: 'inherit',
                            }}
                        >
                            {isRegistering ? (
                                <><div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Submitting...</>
                            ) : <>Submit Registration →</>}
                        </motion.button>

                        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 16, lineHeight: 1.6 }}>
                            Registration is reviewed by admin. You'll get WhatsApp confirmation on approval.
                        </p>
                    </form>
                </motion.div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
    );
}
