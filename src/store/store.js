'use client';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import { listenerMiddleware } from './listenerMiddleware';
import createWebSocketMiddleware from './websocketMiddleware';

import { accountMasterApi }       from '../services/accountMasterApi';
import { availableOneBuysugarApi } from '../services/availableOneBuysugarApi';
import { tenderApi }              from '../services/tenderApi';
import { customerSaleBillsApi }   from '../services/customerSaleBillsApi';
import { generalLedgerApi }       from '../services/generalLedgerApi';
import { authApi }                from '../services/authApi';
import { dispatchSummaryApi }     from '../services/dispatchSummaryApi';
import { myesalesaudaApi }        from '../services/myesalesaudaApi';
import { userDocumentsApi }       from '../services/userDocumentsApi';
import { balancelimitApi }        from '../services/balancelimitApi';
import { myOrdersApi }            from '../services/myOrdersApi';
import { pendingDeliveryOrderApi } from '../services/pendingDeliveryOrderApi';
import { trackOrdersApi }         from '../services/trackOrdersApi';
import { grievanceApi }           from '../services/grievanceApi';
import { todaysSaleApi }          from '../services/todaysSaleApi';
import { analyticsApi }           from '../services/analyticsApi';
import { customerSaleBillPrintApi } from '../services/customerSaleBillPrintApi';
import { pushApi }                from '../services/pushApi';

const PRIMARY_WS_URL  = process.env.NEXT_PUBLIC_WS_URL        || 'ws://localhost:8000/ws';
const SOCKET_IO_URL   = process.env.NEXT_PUBLIC_SOCKET_IO_URL || 'http://localhost:8080';

export const store = configureStore({
    reducer: {
        [accountMasterApi.reducerPath]:       accountMasterApi.reducer,
        [availableOneBuysugarApi.reducerPath]: availableOneBuysugarApi.reducer,
        [tenderApi.reducerPath]:              tenderApi.reducer,
        [customerSaleBillsApi.reducerPath]:   customerSaleBillsApi.reducer,
        [generalLedgerApi.reducerPath]:       generalLedgerApi.reducer,
        [authApi.reducerPath]:                authApi.reducer,
        [dispatchSummaryApi.reducerPath]:     dispatchSummaryApi.reducer,
        [myesalesaudaApi.reducerPath]:        myesalesaudaApi.reducer,
        [userDocumentsApi.reducerPath]:       userDocumentsApi.reducer,
        [balancelimitApi.reducerPath]:        balancelimitApi.reducer,
        [myOrdersApi.reducerPath]:            myOrdersApi.reducer,
        [pendingDeliveryOrderApi.reducerPath]: pendingDeliveryOrderApi.reducer,
        [trackOrdersApi.reducerPath]:         trackOrdersApi.reducer,
        [grievanceApi.reducerPath]:           grievanceApi.reducer,
        [todaysSaleApi.reducerPath]:          todaysSaleApi.reducer,
        [analyticsApi.reducerPath]:           analyticsApi.reducer,
        [customerSaleBillPrintApi.reducerPath]: customerSaleBillPrintApi.reducer,
        [pushApi.reducerPath]:                pushApi.reducer,
        auth:                                 authReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .prepend(listenerMiddleware.middleware)
            .concat(createWebSocketMiddleware(PRIMARY_WS_URL, SOCKET_IO_URL))
            .concat(accountMasterApi.middleware)
            .concat(availableOneBuysugarApi.middleware)
            .concat(tenderApi.middleware)
            .concat(customerSaleBillsApi.middleware)
            .concat(generalLedgerApi.middleware)
            .concat(authApi.middleware)
            .concat(dispatchSummaryApi.middleware)
            .concat(myesalesaudaApi.middleware)
            .concat(userDocumentsApi.middleware)
            .concat(balancelimitApi.middleware)
            .concat(myOrdersApi.middleware)
            .concat(pendingDeliveryOrderApi.middleware)
            .concat(trackOrdersApi.middleware)
            .concat(grievanceApi.middleware)
            .concat(todaysSaleApi.middleware)
            .concat(analyticsApi.middleware)
            .concat(customerSaleBillPrintApi.middleware)
            .concat(pushApi.middleware),
});
