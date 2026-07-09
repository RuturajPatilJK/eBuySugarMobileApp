'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/layout/AppLayout';
import { useGetMeQuery } from '../../services/authApi';
import { useGetAvailableSugarTendersQuery } from '../../services/availableOneBuysugarApi';
import { useFifoPurchaseMutation, useGetMyBalanceQuery, useUpdateTenderRatesAndQuantalMutation, useDeleteTenderMutation } from '../../services/tenderApi';
import { useGetMyesalesaudaQuery, myesalesaudaApi } from '../../services/myesalesaudaApi';

const COMPANY_CODE = parseInt(process.env.NEXT_PUBLIC_COMPANY_CODE) || 4;

const fmtAmt = (n) => parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
const fmtDate = (s) => {
    if (!s) return '—';
    const d = new Date(s);
    if (isNaN(d)) return s.slice(0, 10);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};
const fmtDateShort = (s) => {
    if (!s) return '—';
    const d = new Date(s);
    if (isNaN(d)) return '—';
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const h = d.getHours(), m = d.getMinutes();
    const ap = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} - ${h12}:${String(m).padStart(2,'0')} ${ap}`;
};

// ── Countdown (web-client style) ─────────────────────────────────────────────
// expireDate = EbuySugarLiftingDate (date portion, ISO YYYY-MM-DD)
// expireTime = EbuySugarSaudaExpire_Time (time portion, HH:MM:SS)
function CountdownDisplay({ expireDate, expireTime, compact }) {
    const [label, setLabel] = useState('…');
    const [urgent, setUrgent] = useState(false);
    const [absLabel, setAbsLabel] = useState(null);

    useEffect(() => {
        const dateStr = expireDate ? String(expireDate).slice(0, 10) : null;
        const timeStr = expireTime ? String(expireTime).slice(0, 8) : null;
        if (!dateStr || !timeStr || dateStr === 'undefined' || timeStr === 'undefined') {
            setLabel('—'); return;
        }
        const expiry = new Date(`${dateStr}T${timeStr}`);
        if (isNaN(expiry.getTime())) { setLabel('—'); return; }

        // Build absolute label once
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const h0 = expiry.getHours(), m0 = expiry.getMinutes();
        const ap = h0 >= 12 ? 'PM' : 'AM';
        const h12 = h0 % 12 || 12;
        setAbsLabel(`${expiry.getDate()} ${months[expiry.getMonth()]} ${expiry.getFullYear()} - ${h12}:${String(m0).padStart(2,'0')} ${ap}`);

        const tick = () => {
            const diff = expiry - new Date();
            if (diff <= 0) { setLabel('Expired'); setUrgent(true); return; }
            const s = Math.floor(diff / 1000);
            const h = Math.floor(s / 3600);
            const mn = Math.floor((s % 3600) / 60);
            const sec = s % 60;
            setLabel(`${h}h ${String(mn).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s`);
            setUrgent(s < 3600);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [expireDate, expireTime]);

    if (compact) {
        return (
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: urgent ? '#ef3837' : '#059669', fontFamily: 'monospace', lineHeight: 1.3 }}>{label}</div>
                {absLabel && <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 500, marginTop: 1 }}>{absLabel}</div>}
            </div>
        );
    }
    return (
        <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: urgent ? '#ef3837' : '#059669', fontFamily: 'monospace', lineHeight: 1.2 }}>{label}</div>
            {absLabel && <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, marginTop: 3 }}>{absLabel}</div>}
        </div>
    );
}

function BalanceChip({ label, value, isLoading, color, bg, border, icon }) {
    return (
        <div style={{ flex: 1, background: bg, border: `1.5px solid ${border}`, borderRadius: 14, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{icon}</div>
            <div>
                <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color, marginBottom: 1 }}>{label}</p>
                {isLoading
                    ? <div className="skeleton" style={{ height: 18, width: 60, borderRadius: 4 }} />
                    : <p style={{ fontSize: 16, fontWeight: 900, color: '#111827', letterSpacing: '-0.01em' }}>
                        {Number(value || 0).toLocaleString('en-IN')} <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af' }}>Qtl</span>
                    </p>
                }
            </div>
        </div>
    );
}

// ── Image Slider (no greeting/live badge overlay) ─────────────────────────────
const SLIDES = [
    {
        image: 'https://picsum.photos/seed/sugarcane2025/800/340',
        tag: 'Digital Sugar Trade',
        title: 'Buy Premium Sugar',
        subtitle: 'Direct from mills · Best rates · FIFO pricing',
    },
    {
        image: 'https://picsum.photos/seed/sugarmill2025/800/340',
        tag: 'Live Tenders',
        title: 'Real-Time Auctions',
        subtitle: 'Watch live countdowns · Grab offers fast',
    },
    {
        image: 'https://picsum.photos/seed/sugartrade2025/800/340',
        tag: 'eBuySugar Platform',
        title: 'India\'s Sugar Marketplace',
        subtitle: 'Trusted by mills & traders across India',
    },
];

function ImageSlider() {
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);
    const touchStartX = useRef(null);

    useEffect(() => {
        if (paused) return;
        const id = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 3800);
        return () => clearInterval(id);
    }, [paused]);

    const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 40) setCurrent(c => (c + (dx < 0 ? 1 : -1) + SLIDES.length) % SLIDES.length);
        touchStartX.current = null;
    };

    const slide = SLIDES[current];
    return (
        <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', marginBottom: 14, boxShadow: '0 6px 24px rgba(0,0,0,0.14)' }}
            onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            <AnimatePresence mode="wait">
                <motion.img key={current} src={slide.image} alt={slide.title}
                    initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.55, ease: 'easeInOut' }}
                    style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block' }} />
            </AnimatePresence>

            {/* Dark gradient at bottom */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6) 100%)' }} />

            {/* Slide text */}
            <AnimatePresence mode="wait">
                <motion.div key={current} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, delay: 0.15 }}
                    style={{ position: 'absolute', bottom: 32, left: 16, right: 16 }}>
                    <span style={{ display: 'inline-block', background: 'rgba(239,56,55,0.92)', color: 'white', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 5, marginBottom: 5 }}>
                        {slide.tag}
                    </span>
                    <p style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: '0 0 3px', textShadow: '0 1px 4px rgba(0,0,0,0.5)', lineHeight: 1.2 }}>{slide.title}</p>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 500, margin: 0 }}>{slide.subtitle}</p>
                </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
                {SLIDES.map((_, i) => (
                    <button key={i} onClick={() => setCurrent(i)}
                        style={{ width: i === current ? 18 : 6, height: 6, borderRadius: 3, background: i === current ? 'white' : 'rgba(255,255,255,0.45)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s ease' }} />
                ))}
            </div>
        </div>
    );
}

// ── Tender Detail Sheet ────────────────────────────────────────────────────────
function TenderDetailSheet({ tender, onClose, onBuy, isGuest }) {
    if (!tender) return null;
    const expDate = tender.EbuySugarLiftingDate || tender.Lifting_Date;
    const expTime = tender.EbuySugarSaudaExpire_Time;

    const sections = [
        {
            heading: 'Mill Information',
            rows: [
                { label: 'Mill Code',    value: tender.Mill_Code || '—' },
                { label: 'Mill Name',    value: tender.Ac_Name_E || '—' },
                { label: 'Short Name',   value: tender.Short_Name || '—' },
            ],
        },
        {
            heading: 'Product Details',
            rows: [
                { label: 'Product',      value: tender.Product_Name || 'Sugar' },
                { label: 'Grade',        value: tender.gradeName || '—' },
                { label: 'Season',       value: tender.season || '—' },
                { label: 'Packing',      value: tender.Packing ? `${tender.Packing} kg` : '—' },
                { label: 'Delivery',     value: tender.delivery_from || tender.Delivery_Place || 'Ex Mill' },
            ],
        },
        {
            heading: 'Dates',
            rows: [
                { label: 'Doc Date',     value: fmtDate(tender.Doc_Date || tender.Tender_Date || tender.Sauda_Date) },
                { label: 'Payment Date', value: fmtDate(tender.Payment_Date || tender.Doc_Date) },
                { label: 'Lifting Date', value: fmtDate(tender.EbuySugarLiftingDate || tender.Lifting_Date) },
                { label: 'Expiry Time',  value: tender.EbuySugarSaudaExpire_Time ? String(tender.EbuySugarSaudaExpire_Time).slice(0,8) : '—' },
            ],
        },
        {
            heading: 'Pricing & Quantity',
            rows: [
                { label: 'Rate (w/o GST)', value: `₹ ${parseFloat(tender.Sale_Rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, bold: true, accent: true },
                { label: 'Available Qty',  value: `${parseFloat(tender.Balance || 0).toFixed(0)} Qtl`, bold: true },
            ],
        },
    ];

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 70, backdropFilter: 'blur(3px)' }} />
            <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 80, background: 'white', borderRadius: '22px 22px 0 0', maxHeight: '92vh', overflowY: 'auto', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>

                {/* Handle */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
                    <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e5e7eb' }} />
                </div>

                {/* Header */}
                <div style={{ padding: '14px 20px 14px', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 11, background: '#fff1f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🏭</div>
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ fontWeight: 900, fontSize: 15, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tender.Ac_Name_E || 'Mill'}</p>
                                    <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, fontWeight: 500 }}>Code: {tender.Mill_Code || '—'}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                {[tender.gradeName, tender.Packing ? `${tender.Packing}kg` : null, tender.season].filter(Boolean).map((t, j) => (
                                    <span key={j} style={{ fontSize: 10, fontWeight: 700, background: j === 0 ? '#eff6ff' : '#f3f4f6', color: j === 0 ? '#1d4ed8' : '#6b7280', padding: '3px 8px', borderRadius: 6 }}>{t}</span>
                                ))}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ fontWeight: 900, fontSize: 26, color: '#ef3837', margin: 0, lineHeight: 1 }}>₹{parseFloat(tender.Sale_Rate || 0).toLocaleString('en-IN')}</p>
                            <p style={{ fontSize: 10, color: '#9ca3af', margin: '3px 0 0', fontWeight: 500 }}>per quintal</p>
                        </div>
                    </div>
                </div>

                {/* Expiry countdown */}
                <div style={{ margin: '12px 20px', background: 'linear-gradient(135deg,#fff8f8,#fff1f0)', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px' }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>⏱ Expiry Countdown</p>
                    <CountdownDisplay expireDate={expDate} expireTime={expTime} />
                </div>

                {/* Sectioned info */}
                {sections.map(({ heading, rows }) => (
                    <div key={heading} style={{ margin: '0 20px 14px' }}>
                        <p style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px', paddingBottom: 5, borderBottom: '1px solid #f3f4f6' }}>{heading}</p>
                        {rows.map(({ label, value, bold, accent }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid #f9fafb' }}>
                                <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, flexShrink: 0 }}>{label}</span>
                                <span style={{ fontSize: bold ? 14 : 13, fontWeight: bold ? 900 : 600, color: accent ? '#ef3837' : '#111827', textAlign: 'right', marginLeft: 12 }}>{value}</span>
                            </div>
                        ))}
                    </div>
                ))}

                {/* Actions */}
                <div style={{ padding: '4px 20px 4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button onClick={onClose}
                        style={{ padding: '14px', background: '#f3f4f6', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'Signika, sans-serif' }}>
                        Close
                    </button>
                    {!isGuest && (
                        <motion.button whileTap={{ scale: 0.97 }} onClick={onBuy}
                            style={{ padding: '14px', background: 'linear-gradient(135deg,#ef3837,#d92300)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800, color: 'white', cursor: 'pointer', fontFamily: 'Signika, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 16px rgba(239,56,55,0.3)' }}>
                            🛒 Buy Now
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </>
    );
}

// ── Buy Tab ───────────────────────────────────────────────────────────────────
function AvailableEBuyTab({ user }) {
    const isGuest = user?.Ac_type === 'G';
    const { data: rawTenders = [], isLoading, refetch, isFetching } = useGetAvailableSugarTendersQuery(undefined, {
        pollingInterval: 30000,
    });
    const [fifoPurchase, { isLoading: isPurchasing }] = useFifoPurchaseMutation();
    const [detailTender, setDetailTender] = useState(null);
    const [selectedTender, setSelectedTender] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [qtyError, setQtyError] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
    const [successData, setSuccessData] = useState(null);
    const [search, setSearch] = useState('');

    const tenders = useMemo(() => rawTenders.filter(t => t.stop_resume_trading !== 'Y'), [rawTenders]);

    const filtered = useMemo(() => {
        if (!search.trim()) return tenders;
        const q = search.trim().toLowerCase();
        return tenders.filter(t =>
            Object.values(t).some(v =>
                v !== null && v !== undefined && String(v).toLowerCase().includes(q)
            )
        );
    }, [tenders, search]);

    const showToast = (message, type = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(p => ({ ...p, show: false })), 3500);
    };

    const validateQty = (val, maxBal) => {
        const n = parseFloat(val);
        if (!val || isNaN(n) || n < 5) return 'Minimum quantity is 5 qtl';
        if (n % 5 !== 0) return 'Quantity must be a multiple of 5';
        if (maxBal && n > parseFloat(maxBal)) return `Exceeds available (${maxBal} qtl)`;
        return '';
    };

    const handleQty = (val) => {
        setQuantity(val);
        setQtyError(validateQty(val, selectedTender?.Balance));
    };

    const handleBuy = async () => {
        const err = validateQty(quantity, selectedTender?.Balance);
        if (err) { setQtyError(err); return; }
        try {
            const result = await fifoPurchase({
                tenderdetailid: selectedTender.tenderdetailid,
                mill_code: selectedTender.Mill_Code,
                gradeid: selectedTender.gradeid,
                sale_rate: selectedTender.Sale_Rate,
                lifting_date: selectedTender.Lifting_Date,
                buy_quantal: parseFloat(quantity),
                company_code: selectedTender.Company_Code || COMPANY_CODE,
            }).unwrap();
            setSuccessData({ mill: selectedTender.Ac_Name_E, grade: selectedTender.gradeName, qty: parseFloat(quantity), rate: parseFloat(selectedTender.Sale_Rate), sauda: result?.sauda_no || result?.tenderdetailid });
            setSelectedTender(null);
            setDetailTender(null);
            setQuantity('');
            refetch();
        } catch (err) {
            showToast(err?.data?.detail || 'Purchase failed. Please try again.', 'error');
        }
    };

    const openBuyFromDetail = () => {
        setSelectedTender(detailTender);
        setDetailTender(null);
        setQuantity('');
        setQtyError('');
    };

    const estCost = selectedTender && quantity ? parseFloat(quantity) * parseFloat(selectedTender.Sale_Rate || 0) : 0;
    const gst = estCost * 0.05;
    const canBuy = parseFloat(quantity) >= 5 && !qtyError;

    return (
        <>
            {/* Toast */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
                        style={{ position: 'fixed', top: 70, left: 16, right: 16, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 14, fontWeight: 700, fontSize: 13, background: toast.type === 'success' ? '#059669' : '#ef4444', color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', fontFamily: 'Signika, sans-serif' }}>
                        {toast.type === 'success' ? '✓' : '✕'} {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search bar */}
            <div style={{ position: 'relative', marginBottom: 14 }}>
                <svg style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search mill, grade, code, rate, season…"
                    style={{ width: '100%', padding: '12px 38px 12px 38px', background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 13, fontSize: 13, fontWeight: 500, outline: 'none', color: '#111827', fontFamily: 'Signika, sans-serif', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
                />
                {isFetching && !search && (
                    <div style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, border: '2px solid #e5e7eb', borderTopColor: '#ef3837', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                )}
                {search && (
                    <button onClick={() => setSearch('')}
                        style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: '#e5e7eb', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: '#6b7280', fontWeight: 700 }}>
                        ×
                    </button>
                )}
            </div>

            {/* Guest banner */}
            {isGuest && (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '12px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>⚠️</span>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#92400e', flex: 1 }}>Register to buy sugar</p>
                </div>
            )}

            {/* Result count */}
            {!isLoading && (
                <p style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 10 }}>
                    {filtered.length} tender{filtered.length !== 1 ? 's' : ''}{search ? ` matching "${search}"` : ' available'}
                </p>
            )}

            {/* Tender cards */}
            {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ background: 'white', borderRadius: 18, padding: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: '1.5px solid #f3f4f6' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div className="skeleton" style={{ height: 16, width: '55%', borderRadius: 6 }} />
                                <div className="skeleton" style={{ height: 24, width: 70, borderRadius: 6 }} />
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                                {[1, 2, 3].map(j => <div key={j} className="skeleton" style={{ height: 20, width: 55, borderRadius: 10 }} />)}
                            </div>
                            <div className="skeleton" style={{ height: 52, borderRadius: 12 }} />
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', background: 'white', borderRadius: 18, border: '1.5px dashed #e5e7eb' }}>
                    <div style={{ fontSize: 48, marginBottom: 10 }}>🏭</div>
                    <p style={{ fontWeight: 800, color: '#374151', marginBottom: 4, fontSize: 15 }}>No tenders found</p>
                    <p style={{ color: '#9ca3af', fontSize: 13 }}>
                        {search ? `No results for "${search}"` : 'Check back later for new listings.'}
                    </p>
                    {search && (
                        <button onClick={() => setSearch('')}
                            style={{ marginTop: 12, padding: '8px 18px', background: '#fff1f0', border: '1px solid #fecaca', borderRadius: 10, color: '#ef3837', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            Clear search
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filtered.map((tender, i) => {
                        const expDate = tender.EbuySugarLiftingDate || tender.Lifting_Date;
                        const expTime = tender.EbuySugarSaudaExpire_Time;
                        const avail = parseFloat(tender.Balance || 0);
                        const rate = parseFloat(tender.Sale_Rate || 0);

                        return (
                            <motion.div
                                key={tender.tenderdetailid || i}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(i * 0.05, 0.4) }}
                                onClick={() => setDetailTender(tender)}
                                whileTap={{ scale: 0.985 }}
                                style={{ background: 'white', borderRadius: 18, boxShadow: '0 2px 14px rgba(0,0,0,0.07)', border: '1.5px solid #f0f0f0', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                            >
                                {/* Top accent stripe */}
                                <div style={{ height: 4, background: 'linear-gradient(90deg,#ef3837,#ff6b35,#ef3837)', backgroundSize: '200% 100%', animation: 'shimmerBar 3s linear infinite' }} />

                                <div style={{ padding: '14px 16px' }}>
                                    {/* Mill + Rate + Full-view arrow */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                                                <p style={{ fontWeight: 800, fontSize: 15, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {tender.Ac_Name_E || 'Mill'}
                                                </p>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M9 18l6-6-6-6" /></svg>
                                            </div>
                                            <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, margin: 0 }}>Code: {tender.Mill_Code || '—'}</p>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                                            <p style={{ fontWeight: 900, fontSize: 22, color: '#ef3837', lineHeight: 1, margin: 0 }}>₹{rate.toLocaleString('en-IN')}</p>
                                            <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500, margin: 0 }}>/qtl</p>
                                        </div>
                                    </div>

                                    {/* Chips */}
                                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                                        {[
                                            tender.gradeName,
                                            tender.Packing ? `${tender.Packing}kg` : null,
                                            tender.season,
                                            tender.delivery_from || 'Ex Mill',
                                        ].filter(Boolean).map((t, j) => (
                                            <span key={j} style={{ fontSize: 10, fontWeight: 700, background: j === 0 ? '#eff6ff' : '#f3f4f6', color: j === 0 ? '#1d4ed8' : '#6b7280', padding: '3px 8px', borderRadius: 6 }}>{t}</span>
                                        ))}
                                    </div>

                                    {/* Bottom row: avail + expiry + buy */}
                                    <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', borderRadius: 12, padding: '10px 12px', gap: 8 }}>
                                        <div style={{ minWidth: 70 }}>
                                            <p style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Available</p>
                                            <p style={{ fontSize: 15, fontWeight: 900, color: '#059669', margin: 0 }}>{avail.toFixed(0)} <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af' }}>Qtl</span></p>
                                        </div>
                                        <div style={{ flex: 1, textAlign: 'right' }}>
                                            <p style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Expires in</p>
                                            <CountdownDisplay expireDate={expDate} expireTime={expTime} compact />
                                        </div>
                                        {!isGuest && (
                                            <motion.button
                                                whileTap={{ scale: 0.93 }}
                                                onClick={e => { e.stopPropagation(); setSelectedTender(tender); setQuantity(''); setQtyError(''); }}
                                                style={{ flexShrink: 0, padding: '9px 14px', background: 'linear-gradient(135deg,#ef3837,#d92300)', border: 'none', borderRadius: 10, color: 'white', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'Signika, sans-serif', boxShadow: '0 3px 10px rgba(239,56,55,0.3)', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                                                🛒 Buy
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Detail Sheet */}
            <AnimatePresence>
                {detailTender && !selectedTender && (
                    <TenderDetailSheet
                        tender={detailTender}
                        onClose={() => setDetailTender(null)}
                        onBuy={openBuyFromDetail}
                        isGuest={isGuest}
                    />
                )}
            </AnimatePresence>

            {/* Buy Sheet */}
            <AnimatePresence>
                {selectedTender && !successData && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTender(null)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 70, backdropFilter: 'blur(3px)' }} />
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 80, background: 'white', borderRadius: '22px 22px 0 0', padding: '20px 20px', maxHeight: '88vh', overflowY: 'auto', paddingBottom: 'max(32px,env(safe-area-inset-bottom))' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                                <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e5e7eb' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #f3f4f6' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff1f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏭</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 900, fontSize: 15, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{selectedTender.Ac_Name_E}</p>
                                    <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, margin: '2px 0 0' }}>{[selectedTender.gradeName, selectedTender.Packing ? `${selectedTender.Packing}kg` : null, selectedTender.season].filter(Boolean).join(' · ')}</p>
                                </div>
                                <p style={{ fontWeight: 900, fontSize: 22, color: '#ef3837', flexShrink: 0, margin: 0 }}>₹{selectedTender.Sale_Rate}</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                                {[
                                    { l: 'Available', v: `${selectedTender.Balance || '—'} qtl` },
                                    { l: 'Lifting Date', v: fmtDate(selectedTender.EbuySugarLiftingDate || selectedTender.Lifting_Date) },
                                ].map(({ l, v }) => (
                                    <div key={l} style={{ background: '#f9fafb', borderRadius: 10, padding: '9px 12px' }}>
                                        <p style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 3 }}>{l}</p>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>{v}</p>
                                    </div>
                                ))}
                            </div>

                            <p style={{ fontSize: 11, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Quantity <span style={{ color: '#9ca3af', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(min 5, multiples of 5)</span></p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                <button onClick={() => { const v = Math.max(5, parseFloat(quantity || 5) - 5); handleQty(String(v)); }}
                                    style={{ width: 44, height: 44, borderRadius: 10, background: '#f3f4f6', border: 'none', fontSize: 22, fontWeight: 700, cursor: 'pointer', color: '#374151', flexShrink: 0 }}>−</button>
                                <input type="number" value={quantity} onChange={e => handleQty(e.target.value)} placeholder="Min 5"
                                    style={{ flex: 1, height: 44, textAlign: 'center', background: '#f9fafb', border: `2px solid ${qtyError ? '#ef4444' : '#e5e7eb'}`, borderRadius: 10, fontSize: 18, fontWeight: 800, color: '#111827', outline: 'none', fontFamily: 'Signika, sans-serif' }} />
                                <button onClick={() => { const v = parseFloat(quantity || 0) + 5; handleQty(String(v)); }}
                                    style={{ width: 44, height: 44, borderRadius: 10, background: '#fff1f0', border: '1px solid #fecaca', fontSize: 22, fontWeight: 700, cursor: 'pointer', color: '#ef3837', flexShrink: 0 }}>+</button>
                            </div>
                            {qtyError && <p style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, marginBottom: 10 }}>⚠ {qtyError}</p>}

                            {canBuy && (
                                <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
                                    {[
                                        { l: 'Subtotal', v: `₹${fmtAmt(estCost)}` },
                                        { l: 'GST (5%)', v: `₹${fmtAmt(gst)}` },
                                    ].map(({ l, v }) => (
                                        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{l}</span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{v}</span>
                                        </div>
                                    ))}
                                    <div style={{ borderTop: '1px solid #bbf7d0', paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: '#059669' }}>Total</span>
                                        <span style={{ fontSize: 14, fontWeight: 900, color: '#059669' }}>₹{fmtAmt(estCost + gst)}</span>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <button onClick={() => setSelectedTender(null)}
                                    style={{ padding: '14px', background: '#f3f4f6', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'Signika, sans-serif' }}>Cancel</button>
                                <motion.button whileTap={canBuy ? { scale: 0.97 } : {}} onClick={handleBuy}
                                    disabled={isPurchasing || !canBuy}
                                    style={{ padding: '14px', background: isPurchasing || !canBuy ? '#f3f4f6' : 'linear-gradient(135deg,#ef3837,#d92300)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800, color: isPurchasing || !canBuy ? '#9ca3af' : 'white', cursor: isPurchasing || !canBuy ? 'not-allowed' : 'pointer', fontFamily: 'Signika, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: canBuy && !isPurchasing ? '0 4px 16px rgba(239,56,55,0.3)' : 'none' }}>
                                    {isPurchasing ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Buying…</> : '🛒 Confirm Buy'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Success screen */}
            <AnimatePresence>
                {successData && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSuccessData(null)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 70 }} />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 80, background: 'white', borderRadius: '22px 22px 0 0', padding: '28px 24px 40px', textAlign: 'center' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', border: '3px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>✅</div>
                            <p style={{ fontWeight: 900, fontSize: 20, color: '#111827', marginBottom: 4 }}>Order Placed!</p>
                            <p style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, marginBottom: 16 }}>{successData.qty} qtl of {successData.mill} at ₹{successData.rate}/qtl</p>
                            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '12px', marginBottom: 20, textAlign: 'left' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 12, color: '#6b7280' }}>Amount</span>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: '#059669' }}>₹{fmtAmt(successData.qty * successData.rate * 1.05)}</span>
                                </div>
                                {successData.sauda && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Sauda #{successData.sauda}</p>}
                            </div>
                            <button onClick={() => setSuccessData(null)} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#059669,#047857)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800, color: 'white', cursor: 'pointer', fontFamily: 'Signika, sans-serif' }}>Done</button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

// ── My eSale Sauda Tab ────────────────────────────────────────────────────────
const inputSt = {
    width: '100%', padding: '11px 12px', background: '#f9fafb',
    border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14,
    fontWeight: 600, color: '#111827', outline: 'none', fontFamily: 'Signika, sans-serif',
};

function MyESaleSaudaTab() {
    const dispatch = useDispatch();
    const { data: allSales = [], isLoading } = useGetMyesalesaudaQuery();
    const [updateSauda, { isLoading: isUpdating }] = useUpdateTenderRatesAndQuantalMutation();
    const [deleteTender, { isLoading: isDeleting }] = useDeleteTenderMutation();
    const [search, setSearch] = useState('');
    const [editItem, setEditItem] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [editErrors, setEditErrors] = useState({});
    const [deleteItem, setDeleteItem] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const router = useRouter();

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(p => ({ ...p, show: false })), 3500);
    };

    const filtered = useMemo(() => {
        if (!search) return allSales;
        const q = search.toLowerCase();
        return allSales.filter(item =>
            Object.values(item).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(q))
        );
    }, [allSales, search]);

    const totalAvail = filtered.reduce((s, i) => s + parseFloat(i.Balance || 0), 0);
    const totalSold = filtered.reduce((s, i) => s + parseFloat(i.Sold || 0), 0);

    const openEdit = (item) => {
        setEditItem(item);
        setEditForm({
            Sale_Rate: item.Sale_Rate || '',
            Buyer_Quantal: item.Buyer_Quantal || '',
            Lifting_Date: item.Lifting_Date ? String(item.Lifting_Date).split('T')[0] : new Date().toISOString().split('T')[0],
            from_software: (item.from_software || '').trim(),
            Quantal: item.Quantal || item.Buyer_Quantal || '',
        });
        setEditErrors({});
    };

    const handleEditSave = async () => {
        const errs = {};
        const q = parseFloat(editForm.Buyer_Quantal);
        if (!editForm.Buyer_Quantal) errs.Buyer_Quantal = 'Required';
        else if (isNaN(q) || q <= 0) errs.Buyer_Quantal = 'Must be > 0';
        else if (q % 5 !== 0) errs.Buyer_Quantal = 'Must be a multiple of 5';
        const r = parseFloat(editForm.Sale_Rate);
        if (!editForm.Sale_Rate) errs.Sale_Rate = 'Required';
        else if (isNaN(r) || r <= 0) errs.Sale_Rate = 'Must be > 0';
        if (Object.keys(errs).length > 0) { setEditErrors(errs); return; }
        setEditErrors({});
        try {
            await updateSauda({
                id: editItem.tenderid,
                Tender_Date: String(editItem.Sauda_Date || new Date().toISOString()).split('T')[0],
                Mill_Rate: parseFloat(editForm.Sale_Rate),
                Narration: '',
                Party_Bill_Rate: parseFloat(editForm.Sale_Rate),
                Quantal: parseFloat(editForm.Quantal || editForm.Buyer_Quantal),
                ebuy_quantal: parseFloat(editForm.Buyer_Quantal),
                tenderdetailid: editItem.tenderdetailid,
                Lifting_Date: editForm.Lifting_Date,
                EbuySelectedParty: null,
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
            showToast(typeof detail === 'string' ? detail : 'Failed to delete sauda', 'error');
        }
    };

    return (
        <>
            <AnimatePresence>
                {toast.show && (
                    <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
                        style={{ position: 'fixed', top: 70, left: 16, right: 16, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 14, fontWeight: 700, fontSize: 13, background: toast.type === 'success' ? '#059669' : '#ef4444', color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', fontFamily: 'Signika, sans-serif' }}>
                        {toast.type === 'success' ? '✓' : '✕'} {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>
                    {isLoading ? 'Loading…' : `${allSales.length} record${allSales.length !== 1 ? 's' : ''}`}
                </p>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => router.push('/add-sale')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 800, color: 'white', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 12px rgba(124,58,237,0.3)' }}>
                    + New Sauda
                </motion.button>
            </div>

            {!isLoading && allSales.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[
                        { label: 'Records', value: filtered.length, color: '#7c3aed' },
                        { label: 'Available', value: `${totalAvail.toFixed(0)} qtl`, color: '#059669' },
                        { label: 'Sold', value: `${totalSold.toFixed(0)} qtl`, color: '#d97706' },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{ background: 'white', borderRadius: 12, padding: '9px 10px', textAlign: 'center', border: '1px solid #f3f4f6' }}>
                            <p style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>{label}</p>
                            <p style={{ fontSize: 13, fontWeight: 900, color }}>{value}</p>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ position: 'relative', marginBottom: 12 }}>
                <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search any field…"
                    style={{ width: '100%', padding: '10px 10px 10px 34px', background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontWeight: 500, outline: 'none', color: '#111827', fontFamily: 'Signika, sans-serif' }} />
            </div>

            {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ background: 'white', borderRadius: 14, padding: 14 }}>
                            <div className="skeleton" style={{ height: 16, width: '55%', marginBottom: 8 }} />
                            <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 10 }} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                                {[1, 2, 3].map(j => <div key={j} className="skeleton" style={{ height: 40, borderRadius: 8 }} />)}
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', background: 'white', borderRadius: 16, border: '1.5px dashed #e5e7eb' }}>
                    <div style={{ fontSize: 48, marginBottom: 10 }}>🏆</div>
                    <p style={{ fontWeight: 800, color: '#374151', fontSize: 15, marginBottom: 4 }}>No e-sale records</p>
                    <p style={{ color: '#9ca3af', fontSize: 13 }}>{search ? 'No records match the search.' : 'No records available.'}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filtered.map((item, i) => {
                        const qty = parseFloat(item.Buyer_Quantal || 0);
                        const avail = parseFloat(item.Balance || 0);
                        const sold = parseFloat(item.Sold || 0);
                        const rate = parseFloat(item.Sale_Rate || 0);
                        const isSoldOut = avail <= 0;
                        const isExpired = item.stop_resume_trading === 'E';
                        const isStopped = item.stop_resume_trading === 'Y';
                        return (
                            <motion.div key={item.tenderdetailid || i}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                                style={{ background: isSoldOut ? '#f0fdf4' : isExpired ? '#fff5f5' : 'white', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: `1px solid ${isSoldOut ? '#bbf7d0' : isExpired ? '#fecaca' : '#f3f4f6'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                            <p style={{ fontWeight: 800, fontSize: 14, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {item.Ac_Name_E || item.Short_Name || 'Mill'}
                                            </p>
                                            {isSoldOut && <span style={{ fontSize: 9, fontWeight: 800, background: '#dcfce7', color: '#16a34a', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>SOLD OUT</span>}
                                            {isStopped && !isSoldOut && <span style={{ fontSize: 9, fontWeight: 800, background: '#fef3c7', color: '#d97706', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>STOPPED</span>}
                                            {isExpired && <span style={{ fontSize: 9, fontWeight: 800, background: '#fee2e2', color: '#ef4444', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>EXPIRED</span>}
                                        </div>
                                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                            {[item.gradeName, item.Packing ? `${item.Packing}kg` : null, item.season].filter(Boolean).map((t, j) => (
                                                <span key={j} style={{ fontSize: 10, fontWeight: 700, background: '#f3f4f6', color: '#6b7280', padding: '2px 7px', borderRadius: 5 }}>{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 5, flexShrink: 0, marginLeft: 8 }}>
                                        <button onClick={() => openEdit(item)}
                                            style={{ padding: '5px 9px', background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#7c3aed', cursor: 'pointer', fontFamily: 'inherit' }}>✏️</button>
                                        <button onClick={() => setDeleteItem(item)}
                                            style={{ padding: '5px 9px', background: '#fff1f0', border: '1px solid #fecaca', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit' }}>🗑</button>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 6 }}>
                                    {[
                                        { l: 'Display Qty', v: qty.toFixed(2), color: '#4338ca', bg: '#eef2ff' },
                                        { l: 'Available', v: avail.toFixed(2), color: '#16a34a', bg: '#f0fdf4' },
                                        { l: 'Sold', v: sold.toFixed(2), color: '#d97706', bg: '#fffbeb' },
                                    ].map(({ l, v, color, bg }) => (
                                        <div key={l} style={{ background: bg, borderRadius: 8, padding: '7px 8px', textAlign: 'center' }}>
                                            <p style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 2px' }}>{l}</p>
                                            <p style={{ fontSize: 12, fontWeight: 900, color, margin: 0 }}>{v}</p>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ fontSize: 12, fontWeight: 800, color: '#7c3aed', margin: 0 }}>₹{rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/qtl</p>
                                    {item.Tender_No && <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, margin: 0 }}>Tender #{item.Tender_No} · {fmtDate(item.Sauda_Date || item.Tender_Date)}</p>}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Edit sheet */}
            <AnimatePresence>
                {editItem && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditItem(null)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 }} />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: 'white', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px', maxHeight: '92vh', overflowY: 'auto', fontFamily: 'Signika, sans-serif' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                                <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e5e7eb' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div>
                                    <h3 style={{ fontWeight: 900, fontSize: 16, color: '#111827', margin: 0 }}>Edit eSale Sauda</h3>
                                    <p style={{ fontSize: 12, color: '#6b7280', marginTop: 3, marginBottom: 0 }}>Update sauda details below</p>
                                </div>
                                <button onClick={() => setEditItem(null)}
                                    style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#6b7280' }}>×</button>
                            </div>
                            <div style={{ background: '#f9fafb', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
                                {[
                                    { label: 'Mill', value: `${editItem.Ac_Name_E || ''}${editItem.Mill_Code ? ' · ' + editItem.Mill_Code : ''}` || '—' },
                                    { label: 'Grade', value: `${editItem.gradeName || '—'}${editItem.Packing ? ' (' + editItem.Packing + ' Kg)' : ''}` },
                                    { label: 'Season', value: editItem.season || '—' },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 6, marginBottom: 6, borderBottom: '1px solid #f3f4f6' }}>
                                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textAlign: 'right', marginLeft: 12 }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginBottom: 14 }}>
                                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Sale Rate (₹/qtl) <span style={{ color: '#ef4444' }}>*</span></label>
                                <input type="number" value={editForm.Sale_Rate || ''} placeholder="0.00"
                                    disabled={editForm.from_software !== 'S'}
                                    onChange={e => setEditForm(f => ({ ...f, Sale_Rate: e.target.value }))}
                                    style={{ ...inputSt, borderColor: editErrors.Sale_Rate ? '#ef4444' : '#e5e7eb', opacity: editForm.from_software !== 'S' ? 0.55 : 1 }} />
                                {editErrors.Sale_Rate && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>⚠ {editErrors.Sale_Rate}</p>}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Buyer Qty (Qtl) <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input type="number" value={editForm.Buyer_Quantal || ''} placeholder="Multiple of 5" step="5" min="5"
                                        onChange={e => setEditForm(f => ({ ...f, Buyer_Quantal: e.target.value }))}
                                        style={{ ...inputSt, borderColor: editErrors.Buyer_Quantal ? '#ef4444' : '#e5e7eb' }} />
                                    {editErrors.Buyer_Quantal && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>⚠ {editErrors.Buyer_Quantal}</p>}
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Lifting Date</label>
                                    <input type="date" value={editForm.Lifting_Date || ''}
                                        onChange={e => setEditForm(f => ({ ...f, Lifting_Date: e.target.value }))}
                                        style={inputSt} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <button onClick={() => setEditItem(null)}
                                    style={{ padding: '14px', background: '#f3f4f6', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                                <motion.button whileTap={{ scale: 0.97 }} onClick={handleEditSave} disabled={isUpdating}
                                    style={{ padding: '14px', background: isUpdating ? '#c4b5fd' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800, color: 'white', cursor: isUpdating ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    {isUpdating ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Saving…</> : '💾 Save Changes'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete confirm */}
            <AnimatePresence>
                {deleteItem && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteItem(null)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 }} />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 100, background: 'white', borderRadius: 20, padding: '24px 20px', width: 'calc(100% - 48px)', maxWidth: 360, fontFamily: 'Signika, sans-serif' }}>
                            {(() => {
                                const hasSold = parseFloat(deleteItem.Sold || 0) > 0;
                                return (
                                    <>
                                        <div style={{ textAlign: 'center', marginBottom: 14 }}>
                                            <div style={{ fontSize: 40, marginBottom: 8 }}>{hasSold ? '⚠️' : '🗑️'}</div>
                                            <h3 style={{ fontWeight: 900, fontSize: 16, color: '#111827', marginBottom: 4 }}>{hasSold ? 'Partially Sold Sauda' : 'Delete Sauda?'}</h3>
                                            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>This action cannot be undone</p>
                                        </div>
                                        <div style={{ background: '#f9fafb', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
                                            {[
                                                { label: 'Mill', value: deleteItem.Ac_Name_E || deleteItem.Short_Name || '—' },
                                                { label: 'Total Qty', value: `${parseFloat(deleteItem.Buyer_Quantal || 0).toFixed(2)} Qtl` },
                                                ...(hasSold ? [{ label: 'Already Sold', value: `${parseFloat(deleteItem.Sold).toFixed(2)} Qtl`, warn: true }] : []),
                                            ].map(({ label, value, warn }) => (
                                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6, marginBottom: 6, borderBottom: '1px solid #f3f4f6' }}>
                                                    <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{label}</span>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: warn ? '#d97706' : '#374151' }}>{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            <button onClick={() => setDeleteItem(null)}
                                                style={{ padding: '12px', background: '#f3f4f6', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                                            <button onClick={handleDelete} disabled={isDeleting}
                                                style={{ padding: '12px', background: isDeleting ? '#fca5a5' : hasSold ? '#f59e0b' : '#ef4444', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 800, color: 'white', cursor: isDeleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                {isDeleting ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />…</> : hasSold ? 'Reduce & Delete' : '🗑 Delete'}
                                            </button>
                                        </div>
                                    </>
                                );
                            })()}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const { data: user } = useGetMeQuery();
    const { data: balanceData, isLoading: balLoading } = useGetMyBalanceQuery(undefined, {
        skip: user?.Ac_type === 'Z' || user?.Ac_type === 'G',
    });
    const [activeTab, setActiveTab] = useState('buy');

    const isGuest = user?.Ac_type === 'G';
    const isAdmin = user?.Ac_type === 'Z';

    const blBalance = balanceData?.balances?.BL ?? 0;
    const slBalance = balanceData?.balances?.SL ?? 0;

    const tabs = [
        { id: 'buy', label: isAdmin ? 'Available on eBuySugar' : 'Available on eBuy' },
        ...(isGuest ? [] : [{ id: 'sell', label: 'My eSale Sauda' }]),
    ];

    return (
        <AppLayout title="Dashboard">
            <div style={{ padding: '12px 16px 32px', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>

                {/* Image Slider */}
                <ImageSlider />

                {/* Balance chips */}
                {!isAdmin && !isGuest && (
                    <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                        <BalanceChip label="Buy Limit" value={blBalance} isLoading={balLoading} color="#059669" bg="#f0fdf4" border="#bbf7d0" icon="🛒" />
                        <BalanceChip label="Sell Limit" value={slBalance} isLoading={balLoading} color="#2563eb" bg="#eff6ff" border="#bfdbfe" icon="📊" />
                    </div>
                )}

                {/* Guest prompt */}
                {isGuest && (
                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ background: 'linear-gradient(135deg,#fff7ed,#fffbeb)', border: '1.5px solid #fed7aa', borderRadius: 16, padding: '14px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 26 }}>⚠️</span>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 800, fontSize: 13, color: '#92400e', marginBottom: 2 }}>Guest Mode</p>
                            <p style={{ fontSize: 12, color: '#b45309' }}>View only. Register to trade sugar.</p>
                        </div>
                    </motion.div>
                )}

                {/* Tab bar */}
                <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 14, padding: 4, marginBottom: 16 }}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            style={{ flex: 1, padding: '10px 4px', border: 'none', cursor: 'pointer', borderRadius: 10, fontSize: 12, fontWeight: 700, fontFamily: 'Signika, sans-serif', textAlign: 'center', transition: 'all 0.2s', background: activeTab === tab.id ? 'white' : 'transparent', color: activeTab === tab.id ? '#ef3837' : '#6b7280', boxShadow: activeTab === tab.id ? '0 1px 6px rgba(0,0,0,0.08)' : 'none' }}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'buy' && (
                        <motion.div key="buy" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
                            <AvailableEBuyTab user={user} />
                        </motion.div>
                    )}
                    {activeTab === 'sell' && !isGuest && (
                        <motion.div key="sell" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.18 }}>
                            <MyESaleSaudaTab />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <style>{`
                @keyframes livePing { 0%{transform:scale(1);opacity:1;} 75%,100%{transform:scale(2.2);opacity:0;} }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes shimmerBar { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }
                .skeleton { background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
                @keyframes shimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }
            `}</style>
        </AppLayout>
    );
}
