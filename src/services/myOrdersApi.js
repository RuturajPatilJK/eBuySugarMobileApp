import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const myOrdersApi = createApi({
    reducerPath: 'myOrdersApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL, credentials: 'include' }),
    tagTypes: ['MyOrders'],
    endpoints: (builder) => ({
        getMyOrders: builder.query({
            query: (pendingOnly) => ({
                url: '/my-orders/',
                params: pendingOnly !== undefined ? { pending_only: pendingOnly } : {},
            }),
            providesTags: ['MyOrders'],
        }),
    }),
});

export const { useGetMyOrdersQuery } = myOrdersApi;
