'use client';
import { useEffect, useRef } from 'react';
import { useSubscribeToPushMutation } from '../services/pushApi';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw     = atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function usePushNotifications(enabled = true) {
    const [subscribeToPush] = useSubscribeToPushMutation();
    const didRun = useRef(false);

    useEffect(() => {
        if (!enabled)                         return;
        if (didRun.current)                   return;
        if (typeof window === 'undefined')    return;
        if (!('serviceWorker' in navigator))  return;
        if (!('PushManager' in window))       return;
        if (!VAPID_PUBLIC_KEY)                return;

        didRun.current = true;

        const setup = async () => {
            try {
                const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
                await navigator.serviceWorker.ready;

                let sub = await reg.pushManager.getSubscription();

                if (sub) {
                    const j = sub.toJSON();
                    await subscribeToPush({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth });
                    return;
                }

                const permission = await Notification.requestPermission();
                if (permission !== 'granted') return;

                sub = await reg.pushManager.subscribe({
                    userVisibleOnly:      true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                });

                const j = sub.toJSON();
                await subscribeToPush({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth });

            } catch (err) {
                console.warn('[Push] Setup failed:', err.message || err);
            }
        };

        const timer = setTimeout(setup, 3500);
        return () => clearTimeout(timer);

    }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps
}
