import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, ShieldCheck, Settings, UserPlus, TrendingUp, BarChart3,
    History, SlidersHorizontal, FileText, UserCircle, Lock, Crown,
    CheckCircle2, AlertCircle, ArrowRight, Shield, ShieldAlert, ShoppingBag,
    MessageSquare, Thermometer, Sprout
} from 'lucide-react';

const ADMIN_MODULES = [
    {
        id: 'users',
        title: 'User Management',
        category: 'Core Administration',
        description: 'View, search, edit roles, filter, and manage all accounts registered across the platform.',
        tabId: 'users',
        roleFilter: '',
        permKey: 'VIEW_USERS',
        icon: Users,
        accent: 'from-blue-500 to-indigo-600',
    },
    {
        id: 'farmers',
        title: 'Farmer Directory',
        category: 'User Management',
        description: 'Access individual farmer profiles, land size, cultivation history, and crop records.',
        tabId: 'users',
        roleFilter: 'farmer',
        permKey: 'VIEW_FARMERS',
        icon: Users,
        accent: 'from-emerald-500 to-teal-600',
    },
    {
        id: 'secondary_admins',
        title: 'Secondary Admin Controls',
        category: 'Access Control',
        description: 'Promote users to Secondary Admin, demote accounts, and manage system access levels.',
        tabId: 'users',
        roleFilter: 'secondary_admin',
        primaryOnly: true,
        icon: ShieldCheck,
        accent: 'from-amber-500 to-orange-600',
    },
    {
        id: 'permissions',
        title: 'Granular Permission Matrix',
        category: 'Access Control',
        description: 'Configure feature-level permissions (VIEW, CREATE, EDIT, DELETE) for Secondary Admins.',
        tabId: 'permissions',
        primaryOnly: true,
        icon: Settings,
        accent: 'from-purple-500 to-violet-600',
    },
    {
        id: 'create',
        title: 'Account Creation Suite',
        category: 'User Management',
        description: 'Create new Farmer or Admin accounts with custom initial permissions and credentials.',
        tabId: 'create',
        permKey: 'CREATE_USERS',
        icon: UserPlus,
        accent: 'from-teal-500 to-emerald-600',
    },
    {
        id: 'market',
        title: 'Market Prices & Mandis Admin',
        category: 'Marketplace & Prices',
        description: 'Manage APMC Mandi locations, add daily crop prices, and update market trends.',
        tabId: 'market',
        permKey: 'MANAGE_MARKET_PRICES',
        icon: TrendingUp,
        accent: 'from-emerald-600 to-green-700',
    },
    {
        id: 'risk_alerts',
        title: 'Risk Alerts & Advisories',
        category: 'Security & Risk',
        description: 'Broadcast regional weather, pest, disease, and market risk alerts with auto-expiry.',
        tabId: 'risk_alerts',
        permKey: 'MANAGE_ALERTS',
        icon: ShieldAlert,
        accent: 'from-rose-500 to-red-600',
    },
    {
        id: 'marketplace_mod',
        title: 'Marketplace Moderation',
        category: 'Marketplace & Prices',
        description: 'Audit farmer produce listings, flag suspicious entries, and soft-remove listings.',
        tabId: 'marketplace_mod',
        permKey: 'MANAGE_MARKETPLACE',
        icon: ShoppingBag,
        accent: 'from-teal-600 to-emerald-700',
    },
    {
        id: 'community_mod',
        title: 'Community Forum Moderation',
        category: 'Community & Support',
        description: 'Review farmer forum questions, answers, comments, and remove inappropriate posts.',
        tabId: 'community_mod',
        permKey: 'MANAGE_SUPPORT',
        icon: MessageSquare,
        accent: 'from-indigo-600 to-violet-700',
    },
    {
        id: 'climate_normals',
        title: 'Regional Climate Normals',
        category: 'AI System Controls',
        description: 'Set state-level baseline temperature, humidity, and rainfall averages for AI prediction models.',
        tabId: 'climate_normals',
        permKey: 'MANAGE_CLIMATE_NORMALS',
        icon: Thermometer,
        accent: 'from-sky-500 to-blue-600',
    },
    {
        id: 'crops',
        title: 'Crop Master Directory',
        category: 'Agricultural Master Data',
        description: 'Manage master crop database, season suitability, soil types, and sustainability ratings.',
        tabId: 'crops',
        permKey: 'MANAGE_CROPS',
        icon: Sprout,
        accent: 'from-green-600 to-emerald-800',
    },
    {
        id: 'reports',
        title: 'System & Platform Reports',
        category: 'Analytics & Reporting',
        description: 'Generate operational reports, crop yield summaries, and registration statistics.',
        tabId: 'reports',
        permKey: 'VIEW_REPORTS',
        icon: FileText,
        accent: 'from-cyan-500 to-blue-600',
    },
    {
        id: 'analytics',
        title: 'Platform Analytics',
        category: 'Analytics & Reporting',
        description: 'Interactive charts for overall system usage, prediction trends, and user distribution.',
        tabId: 'analytics',
        permKey: 'VIEW_ANALYTICS',
        icon: BarChart3,
        accent: 'from-indigo-500 to-purple-600',
    },
    {
        id: 'logs',
        title: 'Prediction Logs & Audit',
        category: 'AI Diagnostics',
        description: 'View complete execution logs for AI Crop, Pest, and Yield model predictions.',
        tabId: 'logs',
        permKey: 'VIEW_PREDICTIONS',
        icon: BarChart3,
        accent: 'from-sky-500 to-blue-600',
    },
    {
        id: 'activity',
        title: 'Audit Activity Logs',
        category: 'Security & Compliance',
        description: 'Track all administrative changes, permission grants, user edits, and login events.',
        tabId: 'activity',
        permKey: 'VIEW_AUDIT_LOGS',
        icon: History,
        accent: 'from-rose-500 to-red-600',
    },
    {
        id: 'ml',
        title: 'ML Diagnostics & Model Health',
        category: 'AI Diagnostics',
        description: 'Inspect model accuracy, feature distributions, and Gaussian Naïve Bayes performance.',
        tabId: 'ml',
        permKey: 'VIEW_ML_DIAGNOSTICS',
        icon: SlidersHorizontal,
        accent: 'from-amber-600 to-yellow-600',
    },
    {
        id: 'profile',
        title: 'Admin Profile & Settings',
        category: 'Account Settings',
        description: 'Manage account security, personal credentials, active location, and system theme.',
        tabId: 'profile',
        icon: UserCircle,
        accent: 'from-gray-700 to-gray-900',
    },
];

const AdminFeaturesTab = ({ user, onSelectTab }) => {
    const navigate = useNavigate();

    const role = (user?.role || '').toLowerCase();
    const isPrimary = Boolean(user?.is_super_admin) || role === 'primary_admin' || role === 'superadmin';
    const perms = user?.permissions || {};

    const canAccess = (module) => {
        if (isPrimary) return true;
        if (module.primaryOnly) return false;
        if (!module.permKey) return true;
        return Boolean(perms[module.permKey]);
    };

    const handleNavigateModule = (module) => {
        if (!canAccess(module)) return;
        if (onSelectTab) {
            onSelectTab(module.tabId, module.roleFilter);
        } else {
            let path = `/admin?tab=${module.tabId}`;
            if (module.roleFilter) path += `&role=${module.roleFilter}`;
            navigate(path);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-900 via-emerald-950 to-eco-900 text-white p-8 md:p-10 shadow-xl border border-gray-800">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold mb-3">
                            {isPrimary ? (
                                <>
                                    <Crown className="h-3.5 w-3.5 text-amber-400" />
                                    <span>Primary Super Admin Workspace</span>
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                                    <span>Secondary Admin Permission-Gated Workspace</span>
                                </>
                            )}
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                            Administrative Modules Overview
                        </h1>
                        <p className="mt-2 text-xs md:text-sm text-gray-300 max-w-2xl">
                            Access all central system management modules. Available modules are dynamically filtered based on your JWT session and RBAC access permissions.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 text-xs space-y-1">
                        <p className="font-bold text-emerald-300">Active Role: {isPrimary ? 'Primary Admin' : 'Secondary Admin'}</p>
                        <p className="text-gray-300">User ID: <span className="font-mono text-white">{user?.user_id || user?.email}</span></p>
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ADMIN_MODULES.map((module) => {
                    const Icon = module.icon;
                    const allowed = canAccess(module);

                    return (
                        <div
                            key={module.id}
                            className={`rounded-2xl p-6 border transition-all duration-200 flex flex-col justify-between ${allowed
                                ? 'bg-white border-gray-100 shadow-xs hover:shadow-xl hover:-translate-y-1 group cursor-pointer'
                                : 'bg-gray-50/70 border-gray-200 opacity-60'
                                }`}
                            onClick={() => allowed && handleNavigateModule(module)}
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${allowed ? module.accent : 'from-gray-400 to-gray-500'} text-white shadow-md shadow-gray-200`}>
                                        <Icon className="h-6 w-6" />
                                    </div>

                                    {allowed ? (
                                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Active Module
                                        </span>
                                    ) : (
                                        <span
                                            className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1"
                                            title="Permission required. Contact Primary Admin to enable."
                                        >
                                            <Lock className="h-3 w-3 text-red-600" /> Restricted
                                        </span>
                                    )}
                                </div>

                                <div className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider mb-1">
                                    {module.category}
                                </div>
                                <h3 className={`text-base font-bold ${allowed ? 'text-gray-900 group-hover:text-eco-700' : 'text-gray-600'}`}>
                                    {module.title}
                                </h3>
                                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                    {module.description}
                                </p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-100">
                                {allowed ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNavigateModule(module);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-eco-50 hover:bg-eco-600 text-eco-700 hover:text-white font-bold text-xs transition-all duration-150 cursor-pointer shadow-xs group-hover:bg-eco-600 group-hover:text-white"
                                    >
                                        <span>Open Module</span>
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                ) : (
                                    <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-gray-400 py-2.5 px-4 bg-gray-100 rounded-xl">
                                        <Lock className="h-3.5 w-3.5 text-gray-400" />
                                        <span>Permission Required</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminFeaturesTab;
