import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const dispatchSummaryApi = createApi({
    reducerPath: 'dispatchSummaryApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL, credentials: 'include' }),
    tagTypes: ['DispatchSummary'],
    endpoints: (builder) => ({
        getDispatchSummary: builder.query({
            query: (params) => ({ url: '/dispatch/', params }),
            providesTags: ['DispatchSummary'],
        }),
    }),
});

export const { useGetDispatchSummaryQuery } = dispatchSummaryApi;
