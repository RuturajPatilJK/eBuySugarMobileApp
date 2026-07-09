'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';
import { useGetMeQuery } from '../../services/authApi';
import {
    useGetMyAccountQuery,
    useUpdateAccountMasterMutation,
    useGetMyContactsQuery,
    useCreateContactMutation,
    useUpdateContactMutation,
    useDeleteContactMutation,
} from '../../services/accountMasterApi';
import {
    useGetMyDocumentsQuery,
    useUploadMultipleDocumentsMutation,
    useDeleteDocumentMutation,
} from '../../services/userDocumentsApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const COMPANY_CODE = parseInt(process.env.NEXT_PUBLIC_COMPANY_CODE) || 4;

const STEPS = [
    { id: 'personal', label: 'Personal', Icon: PersonIcon },
    { id: 'company',  label: 'Company',  Icon: BuildingIcon },
    { id: 'banking',  label: 'Banking',  Icon: BankIcon },
    { id: 'contacts', label: 'Contacts', Icon: UsersIcon },
    { id: 'docs',     label: 'Documents', Icon: FilesIcon },
];

const DOC_LIST = [
    { key: 'gst',              label: 'GST Certificate',      color: '#7c3aed' },
    { key: 'fssai',            label: 'FSSAI License',        color: '#0891b2' },
    { key: 'tin',              label: 'TIN Certificate',      color: '#059669' },
    { key: 'pan',              label: 'PAN Card',             color: '#d97706' },
    { key: 'adhar',            label: 'Aadhaar Card',         color: '#dc2626' },
    { key: 'excise',           label: 'Excise License',       color: '#7c3aed' },
    { key: 'moa',              label: 'Memorandum of Assoc.', color: '#0284c7' },
    { key: 'aoa',              label: 'Articles of Assoc.',   color: '#0284c7' },
    { key: 'incorp',           label: 'Incorporation Cert.',  color: '#059669' },
    { key: 'electricity_bill', label: 'Electricity Bill',     color: '#d97706' },
    { key: 'board_resolution', label: 'Board Resolution',     color: '#374151' },
];

const BLANK_CONTACT = { Person_Name: '', Person_Mobile: '', Person_Email: '', Person_Pan: '', Other: '' };

/* ── SVG Icons ─────────────────────────────────────────────────────── */
function PersonIcon({ size = 20, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
    );
}
function BuildingIcon({ size = 20, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21V7l9-4 9 4v14H3z" />
            <path d="M9 21V12h6v9" />
            <rect x="9" y="7" width="2" height="3" /><rect x="13" y="7" width="2" height="3" />
        </svg>
    );
}
function BankIcon({ size = 20, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="3" />
            <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
    );
}
function UsersIcon({ size = 20, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="8" r="3" />
            <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
            <circle cx="18" cy="8" r="2.5" />
            <path d="M22 20c0-2.8-2.2-5-4.5-5" />
        </svg>
    );
}
function FilesIcon({ size = 20, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="12" y2="17" />
        </svg>
    );
}
function CameraIcon({ size = 18, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    );
}
function CheckIcon({ size = 14, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}
function PlusIcon({ size = 16, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}
function EditIcon({ size = 14, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );
}
function TrashIcon({ size = 14, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
        </svg>
    );
}
function EyeIcon({ size = 14, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}
function UploadIcon({ size = 16, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 16 12 12 8 16" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        </svg>
    );
}
function SaveIcon({ size = 17, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
        </svg>
    );
}
function DownloadIcon({ size = 14, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="8 17 12 21 16 17" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
        </svg>
    );
}
function PhoneIcon({ size = 14, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
    );
}
function MailIcon({ size = 14, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
        </svg>
    );
}
/* ── End Icons ──────────────────────────────────────────────────────── */

function Spinner({ size = 18, color = 'rgba(255,255,255,0.9)' }) {
    return (
        <div style={{ width: size, height: size, border: `2px solid rgba(255,255,255,0.2)`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.65s linear infinite', flexShrink: 0 }} />
    );
}

function Field({ label, value, onChange, placeholder, type = 'text', readOnly, required, icon }) {
    const [focused, setFocused] = useState(false);
    return (
        <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                {icon && <span style={{ color: focused ? '#ef3837' : '#9ca3af', transition: 'color 0.2s' }}>{icon}</span>}
                {label}{required && <span style={{ color: '#ef3837' }}> *</span>}
            </label>
            <input
                type={type} value={value || ''} onChange={e => onChange?.(e.target.value)}
                placeholder={placeholder} readOnly={readOnly}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                style={{
                    width: '100%', padding: '12px 14px', boxSizing: 'border-box',
                    background: readOnly ? '#f9fafb' : 'white',
                    border: `1.5px solid ${focused && !readOnly ? '#ef3837' : '#e5e7eb'}`,
                    borderRadius: 12, fontSize: 14, fontWeight: 600,
                    color: readOnly ? '#9ca3af' : '#111827',
                    outline: 'none', fontFamily: 'inherit',
                    cursor: readOnly ? 'not-allowed' : 'text',
                    transition: 'border-color 0.18s, box-shadow 0.18s',
                    boxShadow: focused && !readOnly ? '0 0 0 3px rgba(239,56,55,0.07)' : 'none',
                }}
            />
        </div>
    );
}

function SectionLabel({ children }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 4 }}>
            <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: '#d1d5db', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{children}</span>
            <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
        </div>
    );
}

function SkeletonFields({ count = 4 }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i}>
                    <div style={{ height: 10, width: 70, borderRadius: 6, marginBottom: 8, background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaec 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                    <div style={{ height: 46, borderRadius: 12, background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaec 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                </div>
            ))}
        </div>
    );
}

export default function EditProfilePage() {
    const { data: user } = useGetMeQuery();
    const { data: accountData, isLoading: acLoading } = useGetMyAccountQuery(COMPANY_CODE, { skip: !user });
    const { data: docsRes } = useGetMyDocumentsQuery(COMPANY_CODE, { skip: !user });
    const { data: contactsRes } = useGetMyContactsQuery(undefined, { skip: !user });

    const [updateAccount, { isLoading: isSavingAccount }] = useUpdateAccountMasterMutation();
    const [uploadMultipleDocs, { isLoading: isUploadingDocs }] = useUploadMultipleDocumentsMutation();
    const [deleteDocument, { isLoading: isDeletingDoc }] = useDeleteDocumentMutation();
    const [createContact, { isLoading: isCreatingContact }] = useCreateContactMutation();
    const [updateContact, { isLoading: isUpdatingContact }] = useUpdateContactMutation();
    const [deleteContact, { isLoading: isDeletingContact }] = useDeleteContactMutation();

    const [activeStep, setActiveStep]   = useState('personal');
    const [completed, setCompleted]     = useState(new Set());
    const [form, setForm]               = useState({});
    const [localFiles, setLocalFiles]   = useState({});
    const [photoPreview, setPhotoPreview] = useState(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [contactForm, setContactForm] = useState(BLANK_CONTACT);
    const [confirmDeleteDoc, setConfirmDeleteDoc]         = useState(null);
    const [confirmDeleteContact, setConfirmDeleteContact] = useState(null);
    const [previewDoc, setPreviewDoc]   = useState(null);
    const [toast, setToast]             = useState({ show: false, message: '', type: 'success' });
    const photoRef = useRef(null);
    const docRefs  = useRef({});

    useEffect(() => {
        if (accountData) {
            setForm({
                Ac_Name_E:       accountData.Ac_Name_E       || '',
                Ac_Name_R:       accountData.Ac_Name_R       || '',
                Short_Name:      accountData.Short_Name      || '',
                Mobile_No:       accountData.Mobile_No       || '',
                Email_Id:        accountData.Email_Id        || '',
                Email_Id_cc:     accountData.Email_Id_cc     || '',
                whatsup_no:      accountData.whatsup_no      || '',
                OffPhone:        accountData.OffPhone        || '',
                adhar_no:        accountData.adhar_no        || '',
                Address_E:       accountData.Address_E       || '',
                Address_R:       accountData.Address_R       || '',
                Pincode:         accountData.Pincode         || '',
                Gst_No:          accountData.Gst_No          || '',
                FSSAI:           accountData.FSSAI           || '',
                Tin_No:          accountData.Tin_No          || '',
                Cst_no:          accountData.Cst_no          || '',
                Local_Lic_No:    accountData.Local_Lic_No    || '',
                CompanyPan:      accountData.CompanyPan      || '',
                AC_Pan:          accountData.AC_Pan          || '',
                Tan_no:          accountData.Tan_no          || '',
                Bank_Name:       accountData.Bank_Name       || '',
                Bank_Ac_No:      accountData.Bank_Ac_No      || '',
                IFSC:            accountData.IFSC            || '',
                Fax:             accountData.Fax             || '',
                Other_Narration: accountData.Other_Narration || '',
            });
        }
    }, [accountData]);

    const docs     = Array.isArray(docsRes) ? docsRes : (docsRes?.documents || docsRes?.data || []);
    const contacts = Array.isArray(contactsRes) ? contactsRes : (contactsRes?.contacts || contactsRes?.data || []);

    const getDocUrl = (path) => {
        if (!path) return null;
        return path.startsWith('http') ? path : `${API_BASE_URL}/uploads/${path.replace(/^\/?(?:uploads\/)?/, '')}`;
    };

    const profilePhotoDoc = docs.find(d => d.doc_type === 'profile_photo');
    const profilePhotoUrl = getDocUrl(profilePhotoDoc?.file_path);
    const displayPhoto    = photoPreview || profilePhotoUrl;

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(p => ({ ...p, show: false })), 3200);
    };

    const set  = (field) => (val) => setForm(f => ({ ...f, [field]: val }));
    const setC = (field) => (val) => setContactForm(f => ({ ...f, [field]: val }));

    /* ── Photo: select + upload immediately ── */
    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { showToast('Photo must be under 2MB', 'error'); return; }
        const reader = new FileReader();
        reader.onloadend = () => setPhotoPreview(reader.result);
        reader.readAsDataURL(file);
        setIsUploadingPhoto(true);
        try {
            await uploadMultipleDocs({ Company_Code: COMPANY_CODE, files: { profile_photo: file } }).unwrap();
            setPhotoPreview(null);
            showToast('Profile photo updated!', 'success');
        } catch (err) {
            showToast(err?.data?.detail || 'Photo upload failed', 'error');
        } finally {
            setIsUploadingPhoto(false);
            e.target.value = '';
        }
    };

    /* ── Document file selection (queued for batch upload) ── */
    const handleDocFile = (key, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { showToast('File must be under 5MB', 'error'); return; }
        setLocalFiles(p => ({ ...p, [key]: file }));
        e.target.value = '';
    };

    /* ── Save account (Personal / Company / Banking) ── */
    const handleSaveAccount = async (stepId) => {
        if (!accountData?.accoid) { showToast('Account data not loaded', 'error'); return; }
        try {
            await updateAccount({ accoid: accountData.accoid, ...form }).unwrap();
            setCompleted(p => new Set([...p, stepId]));
            showToast('Saved successfully!', 'success');
        } catch (err) {
            showToast(err?.data?.detail || 'Failed to save', 'error');
        }
    };

    /* ── Upload queued documents ── */
    const handleSaveDocs = async () => {
        const pending = Object.entries(localFiles).filter(([, v]) => v);
        if (!pending.length) { showToast('No files selected to upload', 'error'); return; }
        try {
            await uploadMultipleDocs({ Company_Code: COMPANY_CODE, files: Object.fromEntries(pending) }).unwrap();
            setLocalFiles({});
            setCompleted(p => new Set([...p, 'docs']));
            showToast(`${pending.length} document(s) uploaded!`, 'success');
        } catch (err) {
            showToast(err?.data?.detail || 'Upload failed', 'error');
        }
    };

    const handleDeleteDoc = async () => {
        if (!confirmDeleteDoc) return;
        try {
            await deleteDocument(confirmDeleteDoc.id).unwrap();
            setConfirmDeleteDoc(null);
            showToast('Document deleted', 'success');
        } catch (err) {
            showToast(err?.data?.detail || 'Delete failed', 'error');
        }
    };

    const openContactEditor = (contact = null) => {
        setContactForm(contact
            ? { Person_Name: contact.Person_Name || '', Person_Mobile: contact.Person_Mobile || '', Person_Email: contact.Person_Email || '', Person_Pan: contact.Person_Pan || '', Other: contact.Other || '' }
            : { ...BLANK_CONTACT });
        setEditingContact({ id: contact?.id || null, isNew: !contact });
    };

    const handleSaveContact = async () => {
        if (!contactForm.Person_Name.trim()) { showToast('Contact name is required', 'error'); return; }
        try {
            if (editingContact.isNew) {
                await createContact(contactForm).unwrap();
            } else {
                await updateContact({ id: editingContact.id, ...contactForm }).unwrap();
            }
            setEditingContact(null);
            setCompleted(p => new Set([...p, 'contacts']));
            showToast(editingContact.isNew ? 'Contact added' : 'Contact updated', 'success');
        } catch (err) {
            showToast(err?.data?.detail || 'Failed to save contact', 'error');
        }
    };

    const handleDeleteContact = async () => {
        if (!confirmDeleteContact) return;
        try {
            await deleteContact(confirmDeleteContact).unwrap();
            setConfirmDeleteContact(null);
            showToast('Contact removed', 'success');
        } catch (err) {
            showToast(err?.data?.detail || 'Delete failed', 'error');
        }
    };

    const progressPct     = STEPS.length ? Math.round((completed.size / STEPS.length) * 100) : 0;
    const acName          = form.Ac_Name_E || user?.Ac_Name_E || user?.Person_Name || 'User';
    const initials        = acName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
    const acType          = user?.Ac_type;
    const hasPendingDocs  = Object.values(localFiles).some(Boolean);
    const isSavingContact = isCreatingContact || isUpdatingContact;
    const pendingCount    = Object.values(localFiles).filter(Boolean).length;

    const roleLabel = acType === 'Z' ? 'Admin' : acType === 'G' ? 'Guest' : 'Trader';
    const roleColor = acType === 'Z' ? { bg: '#f3e8ff', text: '#7c3aed' } : acType === 'G' ? { bg: '#fff7ed', text: '#c2410c' } : { bg: '#f0fdf4', text: '#059669' };

    return (
        <AppLayout title="Edit Profile" showBack>

            {/* ── Toast ── */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div initial={{ opacity: 0, y: -50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -30, scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        style={{ position: 'fixed', top: 66, left: 16, right: 16, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', borderRadius: 14, fontWeight: 700, fontSize: 14, background: toast.type === 'success' ? '#059669' : '#ef4444', color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', fontFamily: 'Signika, sans-serif' }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {toast.type === 'success' ? <CheckIcon size={12} color="white" /> : <span style={{ fontSize: 12 }}>✕</span>}
                        </div>
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ padding: '12px 16px 120px', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>

                {/* ── Profile Card ── */}
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    style={{ background: 'white', borderRadius: 20, marginBottom: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                    {/* Red banner */}
                    <div style={{ height: 64, background: 'linear-gradient(135deg,#ef3837 0%,#c92000 100%)', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
                        <div style={{ position: 'absolute', top: -40, right: 40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                    </div>
                    <div style={{ padding: '0 20px 20px', position: 'relative' }}>
                        {/* Avatar */}
                        <div style={{ position: 'relative', display: 'inline-block', marginTop: -38 }}>
                            <div style={{ width: 76, height: 76, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,#ef3837,#d92300)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 28, border: '3.5px solid white', boxShadow: '0 4px 14px rgba(239,56,55,0.3)', flexShrink: 0 }}>
                                {displayPhoto
                                    ? <img src={displayPhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <img src="/eBuySugarlogo.jpg" alt="eBuySugar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </div>
                            {/* Camera button on avatar */}
                            <button onClick={() => !isUploadingPhoto && photoRef.current?.click()}
                                style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: isUploadingPhoto ? '#d1d5db' : '#111827', border: '2.5px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isUploadingPhoto ? 'not-allowed' : 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', transition: 'background 0.2s' }}>
                                {isUploadingPhoto
                                    ? <div style={{ width: 11, height: 11, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.65s linear infinite' }} />
                                    : <CameraIcon size={13} color="white" />}
                            </button>
                            <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePhotoChange} />
                        </div>

                        {/* Name & role row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 10 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontWeight: 900, fontSize: 17, color: '#111827', marginBottom: 4, lineHeight: 1.2 }}>{acName}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, background: roleColor.bg, color: roleColor.text, borderRadius: 20, padding: '3px 10px' }}>{roleLabel}</span>
                                    {user?.Ac_Code && (
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>Code: {user.Ac_Code}</span>
                                    )}
                                </div>
                                {user?.Mobile_No && (
                                    <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <PhoneIcon size={11} color="#d1d5db" /> {user.Mobile_No}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Photo hint */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '8px 12px', background: '#f9fafb', borderRadius: 10 }}>
                            <CameraIcon size={13} color="#9ca3af" />
                            <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
                                {isUploadingPhoto ? 'Uploading photo…' : 'Tap the camera icon on your photo to update it'}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* ── Progress Card ── */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.07 }}
                    style={{ background: 'white', borderRadius: 16, padding: '14px 16px', marginBottom: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Profile Completion</span>
                        <span style={{ fontSize: 13, fontWeight: 900, color: progressPct === 100 ? '#059669' : '#ef3837' }}>{progressPct}%</span>
                    </div>
                    <div style={{ height: 6, background: '#f3f4f6', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
                        <motion.div animate={{ width: `${progressPct}%` }} transition={{ duration: 0.5, ease: 'easeOut' }}
                            style={{ height: '100%', background: progressPct === 100 ? '#059669' : 'linear-gradient(90deg,#ef3837,#c92000)', borderRadius: 6 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                        {STEPS.map(s => {
                            const done = completed.has(s.id);
                            return (
                                <div key={s.id} onClick={() => setActiveStep(s.id)} style={{ flex: 1, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <div style={{ width: '100%', height: 4, borderRadius: 4, background: done ? '#059669' : activeStep === s.id ? '#ef3837' : '#e5e7eb', transition: 'background 0.3s' }} />
                                    <span style={{ fontSize: 8, fontWeight: 700, color: done ? '#059669' : activeStep === s.id ? '#ef3837' : '#d1d5db', textTransform: 'uppercase' }}>{s.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* ── Step Tabs ── */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {STEPS.map((s, i) => {
                        const done   = completed.has(s.id);
                        const active = activeStep === s.id;
                        return (
                            <motion.button key={s.id} onClick={() => setActiveStep(s.id)}
                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                style={{ flexShrink: 0, padding: '9px 14px', border: 'none', cursor: 'pointer', borderRadius: 12, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', background: active ? '#ef3837' : done ? '#f0fdf4' : '#f3f4f6', color: active ? 'white' : done ? '#059669' : '#6b7280', boxShadow: active ? '0 3px 10px rgba(239,56,55,0.28)' : 'none' }}>
                                {done && !active
                                    ? <CheckIcon size={13} color="#059669" />
                                    : <s.Icon size={15} color={active ? 'white' : done ? '#059669' : '#6b7280'} />}
                                {s.label}
                            </motion.button>
                        );
                    })}
                </div>

                {/* ── Tab Content ── */}
                <AnimatePresence mode="wait">
                    <motion.div key={activeStep} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.16, ease: 'easeOut' }}>

                        {/* Personal */}
                        {activeStep === 'personal' && (
                            <div style={{ background: 'white', borderRadius: 18, padding: '18px 16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                                <SectionLabel>Identity</SectionLabel>
                                {acLoading ? <SkeletonFields count={3} /> : (
                                    <>
                                        <Field label="Business Name (English)" value={form.Ac_Name_E} onChange={set('Ac_Name_E')} placeholder="Business name in English" required />
                                        <Field label="Business Name (Hindi)" value={form.Ac_Name_R} onChange={set('Ac_Name_R')} placeholder="हिंदी में व्यापार का नाम" />
                                        <Field label="Short Name" value={form.Short_Name} onChange={set('Short_Name')} placeholder="Short alias or abbreviation" />
                                    </>
                                )}
                                <SectionLabel>Contact</SectionLabel>
                                {acLoading ? <SkeletonFields count={4} /> : (
                                    <>
                                        <Field label="Mobile No." value={form.Mobile_No} readOnly icon={<PhoneIcon size={11} />} />
                                        <Field label="Primary Email" value={form.Email_Id} onChange={set('Email_Id')} type="email" placeholder="primary@email.com" icon={<MailIcon size={11} />} />
                                        <Field label="CC Email" value={form.Email_Id_cc} onChange={set('Email_Id_cc')} type="email" placeholder="cc@email.com" icon={<MailIcon size={11} />} />
                                        <Field label="WhatsApp No." value={form.whatsup_no} onChange={set('whatsup_no')} placeholder="WhatsApp number" />
                                        <Field label="Office Phone" value={form.OffPhone} onChange={set('OffPhone')} placeholder="Landline / office phone" />
                                        <Field label="Aadhaar No." value={form.adhar_no} onChange={set('adhar_no')} placeholder="12-digit Aadhaar number" />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Company */}
                        {activeStep === 'company' && (
                            <div style={{ background: 'white', borderRadius: 18, padding: '18px 16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                                <SectionLabel>Address</SectionLabel>
                                {acLoading ? <SkeletonFields count={3} /> : (
                                    <>
                                        <Field label="Address (English)" value={form.Address_E} onChange={set('Address_E')} placeholder="Street address in English" />
                                        <Field label="Address (Hindi)" value={form.Address_R} onChange={set('Address_R')} placeholder="हिंदी में पता" />
                                        <Field label="PIN Code" value={form.Pincode} onChange={set('Pincode')} placeholder="6-digit PIN code" />
                                    </>
                                )}
                                <SectionLabel>Compliance & Licenses</SectionLabel>
                                {acLoading ? <SkeletonFields count={6} /> : (
                                    <>
                                        <Field label="GST Number" value={form.Gst_No} onChange={set('Gst_No')} placeholder="22AAAAA0000A1Z5" />
                                        <Field label="FSSAI Number" value={form.FSSAI} onChange={set('FSSAI')} placeholder="FSSAI license number" />
                                        <Field label="TIN Number" value={form.Tin_No} onChange={set('Tin_No')} placeholder="TIN number" />
                                        <Field label="CST Number" value={form.Cst_no} onChange={set('Cst_no')} placeholder="CST number" />
                                        <Field label="Local License No." value={form.Local_Lic_No} onChange={set('Local_Lic_No')} placeholder="Local business license" />
                                        <Field label="Company PAN" value={form.CompanyPan} onChange={set('CompanyPan')} placeholder="Company PAN number" />
                                        <Field label="Individual PAN" value={form.AC_Pan} onChange={set('AC_Pan')} placeholder="Personal PAN number" />
                                        <Field label="TAN No." value={form.Tan_no} onChange={set('Tan_no')} placeholder="TAN number" />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Banking */}
                        {activeStep === 'banking' && (
                            <div style={{ background: 'white', borderRadius: 18, padding: '18px 16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                                <SectionLabel>Bank Details</SectionLabel>
                                {acLoading ? <SkeletonFields count={4} /> : (
                                    <>
                                        <Field label="Bank Name" value={form.Bank_Name} onChange={set('Bank_Name')} placeholder="Bank name" />
                                        <Field label="Account Number" value={form.Bank_Ac_No} onChange={set('Bank_Ac_No')} placeholder="Bank account number" />
                                        <Field label="IFSC Code" value={form.IFSC} onChange={set('IFSC')} placeholder="SBIN0001234" />
                                        <Field label="Fax" value={form.Fax} onChange={set('Fax')} placeholder="Fax number" />
                                        <Field label="Additional Notes" value={form.Other_Narration} onChange={set('Other_Narration')} placeholder="Any additional information" />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Contacts */}
                        {activeStep === 'contacts' && (
                            <div>
                                <motion.button whileTap={{ scale: 0.97 }} onClick={() => openContactEditor()}
                                    style={{ width: '100%', padding: '13px', border: '1.5px dashed #ef3837', borderRadius: 14, background: '#fff5f5', color: '#ef3837', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <PlusIcon size={16} color="#ef3837" />
                                    Add Contact Person
                                </motion.button>

                                {contacts.length === 0 ? (
                                    <div style={{ background: 'white', borderRadius: 18, padding: '40px 20px', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                            <UsersIcon size={28} color="#d1d5db" />
                                        </div>
                                        <p style={{ fontWeight: 700, color: '#374151', fontSize: 14, marginBottom: 4 }}>No contact persons yet</p>
                                        <p style={{ fontSize: 12, color: '#9ca3af' }}>Add key contacts from your business</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {contacts.map((c, ci) => (
                                            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.05 }}
                                                style={{ background: 'white', borderRadius: 16, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#ef3837,#d92300)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 17, flexShrink: 0 }}>
                                                    {(c.Person_Name || '?')[0].toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontWeight: 800, fontSize: 14, color: '#111827', marginBottom: 4 }}>{c.Person_Name}</p>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        {c.Person_Mobile && (
                                                            <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                                <PhoneIcon size={11} color="#9ca3af" /> {c.Person_Mobile}
                                                            </span>
                                                        )}
                                                        {c.Person_Email && (
                                                            <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                                <MailIcon size={11} color="#9ca3af" /> {c.Person_Email}
                                                            </span>
                                                        )}
                                                        {c.Person_Pan && (
                                                            <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>PAN: {c.Person_Pan}</span>
                                                        )}
                                                        {c.Other && (
                                                            <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>{c.Other}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                                    <button onClick={() => openContactEditor(c)}
                                                        style={{ width: 34, height: 34, border: 'none', borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                        <EditIcon size={14} color="#2563eb" />
                                                    </button>
                                                    <button onClick={() => setConfirmDeleteContact(c.id)}
                                                        style={{ width: 34, height: 34, border: 'none', borderRadius: 10, background: '#fff5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                        <TrashIcon size={14} color="#ef3837" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Documents */}
                        {activeStep === 'docs' && (
                            <div>
                                {DOC_LIST.map((doc, di) => {
                                    const existing = docs.find(d => d.doc_type === doc.key);
                                    const pending  = localFiles[doc.key];
                                    const isImg    = (p) => /\.(jpg|jpeg|png|gif|webp)$/i.test(p || '');
                                    const hasFile  = !!(existing || pending);
                                    return (
                                        <motion.div key={doc.key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: di * 0.03 }}
                                            style={{ background: 'white', borderRadius: 14, padding: '13px 14px', marginBottom: 8, border: `1.5px solid ${pending ? '#d1fae5' : existing ? '#dbeafe' : '#f3f4f6'}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                {/* Doc icon */}
                                                <div style={{ width: 40, height: 40, borderRadius: 10, background: hasFile ? `${doc.color}15` : '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${hasFile ? `${doc.color}25` : '#f3f4f6'}` }}>
                                                    <FilesIcon size={18} color={hasFile ? doc.color : '#d1d5db'} />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 2 }}>{doc.label}</p>
                                                    {pending ? (
                                                        <p style={{ fontSize: 11, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <CheckIcon size={10} color="#059669" /> {pending.name.length > 22 ? pending.name.slice(0, 22) + '…' : pending.name}
                                                        </p>
                                                    ) : existing ? (
                                                        <p style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>Uploaded</p>
                                                    ) : (
                                                        <p style={{ fontSize: 11, color: '#9ca3af' }}>Not uploaded</p>
                                                    )}
                                                </div>
                                                {/* Actions */}
                                                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                                                    {existing && !pending && (
                                                        <>
                                                            <button onClick={() => setPreviewDoc({ url: getDocUrl(existing.file_path), isImage: isImg(existing.file_path), label: doc.label })}
                                                                style={{ width: 32, height: 32, border: 'none', borderRadius: 9, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                                <EyeIcon size={14} color="#2563eb" />
                                                            </button>
                                                            <button onClick={() => setConfirmDeleteDoc({ id: existing.id, label: doc.label })}
                                                                style={{ width: 32, height: 32, border: 'none', borderRadius: 9, background: '#fff5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                                <TrashIcon size={14} color="#ef3837" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button onClick={() => docRefs.current[doc.key]?.click()}
                                                        style={{ padding: '7px 12px', border: 'none', borderRadius: 9, background: pending ? '#d1fae5' : '#f3f4f6', color: pending ? '#059669' : '#374151', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                                                        <UploadIcon size={12} color={pending ? '#059669' : '#374151'} />
                                                        {hasFile ? 'Change' : 'Upload'}
                                                    </button>
                                                </div>
                                            </div>
                                            <input ref={el => { docRefs.current[doc.key] = el; }} type="file" accept="application/pdf,image/*" style={{ display: 'none' }} onChange={e => handleDocFile(doc.key, e)} />
                                        </motion.div>
                                    );
                                })}

                                {/* Upload button */}
                                <AnimatePresence>
                                    {hasPendingDocs && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                                            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveDocs} disabled={isUploadingDocs}
                                                style={{ width: '100%', padding: '15px', background: isUploadingDocs ? '#f3f4f6' : 'linear-gradient(135deg,#059669,#047857)', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 800, color: isUploadingDocs ? '#9ca3af' : 'white', cursor: isUploadingDocs ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: isUploadingDocs ? 'none' : '0 4px 16px rgba(5,150,105,0.28)', marginTop: 8 }}>
                                                {isUploadingDocs
                                                    ? <><Spinner color="#9ca3af" /> Uploading…</>
                                                    : <><UploadIcon size={17} color="white" /> Upload {pendingCount} File{pendingCount > 1 ? 's' : ''}</>}
                                            </motion.button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>

                {/* Save button for account tabs */}
                {['personal', 'company', 'banking'].includes(activeStep) && (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleSaveAccount(activeStep)} disabled={isSavingAccount || acLoading}
                        style={{ width: '100%', padding: '15px', marginTop: 16, background: (isSavingAccount || acLoading) ? '#f3f4f6' : 'linear-gradient(135deg,#ef3837,#c92000)', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 800, color: (isSavingAccount || acLoading) ? '#9ca3af' : 'white', cursor: (isSavingAccount || acLoading) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: (isSavingAccount || acLoading) ? 'none' : '0 4px 16px rgba(239,56,55,0.32)', transition: 'opacity 0.2s' }}>
                        {isSavingAccount
                            ? <><Spinner color="#9ca3af" /> Saving…</>
                            : <><SaveIcon size={17} color="white" /> Save Changes</>}
                    </motion.button>
                )}
            </div>

            {/* ── Document Preview Modal ── */}
            <AnimatePresence>
                {previewDoc && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setPreviewDoc(null)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                            onClick={e => e.stopPropagation()}
                            style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #f3f4f6' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 34, height: 34, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FilesIcon size={16} color="#2563eb" />
                                    </div>
                                    <p style={{ fontWeight: 800, fontSize: 14, color: '#111827', fontFamily: 'Signika, sans-serif' }}>{previewDoc.label}</p>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <a href={previewDoc.url} download target="_blank" rel="noreferrer"
                                        style={{ width: 34, height: 34, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                                        <DownloadIcon size={15} color="#059669" />
                                    </a>
                                    <button onClick={() => setPreviewDoc(null)}
                                        style={{ width: 34, height: 34, border: 'none', borderRadius: 10, background: '#f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#374151' }}>
                                        ✕
                                    </button>
                                </div>
                            </div>
                            <div style={{ flex: 1, overflow: 'auto' }}>
                                {previewDoc.isImage
                                    ? <img src={previewDoc.url} alt={previewDoc.label} style={{ width: '100%', display: 'block', objectFit: 'contain' }} />
                                    : <iframe src={previewDoc.url} title={previewDoc.label} style={{ width: '100%', height: '65vh', border: 'none' }} />}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Delete Document Confirm ── */}
            <AnimatePresence>
                {confirmDeleteDoc && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setConfirmDeleteDoc(null)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1001, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                            onClick={e => e.stopPropagation()}
                            style={{ background: 'white', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, padding: '24px 20px', paddingBottom: 'max(36px, env(safe-area-inset-bottom))', fontFamily: 'Signika, sans-serif' }}>
                            <div style={{ width: 50, height: 50, borderRadius: 14, background: '#fff5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                <TrashIcon size={22} color="#ef3837" />
                            </div>
                            <p style={{ fontWeight: 900, fontSize: 16, color: '#111827', textAlign: 'center', marginBottom: 6 }}>Delete Document?</p>
                            <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 24 }}>
                                <strong>{confirmDeleteDoc.label}</strong> will be permanently deleted.
                            </p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => setConfirmDeleteDoc(null)}
                                    style={{ flex: 1, padding: '14px', border: '1.5px solid #e5e7eb', borderRadius: 14, background: 'white', color: '#374151', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    Cancel
                                </button>
                                <button onClick={handleDeleteDoc} disabled={isDeletingDoc}
                                    style={{ flex: 1, padding: '14px', border: 'none', borderRadius: 14, background: isDeletingDoc ? '#f3f4f6' : '#ef4444', color: isDeletingDoc ? '#9ca3af' : 'white', fontSize: 14, fontWeight: 700, cursor: isDeletingDoc ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    {isDeletingDoc ? <><Spinner size={15} color="#9ca3af" /> Deleting…</> : 'Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Delete Contact Confirm ── */}
            <AnimatePresence>
                {confirmDeleteContact && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setConfirmDeleteContact(null)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1001, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                            onClick={e => e.stopPropagation()}
                            style={{ background: 'white', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, padding: '24px 20px', paddingBottom: 'max(36px, env(safe-area-inset-bottom))', fontFamily: 'Signika, sans-serif' }}>
                            <div style={{ width: 50, height: 50, borderRadius: 14, background: '#fff5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                <UsersIcon size={22} color="#ef3837" />
                            </div>
                            <p style={{ fontWeight: 900, fontSize: 16, color: '#111827', textAlign: 'center', marginBottom: 6 }}>Remove Contact?</p>
                            <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 24 }}>This contact person will be permanently removed.</p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => setConfirmDeleteContact(null)}
                                    style={{ flex: 1, padding: '14px', border: '1.5px solid #e5e7eb', borderRadius: 14, background: 'white', color: '#374151', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    Cancel
                                </button>
                                <button onClick={handleDeleteContact} disabled={isDeletingContact}
                                    style={{ flex: 1, padding: '14px', border: 'none', borderRadius: 14, background: isDeletingContact ? '#f3f4f6' : '#ef4444', color: isDeletingContact ? '#9ca3af' : 'white', fontSize: 14, fontWeight: 700, cursor: isDeletingContact ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    {isDeletingContact ? <><Spinner size={15} color="#9ca3af" /> Removing…</> : 'Remove'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Contact Editor Bottom Sheet ── */}
            <AnimatePresence>
                {editingContact && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setEditingContact(null)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1001, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                            onClick={e => e.stopPropagation()}
                            style={{ background: '#f9fafb', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', fontFamily: 'Signika, sans-serif' }}>
                            {/* Handle */}
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
                                <div style={{ width: 36, height: 4, borderRadius: 4, background: '#e5e7eb' }} />
                            </div>
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px 16px' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#ef3837,#d92300)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <PersonIcon size={20} color="white" />
                                </div>
                                <div>
                                    <p style={{ fontWeight: 900, fontSize: 16, color: '#111827' }}>
                                        {editingContact.isNew ? 'Add Contact Person' : 'Edit Contact Person'}
                                    </p>
                                    <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>Business contact details</p>
                                </div>
                            </div>
                            {/* Form */}
                            <div style={{ background: 'white', margin: '0 16px', borderRadius: 16, padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                                <Field label="Full Name" value={contactForm.Person_Name} onChange={setC('Person_Name')} placeholder="Contact person name" required />
                                <Field label="Mobile" value={contactForm.Person_Mobile} onChange={setC('Person_Mobile')} placeholder="Mobile number" type="tel" icon={<PhoneIcon size={11} />} />
                                <Field label="Email" value={contactForm.Person_Email} onChange={setC('Person_Email')} placeholder="Email address" type="email" icon={<MailIcon size={11} />} />
                                <Field label="PAN" value={contactForm.Person_Pan} onChange={setC('Person_Pan')} placeholder="PAN card number" />
                                <Field label="Other Info" value={contactForm.Other} onChange={setC('Other')} placeholder="Designation, role, notes…" />
                            </div>
                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 10, padding: '16px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
                                <button onClick={() => setEditingContact(null)}
                                    style={{ flex: 1, padding: '14px', border: '1.5px solid #e5e7eb', borderRadius: 14, background: 'white', color: '#374151', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    Cancel
                                </button>
                                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveContact} disabled={isSavingContact}
                                    style={{ flex: 2, padding: '14px', border: 'none', borderRadius: 14, background: isSavingContact ? '#f3f4f6' : 'linear-gradient(135deg,#ef3837,#c92000)', color: isSavingContact ? '#9ca3af' : 'white', fontSize: 14, fontWeight: 800, cursor: isSavingContact ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: isSavingContact ? 'none' : '0 4px 14px rgba(239,56,55,0.28)' }}>
                                    {isSavingContact
                                        ? <><Spinner size={15} color="#9ca3af" /> Saving…</>
                                        : <><SaveIcon size={15} color="white" /> {editingContact.isNew ? 'Add Contact' : 'Update Contact'}</>}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes spin    { to { transform: rotate(360deg); } }
                @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
                * { -webkit-tap-highlight-color: transparent; }
                ::-webkit-scrollbar { display: none; }
            `}</style>
        </AppLayout>
    );
}
