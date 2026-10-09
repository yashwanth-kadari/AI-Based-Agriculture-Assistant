import React, { useState } from 'react';
import { UserPlus, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createAdminUser } from '../../utils/api';

export const CreateAccountModal = ({ currentUser, onClose, onCreated }) => {
    const [formData, setFormData] = useState({
        user_id: '',
        name: '',
        email: '',
        password: '',
        role: 'farmer',
        state: 'Andhra Pradesh',
        district: 'Guntur',
        phone: '',
        village: '',
        farm_size: '',
        main_crop: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isCallerPrimary = Boolean(
        currentUser?.is_super_admin ||
        (currentUser?.role || '').toLowerCase() === 'primary_admin' ||
        (currentUser?.role || '').toLowerCase() === 'superadmin'
    );

    const canCreateSecondary = isCallerPrimary || Boolean(currentUser?.permissions?.PROMOTE_FARMER);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.user_id || !formData.name || !formData.email || !formData.password) {
            setError('Please fill in all mandatory fields (User ID, Name, Email, Password).');
            setLoading(false);
            return;
        }

        try {
            const res = await createAdminUser(formData);
            if (onCreated) onCreated(res.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create user account.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-gray-100 overflow-hidden my-8">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-eco-900 via-eco-800 to-emerald-900 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                            <UserPlus className="h-6 w-6 text-eco-300" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Create New Account</h3>
                            <p className="text-xs text-eco-200 mt-0.5">Register a new user or admin account directly into AgriSmart</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-all">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">User ID *</label>
                            <input
                                type="text"
                                name="user_id"
                                value={formData.user_id}
                                onChange={handleChange}
                                placeholder="e.g. farmer_pb_01"
                                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-eco-500 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Gurpreet Singh"
                                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-eco-500 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="email@agrismart.in"
                                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-eco-500 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Password *</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Min 6 characters"
                                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-eco-500 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Role *</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 bg-white focus:ring-2 focus:ring-eco-500 focus:outline-none"
                            >
                                <option value="farmer">Farmer</option>
                                <option value="user">Standard User</option>
                                {canCreateSecondary && <option value="secondary_admin">Secondary Admin</option>}
                                {isCallerPrimary && <option value="primary_admin">Primary Admin</option>}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+91 9876543210"
                                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-eco-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-eco-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">District</label>
                            <input
                                type="text"
                                name="district"
                                value={formData.district}
                                onChange={handleChange}
                                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-eco-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Village</label>
                            <input
                                type="text"
                                name="village"
                                value={formData.village}
                                onChange={handleChange}
                                placeholder="e.g. Raikot"
                                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-eco-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Main Crop</label>
                            <input
                                type="text"
                                name="main_crop"
                                value={formData.main_crop}
                                onChange={handleChange}
                                placeholder="e.g. Wheat / Rice"
                                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-eco-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-eco-600 to-emerald-600 hover:from-eco-700 hover:to-emerald-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? 'Creating Account...' : 'CREATE ACCOUNT'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAccountModal;
