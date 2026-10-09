import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, ShieldAlert, Search, RefreshCw, CheckCircle2, AlertCircle, UserX, Crown, Lock } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { getAdminUsers, promoteAdminUser } from '../utils/api';

const AdminUserManagement = ({ user }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast] = useState({ type: '', message: '' });

    const isSuperAdmin = Boolean(user?.is_super_admin || user?.role === 'superadmin');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await getAdminUsers();
            setUsers(data.users || []);
        } catch (err) {
            setToast({
                type: 'error',
                message: err.response?.data?.error || 'Failed to fetch user directory. Admin permission required.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (targetUser, targetRole) => {
        if (!isSuperAdmin) {
            setToast({ type: 'error', message: 'Only the Primary Super Admin can manage user roles.' });
            return;
        }

        const actionText = targetRole === 'admin' ? 'promote' : 'demote';
        if (!window.confirm(`Are you sure you want to ${actionText} "${targetUser.name}" (@${targetUser.user_id || targetUser.email}) to role '${targetRole}'?`)) {
            return;
        }

        setActionLoading(targetUser.id);
        setToast({ type: '', message: '' });

        try {
            const { data } = await promoteAdminUser(targetUser.id, targetRole);
            setToast({
                type: 'success',
                message: data.message || `User '${targetUser.name}' successfully set to ${targetRole.toUpperCase()}.`
            });
            fetchUsers();
        } catch (err) {
            setToast({
                type: 'error',
                message: err.response?.data?.error || `Failed to ${actionText} user.`
            });
        } finally {
            setActionLoading(null);
        }
    };

    const filteredUsers = users.filter((u) => {
        const term = search.toLowerCase();
        return (
            (u.name && u.name.toLowerCase().includes(term)) ||
            (u.email && u.email.toLowerCase().includes(term)) ||
            (u.user_id && u.user_id.toLowerCase().includes(term)) ||
            (u.role && u.role.toLowerCase().includes(term))
        );
    });

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 page-header">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-gray-900">User Role & Admin Management</h1>
                        {isSuperAdmin && (
                            <span className="bg-amber-100 text-amber-800 text-xs font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 border border-amber-300">
                                <Crown className="h-3.5 w-3.5 text-amber-600" />
                                Primary Super Admin
                            </span>
                        )}
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage system permissions, view user accounts, and promote verified users to Secondary Admin status.
                    </p>
                </div>
                <Button onClick={fetchUsers} isLoading={loading} variant="secondary" icon={RefreshCw}>
                    Refresh List
                </Button>
            </div>

            {/* Toast Notification */}
            {toast.message && (
                <div
                    className={`flex items-center justify-between p-4 rounded-2xl text-sm font-semibold border shadow-sm fade-in ${toast.type === 'error'
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        {toast.type === 'error' ? (
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        ) : (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                        )}
                        <span>{toast.message}</span>
                    </div>
                    <button
                        onClick={() => setToast({ type: '', message: '' })}
                        className="text-xs text-gray-400 hover:text-gray-600 font-bold ml-4"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Main Card */}
            <Card title="System Registered Users" icon={UserCheck}>
                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search by User ID, Name, or Email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-eco-500 bg-white"
                        />
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                        Total Registered: <span className="font-bold text-gray-900">{users.length}</span>
                    </div>
                </div>

                {/* Users Table */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="loading-ring" />
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
                        <UserX className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm font-medium">No users found matching "{search}".</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="px-4 py-3">User Identifier</th>
                                    <th className="px-4 py-3">Full Name & Email</th>
                                    <th className="px-4 py-3">Account Role</th>
                                    <th className="px-4 py-3">Location</th>
                                    <th className="px-4 py-3 text-right">Role Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {filteredUsers.map((u) => {
                                    const isUserSuperAdmin = Boolean(u.is_super_admin);
                                    const isAdmin = u.role === 'admin';

                                    return (
                                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                            {/* User ID */}
                                            <td className="px-4 py-3.5 font-bold text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-eco-700 bg-eco-50 px-2 py-0.5 rounded-md text-xs border border-eco-100">
                                                        {u.user_id || `#${u.id}`}
                                                    </span>
                                                    {isUserSuperAdmin && (
                                                        <span title="Primary Super Admin" className="text-amber-500">
                                                            <Crown className="h-4 w-4" />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Name & Email */}
                                            <td className="px-4 py-3.5">
                                                <div className="font-semibold text-gray-900">{u.name}</div>
                                                <div className="text-xs text-gray-400 font-mono">{u.email}</div>
                                            </td>

                                            {/* Role Badge */}
                                            <td className="px-4 py-3.5">
                                                {isUserSuperAdmin ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                                        <Crown className="h-3 w-3 text-amber-600" />
                                                        Super Admin
                                                    </span>
                                                ) : isAdmin ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                                        <ShieldCheck className="h-3 w-3 text-blue-600" />
                                                        Secondary Admin
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                        Farmer / Farm Owner
                                                    </span>
                                                )}
                                            </td>

                                            {/* Location */}
                                            <td className="px-4 py-3.5 text-xs text-gray-500">
                                                {u.district || 'Guntur'}, {u.state || 'Andhra Pradesh'}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3.5 text-right">
                                                {isUserSuperAdmin ? (
                                                    <span className="text-xs text-gray-400 font-medium italic flex items-center justify-end gap-1">
                                                        <Lock className="h-3.5 w-3.5 text-amber-500" /> Primary Owner
                                                    </span>
                                                ) : !isSuperAdmin ? (
                                                    <span className="text-xs text-gray-400 font-medium italic">
                                                        Super Admin Only
                                                    </span>
                                                ) : isAdmin ? (
                                                    <button
                                                        onClick={() => handleRoleChange(u, 'farmer')}
                                                        disabled={actionLoading === u.id}
                                                        className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 font-bold text-xs rounded-xl border border-gray-200 hover:border-red-200 transition-all flex items-center gap-1 ml-auto"
                                                    >
                                                        <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                                                        <span>Demote to Farmer</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRoleChange(u, 'admin')}
                                                        disabled={actionLoading === u.id}
                                                        className="px-3.5 py-1.5 bg-gradient-to-r from-eco-600 to-emerald-600 hover:from-eco-700 hover:to-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-eco-600/20 hover:shadow-eco-600/30 active:scale-[0.98] transition-all flex items-center gap-1.5 ml-auto disabled:opacity-50"
                                                    >
                                                        <ShieldCheck className="h-3.5 w-3.5" />
                                                        <span>Promote to Admin</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default AdminUserManagement;
