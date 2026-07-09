'use client';
import { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { setAuthData } from '../../store/authSlice';
import {
    useSendOtpMutation,
    useVerifyOtpMutation,
    useResendOtpMutation,
    useSelectAccountMutation,
} from '../../services/authApi';

const CONFETTI_COLORS = ['#16a34a','#22c55e','#86efac','#fbbf24','#f59e0b','#60a5fa','#a78bfa','#f472b6','#fb7185','#34d399'];

function Confetti() {
    const pieces = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
        id: i, left: 2 + (i / 60) * 96, delay: (i % 15) * 0.055,
        duration: 1.1 + (i % 6) * 0.2, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 5 + (i % 5) * 2.5, isCircle: i % 3 === 0, isThin: i % 4 === 2,
    })), []);
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 220, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
            {pieces.map(p => (
                <div key={p.id} style={{
                    position: 'absolute', left: `${p.left}%`, top: -8,
                    width: p.isCircle ? p.size : p.isThin ? p.size * 0.35 : p.size,
                    height: p.isCircle ? p.size : p.isThin ? p.size * 2 : p.size * 0.45,
                    backgroundColor: p.color, borderRadius: p.isCircle ? '50%' : 2,
                    animation: `confettiFall ${p.duration}s ${p.delay}s ease-in both`,
                }} />
            ))}
        </div>
    );
}

function VerifyOTPInner() {
    const router = useRouter();
    const dispatch = useDispatch();
    const searchParams = useSearchParams();
    const mobile = searchParams.get('mobile');
    const hasAccountsParam = searchParams.get('hasAccounts');

    const accounts = useSelector(s => s.auth.pendingAccounts) || [];

    const isGuest = hasAccountsParam === 'false' || accounts.length === 0;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [phase, setPhase] = useState(0); // 0=idle 1=wave-green 2=collapsing 3=verified-pill 4=fullscreen
    const [shakeOtp, setShakeOtp] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(null);
    const [showGuestChoice, setShowGuestChoice] = useState(false);
    const inputRefs = useRef([]);
    const hasSentOtp = useRef(false);

    const [sendOtp,       { isLoading: isSending }]         = useSendOtpMutation();
    const [verifyOtp,     { isLoading: isVerifying }]        = useVerifyOtpMutation();
    const [resendOtp,     { isLoading: isResending }]        = useResendOtpMutation();
    const [selectAccount, { isLoading: isSelectingAccount }] = useSelectAccountMutation();

    const isLoading   = isSending || isVerifying || isResending || isSelectingAccount;
    const filledCount = otp.filter(d => d !== '').length;
    const progress    = (filledCount / 6) * 100;
    const isInProgress = phase > 0;

    useEffect(() => {
        if (!mobile) { router.replace('/login'); return; }
        if (!hasSentOtp.current) {
            hasSentOtp.current = true;
            sendInitialOtp();
        } else {
            setTimeout(() => { inputRefs.current[0]?.focus(); setFocusedIndex(0); }, 100);
        }
    }, []);

    useEffect(() => {
        if (timer > 0 && !canResend) {
            const id = setInterval(() => setTimer(p => p - 1), 1000);
            return () => clearInterval(id);
        }
        if (timer === 0) setCanResend(true);
    }, [timer, canResend]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(p => ({ ...p, show: false })), 3500);
    };

    const sendInitialOtp = async () => {
        try {
            const accoid = accounts?.[0]?.accoid ?? null;
            const result = await sendOtp({ mobile_no: mobile, accoid }).unwrap();
            showToast(result.message || 'OTP sent successfully!', 'success');
        } catch (error) {
            showToast(error.data?.detail || 'Failed to send OTP', 'error');
        } finally {
            setTimeout(() => { inputRefs.current[0]?.focus(); setFocusedIndex(0); }, 50);
        }
    };

    const triggerShake = () => {
        setShakeOtp(true);
        setTimeout(() => setShakeOtp(false), 600);
    };

    const handleChange = (e, index) => {
        const value = e.target.value;
        if (/^[0-9]$/.test(value) || value === '') {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);
            if (value !== '' && index < 5) { inputRefs.current[index + 1]?.focus(); setFocusedIndex(index + 1); }
            if (value !== '' && index === 5) {
                const fullOtp = newOtp.join('');
                if (fullOtp.length === 6) submitOtp(fullOtp);
            }
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) { inputRefs.current[index - 1]?.focus(); setFocusedIndex(index - 1); }
        if (e.key === 'ArrowLeft'  && index > 0) { inputRefs.current[index - 1]?.focus(); setFocusedIndex(index - 1); }
        if (e.key === 'ArrowRight' && index < 5) { inputRefs.current[index + 1]?.focus(); setFocusedIndex(index + 1); }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
            inputRefs.current[5]?.focus(); setFocusedIndex(5);
            setTimeout(() => submitOtp(pasted), 100);
        }
    };

    const submitOtp = async (otpValue) => {
        try {
            const accoid = accounts?.[0]?.accoid ?? null;
            const result = await verifyOtp({ mobile_no: mobile, otp: otpValue, accoid }).unwrap();

            if (result.status === '1') {
                showToast('OTP verified successfully!', 'success');
                setPhase(1);
                setTimeout(() => setPhase(2), 520);
                setTimeout(() => setPhase(3), 880);

                if (isGuest || !accounts?.length) {
                    setTimeout(() => { setPhase(0); setShowGuestChoice(true); }, 1750);
                } else if (accounts?.length === 1) {
                    try {
                        await selectAccount({ mobile_no: mobile, accoid: accounts[0].accoid }).unwrap();
                        dispatch(setAuthData({ mobile, accounts, currentAccoid: accounts[0].accoid }));
                        setTimeout(() => setPhase(4), 1650);
                        setTimeout(() => router.replace('/dashboard'), 2800);
                    } catch (selectErr) {
                        showToast(selectErr.data?.detail || 'Login failed. Try again.', 'error');
                        setPhase(0);
                    }
                } else {
                    setTimeout(() => setPhase(4), 1650);
                    setTimeout(() => router.replace('/select-account'), 2800);
                }
            }
        } catch (error) {
            const newFailed = failedAttempts + 1;
            setFailedAttempts(newFailed);
            setOtp(['', '', '', '', '', '']);
            triggerShake();
            setTimeout(() => inputRefs.current[0]?.focus(), 10);
            if (newFailed >= 3) {
                showToast('Too many attempts. Request a new OTP.', 'error');
                setCanResend(true); setTimer(0);
            } else {
                showToast(error.data?.detail || `Invalid OTP. ${3 - newFailed} attempt${3 - newFailed > 1 ? 's' : ''} left.`, 'error');
            }
        }
    };

    const handleResend = async () => {
        try {
            const accoid = accounts?.[0]?.accoid ?? null;
            await resendOtp({ mobile_no: mobile, accoid }).unwrap();
            showToast('New OTP sent successfully!', 'success');
            setTimer(60); setCanResend(false); setFailedAttempts(0);
            setOtp(['', '', '', '', '', '']);
            setTimeout(() => { inputRefs.current[0]?.focus(); setFocusedIndex(0); }, 50);
        } catch {
            showToast('Failed to resend OTP', 'error');
        }
    };

    const circumference = 2 * Math.PI * 20;

    if (!mobile) return null;

    return (
        <>
            <style>{`
                @keyframes confettiFall { 0%{transform:translateY(0) rotate(0deg);opacity:1;} 80%{opacity:0.9;} 100%{transform:translateY(360px) rotate(580deg);opacity:0;} }
                @keyframes spin { to{transform:rotate(360deg);} }
                @keyframes waveGreen {
                    0%{transform:scale(1);} 35%{transform:scale(1.18) translateY(-6px);border-color:#10b981;background:#ecfdf5;color:#10b981;box-shadow:0 0 0 6px rgba(16,185,129,0.18);}
                    70%{transform:scale(0.94);} 100%{transform:scale(1);border-color:#10b981;background:#f0fdf4;color:#10b981;}
                }
                @keyframes pillExpand {
                    0%{transform:scaleX(0.12) scaleY(0.25);opacity:0;} 55%{transform:scaleX(1.04) scaleY(1.07);opacity:1;} 100%{transform:scaleX(1) scaleY(1);opacity:1;}
                }
                @keyframes implode { 0%{transform:scale(1);opacity:1;} 25%{transform:scale(1.1);} 100%{transform:scale(0) translateY(6px);opacity:0;} }
                @keyframes fsCircleDraw { from{stroke-dashoffset:340;} to{stroke-dashoffset:0;} }
                @keyframes fsCheckDraw  { from{stroke-dashoffset:82;}  to{stroke-dashoffset:0;} }
                @keyframes fsPop { 0%{transform:scale(0.3);opacity:0;} 65%{transform:scale(1.1);opacity:1;} 100%{transform:scale(1);opacity:1;} }
                @keyframes fsTextIn { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
                @keyframes fsBar { from{width:0;} to{width:100%;} }
                @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.5;transform:scale(0.7);} }
                @keyframes urgent { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
                @keyframes shake {
                    0%,100%{transform:translateX(0);} 15%{transform:translateX(-7px);} 30%{transform:translateX(7px);}
                    45%{transform:translateX(-5px);} 60%{transform:translateX(5px);} 75%{transform:translateX(-3px);} 90%{transform:translateX(3px);}
                }
            `}</style>

            {/* Toast */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -60 }}
                        style={{
                            position: 'fixed', top: 16, left: 16, right: 16,
                            zIndex: 10000, display: 'flex', alignItems: 'center', gap: 10,
                            padding: '12px 16px', borderRadius: 14, fontWeight: 700, fontSize: 14,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                            background: toast.type === 'success' ? '#059669' : '#ef4444', color: 'white',
                            fontFamily: 'Signika, sans-serif',
                        }}
                    >
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                            {toast.type === 'success' ? '✓' : '✕'}
                        </div>
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Phase 4: Full-screen celebration */}
            <AnimatePresence>
                {phase >= 4 && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 9997, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 24 }}
                    >
                        <Confetti />
                        <motion.div
                            initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
                            style={{ position: 'relative', marginBottom: 24 }}
                        >
                            <div style={{ position: 'absolute', width: 130, height: 130, borderRadius: '50%', border: '3px solid #22c55e', opacity: 0, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'fsPulse 1.2s 0.7s ease-out infinite' }} />
                            <svg width="120" height="120" viewBox="0 0 130 130" fill="none" style={{ position: 'relative', zIndex: 2 }}>
                                <circle cx="65" cy="65" r="54" stroke="#22c55e" strokeWidth="5" fill="#f0fdf4" strokeDasharray="340" strokeDashoffset="340" style={{ animation: 'fsCircleDraw 0.7s 0.3s ease-out forwards' }} />
                                <polyline points="38,67 56,85 93,44" stroke="#16a34a" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray="82" strokeDashoffset="82" style={{ animation: 'fsCheckDraw 0.4s 0.95s ease-out forwards' }} />
                            </svg>
                        </motion.div>
                        <p style={{ fontFamily: 'inherit', fontSize: 'clamp(28px,8vw,36px)', fontWeight: 900, color: '#111827', margin: 0, animation: 'fsTextIn 0.4s 0.92s ease both' }}>Verified!</p>
                        <p style={{ fontFamily: 'inherit', fontSize: 14, color: '#6b7280', fontWeight: 600, marginTop: 8, animation: 'fsTextIn 0.4s 1.08s ease both' }}>Taking you to your dashboard…</p>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, height: 4, background: 'linear-gradient(90deg,#10b981,#22c55e,#86efac)', animation: 'fsBar 2.5s 0.35s ease-out both' }} />
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ minHeight: '100dvh', background: 'white', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px 60px', position: 'relative' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ width: '100%', maxWidth: 400 }}>

                        {/* Logo */}
                        <div style={{ marginBottom: 28 }}>
                            <img src="/eBuySugar.jpg" alt="eBuySugar" style={{ height: 52, objectFit: 'contain', display: 'block' }} />
                        </div>

                        {/* Guest choice screen */}
                        {showGuestChoice && (
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                                    <div style={{ width: 68, height: 68, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 30, color: 'white', boxShadow: '0 8px 24px rgba(16,185,129,0.4)' }}>✓</div>
                                    <h2 style={{ fontSize: 'clamp(20px,6vw,26px)', fontWeight: 900, color: '#111827', margin: '0 0 6px' }}>Mobile Verified!</h2>
                                    <p style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>How would you like to continue?</p>
                                </div>
                                <button onClick={() => router.push('/register')}
                                    style={{ width: '100%', padding: 18, background: 'linear-gradient(135deg,#ef3837,#d92300)', border: 'none', borderRadius: 14, cursor: 'pointer', marginBottom: 12, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 4px 20px rgba(239,56,55,0.3)' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🚀</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: 'white', marginBottom: 2 }}>Register & Get Full Access</div>
                                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Buy · Sell · Reports · All features</div>
                                    </div>
                                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18 }}>→</span>
                                </button>
                                <button onClick={() => router.push('/dashboard')}
                                    style={{ width: '100%', padding: 18, background: 'white', border: '2px solid #e5e7eb', borderRadius: 14, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👁</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: '#374151', marginBottom: 2 }}>Browse as Guest</div>
                                        <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>View listings only · No trading</div>
                                    </div>
                                    <span style={{ color: '#9ca3af', fontSize: 18 }}>→</span>
                                </button>
                            </motion.div>
                        )}

                        {/* OTP form */}
                        {!showGuestChoice && (
                            <>
                                {/* Badge */}
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff1f0', border: '1px solid rgba(239,56,55,0.15)', color: '#ef3837', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 50, marginBottom: 14 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef3837', animation: 'pulse 1.5s ease-in-out infinite' }} />
                                    OTP Verification
                                </div>

                                <h1 style={{ fontSize: 'clamp(24px,7vw,34px)', fontWeight: 900, color: '#111827', lineHeight: 1.15, letterSpacing: -0.5, margin: '0 0 10px' }}>
                                    Enter your<br /><span style={{ color: '#ef3837' }}>secret code</span>
                                </h1>
                                <p style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, lineHeight: 1.6, marginBottom: 20 }}>
                                    We sent a 6-digit code to <strong style={{ color: '#111827' }}>+91 {mobile}</strong>.
                                </p>

                                {isGuest && (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '7px 12px', fontSize: 12, fontWeight: 700, color: '#c2410c', marginBottom: 16 }}>
                                        <span>👁</span> Viewer access — browse only, no trading
                                    </div>
                                )}

                                {/* Progress */}
                                <div style={{ background: '#f3f4f6', height: 4, borderRadius: 2, overflow: 'hidden', margin: '16px 0 24px' }}>
                                    <motion.div animate={{ width: `${progress}%` }} style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#ef3837,#ff7043)' }} />
                                </div>

                                {/* Attempt dots */}
                                {failedAttempts > 0 && (
                                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
                                        {[0, 1, 2].map(i => (
                                            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < failedAttempts ? '#ef4444' : '#e5e7eb', transition: 'background 0.3s' }} />
                                        ))}
                                        <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, marginLeft: 4 }}>
                                            {3 - failedAttempts} attempt{3 - failedAttempts !== 1 ? 's' : ''} left
                                        </span>
                                    </div>
                                )}

                                {/* OTP Boxes */}
                                <div style={{ position: 'relative' }}>
                                    {phase < 3 && (
                                        <div
                                            onPaste={handlePaste}
                                            style={{
                                                display: 'flex', gap: 'clamp(6px,2vw,12px)',
                                                justifyContent: 'center', marginBottom: 24,
                                                animation: shakeOtp ? 'shake 0.5s ease' : 'none',
                                            }}
                                        >
                                            {otp.map((digit, index) => (
                                                <input
                                                    key={index}
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength="1"
                                                    value={digit}
                                                    ref={el => (inputRefs.current[index] = el)}
                                                    onChange={e => handleChange(e, index)}
                                                    onKeyDown={e => handleKeyDown(e, index)}
                                                    onFocus={() => setFocusedIndex(index)}
                                                    disabled={isLoading || phase > 0 || failedAttempts >= 3}
                                                    style={{
                                                        flex: 1, minWidth: 0,
                                                        height: 'clamp(44px,12vw,60px)',
                                                        textAlign: 'center',
                                                        fontSize: 'clamp(18px,5vw,24px)',
                                                        fontWeight: 900, fontFamily: 'inherit',
                                                        borderRadius: 12, outline: 'none',
                                                        color: phase >= 1 ? '#10b981' : failedAttempts >= 3 ? '#fca5a5' : digit ? '#ef3837' : '#111827',
                                                        background: phase >= 1 ? '#f0fdf4' : failedAttempts >= 3 ? '#fff1f0' : digit ? '#fff8f8' : '#f9fafb',
                                                        border: `2px solid ${phase >= 1 ? '#10b981' : focusedIndex === index && phase === 0 ? '#ef3837' : digit ? '#ef3837' : '#e5e7eb'}`,
                                                        boxShadow: focusedIndex === index && phase === 0 ? '0 0 0 3px rgba(239,56,55,0.1)' : 'none',
                                                        transform: focusedIndex === index && phase === 0 ? 'scale(1.06)' : 'scale(1)',
                                                        transition: 'all 0.2s',
                                                        animation: phase === 1 ? `waveGreen 0.42s ${index * 65}ms cubic-bezier(0.34,1.56,0.64,1) both` :
                                                            phase === 2 ? `implode 0.38s ${Math.abs(index - 2.5) * 25 + 10}ms cubic-bezier(0.4,0,0.6,1) both` : 'none',
                                                        opacity: failedAttempts >= 3 ? 0.6 : 1,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Phase 3: Verified pill */}
                                    {phase === 3 && (
                                        <motion.div
                                            initial={{ scaleX: 0.12, scaleY: 0.25, opacity: 0 }}
                                            animate={{ scaleX: 1, scaleY: 1, opacity: 1 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, height: 68, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 18, color: 'white', fontSize: 'clamp(18px,5vw,22px)', fontWeight: 900, marginBottom: 24, boxShadow: '0 8px 28px rgba(16,185,129,0.4)' }}
                                        >
                                            <svg width="28" height="28" viewBox="0 0 30 30" fill="none"><circle cx="15" cy="15" r="13" fill="rgba(255,255,255,0.22)" /><polyline points="8,15 13,20 22,10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                                            Verified!
                                        </motion.div>
                                    )}

                                    {failedAttempts >= 3 && phase === 0 && (
                                        <div style={{ background: '#fff1f0', border: '1px solid rgba(239,56,55,0.2)', borderRadius: 12, padding: '12px 14px', marginBottom: 14, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#ef3837', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                            ⚠️ Too many attempts. Request a new OTP.
                                        </div>
                                    )}

                                    {/* Status */}
                                    <div style={{ minHeight: 26, marginBottom: 16, textAlign: 'center' }}>
                                        {isVerifying && (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#ef3837' }}>
                                                <div style={{ width: 15, height: 15, border: '2.5px solid rgba(239,56,55,0.2)', borderTopColor: '#ef3837', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                                Verifying your code...
                                            </div>
                                        )}
                                        {isSelectingAccount && (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>
                                                <div style={{ width: 15, height: 15, border: '2.5px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                                Logging you in...
                                            </div>
                                        )}
                                        {isSending && (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#6b7280' }}>
                                                <div style={{ width: 15, height: 15, border: '2.5px solid rgba(107,114,128,0.2)', borderTopColor: '#6b7280', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                                Sending OTP...
                                            </div>
                                        )}
                                    </div>

                                    {failedAttempts < 3 && !isInProgress && (
                                        <button onClick={() => router.push('/login')} disabled={isLoading}
                                            style={{ width: '100%', padding: 14, background: '#f3f4f6', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#374151', cursor: 'pointer', marginBottom: 24, fontFamily: 'inherit' }}>
                                            ← Go Back
                                        </button>
                                    )}

                                    {!isInProgress && (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                            {!canResend ? (
                                                <>
                                                    <p style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>Resend available in</p>
                                                    <div style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <svg style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} viewBox="0 0 48 48">
                                                            <circle cx="24" cy="24" r="20" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                                                            <circle cx="24" cy="24" r="20" fill="none" stroke="#ef3837" strokeWidth="4" strokeLinecap="round"
                                                                strokeDasharray={circumference} strokeDashoffset={circumference * (timer / 60)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
                                                        </svg>
                                                        <span style={{ fontSize: 15, fontWeight: 900, color: timer <= 10 ? '#ef3837' : '#111827', animation: timer <= 10 ? 'urgent 0.8s ease-in-out infinite' : 'none', position: 'relative', zIndex: 1 }}>{timer}s</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <p style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>Didn't receive the code?</p>
                                                    <button onClick={handleResend} disabled={isResending}
                                                        style={{ background: 'none', border: '2px solid rgba(239,56,55,0.2)', fontSize: 14, fontWeight: 800, color: '#ef3837', cursor: 'pointer', padding: '10px 22px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
                                                        {isResending ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(239,56,55,0.2)', borderTopColor: '#ef3837', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Sending...</> : <>↺ Resend OTP</>}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            </div>
        </>
    );
}

export default function VerifyOTPPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 40, height: 40, border: '4px solid #ef3837', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}>
            <VerifyOTPInner />
        </Suspense>
    );
}
