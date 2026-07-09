'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen() {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(false), 2800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.04 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 99999,
                        background: 'white',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif',
                    }}
                >
                    {/* Background radial glow */}
                    <div style={{
                        position: 'absolute', bottom: 0, left: '50%',
                        transform: 'translateX(-50%)',
                        width: 500, height: 340,
                        background: 'radial-gradient(ellipse at center, rgba(239,56,55,0.08) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />
                    <div style={{
                        position: 'absolute', top: -60, right: -60,
                        width: 260, height: 260, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(239,56,55,0.05) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />

                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.75, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                        style={{ position: 'relative', zIndex: 1 }}
                    >
                        <img
                            src="/eBuySugar.jpg"
                            alt="eBuySugar"
                            style={{
                                width: 'min(260px, 68vw)',
                                objectFit: 'contain',
                                display: 'block',
                                borderRadius: 16,
                            }}
                        />
                    </motion.div>

                    {/* Tagline */}
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45, duration: 0.4 }}
                        style={{
                            marginTop: 18, fontSize: 13, fontWeight: 600,
                            color: '#9ca3af', letterSpacing: '0.06em',
                            textTransform: 'uppercase', position: 'relative', zIndex: 1,
                        }}
                    >
                        Sugar Trade Portal
                    </motion.p>

                    {/* Bouncing dots loader */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        style={{
                            display: 'flex', gap: 7, marginTop: 32,
                            position: 'relative', zIndex: 1,
                        }}
                    >
                        {[0, 1, 2].map(i => (
                            <motion.div
                                key={i}
                                animate={{ y: [0, -10, 0] }}
                                transition={{
                                    duration: 0.55, delay: i * 0.13,
                                    repeat: Infinity, repeatDelay: 0.25,
                                    ease: 'easeInOut',
                                }}
                                style={{
                                    width: 9, height: 9, borderRadius: '50%',
                                    background: i === 1 ? '#ef3837' : 'rgba(239,56,55,0.35)',
                                }}
                            />
                        ))}
                    </motion.div>

                    {/* Bottom brand line */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        style={{
                            position: 'absolute', bottom: 'max(28px, env(safe-area-inset-bottom))',
                            fontSize: 11, color: '#d1d5db', fontWeight: 500,
                        }}
                    >
                        © JK India eAgritech
                    </motion.p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
