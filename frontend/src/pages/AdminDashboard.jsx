import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, BarChart3, SlidersHorizontal, UserCircle,
    Shield, Crown, History, UserPlus, Settings, AlertTriangle, ShoppingBag,
    MessageSquare, Thermometer, Sprout
} from 'lucide-react';

// ── Sub-tab Components ────────────────────────────────────────────────────────
import SystemOverviewTab from '../components/admin/SystemOverviewTab';
import UserManagementTab from '../components/admin/UserManagementTab';
import AdminActivityTab from '../components/admin/AdminActivityTab';
import PlatformLogsTab from '../components/admin/PlatformLogsTab';
import MLDiagnosticsTab from '../components/admin/MLDiagnosticsTab';
import AdminProfileTab from '../components/admin/AdminProfileTab';
import MarketManagementTab from '../components/admin/MarketManagementTab';
import AdminFeaturesTab from '../components/admin/AdminFeaturesTab';
import CreateAccountModal from '../components/admin/CreateAccountModal';
import EditPermissionsModal from '../components/admin/EditPermissionsModal';
import RiskAlertsManagementTab from '../components/admin/RiskAlertsManagementTab';
import MarketplaceModerationTab from '../components/admin/MarketplaceModerationTab';
import CommunityModerationTab from '../components/admin/CommunityModerationTab';
import ClimateNormalsTab from '../components/admin/ClimateNormalsTab';
import CropManagementTab from '../components/admin/CropManagementTab';
import SystemReportsTab from '../components/admin/SystemReportsTab';
import PlatformAnalyticsTab from '../components/admin/PlatformAnalyticsTab';

// ── API ───────────────────────────────────────────────────────────────────────
import { getAdminStats, getAdminUsers, getSystemSettingsInfo, verifyModelWeights, exportAuditLogs } from '../utils/api';

// ── Tab Config ────────────────────────────────────────────────────────────────
const TABS = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'features', label: 'Features Hub', icon: SlidersHorizontal },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'permissions', label: 'Permissions', icon: Settings },
    { id: 'create', label: 'Create Account', icon: UserPlus },
    { id: 'market', label: 'Market Management', icon: BarChart3 },
    { id: 'risk_alerts', label: 'Risk Alerts', icon: AlertTriangle },
    { id: 'marketplace_mod', label: 'Marketplace Moderation', icon: ShoppingBag },
    { id: 'community_mod', label: 'Community Moderation', icon: MessageSquare },
    { id: 'climate_normals', label: 'Climate Normals', icon: Thermometer },
    { id: 'crops', label: 'Crop Directory', icon: Sprout },
    { id: 'reports', label: 'System Reports', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'activity', label: 'Audit Activity', icon: History },
    { id: 'logs', label: 'Prediction Logs', icon: BarChart3 },
    { id: 'ml', label: 'ML Diagnostics', icon: SlidersHorizontal },
    { id: 'settings', label: 'System Settings', icon: Settings },
    { id: 'profile', label: 'Admin Profile', icon: UserCircle },
];

// ── Helper ────────────────────────────────────────────────────────────────────
const resolveTab = (search, pathname) => {
    const p = new URLSearchParams(search).get('tab');
    if (p && TABS.find(t => t.id === p)) return p;
    if (pathname.includes('users')) return 'users';
    if (pathname.includes('permissions')) return 'permissions';
    if (pathname.includes('create')) return 'create';
    if (pathname.includes('market')) return 'market';
    if (pathname.includes('risk_alerts')) return 'risk_alerts';
    if (pathname.includes('marketplace_mod')) return 'marketplace_mod';
    if (pathname.includes('community_mod')) return 'community_mod';
    if (pathname.includes('climate_normals')) return 'climate_normals';
    if (pathname.includes('crops')) return 'crops';
    if (pathname.includes('reports')) return 'reports';
    if (pathname.includes('analytics')) return 'analytics';
    if (pathname.includes('activity')) return 'activity';
    if (pathname.includes('logs')) return 'logs';
    if (pathname.includes('ml')) return 'ml';
    if (pathname.includes('settings')) return 'settings';
    if (pathname.includes('profile')) return 'profile';
    return 'overview';
};

// ── Secondary Admin Permissions Tab (inline) ──────────────────────────────────
const PermissionsTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);

    const fetchSecondaryAdmins = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await getAdminUsers({ role: 'secondary_admin' });
            setUsers(data.users || []);
        } catch (e) {
            console.error('Failed to fetch secondary admins:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSecondaryAdmins(); }, [fetchSecondaryAdmins]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2.5 bg-indigo-50 rounded-xl">
                        <Settings className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Secondary Admin Permission Management</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Click "Edit Permissions" on any Secondary Admin to configure their granular access controls.
                        </p>
                    </div>
                </div>
            </div>

            {selectedUser && (
                <EditPermissionsModal
                    targetUser={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onSaved={() => fetchSecondaryAdmins()}
                />
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-eco-600" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-2xl m-4">
                        <Shield className="h-10 w-10 text-blue-300 mx-auto mb-2" />
                        <p className="text-gray-700 font-bold text-sm">No Secondary Admins found.</p>
                        <p className="text-gray-400 text-xs mt-1">Promote a farmer to Secondary Admin first.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                    <th className="py-3.5 px-5">Admin Name</th>
                                    <th className="py-3.5 px-5">Email</th>
                                    <th className="py-3.5 px-5">Status</th>
                                    <th className="py-3.5 px-5">Granted Permissions</th>
                                    <th className="py-3.5 px-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
                                {users.map(u => {
                                    const permObj = u.permissions || {};
                                    const grantedCount = Object.values(permObj).filter(Boolean).length;
                                    const totalPerms = Object.keys(permObj).length || 16;
                                    return (
                                        <tr key={u.id} className="hover:bg-gray-50/70 transition-all">
                                            <td className="py-3.5 px-5 font-bold text-gray-900">{u.name}</td>
                                            <td className="py-3.5 px-5 text-gray-500 font-mono">{u.email}</td>
                                            <td className="py-3.5 px-5">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full ${(u.status || 'active') === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                                                    {(u.status || 'active').charAt(0).toUpperCase() + (u.status || 'active').slice(1)}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <span className="text-xs font-bold text-indigo-700">{grantedCount}</span>
                                                <span className="text-xs text-gray-400"> / {totalPerms}</span>
                                            </td>
                                            <td className="py-3.5 px-5 text-right">
                                                <button
                                                    onClick={() => setSelectedUser(u)}
                                                    className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all cursor-pointer"
                                                >
                                                    Edit Permissions
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Create Account Tab (inline) ───────────────────────────────────────────────
const CreateAccountTab = ({ currentUser }) => {
    const [showModal, setShowModal] = useState(false);
    const [recentlyCreated, setRecentlyCreated] = useState(null);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-eco-50 rounded-xl">
                        <UserPlus className="h-5 w-5 text-eco-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Create New Account</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Register a new Farmer, User, or Admin account directly into AgriSmart AI.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-eco-600 to-emerald-600 hover:from-eco-700 hover:to-emerald-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                    <UserPlus className="h-4 w-4" />
                    <span>+ Create Account</span>
                </button>
            </div>

            {showModal && (
                <CreateAccountModal
                    currentUser={currentUser}
                    onClose={() => setShowModal(false)}
                    onCreated={(data) => {
                        setRecentlyCreated(data);
                        setShowModal(false);
                    }}
                />
            )}

            {recentlyCreated && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-sm text-emerald-800">
                    <p className="font-bold mb-1">✅ Account Created Successfully</p>
                    <p className="text-xs text-emerald-700">
                        User <strong>{recentlyCreated.user?.name || recentlyCreated.name}</strong> ({recentlyCreated.user?.email || recentlyCreated.email}) has been registered
                        with role <strong>{recentlyCreated.user?.role || recentlyCreated.role}</strong>.
                    </p>
                </div>
            )}
        </div>
    );
};

// ── System Settings Sub-tab ───────────────────────────────────────────────────
const SystemSettingsTab = ({ isPrimary }) => {
    const [info, setInfo] = useState(null);
    const [loadingInfo, setLoadingInfo] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [verifyResult, setVerifyResult] = useState(null);
    const [toast, setToast] = useState({ type: '', message: '' });

    const fetchInfo = async () => {
        setLoadingInfo(true);
        try {
            const { data } = await getSystemSettingsInfo();
            setInfo(data);
        } catch (e) {
            console.error("Failed to load settings info", e);
        } finally {
            setLoadingInfo(false);
        }
    };

    useEffect(() => {
        fetchInfo();
    }, []);

    const handleVerifyWeights = async () => {
        setVerifying(true);
        setVerifyResult(null);
        setToast({ type: '', message: '' });
        try {
            const { data } = await verifyModelWeights();
            setVerifyResult(data);
            setToast({ type: 'success', message: 'ML Model weights integrity check completed successfully!' });
            fetchInfo();
        } catch (e) {
            setToast({ type: 'error', message: e.response?.data?.error || 'Verification check failed.' });
        } finally {
            setVerifying(false);
        }
    };

    const handleExportAuditLogs = async () => {
        setExporting(true);
        setToast({ type: '', message: '' });
        try {
            const response = await exportAuditLogs();
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `admin_activity_logs_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setToast({ type: 'success', message: 'Administrative activity logs exported successfully to CSV!' });
            fetchInfo();
        } catch (e) {
            setToast({ type: 'error', message: e.response?.data?.error || 'Failed to export audit logs.' });
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-eco-50 rounded-xl">
                        <Settings className="h-5 w-5 text-eco-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900">System & Platform Settings</h3>
                            {isPrimary && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                    Primary Admin Mode
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">AgriSmart AI system configurations and backend security parameters.</p>
                    </div>
                </div>
            </div>

            <AdminToast toast={toast} onDismiss={() => setToast({ type: '', message: '' })} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 border-b pb-2">Core Environment Configuration</h4>
                    {loadingInfo ? (
                        <div className="py-8 text-center text-xs text-gray-400 animate-pulse">Loading system metrics...</div>
                    ) : (
                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <span className="font-semibold text-gray-700">Database Engine</span>
                                <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">{info?.database_engine || 'MySQL 8.0'}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <span className="font-semibold text-gray-700">Server Authorization</span>
                                <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">{info?.server_auth || 'JWT + Flask RBAC'}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <span className="font-semibold text-gray-700">Password Hashing Algorithm</span>
                                <span className="font-bold text-gray-800">{info?.password_hashing || 'SHA-256 + Salt'}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <span className="font-semibold text-gray-700">Audit Activity Logging</span>
                                <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">{info?.audit_logging || 'Active'}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <span className="font-semibold text-gray-700">Trained ML Model Files</span>
                                <span className="font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">{info?.model_files_count || '4 / 4 Active'}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 border-b pb-2">Administrative Maintenance Actions</h4>
                    <div className="space-y-3">
                        <button
                            onClick={handleVerifyWeights}
                            disabled={verifying}
                            className="w-full text-left p-3.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 text-xs font-bold text-indigo-900 transition-all flex items-center justify-between disabled:opacity-60">
                            <div>
                                <span className="block font-bold">Verify ML Model Weights Integrity</span>
                                <span className="text-[11px] text-indigo-600 font-normal">Check status, sizes &amp; validity of all 4 trained .pkl files</span>
                            </div>
                            <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-md text-[10px] font-bold">
                                {verifying ? 'Checking...' : 'Run Check'}
                            </span>
                        </button>

                        <button
                            onClick={handleExportAuditLogs}
                            disabled={exporting}
                            className="w-full text-left p-3.5 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 text-xs font-bold text-amber-900 transition-all flex items-center justify-between disabled:opacity-60">
                            <div>
                                <span className="block font-bold">Sync &amp; Export Audit Activity Logs</span>
                                <span className="text-[11px] text-amber-600 font-normal">Verify log table count and download complete CSV report</span>
                            </div>
                            <span className="bg-amber-600 text-white px-2.5 py-1 rounded-md text-[10px] font-bold">
                                {exporting ? 'Exporting...' : 'Export CSV'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal / Report overlay for ML Verification */}
            {verifyResult && (
                <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b pb-3">
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                ML Model Weights Verification Report
                            </h4>
                            <p className="text-xs text-gray-500">Checked at {verifyResult.verified_at}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${verifyResult.status === 'PASSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            Overall: {verifyResult.status}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {verifyResult.models?.map((m) => (
                            <div key={m.key} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                                <div className="flex justify-between font-bold text-gray-900">
                                    <span>{m.name}</span>
                                    <span className={m.status === 'passed' ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                                        {m.status.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-500 font-mono">File: {m.filename} ({m.size_kb} KB)</p>
                                <p className="text-[11px] text-gray-500">Class: <span className="font-medium text-gray-700">{m.class_name}</span></p>
                                <p className="text-[11px] text-gray-500">Last Modified: {m.last_modified}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end pt-2">
                        <button onClick={() => setVerifyResult(null)} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-lg">
                            Close Verification Report
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Main AdminDashboard Component ─────────────────────────────────────────────
const AdminDashboard = ({ user }) => {
    const routerLoc = useLocation();

    const activeTab = resolveTab(routerLoc.search, routerLoc.pathname);
    const [stats, setStats] = useState(null);

    const isPrimaryAdmin = Boolean(
        user?.is_super_admin ||
        (user?.role || '').toLowerCase() === 'primary_admin' ||
        (user?.role || '').toLowerCase() === 'superadmin'
    );

    useEffect(() => {
        let mounted = true;
        getAdminStats()
            .then(({ data }) => {
                if (mounted) setStats(data);
            })
            .catch(() => { });
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* ── Page Header ──────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-eco-600 rounded-2xl text-white shadow-md">
                        <Shield className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-bold text-gray-900">Admin Control Center</h1>
                            {isPrimaryAdmin ? (
                                <span className="bg-amber-100 text-amber-800 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 border border-amber-300">
                                    <Crown className="h-3.5 w-3.5 text-amber-600" /> Primary Admin
                                </span>
                            ) : (
                                <span className="bg-blue-100 text-blue-800 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 border border-blue-300">
                                    <Shield className="h-3.5 w-3.5 text-blue-600" /> Secondary Admin
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 text-xs mt-1">
                            Welcome back, <strong className="text-gray-900">{user?.name || 'Administrator'}</strong>. Role-Based Access Control active.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Active Tab Content ────────────────────────────────────────────── */}
            <div>
                {activeTab === 'features' && (
                    <AdminFeaturesTab user={user} />
                )}

                {activeTab === 'overview' && (
                    <SystemOverviewTab stats={stats} />
                )}

                {activeTab === 'reports' && (
                    <SystemReportsTab user={user} />
                )}

                {activeTab === 'analytics' && (
                    <PlatformAnalyticsTab user={user} />
                )}

                {activeTab === 'users' && (
                    <UserManagementTab currentUser={user} />
                )}

                {activeTab === 'permissions' && isPrimaryAdmin && (
                    <PermissionsTab />
                )}

                {activeTab === 'create' && (
                    <CreateAccountTab currentUser={user} />
                )}

                {activeTab === 'market' && (
                    <MarketManagementTab currentUser={user} />
                )}

                {activeTab === 'risk_alerts' && (
                    <RiskAlertsManagementTab />
                )}

                {activeTab === 'marketplace_mod' && (
                    <MarketplaceModerationTab />
                )}

                {activeTab === 'community_mod' && (
                    <CommunityModerationTab />
                )}

                {activeTab === 'climate_normals' && (
                    <ClimateNormalsTab />
                )}

                {activeTab === 'crops' && (
                    <CropManagementTab />
                )}

                {activeTab === 'activity' && (
                    <AdminActivityTab currentUser={user} />
                )}

                {activeTab === 'logs' && (
                    <PlatformLogsTab />
                )}

                {activeTab === 'ml' && (
                    <MLDiagnosticsTab />
                )}

                {activeTab === 'settings' && (
                    <SystemSettingsTab isPrimary={isPrimaryAdmin} />
                )}

                {activeTab === 'profile' && (
                    <AdminProfileTab user={user} />
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
