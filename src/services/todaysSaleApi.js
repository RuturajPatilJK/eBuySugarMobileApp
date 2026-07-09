import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const todaysSaleApi = createApi({
    reducerPath: 'todaysSaleApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL, credentials: 'include' }),
    tagTypes: ['TodaysSale'],
    endpoints: (builder) => ({
        getTodaysSales: builder.query({
            query: (params) => ({ url: '/today-sales/', params }),
            providesTags: ['TodaysSale'],
        }),
    }),
});

export const { useGetTodaysSalesQuery } = todaysSaleApi;
