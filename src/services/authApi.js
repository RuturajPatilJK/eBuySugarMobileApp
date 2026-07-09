import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL, credentials: 'include' }),
    tagTypes: ['Authentication'],
    endpoints: (builder) => ({

        getAccountMasterByMobileNumber: builder.query({
            query: (mobileNo) => ({ url: '/auth/getRecordByMobileNumber', params: { mobile_no: mobileNo } }),
            providesTags: (result, error, mobileNo) => [{ type: 'Authentication', id: `mobile-${mobileNo}` }],
        }),

        selectAccount: builder.mutation({
            query: (data) => ({ url: '/auth/select-account', method: 'POST', body: data }),
            invalidatesTags: ['Authentication'],
        }),

        verifyAndLogin: builder.mutation({
            query: (data) => ({ url: '/auth/verify-and-login', method: 'POST', body: data }),
            invalidatesTags: ['Authentication'],
        }),

        getMe: builder.query({
            query: () => '/auth/me',
            providesTags: ['Authentication'],
        }),

        logout: builder.mutation({
            query: () => ({ url: '/auth/logout', method: 'POST' }),
            invalidatesTags: ['Authentication'],
        }),

        sendOtp: builder.mutation({
            query: (data) => ({ url: '/auth/send-otp', method: 'POST', body: data }),
        }),

        verifyOtp: builder.mutation({
            query: (data) => ({ url: '/auth/verify-otp', method: 'POST', body: data }),
            invalidatesTags: ['Authentication'],
        }),

        resendOtp: builder.mutation({
            query: (data) => ({ url: '/auth/resend-otp', method: 'POST', body: data }),
        }),

        getCities: builder.query({
            query: () => '/auth/cities',
        }),

        getStates: builder.query({
            query: () => '/auth/states',
        }),

        register: builder.mutation({
            query: (data) => ({ url: '/auth/register', method: 'POST', body: data }),
            invalidatesTags: ['Authentication'],
        }),

        searchTaxpayer: builder.mutation({
            query: (data) => ({ url: '/auth/search-taxpayer', method: 'POST', body: data }),
        }),

        getCityByName: builder.query({
            query: (city_name_e) => ({ url: '/auth/get-citybyName', params: { city_name_e } }),
        }),

        createCity: builder.mutation({
            query: ({ company_code = parseInt(process.env.NEXT_PUBLIC_COMPANY_CODE) || 4, ...body }) => ({
                url: `/auth/create-city?company_code=${company_code}`,
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const {
    useGetAccountMasterByMobileNumberQuery,
    useLazyGetAccountMasterByMobileNumberQuery,
    useSelectAccountMutation,
    useVerifyAndLoginMutation,
    useGetMeQuery,
    useLogoutMutation,
    useSendOtpMutation,
    useVerifyOtpMutation,
    useResendOtpMutation,
    useGetCitiesQuery,
    useGetStatesQuery,
    useRegisterMutation,
    useSearchTaxpayerMutation,
    useLazyGetCityByNameQuery,
    useCreateCityMutation,
} = authApi;
