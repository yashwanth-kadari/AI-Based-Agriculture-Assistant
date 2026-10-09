import React from 'react';
import { ShieldAlert, ArrowRight, X } from 'lucide-react';
import { RoleBadge } from './AdminBadges';

export const RoleConfirmModal = ({ actionType, targetUser, onConfirm, onClose, loading }) => {
    if (!targetUser) return null;

    const isPromote = actionType === 'promote';
    const currentRole = (targetUser.role || 'farmer').toLowerCase();
    const newRole = isPromote ? 'secondary_admin' : 'farmer';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-gray-100 overflow-hidden my-8">
                <div className={`p-6 text-white flex items-center justify-between ${isPromote ? 'bg-gradient-to-r from-blue-700 to-indigo-800' : 'bg-gradient-to-r from-amber-700 to-red-800'}`}>
                    <div className="flex items-center gap-3">
                        <ShieldAlert className="h-6 w-6 text-white/90" />
                        <h3 className="text-lg font-bold">
                            {isPromote ? 'Confirm Role Promotion' : 'Confirm Role Demotion'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-white/80">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-xs text-gray-600 leading-relaxed">
                        {isPromote ? (
                            <>Are you sure you want to promote <span className="font-bold text-gray-900">{targetUser.name}</span> to <span className="font-bold text-blue-700">Secondary Admin</span>? They will gain administrative access to manage platform data.</>
                        ) : (
                            <>Are you sure you want to demote <span className="font-bold text-gray-900">{targetUser.name}</span> back to <span className="font-bold text-amber-700">Farmer</span>? Administrative privileges will be revoked.</>
                        )}
                    </p>

                    {/* Role Transition Preview Card */}
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                        <div className="text-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Current Role</span>
                            <RoleBadge u={{ role: currentRole }} />
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                        <div className="text-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">New Role</span>
                            <RoleBadge u={{ role: newRole }} />
                        </div>
                    </div>

                    <div className="pt-3 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => onConfirm(newRole)}
                            className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer ${isPromote ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                        >
                            {loading ? 'Updating...' : (isPromote ? 'PROMOTE USER' : 'DEMOTE USER')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoleConfirmModal;
