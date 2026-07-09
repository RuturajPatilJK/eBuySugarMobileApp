'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';
import { useGetAvailableSugarTendersQuery } from '../../services/availableOneBuysugarApi';
import { useFifoPurchaseMutation, useGetMyBalanceQuery } from '../../services/tenderApi';
import { useGetMeQuery } from '../../services/authApi';

function LiveDot() {
    return (
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 10, height: 10 }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ade80', animation: 'livePing 1.4s ease-in-out infinite' }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'block' }} />
        </span>
    );
}

function SkeletonCard() {
    return (
        <div style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 18, width: '60%', marginBottom: 8 }} />
                    <div style={{ display: 'flex', gap: 6 }}>
                        <div className="skeleton" style={{ height: 20, width: 60, borderRadius: 6 }} />
                        <div className="skeleton" style={{ height: 20, width: 44, borderRadius: 6 }} />
                    </div>
                </div>
                <div className="skeleton" style={{ height: 32, width: 70, borderRadius: 8 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="skeleton" style={{ height: 14, width: 80 }} />
                <div className="skeleton" style={{ height: 36, width: 90, borderRadius: 10 }} />
            </div>
        </div>
    );
}

export default function BuyPage() {
    const { data: tenders = [], isLoading, refetch } = useGetAvailableSugarTendersQuery();
    const { data: user } = useGetMeQuery();
    const { data: balance } = useGetMyBalanceQuery();
    const [fifoPurchase, { isLoading: isPurchasing }] = useFifoPurchaseMutation();
    const [selectedTender, setSelectedTender] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [qtyError, setQtyError] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
    const [filter, setFilter] = useState('');

    const isGuest = user?.Ac_type === 'G';
    const companyCode = parseInt(process.env.NEXT_PUBLIC_COMPANY_CODE) || 4;

    const showToast = (message, type = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(p => ({ ...p, show: false })), 3500);
    };

    const validateQty = (val, maxBalance) => {
        if (!val) return '';
        const n = parseFloat(val);
        if (isNaN(n) || n <= 0) return 'Enter valid quantity';
        if (n % 5 !== 0) return 'Must be multiple of 5';
        if (maxBalance && n > parseFloat(maxBalance)) return 'Exceeds available stock';
        return '';
    };

    const handleQtyChange = (val) => {
        setQuantity(val);
        setQtyError(validateQty(val, selectedTender?.Balance));
    };

    const handlePurchase = async () => {
        if (isGuest) { showToast('Register to buy tenders.', 'error'); return; }
        const err = validateQty(quantity, selectedTender?.Balance);
        if (err) { setQtyError(err); return; }
        try {
            await fifoPurchase({
                tenderdetailid: selectedTender.tenderdetailid,
                mill_code: selectedTender.Mill_Code,
                gradeid: selectedTender.gradeid,
                sale_rate: selectedTender.Sale_Rate,
                lifting_date: selectedTender.Lifting_Date,
                buy_quantal: parseFloat(quantity),
                company_code: selectedTender.Company_Code || companyCode,
            }).unwrap();
            showToast('Purchase successful!', 'success');
            setSelectedTender(null);
            setQuantity('');
            setQtyError('');
            refetch();
        } catch (err) {
            showToast(err?.data?.detail || 'Purchase failed. Try again.', 'error');
        }
    };

    const filtered = tenders.filter(t =>
        t.stop_resume_trading !== 'Y' && (
            !filter ||
            (t.Ac_Name_E || '').toLowerCase().includes(filter.toLowerCase()) ||
            (t.gradeName || '').toLowerCase().includes(filter.toLowerCase()) ||
            (t.productname || '').toLowerCase().includes(filter.toLowerCase())
        )
    );

    const totalQty = tenders
        .filter(t => t.stop_resume_trading !== 'Y')
        .reduce((s, t) => s + parseFloat(t.Balance || 0), 0);

    const estimatedAmount = quantity && !qtyError && selectedTender
        ? parseFloat(quantity) * parseFloat(selectedTender.Sale_Rate || 0)
        : 0;

    return (
        <AppLayout title="Buy Sugar">
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -60 }}
                        style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 14, fontWeight: 700, fontSize: 14, background: toast.type === 'success' ? '#059669' : '#ef4444', color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', whiteSpace: 'nowrap', maxWidth: 'calc(100vw - 32px)' }}
                    >
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{toast.type === 'success' ? '✓' : '✕'}</div>
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ padding: '12px 16px', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>

                {/* Balance banner */}
                {balance && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        style={{ background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 16, padding: '14px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700, marginBottom: 3 }}>AVAILABLE BALANCE</p>
                            <p style={{ color: 'white', fontSize: 20, fontWeight: 900 }}>₹{(balance?.available_balance || 0).toLocaleString('en-IN')}</p>
                        </div>
                        <span style={{ fontSize: 26 }}>💰</span>
                    </motion.div>
                )}

                {/* Live market status */}
                {!isLoading && tenders.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderRadius: 12, padding: '10px 14px', marginBottom: 12, border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <LiveDot />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Market Live</span>
                        </div>
                        <div style={{ display: 'flex', gap: 14 }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase' }}>Tenders</p>
                                <p style={{ fontSize: 13, fontWeight: 900, color: '#ef3837' }}>{filtered.length}</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase' }}>Avail Qty</p>
                                <p style={{ fontSize: 13, fontWeight: 900, color: '#374151' }}>{totalQty.toFixed(0)} qtl</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: 14 }}>
                    <svg style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input type="text" value={filter} placeholder="Search by mill, grade, product..."
                        onChange={e => setFilter(e.target.value)}
                        style={{ width: '100%', padding: '12px 36px 12px 38px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 14, color: '#111827', outline: 'none', fontFamily: 'inherit' }} />
                    {filter && (
                        <button onClick={() => setFilter('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af', padding: 2 }}>×</button>
                    )}
                </div>

                {/* Tenders */}
                {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 20, border: '1.5px dashed #e5e7eb' }}>
                        <div style={{ fontSize: 52, marginBottom: 12 }}>📭</div>
                        <p style={{ fontWeight: 800, color: '#374151', marginBottom: 6, fontSize: 16 }}>
                            {filter ? 'No tenders match your search' : 'No tenders available'}
                        </p>
                        <p style={{ color: '#9ca3af', fontSize: 13 }}>{filter ? 'Try a different keyword.' : 'Check back later for new listings.'}</p>
                        {filter && (
                            <button onClick={() => setFilter('')} style={{ marginTop: 16, padding: '10px 22px', background: '#f3f4f6', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Clear Search</button>
                        )}
                    </motion.div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {filter && <p style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 2 }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>}
                        {filtered.map((tender, i) => (
                            <motion.div
                                key={tender.tenderdetailid ?? i}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(i * 0.04, 0.4), type: 'spring', stiffness: 300, damping: 25 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    background: 'white', borderRadius: 16, padding: '14px 16px',
                                    boxShadow: selectedTender?.tenderdetailid === tender.tenderdetailid ? '0 4px 20px rgba(239,56,55,0.2)' : '0 1px 6px rgba(0,0,0,0.05)',
                                    border: `2px solid ${selectedTender?.tenderdetailid === tender.tenderdetailid ? '#ef3837' : '#f3f4f6'}`,
                                    transition: 'box-shadow 0.2s, border-color 0.2s',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 800, fontSize: 14, color: '#111827', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {tender.Ac_Name_E || 'Mill'}
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                            {[tender.gradeName, tender.season, tender.Packing ? `${tender.Packing}kg` : null].filter(Boolean).map((tag, j) => (
                                                <span key={j} style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', background: '#f3f4f6', padding: '3px 8px', borderRadius: 6 }}>{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                                        <div style={{ fontWeight: 900, fontSize: 18, color: '#ef3837' }}>₹{tender.Sale_Rate}</div>
                                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>/qtl</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>
                                        Available: <strong style={{ color: '#111827' }}>{tender.Balance || '—'}</strong> qtl
                                    </div>
                                    <motion.button
                                        whileTap={{ scale: 0.94 }}
                                        onClick={() => { setSelectedTender(tender); setQuantity(''); setQtyError(''); }}
                                        disabled={isGuest}
                                        style={{ padding: '8px 18px', background: isGuest ? '#f3f4f6' : 'linear-gradient(135deg,#ef3837,#d92300)', border: 'none', borderRadius: 10, color: isGuest ? '#9ca3af' : 'white', fontSize: 13, fontWeight: 800, cursor: isGuest ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: isGuest ? 'none' : '0 2px 10px rgba(239,56,55,0.3)' }}
                                    >
                                        {isGuest ? 'Guest' : 'Buy Now'}
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Purchase bottom sheet */}
            <AnimatePresence>
                {selectedTender && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSelectedTender(null); setQuantity(''); setQtyError(''); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 60, backdropFilter: 'blur(2px)' }} />
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 70, background: 'white', borderRadius: '22px 22px 0 0', padding: '0 20px 40px', paddingBottom: 'max(40px, env(safe-area-inset-bottom))' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 6px' }}>
                                <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e5e7eb' }} />
                            </div>

                            {/* Mill strip */}
                            <div style={{ background: '#fff1f0', borderRadius: 14, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ef3837', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 16, flexShrink: 0 }}>
                                    {(selectedTender.Ac_Name_E || 'M').charAt(0)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 800, fontSize: 14, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedTender.Ac_Name_E}</p>
                                    <p style={{ fontSize: 12, color: '#ef3837', fontWeight: 700 }}>₹{selectedTender.Sale_Rate}/qtl · {selectedTender.gradeName} · {selectedTender.season}</p>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700 }}>AVAIL</p>
                                    <p style={{ fontWeight: 900, fontSize: 14, color: '#111827' }}>{selectedTender.Balance} qtl</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <label style={{ fontSize: 11, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quantity (Quintals)</label>
                                <span style={{ fontSize: 11, color: '#6b7280' }}>Max <strong style={{ color: '#2563eb' }}>{selectedTender.Balance}</strong> qtl</span>
                            </div>

                            {/* Stepper */}
                            <div style={{ display: 'flex', alignItems: 'center', border: `2px solid ${qtyError ? '#fca5a5' : '#e5e7eb'}`, borderRadius: 12, overflow: 'hidden', marginBottom: 6, background: qtyError ? '#fef2f2' : 'white' }}>
                                <button onClick={() => { const n = Math.max(0, (parseFloat(quantity) || 0) - 5); handleQtyChange(n > 0 ? String(n) : ''); }} style={{ width: 48, height: 52, background: 'none', border: 'none', fontSize: 22, fontWeight: 700, color: '#374151', cursor: 'pointer', flexShrink: 0, borderRight: '1px solid #f3f4f6' }}>−</button>
                                <input
                                    type="number" value={quantity} placeholder="0" autoFocus
                                    onChange={e => handleQtyChange(e.target.value)}
                                    style={{ flex: 1, border: 'none', outline: 'none', textAlign: 'center', fontSize: 20, fontWeight: 900, color: '#111827', fontFamily: 'inherit', padding: '0 8px', height: 52, background: 'transparent' }}
                                />
                                <button onClick={() => { const n = (parseFloat(quantity) || 0) + 5; handleQtyChange(String(n)); }} style={{ width: 48, height: 52, background: 'none', border: 'none', fontSize: 22, fontWeight: 700, color: '#374151', cursor: 'pointer', flexShrink: 0, borderLeft: '1px solid #f3f4f6' }}>+</button>
                            </div>
                            {qtyError
                                ? <p style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, marginBottom: 12 }}>⚠ {qtyError}</p>
                                : <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 12 }}>Multiples of 5 only (5, 10, 50, 100…)</p>
                            }

                            {/* Amount preview */}
                            {estimatedAmount > 0 && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                    style={{ background: '#f0fdf4', borderRadius: 12, padding: '10px 14px', marginBottom: 14, border: '1px solid #bbf7d0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                        <span style={{ fontSize: 11, color: '#374151', fontWeight: 600 }}>Subtotal (ex-GST)</span>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: '#374151' }}>₹{estimatedAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: 11, color: '#9ca3af' }}>GST @ 5%</span>
                                        <span style={{ fontSize: 11, color: '#9ca3af' }}>₹{(estimatedAmount * 0.05).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #d1fae5' }}>
                                        <span style={{ fontSize: 12, fontWeight: 800, color: '#059669' }}>Est. Total (incl. GST)</span>
                                        <span style={{ fontSize: 15, fontWeight: 900, color: '#059669' }}>₹{(estimatedAmount * 1.05).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                    </div>
                                </motion.div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <button onClick={() => { setSelectedTender(null); setQuantity(''); setQtyError(''); }} style={{ padding: '15px', background: '#f3f4f6', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handlePurchase}
                                    disabled={isPurchasing || !!qtyError || !quantity}
                                    style={{ padding: '15px', background: 'linear-gradient(135deg,#ef3837,#d92300)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800, color: 'white', cursor: isPurchasing || !!qtyError || !quantity ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: isPurchasing || !!qtyError || !quantity ? 0.6 : 1, boxShadow: '0 4px 14px rgba(239,56,55,0.35)' }}
                                >
                                    {isPurchasing
                                        ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Buying...</>
                                        : '🛒 Confirm Buy'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes livePing { 0%{transform:scale(1);opacity:1;} 75%,100%{transform:scale(2.2);opacity:0;} }`}</style>
        </AppLayout>
    );
}
