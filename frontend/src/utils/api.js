import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Interceptor to attach JWT token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle auth errors gracefully
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Authentication token invalid or expired. Clearing token.');
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (data) => API.post('/auth/login', data);
export const signup = (data) => API.post('/auth/signup', data);
export const updateProfile = (data) => API.put('/auth/profile', data);

// Admin Management
export const getAdminUsers = (params) => API.get('/admin/users', { params });
export const getAdminUser = (targetUserId) => API.get(`/admin/users/${targetUserId}`);
export const createAdminUser = (data) => API.post('/admin/users', data);
export const updateAdminUser = (targetUserId, data) => API.put(`/admin/users/${targetUserId}`, data);
export const updateUserRole = (targetUserId, role) => API.patch(`/admin/users/${targetUserId}/role`, { role });
export const updateUserStatus = (targetUserId, status) => API.patch(`/admin/users/${targetUserId}/status`, { status });
export const verifyUser = (targetUserId, status = 'active') => API.post('/admin/verify', { target_user_id: targetUserId, status });
export const promoteAdminUser = (targetUserId) => API.post('/admin/promote', { target_user_id: targetUserId });
export const demoteAdminUser = (targetUserId) => API.post('/admin/demote', { target_user_id: targetUserId });
export const suspendUser = (targetUserId, status = 'disabled') => API.post('/admin/suspend', { target_user_id: targetUserId, status });
export const deleteAdminUser = (targetUserId) => API.delete(`/admin/users/${targetUserId}`);
export const getUserPermissions = (targetUserId) => API.get(`/admin/users/${targetUserId}/permissions`);
export const updateUserPermissions = (targetUserId, permissions) => API.put(`/admin/users/${targetUserId}/permissions`, { permissions });
export const getMasterPermissions = () => API.get('/admin/permissions');
export const getAdminActivity = (params) => API.get('/admin/activity', { params });
export const getAdminStats = () => API.get('/admin/statistics');
export const getAdminLogs = (params) => API.get('/admin/logs', { params });
export const resetUserPassword = (targetUserId, newPassword) => API.post('/auth/reset-password', { target_user_id: targetUserId, new_password: newPassword });

// Extended Admin Management APIs
export const getAdminMLStatus = () => API.get('/admin/ml-status');
export const reloadMLModels = () => API.post('/admin/ml/reload');

export const getSystemSettingsInfo = () => API.get('/admin/settings/info');
export const verifyModelWeights = () => API.post('/admin/settings/verify-models');
export const exportAuditLogs = () => API.get('/admin/settings/export-audit-logs', { responseType: 'blob' });

export const getAdminReportsData = () => API.get('/admin/reports/data');
export const exportAdminReport = (type = 'users') => API.get(`/admin/reports/export?type=${type}`, { responseType: 'blob' });
export const getAdminAnalyticsData = () => API.get('/admin/analytics/data');

export const getAdminAlerts = () => API.get('/admin/alerts');
export const createAdminAlert = (data) => API.post('/admin/alerts', data);
export const updateAdminAlert = (id, data) => API.put(`/admin/alerts/${id}`, data);
export const deleteAdminAlert = (id) => API.delete(`/admin/alerts/${id}`);

export const getAdminMarketplaceItems = () => API.get('/admin/marketplace/items');
export const updateAdminMarketplaceItem = (id, data) => API.put(`/admin/marketplace/items/${id}`, data);
export const deleteAdminMarketplaceItem = (id) => API.delete(`/admin/marketplace/items/${id}`);

export const getAdminCommunityPosts = () => API.get('/admin/community/posts');
export const deleteAdminCommunityPost = (id) => API.delete(`/admin/community/posts/${id}`);
export const deleteAdminCommunityComment = (id) => API.delete(`/admin/community/comments/${id}`);

export const getAdminClimateNormals = () => API.get('/admin/climate-normals');
export const saveAdminClimateNormals = (data, id) => id ? API.put(`/admin/climate-normals/${id}`, data) : API.post('/admin/climate-normals', data);

export const getAdminCrops = () => API.get('/admin/crops');
export const createAdminCrop = (data) => API.post('/admin/crops', data);
export const updateAdminCrop = (id, data) => API.put(`/admin/crops/${id}`, data);
export const deleteAdminCrop = (id) => API.delete(`/admin/crops/${id}`);

// Predictions
export const predictCrop = (data) => API.post('/predictions/crop', data);
export const predictPest = (data) => API.post('/predictions/pest', data);
export const predictYield = (data) => API.post('/predictions/yield', data);
export const getMarketHistory = (userId, crop) =>
  API.get(`/predictions/market-history?user_id=${userId}&crop=${crop}`);

// Mandi & Market Price Management APIs
export const getMandis = (params) => API.get('/market/mandis', { params });
export const createMandi = (data) => API.post('/market/mandis', data);
export const updateMandi = (id, data) => API.put(`/market/mandis/${id}`, data);
export const deleteMandi = (id) => API.delete(`/market/mandis/${id}`);

export const getMarketPrices = (params) => API.get('/market/prices', { params });
export const addMarketPrice = (data) => API.post('/market/prices', data);
export const updateMarketPrice = (id, data) => API.put(`/market/prices/${id}`, data);
export const deleteMarketPrice = (id) => API.delete(`/market/prices/${id}`);
export const getMandiPriceHistory = (params) => API.get('/market/history', { params });

// Time-Series Market Forecast APIs
export const getMarketForecast = (data) => API.post('/market/forecast', data);
export const getMarketForecastHistory = (params) => API.get('/market/forecast/history', { params });


// Dashboard & History
export const getDashboardData = (userId) =>
  API.get(`/dashboard/data${userId ? `?user_id=${userId}` : ''}`);
export const getUserHistory = (userId) => API.get(`/history/?user_id=${userId}`);

// Soil Health
export const analyzeSoil = (data) => API.post('/soil/analyze', data);
export const getSoilReports = (userId) => API.get(`/soil/reports?user_id=${userId}`);

// Financial Planning
export const calculateFinancials = (data) => API.post('/financial/calculate', data);
export const getFinancialSummary = (userId) => API.get(`/financial/summary?user_id=${userId}`);

// Risk Monitoring
export const getRiskStatus = (userId) => API.get(`/risk/status?user_id=${userId}`);

// Analytics & Reports
export const getAnalytics = (params) => {
  if (typeof params === 'object') {
    return API.get('/reports/analytics', { params });
  }
  return API.get(`/reports/analytics?user_id=${params}`);
};
export const addFinancialRecord = (data) => API.post('/reports/financials', data);
export const addYieldRecord = (data) => API.post('/reports/yields', data);
export const downloadReport = (userId, type, period = 'all', crop = 'all') =>
  API.get(`/reports/download?user_id=${userId}&type=${type}&period=${period}&crop=${crop}`, { responseType: 'blob' });


// Contact
export const submitContact = (data) => API.post('/contact/submit', data);

// Marketplace
export const getMarketplaceItems = (paramsOrCategory, search) => {
  if (typeof paramsOrCategory === 'object' && paramsOrCategory !== null) {
    return API.get('/marketplace/items', { params: paramsOrCategory });
  }
  return API.get('/marketplace/items', { params: { category: paramsOrCategory, q: search } });
};
export const addMarketplaceItem = (data) => API.post('/marketplace/items', data);
export const deleteMarketplaceItem = (itemId, userId) =>
  API.delete(`/marketplace/items/${itemId}`, { params: { user_id: userId } });

// Community
export const getCommunityPosts = () => API.get('/community/posts');
export const createCommunityPost = (data) => API.post('/community/posts', data);
export const getCommunityPostDetails = (postId) => API.get(`/community/posts/${postId}`);
export const addCommunityReply = (postId, data) =>
  API.post(`/community/posts/${postId}/replies`, data);

// Sustainability
export const getSustainabilityPractices = () => API.get('/sustainability/practices');
export const submitSustainabilityAudit = (data) => API.post('/sustainability/audit', data);

// History Helpers
export const getCropHistory = (userId) => API.get('/predictions/crop/history', { params: { user_id: userId } });
export const getPestHistory = (userId) => API.get('/predictions/pest/history', { params: { user_id: userId } });
export const getYieldHistory = (userId) => API.get('/predictions/yield/history', { params: { user_id: userId } });
export const getFinancialHistory = (userId) => API.get('/financial/history', { params: { user_id: userId } });
export const getSustainabilityHistory = (userId) => API.get('/sustainability/history', { params: { user_id: userId } });

export default API;

