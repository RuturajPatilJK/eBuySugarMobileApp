'use client';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGetMyComplaintsQuery } from '../../services/grievanceApi';

const NAV_ITEMS = [
    { label: 'Home',        href: '/dashboard',     icon: HomeIcon },
    { label: 'Orders',      href: '/my-orders',     icon: OrdersIcon },
    { label: 'Track',       href: '/track-orders',  icon: TrackIcon },
    { label: 'Grievances',  href: '/grievances',    icon: GrievanceIcon, badge: true },
    { label: 'More',        href: '/more',          icon: MoreIcon },
];

function HomeIcon({ active }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#ef3837' : 'none'}
            stroke={active ? '#ef3837' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    );
}
function OrdersIcon({ active }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke={active ? '#ef3837' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    );
}
function TrackIcon({ active }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke={active ? '#ef3837' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
function GrievanceIcon({ active }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke={active ? '#ef3837' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}
function MoreIcon({ active }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke={active ? '#ef3837' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
        </svg>
    );
}

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: complaints } = useGetMyComplaintsQuery(undefined, { skip: false });
    const unreadCount = complaints?.filter(c => c.is_unread)?.length || 0;

    const isActive = (href) => {
        if (href === '/more') {
            const moreRoutes = [
                '/settings', '/edit-profile', '/useful-links', '/terms', '/testimonials',
                '/reports', '/general-ledger', '/sale-bills', '/dispatch-summary',
                '/my-esales', '/admin-grievances', '/customer-limit',
            ];
            return moreRoutes.some(r => pathname.startsWith(r));
        }
        return pathname === href || pathname.startsWith(href + '/');
    };

    return (
        <nav style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
            background: 'white',
            borderTop: '1px solid #f3f4f6',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'stretch',
            paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
            {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                const showBadge = item.badge && unreadCount > 0;
                return (
                    <button
                        key={item.href}
                        onClick={() => router.push(item.href)}
                        style={{
                            flex: 1, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            padding: '8px 0 6px', border: 'none', background: 'none',
                            cursor: 'pointer', position: 'relative',
                            WebkitTapHighlightColor: 'transparent',
                            gap: 3,
                        }}
                    >
                        <motion.div
                            animate={active ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                            transition={{ duration: 0.3 }}
                            style={{ position: 'relative' }}
                        >
                            <Icon active={active} />
                            {showBadge && (
                                <span style={{
                                    position: 'absolute', top: -4, right: -6,
                                    background: '#ef3837', color: 'white',
                                    fontSize: 9, fontWeight: 800, borderRadius: 10,
                                    minWidth: 16, height: 16, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    padding: '0 3px',
                                }}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </motion.div>
                        <span style={{
                            fontSize: 10, fontWeight: active ? 800 : 600,
                            color: active ? '#ef3837' : '#9ca3af',
                            transition: 'color 0.2s',
                        }}>
                            {item.label}
                        </span>
                        {active && (
                            <motion.div
                                layoutId="bottomNavIndicator"
                                style={{
                                    position: 'absolute', top: 0, left: '15%', right: '15%',
                                    height: 3, background: '#ef3837',
                                    borderRadius: '0 0 3px 3px',
                                }}
                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            />
                        )}
                    </button>
                );
            })}
        </nav>
    );
}
