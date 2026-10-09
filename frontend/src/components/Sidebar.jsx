import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Sprout, Bug, Tractor, TrendingUp, Droplet,
  Wallet, AlertTriangle, BarChart3, UserCircle, ShoppingBag,
  MessageSquare, Leaf, ShieldCheck, Users, Crown, SlidersHorizontal,
  History, UserPlus, Settings, LogOut, FileText, Activity, Shield, Sparkles,
  Thermometer, ShieldAlert
} from 'lucide-react';

const Sidebar = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const role = (user?.role || '').toLowerCase();
  const isPrimary = Boolean(user?.is_super_admin) || role === 'primary_admin' || role === 'superadmin';
  const isSecondary = role === 'secondary_admin' || role === 'admin';
  const isAdmin = isPrimary || isSecondary;
  const perms = user?.permissions || {};

  const queryParams = new URLSearchParams(location.search);
  const activeAdminTab = queryParams.get('tab') || 'overview';
  const activeRoleFilter = queryParams.get('role') || '';

  const hasPerm = (key) => isPrimary || Boolean(perms[key]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/signup', { replace: true });
    window.location.reload();
  };

  // ── Admin Sidebar Group Definitions ──────────────────────────────────────────
  const adminMainItems = [
    { name: 'Dashboard', to: '/admin?tab=overview', tabId: 'overview', icon: LayoutDashboard },
    { name: 'Module Features Hub', to: '/admin?tab=features', tabId: 'features', icon: Sparkles },
  ];
  if (hasPerm('VIEW_USERS') || hasPerm('MANAGE_USERS') || hasPerm('VIEW_FARMERS') || isPrimary) {
    adminMainItems.push({ name: 'All Users', to: '/admin?tab=users', tabId: 'users', icon: Users });
  }

  const adminAdministrationItems = [];
  if (isPrimary) {
    adminAdministrationItems.push({ name: 'Permissions Matrix', to: '/admin?tab=permissions', tabId: 'permissions', icon: Settings });
  }
  if (hasPerm('CREATE_USERS') || hasPerm('CAN_CREATE_ACCOUNTS') || isPrimary) {
    adminAdministrationItems.push({ name: 'Account Creation Suite', to: '/admin?tab=create', tabId: 'create', icon: UserPlus });
  }
  if (hasPerm('MANAGE_MARKET_PRICES') || isPrimary) {
    adminAdministrationItems.push({ name: 'Market Prices & Mandis', to: '/admin?tab=market', tabId: 'market', icon: TrendingUp });
  }
  if (hasPerm('MANAGE_CROPS') || isPrimary) {
    adminAdministrationItems.push({ name: 'Crop Master Directory', to: '/admin?tab=crops', tabId: 'crops', icon: Sprout });
  }
  if (hasPerm('MANAGE_CLIMATE_NORMALS') || isPrimary) {
    adminAdministrationItems.push({ name: 'Climate Normals', to: '/admin?tab=climate_normals', tabId: 'climate_normals', icon: Thermometer });
  }

  const adminModerationItems = [];
  if (hasPerm('MANAGE_ALERTS') || isPrimary) {
    adminModerationItems.push({ name: 'Risk Alerts & Advisories', to: '/admin?tab=risk_alerts', tabId: 'risk_alerts', icon: ShieldAlert });
  }
  if (hasPerm('MANAGE_MARKETPLACE') || isPrimary) {
    adminModerationItems.push({ name: 'Marketplace Moderation', to: '/admin?tab=marketplace_mod', tabId: 'marketplace_mod', icon: ShoppingBag });
  }
  if (hasPerm('MANAGE_SUPPORT') || isPrimary) {
    adminModerationItems.push({ name: 'Community Moderation', to: '/admin?tab=community_mod', tabId: 'community_mod', icon: MessageSquare });
  }

  const adminAnalyticsItems = [];
  if (hasPerm('VIEW_REPORTS') || hasPerm('GENERATE_REPORTS') || isPrimary) {
    adminAnalyticsItems.push({ name: 'System Reports', to: '/admin?tab=reports', tabId: 'reports', icon: FileText });
  }
  if (hasPerm('VIEW_ANALYTICS') || isPrimary) {
    adminAnalyticsItems.push({ name: 'Platform Analytics', to: '/admin?tab=analytics', tabId: 'analytics', icon: Activity });
  }

  const adminSystemItems = [];
  if (hasPerm('VIEW_PREDICTIONS') || hasPerm('VIEW_PREDICTION_LOGS') || isPrimary) {
    adminSystemItems.push({ name: 'Prediction Logs', to: '/admin?tab=logs', tabId: 'logs', icon: BarChart3 });
  }
  if (hasPerm('VIEW_AUDIT_LOGS') || isPrimary) {
    adminSystemItems.push({ name: 'Audit Activity Logs', to: '/admin?tab=activity', tabId: 'activity', icon: History });
  }
  if (hasPerm('VIEW_ML_DIAGNOSTICS') || isPrimary) {
    adminSystemItems.push({ name: 'ML Diagnostics', to: '/admin?tab=ml', tabId: 'ml', icon: SlidersHorizontal });
  }
  if (hasPerm('VIEW_SYSTEM_SETTINGS') || isPrimary) {
    adminSystemItems.push({ name: 'System Settings', to: '/admin?tab=settings', tabId: 'settings', icon: Settings });
  }

  const adminAccountItems = [
    { name: 'Admin Profile', to: '/admin?tab=profile', tabId: 'profile', icon: UserCircle },
  ];

  const adminGroups = [
    { label: 'MAIN', items: adminMainItems },
    { label: 'ADMINISTRATION', items: adminAdministrationItems },
    { label: 'PLATFORM MODERATION', items: adminModerationItems },
    { label: 'ANALYTICS & REPORTING', items: adminAnalyticsItems },
    { label: 'SYSTEM', items: adminSystemItems },
    { label: 'ACCOUNT', items: adminAccountItems },
  ].filter(g => g.items.length > 0);

  // ── Farmer Sidebar Group Definitions ─────────────────────────────────────────
  const farmerGroups = [
    {
      label: 'Overview',
      items: [
        { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
        { name: 'Features Hub', to: '/features', icon: Sparkles },
      ],
    },
    {
      label: 'AI Predictions',
      items: [
        { name: 'Crop Recommendation', to: '/crop-recommendation', icon: Sprout },
        { name: 'Pest Prediction', to: '/pest-prediction', icon: Bug },
        { name: 'Yield Prediction', to: '/yield-prediction', icon: Tractor },
        { name: 'Market Prices', to: '/market-price', icon: TrendingUp },
      ],
    },
    {
      label: 'Farm Management',
      items: [
        { name: 'Weather Forecast', to: '/weather', icon: Thermometer },
        { name: 'Soil Health', to: '/soil-health', icon: Droplet },
        { name: 'Financial Planning', to: '/financial-planning', icon: Wallet },
        { name: 'Risk Monitoring', to: '/risk-monitoring', icon: AlertTriangle },
        { name: 'Sustainability', to: '/sustainability', icon: Leaf },
      ],
    },
    {
      label: 'Social & Trade',
      items: [
        { name: 'Marketplace', to: '/marketplace', icon: ShoppingBag },
        { name: 'Community Forum', to: '/community', icon: MessageSquare },
        { name: 'Expert Advice', to: '/expert-advice', icon: ShieldCheck },
      ],
    },
    {
      label: 'Reports & Account',
      items: [
        { name: 'Analytics', to: '/analytics', icon: BarChart3 },
        { name: 'Profile & History', to: '/profile', icon: UserCircle },
      ],
    },
  ];

  const isItemActive = (item) => {
    if (!isAdmin) return location.pathname === item.to;
    if (item.tabId) {
      const tabMatch = activeAdminTab === item.tabId;
      if (item.tabId === 'users' && item.roleFilter) {
        return tabMatch && activeRoleFilter === item.roleFilter;
      }
      if (item.tabId === 'users' && !item.roleFilter) {
        return tabMatch && !activeRoleFilter;
      }
      return tabMatch;
    }
    return false;
  };

  // ── Render Admin Light Sidebar (matching Farmer sidebar visual appearance) ───
  if (isAdmin) {
    return (
      <aside className="w-64 bg-white border-r border-gray-100 flex-col h-full overflow-y-auto hidden md:flex flex-shrink-0 shadow-xs select-none">
        <div className="flex-1 py-4 px-3 space-y-5">
          {/* User Role Card */}
          <div className="px-3 py-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-bold text-gray-900 truncate">{user?.name || 'Admin User'}</p>
              <p className="text-[10px] text-gray-500 truncate font-mono">{user?.email || 'admin@agrismart.ai'}</p>
            </div>
            {isPrimary ? (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 flex-shrink-0">
                <Crown className="h-3 w-3 text-amber-600" /> Primary
              </span>
            ) : (
              <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1 flex-shrink-0">
                <ShieldCheck className="h-3 w-3 text-blue-600" /> Secondary
              </span>
            )}
          </div>

          {/* Navigation Groups */}
          {adminGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1 text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isItemActive(item);
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.to}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${active
                        ? 'bg-eco-50 text-eco-700 shadow-xs border border-eco-100 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                      <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-eco-600' : 'text-gray-400'}`} />
                      <span className="truncate">{item.name}</span>
                      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-eco-500 flex-shrink-0" />}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Brand & Logout */}
        <div className="px-4 py-4 border-t border-gray-100 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout System</span>
          </button>
          <div className="bg-gradient-to-r from-eco-50 to-emerald-50 rounded-xl p-3 border border-eco-100 text-center">
            <p className="text-xs font-black text-eco-800">AgriSmart AI Admin</p>
            <p className="text-[10px] text-eco-600/70 mt-0.5">RBAC & Role Security Active</p>
          </div>
        </div>
      </aside>
    );
  }

  // ── Render Farmer Light Sidebar ──────────────────────────────────────────────
  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex-col h-full overflow-y-auto hidden md:flex flex-shrink-0 shadow-xs select-none">
      <div className="flex-1 py-4 px-3 space-y-5">
        {/* Role Badge */}
        <div className="px-3 py-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Account Role</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
            Farmer
          </span>
        </div>

        {farmerGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive
                      ? 'bg-eco-50 text-eco-700 shadow-xs border border-eco-100 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  {({ isActive }) => {
                    const Icon = item.icon;
                    return (
                      <>
                        <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-eco-600' : 'text-gray-400'}`} />
                        <span className="truncate">{item.name}</span>
                        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-eco-500 flex-shrink-0" />}
                      </>
                    );
                  }}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Brand */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="bg-gradient-to-r from-eco-50 to-emerald-50 rounded-xl p-3 border border-eco-100">
          <p className="text-xs font-black text-eco-800">AgriSmart AI</p>
          <p className="text-[10px] text-eco-600/70 mt-0.5">Intelligent Agriculture Assistant</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
