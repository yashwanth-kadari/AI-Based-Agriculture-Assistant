import React, { useState, useEffect } from 'react';
import { FileText, Download, Users, BarChart3, TrendingUp, History, Filter, RefreshCw, CheckCircle, MapPin, Shield } from 'lucide-react';
import { getAdminReportsData, exportAdminReport } from '../../utils/api';

const SystemReportsTab = ({ user }) => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState('');
    const [dateFilter, setDateFilter] = useState('30d');
    const [activeSection, setActiveSection] = useState('all');
    const [toast, setToast] = useState('');

    const fetchReportsData = async () => {
        setLoading(true);
        try {
            const { data } = await getAdminReportsData();
            setReportData(data);
        } catch (e) {
            console.error("Failed to load reports data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportsData();
    }, []);

    const handleExport = async (type, filename) => {
        setExporting(type);
        setToast('');
        try {
            const response = await exportAdminReport(type);
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setToast(`Exported ${filename} successfully!`);
        } catch (e) {
            console.error("Export failed", e);
            setToast('Failed to export report CSV.');
        } finally {
            setExporting('');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-600" />
                <p className="text-gray-500 text-xs font-semibold mt-4">Generating System Reports...</p>
            </div>
        );
    }

    const { user_growth, prediction_volume, market_summary, audit_summary } = reportData || {};

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                        <FileText className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">System & Platform Reports</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Generate and download platform-wide data summaries, user growth metrics, and audit activity exports.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-700">
                        <Filter className="h-3.5 w-3.5 text-gray-500" />
                        <span className="font-semibold text-gray-600">Period:</span>
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="bg-transparent font-bold focus:outline-none cursor-pointer"
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>

                    <button
                        onClick={fetchReportsData}
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl border border-gray-200 transition-all cursor-pointer"
                        title="Refresh Reports Data"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {toast && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center justify-between font-semibold">
                    <span>✅ {toast}</span>
                    <button onClick={() => setToast('')} className="text-emerald-600 font-bold hover:underline">Dismiss</button>
                </div>
            )}

            {/* Quick Export Cards Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                            <Users className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                            {user_growth?.total_users || 0} Accounts
                        </span>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">User Growth Report</h4>
                        <p className="text-[11px] text-gray-500">Demographics, roles &amp; registration timestamps</p>
                    </div>
                    <button
                        onClick={() => handleExport('users', 'user_growth_report.csv')}
                        disabled={exporting === 'users'}
                        className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span>{exporting === 'users' ? 'Exporting...' : 'Export Users CSV'}</span>
                    </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                            {prediction_volume?.total_predictions || 0} Runs
                        </span>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">AI Predictions Report</h4>
                        <p className="text-[11px] text-gray-500">Crop, pest, NPK inputs &amp; confidence scores</p>
                    </div>
                    <button
                        onClick={() => handleExport('predictions', 'predictions_volume_report.csv')}
                        disabled={exporting === 'predictions'}
                        className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span>{exporting === 'predictions' ? 'Exporting...' : 'Export AI Predictions CSV'}</span>
                    </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                            {market_summary?.total_mandis || 0} Mandis
                        </span>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">Mandi Price Report</h4>
                        <p className="text-[11px] text-gray-500">State mandi directories &amp; commodity pricing</p>
                    </div>
                    <button
                        onClick={() => handleExport('mandis', 'mandis_directory_report.csv')}
                        disabled={exporting === 'mandis'}
                        className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-xl border border-amber-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span>{exporting === 'mandis' ? 'Exporting...' : 'Export Mandis CSV'}</span>
                    </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                            <History className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full">
                            {audit_summary?.total_audit_logs || 0} Logs
                        </span>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">Audit Activity Report</h4>
                        <p className="text-[11px] text-gray-500">Security event logs, edits &amp; admin actions</p>
                    </div>
                    <button
                        onClick={() => handleExport('audit_logs', 'system_audit_logs_report.csv')}
                        disabled={exporting === 'audit_logs'}
                        className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span>{exporting === 'audit_logs' ? 'Exporting...' : 'Export Audit Logs CSV'}</span>
                    </button>
                </div>
            </div>

            {/* Main Report Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* State Distribution Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-indigo-600" />
                            <h3 className="font-bold text-gray-900 text-sm">State Demographics Report</h3>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">Registered User Locations</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-100">
                                    <th className="py-2.5 px-3">State / Region</th>
                                    <th className="py-2.5 px-3 text-right">Registered Users</th>
                                    <th className="py-2.5 px-3 text-right">% Share</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {(user_growth?.state_distribution || []).map((s, idx) => {
                                    const total = user_growth?.total_users || 1;
                                    const pct = Math.round((s.count / total) * 100);
                                    return (
                                        <tr key={idx} className="hover:bg-gray-50/70">
                                            <td className="py-2.5 px-3 font-semibold text-gray-900">{s.state || 'Unspecified'}</td>
                                            <td className="py-2.5 px-3 text-right font-bold text-indigo-700">{s.count}</td>
                                            <td className="py-2.5 px-3 text-right font-mono text-gray-500">{pct}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* AI Feature Activity Breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-emerald-600" />
                            <h3 className="font-bold text-gray-900 text-sm">Feature Volume Summary</h3>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">Recorded Submissions</span>
                    </div>

                    <div className="space-y-3 text-xs">
                        {(prediction_volume?.prediction_types || []).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                    <span className="font-semibold text-gray-800">{item.feature}</span>
                                </div>
                                <span className="font-extrabold text-gray-900 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                                    {item.count} records
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Registered Users Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Recent User Registration Summary</h3>
                        <p className="text-xs text-gray-500">Latest platform additions and assigned system roles.</p>
                    </div>
                    <button
                        onClick={() => handleExport('users', 'all_users_report.csv')}
                        className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl border border-blue-200 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export Full User List</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                <th className="py-3 px-5">User ID</th>
                                <th className="py-3 px-5">Name</th>
                                <th className="py-3 px-5">Email</th>
                                <th className="py-3 px-5">Role</th>
                                <th className="py-3 px-5">State</th>
                                <th className="py-3 px-5">Status</th>
                                <th className="py-3 px-5">Registered Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                            {(user_growth?.recent_users || []).map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50/70">
                                    <td className="py-3 px-5 font-mono text-gray-600 font-semibold">{u.user_id}</td>
                                    <td className="py-3 px-5 font-bold text-gray-900">{u.name}</td>
                                    <td className="py-3 px-5 text-gray-500 font-mono">{u.email}</td>
                                    <td className="py-3 px-5">
                                        <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${u.role === 'primary_admin' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                                u.role === 'secondary_admin' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' :
                                                    'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-5 text-gray-600">{u.state || 'N/A'}</td>
                                    <td className="py-3 px-5">
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {u.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-5 text-gray-400 font-mono text-[11px]">{u.created_at}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SystemReportsTab;
