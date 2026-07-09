import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const tenderApi = createApi({
    reducerPath: 'tenderApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_BASE_URL,
        credentials: 'include',
        prepareHeaders: (headers) => { headers.set('Content-Type', 'application/json'); return headers; },
    }),
    tagTypes: ['Tender'],
    endpoints: (builder) => ({

        getMaxTenderNo: builder.query({
            query: (company_code) => `/tenders/max-tender-no?company_code=${company_code}`,
            providesTags: ['Tender'],
        }),

        createTender: builder.mutation({
            query: (tenderData) => ({ url: '/tenders', method: 'POST', body: tenderData }),
            invalidatesTags: ['Tender'],
        }),

        updateTender: builder.mutation({
            query: ({ id, ...tenderData }) => ({ url: `/tenders/${id}`, method: 'PUT', body: tenderData }),
            invalidatesTags: ['Tender'],
        }),

        deleteTender: builder.mutation({
            query: ({ tenderId, tenderdetailid }) => ({
                url: `/tenders/${tenderId}`,
                method: 'DELETE',
                params: { tenderdetailid },
            }),
            invalidatesTags: ['Tender'],
        }),

        updateTenderRatesAndQuantal: builder.mutation({
            query: ({ id, ...payload }) => ({ url: `/tenders/update-myesalesauda/${id}`, method: 'PUT', body: payload }),
            invalidatesTags: ['Tender'],
        }),

        getMyBalance: builder.query({
            query: () => '/tenders/my-balance',
            providesTags: ['Tender'],
        }),

        fifoPurchase: builder.mutation({
            query: (purchasePayload) => ({ url: 'tenders/buy-purchase', method: 'POST', body: purchasePayload }),
            invalidatesTags: ['Tender'],
        }),

        updateTenderDetailTradingFlag: builder.mutation({
            query: ({ tenderdetailid, stop_resume_trading }) => ({
                url: `/tenders/tender-detail/${tenderdetailid}/trading-flag`,
                method: 'PUT',
                body: { stop_resume_trading },
            }),
            invalidatesTags: ['Tender'],
        }),

        bulkUpdateTradingFlag: builder.mutation({
            query: ({ stop_resume_trading, company_code }) => ({
                url: `/tenders/trading-flag/bulk`,
                method: 'PUT',
                body: { stop_resume_trading, company_code },
            }),
            invalidatesTags: ['Tender'],
        }),
    }),
});

export const {
    useGetMaxTenderNoQuery,
    useGetMyBalanceQuery,
    useCreateTenderMutation,
    useFifoPurchaseMutation,
    useUpdateTenderMutation,
    useDeleteTenderMutation,
    useUpdateTenderRatesAndQuantalMutation,
    useUpdateTenderDetailTradingFlagMutation,
    useBulkUpdateTradingFlagMutation,
} = tenderApi;
