import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const availableOneBuysugarApi = createApi({
    reducerPath: 'availableOneBuysugarApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL, credentials: 'include' }),
    tagTypes: ['AvailableOneBuySugar'],
    endpoints: (builder) => ({

        getAvailableSugarTenders: builder.query({
            query: () => '/available-ebuy-sugar/',
            providesTags: ['AvailableOneBuySugar'],
        }),

        expireSaudaNow: builder.mutation({
            query: (tenderdetailid) => ({
                url: `/tenders/tender-detail/${tenderdetailid}/expire-now`,
                method: 'PUT',
            }),
            invalidatesTags: ['AvailableOneBuySugar'],
        }),
    }),
});

export const {
    useGetAvailableSugarTendersQuery,
    useExpireSaudaNowMutation,
} = availableOneBuysugarApi;
