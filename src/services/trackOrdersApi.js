import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const trackOrdersApi = createApi({
    reducerPath: 'trackOrdersApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL, credentials: 'include' }),
    tagTypes: ['TrackOrders'],
    endpoints: (builder) => ({
        getTrackOrders: builder.query({
            query: ({ fromDate, toDate } = {}) => {
                const params = new URLSearchParams();
                if (fromDate) params.set('from_date', fromDate);
                if (toDate)   params.set('to_date', toDate);
                return `/delivery-orders/track?${params.toString()}`;
            },
            providesTags: ['TrackOrders'],
        }),
    }),
});

export const { useGetTrackOrdersQuery } = trackOrdersApi;
