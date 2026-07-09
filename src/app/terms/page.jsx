'use client';
import { motion } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';

const TERMS = [
    { title: 'User Eligibility', content: 'This platform is intended for registered sugar mills, traders, and dealers in India. You must be 18+ years of age with a valid GSTIN to conduct trades.' },
    { title: 'OTP Authentication', content: 'All logins require OTP verification via WhatsApp on your registered mobile number. Keep your mobile secure. Never share your OTP with anyone.' },
    { title: 'Trading Terms', content: 'All tender transactions are binding. Once a purchase is confirmed via FIFO system, it cannot be cancelled. Ensure you have sufficient balance before placing orders.' },
    { title: 'Data Privacy', content: 'We collect your mobile number, business name, GSTIN, and transaction details. Data is used only for platform operations and is not sold to third parties.' },
    { title: 'Liability', content: 'eBuySugar facilitates transactions between buyers and sellers. We are not responsible for quality disputes, delivery failures, or payment defaults between parties.' },
    { title: 'Dispute Resolution', content: 'Use the Grievance section to report issues. Admin will respond within 2-3 business days. Unresolved disputes may be escalated to ISMA arbitration.' },
    { title: 'Account Suspension', content: 'We reserve the right to suspend accounts for fraudulent activity, violation of trading rules, or misuse of platform features.' },
    { title: 'Changes to Terms', content: 'eBuySugar may update these terms at any time. Continued use of the platform constitutes acceptance of revised terms.' },
];

export default function TermsPage() {
    return (
        <AppLayout title="Terms of Use" showBack>
            <div style={{ padding: '12px 16px 32px', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'linear-gradient(135deg,#ef3837,#d92300)', borderRadius: 16, padding: '16px 20px', marginBottom: 20, boxShadow: '0 4px 16px rgba(239,56,55,0.3)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>LAST UPDATED</p>
                    <p style={{ color: 'white', fontSize: 15, fontWeight: 800 }}>July 2025</p>
                </motion.div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {TERMS.map((term, i) => (
                        <motion.div key={term.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            style={{ background: 'white', borderRadius: 14, padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
                            <h3 style={{ fontWeight: 800, fontSize: 14, color: '#111827', marginBottom: 8 }}>{i + 1}. {term.title}</h3>
                            <p style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, lineHeight: 1.7 }}>{term.content}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
