'use client';
import { createAction } from '@reduxjs/toolkit';

export const wsMessageReceived = createAction('ws/messageReceived');

const createWebSocketMiddleware = (wsUrl, socketIoUrl = null) => {
    return (store) => {
        // SSR guard — no WebSocket on server
        if (typeof window === 'undefined') {
            return (next) => (action) => next(action);
        }

        let ws = null;
        let socketIo = null;
        let SocketIO = null;

        // Lazy-load socket.io-client to avoid SSR issues
        const loadSocketIo = async () => {
            if (!socketIoUrl) return;
            try {
                const { io } = await import('socket.io-client');
                SocketIO = io;
                connectSocketIo();
            } catch (e) {
                console.error('socket.io-client load error:', e);
            }
        };

        const connectWebSocket = () => {
            try {
                ws = new WebSocket(wsUrl);

                ws.onopen = () => {
                    console.log('Primary WebSocket connected to:', wsUrl);
                };

                ws.onmessage = (event) => {
                    const msg = String(event.data);
                    store.dispatch(wsMessageReceived(msg));
                };

                ws.onclose = () => {
                    console.log('Primary WebSocket disconnected. Reconnecting in 5s...');
                    setTimeout(connectWebSocket, 5000);
                };

                ws.onerror = (error) => {
                    console.error('Primary WebSocket error:', error);
                    ws.close();
                };
            } catch (e) {
                console.error('WebSocket connection error:', e);
                setTimeout(connectWebSocket, 5000);
            }
        };

        const connectSocketIo = () => {
            if (!SocketIO || !socketIoUrl) return;

            socketIo = SocketIO(socketIoUrl, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
            });

            socketIo.on('connect', () => {
                console.log('Socket.io connected to:', socketIoUrl);
            });

            socketIo.on('tender_added',          () => store.dispatch(wsMessageReceived('refresh_tenders')));
            socketIo.on('tender_updated',         () => store.dispatch(wsMessageReceived('refresh_tenders')));
            socketIo.on('tender_deleted',         () => store.dispatch(wsMessageReceived('refresh_tenders')));
            socketIo.on('balance_limit_created',  () => store.dispatch(wsMessageReceived('refresh_tenders')));

            const dispatchDeliveryRefresh = () => {
                store.dispatch(wsMessageReceived('refresh_delivery_orders'));
            };
            socketIo.on('delivery_order_added',   dispatchDeliveryRefresh);
            socketIo.on('delivery_order_updated', dispatchDeliveryRefresh);
            socketIo.on('delivery_order_deleted', dispatchDeliveryRefresh);

            socketIo.on('refresh_data', (data) => {
                store.dispatch(wsMessageReceived(data?.event || 'refresh_tenders'));
            });

            socketIo.on('disconnect', (reason) => {
                console.log('Socket.io disconnected:', reason);
                if (reason === 'io server disconnect') socketIo.connect();
            });

            socketIo.on('connect_error', (error) => {
                console.error('Socket.io connection error:', error);
            });
        };

        // Initialize connections
        connectWebSocket();
        loadSocketIo();

        return (next) => (action) => {
            if (action.type === 'ws/sendMessage' && ws?.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(action.payload));
            }
            if (action.type === 'socketio/sendMessage' && socketIo?.connected) {
                socketIo.emit(action.payload.event, action.payload.data);
            }
            return next(action);
        };
    };
};

export default createWebSocketMiddleware;
