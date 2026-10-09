import React from 'react';
import { Crown, ShieldCheck, UserCheck, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export const RoleBadge = ({ u }) => {
    const role = (u?.role || '').toLowerCase();
    const isPrimary = u?.is_super_admin || role === 'primary_admin' || role === 'superadmin';

    if (isPrimary) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
                <Crown className="h-3 w-3 text-amber-600 flex-shrink-0" />
                <span>Primary Admin</span>
            </span>
        );
    }

    if (role === 'secondary_admin' || role === 'admin') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 shadow-xs">
                <ShieldCheck className="h-3 w-3 text-blue-600 flex-shrink-0" />
                <span>Secondary Admin</span>
            </span>
        );
    }

    if (role === 'user') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                <User className="h-3 w-3 text-purple-600 flex-shrink-0" />
                <span>User</span>
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <UserCheck className="h-3 w-3 text-emerald-600 flex-shrink-0" />
            <span>Farmer</span>
        </span>
    );
};

export const StatusBadge = ({ u }) => {
    const status = (u?.status || 'active').toLowerCase();

    if (status === 'disabled' || status === 'suspended') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-200">
                Disabled
            </span>
        );
    }

    if (status === 'pending') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Pending
            </span>
        );
    }

    if (status === 'rejected') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                Rejected
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Active
        </span>
    );
};

export const AdminToast = ({ toast, onDismiss }) => {
    if (!toast?.message) return null;
    const isErr = toast.type === 'error';
    return (
        <div className={`flex items-center justify-between p-3.5 rounded-2xl text-sm font-semibold border shadow-sm mb-4 ${isErr ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
            <div className="flex items-center gap-2.5">
                {isErr
                    ? <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    : <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />}
                <span>{toast.message}</span>
            </div>
            <button onClick={onDismiss} className="text-xs text-gray-400 hover:text-gray-600 font-bold ml-4 flex-shrink-0 cursor-pointer">✕</button>
        </div>
    );
};
