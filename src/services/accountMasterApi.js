import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const COMPANY_CODE = parseInt(process.env.NEXT_PUBLIC_COMPANY_CODE) || 4;

export const accountMasterApi = createApi({
    reducerPath: 'accountMasterApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL, credentials: 'include' }),
    tagTypes: ['AccountMaster', 'AccountContact'],
    endpoints: (builder) => ({

        getAccountMaster: builder.query({
            query: (params) => ({ url: '/accounts/', params }),
            providesTags: ['AccountMaster'],
        }),

        getSystemMasterHelp: builder.query({
            query: ({ SystemType, CompanyCode }) =>
                `/account-masters/system_master_help?SystemType=${SystemType}&CompanyCode=${CompanyCode}`,
            providesTags: ['AccountMaster'],
        }),

        getAccountMastersLimited: builder.query({
            query: () => '/account-masters/help-list',
            providesTags: ['AccountMaster'],
        }),

        getMyAccount: builder.query({
            query: (Company_Code = COMPANY_CODE) => ({
                url: '/account-masters/me',
                params: { Company_Code },
            }),
            providesTags: ['AccountMaster'],
        }),

        updateAccountMaster: builder.mutation({
            query: ({ accoid, ...accountData }) => ({
                url: `/account-masters/${accoid}`,
                method: 'PUT',
                body: accountData,
            }),
            invalidatesTags: ['AccountMaster'],
        }),

        getMyContacts: builder.query({
            query: () => '/account-masters/contacts/my',
            providesTags: ['AccountContact'],
        }),

        createContact: builder.mutation({
            query: (data) => ({ url: '/account-masters/contacts', method: 'POST', body: data }),
            invalidatesTags: ['AccountContact'],
        }),

        updateContact: builder.mutation({
            query: ({ id, ...data }) => ({ url: `/account-masters/contacts/${id}`, method: 'PUT', body: data }),
            invalidatesTags: ['AccountContact'],
        }),

        deleteContact: builder.mutation({
            query: (id) => ({ url: `/account-masters/contacts/${id}`, method: 'DELETE' }),
            invalidatesTags: ['AccountContact'],
        }),

        getMyAccountAddress: builder.query({
            query: (Company_Code = COMPANY_CODE) => ({
                url: '/account-masters/my-address',
                params: { Company_Code },
            }),
            providesTags: ['AccountMaster'],
        }),

        getAccountsByGst: builder.query({
            query: ({ gst_no, company_code = COMPANY_CODE }) => ({
                url: '/account-masters/by-gst',
                params: { gst_no, company_code },
            }),
        }),

        createAccountMaster: builder.mutation({
            query: (data) => ({ url: '/account-masters/', method: 'POST', body: data }),
            invalidatesTags: ['AccountMaster'],
        }),

        getAccountLedgerBalance: builder.query({
            query: ({ ac_code, company_code = COMPANY_CODE, year_code }) => ({
                url: '/account-masters/ledger-balance',
                params: { ac_code, company_code, ...(year_code != null ? { year_code } : {}) },
            }),
        }),
    }),
});

export const {
    useGetAccountMasterQuery,
    useGetSystemMasterHelpQuery,
    useGetAccountMastersLimitedQuery,
    useGetMyAccountQuery,
    useUpdateAccountMasterMutation,
    useGetMyContactsQuery,
    useCreateContactMutation,
    useUpdateContactMutation,
    useDeleteContactMutation,
    useGetMyAccountAddressQuery,
    useLazyGetMyAccountAddressQuery,
    useLazyGetAccountsByGstQuery,
    useCreateAccountMasterMutation,
    useLazyGetAccountLedgerBalanceQuery,
} = accountMasterApi;
