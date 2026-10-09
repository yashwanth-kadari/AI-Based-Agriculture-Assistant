import React from 'react';

/**
 * PermissionGuard renders children only if the logged-in user possesses
 * the required permission key or is the Primary Admin.
 */
export const PermissionGuard = ({ permission, user, children, fallback = null }) => {
    if (!user) return fallback;

    const role = (user.role || '').toLowerCase();
    const isPrimary = user.is_super_admin || role === 'primary_admin' || role === 'superadmin';

    if (isPrimary) {
        return children;
    }

    if (!permission) {
        return children;
    }

    const perms = user.permissions || {};
    const hasPerm = Array.isArray(perms)
        ? perms.includes(permission)
        : boolCheck(perms[permission]);

    if (hasPerm) {
        return children;
    }

    return fallback;
};

function boolCheck(val) {
    if (val === true || val === 1 || val === '1' || val === 'true') return true;
    return false;
}

export default PermissionGuard;
