'use client';
import { createListenerMiddleware } from '@reduxjs/toolkit';
import { wsMessageReceived } from './websocketMiddleware';
import { switchAccount, clearAuth } from './authSlice';

export const listenerMiddleware = createListenerMiddleware();

// These imports are done lazily to avoid circular deps at module parse time
// The actual API slices are imported in store.js; here we use dynamic dispatch

listenerMiddleware.startListening({
    actionCreator: wsMessageReceived,
    effect: async (action, listenerApi) => {
        const msg = action.payload;

        if (msg === 'refresh_tenders') {
            const { availableOneBuysugarApi } = await import('../services/availableOneBuysugarApi');
            const { tenderApi }               = await import('../services/tenderApi');
            const { myesalesaudaApi }         = await import('../services/myesalesaudaApi');
            const { myOrdersApi }             = await import('../services/myOrdersApi');
            listenerApi.dispatch(availableOneBuysugarApi.util.invalidateTags(['AvailableOneBuySugar']));
            listenerApi.dispatch(tenderApi.util.invalidateTags(['Tender']));
            listenerApi.dispatch(myesalesaudaApi.util.invalidateTags(['Myesalesauda']));
            listenerApi.dispatch(myOrdersApi.util.invalidateTags(['MyOrders']));
        }

        else if (msg === 'balance_limit_created') {
            const { balancelimitApi } = await import('../services/balancelimitApi');
            const { tenderApi }       = await import('../services/tenderApi');
            listenerApi.dispatch(balancelimitApi.util.invalidateTags(['BalanceLimit']));
            listenerApi.dispatch(tenderApi.util.invalidateTags(['Tender']));
        }

        else if (msg === 'refresh_delivery_orders') {
            const { pendingDeliveryOrderApi } = await import('../services/pendingDeliveryOrderApi');
            const { myOrdersApi }             = await import('../services/myOrdersApi');
            const { trackOrdersApi }          = await import('../services/trackOrdersApi');
            listenerApi.dispatch(pendingDeliveryOrderApi.util.invalidateTags(['PendingDeliveryOrder', 'MyPendingOrders', 'LiveBalance']));
            listenerApi.dispatch(myOrdersApi.util.invalidateTags(['MyOrders']));
            listenerApi.dispatch(trackOrdersApi.util.invalidateTags(['TrackOrders']));
        }

        else if (msg === 'refresh_grievances') {
            const { grievanceApi } = await import('../services/grievanceApi');
            listenerApi.dispatch(grievanceApi.util.invalidateTags(['Grievances']));
        }

        else if (msg === 'new_purchase') {
            const { todaysSaleApi } = await import('../services/todaysSaleApi');
            listenerApi.dispatch(todaysSaleApi.util.invalidateTags(['TodaysSale']));
        }
    },
});

const flushUserCaches = async (listenerApi) => {
    const { myOrdersApi }             = await import('../services/myOrdersApi');
    const { myesalesaudaApi }         = await import('../services/myesalesaudaApi');
    const { balancelimitApi }         = await import('../services/balancelimitApi');
    const { availableOneBuysugarApi } = await import('../services/availableOneBuysugarApi');
    const { tenderApi }               = await import('../services/tenderApi');
    const { grievanceApi }            = await import('../services/grievanceApi');
    const { todaysSaleApi }           = await import('../services/todaysSaleApi');
    const { pendingDeliveryOrderApi } = await import('../services/pendingDeliveryOrderApi');
    listenerApi.dispatch(myOrdersApi.util.resetApiState());
    listenerApi.dispatch(myesalesaudaApi.util.resetApiState());
    listenerApi.dispatch(balancelimitApi.util.resetApiState());
    listenerApi.dispatch(availableOneBuysugarApi.util.resetApiState());
    listenerApi.dispatch(tenderApi.util.resetApiState());
    listenerApi.dispatch(grievanceApi.util.resetApiState());
    listenerApi.dispatch(todaysSaleApi.util.resetApiState());
    listenerApi.dispatch(pendingDeliveryOrderApi.util.resetApiState());
};

listenerMiddleware.startListening({
    actionCreator: switchAccount,
    effect: async (_action, listenerApi) => { await flushUserCaches(listenerApi); },
});

listenerMiddleware.startListening({
    actionCreator: clearAuth,
    effect: async (_action, listenerApi) => { await flushUserCaches(listenerApi); },
});
