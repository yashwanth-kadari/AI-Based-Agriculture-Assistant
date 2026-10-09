import React from 'react';
import { Link } from 'react-router-dom';
import {
    Users, UserCheck, ShieldCheck, Crown, Activity,
    CheckCircle2, TrendingUp, AlertTriangle, BarChart3, Clock,
    UserPlus, Settings, History, ArrowUpRight
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

export const SystemOverviewTab = ({ stats }) => {
    const total = stats?.total_users || 0;
    const primaryCnt = stats?.total_primary_admins || stats?.role_distribution?.primary_admin || 0;
    const secondaryCnt = stats?.total_secondary_admins || stats?.role_distribution?.secondary_admin || 0;
    const farmerCnt = stats?.total_farmers || stats?.role_distribution?.farmer || 0;
    const userCnt = stats?.total_normal_users || stats?.role_distribution?.user || 0;
    const activeCnt = stats?.active_users || 0;
    const disabledCnt = stats?.disabled_users || 0;
    const predictionsCnt = stats?.total_predictions || 0;
    const reportsCnt = stats?.total_reports || 0;
    const recentActivity = stats?.recent_activity || [];

    // Live Pie Data directly from DB counts
    const pieData = [
        { name: 'Farmers', value: farmerCnt, color: '#10B981' },
        { name: 'Standard Users', value: userCnt, color: '#8B5CF6' },
        { name: 'Secondary Admins', value: secondaryCnt, color: '#3B82F6' },
        { name: 'Primary Admins', value: primaryCnt, color: '#F59E0B' },
    ];

    // Live 7-Day Trend Data directly from DB queries
    const trendData = (stats?.activity_trends && stats.activity_trends.length > 0)
        ? stats.activity_trends
        : [
            { day: 'Mon', predictions: 0, soilReports: 0, users: 0 },
            { day: 'Tue', predictions: 0, soilReports: 0, users: 0 },
            { day: 'Wed', predictions: 0, soilReports: 0, users: 0 },
            { day: 'Thu', predictions: 0, soilReports: 0, users: 0 },
            { day: 'Fri', predictions: 0, soilReports: 0, users: 0 },
            { day: 'Sat', predictions: 0, soilReports: 0, users: 0 },
            { day: 'Sun', predictions: predictionsCnt, soilReports: reportsCnt, users: total },
        ];

    return (
        <div className="space-y-6">
            {/* ── Quick Action Bar ───────────────────────────────────────────── */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Quick Administrative Actions</h3>
                    <p className="text-xs font-semibold text-gray-700 mt-0.5">Frequently used admin tools and access shortcuts</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        to="/admin?tab=users"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-all"
                    >
                        <Users className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Manage Users</span>
                    </Link>
                    <Link
                        to="/admin?tab=users&role=farmer"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition-all"
                    >
                        <UserCheck className="h-3.5 w-3.5 text-teal-600" />
                        <span>View Farmers</span>
                    </Link>
                    <Link
                        to="/admin?tab=create"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-eco-600 hover:bg-eco-700 text-white font-bold text-xs shadow-xs transition-all"
                    >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>+ Create Account</span>
                    </Link>
                    <Link
                        to="/admin?tab=permissions"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs border border-indigo-200 transition-all"
                    >
                        <Settings className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Edit Permissions</span>
                    </Link>
                    <Link
                        to="/admin?tab=activity"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs border border-purple-200 transition-all"
                    >
                        <History className="h-3.5 w-3.5 text-purple-600" />
                        <span>Audit Logs</span>
                    </Link>
                </div>
            </div>

            {/* ── Main Stats Grid ───────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Registered Users"
                    value={total}
                    sub="All Platform Accounts"
                    icon={Users}
                    color="eco"
                />
                <StatCard
                    label="Active Farmers"
                    value={farmerCnt}
                    sub="Registered Farmer Accounts"
                    icon={UserCheck}
                    color="emerald"
                />
                <StatCard
                    label="Secondary Admins"
                    value={secondaryCnt}
                    sub="Delegated Admin Access"
                    icon={ShieldCheck}
                    color="blue"
                />
                <StatCard
                    label="Primary Admins"
                    value={primaryCnt}
                    sub="Full System Privilege"
                    icon={Crown}
                    color="amber"
                />
            </div>

            {/* ── Secondary Stats Row ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Active Accounts"
                    value={activeCnt}
                    sub="In Good Standing"
                    icon={CheckCircle2}
                    color="teal"
                />
                <StatCard
                    label="Disabled Accounts"
                    value={disabledCnt}
                    sub="Suspended / Inactive"
                    icon={AlertTriangle}
                    color="red"
                />
                <StatCard
                    label="Total Predictions"
                    value={predictionsCnt}
                    sub="AI Crop Predictions Made"
                    icon={TrendingUp}
                    color="indigo"
                />
                <StatCard
                    label="Soil Reports"
                    value={reportsCnt}
                    sub="Soil Health Analyses"
                    icon={BarChart3}
                    color="purple"
                />
            </div>

            {/* ── Visual Charts Section ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Role Distribution Donut Chart */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-eco-600" />
                                User Role Distribution
                            </span>
                            <span className="text-[10px] font-bold bg-eco-50 text-eco-700 px-2.5 py-0.5 rounded-full">Real-time DB</span>
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">Live breakdown of database user roles</p>
                    </div>

                    <div className="h-56 my-2 relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={75}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(val, name) => [`${val} Accounts`, name]}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                        <span>Total Accounts: <strong>{total}</strong></span>
                        <Link to="/admin?tab=users" className="text-eco-600 font-bold hover:underline flex items-center gap-1 text-[11px]">
                            Manage Users <ArrowUpRight className="h-3 w-3" />
                        </Link>
                    </div>
                </div>

                {/* Prediction & Platform Activity Line Chart */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs lg:col-span-2 flex flex-col justify-between">
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-indigo-600" />
                                AI Prediction & Soil Analysis Activity Trends
                            </span>
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full">7 Days (Live)</span>
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">Daily AI crop recommendations vs soil health queries processed in DB</p>
                    </div>

                    <div className="h-56 my-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorSoil" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B7280' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
                                <Area type="monotone" dataKey="predictions" name="AI Predictions" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorPred)" />
                                <Area type="monotone" dataKey="soilReports" name="Soil Reports" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorSoil)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                        <span>Model: <strong>Gaussian Naïve Bayes (v2.4)</strong></span>
                        <Link to="/admin?tab=ml" className="text-indigo-600 font-bold hover:underline flex items-center gap-1 text-[11px]">
                            View ML Diagnostics <ArrowUpRight className="h-3 w-3" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── System RBAC Status & Recent Activity Row ─────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Security & RBAC Status */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        RBAC Privilege Architecture Summary
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                            <span className="font-bold text-amber-900 flex items-center gap-1 mb-1">
                                <Crown className="h-3.5 w-3.5 text-amber-600" /> Primary Superadmin
                            </span>
                            <p className="text-gray-500 text-[11px]">Full platform control. Can delegate admin access & assign user permissions.</p>
                        </div>
                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                            <span className="font-bold text-blue-900 flex items-center gap-1 mb-1">
                                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> Secondary Admin
                            </span>
                            <p className="text-gray-500 text-[11px]">Delegated module manager. Access controlled via specific granted permissions.</p>
                        </div>
                    </div>
                </div>

                {/* Audit Activity Stream */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-purple-600" />
                            Recent Admin Audit Stream
                        </span>
                        <Link to="/admin?tab=activity" className="text-xs text-purple-600 font-bold hover:underline">View All</Link>
                    </h4>
                    {recentActivity.length > 0 ? (
                        <div className="space-y-2.5">
                            {recentActivity.slice(0, 4).map((log, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                                        <div>
                                            <p className="font-bold text-gray-800">{log.action}</p>
                                            <p className="text-[11px] text-gray-400">By {log.admin_name} &bull; {log.target_user_email || 'System'}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-semibold text-gray-400">{log.created_at?.split('T')[0] || log.created_at?.split(' ')[0]}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 py-4 text-center">No recent admin activity logged in database.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, sub, icon: Icon, color }) => {
    const colorClasses = {
        eco: 'bg-eco-50 text-eco-600 border-eco-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        teal: 'bg-teal-50 text-teal-600 border-teal-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
    };

    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
            <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{value}</h3>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">{sub}</p>
            </div>
            <div className={`p-3.5 rounded-2xl border ${colorClasses[color] || colorClasses.eco}`}>
                <Icon className="h-6 w-6" />
            </div>
        </div>
    );
};

export default SystemOverviewTab;

