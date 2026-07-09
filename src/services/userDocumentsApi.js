import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const userDocumentsApi = createApi({
    reducerPath: 'userDocumentsApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL, credentials: 'include' }),
    tagTypes: ['UserDocuments'],
    endpoints: (builder) => ({
        getUserDocuments: builder.query({
            query: () => '/documents/',
            providesTags: ['UserDocuments'],
        }),
        getMyDocuments: builder.query({
            query: (Company_Code) => ({
                url: '/user-documents/my-documents',
                params: { Company_Code },
            }),
            providesTags: ['UserDocuments'],
        }),
        uploadDocument: builder.mutation({
            query: (formData) => ({ url: '/documents/', method: 'POST', body: formData }),
            invalidatesTags: ['UserDocuments'],
        }),
        uploadMultipleDocuments: builder.mutation({
            query: ({ Company_Code, files }) => {
                const formData = new FormData();
                formData.append('Company_Code', Company_Code);
                Object.entries(files).forEach(([docType, file]) => {
                    if (file) formData.append(docType, file);
                });
                return { url: '/user-documents/upload-multiple', method: 'POST', body: formData };
            },
            invalidatesTags: ['UserDocuments'],
        }),
        deleteDocument: builder.mutation({
            query: (doc_id) => ({ url: `/user-documents/${doc_id}`, method: 'DELETE' }),
            invalidatesTags: ['UserDocuments'],
        }),
    }),
});

export const {
    useGetUserDocumentsQuery,
    useGetMyDocumentsQuery,
    useUploadDocumentMutation,
    useUploadMultipleDocumentsMutation,
    useDeleteDocumentMutation,
} = userDocumentsApi;
