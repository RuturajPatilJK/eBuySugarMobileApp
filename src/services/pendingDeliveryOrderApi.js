import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const pendingDeliveryOrderApi = createApi({
    reducerPath: 'pendingDeliveryOrderApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL, credentials: 'include' }),
    tagTypes: ['PendingDeliveryOrder', 'MyPendingOrders', 'LiveBalance'],
    endpoints: (builder) => ({

        getLiveBalance: builder.query({
            query: (tenderdetailid) => `/delivery-orders/balance/${tenderdetailid}`,
            providesTags: (result, error, tenderdetailid) => [{ type: 'LiveBalance', id: tenderdetailid }],
        }),

        createPendingDeliveryOrder: builder.mutation({
            query: (orderData) => ({ url: '/delivery-orders/pending', method: 'POST', body: orderData }),
            invalidatesTags: ['PendingDeliveryOrder', 'MyPendingOrders'],
        }),

        getPendingDeliveryOrders: builder.query({
            query: (company_code) => ({ url: '/delivery-orders/pending', params: { company_code } }),
            providesTags: ['PendingDeliveryOrder'],
        }),

        getMyPendingOrders: builder.query({
            query: ({ company_code, from_date, to_date }) => ({
                url: '/delivery-orders/my-pending',
                params: { company_code, from_date, to_date },
            }),
            providesTags: ['MyPendingOrders'],
        }),

        updatePendingDeliveryOrder: builder.mutation({
            query: ({ pendingDoid, ...update }) => ({
                url: `/delivery-orders/pending/${pendingDoid}`,
                method: 'PUT',
                body: update,
            }),
            invalidatesTags: ['MyPendingOrders'],
        }),

        softDeletePendingDeliveryOrder: builder.mutation({
            query: (pendingDoid) => ({ url: `/delivery-orders/pending/${pendingDoid}`, method: 'DELETE' }),
            invalidatesTags: ['MyPendingOrders'],
        }),

        lockPendingDeliveryOrder: builder.mutation({
            query: (pendingDoid) => ({ url: `/delivery-orders/pending/${pendingDoid}/lock`, method: 'POST' }),
        }),

        unlockPendingDeliveryOrder: builder.mutation({
            query: (pendingDoid) => ({ url: `/delivery-orders/pending/${pendingDoid}/unlock`, method: 'POST' }),
        }),
    }),
});

export const {
    useGetLiveBalanceQuery,
    useCreatePendingDeliveryOrderMutation,
    useGetPendingDeliveryOrdersQuery,
    useGetMyPendingOrdersQuery,
    useUpdatePendingDeliveryOrderMutation,
    useSoftDeletePendingDeliveryOrderMutation,
    useLockPendingDeliveryOrderMutation,
    useUnlockPendingDeliveryOrderMutation,
} = pendingDeliveryOrderApi;
