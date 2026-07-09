'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useGetDispatchSummaryQuery } from '../../services/dispatchSummaryApi';

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const todayYmd = ymd(new Date());

function dmy(s) {
    if (!s) return '—';
    const [y, m, d] = s.split('-');
    return `${d}-${m}-${y}`;
}
function fmtAmt(n) {
    return (parseFloat(n)||0).toLocaleString('en-IN',{minimumFractionDigits:2});
}
function parseLocal(s) {
    const [y,m,d] = s.split('-').map(Number);
    return new Date(y, m-1, d);
}

const QUICK = [
    { label: 'Today',      get: () => ({ from: todayYmd, to: todayYmd }) },
    { label: 'This Week',  get: () => { const d = new Date(); d.setDate(d.getDate()-d.getDay()); return { from: ymd(d), to: todayYmd }; } },
    { label: 'This Month', get: () => { const n = new Date(); return { from: ymd(new Date(n.getFullYear(),n.getMonth(),1)), to: todayYmd }; } },
    { label: 'Last Month', get: () => { const n = new Date(); return { from: ymd(new Date(n.getFullYear(),n.getMonth()-1,1)), to: ymd(new Date(n.getFullYear(),n.getMonth(),0)) }; } },
];

export default function DispatchSummaryPage() {
    const def = QUICK[0].get();
    const [fromDate,   setFromDate]   = useState(def.from);
    const [toDate,     setToDate]     = useState(def.to);
    const [activeQ,    setActiveQ]    = useState('Today');
    const [search,     setSearch]     = useState('');
    const [showFilter, setShowFilter] = useState(false);

    const { data: allData = [], isLoading } = useGetDispatchSummaryQuery();

    const filtered = useMemo(() => {
        const from = parseLocal(fromDate);
        const to   = parseLocal(toDate); to.setHours(23,59,59,999);
        return allData.filter(item => {
            const dt = new Date(item.doc_date);
            return dt >= from && dt <= to &&
                (!search || (item.millname||'').toLowerCase().includes(search.toLowerCase()) || (item.Grade||'').toLowerCase().includes(search.toLowerCase()));
        });
    }, [allData, fromDate, toDate, search]);

    const grandTotal = filtered.reduce((s,i) => s + parseFloat(i.Buyer_Quantal||0), 0);

    const grouped = useMemo(() => {
        const g = {};
        filtered.forEach(item => {
            const mill = item.millname || 'Unknown Mill';
            if (!g[mill]) g[mill] = { items:[], total:0 };
            g[mill].items.push(item);
            g[mill].total += parseFloat(item.Buyer_Quantal||0);
        });
        return g;
    }, [filtered]);

    const applyPreset = (q) => {
        const r = q.get();
        setFromDate(r.from); setToDate(r.to); setActiveQ(q.label);
    };

    const reset = () => {
        const r = QUICK[0].get();
        setFromDate(r.from); setToDate(r.to); setActiveQ('Today'); setSearch('');
    };

    const inp = { padding:'11px 12px', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:14, fontWeight:600, color:'#111827', outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box' };

    return (
        <AppLayout title="Dispatch Summary" showBack>
            <div style={{ padding:'12px 16px 32px', fontFamily:'Signika, ui-sans-serif, system-ui, sans-serif' }}>

                {/* Section header */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                    <div>
                        <h2 style={{ margin:0, fontSize:17, fontWeight:900, color:'#111827' }}>Dispatch Summary</h2>
                        <p style={{ margin:'2px 0 0', fontSize:12, color:'#9ca3af', fontWeight:500 }}>
                            {activeQ ? `${activeQ} · ${dmy(fromDate)}${fromDate!==toDate?` – ${dmy(toDate)}`:''}` : `${dmy(fromDate)} – ${dmy(toDate)}`}
                            {!isLoading && filtered.length>0 && ` · ${filtered.length} record${filtered.length!==1?'s':''}`}
                        </p>
                    </div>
                    <button onClick={() => setShowFilter(v=>!v)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10, background:showFilter?'#f59e0b':'white', border:`1.5px solid ${showFilter?'#f59e0b':'#e5e7eb'}`, color:showFilter?'white':'#374151', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', WebkitTapHighlightColor:'transparent' }}>
                        <SlidersHorizontal size={14} strokeWidth={2.5} /> Filter
                    </button>
                </div>

                {/* Filter card */}
                <AnimatePresence>
                    {showFilter && (
                        <motion.div key="filter" initial={{ opacity:0, height:0, marginBottom:0 }} animate={{ opacity:1, height:'auto', marginBottom:16 }} exit={{ opacity:0, height:0, marginBottom:0 }} transition={{ duration:0.22 }} style={{ overflow:'hidden' }}>
                            <div style={{ background:'white', borderRadius:16, padding:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid #f1f5f9' }}>
                                {/* Presets */}
                                <div style={{ display:'flex', gap:7, marginBottom:14, flexWrap:'wrap' }}>
                                    {QUICK.map(q => (
                                        <button key={q.label} onClick={() => applyPreset(q)} style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:700, border:`1.5px solid ${activeQ===q.label?'#f59e0b':'#e5e7eb'}`, background:activeQ===q.label?'#f59e0b':'#f9fafb', color:activeQ===q.label?'white':'#6b7280', cursor:'pointer', fontFamily:'inherit', WebkitTapHighlightColor:'transparent', boxShadow:activeQ===q.label?'0 3px 10px rgba(245,158,11,0.3)':'none' }}>
                                            {q.label}
                                        </button>
                                    ))}
                                </div>
                                {/* Dates */}
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                                    {[{label:'From',val:fromDate,set:setFromDate},{label:'To',val:toDate,set:setToDate}].map(f=>(
                                        <div key={f.label}>
                                            <label style={{ display:'block', fontSize:10, fontWeight:800, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>{f.label}</label>
                                            <input type="date" value={f.val} onChange={e=>{f.set(e.target.value);setActiveQ(null);}} style={inp} onFocus={e=>{e.target.style.borderColor='#f59e0b';e.target.style.background='white';}} onBlur={e=>{e.target.style.borderColor='#e5e7eb';e.target.style.background='#f9fafb';}} />
                                        </div>
                                    ))}
                                </div>
                                {/* Search */}
                                <div style={{ marginBottom:12 }}>
                                    <label style={{ display:'block', fontSize:10, fontWeight:800, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Search Mill / Grade</label>
                                    <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by mill or grade…" style={inp} onFocus={e=>{e.target.style.borderColor='#f59e0b';e.target.style.background='white';}} onBlur={e=>{e.target.style.borderColor='#e5e7eb';e.target.style.background='#f9fafb';}} />
                                </div>
                                {/* Buttons */}
                                <div style={{ display:'flex', gap:8 }}>
                                    <motion.button whileTap={{scale:0.97}} onClick={()=>setShowFilter(false)} style={{ flex:1, padding:'12px', borderRadius:12, background:'linear-gradient(135deg,#f59e0b,#d97706)', border:'none', fontSize:13, fontWeight:800, color:'white', cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(245,158,11,0.28)' }}>
                                        Apply Filter
                                    </motion.button>
                                    <button onClick={reset} style={{ width:44, height:44, borderRadius:12, flexShrink:0, background:'#f5f5f5', border:'1.5px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
                                        <RotateCcw size={15} color="#6b7280" strokeWidth={2.2} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Summary banner */}
                <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
                    style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius:18, padding:'16px 18px', marginBottom:18, boxShadow:'0 6px 20px rgba(245,158,11,0.3)' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div>
                            <p style={{ color:'rgba(255,255,255,0.85)', fontSize:11, fontWeight:700, margin:0 }}>TOTAL DISPATCHED</p>
                            <p style={{ color:'white', fontSize:20, fontWeight:900, margin:'4px 0 2px' }}>{grandTotal.toFixed(2)} Qtl</p>
                            <p style={{ color:'rgba(255,255,255,0.75)', fontSize:12, fontWeight:500, margin:0 }}>{filtered.length} dispatch{filtered.length!==1?'es':''}</p>
                        </div>
                        <span style={{ fontSize:32 }}>🚚</span>
                    </div>
                </motion.div>

                {/* List */}
                {isLoading ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                        {[1,2].map(i=>(
                            <div key={i} style={{ background:'white', borderRadius:16, padding:16, border:'1px solid #f3f4f6' }}>
                                <div className="skeleton" style={{ height:18, width:'60%', marginBottom:12 }} />
                                {[1,2,3].map(j=><div key={j} className="skeleton" style={{ height:12, width:'90%', marginBottom:8 }} />)}
                            </div>
                        ))}
                    </div>
                ) : Object.keys(grouped).length===0 ? (
                    <div style={{ textAlign:'center', padding:'56px 20px', background:'white', borderRadius:18, border:'1.5px dashed #e5e7eb' }}>
                        <div style={{ fontSize:44, marginBottom:12 }}>🚚</div>
                        <p style={{ fontWeight:700, color:'#374151', marginBottom:4 }}>No dispatches found</p>
                        <p style={{ color:'#9ca3af', fontSize:13 }}>No dispatch records for the selected filters.</p>
                    </div>
                ) : (
                    Object.entries(grouped).map(([mill, group], mi) => (
                        <motion.div key={mill} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:mi*0.07 }}
                            style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 1px 8px rgba(0,0,0,0.05)', border:'1px solid #f3f4f6', marginBottom:14 }}>
                            <div style={{ background:'linear-gradient(135deg,#fffbeb,#fef3c7)', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #fde68a' }}>
                                <div>
                                    <p style={{ fontWeight:800, fontSize:14, color:'#92400e', margin:0 }}>{mill}</p>
                                    <p style={{ fontSize:11, color:'#b45309', fontWeight:600, margin:'2px 0 0' }}>{group.items.length} dispatch{group.items.length!==1?'es':''}</p>
                                </div>
                                <div style={{ textAlign:'right' }}>
                                    <p style={{ fontSize:10, color:'#b45309', fontWeight:700, margin:0 }}>TOTAL</p>
                                    <p style={{ fontWeight:900, fontSize:16, color:'#92400e', margin:0 }}>{group.total.toFixed(2)} Qtl</p>
                                </div>
                            </div>
                            {group.items.map((item,ii)=>(
                                <div key={ii} style={{ padding:'12px 16px', borderBottom:ii<group.items.length-1?'1px solid #f9fafb':'none' }}>
                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                        <div style={{ flex:1, minWidth:0 }}>
                                            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:4 }}>
                                                <span style={{ fontSize:11, fontWeight:700, color:'#6b7280' }}>{item.doc_date ? dmy(item.doc_date.split('T')[0]) : '—'}</span>
                                                {item.Grade && <span style={{ fontSize:11, fontWeight:700, background:'#fef3c7', color:'#b45309', padding:'1px 6px', borderRadius:4 }}>{item.Grade}</span>}
                                                {item.Packing && <span style={{ fontSize:11, fontWeight:600, color:'#9ca3af' }}>{item.Packing}</span>}
                                            </div>
                                            <p style={{ fontSize:12, color:'#374151', fontWeight:500, margin:0 }}>{item.billto||item.saudaname||'—'}</p>
                                        </div>
                                        <div style={{ textAlign:'right', flexShrink:0, marginLeft:10 }}>
                                            <p style={{ fontWeight:800, fontSize:14, color:'#111827', margin:0 }}>{parseFloat(item.Buyer_Quantal||0).toFixed(2)} Qtl</p>
                                            {item.sale_rate && <p style={{ fontSize:11, color:'#6b7280', fontWeight:600, margin:0 }}>₹{item.sale_rate}/qtl</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ))
                )}
            </div>
        </AppLayout>
    );
}
