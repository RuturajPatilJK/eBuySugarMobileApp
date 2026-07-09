'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useLazyGetAccountMasterByMobileNumberQuery } from '../../services/authApi';
import { setPendingLogin } from '../../store/authSlice';

export default function LoginPage() {
    const [mobile, setMobile] = useState('');
    const [focused, setFocused] = useState(false);
    const [shake, setShake] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
    const inputRef = useRef(null);
    const router = useRouter();
    const dispatch = useDispatch();
    const [triggerGetAccount, { isLoading }] = useLazyGetAccountMasterByMobileNumberQuery();

    useEffect(() => {
        const t = setTimeout(() => inputRef.current?.focus(), 300);
        return () => clearTimeout(t);
    }, []);

    const showToast = (message, type = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(p => ({ ...p, show: false })), 3500);
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    const handleMobileChange = (e) => {
        const value = e.target.value;
        if (/^\d{0,10}$/.test(value)) setMobile(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (mobile.length < 10) {
            triggerShake();
            showToast('Please enter a valid 10-digit mobile number.', 'error');
            return;
        }
        try {
            const accounts = await triggerGetAccount(mobile).unwrap();
            if (accounts && accounts.length > 0) {
                dispatch(setPendingLogin({ mobile, accounts }));
                router.push(`/verify-otp?mobile=${mobile}&hasAccounts=true`);
            } else {
                dispatch(setPendingLogin({ mobile, accounts: [] }));
                router.push(`/verify-otp?mobile=${mobile}&hasAccounts=false`);
            }
        } catch (err) {
            triggerShake();
            showToast(err.data?.detail || 'An error occurred. Please try again.', 'error');
        }
    };

    const progress = (mobile.length / 10) * 100;

    return (
        <>
            {/* Toast */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -60 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        style={{
                            position: 'fixed', top: 16, left: 16, right: 16,
                            zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10,
                            padding: '12px 16px', borderRadius: 14,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                            background: toast.type === 'success' ? '#059669' : '#ef4444', color: 'white',
                            fontWeight: 700, fontSize: 14, fontFamily: 'Signika, sans-serif',
                        }}
                    >
                        <div style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.25)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                        }}>
                            {toast.type === 'success' ? '✓' : '✕'}
                        </div>
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{
                minHeight: '100dvh', background: 'white',
                fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif',
                display: 'flex', flexDirection: 'column',
            }}>
                {/* Top decorative blob */}
                <div style={{
                    position: 'absolute', top: -80, right: -80, width: 260, height: 260,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(239,56,55,0.08) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', top: '30%', left: -60, width: 180, height: 180,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(239,56,55,0.05) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />

                {/* Content */}
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    padding: '32px 24px 60px',
                    position: 'relative',
                }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                        style={{ width: '100%', maxWidth: 400 }}
                    >
                        {/* Logo */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                            style={{ marginBottom: 32 }}
                        >
                            <img src="/eBuySugar.jpg" alt="eBuySugar" style={{ height: 60, objectFit: 'contain', display: 'block' }} />
                        </motion.div>

                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: '#fff1f0', border: '1px solid rgba(239,56,55,0.15)',
                                color: '#ef3837', fontSize: 11, fontWeight: 800,
                                letterSpacing: '0.08em', textTransform: 'uppercase',
                                padding: '5px 12px', borderRadius: 50, marginBottom: 14,
                            }}
                        >
                            <span style={{
                                width: 6, height: 6, borderRadius: '50%', background: '#ef3837',
                                animation: 'pulse 1.5s ease-in-out infinite',
                            }} />
                            Sugar Trade Portal
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                            style={{
                                fontSize: 'clamp(28px,8vw,36px)', fontWeight: 900, color: '#111827',
                                lineHeight: 1.1, letterSpacing: -1, margin: '0 0 10px',
                            }}
                        >
                            Login to<br /><span style={{ color: '#ef3837' }}>eBuySugar</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                            style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, lineHeight: 1.6, marginBottom: 28 }}
                        >
                            Registered sugar miller & trader login.<br />
                            Enter your mobile number to get OTP via WhatsApp.
                        </motion.p>

                        {/* Progress bar */}
                        <div style={{
                            background: '#f3f4f6', height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 24,
                        }}>
                            <motion.div
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.3 }}
                                style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#ef3837,#ff7043)' }}
                            />
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit}>
                            <label style={{
                                display: 'block', fontSize: 11, fontWeight: 800, color: '#374151',
                                letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8,
                            }}>
                                Mobile Number
                            </label>

                            <motion.div
                                animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                                transition={{ duration: 0.5 }}
                                style={{ position: 'relative', marginBottom: 10 }}
                            >
                                {/* Phone icon */}
                                <div style={{
                                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                                    color: focused ? '#ef3837' : '#9ca3af', transition: 'color 0.2s',
                                }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                        <line x1="12" y1="18" x2="12.01" y2="18" />
                                    </svg>
                                </div>
                                {/* +91 prefix */}
                                <span style={{
                                    position: 'absolute', left: 40, top: '50%', transform: 'translateY(-50%)',
                                    fontSize: 15, fontWeight: 800, color: focused ? '#ef3837' : '#374151',
                                    transition: 'color 0.2s', pointerEvents: 'none',
                                }}>+91</span>
                                <div style={{
                                    position: 'absolute', left: 68, top: '50%', transform: 'translateY(-50%)',
                                    width: 1, height: 22, background: focused ? 'rgba(239,56,55,0.3)' : '#e5e7eb',
                                    transition: 'background 0.2s',
                                }} />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    inputMode="numeric"
                                    value={mobile}
                                    onChange={handleMobileChange}
                                    onFocus={() => setFocused(true)}
                                    onBlur={() => setFocused(false)}
                                    placeholder="00000 00000"
                                    maxLength={10}
                                    style={{
                                        width: '100%', padding: '15px 14px 15px 80px',
                                        background: focused ? 'white' : '#f9fafb',
                                        border: `2px solid ${focused ? '#ef3837' : '#e5e7eb'}`,
                                        borderRadius: 14, fontSize: 'clamp(16px,4vw,18px)',
                                        fontWeight: 800, color: '#111827', letterSpacing: '0.08em',
                                        outline: 'none', fontFamily: 'inherit',
                                        boxShadow: focused ? '0 0 0 4px rgba(239,56,55,0.1)' : 'none',
                                        transition: 'all 0.2s',
                                    }}
                                />
                            </motion.div>

                            {/* Digit dots */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: '0 4px' }}>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    {Array.from({ length: 10 }, (_, i) => (
                                        <motion.div
                                            key={i}
                                            animate={i < mobile.length
                                                ? { scale: 1.2, background: '#ef3837' }
                                                : { scale: 1, background: '#e5e7eb' }}
                                            style={{ width: 6, height: 6, borderRadius: '50%' }}
                                        />
                                    ))}
                                </div>
                                <span style={{
                                    fontSize: 11, fontWeight: 700,
                                    color: mobile.length === 10 ? '#10b981' : '#9ca3af',
                                    transition: 'color 0.2s',
                                }}>
                                    {mobile.length}/10
                                </span>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                whileTap={{ scale: 0.98 }}
                                whileHover={{ scale: 1.01, y: -2 }}
                                style={{
                                    width: '100%', padding: '16px',
                                    background: 'linear-gradient(135deg,#ef3837,#d92300)',
                                    color: 'white', fontSize: 15, fontWeight: 800,
                                    border: 'none', borderRadius: 14, cursor: isLoading ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                    boxShadow: '0 4px 20px rgba(239,56,55,0.35)',
                                    opacity: isLoading ? 0.7 : 1,
                                    fontFamily: 'inherit',
                                    animation: mobile.length === 10 && !isLoading ? 'btnGlow 2s ease-in-out infinite' : 'none',
                                }}
                            >
                                {isLoading ? (
                                    <>
                                        <div style={{
                                            width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)',
                                            borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                                        }} />
                                        Verifying...
                                    </>
                                ) : (
                                    <>Login / Register with Mobile <span style={{ fontSize: 18 }}>→</span></>
                                )}
                            </motion.button>
                        </form>

                        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#9ca3af', fontWeight: 500, lineHeight: 1.6 }}>
                            By continuing, you agree to eBuySugar's{' '}
                            <strong style={{ color: '#374151' }}>Terms of Service</strong> and{' '}
                            <strong style={{ color: '#374151' }}>Privacy Policy</strong>
                        </p>
                      
                    </motion.div>
                </div>
            </div>

            <style>{`
                @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
                @keyframes spin  { to { transform: rotate(360deg); } }
                @keyframes btnGlow {
                    0%,100%{ box-shadow: 0 4px 20px rgba(239,56,55,0.35); }
                    50%    { box-shadow: 0 4px 32px rgba(239,56,55,0.6); }
                }
            `}</style>
        </>
    );
}
