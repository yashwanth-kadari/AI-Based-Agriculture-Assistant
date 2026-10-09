import React, { useState, useEffect, useCallback } from 'react';
import { Sprout, Search, Plus, Edit3, Trash2, CheckCircle2, Star, X } from 'lucide-react';
import { getAdminCrops, createAdminCrop, updateAdminCrop, deleteAdminCrop } from '../../utils/api';

const CropManagementTab = () => {
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [showModal, setShowModal] = useState(false);
    const [editingCrop, setEditingCrop] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        category: 'Cereal',
        season: 'Kharif',
        sustainability_score: 4.5,
        avg_price: 2500,
        soil_type: 'Loamy',
        status: 'Active'
    });

    const fetchCrops = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await getAdminCrops();
            setCrops(data.crops || []);
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to load crops table.' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCrops();
    }, [fetchCrops]);

    const openCreateModal = () => {
        setEditingCrop(null);
        setFormData({
            name: '',
            category: 'Cereal',
            season: 'Kharif',
            sustainability_score: 4.5,
            avg_price: 2500,
            soil_type: 'Loamy',
            status: 'Active'
        });
        setShowModal(true);
    };

    const openEditModal = (crop) => {
        setEditingCrop(crop);
        setFormData({
            name: crop.name || '',
            category: crop.category || 'Cereal',
            season: crop.season || 'Kharif',
            sustainability_score: crop.sustainability_score ?? 4.5,
            avg_price: crop.avg_price ?? 2500,
            soil_type: crop.soil_type || 'Loamy',
            status: crop.status || 'Active'
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setFeedback({ type: 'error', message: 'Crop name is required.' });
            return;
        }

        setSubmitting(true);
        try {
            if (editingCrop) {
                await updateAdminCrop(editingCrop.id, formData);
                setFeedback({ type: 'success', message: `Crop "${formData.name}" updated successfully.` });
            } else {
                await createAdminCrop(formData);
                setFeedback({ type: 'success', message: `New crop "${formData.name}" added to system database.` });
            }
            setShowModal(false);
            fetchCrops();
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to save crop record.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCrop = async (cropId, name) => {
        if (!window.confirm(`Deactivate crop "${name}"?`)) return;
        try {
            await deleteAdminCrop(cropId);
            setFeedback({ type: 'success', message: `Crop "${name}" status set to Inactive.` });
            fetchCrops();
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to deactivate crop.' });
        }
    };

    const categories = ['All', ...Array.from(new Set(crops.map(c => c.category).filter(Boolean)))];

    const filteredCrops = crops.filter(c => {
        const q = search.toLowerCase();
        const matchesSearch = (c.name || '').toLowerCase().includes(q) ||
            (c.season || '').toLowerCase().includes(q) ||
            (c.soil_type || '').toLowerCase().includes(q);
        const matchesCat = categoryFilter === 'All' || c.category === categoryFilter;
        return matchesSearch && matchesCat;
    });

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                        <Sprout className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Crop Master Directory & Sustainability</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Manage crop catalog, ideal growing seasons, sustainability scores, baseline prices, and soil specifications.
                        </p>
                    </div>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add New Crop</span>
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

            {/* Search & Filters */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center gap-3 justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search crops by name, season, soil..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs font-bold text-gray-500">Category:</span>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none"
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Crops Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                    </div>
                ) : filteredCrops.length === 0 ? (
                    <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-2xl m-4">
                        <Sprout className="h-10 w-10 text-emerald-300 mx-auto mb-2" />
                        <p className="text-gray-700 font-bold text-sm">No crops found.</p>
                        <p className="text-gray-400 text-xs mt-1">Add new crops to expand AgriSmart AI recommendation catalog.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                    <th className="py-3.5 px-5">Crop Name</th>
                                    <th className="py-3.5 px-5">Category</th>
                                    <th className="py-3.5 px-5">Season</th>
                                    <th className="py-3.5 px-5">Avg Market Price</th>
                                    <th className="py-3.5 px-5">Soil Spec</th>
                                    <th className="py-3.5 px-5">Sustainability Rating</th>
                                    <th className="py-3.5 px-5">Status</th>
                                    <th className="py-3.5 px-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
                                {filteredCrops.map((c) => (
                                    <tr key={c.id || c.name} className="hover:bg-gray-50/70 transition-all">
                                        <td className="py-3.5 px-5 font-bold text-gray-900">
                                            {c.name}
                                        </td>
                                        <td className="py-3.5 px-5">
                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                {c.category || 'Cereal'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-5 font-bold text-gray-700">
                                            {c.season || 'Kharif'}
                                        </td>
                                        <td className="py-3.5 px-5 font-mono font-bold text-emerald-700">
                                            ₹{c.avg_price || '2,500'} <span className="text-gray-400 text-[10px] font-normal">/ Qtl</span>
                                        </td>
                                        <td className="py-3.5 px-5 text-gray-600">
                                            {c.soil_type || 'Loamy'}
                                        </td>
                                        <td className="py-3.5 px-5 font-bold text-amber-600">
                                            <span className="flex items-center gap-1">
                                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                                {c.sustainability_score || '4.5'} / 5.0
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-5">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${(c.status || 'Active') === 'Active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                {c.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-5 text-right space-x-2">
                                            <button
                                                onClick={() => openEditModal(c)}
                                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 transition-all cursor-pointer"
                                            >
                                                <Edit3 className="h-3.5 w-3.5 inline mr-1" /> Edit
                                            </button>
                                            {(c.status || 'Active') === 'Active' && (
                                                <button
                                                    onClick={() => handleDeleteCrop(c.id, c.name)}
                                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 transition-all cursor-pointer"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 inline mr-1" /> Deactivate
                                                </button>
                                            )}
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
                                {editingCrop ? `Edit Crop: ${editingCrop.name}` : 'Add New Crop Record'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Crop Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Cotton, Rice, Wheat"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
                                    >
                                        <option value="Cereal">Cereal</option>
                                        <option value="Pulse">Pulse / Legume</option>
                                        <option value="Cash Crop">Cash Crop</option>
                                        <option value="Horticulture">Horticulture</option>
                                        <option value="Oilseed">Oilseed</option>
                                        <option value="Commercial">Commercial</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Season</label>
                                    <select
                                        value={formData.season}
                                        onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
                                    >
                                        <option value="Kharif">Kharif (Monsoon)</option>
                                        <option value="Rabi">Rabi (Winter)</option>
                                        <option value="Zaid">Zaid (Summer)</option>
                                        <option value="Annual">Annual / Perennial</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Avg Market Price (₹/Qtl)</label>
                                    <input
                                        type="number"
                                        value={formData.avg_price}
                                        onChange={(e) => setFormData({ ...formData, avg_price: parseFloat(e.target.value) || 0 })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Sustainability Score (1-5)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        max="5.0"
                                        min="1.0"
                                        value={formData.sustainability_score}
                                        onChange={(e) => setFormData({ ...formData, sustainability_score: parseFloat(e.target.value) || 0 })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Ideal Soil Type</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Alluvial / Black Soil"
                                        value={formData.soil_type}
                                        onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
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
                                        <option value="Inactive">Inactive</option>
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
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : (editingCrop ? 'Update Crop' : 'Save Crop')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CropManagementTab;
