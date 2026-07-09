import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const customerSaleBillsApi = createApi({
    reducerPath: 'customerSaleBillsApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL, credentials: 'include' }),
    tagTypes: ['SaleBills'],
    endpoints: (builder) => ({
        getCustomerSaleBills: builder.query({
            query: (params) => ({ url: '/customer-sale-bills/getallsalebillprint', params }),
            providesTags: ['SaleBills'],
        }),
    }),
});

export const { useGetCustomerSaleBillsQuery } = customerSaleBillsApi;
