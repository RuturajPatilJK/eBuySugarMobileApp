import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const generalLedgerApi = createApi({
    reducerPath: 'generalLedgerApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL, credentials: 'include' }),
    tagTypes: ['GeneralLedger'],
    endpoints: (builder) => ({
        getGeneralLedger: builder.query({
            query: (params) => ({ url: '/general-ledger/', params }),
            providesTags: ['GeneralLedger'],
        }),
        getMyLedgerReport: builder.query({
            query: ({ Company_Code, from_date, to_date }) => ({
                url: '/general-ledger/report-account-wise',
                params: { Company_Code, from_date, to_date },
            }),
            providesTags: ['GeneralLedger'],
        }),
    }),
});

export const {
    useGetGeneralLedgerQuery,
    useGetMyLedgerReportQuery,
    useLazyGetMyLedgerReportQuery,
} = generalLedgerApi;
