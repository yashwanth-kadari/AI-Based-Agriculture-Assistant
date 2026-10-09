import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sprout, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2, Loader2, ArrowRight, UserCheck, Briefcase } from 'lucide-react';
import Button from '../components/Button';
import { login } from '../utils/api';

const USER_ROLES = [
  { value: 'farmer', label: 'Farmer / Farm Owner' },
  { value: 'admin', label: 'Administrator (Primary / Secondary)' },
];

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({ email: '', password: '', role: 'farmer' });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('agri_remembered_email');
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
    if (location.state?.registered) {
      setSuccessMsg('Account created successfully! Auto-signing in...');
    }
  }, [location.state]);

  const handleChange = (e) => {
    setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password || !formData.role) {
      setError('Please enter your credentials and select your account role.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const { data } = await login({
        email: formData.email.trim(),
        user_id: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });

      if (rememberMe) {
        localStorage.setItem('agri_remembered_email', formData.email.trim());
      } else {
        localStorage.removeItem('agri_remembered_email');
      }

      setSuccessMsg('Sign in successful! Redirecting to dashboard...');
      onLogin(data.user, data.token);

      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
    } catch (err) {
      const apiError = err.response?.data?.error || err.response?.data?.message || 'Sign in failed. Please verify your credentials.';
      setError(apiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 bg-gradient-to-br from-emerald-950/5 via-green-50/50 to-teal-900/5">
      <div className="w-full max-w-md">

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-eco-600 to-emerald-500 rounded-2xl shadow-xl shadow-eco-600/20 mb-3 border border-white/40">
            <Sprout className="w-8 h-8 text-white animate-bounce-slow" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">AgriSmart AI</h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            Smart Agriculture Assistant & Advisory Platform
          </p>
        </div>

        {/* Auth Glassmorphism Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/60 p-8 space-y-6">

          {/* Mode Switcher Tabs */}
          <div className="flex bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200/60">
            <button
              type="button"
              className="flex-1 py-2 text-xs font-bold rounded-xl transition-all shadow-sm bg-white text-eco-700"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="flex-1 py-2 text-xs font-bold rounded-xl transition-all text-gray-500 hover:text-gray-900"
            >
              Create Account
            </button>
          </div>

          {/* Toast / Notification Banners */}
          {successMsg && (
            <div className="flex items-center gap-3 bg-emerald-50 text-emerald-800 p-3.5 rounded-2xl text-xs font-semibold border border-emerald-200/80 shadow-sm animate-fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 bg-red-50 text-red-700 p-3.5 rounded-2xl text-xs font-semibold border border-red-200/80 shadow-sm animate-fade-in">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Role Selection Dropdown */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 text-eco-600" />
                Select Account Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-eco-500 bg-white/80 font-medium text-gray-800 shadow-sm"
              >
                {USER_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* User ID / Email Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-eco-600" />
                Email Address or User ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. ramesh_123 or farmer@domain.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-eco-500 focus:border-transparent bg-white/70 transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-eco-500 focus:border-transparent bg-white/70 transition-all placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Quick Actions (Remember Me) */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-eco-600 focus:ring-eco-500 border-gray-300 transition-all"
                />
                <span className="font-medium">Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-eco-600 to-emerald-600 hover:from-eco-700 hover:to-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-eco-600/30 hover:shadow-eco-600/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer prompt */}
          <div className="text-center pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-medium">
              Don't have an account?{' '}
              <Link to="/signup" className="font-bold text-eco-600 hover:text-eco-700 underline underline-offset-2">
                Register as a Farmer
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Login;
