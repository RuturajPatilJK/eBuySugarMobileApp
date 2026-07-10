'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useGetMeQuery } from '../../services/authApi';
import MobileHeader from './MobileHeader';
import BottomNav from './BottomNav';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const PAGE_TITLES = {
    '/dashboard':         'Dashboard',
    '/my-orders':         'My Orders',
    '/track-orders':      'Track Orders',
    '/grievances':        'My Grievances',
    '/admin-grievances':  'Admin Grievances',
    '/reports':           'Reports',
    '/general-ledger':    'Account Statement',
    '/sale-bills':        'Sale Bills',
    '/dispatch-summary':  'Dispatch Summary',
    '/my-esales':         'My eSale Sauda',
    '/settings':          'Settings',
    '/edit-profile':      'Edit Profile',
    '/useful-links':      'Useful Links',
    '/terms':             'Terms of Use',
    '/testimonials':      'Testimonials',
    '/customer-limit':    'Customer Limits',
    '/my-sale-report':    'My Sale Report',
    '/add-sale':          'New Sale Sauda',
    '/more':              'More',
};

const MAIN_NAV = ['/dashboard', '/my-orders', '/track-orders', '/grievances', '/more'];

export default function AppLayout({ children, title, showBack }) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: user, isLoading, isFetching, isError } = useGetMeQuery();

    /* Register push subscription once the user is authenticated */
    usePushNotifications(!!user);

    useEffect(() => {
        if (!isLoading && !isFetching && isError) {
            router.replace('/login');
        }
    }, [isLoading, isFetching, isError, router]);

    if (isLoading || isFetching) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'white', flexDirection: 'column', gap: 16,
            }}>
                <div style={{
                    width: 40, height: 40, border: '4px solid #ef3837',
                    borderTopColor: 'transparent', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ color: '#9ca3af', fontSize: 14, fontWeight: 500 }}>Loading...</p>
            </div>
        );
    }

    const resolvedTitle = title || PAGE_TITLES[pathname] || 'eBuySugar';
    const isMainNav = MAIN_NAV.includes(pathname);

    return (
        <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>
            <MobileHeader title={resolvedTitle} showBack={!isMainNav || showBack} />
            <main style={{
                paddingTop: 56,
                paddingBottom: 80,
                minHeight: '100vh',
            }}>
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
