'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useGetTrackOrdersQuery } from '../../services/trackOrdersApi';
import SaleBillPrint from '../../components/print/SaleBillPrint';

const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const fmtDate = (v) => {
    if (!v) return '—';
    const m = String(v).trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (m) {
        let h = parseInt(m[4]);
        const ap = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${m[3]}-${m[2]}-${m[1]}  ${String(h).padStart(2,'0')}:${m[5]} ${ap}`;
    }
    const s = String(v).trim();
    const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymd) return `${ymd[3]}-${ymd[2]}-${ymd[1]}`;
    return s.slice(0, 10);
};

const fmtRate = (v) => v ? `₹${parseFloat(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
const fmtQty = (v) => parseFloat(v || 0).toFixed(2);

const progressOf = (item) => {
    let done = 1;
    if (item.doc_no) done++;
    if (item.SB_No) done++;
    if (item.EWay_Bill_No) done++;
    return done;
};

const STAGES = [
    { title: 'Order Confirmed', icon: '✅', desc: 'Your order has been placed.' },
    { title: 'On The Way', icon: '🚚', desc: 'Delivery order generated.' },
    { title: 'Sale Bill', icon: '🧾', desc: 'Sale bill generated.' },
    { title: 'E-Way Bill', icon: '📋', desc: 'E-way bill generated.' },
];

function TrackModal({ item, onClose }) {
    const done = progressOf(item);
    const activeIdx = done < 4 ? done : 4;

    const stages = [
        {
            done: true,
            meta: fmtDate(item.Created_Date),
        },
        {
            done: !!item.doc_no,
            meta: item.doc_no ? `DO ${item.doc_no}${item.TruckNo ? ' · 🚛 ' + item.TruckNo : ''}${item.DriverMobileNo ? ' · 📱 ' + item.DriverMobileNo : ''}` : null,
        },
        {
            done: !!item.SB_No,
            meta: item.SB_No ? `SB No ${item.SB_No}` : null,
            action: (item.SB_No && item.saleid) ? <SaleBillPrint saleid={item.saleid} label="Sale Bill" /> : null,
        },
        {
            done: !!item.EWay_Bill_No,
            meta: item.EWay_Bill_No ? `EWB ${item.EWay_Bill_No}` : null,
        },
    ];

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 70, backdropFilter: 'blur(3px)' }} />
            <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 80, background: 'white', borderRadius: '22px 22px 0 0', maxHeight: '85vh', overflowY: 'auto', paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
            >
                {/* Handle */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 4px' }}>
                    <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e5e7eb' }} />
                </div>

                {/* Header */}
                <div style={{ padding: '0 20px 14px', borderBottom: '1px solid #f3f4f6' }}>
                    <p style={{ fontSize: 16, fontWeight: 900, color: '#111827', marginBottom: 2 }}>Order Tracking</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#ef3837' }}>#{item.pendingDoid}</p>
                </div>

                {/* Summary chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px 20px', borderBottom: '1px solid #f9fafb' }}>
                    {[
                        item.mill_name || item.mill,
                        item.Grade,
                        item.Season,
                        item.do_qntl ? fmtQty(item.do_qntl) + ' Qntl' : null,
                        item.Sale_Rate ? fmtRate(item.Sale_Rate) : null,
                    ].filter(Boolean).map((chip, i) => (
                        <span key={i} style={{ fontSize: 11, fontWeight: 700, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '4px 12px', color: '#334155' }}>{chip}</span>
                    ))}
                </div>

                {/* Progress steps */}
                <div style={{ padding: '16px 20px' }}>
                    {stages.map((s, i) => {
                        const isActive = i === done - 1 && done < 4;
                        const isPast = i < done;
                        const isFuture = i >= done;
                        const stg = STAGES[i];
                        return (
                            <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < stages.length - 1 ? 0 : 0 }}>
                                {/* Rail */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 34 }}>
                                    <div style={{
                                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 14,
                                        background: isPast ? '#059669' : isActive ? '#ecfdf5' : '#f8fafc',
                                        border: `2.5px solid ${isPast ? '#059669' : isActive ? '#059669' : '#e2e8f0'}`,
                                        color: isPast ? 'white' : isActive ? '#059669' : '#cbd5e1',
                                        boxShadow: isActive ? '0 0 0 4px rgba(5,150,105,0.15)' : 'none',
                                    }}>
                                        {isPast ? '✓' : i + 1}
                                    </div>
                                    {i < stages.length - 1 && (
                                        <div style={{
                                            width: 2.5, flex: 1, minHeight: 40, margin: '3px 0',
                                            background: stages[i + 1]?.done || (i + 1 < done) ? '#059669' : '#e2e8f0',
                                            borderRadius: 2,
                                        }} />
                                    )}
                                </div>
                                {/* Content */}
                                <div style={{
                                    flex: 1, paddingBottom: i < stages.length - 1 ? 16 : 0,
                                    background: isActive ? '#f0fdf4' : 'transparent',
                                    border: isActive ? '1.5px solid #a7f3d0' : 'none',
                                    borderRadius: isActive ? 14 : 0,
                                    padding: isActive ? '10px 12px' : '4px 0 16px 0',
                                    marginBottom: isActive ? 16 : 0,
                                }}>
                                    <p style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase', color: isPast ? '#111827' : isActive ? '#D92300' : '#94a3b8', marginBottom: 3 }}>{stg.title}</p>
                                    <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginBottom: s.meta ? 4 : 0 }}>{stg.desc}</p>
                                    {s.meta && <p style={{ fontSize: 11, fontWeight: 800, color: '#D92300' }}>{s.meta}</p>}
                                    {s.action && <div style={{ marginTop: 8 }}>{s.action}</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', padding: '8px 20px 4px', borderTop: '1px solid #f1f5f9', fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>
                    {done === 4 ? 'All 4 stages complete · Ready for transit' : `Stage ${done} of 4 · next: ${STAGES[done]?.title}`}
                </div>

                <div style={{ padding: '16px 20px 0' }}>
                    <button onClick={onClose} style={{ width: '100%', padding: '14px', background: '#f3f4f6', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
                </div>
            </motion.div>
        </>
    );
}

export default function TrackOrdersPage() {
    const today = todayStr();
    const [fromDate, setFromDate] = useState(today);
    const [toDate, setToDate] = useState(today);
    const [query, setQuery] = useState({ fromDate: today, toDate: today });
    const [selectedId, setSelectedId] = useState(null);
    const [activePreset, setActivePreset] = useState('Today');
    const [showFilter, setShowFilter] = useState(false);

    const { data: orders = [], isLoading, isFetching } =
        useGetTrackOrdersQuery(query, { refetchOnMountOrArgChange: true });

    const selectedItem = useMemo(
        () => selectedId != null ? orders.find(o => o.pendingDoid === selectedId) ?? null : null,
        [orders, selectedId]
    );

    const handlePreset = (label, from, to) => {
        setFromDate(from); setToDate(to);
        setActivePreset(label);
        setQuery({ fromDate: from, toDate: to });
    };

    const presets = [
        { label: 'Today',      from: today, to: today },
        { label: 'This Week',  from: (() => { const d = new Date(); d.setDate(d.getDate()-d.getDay()); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(), to: today },
        { label: 'This Month', from: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`; })(), to: today },
        { label: 'Last Month', from: (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()).padStart(2,'0')}-01`; })(), to: (() => { const n = new Date(); const d = new Date(n.getFullYear(), n.getMonth(), 0); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })() },
    ];

    const total = orders.length;
    const completed = orders.filter(o => progressOf(o) === 4).length;
    const inProgress = total - completed;

    const inp = { padding:'10px 12px', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:13, fontWeight:600, color:'#111827', outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box' };
    const dmyFmt = (s) => { if(!s) return '—'; const [y,m,d]=s.split('-'); return `${d}-${m}-${y}`; };

    return (
        <AppLayout title="Track Orders">
            <div style={{ padding: '12px 16px 32px', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>

                {/* Section header */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                    <div>
                        <h2 style={{ margin:0, fontSize:17, fontWeight:900, color:'#111827' }}>Track Orders</h2>
                        <p style={{ margin:'2px 0 0', fontSize:12, color:'#9ca3af', fontWeight:500 }}>
                            {activePreset!=='Custom' ? `${activePreset} · ${dmyFmt(query.fromDate)}${query.fromDate!==query.toDate?` – ${dmyFmt(query.toDate)}`:''}` : `${dmyFmt(query.fromDate)} – ${dmyFmt(query.toDate)}`}
                            {!isLoading && orders.length>0 && ` · ${orders.length} order${orders.length!==1?'s':''}`}
                        </p>
                    </div>
                    <button onClick={() => setShowFilter(v=>!v)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10, background:showFilter?'#ef3837':'white', border:`1.5px solid ${showFilter?'#ef3837':'#e5e7eb'}`, color:showFilter?'white':'#374151', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', WebkitTapHighlightColor:'transparent' }}>
                        <SlidersHorizontal size={14} strokeWidth={2.5} /> Filter
                    </button>
                </div>

                {/* Date filter */}
                <AnimatePresence>
                    {showFilter && (
                        <motion.div key="filter" initial={{ opacity:0, height:0, marginBottom:0 }} animate={{ opacity:1, height:'auto', marginBottom:16 }} exit={{ opacity:0, height:0, marginBottom:0 }} transition={{ duration:0.22 }} style={{ overflow:'hidden' }}>
                            <div style={{ background:'white', borderRadius:16, padding:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid #f1f5f9' }}>
                                <div style={{ display:'flex', gap:7, marginBottom:14, flexWrap:'wrap' }}>
                                    {presets.map(p => (
                                        <button key={p.label} onClick={() => { handlePreset(p.label, p.from, p.to); }} style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:700, border:`1.5px solid ${activePreset===p.label?'#ef3837':'#e5e7eb'}`, background:activePreset===p.label?'#ef3837':'#f9fafb', color:activePreset===p.label?'white':'#6b7280', cursor:'pointer', fontFamily:'inherit', WebkitTapHighlightColor:'transparent', boxShadow:activePreset===p.label?'0 3px 10px rgba(239,56,55,0.25)':'none' }}>
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                                    {[{key:'from',label:'From',val:fromDate,set:setFromDate},{key:'to',label:'To',val:toDate,set:setToDate}].map(f=>(
                                        <div key={f.key}>
                                            <label style={{ display:'block', fontSize:10, fontWeight:800, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>{f.label}</label>
                                            <input type="date" value={f.val} onChange={e=>{f.set(e.target.value);setActivePreset('Custom');}} style={inp} onFocus={e=>{e.target.style.borderColor='#ef3837';e.target.style.background='white';}} onBlur={e=>{e.target.style.borderColor='#e5e7eb';e.target.style.background='#f9fafb';}} />
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display:'flex', gap:8 }}>
                                    <motion.button whileTap={{ scale:0.97 }} onClick={() => { setQuery({fromDate,toDate}); setShowFilter(false); }} style={{ flex:1, padding:'12px', borderRadius:12, background:'linear-gradient(135deg,#ef3837,#b91c1c)', border:'none', fontSize:13, fontWeight:800, color:'white', cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(239,56,55,0.28)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                                        {isFetching ? <><div style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.7s linear infinite' }} />Loading…</> : 'Apply Filter'}
                                    </motion.button>
                                    <button onClick={() => { handlePreset('Today',today,today); }} style={{ width:44,height:44,borderRadius:12,flexShrink:0,background:'#f5f5f5',border:'1.5px solid #e5e7eb',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',WebkitTapHighlightColor:'transparent' }}>
                                        <RotateCcw size={15} color="#6b7280" strokeWidth={2.2} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stats banner */}
                {!isLoading && orders.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                        style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', borderRadius: 16, padding: '14px 18px', marginBottom: 16, boxShadow: '0 6px 20px rgba(14,165,233,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 700 }}>TRACKING</p>
                            <p style={{ color: 'white', fontSize: 20, fontWeight: 900 }}>{total} Orders</p>
                        </div>
                        <div style={{ display: 'flex', gap: 18 }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700 }}>IN PROGRESS</p>
                                <p style={{ color: '#fbbf24', fontSize: 20, fontWeight: 900 }}>{inProgress}</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700 }}>COMPLETE</p>
                                <p style={{ color: '#86efac', fontSize: 20, fontWeight: 900 }}>{completed}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Order list */}
                {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ background: 'white', borderRadius: 16, padding: '14px 16px', border: '1px solid #f3f4f6' }}>
                                <div className="skeleton" style={{ height: 16, width: '50%', marginBottom: 8 }} />
                                <div className="skeleton" style={{ height: 12, width: '35%', marginBottom: 14 }} />
                                <div style={{ display: 'flex', gap: 4 }}>
                                    {[1,2,3,4].map(j => <div key={j} className="skeleton" style={{ flex: 1, height: 6, borderRadius: 3 }} />)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 20, border: '1.5px dashed #e5e7eb' }}>
                        <div style={{ fontSize: 52, marginBottom: 12 }}>🚚</div>
                        <p style={{ fontWeight: 800, color: '#374151', marginBottom: 6, fontSize: 16 }}>No orders to track</p>
                        <p style={{ color: '#9ca3af', fontSize: 13 }}>Try changing the date range above.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {orders.map((order, i) => {
                            const done = progressOf(order);
                            const isComplete = done === 4;
                            return (
                                <motion.div
                                    key={order.pendingDoid ?? i}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(i * 0.04, 0.4) }}
                                    style={{ background: 'white', borderRadius: 16, padding: '14px 16px', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: `1.5px solid ${isComplete ? '#bbf7d0' : '#f3f4f6'}` }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 800, fontSize: 14, color: '#111827', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {order.mill_name || order.mill || 'Mill'}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>
                                                #{order.pendingDoid} · {order.Grade} · {order.Season || '—'} · {fmtQty(order.do_qntl)} qtl
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, marginLeft: 8 }}>
                                            <span style={{ fontSize: 10, fontWeight: 800, color: isComplete ? '#059669' : '#f59e0b', background: isComplete ? '#f0fdf4' : '#fffbeb', border: `1px solid ${isComplete ? '#bbf7d0' : '#fde68a'}`, borderRadius: 20, padding: '3px 8px' }}>
                                                {isComplete ? 'Complete' : `${done}/4`}
                                            </span>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#ef3837' }}>{fmtRate(order.Sale_Rate)}</span>
                                        </div>
                                    </div>

                                    {/* Mini progress bar */}
                                    <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
                                        {[0, 1, 2, 3].map(idx => (
                                            <div key={idx} style={{ flex: 1, height: 4, borderRadius: 3, background: idx < done ? '#059669' : '#e5e7eb', transition: 'background 0.3s' }} />
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
                                            {fmtDate(order.Created_Date)}
                                            {order.TruckNo && <span style={{ marginLeft: 8, color: '#374151', fontWeight: 600 }}>🚛 {order.TruckNo}</span>}
                                        </div>
                                        <motion.button
                                            whileTap={{ scale: 0.94 }}
                                            onClick={() => setSelectedId(order.pendingDoid)}
                                            style={{ padding: '7px 14px', background: isComplete ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#0891b2,#0e7490)', border: 'none', borderRadius: 9, color: 'white', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 3px 10px ${isComplete ? 'rgba(5,150,105,0.25)' : 'rgba(8,145,178,0.25)'}` }}
                                        >
                                            {isComplete ? '✓ Done' : '📍 Track'}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Track modal */}
            <AnimatePresence>
                {selectedItem && (
                    <TrackModal item={selectedItem} onClose={() => setSelectedId(null)} />
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
