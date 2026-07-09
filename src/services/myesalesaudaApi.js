import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const myesalesaudaApi = createApi({
    reducerPath: 'myesalesaudaApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL, credentials: 'include' }),
    tagTypes: ['Myesalesauda'],
    endpoints: (builder) => ({
        getMyesalesauda: builder.query({
            query: ({ dateFrom, dateTo } = {}) => {
                const params = new URLSearchParams();
                if (dateFrom) params.append('date_from', dateFrom);
                if (dateTo)   params.append('date_to',   dateTo);
                const qs = params.toString();
                return `/myesaleSauda${qs ? '?' + qs : ''}`;
            },
            providesTags: ['Myesalesauda'],
        }),
    }),
});

export const { useGetMyesalesaudaQuery } = myesalesaudaApi;
