'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import AppLayout from '../../components/layout/AppLayout';
import { useLazyGetBalanceLimitsQuery, useSaveCustomerLimitMutation } from '../../services/balancelimitApi';

export default function CustomerLimitPage() {
    const router = useRouter();
    const { currentAccoid, accounts } = useSelector(s => s.auth);
    const currentAccount = accounts?.find(a => a.accoid === currentAccoid);

    const [searchCode, setSearchCode] = useState('');
    const [selectedAc, setSelectedAc] = useState(null);
    const [buyLimit, setBuyLimit] = useState('');
    const [sellLimit, setSellLimit] = useState('');
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

    const [fetchLimits, { data: limitsData, isFetching }] = useLazyGetBalanceLimitsQuery();
    const [saveLimit, { isLoading: isSaving }] = useSaveCustomerLimitMutation();

    // Guard: only Z-type admins
    if (currentAccount?.Ac_type !== 'Z') {
        return (
            <AppLayout title="Customer Limit" showBack>
                <div style={{ padding: '40px 24px', textAlign: 'center', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
                    <h2 style={{ fontWeight: 900, fontSize: 20, color: '#111827', marginBottom: 8 }}>Admin Only</h2>
                    <p style={{ fontSize: 14, color: '#9ca3af', fontWeight: 500 }}>This section is restricted to admin accounts.</p>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/dashboard')}
                        style={{ marginTop: 24, padding: '14px 32px', background: 'linear-gradient(135deg,#ef3837,#d92300)', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 800, color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Go to Dashboard
                    </motion.button>
                </div>
            </AppLayout>
        );
    }

    const showToast = (msg, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast(p => ({ ...p, show: false })), 3500);
    };

    const handleSearch = async () => {
        const code = searchCode.trim();
        if (!code) { showToast('Enter an account code to search.', 'error'); return; }
        try {
            const result = await fetchLimits({ Ac_Code: code, accoid: currentAccoid }).unwrap();
            if (result && result.length > 0) {
                const r = result[0];
                setSelectedAc(r);
                setBuyLimit(r.buy_limit?.toString() || '');
                setSellLimit(r.sell_limit?.toString() || '');
            } else {
                setSelectedAc({ Ac_Code: code, Ac_Name_E: 'Account ' + code });
                setBuyLimit('');
                setSellLimit('');
                showToast('No existing limits found. You can set new limits.', 'success');
            }
        } catch {
            showToast('Failed to fetch account limits.', 'error');
        }
    };

    const handleSave = async () => {
        if (!selectedAc) { showToast('Search for an account first.', 'error'); return; }
        if (!buyLimit && !sellLimit) { showToast('Enter at least one limit value.', 'error'); return; }
        try {
            await saveLimit({
                Ac_Code: selectedAc.Ac_Code,
                accoid: currentAccoid,
                buy_limit: parseFloat(buyLimit) || 0,
                sell_limit: parseFloat(sellLimit) || 0,
            }).unwrap();
            showToast('Customer limits saved successfully!', 'success');
        } catch (err) {
            showToast(err?.data?.detail || 'Failed to save limits.', 'error');
        }
    };

    const inputStyle = { width: '100%', padding: '13px 14px', background: '#f9fafb', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#111827', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', fontSize: 11, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 };

    return (
        <AppLayout title="Customer Limit" showBack>
            <AnimatePresence>
                {toast.show && (
                    <motion.div initial={{ opacity: 0, y: -60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -60 }}
                        style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '12px 20px', borderRadius: 14, fontWeight: 700, fontSize: 14, background: toast.type === 'success' ? '#059669' : '#ef4444', color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}>
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ padding: '12px 16px 32px', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>
                <div style={{ background: 'linear-gradient(135deg,#ef3837,#d92300)', borderRadius: 16, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 28 }}>🛡️</span>
                    <div>
                        <div style={{ color: 'white', fontWeight: 900, fontSize: 15 }}>Customer Balance Limits</div>
                        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 500 }}>Set buy/sell limits per customer account</div>
                    </div>
                </div>

                {/* Search */}
                <div style={{ background: 'white', borderRadius: 20, padding: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 12, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Search Account</h3>
                    <label style={labelStyle}>Account Code</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <input type="text" value={searchCode} onChange={e => setSearchCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="e.g. A001"
                            style={{ ...inputStyle, flex: 1 }}
                            onFocus={e => Object.assign(e.target.style, { borderColor: '#ef3837', background: 'white', boxShadow: '0 0 0 3px rgba(239,56,55,0.1)' })}
                            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; }} />
                        <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={handleSearch} disabled={isFetching}
                            style={{ padding: '13px 20px', background: 'linear-gradient(135deg,#ef3837,#d92300)', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, color: 'white', cursor: isFetching ? 'not-allowed' : 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                            {isFetching ? '...' : 'Search'}
                        </motion.button>
                    </div>
                </div>

                {/* Account info + limits form */}
                <AnimatePresence>
                    {selectedAc && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div style={{ background: 'white', borderRadius: 20, padding: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, padding: '14px', background: '#f9fafb', borderRadius: 14 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#ef3837,#d92300)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 18, flexShrink: 0 }}>
                                        {(selectedAc.Ac_Name_E || 'A').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>{selectedAc.Ac_Name_E || 'Customer'}</div>
                                        <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Code: {selectedAc.Ac_Code}</div>
                                    </div>
                                </div>

                                <h3 style={{ fontSize: 12, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Set Limits (₹)</h3>

                                <div style={{ marginBottom: 14 }}>
                                    <label style={labelStyle}>Buy Limit (₹)</label>
                                    <input type="number" value={buyLimit} onChange={e => setBuyLimit(e.target.value)} min="0" placeholder="Enter buy limit"
                                        style={inputStyle}
                                        onFocus={e => Object.assign(e.target.style, { borderColor: '#059669', background: 'white', boxShadow: '0 0 0 3px rgba(5,150,105,0.1)' })}
                                        onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; }} />
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <label style={labelStyle}>Sell Limit (₹)</label>
                                    <input type="number" value={sellLimit} onChange={e => setSellLimit(e.target.value)} min="0" placeholder="Enter sell limit"
                                        style={inputStyle}
                                        onFocus={e => Object.assign(e.target.style, { borderColor: '#ef3837', background: 'white', boxShadow: '0 0 0 3px rgba(239,56,55,0.1)' })}
                                        onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; e.target.style.boxShadow = 'none'; }} />
                                </div>

                                {/* Current limits display */}
                                {(selectedAc.buy_limit || selectedAc.sell_limit) && (
                                    <div style={{ background: '#f9fafb', borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 4 }}>CURRENT BUY</div>
                                            <div style={{ fontSize: 16, fontWeight: 900, color: '#059669' }}>₹{(selectedAc.buy_limit || 0).toLocaleString('en-IN')}</div>
                                        </div>
                                        <div style={{ width: 1, background: '#e5e7eb' }} />
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 4 }}>CURRENT SELL</div>
                                            <div style={{ fontSize: 16, fontWeight: 900, color: '#ef3837' }}>₹{(selectedAc.sell_limit || 0).toLocaleString('en-IN')}</div>
                                        </div>
                                    </div>
                                )}

                                <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={isSaving}
                                    style={{ width: '100%', padding: '16px', background: isSaving ? '#d1d5db' : 'linear-gradient(135deg,#ef3837,#d92300)', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 800, color: 'white', cursor: isSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(239,56,55,0.35)' }}>
                                    {isSaving ? 'Saving...' : 'Save Limits'}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!selectedAc && !isFetching && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                        <p style={{ fontSize: 14, fontWeight: 600 }}>Search an account code above to view and set balance limits.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
