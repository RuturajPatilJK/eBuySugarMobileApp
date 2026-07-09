'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { setAuthData } from '../../store/authSlice';
import { useSelectAccountMutation } from '../../services/authApi';

export default function SelectAccountPage() {
    const router   = useRouter();
    const dispatch = useDispatch();
    const [accounts, setAccounts]       = useState([]);
    const [mobile, setMobile]           = useState('');
    const [selectedAccount, setSelected] = useState('');
    const [toast, setToast]             = useState({ show: false, message: '', type: 'error' });
    const [shake, setShake]             = useState(false);
    const [success, setSuccess]         = useState(false);
    const [focused, setFocused]         = useState(false);
    const [selectAccount, { isLoading }] = useSelectAccountMutation();

    const { pendingMobile, pendingAccounts } = useSelector(s => s.auth);

    // Run only on mount: read pending state once, then never re-run.
    // Reactive deps would cause router.replace('/login') when setAuthData
    // clears pendingMobile on successful login.
    useEffect(() => {
        if (!pendingMobile || !pendingAccounts?.length) { router.replace('/login'); return; }
        setMobile(pendingMobile);
        setAccounts(pendingAccounts);
        if (pendingAccounts.length === 1) setSelected(String(pendingAccounts[0].accoid));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showToast = (message, type = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(p => ({ ...p, show: false })), 3500);
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAccount) {
            triggerShake();
            showToast('Please select an account to proceed.', 'error');
            return;
        }
        try {
            await selectAccount({ mobile_no: mobile, accoid: parseInt(selectedAccount) }).unwrap();
            dispatch(setAuthData({ mobile, accounts, currentAccoid: parseInt(selectedAccount) }));
            setSuccess(true);
            showToast('Account selected! Redirecting...', 'success');
            setTimeout(() => router.replace('/dashboard'), 1200);
        } catch (err) {
            triggerShake();
            showToast(err.data?.detail || 'An error occurred while selecting account.', 'error');
        }
    };

    const selectedObj = accounts.find(a => String(a.accoid) === String(selectedAccount));

    return (
        <>
            <style>{`
                @keyframes saShake {
                    0%,100% { transform: translateX(0); }
                    15% { transform: translateX(-8px); }
                    30% { transform: translateX(8px); }
                    45% { transform: translateX(-6px); }
                    60% { transform: translateX(6px); }
                    75% { transform: translateX(-3px); }
                    90% { transform: translateX(3px); }
                }
                @keyframes saSpin { to { transform: rotate(360deg); } }
                @keyframes saPreviewIn {
                    from { opacity: 0; transform: translateY(-8px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes saBtnGlow {
                    0%,100% { box-shadow: 0 4px 20px rgba(239,56,55,0.35); }
                    50%     { box-shadow: 0 4px 32px rgba(239,56,55,0.6); }
                }
                @keyframes saOverlayIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes saCheckBounce { from { transform: scale(0); } to { transform: scale(1); } }
                @keyframes saDotPulse {
                    0%,100% { opacity: 1; transform: scale(1); }
                    50%     { opacity: 0.5; transform: scale(0.7); }
                }
                .sa-select-wrap { position: relative; margin-bottom: 8px; }
                .sa-select-wrap::after {
                    content: ''; position: absolute; bottom: 0; left: 50%;
                    transform: translateX(-50%); width: 0; height: 2px;
                    background: #ef3837; border-radius: 1px; transition: width 0.25s ease;
                }
                .sa-select-wrap.focused::after { width: calc(100% - 0px); }
                .sa-select-wrap.shake { animation: saShake 0.5s ease; }
                .sa-select {
                    width: 100%; padding: 16px 48px 16px 16px;
                    background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 14px;
                    font-family: 'Signika', ui-sans-serif, system-ui, sans-serif;
                    font-size: 15px; font-weight: 700; color: #374151;
                    outline: none; appearance: none; -webkit-appearance: none; cursor: pointer;
                    transition: all 0.2s ease;
                }
                .sa-select:focus {
                    border-color: #ef3837; background: white;
                    box-shadow: 0 0 0 4px rgba(239,56,55,0.1);
                }
                .sa-select.has-value { color: #ef3837; border-color: #ef3837; background: #fff8f8; }
                .sa-select-chevron {
                    position: absolute; right: 16px; top: 50%;
                    transform: translateY(-50%);
                    pointer-events: none; color: #9ca3af; transition: all 0.25s ease;
                }
                .sa-select-wrap.focused .sa-select-chevron {
                    color: #ef3837; transform: translateY(-50%) rotate(180deg);
                }
                .sa-btn-primary {
                    width: 100%; padding: 16px;
                    background: linear-gradient(135deg, #ef3837, #d92300);
                    color: white; font-family: 'Signika', ui-sans-serif, system-ui, sans-serif;
                    font-size: 15px; font-weight: 800; border: none;
                    border-radius: 14px; cursor: pointer;
                    transition: all 0.25s ease;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    box-shadow: 0 4px 20px rgba(239,56,55,0.35);
                    letter-spacing: 0.02em;
                }
                .sa-btn-primary:active:not(:disabled) { transform: scale(0.98); }
                .sa-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
                .sa-btn-primary.ready { animation: saBtnGlow 2s ease-in-out infinite; }
                .sa-btn-cancel {
                    width: 100%; padding: 15px;
                    background: white; border: 1.5px solid #e5e7eb;
                    border-radius: 14px; font-family: 'Signika', ui-sans-serif, system-ui, sans-serif;
                    font-size: 15px; font-weight: 700; color: #6b7280;
                    cursor: pointer; margin-top: 10px;
                    transition: all 0.2s ease;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                }
                .sa-btn-cancel:active { transform: scale(0.98); }
                .sa-btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
                .sa-spinner {
                    width: 18px; height: 18px;
                    border: 2.5px solid rgba(255,255,255,0.3);
                    border-top-color: white; border-radius: 50%;
                    animation: saSpin 0.7s linear infinite; flex-shrink: 0;
                }
                .sa-success-overlay {
                    position: fixed; inset: 0;
                    background: rgba(255,255,255,0.92);
                    backdrop-filter: blur(8px);
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center; gap: 16px;
                    z-index: 1000;
                    animation: saOverlayIn 0.4s ease;
                }
                .sa-success-check {
                    width: 80px; height: 80px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    border-radius: 50%; display: flex;
                    align-items: center; justify-content: center;
                    color: white; font-size: 36px;
                    animation: saCheckBounce 0.5s cubic-bezier(0.34,1.56,0.64,1);
                    box-shadow: 0 8px 30px rgba(16,185,129,0.4);
                }
                .sa-selected-preview {
                    background: #f0fdf4; border: 1px solid rgba(16,185,129,0.2);
                    border-radius: 12px; padding: 12px 16px;
                    margin-top: 12px; margin-bottom: 20px;
                    display: flex; align-items: center; gap: 10px;
                    animation: saPreviewIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
                }
            `}</style>

            {/* Toast */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        style={{
                            position: 'fixed', top: 16, left: 16, right: 16, zIndex: 9999,
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '14px 16px', borderRadius: 16, fontWeight: 700, fontSize: 14,
                            background: toast.type === 'success' ? '#059669' : '#ef4444',
                            color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                            fontFamily: 'Signika, sans-serif',
                        }}
                    >
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
                            {toast.type === 'success' ? '✓' : '✕'}
                        </div>
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success overlay */}
            {success && (
                <div className="sa-success-overlay">
                    <div className="sa-success-check">✓</div>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#059669', fontFamily: 'Signika, sans-serif' }}>
                        Redirecting to dashboard...
                    </p>
                </div>
            )}

            <div style={{
                minHeight: '100dvh', background: '#f9fafb',
                fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '32px 20px',
            }}>
                {/* Decorative blobs */}
                <div style={{ position: 'fixed', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(239,56,55,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'fixed', bottom: -40, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle,rgba(239,56,55,0.05) 0%,transparent 70%)', pointerEvents: 'none' }} />

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.34, 1.1, 0.64, 1] }}
                    style={{ width: '100%', maxWidth: 420 }}
                >
                    {/* Logo */}
                    <div style={{ marginBottom: 24 }}>
                        <img src="/eBuySugar.jpg" alt="eBuySugar" style={{ height: 56, objectFit: 'contain', display: 'block' }} />
                    </div>

                    {/* Badge pill */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff1f0', border: '1px solid rgba(239,56,55,0.15)', color: '#ef3837', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 50, marginBottom: 14 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef3837', animation: 'saDotPulse 1.5s ease-in-out infinite' }} />
                        Account Selection
                    </div>

                    {/* Title */}
                    <h1 style={{ fontSize: 'clamp(26px,7vw,36px)', fontWeight: 900, color: '#111827', lineHeight: 1.1, letterSpacing: -1, margin: '0 0 10px' }}>
                        Choose your<br /><span style={{ color: '#ef3837' }}>account</span>
                    </h1>
                    <p style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, lineHeight: 1.6, marginBottom: 26 }}>
                        Multiple accounts found for{' '}
                        <strong style={{ color: '#111827', fontWeight: 700 }}>+91 {mobile}</strong>.<br />
                        Select the account you want to continue with.
                    </p>

                    {/* Account count badge */}
                    {accounts.length > 0 && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid rgba(16,185,129,0.2)', color: '#059669', fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: 50, marginBottom: 22 }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                            {accounts.length} account{accounts.length !== 1 ? 's' : ''} available
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#374151', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                            Select Account
                        </label>

                        <div className={`sa-select-wrap${focused ? ' focused' : ''}${shake ? ' shake' : ''}`}>
                            <select
                                value={selectedAccount}
                                onChange={e => setSelected(e.target.value)}
                                onFocus={() => setFocused(true)}
                                onBlur={() => { if (!selectedAccount) setFocused(false); }}
                                disabled={isLoading}
                                className={`sa-select${selectedAccount ? ' has-value' : ''}`}
                            >
                                <option value="" disabled>Choose an account</option>
                                {accounts.map((account) => {
                                    const name = account.display_name || account.Ac_Name_E || 'Account';
                                    const code = account.Ac_Code ? ` (${account.Ac_Code})` : '';
                                    return (
                                        <option key={account.accoid} value={String(account.accoid)}>
                                            {name}{code}
                                        </option>
                                    );
                                })}
                            </select>
                            <svg className="sa-select-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </div>

                        {/* Selected preview */}
                        {selectedObj && (
                            <div className="sa-selected-preview">
                                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16, flexShrink: 0 }}>
                                    ✓
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>Selected account</div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: '#065f46' }}>
                                        {selectedObj.display_name || selectedObj.Ac_Name_E}
                                        {selectedObj.Ac_Code ? ` — ${selectedObj.Ac_Code}` : ''}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Continue */}
                        <button
                            type="submit"
                            disabled={isLoading || !selectedAccount}
                            className={`sa-btn-primary${selectedAccount && !isLoading ? ' ready' : ''}`}
                        >
                            {isLoading ? (
                                <><div className="sa-spinner" /> Processing...</>
                            ) : (
                                <>Continue <span style={{ fontSize: 18 }}>→</span></>
                            )}
                        </button>

                        {/* Go Back */}
                        <button
                            type="button"
                            onClick={() => router.push('/login')}
                            disabled={isLoading}
                            className="sa-btn-cancel"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M19 12H5M12 5l-7 7 7 7" />
                            </svg>
                            Go Back
                        </button>
                    </form>
                </motion.div>
            </div>
        </>
    );
}
