'use client';
import { motion } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';

const LINKS = [
    { label: 'ISMA (Indian Sugar Mills Association)', url: 'https://www.indiansugar.com', icon: '🏭' },
    { label: 'NFCSF (National Federation)', url: 'https://www.nfcsf.org', icon: '🌾' },
    { label: 'CANE Commissioner Maharashtra', url: 'https://www.mahasugar.maharashtra.gov.in', icon: '🏛️' },
    { label: 'FCI (Food Corporation of India)', url: 'https://www.fci.gov.in', icon: '🏢' },
    { label: 'GST Portal', url: 'https://www.gst.gov.in', icon: '📋' },
    { label: 'E-Way Bill Portal', url: 'https://ewaybillgst.gov.in', icon: '📦' },
    { label: 'Income Tax e-Filing', url: 'https://www.incometax.gov.in', icon: '💼' },
    { label: 'SEBI (Securities & Exchange Board)', url: 'https://www.sebi.gov.in', icon: '📈' },
];

export default function UsefulLinksPage() {
    return (
        <AppLayout title="Useful Links" showBack>
            <div style={{ padding: '12px 16px', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {LINKS.map((link, i) => (
                        <motion.a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            style={{ background: 'white', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6', textDecoration: 'none', color: 'inherit' }}
                        >
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{link.icon}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.label}</div>
                                <div style={{ fontSize: 12, color: '#ef3837', fontWeight: 600 }}>External Link ↗</div>
                            </div>
                        </motion.a>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
