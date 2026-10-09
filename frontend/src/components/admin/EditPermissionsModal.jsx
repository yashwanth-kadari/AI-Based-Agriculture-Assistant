import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, CheckCircle2, AlertCircle, Save, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { updateUserPermissions, getMasterPermissions } from '../../utils/api';

const DEFAULT_MASTER_PERMISSIONS = [
    { key: 'VIEW_USERS', label: 'View Users', category: 'User Management', description: 'Can view all registered users and user lists' },
    { key: 'CREATE_USERS', label: 'Create Users', category: 'User Management', description: 'Can access Create Account interface and register new users' },
    { key: 'EDIT_USERS', label: 'Edit Users', category: 'User Management', description: 'Can edit user profiles and details' },
    { key: 'DISABLE_USERS', label: 'Disable Users', category: 'User Management', description: 'Can disable or enable user accounts' },
    { key: 'DELETE_USERS', label: 'Delete Users', category: 'User Management', description: 'Can safely remove user accounts' },
    { key: 'VIEW_FARMERS', label: 'View Farmers', category: 'Farmer Management', description: 'Can view farmer records and details' },
    { key: 'MANAGE_FARMERS', label: 'Manage Farmers', category: 'Farmer Management', description: 'Can edit farmer specific profile details' },
    { key: 'PROMOTE_FARMER', label: 'Promote Farmer to Admin', category: 'Role Management', description: 'Can promote farmers to secondary admins' },
    { key: 'DEMOTE_ADMIN', label: 'Demote Secondary Admin', category: 'Role Management', description: 'Can demote secondary admins back to farmers' },
    { key: 'VIEW_PREDICTIONS', label: 'View Predictions', category: 'System Access', description: 'Can view AI prediction stats and logs' },
    { key: 'VIEW_REPORTS', label: 'View Reports', category: 'System Access', description: 'Can view system reports and statistics' },
    { key: 'MANAGE_MARKETPLACE', label: 'Manage Marketplace', category: 'Content Management', description: 'Can moderate marketplace items' },
    { key: 'MANAGE_MARKET_PRICES', label: 'Manage Market Prices & Mandis', category: 'Marketplace & Prices', description: 'Can add, edit, and manage Mandis and crop prices' },
    { key: 'MANAGE_ALERTS', label: 'Manage System Alerts', category: 'System Access', description: 'Can manage and broadcast weather/pest alerts' },
    { key: 'MANAGE_SUPPORT', label: 'Manage Support', category: 'Content Management', description: 'Can handle support requests and community posts' },
    { key: 'VIEW_ANALYTICS', label: 'View Analytics', category: 'System Access', description: 'Can view platform analytics dashboard' },
    { key: 'CAN_CREATE_ACCOUNTS', label: 'Allow Secondary Admin Account Creation', category: 'Account Creation', description: 'Explicit switch for Secondary Admin to create accounts' }
];

export const EditPermissionsModal = ({ targetUser, onClose, onSaved }) => {
    const [permMap, setPermMap] = useState({});
    const [masterList, setMasterList] = useState(DEFAULT_MASTER_PERMISSIONS);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (targetUser) {
            const initialPerms = targetUser.permissions || {};
            const map = {};
            DEFAULT_MASTER_PERMISSIONS.forEach(p => {
                map[p.key] = Boolean(initialPerms[p.key] ?? false);
            });
            // Sync creation account switch if can_create_accounts is set
            if (targetUser.can_create_accounts) {
                map['CAN_CREATE_ACCOUNTS'] = true;
                map['CREATE_USERS'] = true;
            }
            setPermMap(map);
        }

        // Fetch master list from API if available
        getMasterPermissions()
            .then(res => {
                if (res.data?.permissions) {
                    setMasterList(res.data.permissions);
                }
            })
            .catch(() => { });
    }, [targetUser]);

    const handleToggle = (key) => {
        setPermMap(prev => {
            const nextVal = !prev[key];
            const updated = { ...prev, [key]: nextVal };
            // If toggling account creation permission switch, sync CREATE_USERS key
            if (key === 'CAN_CREATE_ACCOUNTS') {
                updated['CREATE_USERS'] = nextVal;
            }
            return updated;
        });
    };

    const handleAccountCreationToggle = () => {
        handleToggle('CAN_CREATE_ACCOUNTS');
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const res = await updateUserPermissions(targetUser.id, permMap);
            if (onSaved) onSaved(res.data.permissions);
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save permissions.');
        } finally {
            setSaving(false);
        }
    };

    if (!targetUser) return null;

    const categories = Array.from(new Set(masterList.map(p => p.category)));
    const accountCreationActive = Boolean(permMap['CAN_CREATE_ACCOUNTS'] || permMap['CREATE_USERS']);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-gray-100 overflow-hidden my-8">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-eco-900 via-eco-800 to-emerald-900 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                            <ShieldCheck className="h-6 w-6 text-eco-300" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Edit Secondary Admin Permissions</h3>
                            <p className="text-xs text-eco-200 mt-0.5">
                                User: <span className="font-semibold text-white">{targetUser.name}</span> ({targetUser.email})
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-all">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Account Creation Highlight Banner */}
                <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">Account Creation Permission</span>
                        <h4 className="text-sm font-bold text-gray-900">Secondary Admin Account Creation</h4>
                        <p className="text-xs text-gray-600">Allows this admin to access "+ Create Account" interface & create user accounts.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleAccountCreationToggle}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${accountCreationActive ? 'bg-emerald-600 text-white border-emerald-600 shadow-md hover:bg-emerald-700' : 'bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300'}`}
                    >
                        {accountCreationActive ? (
                            <>
                                <ToggleRight className="h-5 w-5" />
                                <span>ON (ALLOWED)</span>
                            </>
                        ) : (
                            <>
                                <ToggleLeft className="h-5 w-5" />
                                <span>OFF (DISABLED)</span>
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Permissions Grid */}
                <div className="p-6 max-h-[50vh] overflow-y-auto space-y-6">
                    {categories.map(cat => (
                        <div key={cat} className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-1">
                                {cat}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {masterList.filter(p => p.category === cat).map(p => {
                                    const active = Boolean(permMap[p.key]);
                                    return (
                                        <label
                                            key={p.key}
                                            onClick={() => handleToggle(p.key)}
                                            className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${active ? 'bg-eco-50/60 border-eco-300 shadow-xs' : 'bg-gray-50/50 border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={active}
                                                onChange={() => { }}
                                                className="mt-0.5 h-4 w-4 text-eco-600 rounded border-gray-300 focus:ring-eco-500 cursor-pointer"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-xs font-bold ${active ? 'text-eco-900' : 'text-gray-800'}`}>
                                                        {p.label}
                                                    </span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-eco-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                        {active ? 'GRANTED' : 'OFF'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{p.description}</p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modal Footer */}
                <div className="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-eco-600 to-emerald-600 hover:from-eco-700 hover:to-emerald-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                    >
                        <Save className="h-4 w-4" />
                        <span>{saving ? 'Saving Permissions...' : 'SAVE PERMISSIONS'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditPermissionsModal;
