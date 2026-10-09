import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, BarChart3, Sprout, Activity } from 'lucide-react';
import Card from '../Card';
import { AdminToast } from './AdminBadges';
import { getAdminLogs } from '../../utils/api';
import Pagination from '../Pagination';

const TYPE_META = {
    crop_prediction: { label: 'Crop Prediction', color: 'bg-eco-100 text-eco-700 border-eco-200' },
    user_activity: { label: 'User Activity', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    pest_prediction: { label: 'Pest Prediction', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    yield_prediction: { label: 'Yield Prediction', color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const PlatformLogsTab = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ type: '', message: '' });
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [search, typeFilter]);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await getAdminLogs({ type: typeFilter === 'all' ? undefined : typeFilter, q: search, limit: 100 });
            setLogs(data.logs || []);
        } catch (e) {
            setToast({ type: 'error', message: e.response?.data?.error || 'Failed to load logs.' });
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [typeFilter, search]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const handleSearch = (e) => { if (e.key === 'Enter') fetchLogs(); };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Platform Prediction Logs</h2>
                    <p className="text-gray-500 text-sm">All AI predictions and user activity events across the platform.</p>
                </div>
                <button onClick={fetchLogs} disabled={loading} className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-eco-600' : 'text-gray-400'}`} /> Refresh
                </button>
            </div>

            <AdminToast toast={toast} onDismiss={() => setToast({ type: '', message: '' })} />

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Logs', value: logs.length, icon: BarChart3, color: 'eco' },
                    { label: 'Crop Predictions', value: logs.filter(l => l.log_type === 'crop_prediction').length, icon: Sprout, color: 'blue' },
                    { label: 'Activity Events', value: logs.filter(l => l.log_type === 'user_activity').length, icon: Activity, color: 'purple' },
                    { label: 'Today\'s Events', value: logs.filter(l => l.created_at?.startsWith(new Date().toISOString().slice(0, 10))).length, icon: RefreshCw, color: 'amber' },
                ].map((item) => {
                    const ItemIcon = item.icon;
                    return (
                        <div key={item.label} className={`bg-${item.color}-50 border border-${item.color}-100 rounded-2xl p-4`}>
                            <div className={`text-${item.color}-600 mb-1`}><ItemIcon className="h-4 w-4" /></div>
                            <p className="text-2xl font-black text-gray-900">{item.value}</p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">{item.label}</p>
                        </div>
                    );
                })}
            </div>

            <Card>
                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-5 pb-4 border-b border-gray-100">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleSearch}
                            placeholder="Search farmer, crop, action… (Enter to search)"
                            className="pl-8 pr-3 py-1.5 w-full border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-eco-500 bg-white" />
                    </div>
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                        className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white text-gray-600">
                        <option value="all">All Event Types</option>
                        <option value="crop_prediction">Crop Predictions</option>
                        <option value="user_activity">User Activity</option>
                    </select>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-eco-600" /></div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
                        <BarChart3 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 font-bold text-sm">No activity logs found.</p>
                        <p className="text-gray-400 text-xs mt-1">Logs appear when farmers use AI features.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b border-gray-100">
                                        <th className="px-4 py-3 text-left">#</th>
                                        <th className="px-4 py-3 text-left">Event Type</th>
                                        <th className="px-4 py-3 text-left">Result / Crop</th>
                                        <th className="px-4 py-3 text-left">Confidence</th>
                                        <th className="px-4 py-3 text-left">Farmer ID</th>
                                        <th className="px-4 py-3 text-left">Account Holder</th>
                                        <th className="px-4 py-3 text-left">Date &amp; Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((log, idx) => {
                                        const meta = TYPE_META[log.log_type] || { label: log.log_type, color: 'bg-gray-100 text-gray-600 border-gray-200' };
                                        return (
                                            <tr key={`${log.id}-${idx}`} className="hover:bg-gray-50/60">
                                                <td className="px-4 py-3 text-xs text-gray-400 font-mono">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>{meta.label}</span>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-gray-900 capitalize">{log.result || '—'}</td>
                                                <td className="px-4 py-3 text-xs text-gray-600">
                                                    {log.confidence != null ? (
                                                        <div className="flex items-center gap-2">
                                                            <span>{Number(log.confidence).toFixed(1)}%</span>
                                                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                                                <div className="bg-eco-500 h-1.5 rounded-full" style={{ width: `${Math.min(log.confidence, 100)}%` }} />
                                                            </div>
                                                        </div>
                                                    ) : '—'}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs font-bold text-eco-700">{log.user_uid || '—'}</td>
                                                <td className="px-4 py-3 text-xs text-gray-700">{log.user_name || '—'}</td>
                                                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                                                    {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(logs.length / itemsPerPage)}
                                totalItems={logs.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};

export default PlatformLogsTab;
