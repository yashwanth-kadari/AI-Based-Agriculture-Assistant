import React, { useState, useEffect } from 'react';
import { History, Shield, Clock, Search, RefreshCw } from 'lucide-react';
import { getAdminActivity } from '../../utils/api';
import Pagination from '../Pagination';

export const AdminActivityTab = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const fetchActivityLogs = async () => {
        setLoading(true);
        try {
            const res = await getAdminActivity({ limit: 100 });
            setLogs(res.data?.logs || []);
        } catch (err) {
            console.error('Failed to fetch activity logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivityLogs();
    }, []);

    const filteredLogs = logs.filter(l => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            (l.admin_name && l.admin_name.toLowerCase().includes(q)) ||
            (l.action && l.action.toLowerCase().includes(q)) ||
            (l.target_user_email && l.target_user_email.toLowerCase().includes(q)) ||
            (l.details && l.details.toLowerCase().includes(q))
        );
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <History className="h-5 w-5 text-eco-600" />
                        Admin System Audit Logs
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Complete server-side activity history of administrative role changes, permissions, and account modifications.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Filter activity logs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-eco-500 focus:outline-none w-48 sm:w-64"
                        />
                    </div>
                    <button
                        onClick={fetchActivityLogs}
                        className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                        title="Refresh Logs"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                <th className="py-3 px-4">Admin Name</th>
                                <th className="py-3 px-4">Action</th>
                                <th className="py-3 px-4">Target User</th>
                                <th className="py-3 px-4">Details</th>
                                <th className="py-3 px-4 text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-gray-400">Loading audit logs...</td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-gray-400">No activity logs recorded yet.</td>
                                </tr>
                            ) : (
                                filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(l => (
                                    <tr key={l.id} className="hover:bg-gray-50/60 transition-all">
                                        <td className="py-3 px-4 font-bold text-gray-900 flex items-center gap-2">
                                            <Shield className="h-3.5 w-3.5 text-eco-600" />
                                            {l.admin_name}
                                        </td>
                                        <td className="py-3 px-4 font-semibold text-eco-700">
                                            {l.action}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">
                                            {l.target_user_email || 'System'}
                                        </td>
                                        <td className="py-3 px-4 text-gray-500 text-[11px] max-w-xs truncate">
                                            {l.details}
                                        </td>
                                        <td className="py-3 px-4 text-right text-gray-400 text-[11px]">
                                            <span className="inline-flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {l.created_at}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {!loading && filteredLogs.length > 0 && (
                    <div className="p-4 border-t border-gray-100">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(filteredLogs.length / itemsPerPage)}
                            totalItems={filteredLogs.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminActivityTab;
