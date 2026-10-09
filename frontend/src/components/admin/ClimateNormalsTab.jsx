import React, { useState, useEffect, useCallback } from 'react';
import { Thermometer, Search, Edit3, Plus, CheckCircle2, X } from 'lucide-react';
import { getAdminClimateNormals, saveAdminClimateNormals } from '../../utils/api';

const ClimateNormalsTab = () => {
    const [normals, setNormals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        state: '',
        temperature: 28.5,
        humidity: 70.0,
        rainfall: 150.0
    });

    const fetchNormals = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await getAdminClimateNormals();
            setNormals(data.climate_normals || []);
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to load climate normals.' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNormals();
    }, [fetchNormals]);

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData({
            state: item.state || '',
            temperature: item.temperature ?? 28.5,
            humidity: item.humidity ?? 70.0,
            rainfall: item.rainfall ?? 150.0
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingItem(null);
        setFormData({
            state: '',
            temperature: 28.5,
            humidity: 70.0,
            rainfall: 150.0
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.state.trim()) {
            setFeedback({ type: 'error', message: 'State name is required.' });
            return;
        }

        setSubmitting(true);
        try {
            await saveAdminClimateNormals(formData, editingItem?.id);
            setFeedback({ type: 'success', message: `Climate normals saved for ${formData.state}.` });
            setShowModal(false);
            fetchNormals();
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to save climate normals.' });
        } finally {
            setSubmitting(false);
        }
    };

    const filteredNormals = normals.filter(n =>
        (n.state || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-sky-50 rounded-2xl text-sky-600">
                        <Thermometer className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Regional Climate Normals Management</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Manage state-wise baseline temperature (°C), humidity (%), and rainfall (mm) values used in AI auto-fill.
                        </p>
                    </div>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add State Normals</span>
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

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                <div className="relative w-full sm:w-80">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search state climate normals..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
                    </div>
                ) : filteredNormals.length === 0 ? (
                    <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-2xl m-4">
                        <Thermometer className="h-10 w-10 text-sky-300 mx-auto mb-2" />
                        <p className="text-gray-700 font-bold text-sm">No climate normals found.</p>
                        <p className="text-gray-400 text-xs mt-1">Add baseline climate records for Indian states.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                    <th className="py-3.5 px-5">Indian State</th>
                                    <th className="py-3.5 px-5">Avg Temp (°C)</th>
                                    <th className="py-3.5 px-5">Avg Humidity (%)</th>
                                    <th className="py-3.5 px-5">Annual Rainfall (mm)</th>
                                    <th className="py-3.5 px-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
                                {filteredNormals.map((n) => (
                                    <tr key={n.id || n.state} className="hover:bg-gray-50/70 transition-all">
                                        <td className="py-3.5 px-5 font-bold text-gray-900">
                                            {n.state}
                                        </td>
                                        <td className="py-3.5 px-5 font-mono font-bold text-amber-700">
                                            {n.temperature} °C
                                        </td>
                                        <td className="py-3.5 px-5 font-mono font-bold text-blue-700">
                                            {n.humidity} %
                                        </td>
                                        <td className="py-3.5 px-5 font-mono font-bold text-cyan-700">
                                            {n.rainfall} mm
                                        </td>
                                        <td className="py-3.5 px-5 text-right">
                                            <button
                                                onClick={() => openEditModal(n)}
                                                className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-lg border border-sky-200 transition-all cursor-pointer"
                                            >
                                                <Edit3 className="h-3.5 w-3.5 inline mr-1" /> Edit Baseline
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingItem ? `Edit Normals: ${editingItem.state}` : 'Add State Climate Normals'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">State Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Andhra Pradesh"
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
                                    disabled={Boolean(editingItem)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Temp (°C)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.temperature}
                                        onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0 })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Humidity (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.humidity}
                                        onChange={(e) => setFormData({ ...formData, humidity: parseFloat(e.target.value) || 0 })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Rainfall (mm)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.rainfall}
                                        onChange={(e) => setFormData({ ...formData, rainfall: parseFloat(e.target.value) || 0 })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold focus:outline-none"
                                        required
                                    />
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
                                    className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : 'Save Normals'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClimateNormalsTab;
