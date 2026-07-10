/* eBuySugar Service Worker — handles Web Push notifications */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

/* ── Push received (even when app tab is closed) ── */
self.addEventListener('push', (event) => {
    let data = {
        title: 'eBuySugar',
        body:  'You have a new update.',
        url:   '/grievances',
        tag:   'ebuysugar',
    };

    try {
        if (event.data) {
            Object.assign(data, event.data.json());
        }
    } catch {}

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body:             data.body,
            icon:             '/eBuySugarlogo.jpg',
            badge:            '/eBuySugarlogo.jpg',
            tag:              data.tag,
            renotify:         true,
            requireInteraction: false,
            vibrate:          [150, 80, 150],
            data:             { url: data.url },
        })
    );
});

/* ── Notification clicked — open/focus the app ── */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || '/grievances';

    event.waitUntil(
        self.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                /* If app window already open, focus + navigate it */
                for (const client of clientList) {
                    if ('focus' in client) {
                        client.focus();
                        if ('navigate' in client) client.navigate(targetUrl);
                        return;
                    }
                }
                /* Otherwise open a new window */
                return self.clients.openWindow(targetUrl);
            })
    );
});
