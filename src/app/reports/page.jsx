'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';

const REPORTS = [
    {
        label: 'My Sale Report',
        desc: 'Daily & date-range sale records by tender',
        icon: '📈',
        href: '/my-sale-report',
        color: '#eff6ff',
        accent: '#2563eb',
    },
    {
        label: 'Sale Bills',
        desc: 'Invoices & customer sale bills',
        icon: '🧾',
        href: '/sale-bills',
        color: '#f0fdf4',
        accent: '#059669',
    },
    {
        label: 'Account Statement',
        desc: 'General ledger & account transactions',
        icon: '📒',
        href: '/general-ledger',
        color: '#eef2ff',
        accent: '#4338ca',
    },
];

export default function ReportsPage() {
    const router = useRouter();

    return (
        <AppLayout title="Reports" showBack>
            <div style={{ padding: '12px 16px 32px', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>

                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'linear-gradient(135deg,#1e293b,#334155)', borderRadius: 18, padding: '16px 18px', marginBottom: 20, boxShadow: '0 6px 24px rgba(30,41,59,0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📊</div>
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700 }}>ANALYTICS & REPORTS</p>
                            <p style={{ color: 'white', fontSize: 16, fontWeight: 900 }}>eBuySugar Reports</p>
                        </div>
                    </div>
                </motion.div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {REPORTS.map((report, i) => (
                        <motion.div
                            key={report.label}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 25 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => router.push(report.href)}
                            style={{
                                background: 'white', borderRadius: 16, padding: '16px',
                                display: 'flex', alignItems: 'center', gap: 14,
                                boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
                                border: `1px solid ${report.color}`,
                                cursor: 'pointer',
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            <div style={{
                                width: 52, height: 52, borderRadius: 14,
                                background: report.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 26, flexShrink: 0,
                                boxShadow: `0 2px 10px ${report.accent}20`,
                            }}>
                                {report.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 800, fontSize: 15, color: '#111827', marginBottom: 3 }}>{report.label}</div>
                                <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>{report.desc}</div>
                            </div>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: report.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={report.accent} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <p style={{ textAlign: 'center', fontSize: 11, color: '#d1d5db', fontWeight: 500, marginTop: 20 }}>
                    All reports pull live data from eBuySugar servers
                </p>
            </div>
        </AppLayout>
    );
}
