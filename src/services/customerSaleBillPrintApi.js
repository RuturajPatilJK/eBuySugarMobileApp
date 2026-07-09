import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const customerSaleBillPrintApi = createApi({
    reducerPath: 'customerSaleBillPrintApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL, credentials: 'include' }),
    endpoints: (builder) => ({
        getSaleBillDetail: builder.query({
            query: (saleid) => `/customer-sale-bills/get-sale-bill-detail/${saleid}`,
        }),
    }),
});

export const { useGetSaleBillDetailQuery, useLazyGetSaleBillDetailQuery } = customerSaleBillPrintApi;
