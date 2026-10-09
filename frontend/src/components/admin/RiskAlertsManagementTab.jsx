import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Plus, Search, ShieldAlert, CheckCircle2, Clock, Trash2, Edit3, X } from 'lucide-react';
import { getAdminAlerts, createAdminAlert, updateAdminAlert, deleteAdminAlert } from '../../utils/api';
import Pagination from '../Pagination';

const INDIAN_STATES = [
    'All', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const RiskAlertsManagementTab = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [severityFilter, setSeverityFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [showModal, setShowModal] = useState(false);
    const [editingAlert, setEditingAlert] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, severityFilter]);

    const [formData, setFormData] = useState({
        state: 'All',
        district: 'All',
        alert_type: 'Weather',
        severity: 'Medium',
        message: '',
        expiry_date: '',
        status: 'Active'
    });

    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await getAdminAlerts();
            setAlerts(data.alerts || []);
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to load risk alerts.' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    const openCreateModal = () => {
        setEditingAlert(null);
        setFormData({
            state: 'All',
            district: 'All',
            alert_type: 'Weather',
            severity: 'Medium',
            message: '',
            expiry_date: '',
            status: 'Active'
        });
        setShowModal(true);
    };

    const openEditModal = (alert) => {
        setEditingAlert(alert);
        setFormData({
            state: alert.state || 'All',
            district: alert.district || 'All',
            alert_type: alert.alert_type || 'Weather',
            severity: alert.severity || 'Medium',
            message: alert.message || '',
            expiry_date: alert.expiry_date ? alert.expiry_date.split('T')[0] : '',
            status: alert.status || 'Active'
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.message.trim()) {
            setFeedback({ type: 'error', message: 'Alert message content is required.' });
            return;
        }

        setSubmitting(true);
        try {
            if (editingAlert) {
                await updateAdminAlert(editingAlert.id, formData);
                setFeedback({ type: 'success', message: 'Risk alert updated successfully.' });
            } else {
                await createAdminAlert(formData);
                setFeedback({ type: 'success', message: 'New risk alert created and broadcasted.' });
            }
            setShowModal(false);
            fetchAlerts();
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to save risk alert.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleExpire = async (alertId) => {
        if (!window.confirm('Mark this risk alert as Expired? It will no longer affect farmer risk scores.')) return;
        try {
            await deleteAdminAlert(alertId);
            setFeedback({ type: 'success', message: 'Alert expired successfully.' });
            fetchAlerts();
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to expire alert.' });
        }
    };

    const filteredAlerts = alerts.filter(a => {
        const q = search.toLowerCase();
        const matchesSearch = (a.message || '').toLowerCase().includes(q) ||
            (a.state || '').toLowerCase().includes(q) ||
            (a.district || '').toLowerCase().includes(q) ||
            (a.alert_type || '').toLowerCase().includes(q);
        const matchesSeverity = severityFilter === 'All' || a.severity === severityFilter;
        return matchesSearch && matchesSeverity;
    });

    const getSeverityBadge = (sev) => {
        switch (sev) {
            case 'Critical': return 'bg-rose-100 text-rose-800 border-rose-300';
            case 'High': return 'bg-amber-100 text-amber-800 border-amber-300';
            case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            default: return 'bg-blue-100 text-blue-800 border-blue-300';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
                        <ShieldAlert className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Risk Alerts Management</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Broadcast, update, and expire regional weather, pest, disease, and market alerts for farmers.
                        </p>
                    </div>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                    <span>Create Risk Alert</span>
                </button>
            </div>

            {/* Feedback Alert */}
            {feedback.message && (
                <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                    <span>{feedback.message}</span>
                    <button onClick={() => setFeedback({ type: '', message: '' })} className="cursor-pointer">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center gap-3 justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search alerts by state, district, message..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs font-bold text-gray-500">Severity:</span>
                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none"
                    >
                        <option value="All">All Severities</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-2xl m-4">
                        <AlertTriangle className="h-10 w-10 text-rose-300 mx-auto mb-2" />
                        <p className="text-gray-700 font-bold text-sm">No risk alerts found.</p>
                        <p className="text-gray-400 text-xs mt-1">Create a new alert to notify regional farmers.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                        <th className="py-3.5 px-5">Target Region</th>
                                        <th className="py-3.5 px-5">Type</th>
                                        <th className="py-3.5 px-5">Severity</th>
                                        <th className="py-3.5 px-5">Alert Message</th>
                                        <th className="py-3.5 px-5">Expiry Date</th>
                                        <th className="py-3.5 px-5">Status</th>
                                        <th className="py-3.5 px-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
                                    {filteredAlerts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((a) => (
                                        <tr key={a.id} className="hover:bg-gray-50/70 transition-all">
                                            <td className="py-3.5 px-5 font-bold text-gray-900">
                                                {a.district || 'All'}, {a.state || 'All'}
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-gray-100 text-gray-800 border border-gray-200">
                                                    {a.alert_type || 'Weather'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getSeverityBadge(a.severity)}`}>
                                                    {a.severity || 'Medium'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-5 max-w-xs truncate text-gray-800">
                                                {a.message}
                                            </td>
                                            <td className="py-3.5 px-5 text-gray-500 font-mono">
                                                {a.expiry_date ? a.expiry_date.split('T')[0] : 'Never'}
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${(a.status || 'Active') === 'Active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                    {a.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-5 text-right space-x-2">
                                                <button
                                                    onClick={() => openEditModal(a)}
                                                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 transition-all cursor-pointer"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5 inline mr-1" /> Edit
                                                </button>
                                                {(a.status || 'Active') === 'Active' && (
                                                    <button
                                                        onClick={() => handleExpire(a.id)}
                                                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 transition-all cursor-pointer"
                                                    >
                                                        <Clock className="h-3.5 w-3.5 inline mr-1" /> Expire
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-gray-100">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(filteredAlerts.length / itemsPerPage)}
                                totalItems={filteredAlerts.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingAlert ? 'Edit Risk Alert' : 'Create New Risk Alert'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                                    <select
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
                                    >
                                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">District</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Guntur or All"
                                        value={formData.district}
                                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Alert Type</label>
                                    <select
                                        value={formData.alert_type}
                                        onChange={(e) => setFormData({ ...formData, alert_type: e.target.value })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
                                    >
                                        <option value="Weather">Weather</option>
                                        <option value="Pest">Pest Outbreak</option>
                                        <option value="Disease">Crop Disease</option>
                                        <option value="Market">Market Advisory</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Severity Level</label>
                                    <select
                                        value={formData.severity}
                                        onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Alert Message</label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter concise risk alert description for farmers..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Expiry Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={formData.expiry_date}
                                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Expired">Expired</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : (editingAlert ? 'Update Alert' : 'Create Alert')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RiskAlertsManagementTab;
