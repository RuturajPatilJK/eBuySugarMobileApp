import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const balancelimitApi = createApi({
    reducerPath: 'balancelimitApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL, credentials: 'include' }),
    tagTypes: ['BalanceLimit'],
    endpoints: (builder) => ({
        getBalanceLimits: builder.query({
            query: ({ Ac_Code, accoid }) => ({
                url: '/balance-limits/getall-balance-limits',
                params: { Ac_Code: String(Ac_Code), accoid },
            }),
            providesTags: ['BalanceLimit'],
        }),
        saveCustomerLimit: builder.mutation({
            query: (body) => ({
                url: '/balance-limits/save-customer-limit',
                method: 'POST',
                body: { ...body, Ac_Code: String(body.Ac_Code) },
            }),
            invalidatesTags: ['BalanceLimit'],
        }),
    }),
});

export const {
    useGetBalanceLimitsQuery,
    useLazyGetBalanceLimitsQuery,
    useSaveCustomerLimitMutation,
} = balancelimitApi;
