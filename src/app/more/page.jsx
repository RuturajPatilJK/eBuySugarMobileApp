'use client';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useGetMyDocumentsQuery } from '../../services/userDocumentsApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const COMPANY_CODE = parseInt(process.env.NEXT_PUBLIC_COMPANY_CODE) || 4;
import { motion } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';
import { useGetMyComplaintsQuery } from '../../services/grievanceApi';
import { useGetMeQuery } from '../../services/authApi';

const MENU_ITEMS = [
    {
        section: 'Trade',
        items: [
            { icon: '📦', label: 'My Orders', sub: 'View purchase history', href: '/my-orders', color: '#2563eb' },
            { icon: '🚚', label: 'Track Orders', sub: 'Live delivery tracking', href: '/track-orders', color: '#059669' },
            { icon: '📒', label: 'Account Statement', sub: 'Ledger & transactions', href: '/general-ledger', color: '#6366f1' },
            { icon: '📊', label: 'Reports', sub: 'Sales & analytics', href: '/reports', color: '#7c3aed' },
        ],
    },
    {
        section: 'Support',
        items: [
            { icon: '💬', label: 'Grievances', sub: 'Raise & track complaints', href: '/grievances', color: '#ef3837', badge: true },
            { icon: '⭐', label: 'Testimonials', sub: 'What traders say', href: '/testimonials', color: '#f59e0b' },
            { icon: '🔗', label: 'Useful Links', sub: 'Industry resources', href: '/useful-links', color: '#6366f1' },
            { icon: '📄', label: 'Terms of Use', sub: 'Platform rules & policies', href: '/terms', color: '#64748b' },
        ],
    },
    {
        section: 'Account',
        items: [
            { icon: '👤', label: 'Edit Profile', sub: 'Update your details', href: '/edit-profile', color: '#0284c7' },
            { icon: '⚙️', label: 'Settings', sub: 'App preferences', href: '/settings', color: '#374151' },
        ],
    },
];

export default function MorePage() {
    const router = useRouter();
    const { data: user } = useGetMeQuery();
    const { data: grievances } = useGetMyComplaintsQuery();
    const { currentAccoid, accounts } = useSelector(s => s.auth);
    const { data: docsRes } = useGetMyDocumentsQuery(COMPANY_CODE, { skip: !user });
    const currentAccount = accounts?.find(a => a.accoid === currentAccoid);

    const unreadCount = grievances?.filter(g => !g.is_read)?.length || 0;
    const acName = user?.Ac_Name_E || user?.Person_Name || 'User';
    const initials = acName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const isAdmin = currentAccount?.Ac_type === 'Z';

    const docs = Array.isArray(docsRes) ? docsRes : (docsRes?.documents || docsRes?.data || []);
    const profilePhotoDoc = docs.find(d => d.doc_type === 'profile_photo');
    const profilePhotoUrl = profilePhotoDoc?.file_path
        ? (profilePhotoDoc.file_path.startsWith('http') ? profilePhotoDoc.file_path : `${API_BASE_URL}/uploads/${profilePhotoDoc.file_path.replace(/^\/?(?:uploads\/)?/, '')}`)
        : null;

    return (
        <AppLayout title="More">
            <div style={{ padding: '0 16px 32px', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>
                {/* Profile hero */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    onClick={() => router.push('/edit-profile')}
                    style={{ background: 'linear-gradient(135deg,#ef3837,#d92300)', borderRadius: 20, padding: '20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(239,56,55,0.3)' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0, overflow: 'hidden' }}>
                        {profilePhotoUrl
                            ? <img src={profilePhotoUrl} alt={acName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <img src="/eBuySugarlogo.jpg" alt="eBuySugar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: 'white', fontWeight: 900, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acName}</div>
                        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 500 }}>{user?.mobile_no}</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '2px 10px', marginTop: 4 }}>
                            <span style={{ color: 'white', fontSize: 11, fontWeight: 800 }}>
                                {isAdmin ? '🛡️ Admin' : currentAccount?.Ac_type === 'G' ? '👁 Guest' : '✓ Trader'}
                            </span>
                        </div>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                </motion.div>

                {/* Admin quick access */}
                {isAdmin && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)', borderRadius: 16, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                        onClick={() => router.push('/admin-grievances')}>
                        <span style={{ fontSize: 24 }}>🛡️</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>Admin Grievances</div>
                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 500 }}>Manage all customer complaints</div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                    </motion.div>
                )}

                {isAdmin && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
                        style={{ background: 'linear-gradient(135deg,#064e3b,#065f46)', borderRadius: 16, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                        onClick={() => router.push('/customer-limit')}>
                        <span style={{ fontSize: 24 }}>💰</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>Customer Limits</div>
                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 500 }}>Set buy/sell balance limits</div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                    </motion.div>
                )}

                {/* Menu sections */}
                {MENU_ITEMS.map((section, si) => (
                    <div key={section.section} style={{ marginBottom: 20 }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, paddingLeft: 4 }}>{section.section}</p>
                        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
                            {section.items.map((item, ii) => (
                                <motion.button key={item.href}
                                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: si * 0.05 + ii * 0.04 }}
                                    onClick={() => router.push(item.href)}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: 'none', borderBottom: ii < section.items.length - 1 ? '1px solid #f9fafb' : 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', position: 'relative' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                                        {item.icon}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 2 }}>{item.label}</div>
                                        <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>{item.sub}</div>
                                    </div>
                                    {item.badge && unreadCount > 0 && (
                                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#ef3837', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </div>
                                    )}
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                ))}

                <p style={{ textAlign: 'center', fontSize: 12, color: '#d1d5db', fontWeight: 500, marginTop: 8 }}>eBuySugar v1.0.0 · Sugar Trade Portal</p>
            </div>
        </AppLayout>
    );
}
