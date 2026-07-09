'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const STATUS_COLORS = {
    Open:       { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
    'In Progress': { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    Resolved:   { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
    Closed:     { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' },
};

function GrievanceCard({ item, index, onSelect }) {
    const sc = STATUS_COLORS[item.status] || STATUS_COLORS.Open;
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            onClick={() => onSelect(item)}
            style={{ background: 'white', borderRadius: 16, padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: `2px solid ${item.is_unread ? '#ef3837' : '#f3f4f6'}`, marginBottom: 12, cursor: 'pointer', position: 'relative' }}
        >
            {item.is_unread && (
                <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: '#ef3837', animation: 'pulse 1.5s infinite' }} />
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af' }}>#{item.ticket_no}</span>
                <span style={{ fontSize: 11, fontWeight: 800, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, borderRadius: 6, padding: '3px 8px' }}>{item.status}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#111827', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subject}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{item.category}</span>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#d1d5db' }} />
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{item.priority}</span>
            </div>
        </motion.div>
    );
}

export default function GrievancesPage() {
    const { data: complaints = [], isLoading } = useGetMyComplaintsQuery();
    const [submitComplaint, { isLoading: isSubmitting }] = useSubmitComplaintMutation();
    const [addReply, { isLoading: isReplying }] = useAddReplyMutation();
    const [markAsRead] = useMarkAsReadMutation();
    const [markAllAsRead] = useMarkAllAsReadMutation();

    const [showForm, setShowForm] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const selected = complaints.find(c => c.grievance_id === selectedId) || null;
    const [replyText, setReplyText] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
    const [form, setForm] = useState({ category: 'Delivery Issue', subject: '', description: '', priority: 'Medium' });

    const showToast = (message, type = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(p => ({ ...p, show: false })), 3500);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.subject || !form.description) { showToast('Subject and description are required.', 'error'); return; }
        try {
            await submitComplaint(form).unwrap();
            showToast('Complaint submitted successfully!', 'success');
            setForm({ category: 'Delivery Issue', subject: '', description: '', priority: 'Medium' });
            setShowForm(false);
        } catch (err) { showToast(err.data?.detail || 'Failed to submit complaint.', 'error'); }
    };

    const handleSelect = async (item) => {
        setSelectedId(item.grievance_id);
        if (item.is_unread) {
            try { await markAsRead(item.grievance_id).unwrap(); } catch { /* ignore */ }
        }
    };

    const handleReply = async () => {
        if (!replyText.trim()) return;
        try {
            await addReply({ grievance_id: selected.grievance_id, message: replyText }).unwrap();
            showToast('Reply sent!', 'success');
            setReplyText('');
            // Keep modal open — RTK Query invalidatesTags refetches complaints automatically,
            // and selected is derived from complaints so it will update with new replies.
        } catch { showToast('Failed to send reply.', 'error'); }
    };

    const unreadCount = complaints.filter(c => c.is_unread).length;
    const inputStyle = { width: '100%', padding: '12px 14px', background: '#f9fafb', border: '2px solid #e5e7eb', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#111827', outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s' };

    return (
        <AppLayout title="My Grievances">
            <AnimatePresence>
                {toast.show && (
                    <motion.div initial={{ opacity: 0, y: -60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -60 }}
                        style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 14, fontWeight: 700, fontSize: 14, background: toast.type === 'success' ? '#059669' : '#ef4444', color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{toast.type === 'success' ? '✓' : '✕'}</div>
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ padding: '12px 16px', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>
                {/* Header actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                        <p style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>{complaints.length} ticket{complaints.length !== 1 ? 's' : ''}{unreadCount > 0 && <span style={{ color: '#ef3837', fontWeight: 800 }}> · {unreadCount} unread</span>}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {unreadCount > 0 && (
                            <button onClick={() => markAllAsRead()} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Mark All Read</button>
                        )}
                        <button onClick={() => setShowForm(true)} style={{ background: 'linear-gradient(135deg,#ef3837,#d92300)', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 800, color: 'white', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                            + New
                        </button>
                    </div>
                </div>

                {/* List */}
                {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ background: 'white', borderRadius: 16, padding: 16 }}>
                                <div className="skeleton" style={{ height: 14, width: '30%', marginBottom: 10 }} />
                                <div className="skeleton" style={{ height: 18, width: '70%', marginBottom: 8 }} />
                                <div className="skeleton" style={{ height: 14, width: '40%' }} />
                            </div>
                        ))}
                    </div>
                ) : complaints.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                        <p style={{ fontWeight: 700, color: '#374151', marginBottom: 4 }}>No grievances yet</p>
                        <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 20 }}>Submit a complaint if you face any issues.</p>
                        <button onClick={() => setShowForm(true)} style={{ background: 'linear-gradient(135deg,#ef3837,#d92300)', border: 'none', borderRadius: 14, padding: '14px 24px', fontSize: 14, fontWeight: 800, color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Submit Complaint</button>
                    </div>
                ) : (
                    complaints.map((item, i) => <GrievanceCard key={item.grievance_id} item={item} index={i} onSelect={handleSelect} />)
                )}
            </div>

            {/* New grievance modal */}
            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }} />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 70, background: 'white', borderRadius: '20px 20px 0 0', padding: '24px 20px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><div style={{ width: 40, height: 4, borderRadius: 2, background: '#e5e7eb' }} /></div>
                            <h3 style={{ fontWeight: 900, fontSize: 18, color: '#111827', marginBottom: 20 }}>Submit Complaint</h3>
                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: 14 }}>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Category</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {CATEGORIES.map(cat => (
                                            <button key={cat} type="button" onClick={() => setForm(f => ({ ...f, category: cat }))}
                                                style={{ padding: '8px 14px', borderRadius: 10, border: `2px solid ${form.category === cat ? '#ef3837' : '#e5e7eb'}`, background: form.category === cat ? '#fff1f0' : 'white', color: form.category === cat ? '#ef3837' : '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ marginBottom: 14 }}>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Subject *</label>
                                    <input type="text" value={form.subject} placeholder="Brief description of the issue" onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={inputStyle} onFocus={e => { e.target.style.borderColor = '#ef3837'; e.target.style.background = 'white'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }} />
                                </div>
                                <div style={{ marginBottom: 14 }}>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Description *</label>
                                    <textarea value={form.description} placeholder="Describe the issue in detail..." rows={4} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }} onFocus={e => { e.target.style.borderColor = '#ef3837'; e.target.style.background = 'white'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }} />
                                </div>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Priority</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {PRIORITIES.map(p => (
                                            <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
                                                style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${form.priority === p ? '#ef3837' : '#e5e7eb'}`, background: form.priority === p ? '#fff1f0' : 'white', color: form.priority === p ? '#ef3837' : '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <button type="button" onClick={() => setShowForm(false)} style={{ padding: '14px', background: '#f3f4f6', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                                    <motion.button type="submit" disabled={isSubmitting} whileTap={{ scale: 0.97 }} style={{ padding: '14px', background: 'linear-gradient(135deg,#ef3837,#d92300)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800, color: 'white', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: isSubmitting ? 0.7 : 1 }}>
                                        {isSubmitting ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Submitting...</> : 'Submit'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Detail modal */}
            <AnimatePresence>
                {selected && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedId(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }} />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 70, background: 'white', borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><div style={{ width: 40, height: 4, borderRadius: 2, background: '#e5e7eb' }} /></div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 10 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 900, fontSize: 15, color: '#111827', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.subject}</div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>#{selected.ticket_no}</span>
                                        <span style={{ fontSize: 11, fontWeight: 800, background: (STATUS_COLORS[selected.status] || STATUS_COLORS.Open).bg, color: (STATUS_COLORS[selected.status] || STATUS_COLORS.Open).text, border: `1px solid ${(STATUS_COLORS[selected.status] || STATUS_COLORS.Open).border}`, borderRadius: 6, padding: '2px 8px' }}>{selected.status}</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedId(null)} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>×</button>
                            </div>
                            <div style={{ background: '#f9fafb', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
                                <p style={{ fontSize: 13, color: '#374151', fontWeight: 500, lineHeight: 1.6 }}>{selected.description}</p>
                            </div>
                            {/* Replies */}
                            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
                                {selected.replies && (() => {
                                    try {
                                        const replies = typeof selected.replies === 'string' ? JSON.parse(selected.replies) : selected.replies;
                                        return Array.isArray(replies) ? replies.map((r, i) => (
                                            <div key={i} style={{ marginBottom: 10, display: 'flex', justifyContent: r.role === 'admin' ? 'flex-start' : 'flex-end' }}>
                                                <div style={{ maxWidth: '80%', background: r.role === 'admin' ? '#f3f4f6' : '#fff1f0', borderRadius: 12, padding: '10px 14px' }}>
                                                    <p style={{ fontSize: 12, fontWeight: 700, color: r.role === 'admin' ? '#374151' : '#ef3837', marginBottom: 4 }}>{r.role === 'admin' ? '🛡️ Admin' : '👤 You'}</p>
                                                    <p style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{r.message}</p>
                                                </div>
                                            </div>
                                        )) : null;
                                    } catch { return null; }
                                })()}
                            </div>
                            {selected.status !== 'Closed' && (
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <input type="text" value={replyText} placeholder="Type your reply…" onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReply()} style={{ ...inputStyle, flex: 1 }} onFocus={e => { e.target.style.borderColor = '#ef3837'; e.target.style.background = 'white'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }} />
                                    <button onClick={handleReply} disabled={isReplying || !replyText.trim()} style={{ padding: '0 16px', background: 'linear-gradient(135deg,#ef3837,#d92300)', border: 'none', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 800, cursor: isReplying ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, opacity: isReplying || !replyText.trim() ? 0.6 : 1, flexShrink: 0 }}>
                                        {isReplying ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : 'Send'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }`}</style>
        </AppLayout>
    );
}
