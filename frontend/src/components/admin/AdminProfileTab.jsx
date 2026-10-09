import React, { useState } from 'react';
import { Shield, Crown, ShieldCheck, CheckCircle2, XCircle, Save, KeyRound, UserCircle } from 'lucide-react';
import Card from '../Card';
import { AdminToast } from './AdminBadges';
import { updateProfile, resetUserPassword } from '../../utils/api';

const AdminProfileTab = ({ user }) => {
    const [name, setName] = useState(user?.name || '');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ type: '', message: '' });
    const isSuperAdmin = Boolean(user?.is_super_admin || (user?.role || '').toLowerCase() === 'primary_admin' || user?.role === 'superadmin');

    // Password state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPw, setChangingPw] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            setToast({ type: 'error', message: 'Display name cannot be empty.' });
            return;
        }
        setSaving(true);
        try {
            await updateProfile({
                user_id: user?.id,
                name: name.trim(),
                state: user?.state || 'Andhra Pradesh',
                district: user?.district || 'Guntur',
            });
            setToast({ type: 'success', message: 'Profile updated successfully.' });
        } catch (e) {
            setToast({ type: 'error', message: e.response?.data?.error || 'Update failed. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!newPassword || newPassword.length < 6) {
            setToast({ type: 'error', message: 'Password must be at least 6 characters.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setToast({ type: 'error', message: 'Passwords do not match.' });
            return;
        }
        setChangingPw(true);
        try {
            await resetUserPassword(user?.id, newPassword);
            setToast({ type: 'success', message: 'Password updated successfully.' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (e) {
            setToast({ type: 'error', message: e.response?.data?.error || 'Password change failed.' });
        } finally {
            setChangingPw(false);
        }
    };

    const privileges = [
        { label: 'Verify Farmer Accounts', allowed: true },
        { label: 'Approve & Reject Registrations', allowed: true },
        { label: 'Suspend / Unsuspend Users', allowed: true },
        { label: 'View Platform Prediction Logs', allowed: true },
        { label: 'View ML Diagnostics', allowed: true },
        { label: 'Access Admin Control Center', allowed: true },
        { label: 'Promote Users to Secondary Admin', allowed: isSuperAdmin },
        { label: 'Demote Admin Accounts', allowed: isSuperAdmin },
        { label: 'Permanently Delete Accounts', allowed: isSuperAdmin },
        { label: 'Primary System Authority', allowed: isSuperAdmin },
    ];

    return (
        <div className="space-y-5 max-w-2xl">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-gray-900">Admin Profile</h2>
                <p className="text-gray-500 text-sm">Your account identity, credentials, and access privileges.</p>
            </div>

            <AdminToast toast={toast} onDismiss={() => setToast({ type: '', message: '' })} />

            {/* Identity Card */}
            <Card title="Account Identity" icon={Shield}>
                {/* Avatar + Summary */}
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${isSuperAdmin ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-eco-500 to-emerald-600'}`}>
                        <span className="text-2xl font-black text-white">{user?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{user?.name}</h3>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <div className="mt-1.5">
                            {isSuperAdmin ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                    <Crown className="h-3.5 w-3.5 text-amber-600" /> Primary Admin
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
                                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> Secondary Admin
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Editable Fields */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            Display Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-eco-500 bg-white"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">User ID</label>
                            <input readOnly value={user?.user_id || '—'}
                                className="w-full px-3.5 py-2.5 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-500 font-mono cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Role</label>
                            <input readOnly value={isSuperAdmin ? 'Primary Admin' : 'Secondary Admin'}
                                className="w-full px-3.5 py-2.5 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Address</label>
                        <input readOnly value={user?.email || '—'}
                            className="w-full px-3.5 py-2.5 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-500 font-mono cursor-not-allowed" />
                        <p className="text-[11px] text-gray-400 mt-1">Email cannot be changed. Contact system owner if needed.</p>
                    </div>
                </div>

                <div className="mt-5 flex justify-end">
                    <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-eco-600 hover:bg-eco-700 text-white font-bold text-sm rounded-xl shadow transition-all disabled:opacity-60 cursor-pointer">
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </Card>

            {/* Change Password */}
            <Card title="Change Password" icon={KeyRound}>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-eco-500 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-eco-500 bg-white"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={handlePasswordChange}
                            disabled={changingPw}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-bold text-sm rounded-xl shadow transition-all disabled:opacity-60 cursor-pointer">
                            <KeyRound className="h-4 w-4" />
                            {changingPw ? 'Updating…' : 'Update Password'}
                        </button>
                    </div>
                </div>
            </Card>

            {/* Privileges Matrix */}
            <Card title="Admin Privilege Matrix" icon={ShieldCheck}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {privileges.map(({ label, allowed }) => (
                        <div key={label} className={`flex items-center justify-between p-3 rounded-xl border text-sm ${allowed ? 'bg-emerald-50/60 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                            <span className={`font-medium ${allowed ? 'text-emerald-900' : 'text-gray-400'}`}>{label}</span>
                            {allowed
                                ? <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                : <XCircle className="h-4 w-4 text-gray-300 flex-shrink-0" />}
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default AdminProfileTab;
