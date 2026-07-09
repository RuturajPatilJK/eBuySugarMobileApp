'use client';
import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        mobile: null,
        accounts: [],
        currentAccoid: null,
        isInitialized: false,
        pendingMobile: null,
        pendingAccounts: [],
    },
    reducers: {
        setPendingLogin: (state, action) => {
            state.pendingMobile = action.payload.mobile;
            state.pendingAccounts = action.payload.accounts || [];
        },
        clearPendingLogin: (state) => {
            state.pendingMobile = null;
            state.pendingAccounts = [];
        },
        setAuthData: (state, action) => {
            state.mobile = action.payload.mobile;
            state.accounts = action.payload.accounts;
            state.currentAccoid = action.payload.currentAccoid;
            state.isInitialized = true;
            state.pendingMobile = null;
            state.pendingAccounts = [];
        },
        switchAccount: (state, action) => {
            state.currentAccoid = action.payload;
        },
        rehydrateAuth: (state, action) => {
            state.mobile = action.payload.mobile;
            state.currentAccoid = action.payload.currentAccoid;
            state.isInitialized = true;
            if (!state.accounts || state.accounts.length === 0) {
                state.accounts = action.payload.accounts || [];
            }
        },
        setInitialized: (state) => {
            state.isInitialized = true;
        },
        clearAuth: (state) => {
            state.mobile = null;
            state.accounts = [];
            state.currentAccoid = null;
            state.isInitialized = true;
            state.pendingMobile = null;
            state.pendingAccounts = [];
        },
    },
});

export const { setPendingLogin, clearPendingLogin, setAuthData, switchAccount, rehydrateAuth, setInitialized, clearAuth } = authSlice.actions;
export default authSlice.reducer;
