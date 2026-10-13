import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// ── Request interceptor: attach JWT token ────────────────────────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'undefined' && token !== 'null' && token.trim() !== '') {
    config.headers.Authorization = `Bearer ${token.trim()}`;
  }
  return config;
});

// ── Response interceptor: clear bad/expired tokens ──────────────────────────
// 401 = token invalid/expired, 422 = token present but malformed/missing
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 422) {
      const msg = error.response?.data?.msg || '';
      // Only clear on genuine auth failures, not on business-logic 401s
      if (
        status === 422 ||
        msg.includes('expired') ||
        msg.includes('signature') ||
        msg.includes('Not enough segments') ||
        msg.includes('Missing Authorization')
      ) {
        console.warn(`[API] Auth failure (${status}): ${msg} — clearing token`);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const login = (data) => API.post('/auth/login', data);
export const signup = (data) => API.post('/auth/signup', data);
// Profile update: do NOT send user_id — backend reads it from the JWT
export const updateProfile = (data) => {
  const { user_id, id, ...rest } = data; // strip any id fields
  return API.put('/auth/profile', rest);
};

// ── Admin Management ─────────────────────────────────────────────────────────
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

// ── Predictions ───────────────────────────────────────────────────────────────
// user_id is NOT sent — the backend reads it from the JWT via verify_jwt_in_request(optional=True)
export const predictCrop = (data) => {
  const { user_id, ...rest } = data;
  return API.post('/predictions/crop', rest);
};
export const predictPest = (data) => {
  const { user_id, ...rest } = data;
  return API.post('/predictions/pest', rest);
};
export const predictYield = (data) => {
  const { user_id, ...rest } = data;
  return API.post('/predictions/yield', rest);
};
// Kept for compatibility — no longer sends user_id
export const getMarketHistory = (crop) => API.get(`/predictions/market-history?crop=${crop}`);

// ── Mandi & Market Price Management ──────────────────────────────────────────
export const getMandis = (params) => API.get('/market/mandis', { params });
export const createMandi = (data) => API.post('/market/mandis', data);
export const updateMandi = (id, data) => API.put(`/market/mandis/${id}`, data);
export const deleteMandi = (id) => API.delete(`/market/mandis/${id}`);
export const getMarketPrices = (params) => API.get('/market/prices', { params });
export const addMarketPrice = (data) => API.post('/market/prices', data);
export const updateMarketPrice = (id, data) => API.put(`/market/prices/${id}`, data);
export const deleteMarketPrice = (id) => API.delete(`/market/prices/${id}`);
export const getMandiPriceHistory = (params) => API.get('/market/history', { params });

// Time-Series Market Forecast — user_id from JWT (optional), not query param
export const getMarketForecast = (data) => API.post('/market/forecast', data);
export const getMarketForecastHistory = (params) => {
  // Strip user_id — backend reads from JWT
  const { user_id, ...rest } = params || {};
  return API.get('/market/forecast/history', { params: rest });
};

// ── Dashboard & History ───────────────────────────────────────────────────────
// User ID comes from the JWT — do NOT pass it as a query param
export const getDashboardData = () => API.get('/dashboard/data');
export const getUserHistory = () => API.get('/history/');

// ── Soil Health ───────────────────────────────────────────────────────────────
// user_id stripped — backend reads from JWT via verify_jwt_in_request(optional=True)
export const analyzeSoil = (data) => {
  const { user_id, ...rest } = data;
  return API.post('/soil/analyze', rest);
};
export const getSoilReports = () => API.get('/soil/reports');

// ── Financial Planning ────────────────────────────────────────────────────────
export const calculateFinancials = (data) => {
  const { user_id, ...rest } = data || {};
  return API.post('/financial/calculate', rest);
};
export const getFinancialSummary = () => API.get('/financial/summary');

// ── Risk Monitoring ───────────────────────────────────────────────────────────
// user_id from JWT — do NOT pass as query param
export const getRiskStatus = () => API.get('/risk/status');

// ── Analytics & Reports ───────────────────────────────────────────────────────
export const getAnalytics = (params) => {
  if (typeof params === 'object' && params !== null) {
    const { user_id, ...rest } = params;
    return API.get('/reports/analytics', { params: rest });
  }
  // Legacy: caller passed user_id as first arg — ignore it
  return API.get('/reports/analytics');
};
export const addFinancialRecord = (data) => {
  const { user_id, ...rest } = data || {};
  return API.post('/reports/financials', rest);
};
export const addYieldRecord = (data) => {
  const { user_id, ...rest } = data || {};
  return API.post('/reports/yields', rest);
};
export const downloadReport = (type, period = 'all', crop = 'all') =>
  API.get(`/reports/download?type=${type}&period=${period}&crop=${crop}`, { responseType: 'blob' });

// ── Contact ───────────────────────────────────────────────────────────────────
export const submitContact = (data) => API.post('/contact/submit', data);

// ── Marketplace ───────────────────────────────────────────────────────────────
export const getMarketplaceItems = (paramsOrCategory, search) => {
  if (typeof paramsOrCategory === 'object' && paramsOrCategory !== null) {
    const { user_id, ...rest } = paramsOrCategory;
    return API.get('/marketplace/items', { params: rest });
  }
  return API.get('/marketplace/items', { params: { category: paramsOrCategory, q: search } });
};
export const addMarketplaceItem = (data) => {
  const { user_id, ...rest } = data || {};
  return API.post('/marketplace/items', rest);
};
// user_id is NOT passed — backend reads from JWT
export const deleteMarketplaceItem = (itemId) => API.delete(`/marketplace/items/${itemId}`);

// ── Community ─────────────────────────────────────────────────────────────────
export const getCommunityPosts = () => API.get('/community/posts');
export const createCommunityPost = (data) => {
  const { user_id, ...rest } = data || {};
  return API.post('/community/posts', rest);
};
export const getCommunityPostDetails = (postId) => API.get(`/community/posts/${postId}`);
export const addCommunityReply = (postId, data) => {
  const { user_id, ...rest } = data || {};
  return API.post(`/community/posts/${postId}/replies`, rest);
};

// ── Sustainability ────────────────────────────────────────────────────────────
export const getSustainabilityPractices = () => API.get('/sustainability/practices');
export const submitSustainabilityAudit = (data) => {
  const { user_id, ...rest } = data;
  return API.post('/sustainability/audit', rest);
};

// ── History Helpers ───────────────────────────────────────────────────────────
// All use JWT — no user_id param needed
export const getCropHistory = () => API.get('/predictions/crop/history');
export const getPestHistory = () => API.get('/predictions/pest/history');
export const getYieldHistory = () => API.get('/predictions/yield/history');
export const getFinancialHistory = () => API.get('/financial/history');
export const getSustainabilityHistory = () => API.get('/sustainability/history');

// ── Weather Forecast ──────────────────────────────────────────────────────────
export const getWeatherForecast = (params) => API.get('/weather/forecast', { params });

// ── Expert Advice & Consultations ─────────────────────────────────────────────
export const getExpertConsultations = (params) => API.get('/expert/consultations', { params });
export const submitExpertConsultation = (data) => {
  const { user_id, ...rest } = data || {};
  return API.post('/expert/consultations', rest);
};
export const replyExpertConsultation = (id, data) => {
  const { user_id, ...rest } = data || {};
  return API.post(`/expert/consultations/${id}/reply`, rest);
};
export const deleteExpertConsultation = (id) => API.delete(`/expert/consultations/${id}`);

export default API;
