import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ArrowRight, ShieldCheck, UserCheck, MapPin } from 'lucide-react';
import { signup, login } from '../utils/api';
import { INDIAN_STATES, getDistrictsForState } from '../data/indianLocations';

const USER_ROLES = [
  { value: 'farmer', label: 'Farmer / Farm Owner' },
  { value: 'admin', label: 'System Administrator' },
];

const Signup = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    user_id: '',
    name: '',
    email: '',
    role: 'farmer',
    password: '',
    confirmPassword: '',
    state: '',
    district: '',
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    setError('');
    setFormData((prev) => ({
      ...prev,
      state: selectedState,
      district: '',
    }));
  };

  const validateForm = () => {
    if (!formData.user_id.trim()) return 'User ID is required';
    if (!formData.name.trim()) return 'Full Name is required';
    if (!formData.email.trim()) return 'Email Address is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) return 'Please enter a valid email address';
    if (!formData.state.trim() || !formData.district.trim()) return 'Please select your state and district';
    if (formData.password.length < 6) return 'Password must be at least 6 characters long';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const { data } = await signup({
        user_id: formData.user_id.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        state: formData.state.trim(),
        district: formData.district.trim(),
      });

      // Admin signup → pending approval, do NOT auto-login
      if (data?.pending_approval) {
        setSuccessMsg(
          'Admin account request submitted! The Primary Super Admin will review and approve your access. You will be able to sign in once approved.'
        );
        setFormData({ user_id: '', name: '', email: '', role: 'farmer', password: '', confirmPassword: '', state: '', district: '' });
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3500);
        return;
      }

      // Farmer signup → instant access
      setSuccessMsg('Account created successfully! Redirecting to dashboard...');

      if (data?.user && data?.token) {
        onLogin(data.user, data.token);
      } else {
        const loginRes = await login({
          email: formData.email.trim(),
          password: formData.password,
        });
        onLogin(loginRes.data.user, loginRes.data.token);
      }

      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
    } catch (err) {
      const apiError = err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please try again.';
      setError(apiError);
    } finally {
      setLoading(false);
    }
  };

  const passwordValid = formData.password.length >= 6;
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 bg-gradient-to-br from-emerald-950/5 via-green-50/50 to-teal-900/5">
      <div className="w-full max-w-md">

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-eco-600 to-emerald-500 rounded-2xl shadow-xl shadow-eco-600/20 mb-3 border border-white/40">
            <Sprout className="w-8 h-8 text-white animate-bounce-slow" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Join AgriSmart AI</h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            Smart Agriculture Platform & AI Advisory
          </p>
        </div>

        {/* Auth Glassmorphism Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/60 p-8 space-y-4">

          {/* Mode Switcher Tabs */}
          <div className="flex bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200/60">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex-1 py-2 text-xs font-bold rounded-xl transition-all text-gray-500 hover:text-gray-900"
            >
              Sign In
            </button>
            <button
              type="button"
              className="flex-1 py-2 text-xs font-bold rounded-xl transition-all shadow-sm bg-white text-eco-700"
            >
              Create Account
            </button>
          </div>

          {/* Toast Banners */}
          {successMsg && (
            <div className="flex items-center gap-3 bg-emerald-50 text-emerald-800 p-3.5 rounded-2xl text-xs font-semibold border border-emerald-200/80 shadow-sm animate-fade-in">
              <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 bg-red-50 text-red-700 p-3.5 rounded-2xl text-xs font-semibold border border-red-200/80 shadow-sm animate-fade-in">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Mandatory User ID */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-eco-600" />
                User ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="user_id"
                required
                value={formData.user_id}
                onChange={handleChange}
                placeholder="e.g. ramesh_123 or farmer_01"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 bg-white/70 ${error.includes('User ID')
                  ? 'border-red-400 focus:ring-red-500 bg-red-50/20'
                  : 'border-gray-200 focus:ring-eco-500'
                  }`}
              />
              {error.includes('User ID') && (
                <p className="text-[11px] font-bold text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Ramesh Patel"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-eco-500 bg-white/70"
              />
            </div>

            {/* Email Address & Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="farmer@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-eco-500 bg-white/70"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Account Role
                </label>
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-700 font-semibold flex items-center justify-between">
                  <span>Farmer / Farm Owner</span>
                  <span className="text-[10px] bg-eco-100 text-eco-800 px-2 py-0.5 rounded-full font-bold">Standard</span>
                </div>
              </div>
            </div>

            {/* Location (State & District Selection) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-eco-600" />
                  Indian State <span className="text-red-500">*</span>
                </label>
                <select
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleStateChange}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 bg-white/70 ${error.toLowerCase().includes('state') || error.toLowerCase().includes('district')
                    ? 'border-red-400 focus:ring-red-500 bg-red-50/20'
                    : 'border-gray-200 focus:ring-eco-500'
                    }`}
                >
                  <option value="">Select Indian State *</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  District / City <span className="text-red-500">*</span>
                </label>
                <select
                  name="district"
                  required
                  disabled={!formData.state}
                  value={formData.district}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 bg-white/70 ${error.toLowerCase().includes('district')
                    ? 'border-red-400 focus:ring-red-500 bg-red-50/20'
                    : 'border-gray-200 focus:ring-eco-500'
                    }`}
                >
                  <option value="">
                    {formData.state ? 'Select District / City *' : 'Select State First'}
                  </option>
                  {getDistrictsForState(formData.state).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 6 chars"
                    className="w-full px-3.5 py-2.5 pr-9 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-eco-500 bg-white/70"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-eco-500 bg-white/70"
                />
              </div>
            </div>

            {/* Inline Password Checks */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium pt-1 text-gray-400">
              <span className={`flex items-center gap-1 transition-colors ${passwordValid ? 'text-emerald-600 font-bold' : ''}`}>
                <CheckCircle className="h-3 w-3" />
                Min. 6 chars
              </span>
              <span className={`flex items-center gap-1 transition-colors ${passwordsMatch ? 'text-emerald-600 font-bold' : ''}`}>
                <CheckCircle className="h-3 w-3" />
                Passwords match
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-eco-600 to-emerald-600 hover:from-eco-700 hover:to-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-eco-600/30 hover:shadow-eco-600/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-75 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Start</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer prompt */}
          <div className="text-center pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-medium">
              Already registered?{' '}
              <Link to="/login" className="font-bold text-eco-600 hover:text-eco-700 underline underline-offset-2">
                Sign in here
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Signup;
