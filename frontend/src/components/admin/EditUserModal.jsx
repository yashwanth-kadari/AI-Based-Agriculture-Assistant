import React, { useState } from 'react';
import { Edit3, X, Save } from 'lucide-react';
import { updateAdminUser } from '../../utils/api';

const EditUserModal = ({ targetUser, onClose, onSaved }) => {
    const [name, setName] = useState(targetUser?.name || '');
    const [email, setEmail] = useState(targetUser?.email || '');
    const [phone, setPhone] = useState(targetUser?.phone || '');
    const [state, setState] = useState(targetUser?.state || 'Andhra Pradesh');
    const [district, setDistrict] = useState(targetUser?.district || 'Guntur');
    const [village, setVillage] = useState(targetUser?.village || '');
    const [farmSize, setFarmSize] = useState(targetUser?.farm_size || targetUser?.farmSize || '');
    const [mainCrop, setMainCrop] = useState(targetUser?.main_crop || targetUser?.mainCrop || '');

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) {
            setError('Name and Email are required.');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await updateAdminUser(targetUser.id, {
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                state: state.trim(),
                district: district.trim(),
                village: village.trim(),
                farm_size: farmSize ? parseFloat(farmSize) : null,
                main_crop: mainCrop.trim(),
            });
            onSaved();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update user. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-gray-100 overflow-hidden my-8">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-eco-600 to-emerald-700 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-xl">
                            <Edit3 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Edit Account Details</h3>
                            <p className="text-xs text-eco-100 font-mono">User ID: {targetUser?.user_id || `#${targetUser?.id}`}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full text-white/80 transition-colors cursor-pointer">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-eco-500 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-eco-500 bg-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="e.g. +91 9876543210"
                                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-eco-500 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                            <input
                                type="text"
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-eco-500 bg-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">District</label>
                            <input
                                type="text"
                                value={district}
                                onChange={(e) => setDistrict(e.target.value)}
                                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-eco-500 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Village / Town</label>
                            <input
                                type="text"
                                value={village}
                                onChange={(e) => setVillage(e.target.value)}
                                placeholder="e.g. Rampur"
                                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-eco-500 bg-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Farm Size (Acres)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={farmSize}
                                onChange={(e) => setFarmSize(e.target.value)}
                                placeholder="e.g. 5.5"
                                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-eco-500 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Main Crop</label>
                            <input
                                type="text"
                                value={mainCrop}
                                onChange={(e) => setMainCrop(e.target.value)}
                                placeholder="e.g. Wheat, Rice"
                                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-eco-500 bg-white"
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-eco-600 hover:bg-eco-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-60 cursor-pointer"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? 'Saving Changes…' : 'Save User Details'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;
