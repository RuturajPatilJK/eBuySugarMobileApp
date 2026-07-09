import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const analyticsApi = createApi({
    reducerPath: 'analyticsApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL, credentials: 'include' }),
    tagTypes: ['Analytics'],
    endpoints: (builder) => ({
        getDashboardAnalytics: builder.query({
            query: (params) => ({ url: '/analytics/dashboard', params }),
            providesTags: ['Analytics'],
        }),
    }),
});

export const { useGetDashboardAnalyticsQuery } = analyticsApi;
