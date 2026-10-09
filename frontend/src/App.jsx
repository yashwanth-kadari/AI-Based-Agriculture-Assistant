import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CropRecommendation from './pages/CropRecommendation';
import PestPrediction from './pages/PestPrediction';
import YieldPrediction from './pages/YieldPrediction';
import MarketPrice from './pages/MarketPrice';
import SoilHealth from './pages/SoilHealth';
import FinancialPlanning from './pages/FinancialPlanning';
import RiskMonitoring from './pages/RiskMonitoring';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Marketplace from './pages/Marketplace';
import Community from './pages/Community';
import Sustainability from './pages/Sustainability';
import FarmerFeatures from './pages/FarmerFeatures';
import AdminDashboard from './pages/AdminDashboard';
import AdminRoute from './components/AdminRoute';
import { LocationProvider } from './context/LocationContext';

// ── 404 Page ────────────────────────────────────────────────────────────────
const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
    <p className="text-8xl font-black text-eco-100 mb-4">404</p>
    <h1 className="text-3xl font-bold text-gray-900 mb-3">Page Not Found</h1>
    <p className="text-gray-500 mb-8 max-w-md">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <Link
      to="/signup"
      className="bg-eco-600 hover:bg-eco-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
    >
      Go to Signup Page
    </Link>
  </div>
);

// ── App ──────────────────────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reset') === 'true') {
        localStorage.clear();
        sessionStorage.clear();
        window.history.replaceState({}, document.title, window.location.pathname);
        return null;
      }
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      return null;
    }
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (token) {
      localStorage.setItem('token', token);
    }
  };

  const handleLogout = () => {
    // Remove user-scoped location key before clearing storage so the next
    // user doesn't inherit this account's manual location override
    if (user?.id) {
      localStorage.removeItem(`location_${user.id}`);
    }
    if (user?.email) {
      localStorage.removeItem(`location_${user.email}`);
    }
    // Remove legacy global key (from old LocationContext)
    localStorage.removeItem('selectedLocation');
    setUser(null);
    localStorage.clear();
    sessionStorage.clear();
  };

  return (
    <LocationProvider user={user}>
      <Router>
        <div className="flex flex-col h-screen bg-gray-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
          <Navbar user={user} onLogout={handleLogout} onUserUpdate={(updatedUser) => handleLogin(updatedUser, localStorage.getItem('token'))} />

          <div className="flex flex-1 overflow-hidden">
            {user && <Sidebar user={user} />}

            <main className={`flex-1 overflow-y-auto ${user ? 'p-6 bg-gray-50' : ''}`}>
              <ErrorBoundary>
                <Routes>
                  {/* Default Root Path: Directs unauthenticated users straight to Signup */}
                  <Route
                    path="/"
                    element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/signup" replace />}
                  />

                  {/* Auth Routes */}
                  <Route
                    path="/signup"
                    element={!user ? <Signup onLogin={handleLogin} /> : <Navigate to="/dashboard" replace />}
                  />
                  <Route
                    path="/login"
                    element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" replace />}
                  />

                  {/* Public Info Routes */}
                  <Route path="/home" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />

                  {/* Protected Routes */}
                  <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/signup" replace />} />
                  <Route path="/crop-recommendation" element={user ? <CropRecommendation user={user} /> : <Navigate to="/signup" replace />} />
                  <Route path="/pest-prediction" element={user ? <PestPrediction user={user} /> : <Navigate to="/signup" replace />} />
                  <Route path="/yield-prediction" element={user ? <YieldPrediction user={user} /> : <Navigate to="/signup" replace />} />
                  <Route path="/market-price" element={user ? <MarketPrice user={user} /> : <Navigate to="/signup" replace />} />
                  <Route path="/soil-health" element={user ? <SoilHealth user={user} /> : <Navigate to="/signup" replace />} />
                  <Route path="/financial-planning" element={user ? <FinancialPlanning user={user} /> : <Navigate to="/signup" replace />} />
                  <Route path="/risk-monitoring" element={user ? <RiskMonitoring user={user} /> : <Navigate to="/signup" replace />} />
                  <Route path="/analytics" element={user ? <Analytics user={user} /> : <Navigate to="/signup" replace />} />
                  <Route path="/profile" element={user ? <Profile user={user} onLogin={handleLogin} /> : <Navigate to="/signup" replace />} />
                  <Route path="/marketplace" element={user ? <Marketplace user={user} /> : <Navigate to="/signup" replace />} />
                  <Route path="/community" element={user ? <Community user={user} /> : <Navigate to="/signup" replace />} />
                  <Route path="/sustainability" element={user ? <Sustainability user={user} /> : <Navigate to="/signup" replace />} />
                  <Route
                    path="/features"
                    element={
                      user ? (
                        (user.role || '').toLowerCase().includes('admin') || user.is_super_admin ? (
                          <Navigate to="/admin?tab=features" replace />
                        ) : (
                          <FarmerFeatures user={user} />
                        )
                      ) : (
                        <Navigate to="/signup" replace />
                      )
                    }
                  />

                  {/* Protected Admin Routes — all tab navigation happens via ?tab= query param */}
                  <Route path="/admin" element={<AdminRoute user={user}><AdminDashboard user={user} /></AdminRoute>} />
                  <Route path="/admin/dashboard" element={<AdminRoute user={user}><AdminDashboard user={user} /></AdminRoute>} />
                  <Route path="/admin/users" element={<AdminRoute user={user}><AdminDashboard user={user} /></AdminRoute>} />
                  <Route path="/admin/logs" element={<AdminRoute user={user}><AdminDashboard user={user} /></AdminRoute>} />
                  <Route path="/admin/ml" element={<AdminRoute user={user}><AdminDashboard user={user} /></AdminRoute>} />
                  <Route path="/admin/profile" element={<AdminRoute user={user}><AdminDashboard user={user} /></AdminRoute>} />
                  <Route path="/admin-users" element={<AdminRoute user={user}><AdminDashboard user={user} /></AdminRoute>} />

                  {/* 404 Catch-All */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </main>
          </div>
        </div>
      </Router>
    </LocationProvider>
  );
}

export default App;
