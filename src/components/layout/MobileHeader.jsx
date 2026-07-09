'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserCog, Settings2, MessageSquare, Truck, Link2, ScrollText,
    ShieldCheck, BarChart3, LogOut, ChevronRight, ArrowLeft,
    Menu, LayoutDashboard, Package, FileText, Bell, Star,
} from 'lucide-react';
import { useGetMeQuery, useLogoutMutation } from '../../services/authApi';
import { clearAuth } from '../../store/authSlice';
import { useGetMyDocumentsQuery } from '../../services/userDocumentsApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const COMPANY_CODE = parseInt(process.env.NEXT_PUBLIC_COMPANY_CODE) || 4;

const NAV_ITEMS = [
    {
        section: 'Main',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard',       href: '/dashboard',     iconColor: '#ef3837', iconBg: '#fff1f0' },
            { icon: Package,         label: 'My Orders',        href: '/my-orders',     iconColor: '#2563eb', iconBg: '#eff6ff' },
            { icon: Truck,           label: 'Track Orders',     href: '/track-orders',  iconColor: '#059669', iconBg: '#f0fdf4' },
        ],
    },
    {
        section: 'Account',
        items: [
            { icon: UserCog,         label: 'Edit Profile',     href: '/edit-profile',  iconColor: '#7c3aed', iconBg: '#f5f3ff' },
            { icon: Settings2,       label: 'Settings',         href: '/settings',      iconColor: '#374151', iconBg: '#f3f4f6' },
            { icon: FileText,        label: 'Account Statement',href: '/general-ledger',iconColor: '#0284c7', iconBg: '#f0f9ff' },
        ],
    },
    {
        section: 'Support',
        items: [
            { icon: MessageSquare,   label: 'Grievances',       href: '/grievances',    iconColor: '#d97706', iconBg: '#fffbeb' },
            { icon: Star,            label: 'Testimonials',     href: '/testimonials',  iconColor: '#f59e0b', iconBg: '#fefce8' },
            { icon: Link2,           label: 'Useful Links',     href: '/useful-links',  iconColor: '#6366f1', iconBg: '#eef2ff' },
            { icon: ScrollText,      label: 'Terms of Use',     href: '/terms',         iconColor: '#64748b', iconBg: '#f8fafc' },
        ],
    },
];

const ADMIN_ITEMS = [
    { icon: BarChart3,   label: 'Customer Limits',   href: '/customer-limit',   iconColor: '#059669', iconBg: '#f0fdf4' },
    { icon: ShieldCheck, label: 'Admin Grievances',  href: '/admin-grievances', iconColor: '#4f46e5', iconBg: '#eef2ff' },
];

export default function MobileHeader({ title, showBack = false }) {
    const router    = useRouter();
    const pathname  = usePathname();
    const dispatch  = useDispatch();
    const { data: user }              = useGetMeQuery();
    const [logout]                    = useLogoutMutation();
    const { accounts, currentAccoid } = useSelector(s => s.auth);
    const [open, setOpen]             = useState(false);
    const { data: docsRes }           = useGetMyDocumentsQuery(COMPANY_CODE, { skip: !user });

    const handleLogout = async () => {
        setOpen(false);
        try { await logout().unwrap(); } catch {}
        dispatch(clearAuth());
        router.replace('/login');
    };

    const go = (href) => { setOpen(false); router.push(href); };

    const acName   = user?.Ac_Name_E || user?.Person_Name || 'User';
    const acType   = user?.Ac_type;
    const isAdmin  = acType === 'Z';
    const initials = acName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const acCode   = accounts?.find(a => a.accoid === currentAccoid)?.Ac_Code || '';

    const docs = Array.isArray(docsRes) ? docsRes : (docsRes?.documents || docsRes?.data || []);
    const profilePhotoDoc = docs.find(d => d.doc_type === 'profile_photo');
    const profilePhotoUrl = profilePhotoDoc?.file_path
        ? (profilePhotoDoc.file_path.startsWith('http') ? profilePhotoDoc.file_path : `${API_BASE_URL}/uploads/${profilePhotoDoc.file_path.replace(/^\/?(?:uploads\/)?/, '')}`)
        : null;

    const roleConfig = isAdmin
        ? { label: 'Admin',  bg: '#eef2ff', color: '#4f46e5', dot: '#4f46e5' }
        : acType === 'G'
        ? { label: 'Guest',  bg: '#fff7ed', color: '#c2410c', dot: '#f97316' }
        : { label: 'Trader', bg: '#f0fdf4', color: '#15803d', dot: '#22c55e' };

    return (
        <>
            {/* ── Top Header Bar ── */}
            <header style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
                background: 'white',
                borderBottom: '1px solid #f1f5f9',
                boxShadow: '0 1px 12px rgba(0,0,0,0.07)',
                paddingTop: 'env(safe-area-inset-top)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', height: 56, padding: '0 16px', gap: 10 }}>

                    {/* Left: back or hamburger */}
                    {showBack ? (
                        <button onClick={() => router.back()} style={iconBtnStyle}>
                            <ArrowLeft size={18} color="#374151" strokeWidth={2.2} />
                        </button>
                    ) : (
                        <button onClick={() => setOpen(true)} style={iconBtnStyle}>
                            <Menu size={20} color="#374151" strokeWidth={2.2} />
                        </button>
                    )}

                    {/* Brand */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1 }}>
                        <img src="/eBuySugarlogo.jpg" alt="eBuySugar"
                            style={{ height: 32, width: 32, borderRadius: 8, objectFit: 'cover' }} />
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 15, color: '#111827', lineHeight: 1.2, fontFamily: 'Signika, sans-serif' }}>
                                {title || 'eBuySugar'}
                            </div>
                            {!title && (
                                <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, fontFamily: 'Signika, sans-serif' }}>
                                    Sugar Trade Portal
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: avatar */}
                    <button onClick={() => setOpen(true)} style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#ef3837,#b91c1c)',
                        border: '2px solid #fecaca', padding: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                        boxShadow: '0 2px 8px rgba(239,56,55,0.3)',
                    }}>
                        {profilePhotoUrl
                            ? <img src={profilePhotoUrl} alt={acName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <img src="/eBuySugarlogo.jpg" alt="eBuySugar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        }
                    </button>
                </div>
            </header>

            {/* ── Sidebar Drawer ── */}
            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            onClick={() => setOpen(false)}
                            style={{
                                position: 'fixed', inset: 0, zIndex: 60,
                                background: 'rgba(15,23,42,0.5)',
                                backdropFilter: 'blur(3px)',
                            }}
                        />

                        {/* Drawer panel */}
                        <motion.div
                            key="drawer"
                            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                            style={{
                                position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 70,
                                width: 'min(82vw, 308px)',
                                background: '#f8fafc',
                                display: 'flex', flexDirection: 'column',
                                paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
                                overflowY: 'auto',
                                boxShadow: '4px 0 32px rgba(0,0,0,0.18)',
                            }}
                        >
                            {/* ── Profile Card ── */}
                            <div style={{
                                background: 'linear-gradient(145deg, #ef3837 0%, #991b1b 100%)',
                                padding: '48px 20px 22px',
                                position: 'relative', overflow: 'hidden', flexShrink: 0,
                            }}>
                                {/* Decorative circles */}
                                <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
                                <div style={{ position: 'absolute', top: 10, right: 30, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

                                {/* Avatar */}
                                <div style={{
                                    width: 66, height: 66, borderRadius: '50%',
                                    border: '3px solid rgba(255,255,255,0.5)',
                                    overflow: 'hidden', marginBottom: 14,
                                    background: 'rgba(255,255,255,0.15)',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                                }}>
                                    {profilePhotoUrl
                                        ? <img src={profilePhotoUrl} alt={acName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <img src="/eBuySugarlogo.jpg" alt="eBuySugar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    }
                                </div>

                                {/* Name */}
                                <p style={{ color: 'white', fontWeight: 900, fontSize: 17, margin: '0 0 3px', fontFamily: 'Signika, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {acName}
                                </p>
                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 500, margin: '0 0 10px', fontFamily: 'Signika, sans-serif' }}>
                                    {user?.mobile_no || ''}{acCode ? ` · ${acCode}` : ''}
                                </p>

                                {/* Role badge */}
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    background: 'rgba(255,255,255,0.18)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255,255,255,0.25)',
                                    borderRadius: 20, padding: '4px 12px',
                                    color: 'white', fontSize: 11, fontWeight: 800,
                                    fontFamily: 'Signika, sans-serif',
                                }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: roleConfig.dot }} />
                                    {roleConfig.label}
                                </span>
                            </div>

                            {/* ── Navigation ── */}
                            <div style={{ flex: 1, padding: '12px 12px 0' }}>
                                {NAV_ITEMS.map((section, si) => (
                                    <div key={section.section} style={{ marginBottom: 6 }}>
                                        <p style={{
                                            fontSize: 10, fontWeight: 800, color: '#94a3b8',
                                            textTransform: 'uppercase', letterSpacing: '0.08em',
                                            padding: '8px 8px 4px', margin: 0,
                                            fontFamily: 'Signika, sans-serif',
                                        }}>
                                            {section.section}
                                        </p>
                                        <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                                            {section.items.map((item, ii) => {
                                                const Icon = item.icon;
                                                const isActive = pathname === item.href;
                                                return (
                                                    <motion.button
                                                        key={item.href}
                                                        initial={{ opacity: 0, x: -16 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: si * 0.04 + ii * 0.03 }}
                                                        onClick={() => go(item.href)}
                                                        style={{
                                                            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                                            padding: '12px 14px',
                                                            border: 'none',
                                                            borderBottom: ii < section.items.length - 1 ? '1px solid #f8fafc' : 'none',
                                                            background: isActive ? '#fff1f0' : 'none',
                                                            cursor: 'pointer', textAlign: 'left',
                                                            fontFamily: 'Signika, sans-serif',
                                                            WebkitTapHighlightColor: 'transparent',
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                                            background: isActive ? '#fff1f0' : item.iconBg,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                                        }}>
                                                            <Icon size={17} color={isActive ? '#ef3837' : item.iconColor} strokeWidth={2} />
                                                        </div>
                                                        <span style={{
                                                            flex: 1, fontSize: 13, fontWeight: isActive ? 800 : 600,
                                                            color: isActive ? '#ef3837' : '#1e293b',
                                                        }}>
                                                            {item.label}
                                                        </span>
                                                        <ChevronRight size={14} color={isActive ? '#ef3837' : '#cbd5e1'} strokeWidth={2.5} />
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {/* Admin section */}
                                {isAdmin && (
                                    <div style={{ marginBottom: 6 }}>
                                        <p style={{
                                            fontSize: 10, fontWeight: 800, color: '#94a3b8',
                                            textTransform: 'uppercase', letterSpacing: '0.08em',
                                            padding: '8px 8px 4px', margin: 0, fontFamily: 'Signika, sans-serif',
                                        }}>
                                            Admin
                                        </p>
                                        <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                                            {ADMIN_ITEMS.map((item, ii) => {
                                                const Icon = item.icon;
                                                return (
                                                    <motion.button
                                                        key={item.href}
                                                        initial={{ opacity: 0, x: -16 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.18 + ii * 0.03 }}
                                                        onClick={() => go(item.href)}
                                                        style={{
                                                            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                                            padding: '12px 14px', border: 'none',
                                                            borderBottom: ii < ADMIN_ITEMS.length - 1 ? '1px solid #f8fafc' : 'none',
                                                            background: 'none', cursor: 'pointer', textAlign: 'left',
                                                            fontFamily: 'Signika, sans-serif',
                                                            WebkitTapHighlightColor: 'transparent',
                                                        }}
                                                    >
                                                        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: item.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                                                            <Icon size={17} color={item.iconColor} strokeWidth={2} />
                                                        </div>
                                                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{item.label}</span>
                                                        <ChevronRight size={14} color="#cbd5e1" strokeWidth={2.5} />
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Logout ── */}
                            <div style={{ padding: '12px 12px 4px', flexShrink: 0 }}>
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                        padding: '13px', borderRadius: 14, cursor: 'pointer',
                                        background: 'linear-gradient(135deg,#ef3837,#b91c1c)',
                                        border: 'none', fontFamily: 'Signika, sans-serif',
                                        boxShadow: '0 4px 16px rgba(239,56,55,0.3)',
                                        WebkitTapHighlightColor: 'transparent',
                                    }}
                                >
                                    <LogOut size={17} color="white" strokeWidth={2.2} />
                                    <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>Logout</span>
                                </button>
                                <p style={{ textAlign: 'center', fontSize: 11, color: '#cbd5e1', fontWeight: 500, marginTop: 10, fontFamily: 'Signika, sans-serif' }}>
                                    eBuySugar v1.0 · JK India eAgritech
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

const iconBtnStyle = {
    width: 36, height: 36, borderRadius: 10,
    background: '#f8fafc', border: '1px solid #e2e8f0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
    WebkitTapHighlightColor: 'transparent',
};
