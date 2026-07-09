'use client';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useGetMeQuery, useLazyGetAccountMasterByMobileNumberQuery } from '../../services/authApi';
import { rehydrateAuth, setInitialized } from '../../store/authSlice';

export default function AppInitializer({ children }) {
    const dispatch = useDispatch();
    const [isReady, setIsReady] = useState(false);

    const { data: meData, isSuccess: meSuccess, isError: meError, isLoading: meLoading } = useGetMeQuery();
    const [fetchAccounts] = useLazyGetAccountMasterByMobileNumberQuery();

    useEffect(() => {
        if (meLoading) return;

        if (meError) {
            dispatch(setInitialized());
            setIsReady(true);
            return;
        }

        if (meSuccess && meData) {
            const mobile = meData.mobile_no || meData.mobile;
            const currentAccoid = meData.current_accoid || meData.accoid || meData.Accoid || null;

            if (!mobile) {
                dispatch(setInitialized());
                setIsReady(true);
                return;
            }

            fetchAccounts(mobile)
                .then(({ data: accountsData }) => {
                    const accounts = accountsData?.accounts || accountsData || [];
                    dispatch(rehydrateAuth({
                        mobile,
                        accounts: Array.isArray(accounts) ? accounts : [],
                        currentAccoid,
                    }));
                })
                .catch(() => {
                    dispatch(rehydrateAuth({ mobile, accounts: [], currentAccoid }));
                })
                .finally(() => setIsReady(true));
        }
    }, [meSuccess, meError, meLoading, meData, dispatch, fetchAccounts]);

    if (meLoading || !isReady) {
        return (
            <div style={{
                minHeight: '100vh', width: '100%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', background: 'white',
                flexDirection: 'column', gap: 16,
            }}>
                <div style={{
                    width: 44, height: 44, border: '4px solid #ef3837',
                    borderTopColor: 'transparent', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ color: '#6b7280', fontSize: 14, fontWeight: 600 }}>Loading eBuySugar...</p>
            </div>
        );
    }

    return children;
}
