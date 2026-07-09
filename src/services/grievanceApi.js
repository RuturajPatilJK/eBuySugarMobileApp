import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const grievanceApi = createApi({
    reducerPath: 'grievanceApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL, credentials: 'include' }),
    tagTypes: ['Grievances'],
    endpoints: (builder) => ({

        submitComplaint: builder.mutation({
            query: (body) => ({ url: '/grievances/', method: 'POST', body }),
            invalidatesTags: ['Grievances'],
        }),

        getMyComplaints: builder.query({
            query: () => '/grievances/my',
            providesTags: ['Grievances'],
        }),

        getAllComplaints: builder.query({
            query: ({ status, category } = {}) => {
                const p = new URLSearchParams();
                if (status)   p.set('status', status);
                if (category) p.set('category', category);
                const qs = p.toString();
                return `/grievances/all${qs ? `?${qs}` : ''}`;
            },
            providesTags: ['Grievances'],
        }),

        updateComplaintStatus: builder.mutation({
            query: ({ grievance_id, ...body }) => ({
                url: `/grievances/${grievance_id}/status`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Grievances'],
        }),

        addReply: builder.mutation({
            query: ({ grievance_id, message, status }) => ({
                url: `/grievances/${grievance_id}/reply`,
                method: 'POST',
                body: { message, ...(status !== undefined ? { status } : {}) },
            }),
            invalidatesTags: ['Grievances'],
        }),

        markAllAsRead: builder.mutation({
            query: () => ({ url: '/grievances/mark-all-read', method: 'POST' }),
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                const flipAll = (draft) => {
                    if (Array.isArray(draft)) draft.forEach((c) => { c.is_unread = false; });
                };
                const p1 = dispatch(grievanceApi.util.updateQueryData('getMyComplaints', undefined, flipAll));
                const p2 = dispatch(grievanceApi.util.updateQueryData('getAllComplaints', {}, flipAll));
                try { await queryFulfilled; } catch { p1.undo(); p2.undo(); }
            },
        }),

        markAsRead: builder.mutation({
            query: (grievance_id) => ({ url: `/grievances/${grievance_id}/mark-read`, method: 'POST' }),
            async onQueryStarted(grievance_id, { dispatch, queryFulfilled }) {
                const flipUnread = (draft) => {
                    const item = Array.isArray(draft) ? draft.find((c) => c.grievance_id === grievance_id) : null;
                    if (item) item.is_unread = false;
                };
                const p1 = dispatch(grievanceApi.util.updateQueryData('getMyComplaints', undefined, flipUnread));
                const p2 = dispatch(grievanceApi.util.updateQueryData('getAllComplaints', {}, flipUnread));
                try { await queryFulfilled; } catch { p1.undo(); p2.undo(); }
            },
        }),
    }),
});

export const {
    useSubmitComplaintMutation,
    useGetMyComplaintsQuery,
    useGetAllComplaintsQuery,
    useUpdateComplaintStatusMutation,
    useAddReplyMutation,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
} = grievanceApi;
