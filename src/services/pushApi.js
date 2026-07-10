import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const pushApi = createApi({
    reducerPath: 'pushApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL, credentials: 'include' }),
    endpoints: (builder) => ({

        getVapidKey: builder.query({
            query: () => '/push/vapid-key',
        }),

        subscribeToPush: builder.mutation({
            query: (body) => ({ url: '/push/subscribe', method: 'POST', body }),
        }),

        unsubscribeFromPush: builder.mutation({
            query: (body) => ({ url: '/push/unsubscribe', method: 'POST', body }),
        }),
    }),
});

export const {
    useGetVapidKeyQuery,
    useSubscribeToPushMutation,
    useUnsubscribeFromPushMutation,
} = pushApi;
