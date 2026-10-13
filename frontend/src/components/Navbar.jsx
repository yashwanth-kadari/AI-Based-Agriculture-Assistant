import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sprout, LogOut, User, Menu, X, MapPin, Check, Globe, Bell } from 'lucide-react';
import { useLocationContext } from '../context/LocationContext';
import { INDIAN_STATES, getDistrictsForState } from '../data/indianLocations';
import { updateProfile } from '../utils/api';

const Navbar = ({ user, onLogout, onUserUpdate }) => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const { location: activeLocation, setLocation } = useLocationContext();

  const [selectedState, setSelectedState] = useState(activeLocation.state || user?.state || 'Andhra Pradesh');
  const [selectedDistrict, setSelectedDistrict] = useState(activeLocation.district || user?.district || 'Guntur');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/signup', { replace: true });
  };

  const isActive = (path) => routerLocation.pathname === path;

  const handleStateChange = (e) => {
    const newState = e.target.value;
    setSelectedState(newState);
    const districts = getDistrictsForState(newState);
    setSelectedDistrict(districts[0] || '');
  };

  const handleSaveLocation = async (newState = selectedState, newDistrict = selectedDistrict) => {
    setLocation({ state: newState, district: newDistrict });
    setSaveSuccess(true);

    if (user?.id) {
      try {
        await updateProfile({ state: newState, district: newDistrict });
        const updatedUser = { ...user, state: newState, district: newDistrict };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (onUserUpdate) onUserUpdate(updatedUser);
      } catch {
        // silent fallback — location is still updated locally
      }
    }

    setTimeout(() => {
      setSaveSuccess(false);
      setLocationModalOpen(false);
    }, 600);
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-100 z-40 sticky top-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="bg-eco-600 p-1.5 rounded-lg">
                <Sprout className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 hidden sm:block tracking-tight">
                AgriSmart <span className="text-eco-600">AI</span>
              </span>
            </Link>

            {/* Desktop Nav Links (public) */}
            {!user && (
              <div className="hidden md:flex items-center gap-1">
                {[
                  { path: '/signup', label: 'Signup' },
                  { path: '/login', label: 'Sign In' },
                  { path: '/home', label: 'Features' },
                  { path: '/about', label: 'About' },
                  { path: '/contact', label: 'Contact' },
                ].map(({ path, label }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive(path)
                      ? 'text-eco-700 bg-eco-50 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}

            {/* Right side items container */}
            <div className="flex items-center gap-3">
              {/* Notification Bell Dropdown & Location Pill — shown only when authenticated */}
              {user && (
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Top-Right Location Pill */}
                  <button
                    onClick={() => {
                      const st = activeLocation.state || user?.state || 'Andhra Pradesh';
                      const dists = getDistrictsForState(st);
                      const dt = activeLocation.district || user?.district || dists[0] || 'Guntur';
                      setSelectedState(st);
                      setSelectedDistrict(dt);
                      setLocationModalOpen(true);
                    }}
                    className={`hidden sm:flex items-center gap-1.5 font-semibold text-xs px-3 py-1.5 rounded-full border shadow-xs transition-all duration-150 cursor-pointer ${activeLocation.state
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    title="Click to set your farm location"
                  >
                    <MapPin className={`h-3.5 w-3.5 flex-shrink-0 ${activeLocation.state ? 'text-emerald-600' : 'text-amber-500'}`} />
                    <span className="truncate max-w-[180px]">
                      {activeLocation.state && activeLocation.district
                        ? `${activeLocation.district}, ${activeLocation.state}`
                        : 'Set farm location'}
                    </span>
                  </button>

                  {/* Notification Bell Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setNotificationOpen(!notificationOpen)}
                      className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors relative cursor-pointer"
                      title="System Notifications"
                    >
                      <Bell className="h-5 w-5" />
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
                    </button>

                    {notificationOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">System Alerts & Activity</h4>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">3 New</span>
                        </div>
                        <div className="divide-y divide-gray-50 text-xs">
                          <div className="p-3 hover:bg-gray-50 transition-colors">
                            <p className="font-bold text-gray-800">New Farmer Registration</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">Gurpreet Singh registered from Ludhiana district.</p>
                            <span className="text-[10px] text-gray-400 mt-1 block">5 mins ago</span>
                          </div>
                          <div className="p-3 hover:bg-gray-50 transition-colors">
                            <p className="font-bold text-gray-800">Permission Granted</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">Primary Admin granted CREATE_USERS permission to Admin #2.</p>
                            <span className="text-[10px] text-gray-400 mt-1 block">30 mins ago</span>
                          </div>
                          <div className="p-3 hover:bg-gray-50 transition-colors">
                            <p className="font-bold text-gray-800">AI Model Health Verified</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">Gaussian Naïve Bayes crop prediction engine operates at 99.4% accuracy.</p>
                            <span className="text-[10px] text-gray-400 mt-1 block">2 hours ago</span>
                          </div>
                        </div>
                        <div className="px-4 py-2 border-t border-gray-100 text-center bg-gray-50/50">
                          <Link
                            to="/admin?tab=activity"
                            onClick={() => setNotificationOpen(false)}
                            className="text-[11px] font-bold text-eco-600 hover:text-eco-700"
                          >
                            View All Audit Activity Logs &rarr;
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="hidden sm:block text-sm font-semibold text-eco-600 hover:text-eco-700 px-3 py-2 rounded-lg hover:bg-eco-50 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-eco-600 hover:bg-eco-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs"
                  >
                    Register Now
                  </Link>
                  <button
                    className="md:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg"
                    onClick={() => setMobileOpen(!mobileOpen)}
                  >
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to={((user.role || '').toLowerCase().includes('admin') || user.is_super_admin) ? '/admin?tab=profile' : '/profile'}
                    className="flex items-center gap-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 pl-2 pr-3 py-1.5 rounded-full border border-gray-200 transition-colors"
                  >
                    <div className="w-7 h-7 bg-eco-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-eco-600" />
                    </div>
                    <span className="hidden sm:block max-w-[120px] truncate font-bold text-xs">{user.name}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:block">Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && !user && (
          <div className="md:hidden px-4 pb-4 border-t border-gray-100 bg-white">
            <div className="pt-3 space-y-1">
              {[
                { path: '/signup', label: 'Signup' },
                { path: '/login', label: 'Sign In' },
                { path: '/home', label: 'Features' },
                { path: '/about', label: 'About' },
                { path: '/contact', label: 'Contact' },
              ].map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav >

      {/* LOCATION SELECTION MODAL — authenticated users only */}
      {
        locationModalOpen && user && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 transform transition-all animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Select Active Farm Location</h3>
                    <p className="text-xs text-gray-500">Applies automatically across all AI models</p>
                  </div>
                </div>
                <button
                  onClick={() => setLocationModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 py-5">
                {/* Profile Location Info Banner */}
                {user?.state && user?.district && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span>Profile location: <strong>{user.district}, {user.state}</strong></span>
                  </div>
                )}

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink mx-3 text-[11px] font-bold text-gray-400 uppercase">Or Choose Manually</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                {/* State Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    State / Region
                  </label>
                  <select
                    value={selectedState}
                    onChange={handleStateChange}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    District / City
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {getDistrictsForState(selectedState).map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setLocationModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveLocation(selectedState, selectedDistrict)}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="h-4 w-4" /> Location Updated!
                    </>
                  ) : (
                    'Apply Location'
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </>
  );
};

export default Navbar;
