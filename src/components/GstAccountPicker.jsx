'use client';
import { useState, useMemo } from 'react';
import { useLazyGetAccountsByGstQuery, useCreateAccountMasterMutation } from '../services/accountMasterApi';
import { useSearchTaxpayerMutation, useLazyGetCityByNameQuery, useCreateCityMutation, useGetStatesQuery } from '../services/authApi';

const COMPANY_CODE = parseInt(process.env.NEXT_PUBLIC_COMPANY_CODE) || 4;

const inpBase = {
    flex: 1, padding: '10px 12px', background: '#f9fafb',
    border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13,
    fontWeight: 700, color: '#111827', outline: 'none',
    fontFamily: 'Signika, sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em',
};

export default function GstAccountPicker({ selected, onSelect, yearCode }) {
    const [gstInput, setGstInput] = useState(selected?.Gst_No || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [candidates, setCandidates] = useState([]);

    const { data: statesData } = useGetStatesQuery();
    const stateMap = useMemo(() => {
        if (!statesData) return {};
        return Object.fromEntries(statesData.map(s => [s.State_Code, s.State_Name]));
    }, [statesData]);
    const getStateName = (code) => stateMap[parseInt(code)] || (code ? `State ${code}` : '—');

    const [triggerByGst] = useLazyGetAccountsByGstQuery();
    const [searchTaxpayer] = useSearchTaxpayerMutation();
    const [createAccount] = useCreateAccountMasterMutation();
    const [triggerGetCity] = useLazyGetCityByNameQuery();
    const [createCity] = useCreateCityMutation();

    const reset = () => { setCandidates([]); setError(''); setInfo(''); };

    const handleSearch = async () => {
        const gst = gstInput.trim().toUpperCase();
        if (!gst || gst.length < 15) { setError('Enter a valid 15-digit GST number.'); return; }
        setLoading(true); setError(''); setInfo(''); setCandidates([]);

        try {
            const acResult = await triggerByGst({ gst_no: gst, company_code: COMPANY_CODE }).unwrap();

            if (acResult?.length > 0) {
                if (acResult.length === 1) {
                    onSelect({ ...acResult[0], Gst_No: gst });
                } else {
                    setCandidates(acResult);
                }
                return;
            }

            setInfo('Not in account master — checking GST portal…');
            let portalData = null;
            try {
                const res = await searchTaxpayer({ gstNo: gst }).unwrap();
                if (res?.Status === '1' && res?.lstAppSCommonSearchTPResponse?.length) {
                    portalData = res.lstAppSCommonSearchTPResponse[0];
                }
            } catch { /* portal offline */ }

            if (!portalData) {
                setError('GST number not found in account master or GST portal.');
                setInfo('');
                return;
            }

            const addr = portalData.pradr?.addr || {};
            const addrStr = [addr.bno, addr.bnm, addr.flno, addr.st, addr.loc, addr.dst, addr.stcd, addr.pncd]
                .filter(Boolean).join(', ').trim();
            const companyPan   = (portalData.RequestedGSTIN || gst).substring(2, 12);
            const gstStateCode = parseInt((portalData.RequestedGSTIN || gst).substring(0, 2), 10) || null;
            const pincode = addr.pncd || '';
            const cityName = addr.loc || '';

            let cityCode = null, cityId = null;
            if (cityName) {
                try {
                    const cd = await triggerGetCity(cityName).unwrap();
                    cityCode = cd?.city_code ?? null;
                    cityId   = cd?.cityid    ?? null;
                } catch {
                    try {
                        const cc = await createCity({ city_name_e: cityName, pincode, GstStateCode: gstStateCode, company_code: COMPANY_CODE }).unwrap();
                        cityCode = cc.city?.city_code ?? null;
                        cityId   = cc.city?.cityid    ?? null;
                    } catch { /* leave blank */ }
                }
            }

            setInfo('Creating account from GST portal data…');
            const created = await createAccount({
                Ac_Name_E:    portalData.tradeNam || portalData.lgnm || 'Unknown',
                Gst_No:       gst,
                CompanyPan:   companyPan,
                Address_E:    addrStr,
                GSTStateCode: gstStateCode,
                Pincode:      pincode,
                City_Code:    cityCode,
                cityid:       cityId,
                Group_Code:   10,
                Ac_type:      'P',
                company_code: COMPANY_CODE,
            }).unwrap();

            onSelect({
                accoid:       created.accoid       ?? null,
                Ac_Code:      created.Ac_Code      ?? null,
                Ac_Name_E:    created.Ac_Name_E    ?? null,
                Gst_No:       created.Gst_No       ?? gst,
                CompanyPan:   created.CompanyPan   ?? companyPan,
                Address_E:    created.Address_E    ?? addrStr,
                GSTStateCode: created.GSTStateCode ?? gstStateCode,
            });
            setInfo('');
        } catch (err) {
            const detail = err?.data?.detail;
            const msg = Array.isArray(detail)
                ? detail.map(d => d.msg).join('; ')
                : typeof detail === 'string' ? detail : 'Search failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = () => { onSelect(null); reset(); setGstInput(''); };
    const pickCandidate = (ac) => { onSelect(ac); setCandidates([]); };

    return (
        <div>
            <style>{`@keyframes gst-spin { to { transform: rotate(360deg); } }`}</style>

            {/* GST input + Fetch/Change button */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <input
                    placeholder="e.g. 27AABCU9355J1Z0"
                    value={selected ? (selected.Gst_No || gstInput) : gstInput}
                    onChange={e => { if (!selected) { setGstInput(e.target.value.toUpperCase()); reset(); } }}
                    onKeyDown={e => !selected && e.key === 'Enter' && handleSearch()}
                    maxLength={15}
                    disabled={loading || !!selected}
                    style={{ ...inpBase, opacity: (loading || !!selected) ? 0.6 : 1, cursor: !!selected ? 'not-allowed' : 'text' }}
                />
                {!selected ? (
                    <button onClick={handleSearch} disabled={loading || gstInput.trim().length < 15}
                        style={{ padding: '10px 14px', background: (loading || gstInput.trim().length < 15) ? '#c4b5fd' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 800, color: 'white', cursor: (loading || gstInput.trim().length < 15) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                        {loading
                            ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'gst-spin 0.7s linear infinite' }} />…</>
                            : 'Fetch'}
                    </button>
                ) : (
                    <button onClick={handleChange}
                        style={{ padding: '10px 12px', background: '#f3f4f6', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        Change
                    </button>
                )}
            </div>

            {/* Selected — verified badge + detail rows */}
            {selected && (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 8, marginBottom: 10, fontSize: 12, fontWeight: 700, color: '#15803d' }}>
                        ✓ GST details verified
                        {selected.Ac_Code && <span style={{ marginLeft: 4, fontSize: 10, color: '#6b7280', fontWeight: 500 }}>· Ac# {selected.Ac_Code}</span>}
                    </div>
                    <div style={{ background: 'white', borderRadius: 8, padding: '10px 12px', border: '1px solid #e0e7ff', display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {[
                            { label: 'Name',    value: selected.Ac_Name_E },
                            { label: 'GST No',  value: selected.Gst_No },
                            { label: 'City',    value: selected.cityname },
                            { label: 'State',   value: selected.State_Name || getStateName(selected.GSTStateCode) },
                            { label: 'Address', value: selected.Address_E },
                        ].filter(f => f.value).map(({ label, value }) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', flexShrink: 0, paddingTop: 1 }}>{label}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Error / Info messages */}
            {!selected && error && (
                <div style={{ padding: '8px 10px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#dc2626', marginTop: 4 }}>
                    ✕ {error}
                </div>
            )}
            {!selected && info && !error && (
                <div style={{ padding: '8px 10px', background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#92400e', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 11, height: 11, border: '2px solid rgba(146,64,14,0.25)', borderTopColor: '#92400e', borderRadius: '50%', flexShrink: 0, animation: 'gst-spin 0.7s linear infinite' }} />
                    {info}
                </div>
            )}
            {!selected && !error && !info && !loading && candidates.length === 0 && (
                <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, marginTop: 4, marginBottom: 0 }}>Enter 15-digit GST and tap Fetch</p>
            )}

            {/* Multiple accounts picker */}
            {!selected && candidates.length > 1 && (
                <div style={{ marginTop: 10, border: '1.5px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ padding: '7px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {candidates.length} matching accounts — select one
                    </div>
                    {candidates.map(ac => (
                        <div key={ac.accoid ?? ac.Ac_Code} onClick={() => pickCandidate(ac)}
                            style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{ac.Ac_Name_E || '—'}</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {ac.Gst_No && <span style={{ fontSize: 10, fontWeight: 600, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '1px 6px', borderRadius: 4 }}>{ac.Gst_No}</span>}
                                {ac.GSTStateCode != null && <span style={{ fontSize: 10, fontWeight: 600, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '1px 6px', borderRadius: 4 }}>{getStateName(ac.GSTStateCode)}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
