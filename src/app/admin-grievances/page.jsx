'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';
import {
    useGetAllComplaintsQuery,
    useUpdateComplaintStatusMutation,
    useAddReplyMutation,
    useMarkAllAsReadMutation,
} from '../../services/grievanceApi';
import { useGetMeQuery } from '../../services/authApi';

const STATUSES = ['', 'Open', 'In Progress', 'Resolved', 'Closed'];
const CATEGORIES = ['', 'Order', 'Delivery', 'Quality', 'Payment', 'Technical', 'Other'];
const STATUS_COLORS = {
    Open: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
    'In Progress': { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    Resolved: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
    Closed: { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' },
};

export default function AdminGrievancesPage() {
    const router = useRouter();
    const { data: user } = useGetMeQuery();
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const { data: complaints = [], isLoading } = useGetAllComplaintsQuery({ status: statusFilter || undefined, category: categoryFilter || undefined });
    const [updateStatus, { isLoading: isUpdating }] = useUpdateComplaintStatusMutation();
    const [addReply, { isLoading: isReplying }] = useAddReplyMutation();
    const [markAllAsRead] = useMarkAllAsReadMutation();
    const [selected, setSelected] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

    if (user?.Ac_type !== 'Z') { router.replace('/dashboard'); return null; }

    const showToast = (message, type = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(p => ({ ...p, show: false })), 3500);
    };

    const handleUpdateStatus = async () => {
        if (!newStatus || !selected) return;
        try {
            await updateStatus({ grievance_id: selected.grievance_id, status: newStatus }).unwrap();
            showToast('Status updated!', 'success');
            setSelected(null);
        } catch { showToast('Failed to update status.', 'error'); }
    };

    const handleAdminReply = async () => {
        if (!replyText.trim()) return;
        try {
            await addReply({ grievance_id: selected.grievance_id, message: replyText, status: newStatus || undefined }).unwrap();
            showToast('Reply sent!', 'success');
            setReplyText('');
            setSelected(null);
        } catch { showToast('Failed to send reply.', 'error'); }
    };

    const inputStyle = { width: '100%', padding: '12px 14px', background: '#f9fafb', border: '2px solid #e5e7eb', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#111827', outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s' };

    return (
        <AppLayout title="Admin Grievances" showBack>
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
                {/* Admin badge */}
                <div style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', borderRadius: 14, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
                    <div>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700, marginBottom: 2 }}>ADMIN PANEL</p>
                        <p style={{ color: 'white', fontSize: 15, fontWeight: 800 }}>{complaints.length} Total Complaints</p>
                    </div>
                    <span style={{ fontSize: 28 }}>🛡️</span>
                </div>

                {/* Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, appearance: 'none', fontSize: 13 }}>
                        {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
                    </select>
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ ...inputStyle, appearance: 'none', fontSize: 13 }}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
                    </select>
                </div>

                {/* Mark all read */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
                    <button onClick={() => markAllAsRead()} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Mark All Read</button>
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
                        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                        <p style={{ fontWeight: 700, color: '#374151' }}>No complaints found</p>
                    </div>
                ) : (
                    complaints.map((item, i) => {
                        const sc = STATUS_COLORS[item.status] || STATUS_COLORS.Open;
                        return (
                            <motion.div key={item.grievance_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                onClick={() => { setSelected(item); setNewStatus(item.status); }}
                                style={{ background: 'white', borderRadius: 16, padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: `2px solid ${item.is_unread ? '#7c3aed' : '#f3f4f6'}`, marginBottom: 12, cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <span style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af' }}>#{item.ticket_no}</span>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>Ac: {item.Ac_Code}</span>
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 800, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, borderRadius: 6, padding: '3px 8px' }}>{item.status}</span>
                                </div>
                                <div style={{ fontWeight: 800, fontSize: 14, color: '#111827', marginBottom: 4 }}>{item.subject}</div>
                                <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#6b7280', fontWeight: 500 }}>
                                    <span>{item.category}</span>
                                    <span>·</span>
                                    <span>{item.priority}</span>
                                    {item.is_unread && <span style={{ color: '#7c3aed', fontWeight: 700 }}>· Unread</span>}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Admin detail modal */}
            <AnimatePresence>
                {selected && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }} />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 70, background: 'white', borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', maxHeight: '85vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><div style={{ width: 40, height: 4, borderRadius: 2, background: '#e5e7eb' }} /></div>
                            <h3 style={{ fontWeight: 900, fontSize: 17, color: '#111827', marginBottom: 4 }}>{selected.subject}</h3>
                            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>#{selected.ticket_no} · Ac: {selected.Ac_Code}</p>
                            <div style={{ background: '#f9fafb', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
                                <p style={{ fontSize: 13, color: '#374151', fontWeight: 500, lineHeight: 1.6 }}>{selected.description}</p>
                            </div>

                            {/* Update status */}
                            <div style={{ marginBottom: 14 }}>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Update Status</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                                    {STATUSES.filter(Boolean).map(s => (
                                        <button key={s} onClick={() => setNewStatus(s)} type="button"
                                            style={{ padding: '8px 14px', borderRadius: 10, border: `2px solid ${newStatus === s ? '#7c3aed' : '#e5e7eb'}`, background: newStatus === s ? '#f5f3ff' : 'white', color: newStatus === s ? '#7c3aed' : '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Admin Reply</label>
                                <textarea value={replyText} placeholder="Type admin response..." rows={3} onChange={e => setReplyText(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.background = 'white'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <button onClick={handleUpdateStatus} disabled={isUpdating} style={{ padding: '14px', background: '#f3f4f6', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Update Status</button>
                                <motion.button onClick={handleAdminReply} disabled={isReplying || !replyText.trim()} whileTap={{ scale: 0.97 }} style={{ padding: '14px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800, color: 'white', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: isReplying || !replyText.trim() ? 0.6 : 1 }}>
                                    {isReplying ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : null}
                                    Send Reply
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </AppLayout>
    );
}
