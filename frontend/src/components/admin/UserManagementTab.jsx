import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, Search, RefreshCw, Crown, Lock, Ban, Trash2,
    Clock, CheckCircle2, UserPlus, ShieldCheck, Settings, Edit3, ArrowUpRight, ArrowDownRight, UserCheck
} from 'lucide-react';
import Card from '../Card';
import Pagination from '../Pagination';
import { AdminToast, RoleBadge, StatusBadge } from './AdminBadges';
import PermissionGuard from '../PermissionGuard';
import EditPermissionsModal from './EditPermissionsModal';
import CreateAccountModal from './CreateAccountModal';
import RoleConfirmModal from './RoleConfirmModal';
import EditUserModal from './EditUserModal';
import {
    getAdminUsers, updateUserStatus, deleteAdminUser, updateUserRole
} from '../../utils/api';

/* ─── Confirm Delete Modal ────────────────────────────────────────────────── */
const DeleteModal = ({ target, onConfirm, onCancel, busy }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-red-100 rounded-xl"><Trash2 className="h-5 w-5 text-red-600" /></div>
                <h3 className="font-bold text-gray-900">Delete Account?</h3>
            </div>
            <p className="text-xs text-gray-600 mb-5 leading-relaxed">
                Permanently delete account for <strong className="text-gray-900">{target?.name}</strong> ({target?.email})?
                All associated predictions and soil reports will also be purged.{' '}
                <span className="text-red-600 font-bold block mt-1">This action cannot be undone.</span>
            </p>
            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer">
                    Cancel
                </button>
                <button onClick={onConfirm} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md disabled:opacity-60 cursor-pointer">
                    {busy ? 'Deleting…' : 'Yes, Delete Account'}
                </button>
            </div>
        </div>
    </div>
);

/* ─── Main UserManagementTab Component ────────────────────────────────────── */
const UserManagementTab = ({ currentUser }) => {
    const queryParams = new URLSearchParams(window.location.search);
    const initialRole = queryParams.get('role') || '';
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ type: '', message: '' });
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState(initialRole);
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [actionBusy, setActionBusy] = useState(null);

    // Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [permissionsModalTarget, setPermissionsModalTarget] = useState(null);
    const [roleModalTarget, setRoleModalTarget] = useState(null);
    const [roleModalAction, setRoleModalAction] = useState('promote'); // 'promote' | 'demote'
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [editUserTarget, setEditUserTarget] = useState(null);

    const isCallerPrimary = Boolean(
        currentUser?.is_super_admin ||
        (currentUser?.role || '').toLowerCase() === 'primary_admin' ||
        (currentUser?.role || '').toLowerCase() === 'superadmin'
    );

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast({ type: '', message: '' }), 4500);
    };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await getAdminUsers({
                role: roleFilter,
                status: statusFilter,
                q: search
            });
            setUsers(data.users || []);
            setStats(data.stats || null);
        } catch (e) {
            showToast('error', e.response?.data?.error || 'Failed to load users.');
        } finally {
            setLoading(false);
        }
    }, [roleFilter, statusFilter, search]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        setCurrentPage(1);
    }, [roleFilter, statusFilter, search]);

    const handleRoleConfirm = async (newRole) => {
        if (!roleModalTarget) return;
        setActionBusy(roleModalTarget.id);
        try {
            const res = await updateUserRole(roleModalTarget.id, newRole);
            showToast('success', res.data.message || `Role updated to '${newRole}'`);
            fetchUsers();
        } catch (e) {
            showToast('error', e.response?.data?.error || 'Role change failed.');
        } finally {
            setActionBusy(null);
            setRoleModalTarget(null);
        }
    };

    const handleToggleStatus = async (user) => {
        setActionBusy(user.id);
        const newStatus = (user.status || 'active').toLowerCase() === 'active' ? 'disabled' : 'active';
        try {
            const res = await updateUserStatus(user.id, newStatus);
            showToast('success', res.data.message || `Account set to ${newStatus.toUpperCase()}`);
            fetchUsers();
        } catch (e) {
            showToast('error', e.response?.data?.error || 'Status update failed.');
        } finally {
            setActionBusy(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleteBusy(true);
        try {
            const { data } = await deleteAdminUser(deleteTarget.id);
            showToast('success', data.message);
            fetchUsers();
        } catch (e) {
            showToast('error', e.response?.data?.error || 'Delete failed.');
        } finally {
            setDeleteBusy(false);
            setDeleteTarget(null);
        }
    };

    const totalUsersCount = stats?.total_users || users.length;
    const farmersCount = stats?.total_farmers || users.filter(u => u.role === 'farmer').length;
    const secondaryAdminsCount = stats?.total_secondary_admins || users.filter(u => u.role === 'secondary_admin').length;
    const activeAccountsCount = users.filter(u => (u.status || 'active').toLowerCase() === 'active').length;

    return (
        <div className="space-y-6">
            {/* Modals */}
            {deleteTarget && (
                <DeleteModal
                    target={deleteTarget}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                    busy={deleteBusy}
                />
            )}

            {showCreateModal && (
                <CreateAccountModal
                    currentUser={currentUser}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        showToast('success', 'New user account created successfully!');
                        fetchUsers();
                    }}
                />
            )}

            {permissionsModalTarget && (
                <EditPermissionsModal
                    targetUser={permissionsModalTarget}
                    onClose={() => setPermissionsModalTarget(null)}
                    onSaved={() => {
                        showToast('success', 'Secondary Admin permissions saved successfully!');
                        fetchUsers();
                    }}
                />
            )}

            {roleModalTarget && (
                <RoleConfirmModal
                    actionType={roleModalAction}
                    targetUser={roleModalTarget}
                    onConfirm={handleRoleConfirm}
                    onClose={() => setRoleModalTarget(null)}
                    loading={actionBusy === roleModalTarget.id}
                />
            )}

            {editUserTarget && (
                <EditUserModal
                    targetUser={editUserTarget}
                    onClose={() => setEditUserTarget(null)}
                    onSaved={() => {
                        showToast('success', `Updated account details for ${editUserTarget.name}`);
                        fetchUsers();
                    }}
                />
            )}

            {/* Top Summary Statistic Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Registered Users</span>
                        <h4 className="text-2xl font-black text-gray-900 mt-1">{totalUsersCount}</h4>
                        <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">System Total</span>
                    </div>
                    <div className="p-3 bg-eco-50 rounded-2xl text-eco-600">
                        <Users className="h-6 w-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Farmers</span>
                        <h4 className="text-2xl font-black text-emerald-700 mt-1">{farmersCount}</h4>
                        <span className="text-[11px] text-gray-500 font-semibold mt-1 inline-block">Farmer Accounts</span>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                        <UserCheck className="h-6 w-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Secondary Admins</span>
                        <h4 className="text-2xl font-black text-blue-700 mt-1">{secondaryAdminsCount}</h4>
                        <span className="text-[11px] text-blue-600 font-semibold mt-1 inline-block">Delegated Admins</span>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Active Accounts</span>
                        <h4 className="text-2xl font-black text-emerald-700 mt-1">{activeAccountsCount}</h4>
                        <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">In Good Standing</span>
                    </div>
                    <div className="p-3 bg-teal-50 rounded-2xl text-teal-600">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                </div>
            </div>

            {/* Toast Alerts */}
            <AdminToast toast={toast} onDismiss={() => setToast({ type: '', message: '' })} />

            {/* Main User Table Card */}
            <Card>
                {/* Header Actions & Filter Controls */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 mb-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Users className="h-5 w-5 text-eco-600" />
                            User Accounts Management
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Manage user roles, permissions, account status, and registration records.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by name, email, or User ID..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-eco-500 focus:outline-none bg-white"
                            />
                        </div>

                        <select
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value)}
                            className="px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 bg-white focus:ring-2 focus:ring-eco-500 focus:outline-none"
                        >
                            <option value="">All Roles</option>
                            <option value="primary_admin">Primary Admin</option>
                            <option value="secondary_admin">Secondary Admin</option>
                            <option value="farmer">Farmer</option>
                            <option value="user">User</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 bg-white focus:ring-2 focus:ring-eco-500 focus:outline-none"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="disabled">Disabled</option>
                            <option value="pending">Pending</option>
                        </select>

                        <button
                            onClick={fetchUsers}
                            disabled={loading}
                            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-all cursor-pointer"
                            title="Refresh User List"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-eco-600' : ''}`} />
                        </button>

                        {/* + Create Account Button (Guarded) */}
                        <PermissionGuard permission="CREATE_USERS" user={currentUser}>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-eco-600 to-emerald-600 hover:from-eco-700 hover:to-emerald-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
                            >
                                <UserPlus className="h-4 w-4" />
                                <span>+ Create Account</span>
                            </button>
                        </PermissionGuard>
                    </div>
                </div>

                {/* Users Data Table */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-eco-600" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-2xl">
                        <UserPlus className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                        <p className="text-gray-700 font-bold text-sm">No accounts found matching filter criteria.</p>
                        <p className="text-gray-400 text-xs mt-1">Try resetting your search query or role filter.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100 text-[11px]">
                                        <th className="py-3.5 px-4">User Identifier</th>
                                        <th className="py-3.5 px-4">Account Holder</th>
                                        <th className="py-3.5 px-4">Role</th>
                                        <th className="py-3.5 px-4">Status</th>
                                        <th className="py-3.5 px-4">Date Registered</th>
                                        <th className="py-3.5 px-4 text-right">Account Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white font-medium text-gray-700">
                                    {users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(u => {
                                        const roleNorm = (u.role || 'farmer').toLowerCase();
                                        const isTargetPrimary = u.is_super_admin || roleNorm === 'primary_admin' || roleNorm === 'superadmin';
                                        const isTargetSecondary = roleNorm === 'secondary_admin' || roleNorm === 'admin';
                                        const isTargetDisabled = (u.status || 'active').toLowerCase() === 'disabled';
                                        const busy = actionBusy === u.id;

                                        return (
                                            <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                                                {/* User ID */}
                                                <td className="py-3.5 px-4 font-mono font-bold text-eco-700">
                                                    {u.user_id || `#${u.id}`}
                                                </td>

                                                {/* Account Holder */}
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-gray-900 text-sm">{u.name}</div>
                                                    <div className="text-gray-400 font-mono text-[11px]">{u.email}</div>
                                                </td>

                                                {/* Role */}
                                                <td className="py-3.5 px-4">
                                                    <RoleBadge u={u} />
                                                </td>

                                                {/* Status */}
                                                <td className="py-3.5 px-4">
                                                    <StatusBadge u={u} />
                                                </td>

                                                {/* Registered Date */}
                                                <td className="py-3.5 px-4 text-gray-500">
                                                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3.5 px-4 text-right">
                                                    {isTargetPrimary ? (
                                                        <span className="text-xs text-amber-700 font-bold inline-flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                                                            <Crown className="h-3.5 w-3.5 text-amber-500" /> Primary Admin
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-2 flex-wrap">
                                                            {/* Permissions Button (Primary Admin editing Secondary Admin) */}
                                                            {isCallerPrimary && isTargetSecondary && (
                                                                <button
                                                                    onClick={() => setPermissionsModalTarget(u)}
                                                                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all cursor-pointer flex items-center gap-1"
                                                                    title="Manage Permissions"
                                                                >
                                                                    <Settings className="h-3.5 w-3.5" />
                                                                    <span>Permissions</span>
                                                                </button>
                                                            )}

                                                            {/* Promote / Demote Buttons */}
                                                            {isCallerPrimary && (
                                                                isTargetSecondary ? (
                                                                    <button
                                                                        disabled={busy}
                                                                        onClick={() => {
                                                                            setRoleModalTarget(u);
                                                                            setRoleModalAction('demote');
                                                                        }}
                                                                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-xl border border-amber-200 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
                                                                    >
                                                                        <ArrowDownRight className="h-3.5 w-3.5" />
                                                                        <span>Demote</span>
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        disabled={busy}
                                                                        onClick={() => {
                                                                            setRoleModalTarget(u);
                                                                            setRoleModalAction('promote');
                                                                        }}
                                                                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
                                                                    >
                                                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                                                        <span>Promote</span>
                                                                    </button>
                                                                )
                                                            )}

                                                            {/* Edit Details Button */}
                                                            <PermissionGuard permission="EDIT_USERS" user={currentUser}>
                                                                <button
                                                                    onClick={() => setEditUserTarget(u)}
                                                                    className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl border border-gray-200 transition-all cursor-pointer flex items-center gap-1"
                                                                    title="Edit User Details"
                                                                >
                                                                    <Edit3 className="h-3.5 w-3.5 text-gray-500" />
                                                                    <span>Edit</span>
                                                                </button>
                                                            </PermissionGuard>

                                                            {/* Enable / Disable Button */}
                                                            <PermissionGuard permission="DISABLE_USERS" user={currentUser}>
                                                                <button
                                                                    disabled={busy}
                                                                    onClick={() => handleToggleStatus(u)}
                                                                    className={`px-2.5 py-1.5 font-bold text-xs rounded-xl border transition-all disabled:opacity-50 cursor-pointer ${isTargetDisabled ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'}`}
                                                                >
                                                                    {isTargetDisabled ? 'Enable' : 'Disable'}
                                                                </button>
                                                            </PermissionGuard>

                                                            {/* Delete Button */}
                                                            <PermissionGuard permission="DELETE_USERS" user={currentUser}>
                                                                <button
                                                                    onClick={() => setDeleteTarget(u)}
                                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                                                    title="Delete User Account"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </PermissionGuard>

                                                            {busy && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-eco-600" />}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(users.length / itemsPerPage)}
                            totalItems={users.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}
            </Card>
        </div>
    );
};

export default UserManagementTab;
