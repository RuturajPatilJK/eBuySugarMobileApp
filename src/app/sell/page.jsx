'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';
import { useGetMyBalanceQuery, useGetMaxTenderNoQuery, useCreateTenderMutation } from '../../services/tenderApi';
import { useGetMeQuery } from '../../services/authApi';

export default function SellPage() {
    const router = useRouter();
    const { data: user } = useGetMeQuery();
    const { data: balance } = useGetMyBalanceQuery();
    const companyCode = parseInt(process.env.NEXT_PUBLIC_COMPANY_CODE) || 4;
    const { data: maxTenderNo } = useGetMaxTenderNoQuery(companyCode);
    const [createTender, { isLoading }] = useCreateTenderMutation();
    const [activeTab, setActiveTab] = useState('tender');
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

    const isGuest = user?.Ac_type === 'G';

    const showToast = (message, type = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(p => ({ ...p, show: false })), 3500);
    };

    const tabs = [
        { id: 'tender', label: 'E-Tender', icon: '📝' },
        { id: 'auction', label: 'E-Auction', icon: '🔨' },
        { id: 'sale', label: 'E-Sale', icon: '💰' },
    ];

    return (
        <AppLayout title="Sell Sugar">
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
                {isGuest && (
                    <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>⚠️</span>
                        <div>
                            <p style={{ fontWeight: 700, fontSize: 13, color: '#92400e', marginBottom: 2 }}>Guest Mode</p>
                            <p style={{ fontSize: 12, color: '#b45309' }}>Register to create and manage tenders.</p>
                        </div>
                        <button onClick={() => router.push('/register')} style={{ marginLeft: 'auto', background: '#f59e0b', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 800, color: 'white', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Register</button>
                    </div>
                )}

                {/* Tab selector */}
                <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 14, padding: 4, marginBottom: 20 }}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            style={{ flex: 1, padding: '10px 4px', border: 'none', cursor: 'pointer', borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s', background: activeTab === tab.id ? 'white' : 'transparent', color: activeTab === tab.id ? '#ef3837' : '#6b7280', boxShadow: activeTab === tab.id ? '0 1px 6px rgba(0,0,0,0.08)' : 'none' }}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Quick action cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                        { label: 'Add New E-Tender', icon: '📝', desc: 'Create sugar tender listing', href: '/add-tender', color: '#fff1f0' },
                        { label: 'Add New E-Auction', icon: '🔨', desc: 'Start an e-auction', href: '/add-auction', color: '#f0fdf4' },
                        { label: 'Add E-Sale Auda', icon: '💰', desc: 'Submit sale auda entry', href: '/add-sale', color: '#eff6ff' },
                        { label: 'Reports', icon: '📊', desc: 'View tender & sales reports', href: '/reports', color: '#faf5ff' },
                    ].map((item, i) => (
                        <motion.div key={item.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                            onClick={() => isGuest ? showToast('Register to use this feature', 'error') : router.push(item.href)}
                            style={{ background: 'white', borderRadius: 16, padding: '16px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6', cursor: 'pointer' }}>
                            <div style={{ width: 48, height: 48, borderRadius: 14, background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{item.icon}</div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 15, color: '#111827', marginBottom: 3 }}>{item.label}</div>
                                <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{item.desc}</div>
                            </div>
                            <svg style={{ marginLeft: 'auto' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                        </motion.div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
