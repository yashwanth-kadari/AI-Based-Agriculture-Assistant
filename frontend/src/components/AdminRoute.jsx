import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ user, children }) => {
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const role = (user.role || '').toLowerCase();
    const isAdmin =
        Boolean(user.is_super_admin) ||
        role === 'primary_admin' ||
        role === 'secondary_admin' ||
        role === 'superadmin' ||
        role === 'admin';

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default AdminRoute;
