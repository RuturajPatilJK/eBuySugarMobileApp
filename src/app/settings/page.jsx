'use client';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';
import { useGetMeQuery, useLogoutMutation } from '../../services/authApi';
import { clearAuth } from '../../store/authSlice';

const SETTING_SECTIONS = [
    {
        title: 'Account',
        items: [
            { label: 'Edit Profile', icon: '👤', href: '/edit-profile' },
            { label: 'My Grievances', icon: '📋', href: '/grievances' },
        ],
    },
    {
        title: 'Orders & Trade',
        items: [
            { label: 'My Orders', icon: '📦', href: '/my-orders' },
            { label: 'Track Orders', icon: '🚚', href: '/track-orders' },
            { label: 'Reports', icon: '📊', href: '/reports' },
        ],
    },
    {
        title: 'Information',
        items: [
            { label: 'Useful Links', icon: '🔗', href: '/useful-links' },
            { label: 'Testimonials', icon: '⭐', href: '/testimonials' },
            { label: 'Terms of Use', icon: '📄', href: '/terms' },
        ],
    },
];

export default function SettingsPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { data: user } = useGetMeQuery();
    const [logout] = useLogoutMutation();

    const handleLogout = async () => {
        try { await logout().unwrap(); } catch { /* ignore */ }
        dispatch(clearAuth());
        router.replace('/login');
    };

    const acName = user?.Ac_Name_E || user?.Person_Name || 'User';
    const initials = acName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    return (
        <AppLayout title="Settings" showBack>
            <div style={{ padding: '12px 16px', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>
                {/* Profile card */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    onClick={() => router.push('/edit-profile')}
                    style={{ background: 'white', borderRadius: 20, padding: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', border: '1px solid #f3f4f6' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#ef3837,#d92300)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 20, boxShadow: '0 4px 12px rgba(239,56,55,0.35)', flexShrink: 0 }}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#111827', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acName}</div>
                        <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>{user?.mobile_no}</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: user?.Ac_type === 'Z' ? '#f5f3ff' : user?.Ac_type === 'G' ? '#fff7ed' : '#f0fdf4', borderRadius: 6, padding: '2px 8px', marginTop: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: user?.Ac_type === 'Z' ? '#7c3aed' : user?.Ac_type === 'G' ? '#c2410c' : '#15803d' }}>
                                {user?.Ac_type === 'Z' ? '🛡️ Admin' : user?.Ac_type === 'G' ? '👁 Guest' : '✓ Trader'}
                            </span>
                        </div>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                </motion.div>

                {/* Setting sections */}
                {SETTING_SECTIONS.map((section, si) => (
                    <div key={section.title} style={{ marginBottom: 20 }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, paddingLeft: 4 }}>{section.title}</p>
                        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
                            {section.items.map((item, ii) => (
                                <motion.button
                                    key={item.label}
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (si * 3 + ii) * 0.04 }}
                                    onClick={() => router.push(item.href)}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: 'none', borderBottom: ii < section.items.length - 1 ? '1px solid #f9fafb' : 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                                >
                                    <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{item.icon}</span>
                                    <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: '#374151' }}>{item.label}</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Logout */}
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleLogout}
                    style={{ width: '100%', padding: '16px', background: 'white', border: '2px solid #fee2e2', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>🚪</span>
                    <span style={{ fontWeight: 800, fontSize: 15, color: '#ef4444' }}>Logout</span>
                </motion.button>

                <p style={{ textAlign: 'center', fontSize: 12, color: '#d1d5db', fontWeight: 500 }}>eBuySugar v1.0.0 · Sugar Trade Portal</p>
            </div>
        </AppLayout>
    );
}
