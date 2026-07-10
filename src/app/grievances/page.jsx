'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Send, X, ChevronDown, AlertCircle, CheckCircle2,
    Clock, RotateCcw, XCircle, MessageSquare, Hash,
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import {
    useGetMyComplaintsQuery,
    useSubmitComplaintMutation,
    useAddReplyMutation,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
} from '../../services/grievanceApi';

const CATEGORIES = ['Delivery Issue', 'Payment Issue', 'Quality Issue', 'Documentation', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const STATUS_STYLES = {
    'Open':        { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', icon: <Clock size={10} /> },
    'In Progress': { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', icon: <RotateCcw size={10} /> },
    'Resolved':    { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', icon: <CheckCircle2 size={10} /> },
    'Closed':      { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0', icon: <XCircle size={10} /> },
};
const PRIO_STYLES = {
    'Low':    { bg: '#f0fdf4', text: '#15803d' },
    'Medium': { bg: '#fffbeb', text: '#b45309' },
    'High':   { bg: '#fff1f0', text: '#dc2626' },
};

function fmtDT(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtShort(dt) {
    if (!dt) return '';
    return new Date(dt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
}

function SelectField({ label, value, onChange, options, required }) {
    return (
        <div className="mb-4">
            <label className="block text-[11px] font-extrabold text-gray-600 uppercase tracking-wider mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <select value={value} onChange={e => onChange(e.target.value)} required={required}
                    className="w-full appearance-none px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-red-400 focus:bg-white transition-all pr-10 cursor-pointer">
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-card">
            <div className="flex justify-between mb-3">
                <div className="skeleton h-3 w-24 rounded" />
                <div className="skeleton h-5 w-16 rounded-full" />
            </div>
            <div className="skeleton h-4 w-3/4 rounded mb-2" />
            <div className="skeleton h-3 w-1/2 rounded" />
        </div>
    );
}

/* ── Chat Thread ── */
function ThreadView({ g, onClose }) {
    const threadRef = useRef(null);
    const [text, setText] = useState('');
    const [addReply, { isLoading: sending }] = useAddReplyMutation();
    const [markAsRead] = useMarkAsReadMutation();

    const replies = Array.isArray(g.replies) ? g.replies
        : typeof g.replies === 'string' ? (() => { try { return JSON.parse(g.replies); } catch { return []; } })()
        : [];

    const isClosed = g.status === 'Closed' || g.status === 'Resolved';
    const ss = STATUS_STYLES[g.status] || STATUS_STYLES['Open'];
    const ps = PRIO_STYLES[g.priority] || {};

    useEffect(() => {
        if (g.is_unread) markAsRead(g.grievance_id);
    }, [g.grievance_id]); // eslint-disable-line

    useEffect(() => {
        if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }, [replies.length]);

    const handleSend = async () => {
        const msg = text.trim();
        if (!msg || sending) return;
        setText('');
        try { await addReply({ grievance_id: g.grievance_id, message: msg }).unwrap(); }
        catch { setText(msg); }
    };

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl flex flex-col"
                style={{ maxHeight: '88vh' }}>

                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-10 h-1 rounded-full bg-gray-200" />
                </div>

                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#fff5f3,#fff)' }}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider mb-0.5">{g.ticket_no}</p>
                            <p className="font-black text-[15px] text-gray-900 leading-tight truncate">{g.subject}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                                    style={{ background: ss.bg, color: ss.text, border: `1px solid ${ss.border}` }}>
                                    {ss.icon}{g.status}
                                </span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                                    style={{ background: ps.bg, color: ps.text }}>{g.priority}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{g.category}</span>
                            </div>
                            {(g.order_ref || g.do_no) && (
                                <div className="flex gap-2 mt-2">
                                    {g.order_ref && <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-600">Order: {g.order_ref}</span>}
                                    {g.do_no && <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-600">DO: {g.do_no}</span>}
                                </div>
                            )}
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 text-xl flex-shrink-0">×</button>
                    </div>
                </div>

                {/* Thread */}
                <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0" ref={threadRef}>
                    {/* Original complaint */}
                    <div className="flex justify-end mb-3">
                        <div className="max-w-[80%]">
                            <p className="text-[9px] font-extrabold text-gray-400 text-right mb-1 uppercase tracking-wider">Your Complaint</p>
                            <div className="bg-gray-100 rounded-2xl rounded-br-md px-3 py-2.5 border border-gray-200">
                                <p className="text-[13px] text-gray-800 font-medium leading-relaxed">{g.description}</p>
                                <p className="text-[9px] text-gray-400 font-medium mt-1 text-right">{fmtShort(g.submitted_at)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Replies */}
                    {replies.map((r, i) => r.role === 'admin' ? (
                        <div key={i} className="flex items-end gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-white flex items-center justify-center">
                                <img src="/eBuySugarlogo.jpg" alt="eBuySugar" className="w-full h-full object-contain p-0.5" />
                            </div>
                            <div className="max-w-[80%]">
                                <p className="text-[9px] font-extrabold text-red-500 mb-1 uppercase tracking-wider">eBuySugar Response</p>
                                <div className="rounded-2xl rounded-bl-md px-3 py-2.5 border"
                                    style={{ background: '#fff5f3', borderColor: '#fecaca' }}>
                                    <p className="text-[13px] text-gray-800 font-medium leading-relaxed">{r.message}</p>
                                    <p className="text-[9px] mt-1" style={{ color: '#ef4444', opacity: 0.7 }}>{fmtShort(r.timestamp)}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div key={i} className="flex justify-end mb-3">
                            <div className="max-w-[80%]">
                                <div className="bg-gray-100 rounded-2xl rounded-br-md px-3 py-2.5 border border-gray-200">
                                    <p className="text-[13px] text-gray-800 font-medium leading-relaxed">{r.message}</p>
                                    <p className="text-[9px] text-gray-400 font-medium mt-1 text-right">{fmtShort(r.timestamp)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Reply input */}
                {!isClosed ? (
                    <div className="px-4 py-3 border-t border-gray-100 flex gap-2 items-end flex-shrink-0 bg-gray-50">
                        <textarea
                            value={text} onChange={e => setText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Type your reply…"
                            rows={1}
                            className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-red-400 transition-all resize-none"
                            style={{ minHeight: 40, maxHeight: 90 }}
                        />
                        <motion.button whileTap={{ scale: 0.9 }} onClick={handleSend} disabled={!text.trim() || sending}
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: !text.trim() || sending ? '#f3f4f6' : 'linear-gradient(135deg,#ef3837,#d92300)', opacity: !text.trim() || sending ? 0.5 : 1 }}>
                            <Send size={16} color={!text.trim() || sending ? '#9ca3af' : 'white'} strokeWidth={2} />
                        </motion.button>
                    </div>
                ) : (
                    <div className="px-4 py-3 border-t border-gray-100 text-center flex-shrink-0">
                        <p className="text-xs text-gray-400 font-medium italic">This complaint is {g.status.toLowerCase()}. No further replies.</p>
                    </div>
                )}
            </motion.div>
        </>
    );
}

/* ── New Grievance Form ── */
function GrievanceForm({ onClose }) {
    const [form, setForm] = useState({
        category: 'Delivery Issue', subject: '', description: '',
        priority: 'Medium', order_ref: '', do_no: '',
    });
    const [submitted, setSubmitted] = useState(null);
    const [submitComplaint, { isLoading, error }] = useSubmitComplaintMutation();

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            category:    form.category,
            subject:     form.subject,
            description: form.description,
            priority:    form.priority,
            order_ref:   form.order_ref ? parseInt(form.order_ref) : null,
            do_no:       form.do_no || null,
        };
        try {
            const res = await submitComplaint(payload).unwrap();
            setSubmitted(res.ticket_no || res.ticket_no);
        } catch {}
    };

    const errMsg = error?.data?.detail
        ? (typeof error.data.detail === 'string' ? error.data.detail : JSON.stringify(error.data.detail))
        : null;

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl"
                style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-10 h-1 rounded-full bg-gray-200" />
                </div>

                {/* Sheet header */}
                <div className="flex items-center justify-between px-5 pb-4 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#fff5f3,#fff)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg,#ef3837,#d92300)', boxShadow: '0 4px 12px rgba(239,56,55,0.28)' }}>
                            <AlertCircle size={18} color="white" strokeWidth={2.2} />
                        </div>
                        <div>
                            <h3 className="font-black text-base text-gray-900">Raise a Grievance</h3>
                            <p className="text-[11px] text-gray-400 font-medium">We'll respond within 24–48 hours</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 text-xl">×</button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 pb-6">
                    {submitted ? (
                        /* Success state */
                        <div className="flex flex-col items-center text-center py-8">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 border-2 border-green-200"
                                style={{ background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)' }}>
                                <CheckCircle2 size={32} color="#15803d" strokeWidth={2.2} />
                            </div>
                            <h3 className="font-black text-base text-green-800 mb-2">Grievance Submitted!</h3>
                            <div className="font-black text-2xl text-red-500 bg-red-50 border-2 border-dashed border-red-200 rounded-2xl px-6 py-3 mb-3 tracking-wider">
                                {submitted}
                            </div>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">
                                Save this ticket number for tracking. Our team will review and respond shortly.
                            </p>
                            <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
                                className="px-8 py-3 rounded-2xl text-sm font-extrabold text-white"
                                style={{ background: 'linear-gradient(135deg,#ef3837,#d92300)', boxShadow: '0 4px 14px rgba(239,56,55,0.28)' }}>
                                Done
                            </motion.button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {errMsg && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4 text-sm text-red-600 font-semibold">
                                    <AlertCircle size={14} />{errMsg}
                                </div>
                            )}

                            {/* Category + Priority dropdowns side by side */}
                            <div className="grid grid-cols-2 gap-3">
                                <SelectField label="Category" value={form.category} onChange={v => set('category', v)} options={CATEGORIES} required />
                                <SelectField label="Priority" value={form.priority} onChange={v => set('priority', v)} options={PRIORITIES} />
                            </div>

                            {/* Subject */}
                            <div className="mb-4">
                                <label className="block text-[11px] font-extrabold text-gray-600 uppercase tracking-wider mb-1.5">
                                    Subject <span className="text-red-500">*</span>
                                </label>
                                <input type="text" value={form.subject} required maxLength={200}
                                    placeholder="Brief summary of your issue"
                                    onChange={e => set('subject', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-red-400 focus:bg-white transition-all" />
                            </div>

                            {/* Description */}
                            <div className="mb-4">
                                <label className="block text-[11px] font-extrabold text-gray-600 uppercase tracking-wider mb-1.5">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea value={form.description} required rows={4}
                                    placeholder="Describe your issue in detail…"
                                    onChange={e => set('description', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-red-400 focus:bg-white transition-all resize-none" />
                            </div>

                            {/* Order ID + DO No. */}
                            <div className="mb-5">
                                <label className="block text-[11px] font-extrabold text-gray-600 uppercase tracking-wider mb-1.5">
                                    Reference <span className="text-gray-400 font-semibold normal-case text-[10px]">(optional)</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input type="number" value={form.order_ref}
                                            placeholder="Order ID"
                                            onChange={e => set('order_ref', e.target.value)}
                                            className="w-full pl-8 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-red-400 focus:bg-white transition-all" />
                                    </div>
                                    <input type="text" value={form.do_no} maxLength={50}
                                        placeholder="DO No."
                                        onChange={e => set('do_no', e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-red-400 focus:bg-white transition-all" />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={onClose}
                                    className="py-3.5 rounded-2xl bg-gray-100 text-sm font-bold text-gray-700 border border-gray-200">
                                    Cancel
                                </button>
                                <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={isLoading}
                                    className="py-3.5 rounded-2xl text-sm font-extrabold text-white flex items-center justify-center gap-2"
                                    style={{ background: isLoading ? '#fca5a5' : 'linear-gradient(135deg,#ef3837,#d92300)', boxShadow: isLoading ? 'none' : '0 4px 14px rgba(239,56,55,0.28)', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                                    {isLoading
                                        ? <><div className="animate-lspin w-4 h-4 rounded-full border-2 border-white/30 border-t-white" />Submitting…</>
                                        : 'Submit Grievance'}
                                </motion.button>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>
        </>
    );
}

/* ── Main Page ── */
export default function GrievancesPage() {
    const { data: complaints = [], isLoading } = useGetMyComplaintsQuery();
    const [markAllAsRead] = useMarkAllAsReadMutation();

    const [showForm,    setShowForm]   = useState(false);
    const [selectedId,  setSelectedId] = useState(null);

    const selected    = complaints.find(c => c.grievance_id === selectedId) ?? null;
    const unreadCount = complaints.filter(c => c.is_unread).length;

    const handleSelect = (item) => setSelectedId(item.grievance_id);

    return (
        <AppLayout title="My Grievances" showBack>

            <div className="px-4 pt-3 pb-10">

                {/* Header row */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-base font-black text-gray-900">My Grievances</h2>
                        <p className="text-xs text-gray-400 mt-0.5 font-medium">
                            {complaints.length} ticket{complaints.length !== 1 ? 's' : ''}
                            {unreadCount > 0 && <span className="text-red-500 font-bold"> · {unreadCount} unread</span>}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => markAllAsRead()}
                                className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-600">
                                ✓ Mark all read
                            </motion.button>
                        )}
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowForm(true)}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-extrabold text-white"
                            style={{ background: 'linear-gradient(135deg,#ef3837,#d92300)', boxShadow: '0 4px 14px rgba(239,56,55,0.28)' }}>
                            <Plus size={15} strokeWidth={2.8} /> New
                        </motion.button>
                    </div>
                </div>

                {/* List */}
                {isLoading ? (
                    <div className="flex flex-col gap-3">
                        {[1,2,3].map(i => <SkeletonCard key={i} />)}
                    </div>
                ) : complaints.length === 0 ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-3">
                            <MessageSquare size={24} className="text-orange-400" />
                        </div>
                        <p className="font-black text-gray-700 text-base mb-1">No grievances yet</p>
                        <p className="text-gray-400 text-sm mb-5">Submit a complaint if you face any issues.</p>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowForm(true)}
                            className="px-6 py-3 rounded-2xl text-sm font-extrabold text-white"
                            style={{ background: 'linear-gradient(135deg,#ef3837,#d92300)', boxShadow: '0 4px 14px rgba(239,56,55,0.28)' }}>
                            Submit Complaint
                        </motion.button>
                    </motion.div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {complaints.map((item, i) => {
                            const ss = STATUS_STYLES[item.status] || STATUS_STYLES['Open'];
                            const ps = PRIO_STYLES[item.priority] || {};
                            const replyCount = Array.isArray(item.replies) ? item.replies.length : 0;
                            return (
                                <motion.div key={item.grievance_id}
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(i * 0.05, 0.3) }}
                                    onClick={() => handleSelect(item)}
                                    className="bg-white rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
                                    style={{
                                        border: `1px solid ${item.is_unread ? '#fecaca' : '#f1f5f9'}`,
                                        borderLeft: `4px solid ${item.is_unread ? '#ef3837' : (ss.border || '#e5e7eb')}`,
                                        boxShadow: item.is_unread ? '0 2px 12px rgba(239,56,55,0.10)' : '0 1px 6px rgba(0,0,0,0.06)',
                                    }}>
                                    <div className="px-4 py-3.5">
                                        {/* Top row */}
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1 min-w-0 mr-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {item.is_unread && (
                                                        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-wsping" />
                                                    )}
                                                    <p className="text-[10px] font-extrabold text-red-400 uppercase tracking-wider">{item.ticket_no}</p>
                                                </div>
                                                <p className="font-black text-sm text-gray-900 truncate">{item.subject}</p>
                                            </div>
                                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0"
                                                style={{ background: ss.bg, color: ss.text, border: `1px solid ${ss.border}` }}>
                                                {ss.icon}{item.status}
                                            </span>
                                        </div>

                                        {/* Meta row */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700">{item.category}</span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                                                style={{ background: ps.bg, color: ps.text }}>{item.priority}</span>
                                            {(item.order_ref || item.do_no) && (
                                                <span className="text-[10px] font-bold text-gray-400">
                                                    {item.order_ref ? `#${item.order_ref}` : ''}{item.order_ref && item.do_no ? ' · ' : ''}{item.do_no || ''}
                                                </span>
                                            )}
                                            {replyCount > 0 && (
                                                <span className="text-[10px] font-bold text-cyan-600">{replyCount} msg{replyCount > 1 ? 's' : ''}</span>
                                            )}
                                        </div>

                                        {/* Date */}
                                        <p className="text-[10px] text-gray-400 font-medium mt-2">{fmtDT(item.submitted_at)}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showForm && <GrievanceForm onClose={() => setShowForm(false)} />}
            </AnimatePresence>
            <AnimatePresence>
                {selected && <ThreadView g={selected} onClose={() => setSelectedId(null)} />}
            </AnimatePresence>
        </AppLayout>
    );
}
