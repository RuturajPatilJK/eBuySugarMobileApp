'use client';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserCog, Settings2, MessageSquare, Truck, Link2, ScrollText,
    ShieldCheck, BarChart3, LogOut, ChevronRight, ArrowLeft, X,
} from 'lucide-react';
import { useGetMeQuery, useLogoutMutation } from '../../services/authApi';
import { clearAuth } from '../../store/authSlice';
import { useGetMyDocumentsQuery } from '../../services/userDocumentsApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const COMPANY_CODE = parseInt(process.env.NEXT_PUBLIC_COMPANY_CODE) || 4;

const MENU_SECTIONS = [
    {
        label: 'Account',
        items: [
            { icon: UserCog,      label: 'Edit Profile',   href: '/edit-profile',   iconColor: '#2563eb', iconBg: '#eff6ff' },
            { icon: Settings2,    label: 'Settings',       href: '/settings',       iconColor: '#374151', iconBg: '#f3f4f6' },
        ],
    },
    {
        label: 'Trade',
        items: [
            { icon: Truck,        label: 'Track Orders',   href: '/track-orders',   iconColor: '#059669', iconBg: '#f0fdf4' },
        ],
    },
    {
        label: 'Support',
        items: [
            { icon: MessageSquare, label: 'My Grievances', href: '/grievances',     iconColor: '#d97706', iconBg: '#fffbeb' },
            { icon: Link2,         label: 'Useful Links',  href: '/useful-links',   iconColor: '#7c3aed', iconBg: '#f5f3ff' },
            { icon: ScrollText,    label: 'Terms of Use',  href: '/terms',          iconColor: '#64748b', iconBg: '#f8fafc' },
        ],
    },
];

const ADMIN_ITEMS = [
    { icon: BarChart3,   label: 'Customer Limits',   href: '/customer-limit',    iconColor: '#059669', iconBg: '#f0fdf4' },
    { icon: ShieldCheck, label: 'Admin Grievances',  href: '/admin-grievances',  iconColor: '#4f46e5', iconBg: '#eef2ff' },
];

export default function MobileHeader({ title, showBack = false }) {
    const router   = useRouter();
    const dispatch = useDispatch();
    const { data: user }                  = useGetMeQuery();
    const [logout]                        = useLogoutMutation();
    const { accounts, currentAccoid }     = useSelector(s => s.auth);
    const [showMenu, setShowMenu]         = useState(false);
    const { data: docsRes }               = useGetMyDocumentsQuery(COMPANY_CODE, { skip: !user });

    const handleLogout = async () => {
        setShowMenu(false);
        try { await logout().unwrap(); } catch { /* ignore */ }
        dispatch(clearAuth());
        router.replace('/login');
    };

    const navigate = (href) => { setShowMenu(false); router.push(href); };

    const acName    = user?.Ac_Name_E || user?.Person_Name || 'User';
    const acType    = user?.Ac_type;
    const isAdmin   = acType === 'Z';
    const initials  = acName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const currentAccount = accounts?.find(a => a.accoid === currentAccoid);
    const acCode    = currentAccount?.Ac_Code || '';

    const docs = Array.isArray(docsRes) ? docsRes : (docsRes?.documents || docsRes?.data || []);
    const profilePhotoDoc = docs.find(d => d.doc_type === 'profile_photo');
    const profilePhotoUrl = profilePhotoDoc?.file_path
        ? (profilePhotoDoc.file_path.startsWith('http') ? profilePhotoDoc.file_path : `${API_BASE_URL}/uploads/${profilePhotoDoc.file_path.replace(/^\/?(?:uploads\/)?/, '')}`)
        : null;

    const roleBadge = isAdmin ? { label: 'Admin', bg: '#eef2ff', color: '#4f46e5' }
        : acType === 'G' ? { label: 'Guest', bg: '#fff7ed', color: '#c2410c' }
        : { label: 'Trader', bg: '#f0fdf4', color: '#059669' };

    return (
        <>
            {/* ── Top Header Bar ────────────────────────────────────────────── */}
            <header style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
                background: 'white', borderBottom: '1px solid #f3f4f6',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                paddingTop: 'env(safe-area-inset-top)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', height: 56 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {showBack ? (
                            <button onClick={() => router.back()} style={{
                                background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10,
                                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                            }}>
                                <ArrowLeft size={16} color="#374151" strokeWidth={2.5} />
                            </button>
                        ) : (
                            <img src="/eBuySugarlogo.jpg" alt="eBuySugar" style={{ height: 34, width: 34, objectFit: 'contain', borderRadius: 8 }} />
                        )}
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 15, color: '#111827', lineHeight: 1.2 }}>
                                {title || 'eBuySugar'}
                            </div>
                            {!title && (
                                <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Sugar Trade Portal</div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => setShowMenu(true)}
                        style={{
                            width: 38, height: 38, borderRadius: '50%',
                            background: profilePhotoUrl ? 'transparent' : 'linear-gradient(135deg,#ef3837,#d92300)',
                            border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden', padding: 0,
                            WebkitTapHighlightColor: 'transparent',
                            boxShadow: '0 2px 8px rgba(239,56,55,0.4)',
                        }}
                    >
                        {profilePhotoUrl
                            ? <img src={profilePhotoUrl} alt={acName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <img src="/eBuySugarlogo.jpg" alt="eBuySugar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        }
                    </button>
                </div>
            </header>

            {/* ── Slide-up Menu ─────────────────────────────────────────────── */}
            <AnimatePresence>
                {showMenu && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowMenu(false)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60, backdropFilter: 'blur(2px)' }}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
                            style={{
                                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 70,
                                background: '#f9fafb', borderRadius: '24px 24px 0 0',
                                paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
                                maxHeight: '92vh', overflowY: 'auto',
                                fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif',
                            }}
                        >
                            {/* Handle + Close */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 20px 0', position: 'relative' }}>
                                <div style={{ width: 40, height: 4, borderRadius: 2, background: '#d1d5db' }} />
                                <button
                                    onClick={() => setShowMenu(false)}
                                    style={{ position: 'absolute', right: 16, top: 8, width: 32, height: 32, borderRadius: '50%', background: '#e5e7eb', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                >
                                    <X size={15} color="#6b7280" strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* User card */}
                            <div style={{ margin: '16px 16px 0' }}>
                                <div style={{
                                    background: 'linear-gradient(135deg,#ef3837 0%,#b91c1c 100%)',
                                    borderRadius: 20, padding: '18px 16px',
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    boxShadow: '0 8px 24px rgba(239,56,55,0.25)',
                                }}>
                                    <div style={{
                                        width: 54, height: 54, borderRadius: '50%', flexShrink: 0,
                                        border: '2.5px solid rgba(255,255,255,0.45)',
                                        overflow: 'hidden', background: 'rgba(255,255,255,0.15)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {profilePhotoUrl
                                            ? <img src={profilePhotoUrl} alt={acName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <img src="/eBuySugarlogo.jpg" alt="eBuySugar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        }
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ color: 'white', fontWeight: 900, fontSize: 16, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acName}</p>
                                        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 500, margin: '0 0 6px' }}>{user?.mobile_no || ''}{acCode ? ` · ${acCode}` : ''}</p>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: roleBadge.bg, color: roleBadge.color, fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>
                                            {roleBadge.label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Menu sections */}
                            <div style={{ padding: '16px 16px 0' }}>
                                {MENU_SECTIONS.map(section => (
                                    <div key={section.label} style={{ marginBottom: 14 }}>
                                        <p style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, paddingLeft: 4 }}>{section.label}</p>
                                        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
                                            {section.items.map((item, idx) => {
                                                const Icon = item.icon;
                                                return (
                                                    <button
                                                        key={item.href}
                                                        onClick={() => navigate(item.href)}
                                                        style={{
                                                            width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                                                            padding: '14px 16px',
                                                            border: 'none', borderBottom: idx < section.items.length - 1 ? '1px solid #f9fafb' : 'none',
                                                            background: 'none', cursor: 'pointer', textAlign: 'left',
                                                            fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
                                                        }}
                                                    >
                                                        <div style={{ width: 38, height: 38, borderRadius: 11, background: item.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <Icon size={18} color={item.iconColor} strokeWidth={2} />
                                                        </div>
                                                        <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color: '#1f2937' }}>{item.label}</span>
                                                        <ChevronRight size={16} color="#d1d5db" strokeWidth={2.5} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {/* Admin section */}
                                {isAdmin && (
                                    <div style={{ marginBottom: 14 }}>
                                        <p style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, paddingLeft: 4 }}>Admin</p>
                                        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
                                            {ADMIN_ITEMS.map((item, idx) => {
                                                const Icon = item.icon;
                                                return (
                                                    <button
                                                        key={item.href}
                                                        onClick={() => navigate(item.href)}
                                                        style={{
                                                            width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                                                            padding: '14px 16px',
                                                            border: 'none', borderBottom: idx < ADMIN_ITEMS.length - 1 ? '1px solid #f9fafb' : 'none',
                                                            background: 'none', cursor: 'pointer', textAlign: 'left',
                                                            fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
                                                        }}
                                                    >
                                                        <div style={{ width: 38, height: 38, borderRadius: 11, background: item.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <Icon size={18} color={item.iconColor} strokeWidth={2} />
                                                        </div>
                                                        <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color: '#1f2937' }}>{item.label}</span>
                                                        <ChevronRight size={16} color="#d1d5db" strokeWidth={2.5} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Logout */}
                                <div style={{ marginBottom: 8 }}>
                                    <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid #fee2e2' }}>
                                        <button
                                            onClick={handleLogout}
                                            style={{
                                                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                                                padding: '14px 16px', border: 'none', background: 'none',
                                                cursor: 'pointer', textAlign: 'left',
                                                fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
                                            }}
                                        >
                                            <div style={{ width: 38, height: 38, borderRadius: 11, background: '#fff1f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <LogOut size={18} color="#ef3837" strokeWidth={2} />
                                            </div>
                                            <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color: '#ef3837' }}>Logout</span>
                                        </button>
                                    </div>
                                </div>

                                <p style={{ textAlign: 'center', fontSize: 11, color: '#d1d5db', fontWeight: 500, marginTop: 4 }}>eBuySugar v1.0.0</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
