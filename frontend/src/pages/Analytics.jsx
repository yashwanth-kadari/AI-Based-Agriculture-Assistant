import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import Card from '../components/Card';
import Button from '../components/Button';
import {
  BarChart3, TrendingUp, Wallet, Droplet, Sprout, Tractor, Coins, Download,
  Plus, Calendar, Filter, CheckCircle, AlertCircle, Info, Sparkles, Activity,
  FileText, X, Scale, CreditCard, ShieldAlert, Award, Layers, Clock
} from 'lucide-react';
import { getAnalytics, addFinancialRecord, addYieldRecord, downloadReport } from '../utils/api';

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#9333ea', '#0891b2'];

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '3m', label: 'Last 3 Months' },
  { value: '6m', label: 'Last 6 Months' },
  { value: '1y', label: 'Last 1 Year' },
  { value: 'all', label: 'All Time' },
];

const CROP_OPTIONS = [
  { value: 'all', label: 'All Crops' },
  { value: 'rice', label: 'Rice' },
  { value: 'wheat', label: 'Wheat' },
  { value: 'maize', label: 'Maize' },
  { value: 'cotton', label: 'Cotton' },
  { value: 'sugarcane', label: 'Sugarcane' },
];

const Analytics = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [selectedCrop, setSelectedCrop] = useState('all');
  const [downloading, setDownloading] = useState('');

  // Modals state
  const [showFinModal, setShowFinModal] = useState(false);
  const [showYieldModal, setShowYieldModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMsg, setModalMsg] = useState('');

  // Financial Form Data
  const [finForm, setFinForm] = useState({
    crop_type: 'Wheat',
    season: 'Kharif',
    seed_cost: '',
    fertilizer_cost: '',
    pesticide_cost: '',
    labor_cost: '',
    irrigation_cost: '',
    other_cost: '',
    revenue: '',
  });

  // Yield Form Data
  const [yieldForm, setYieldForm] = useState({
    crop_type: 'Wheat',
    season: 'Kharif',
    area_acres: '2.5',
    actual_yield_kg: '',
    expected_yield_kg: '',
    status: 'Harvested',
  });

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const { data: res } = await getAnalytics({
        user_id: user?.id,
        period: period,
        crop: selectedCrop,
      });
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAnalyticsData();
    }
  }, [user?.id, period, selectedCrop]);

  const handleDownload = async (type) => {
    setDownloading(type);
    try {
      const { data: blob } = await downloadReport(user.id, type, period, selectedCrop);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `farmer_${type}_report_${user.id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Download failed. Please check backend connection.');
    } finally {
      setDownloading('');
    }
  };

  const handleFinSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalMsg('');
    try {
      await addFinancialRecord({ ...finForm, user_id: user.id });
      setModalMsg('Financial record logged successfully!');
      setTimeout(() => {
        setShowFinModal(false);
        setModalMsg('');
        setFinForm({
          crop_type: 'Wheat',
          season: 'Kharif',
          seed_cost: '',
          fertilizer_cost: '',
          pesticide_cost: '',
          labor_cost: '',
          irrigation_cost: '',
          other_cost: '',
          revenue: '',
        });
        fetchAnalyticsData();
      }, 1000);
    } catch (err) {
      setModalMsg(err.response?.data?.error || 'Failed to save record.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleYieldSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalMsg('');
    try {
      await addYieldRecord({ ...yieldForm, user_id: user.id });
      setModalMsg('Crop yield record logged successfully!');
      setTimeout(() => {
        setShowYieldModal(false);
        setModalMsg('');
        setYieldForm({
          crop_type: 'Wheat',
          season: 'Kharif',
          area_acres: '2.5',
          actual_yield_kg: '',
          expected_yield_kg: '',
          status: 'Harvested',
        });
        fetchAnalyticsData();
      }, 1000);
    } catch (err) {
      setModalMsg(err.response?.data?.error || 'Failed to save record.');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-600" />
          <p className="text-sm font-medium text-gray-500">Calculating farmer analytics & cross-feature trends...</p>
        </div>
      </div>
    );
  }

  const overview = data?.overview || {};
  const crossSummary = data?.cross_feature_summary || {};
  const cropAnalytics = data?.crop_analytics || {};
  const finAnalytics = data?.financial_analytics || {};
  const soilAnalytics = data?.soil_analytics || {};
  const sustAnalytics = data?.sustainability_analytics || {};
  const aiHistory = data?.ai_history || [];
  const insights = data?.insights || [];

  const hasYieldData = (cropAnalytics.yield_over_time || []).length > 0;
  const hasFinData = (finAnalytics.cost_vs_revenue || []).length > 0;
  const hasSoilData = (soilAnalytics.soil_trends || []).length > 0;
  const hasSustData = (sustAnalytics.records || []).length > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Farmer Analytics & Insights</h1>
            <span className="bg-eco-100 text-eco-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-eco-200">
              6-Feature Integration
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            Aggregated performance analytics, yield trends, budget tracking, and cross-feature history for {overview.farmer_name || 'Farmer'} ({overview.location || 'India'}).
          </p>
        </div>

        {/* Action & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Filter */}
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold">
            <Calendar className="h-3.5 w-3.5 text-gray-500" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Crop Filter */}
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold">
            <Filter className="h-3.5 w-3.5 text-gray-500" />
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer capitalize"
            >
              {CROP_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <Button onClick={() => setShowYieldModal(true)} icon={Plus} variant="secondary" className="text-xs py-2 px-3">
            Record Harvest
          </Button>

          <Button onClick={() => setShowFinModal(true)} icon={Plus} className="text-xs py-2 px-3">
            Log Expense/Revenue
          </Button>
        </div>
      </div>

      {/* ── Cross-Feature Unified Activity & Performance Summary ────────────── */}
      <Card title="Cross-Feature Farming Snapshot (All 6 Tools)" icon={Layers}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Crop Recommendation */}
          <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-700">
              <Sprout className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 px-1.5 py-0.5 rounded">
                Crop
              </span>
            </div>
            <div className="mt-2">
              <h4 className="text-lg font-bold text-gray-900">{crossSummary.crop_predictions || 0}</h4>
              <p className="text-[11px] text-gray-500 font-medium">Predictions Run</p>
              <p className="text-[10px] text-emerald-800 font-semibold mt-1 truncate">
                Crop: {overview.current_crop || 'N/A'}
              </p>
            </div>
          </div>

          {/* 2. Pest Risk Analysis */}
          <div className="bg-amber-50/60 border border-amber-100 p-3 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-700">
              <ShieldAlert className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 px-1.5 py-0.5 rounded">
                Pest
              </span>
            </div>
            <div className="mt-2">
              <h4 className="text-lg font-bold text-gray-900">{crossSummary.pest_checks || 0}</h4>
              <p className="text-[11px] text-gray-500 font-medium">Scans / History</p>
              <p className="text-[10px] text-amber-800 font-semibold mt-1 truncate" title={crossSummary.latest_pest_risk}>
                {crossSummary.latest_pest_risk || 'No Scan'}
              </p>
            </div>
          </div>

          {/* 3. Yield Prediction & Records */}
          <div className="bg-blue-50/60 border border-blue-100 p-3 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-700">
              <Tractor className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 px-1.5 py-0.5 rounded">
                Yield
              </span>
            </div>
            <div className="mt-2">
              <h4 className="text-lg font-bold text-gray-900">
                {crossSummary.total_yield_kg ? `${crossSummary.total_yield_kg.toLocaleString()} kg` : '0 kg'}
              </h4>
              <p className="text-[11px] text-gray-500 font-medium">{crossSummary.yield_records || 0} Harvest Logs</p>
              <p className="text-[10px] text-blue-800 font-semibold mt-1 truncate">
                Avg: {overview.avg_yield_per_acre || 0} kg/acre
              </p>
            </div>
          </div>

          {/* 4. Soil Health */}
          <div className="bg-purple-50/60 border border-purple-100 p-3 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-purple-700">
              <Droplet className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 px-1.5 py-0.5 rounded">
                Soil
              </span>
            </div>
            <div className="mt-2">
              <h4 className="text-lg font-bold text-gray-900">{crossSummary.soil_health_status || 'Not Tested'}</h4>
              <p className="text-[11px] text-gray-500 font-medium">{crossSummary.soil_tests || 0} Soil Tests</p>
              <p className="text-[10px] text-purple-800 font-semibold mt-1 truncate">
                {crossSummary.days_since_soil_test !== null && crossSummary.days_since_soil_test !== undefined
                  ? `${crossSummary.days_since_soil_test}d ago`
                  : 'No Tests'}
              </p>
            </div>
          </div>

          {/* 5. Financial Planning */}
          <div className="bg-cyan-50/60 border border-cyan-100 p-3 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-cyan-700">
              <Wallet className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-100 px-1.5 py-0.5 rounded">
                Finance
              </span>
            </div>
            <div className="mt-2">
              <h4 className={`text-lg font-bold ${crossSummary.net_profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {crossSummary.net_profit !== undefined ? `₹${crossSummary.net_profit.toLocaleString()}` : '₹0'}
              </h4>
              <p className="text-[11px] text-gray-500 font-medium">{crossSummary.financial_logs || 0} Ledger Logs</p>
              <p className="text-[10px] text-cyan-800 font-semibold mt-1 truncate">
                Margin: {crossSummary.profit_margin || 0}%
              </p>
            </div>
          </div>

          {/* 6. Sustainability Index */}
          <div className="bg-teal-50/60 border border-teal-100 p-3 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-teal-700">
              <Award className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 px-1.5 py-0.5 rounded">
                Sustain
              </span>
            </div>
            <div className="mt-2">
              <h4 className="text-lg font-bold text-gray-900">
                {crossSummary.avg_sustainability_score ? `${crossSummary.avg_sustainability_score}/100` : 'N/A'}
              </h4>
              <p className="text-[11px] text-gray-500 font-medium">{crossSummary.sustainability_audits || 0} Audits</p>
              <p className="text-[10px] text-teal-800 font-semibold mt-1 truncate">
                Grade: {crossSummary.sustainability_grade || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Smart AI Farming Insights Banner */}
      <Card title="AI Farming Insights & Recommendations" icon={Sparkles}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((ins, i) => {
            const isPos = ins.type === 'positive';
            const isWarn = ins.type === 'warning';
            const isInfo = ins.type === 'info';
            return (
              <div
                key={i}
                className={`p-3.5 rounded-xl border ${isPos ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' :
                  isWarn ? 'bg-amber-50/60 border-amber-200 text-amber-900' :
                    isInfo ? 'bg-blue-50/60 border-blue-200 text-blue-900' :
                      'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {isPos ? <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" /> :
                    isWarn ? <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" /> :
                      <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                  <h4 className="text-xs font-bold tracking-wide">{ins.title}</h4>
                </div>
                <p className="text-xs leading-relaxed opacity-90">{ins.message}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Section 1: Crop Performance Analytics ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Harvest Yield Trajectory (kg)" icon={BarChart3}>
          <div className="h-72">
            {hasYieldData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cropAnalytics.yield_over_time} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val, name) => [`${val} kg`, name === 'actual_yield' ? 'Actual Yield' : 'Expected Yield']} />
                  <Area type="monotone" dataKey="actual_yield" name="Actual Yield" stroke="#16a34a" fill="#dcfce7" strokeWidth={2} />
                  <Area type="monotone" dataKey="expected_yield" name="Expected Yield" stroke="#2563eb" fill="#dbeafe" strokeWidth={1} strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-gray-100 rounded-xl">
                <Tractor className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 font-medium">No crop yield records available yet.</p>
                <p className="text-xs text-gray-400 mt-1">Click "+ Record Harvest" or run a Yield Prediction to start tracking performance.</p>
              </div>
            )}
          </div>
        </Card>

        <Card title="Crop Yield Comparison (kg/acre)" icon={Scale}>
          <div className="h-72">
            {(cropAnalytics.crop_wise_yield || []).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropAnalytics.crop_wise_yield} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="crop" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val) => [`${val} kg/acre`, 'Yield Efficiency']} />
                  <Bar dataKey="yield_per_acre" fill="#15803d" radius={[6, 6, 0, 0]} name="Yield / Acre (kg)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-gray-100 rounded-xl">
                <Sprout className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 font-medium">No crop comparisons available yet.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Section 2: Financial Analytics ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Farming Expense Breakdown (₹)" icon={Wallet}>
          <div className="h-72">
            {hasFinData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={finAnalytics.expense_breakdown} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val) => [`₹${val.toLocaleString()}`, 'Amount']} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {(finAnalytics.expense_breakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-gray-100 rounded-xl">
                <Coins className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 font-medium">No financial expense records logged yet.</p>
                <p className="text-xs text-gray-400 mt-1">Click "+ Log Expense/Revenue" to track farming finances.</p>
              </div>
            )}
          </div>
        </Card>

        <Card title="Cost vs Revenue Trajectory (₹)" icon={TrendingUp}>
          <div className="h-72">
            {hasFinData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={finAnalytics.cost_vs_revenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val) => [`₹${val.toLocaleString()}`, 'Total']} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#16a34a" name="Gross Revenue (₹)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#dc2626" name="Total Expenses (₹)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-gray-100 rounded-xl">
                <CreditCard className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 font-medium">No revenue data available yet.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Section 3: Soil Health & Sustainability Trends ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Soil Nutrient Trends (NPK & pH Level)" icon={Droplet}>
          <div className="h-72">
            {hasSoilData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={soilAnalytics.soil_trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val, name) => [`${val} ${name === 'ph' ? '' : 'mg/kg'}`, name]} />
                  <Legend />
                  <Line type="monotone" dataKey="N" stroke="#16a34a" strokeWidth={2} name="Nitrogen (N)" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="P" stroke="#2563eb" strokeWidth={2} name="Phosphorus (P)" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="K" stroke="#d97706" strokeWidth={2} name="Potassium (K)" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="ph" stroke="#9333ea" strokeWidth={2} name="Soil pH Level" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-gray-100 rounded-xl">
                <Droplet className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 font-medium">No soil nutrient testing history found.</p>
                <p className="text-xs text-gray-400 mt-1">Run Soil Health Analysis to plot NPK nutrient trends over time.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Sustainability Index Scorecard */}
        <Card title="Regenerative & Sustainability Index Audit" icon={Award}>
          {hasSustData ? (
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Average Sustainability Rating</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <h3 className="text-2xl font-extrabold text-teal-900">{sustAnalytics.avg_score}/100</h3>
                    <span className="text-sm font-bold bg-teal-200 text-teal-900 px-2 py-0.5 rounded">
                      Grade {sustAnalytics.latest_grade}
                    </span>
                  </div>
                </div>
                <Award className="h-10 w-10 text-teal-600 opacity-80" />
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {sustAnalytics.records.map((st) => (
                  <div key={st.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 text-xs">
                    <div>
                      <span className="font-bold text-gray-900">{st.crop}</span> — {st.label}
                      <p className="text-[11px] text-gray-400">Tillage: {st.tillage_type} • Solar: {st.solar_energy ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {st.score}/100 ({st.grade})
                      </span>
                      <p className="text-[10px] text-gray-400 mt-0.5">{st.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-gray-100 rounded-xl">
              <Award className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500 font-medium">No sustainability audits recorded yet.</p>
              <p className="text-xs text-gray-400 mt-1">Run a Regenerative & Sustainability Audit to calculate farm score.</p>
            </div>
          )}
        </Card>
      </div>

      {/* ── Section 4: AI Recommendation History (All 6 Features) ────────────── */}
      <Card title="Cross-Feature Activity & AI Prediction History" icon={Activity}>
        {aiHistory.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {aiHistory.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.type === 'Crop Recommendation' ? 'bg-emerald-100 text-emerald-800' :
                        item.type === 'Pest Risk Analysis' ? 'bg-amber-100 text-amber-800' :
                          item.type === 'Soil Nutrient Analysis' ? 'bg-purple-100 text-purple-800' :
                            'bg-teal-100 text-teal-800'
                      }`}>
                      {item.type}
                    </span>
                    <span className="text-xs font-semibold text-gray-900">{item.recommendation}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-mono">{item.inputs}</p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 text-xs text-gray-500">
                  <div className="text-right">
                    <p className="font-bold text-gray-700">Confidence: {item.confidence}%</p>
                    <p className="text-[11px] text-gray-400">{item.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-8">No activity or AI prediction history recorded yet.</p>
        )}
      </Card>

      {/* ── Section 5: Export Reports ────────────────────────────────────────── */}
      <Card title="Download Farm Reports (Filtered CSV Exports)" icon={Download}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button
            variant="secondary"
            className="py-2.5 text-xs font-semibold"
            icon={Download}
            isLoading={downloading === 'yield'}
            onClick={() => handleDownload('yield')}
          >
            Crop Yield Report (CSV)
          </Button>

          <Button
            variant="secondary"
            className="py-2.5 text-xs font-semibold"
            icon={Download}
            isLoading={downloading === 'financial'}
            onClick={() => handleDownload('financial')}
          >
            Financial Ledger (CSV)
          </Button>

          <Button
            variant="secondary"
            className="py-2.5 text-xs font-semibold"
            icon={Download}
            isLoading={downloading === 'soil'}
            onClick={() => handleDownload('soil')}
          >
            Soil Health Report (CSV)
          </Button>

          <Button
            variant="secondary"
            className="py-2.5 text-xs font-semibold"
            icon={Download}
            isLoading={downloading === 'sustainability'}
            onClick={() => handleDownload('sustainability')}
          >
            Sustainability Audit (CSV)
          </Button>
        </div>
      </Card>

      {/* ── Modal: Add Financial Record ────────────────────────────────────── */}
      {showFinModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Log Farming Financials</h3>
              <button onClick={() => setShowFinModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFinSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Crop Type</label>
                  <select
                    value={finForm.crop_type}
                    onChange={(e) => setFinForm({ ...finForm, crop_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                  >
                    <option value="Wheat">Wheat</option>
                    <option value="Rice">Rice</option>
                    <option value="Maize">Maize</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Sugarcane">Sugarcane</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Season</label>
                  <select
                    value={finForm.season}
                    onChange={(e) => setFinForm({ ...finForm, season: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                  >
                    <option value="Kharif">Kharif</option>
                    <option value="Rabi">Rabi</option>
                    <option value="Zaid">Zaid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Seeds Cost (₹)</label>
                  <input
                    type="number"
                    value={finForm.seed_cost}
                    onChange={(e) => setFinForm({ ...finForm, seed_cost: e.target.value })}
                    placeholder="e.g. 5000"
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fertilizer (₹)</label>
                  <input
                    type="number"
                    value={finForm.fertilizer_cost}
                    onChange={(e) => setFinForm({ ...finForm, fertilizer_cost: e.target.value })}
                    placeholder="e.g. 12000"
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pesticide (₹)</label>
                  <input
                    type="number"
                    value={finForm.pesticide_cost}
                    onChange={(e) => setFinForm({ ...finForm, pesticide_cost: e.target.value })}
                    placeholder="e.g. 3000"
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Labour (₹)</label>
                  <input
                    type="number"
                    value={finForm.labor_cost}
                    onChange={(e) => setFinForm({ ...finForm, labor_cost: e.target.value })}
                    placeholder="e.g. 18000"
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Irrigation (₹)</label>
                  <input
                    type="number"
                    value={finForm.irrigation_cost}
                    onChange={(e) => setFinForm({ ...finForm, irrigation_cost: e.target.value })}
                    placeholder="e.g. 5000"
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Gross Revenue (₹)</label>
                  <input
                    type="number"
                    value={finForm.revenue}
                    onChange={(e) => setFinForm({ ...finForm, revenue: e.target.value })}
                    placeholder="e.g. 85000"
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-green-700"
                  />
                </div>
              </div>

              {modalMsg && (
                <p className={`text-xs ${modalMsg.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>
                  {modalMsg}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="secondary" onClick={() => setShowFinModal(false)} type="button" className="text-xs py-2">
                  Cancel
                </Button>
                <Button type="submit" isLoading={modalLoading} className="text-xs py-2">
                  Save Financial Log
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Add Crop Yield Record ────────────────────────────────────── */}
      {showYieldModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Record Harvest Yield</h3>
              <button onClick={() => setShowYieldModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleYieldSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Crop Type</label>
                  <select
                    value={yieldForm.crop_type}
                    onChange={(e) => setYieldForm({ ...yieldForm, crop_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                  >
                    <option value="Wheat">Wheat</option>
                    <option value="Rice">Rice</option>
                    <option value="Maize">Maize</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Sugarcane">Sugarcane</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Season</label>
                  <select
                    value={yieldForm.season}
                    onChange={(e) => setYieldForm({ ...yieldForm, season: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                  >
                    <option value="Kharif">Kharif</option>
                    <option value="Rabi">Rabi</option>
                    <option value="Zaid">Zaid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Land Area (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={yieldForm.area_acres}
                    onChange={(e) => setYieldForm({ ...yieldForm, area_acres: e.target.value })}
                    placeholder="e.g. 2.5"
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Actual Yield (kg)</label>
                  <input
                    type="number"
                    required
                    value={yieldForm.actual_yield_kg}
                    onChange={(e) => setYieldForm({ ...yieldForm, actual_yield_kg: e.target.value })}
                    placeholder="e.g. 4800"
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-green-700"
                  />
                </div>
              </div>

              {modalMsg && (
                <p className={`text-xs ${modalMsg.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>
                  {modalMsg}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="secondary" onClick={() => setShowYieldModal(false)} type="button" className="text-xs py-2">
                  Cancel
                </Button>
                <Button type="submit" isLoading={modalLoading} className="text-xs py-2">
                  Save Harvest Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
