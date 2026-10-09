import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp, Store, MapPin, Package, Calendar, AlertCircle, RefreshCw,
  Info, ArrowUpRight, ArrowDownRight, CheckCircle2, Award, Scale,
  Sparkles, Cpu, History, BarChart2, TrendingDown, Minus, ChevronLeft,
  ChevronRight, ArrowRight, ShieldCheck, Layers, ListFilter
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../components/Card';
import Button from '../components/Button';
import {
  getMandis, getMarketPrices, getMandiPriceHistory,
  getMarketForecast, getMarketForecastHistory
} from '../utils/api';
import { INDIAN_STATES } from '../data/indianLocations';

const CROPS = [
  'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Pulses', 'Potato', 'Tomato'
];

const FORECAST_CROPS = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Tomato', 'Potato'];

// Custom Dot for Forecast Point on Recharts
const CustomForecastDot = (props) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  if (payload.type === 'forecast') {
    return (
      <g key={`forecast-dot-${props.index}`}>
        <circle cx={cx} cy={cy} r={8} fill="#ef4444" stroke="#ffffff" strokeWidth={3} />
        <rect x={cx - 30} y={cy - 28} width={60} height={18} rx={4} fill="#ef4444" />
        <text x={cx} y={cy - 16} fill="#ffffff" fontSize={10} fontWeight="bold" textAnchor="middle">
          Forecast
        </text>
      </g>
    );
  }
  return <circle key={`dot-${props.index}`} cx={cx} cy={cy} r={4} fill="#0d9488" stroke="#ffffff" strokeWidth={1.5} />;
};

const MarketPrice = ({ user }) => {
  // Live Mandi State - Default silently to user's saved profile location
  const [selectedState, setSelectedState] = useState(user?.state || 'Andhra Pradesh');
  const [selectedCrop, setSelectedCrop] = useState('Rice');
  const [selectedMandiId, setSelectedMandiId] = useState('');
  const [quantityInput, setQuantityInput] = useState('10');
  const [appliedQuantity, setAppliedQuantity] = useState('10');
  const [quantityError, setQuantityError] = useState('');


  const [mandis, setMandis] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [comparisonPrices, setComparisonPrices] = useState([]);
  const [historyData, setHistoryData] = useState([]);

  const [loadingMandis, setLoadingMandis] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Sync selectedState if user profile loads after initial mount
  useEffect(() => {
    if (user?.state) {
      setSelectedState(user.state);
    }
  }, [user?.state]);

  // Comparison Table View Mode & Pagination
  const [comparisonTab, setComparisonTab] = useState('latest'); // 'latest' | 'history'
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 15;

  // Market Forecast State (Regression Model)
  const [forecastCrop, setForecastCrop] = useState('Rice');
  const [forecastMandiId, setForecastMandiId] = useState('');
  const [forecastDays, setForecastDays] = useState(7);
  const [forecastResult, setForecastResult] = useState(null);
  const [forecastHistory, setForecastHistory] = useState([]);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [loadingForecastHistory, setLoadingForecastHistory] = useState(false);
  const [forecastError, setForecastError] = useState('');

  // Forecast History Pagination
  const [forecastPage, setForecastPage] = useState(1);
  const forecastPageSize = 10;

  // 1. Fetch Mandis for selected state (Auto-select district match if present)
  const fetchMandisForState = useCallback(async (stateName) => {
    setLoadingMandis(true);
    try {
      const { data } = await getMandis({ state: stateName, status: 'Active' });
      const mList = data.mandis || [];
      setMandis(mList);
      if (mList.length > 0) {
        // Auto-select mandi in farmer's district if found, else default to first
        const distMatch = user?.district ? mList.find(m => (m.district || '').toLowerCase() === user.district.toLowerCase()) : null;
        const targetId = distMatch ? distMatch.id : mList[0].id;

        if (!selectedMandiId || !mList.find(m => String(m.id) === String(selectedMandiId))) {
          setSelectedMandiId(targetId);
        }
        if (!forecastMandiId || !mList.find(m => String(m.id) === String(forecastMandiId))) {
          setForecastMandiId(targetId);
        }
      } else {
        setSelectedMandiId('');
        setForecastMandiId('');
      }
    } catch {
      setMandis([]);
      setSelectedMandiId('');
      setForecastMandiId('');
    } finally {
      setLoadingMandis(false);
    }
  }, [user?.district, selectedMandiId, forecastMandiId]);

  useEffect(() => {
    fetchMandisForState(selectedState);
  }, [selectedState, fetchMandisForState]);

  // 2. Fetch market price for selected Mandi & Crop + Comparison Prices in State
  const fetchPriceDetails = useCallback(async () => {
    if (!selectedCrop) return;
    setLoadingPrices(true);
    try {
      const { data: stateData } = await getMarketPrices({
        state: selectedState,
        crop: selectedCrop,
        status: 'Active'
      });
      const allStatePrices = stateData.prices || [];
      setComparisonPrices(allStatePrices);

      if (selectedMandiId) {
        const found = allStatePrices.find(p => String(p.mandi_id) === String(selectedMandiId));
        if (found) {
          setCurrentPrice(found);
        } else {
          const { data: directData } = await getMarketPrices({
            mandi_id: selectedMandiId,
            crop: selectedCrop,
            status: 'Active'
          });
          setCurrentPrice(directData.prices?.[0] || null);
        }
      } else {
        setCurrentPrice(allStatePrices[0] || null);
      }
    } catch (err) {
      console.error('Error fetching market prices:', err);
      setCurrentPrice(null);
      setComparisonPrices([]);
    } finally {
      setLoadingPrices(false);
    }
  }, [selectedState, selectedCrop, selectedMandiId]);

  // 3. Fetch History trend for selected Mandi & Crop
  const fetchHistory = useCallback(async () => {
    if (!selectedMandiId || !selectedCrop) return;
    setLoadingHistory(true);
    try {
      const { data } = await getMandiPriceHistory({ mandi_id: selectedMandiId, crop: selectedCrop });
      setHistoryData(data.history || []);
    } catch {
      setHistoryData([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedMandiId, selectedCrop]);

  useEffect(() => {
    fetchPriceDetails();
    fetchHistory();
    setHistoryPage(1);
  }, [selectedState, selectedCrop, selectedMandiId, fetchPriceDetails, fetchHistory]);

  // 4. Fetch User's Past Market Forecast History
  const fetchForecastHistory = useCallback(async () => {
    setLoadingForecastHistory(true);
    try {
      const { data } = await getMarketForecastHistory({ user_id: user?.id });
      setForecastHistory(data.forecasts || []);
    } catch {
      setForecastHistory([]);
    } finally {
      setLoadingForecastHistory(false);
    }
  }, [user]);

  useEffect(() => {
    fetchForecastHistory();
  }, [fetchForecastHistory]);

  // Handle Market Forecast Generation
  const handleGenerateForecast = async () => {
    if (!forecastMandiId || !forecastCrop) return;
    setLoadingForecast(true);
    setForecastError('');
    try {
      const { data } = await getMarketForecast({
        crop_name: forecastCrop,
        mandi_id: parseInt(forecastMandiId, 10),
        forecast_days: parseInt(forecastDays, 10)
      });
      setForecastResult(data);
      fetchForecastHistory();
    } catch (err) {
      console.error('Forecast error:', err);
      setForecastError(err.response?.data?.error || 'Failed to generate market forecast.');
    } finally {
      setLoadingForecast(false);
    }
  };

  const handleStateChange = (e) => {
    const s = e.target.value;
    setSelectedState(s);
  };

  const handleApplyQuantity = () => {
    const val = parseFloat(quantityInput);
    if (isNaN(val) || val <= 0) {
      setQuantityError('Please enter a valid positive quantity (Quintals).');
      return;
    }
    setQuantityError('');
    setAppliedQuantity(quantityInput);
  };

  const selectedMandiObj = mandis.find(m => String(m.id) === String(selectedMandiId));
  const qtyNum = parseFloat(appliedQuantity) || 0;

  const totalValue = currentPrice ? (currentPrice.price * qtyNum) : 0;


  // Compute LATEST price per Mandi for the comparison table (sorted highest price to lowest)
  const latestComparisonPrices = useMemo(() => {
    const map = new Map();
    comparisonPrices.forEach(p => {
      if (!map.has(p.mandi_id)) {
        map.set(p.mandi_id, p);
      }
    });
    return Array.from(map.values()).sort((a, b) => (b.price || 0) - (a.price || 0));
  }, [comparisonPrices]);

  // Pagination calculations for comparison full history
  const totalHistoryPages = Math.ceil(comparisonPrices.length / historyPageSize) || 1;
  const paginatedComparisonHistory = useMemo(() => {
    const start = (historyPage - 1) * historyPageSize;
    return comparisonPrices.slice(start, start + historyPageSize);
  }, [comparisonPrices, historyPage]);

  // Pagination calculations for prediction history
  const totalForecastPages = Math.ceil(forecastHistory.length / forecastPageSize) || 1;
  const paginatedForecastHistory = useMemo(() => {
    const start = (forecastPage - 1) * forecastPageSize;
    return forecastHistory.slice(start, start + forecastPageSize);
  }, [forecastHistory, forecastPage]);

  // Limit recent 30 days for live chart window
  const recentHistoryData = useMemo(() => {
    return historyData.slice(-30);
  }, [historyData]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900">APMC Mandi Market Prices & AI Forecast</h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Live Mandi Database + ML Forecast
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Real admin-managed APMC mandi crop rates alongside time-series regression market price predictions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchPriceDetails(); fetchHistory(); fetchForecastHistory(); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingPrices ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* SECTION 1: LIVE APMC MANDI PRICES */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900">Live APMC Mandi Rates</h2>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-md">
              Admin Verified Rates
            </span>
          </div>
        </div>

        {/* Control Filters Bar */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              Indian State
            </label>
            <select
              value={selectedState}
              onChange={handleStateChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-emerald-500"
            >
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
              <Package className="h-3.5 w-3.5 text-emerald-600" />
              Select Crop
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 text-emerald-900"
            >
              {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
              <Store className="h-3.5 w-3.5 text-emerald-600" />
              Select APMC Mandi
            </label>
            <select
              value={selectedMandiId}
              onChange={(e) => setSelectedMandiId(e.target.value)}
              disabled={loadingMandis || mandis.length === 0}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 text-gray-900"
            >
              {mandis.length === 0 ? (
                <option value="">No mandis in state</option>
              ) : (
                mandis.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.district})</option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
              <Scale className="h-3.5 w-3.5 text-emerald-600" />
              Crop Quantity (Quintals)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={quantityInput}
                onChange={(e) => {
                  setQuantityInput(e.target.value);
                  if (quantityError) setQuantityError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyQuantity();
                  }
                }}
                placeholder="e.g. 10"
                className={`w-full px-3 py-2 border rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 text-gray-900 ${quantityError ? 'border-red-400 focus:border-red-400' : 'border-gray-200'
                  }`}
              />
              <button
                type="button"
                onClick={handleApplyQuantity}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0 shadow-xs"
              >
                Apply
              </button>
            </div>
            {quantityError && (
              <p className="text-[11px] font-semibold text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {quantityError}
              </p>
            )}
          </div>

        </div>

        {/* Live Mandi Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl shadow-md border-none">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-300">
                  {selectedMandiObj ? selectedMandiObj.name : 'Selected Mandi'}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {currentPrice ? currentPrice.price_date : 'Today'}
                </span>
              </div>

              <div className="my-4 text-center">
                <p className="text-xs text-gray-300 font-medium mb-1">{selectedCrop} Mandi Price</p>
                {loadingPrices ? (
                  <div className="py-6 animate-pulse text-xs text-emerald-300">Loading DB price...</div>
                ) : currentPrice ? (
                  <>
                    <div className="text-4xl font-black tracking-tight text-white">
                      ₹{currentPrice.price?.toLocaleString()}
                      <span className="text-xs font-normal text-emerald-300 ml-1.5">/ {currentPrice.unit || 'Quintal'}</span>
                    </div>
                    <p className="text-xs text-emerald-300/80 mt-1 font-mono">
                      (₹{(currentPrice.price / 100).toFixed(2)} per Kg)
                    </p>
                  </>
                ) : (
                  <div className="py-4">
                    <p className="text-sm font-bold text-amber-300">No active price entry</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Admin has not logged price for this crop in selected Mandi yet.</p>
                  </div>
                )}
              </div>

              {currentPrice && (
                <div className="space-y-3 pt-3 border-t border-white/10 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center bg-white/10 p-2.5 rounded-xl backdrop-blur-xs">
                    <div>
                      <span className="text-[10px] text-gray-300 block font-medium">Min Price</span>
                      <span className="font-bold text-gray-200">₹{currentPrice.min_price || Math.round(currentPrice.price * 0.95)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-300 block font-medium">Modal Price</span>
                      <span className="font-bold text-white">₹{currentPrice.modal_price || currentPrice.price}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-300 block font-medium">Max Price</span>
                      <span className="font-bold text-gray-200">₹{currentPrice.max_price || Math.round(currentPrice.price * 1.05)}</span>
                    </div>
                  </div>

                  <div className="bg-emerald-500/20 border border-emerald-400/30 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-200 block">Total Batch Estimate</span>
                      <span className="text-xs text-gray-300">{qtyNum} Quintals @ ₹{currentPrice.price}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-white">₹{totalValue.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-gray-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Verified database entry logged by {currentPrice.creator_name || 'Admin'}</span>
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card
              title={`Historical Mandi Price Trajectory — ${selectedCrop} (${selectedMandiObj?.name || 'Mandi'})`}
              icon={TrendingUp}
            >
              <div className="h-64 pt-2">
                {loadingHistory ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-600" />
                  </div>
                ) : recentHistoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={recentHistoryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        domain={['auto', 'auto']}
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <Tooltip formatter={(v) => [`₹${v}`, `Price/Quintal`]} labelFormatter={(l) => `Date: ${l}`} />
                      <Line type="monotone" dataKey="price" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <TrendingUp className="h-8 w-8 text-gray-300 mb-1" />
                    <p className="text-xs text-center">No historical rate changes logged for this Mandi yet.</p>
                  </div>
                )}
              </div>
            </Card>

            {/* PART 1 — STATE MANDI PRICE COMPARISON TABLE (LATEST PER MANDI + PAGINATED FULL LOG) */}
            <Card
              title={`State Mandi Price Comparison — ${selectedCrop} (${selectedState})`}
              icon={Store}
            >
              {/* Table Tab Selector */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setComparisonTab('latest')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${comparisonTab === 'latest'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    📊 Latest Rate per Mandi ({latestComparisonPrices.length})
                  </button>
                  <button
                    onClick={() => setComparisonTab('history')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${comparisonTab === 'history'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    📜 Full Historical Log ({comparisonPrices.length})
                  </button>
                </div>

                <span className="text-[11px] text-gray-400 hidden sm:inline">
                  {comparisonTab === 'latest' ? 'Showing top mandi rates sorted by price' : `Page ${historyPage} of ${totalHistoryPages}`}
                </span>
              </div>

              {comparisonPrices.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No active price comparison data for {selectedCrop} in {selectedState}.
                </div>
              ) : comparisonTab === 'latest' ? (
                /* VIEW 1: LATEST RATE PER MANDI (ONE ROW PER MANDI, SORTED HIGHEST TO LOWEST) */
                <div className="overflow-x-auto min-w-full">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-emerald-50/60 text-[10px] font-bold text-emerald-900 uppercase border-b border-emerald-100">
                        <th className="py-2.5 px-3">Mandi Name</th>
                        <th className="py-2.5 px-3">District</th>
                        <th className="py-2.5 px-3">Rate (₹/Quintal)</th>
                        <th className="py-2.5 px-3">Price Range</th>
                        <th className="py-2.5 px-3">Batch Revenue ({qtyNum} Qtl)</th>
                        <th className="py-2.5 px-3">Price Date</th>
                        <th className="py-2.5 px-3 text-right">Market Badge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {latestComparisonPrices.map((p, idx) => {
                        const isSelected = String(p.mandi_id) === String(selectedMandiId);
                        const isBest = idx === 0;
                        const mValue = p.price * qtyNum;

                        return (
                          <tr
                            key={`latest-${p.id || p.mandi_id}`}
                            onClick={() => setSelectedMandiId(p.mandi_id)}
                            className={`cursor-pointer transition-all ${isSelected ? 'bg-emerald-50/90 font-bold text-emerald-950' : 'hover:bg-gray-50'
                              }`}
                          >
                            <td className="py-3 px-3 flex items-center gap-1.5">
                              {isBest && <Award className="h-4 w-4 text-amber-500 flex-shrink-0" title="Best Market Rate" />}
                              <span>{p.mandi_name}</span>
                            </td>
                            <td className="py-3 px-3 text-gray-600">{p.district}</td>
                            <td className="py-3 px-3 font-bold text-gray-900">
                              ₹{p.price?.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-gray-500">
                              ₹{p.min_price || Math.round(p.price * 0.95)} - ₹{p.max_price || Math.round(p.price * 1.05)}
                            </td>
                            <td className="py-3 px-3 font-bold text-emerald-700">
                              ₹{mValue.toLocaleString()}
                            </td>
                            {/* DATE COLUMN ALWAYS SHOWS REAL PRICE DATE */}
                            <td className="py-3 px-3 text-gray-600 font-mono text-[11px]">
                              {p.price_date}
                            </td>
                            {/* BADGE COLUMN SEPARATED FROM DATE */}
                            <td className="py-3 px-3 text-right">
                              {isBest ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
                                  🏆 Best Market Rate
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-gray-100 text-gray-600">
                                  Standard Mandi
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* VIEW 2: PAGINATED FULL HISTORICAL LOG */
                <div>
                  <div className="overflow-x-auto min-w-full">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-100">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Mandi Name</th>
                          <th className="py-2.5 px-3">District</th>
                          <th className="py-2.5 px-3">Rate (₹/Quintal)</th>
                          <th className="py-2.5 px-3">Min - Max Range</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {paginatedComparisonHistory.map((p, idx) => (
                          <tr key={`hist-${p.id || idx}`} className="hover:bg-gray-50">
                            <td className="py-2.5 px-3 font-mono text-gray-600">{p.price_date}</td>
                            <td className="py-2.5 px-3 font-bold text-gray-900">{p.mandi_name}</td>
                            <td className="py-2.5 px-3 text-gray-600">{p.district}</td>
                            <td className="py-2.5 px-3 font-bold text-emerald-800">₹{p.price?.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-gray-500">
                              ₹{p.min_price || Math.round(p.price * 0.95)} - ₹{p.max_price || Math.round(p.price * 1.05)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Bar */}
                  {totalHistoryPages > 1 && (
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100 text-xs">
                      <span className="text-gray-500 font-medium text-[11px]">
                        Showing page {historyPage} of {totalHistoryPages} ({comparisonPrices.length} total historical records)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                          disabled={historyPage === 1}
                          className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 disabled:opacity-40 hover:bg-gray-50"
                        >
                          <ChevronLeft className="h-3.5 w-3.5 inline" /> Prev
                        </button>
                        <span className="px-2 py-1 bg-gray-100 font-bold rounded-md text-[11px] text-gray-700">
                          {historyPage} / {totalHistoryPages}
                        </span>
                        <button
                          onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                          disabled={historyPage === totalHistoryPages}
                          className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 disabled:opacity-40 hover:bg-gray-50"
                        >
                          Next <ChevronRight className="h-3.5 w-3.5 inline" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      <hr className="border-gray-200 my-8" />

      {/* PART 2 — REDESIGN THE AI MARKET FORECAST SECTION (GREEN AGRICULTURE THEME) */}
      <div className="space-y-6">
        {/* Section Header Card (Green Agriculture Theme) */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 p-6 rounded-2xl text-white shadow-md border border-emerald-700/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-300" />
                <h2 className="text-xl font-black tracking-tight">AI Market Price Forecast</h2>
                <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  Regression Model
                </span>
              </div>
              <p className="text-emerald-100/90 text-xs mt-1.5 max-w-2xl leading-relaxed">
                Statistical price predictions for 7, 14, and 30 days ahead based on daily APMC mandi price history.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 px-3 py-2 rounded-xl text-[11px] max-w-xs backdrop-blur-xs">
              <Info className="h-4 w-4 text-emerald-300 flex-shrink-0" />
              <span>
                Driven by historical mandi price series (NOT soil chemistry) — distinct from Live APMC Rates.
              </span>
            </div>
          </div>
        </div>

        {/* Forecast Parameters Input Panel (Grouped Control Card) */}
        <Card title="Forecast Parameters" icon={Layers}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Package className="h-3.5 w-3.5 text-emerald-600" />
                Target Crop
              </label>
              <select
                value={forecastCrop}
                onChange={(e) => setForecastCrop(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 text-gray-900"
              >
                {FORECAST_CROPS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Store className="h-3.5 w-3.5 text-emerald-600" />
                Target APMC Mandi
              </label>
              <select
                value={forecastMandiId}
                onChange={(e) => setForecastMandiId(e.target.value)}
                disabled={mandis.length === 0}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 text-gray-900"
              >
                {mandis.length === 0 ? (
                  <option value="">No mandis available</option>
                ) : (
                  mandis.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.district})</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                Forecast Period
              </label>
              <select
                value={forecastDays}
                onChange={(e) => setForecastDays(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 text-gray-900"
              >
                <option value={7}>7 Days Ahead</option>
                <option value={14}>14 Days Ahead</option>
                <option value={30}>30 Days Ahead</option>
              </select>
            </div>

            <div>
              <Button
                onClick={handleGenerateForecast}
                disabled={loadingForecast || !forecastMandiId}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Sparkles className={`h-4 w-4 ${loadingForecast ? 'animate-spin' : ''}`} />
                {loadingForecast ? 'Calculating ML Model...' : 'Generate Forecast'}
              </Button>
            </div>
          </div>
        </Card>

        {forecastError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{forecastError}</span>
          </div>
        )}

        {/* Loading Skeleton */}
        {loadingForecast && (
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xs space-y-4 animate-pulse">
            <div className="h-4 bg-emerald-100 rounded-md w-1/4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-24 bg-gray-100 rounded-xl" />
              <div className="h-24 bg-gray-100 rounded-xl" />
              <div className="h-24 bg-gray-100 rounded-xl" />
            </div>
          </div>
        )}

        {/* Forecast Results Panel (Green Agriculture Theme Hierarchy) */}
        {forecastResult && !loadingForecast && (
          <div className="space-y-6 animate-fadeIn">
            {Number(forecastResult.forecast_days) === 7 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-xs flex items-start gap-2.5 shadow-2xs">
                <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Short-Term Forecast Advisory: </span>
                  Short-term forecasts are less reliable — consider the current price as your best estimate for very near-term decisions.
                </div>
              </div>
            )}

            {/* Prominent Price Comparison & Trend Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Current vs Predicted Price (Side by Side with Transition Arrow) */}
              <div className="md:col-span-2 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    Price Prediction Summary
                  </span>
                  <span className="text-[10px] bg-emerald-100 font-bold text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {forecastResult.forecast_days} Days Horizon • {forecastResult.crop_name} ({forecastResult.mandi_name})
                  </span>
                </div>

                <div className="my-4 flex flex-col sm:flex-row items-center justify-around gap-4 text-center sm:text-left">
                  {/* Current Price */}
                  <div>
                    <span className="text-[11px] text-gray-500 font-bold block mb-1 uppercase tracking-wider">
                      Latest Mandi Rate
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-gray-800">
                      ₹{forecastResult.current_price?.toLocaleString()}
                      <span className="text-xs font-normal text-gray-500 ml-1">/ Qtl</span>
                    </div>
                  </div>

                  {/* Transition Arrow */}
                  <div className="hidden sm:flex items-center justify-center bg-emerald-100 p-2.5 rounded-full text-emerald-700 shadow-xs">
                    <ArrowRight className="h-5 w-5" />
                  </div>

                  {/* Predicted Price */}
                  <div className="text-center sm:text-right">
                    <span className="text-[11px] text-emerald-700 font-bold block mb-1 uppercase tracking-wider">
                      AI Projected Price
                    </span>
                    <div className="text-3xl sm:text-4xl font-black text-emerald-900">
                      ₹{forecastResult.predicted_price?.toLocaleString()}
                      <span className="text-xs font-normal text-emerald-700 ml-1">/ Qtl</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-gray-500 border-t border-emerald-100/60 pt-2 flex items-center justify-between font-medium">
                  <span>Base Date: Latest Record</span>
                  <span>Target Date: {forecastResult.chart_data?.[forecastResult.chart_data.length - 1]?.date}</span>
                </div>
              </div>

              {/* Card 2: Trend & Volatility Confidence Rating */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Market Trend & Confidence</span>
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                </div>

                <div className="my-3 space-y-4">
                  {/* Trend Badge */}
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                    <span className="text-xs text-gray-600 font-bold">Direction</span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs ${forecastResult.trend === 'Increasing'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : forecastResult.trend === 'Decreasing'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                      {forecastResult.trend === 'Increasing' && <ArrowUpRight className="h-3.5 w-3.5" />}
                      {forecastResult.trend === 'Decreasing' && <ArrowDownRight className="h-3.5 w-3.5" />}
                      {forecastResult.trend === 'Stable' && <Minus className="h-3.5 w-3.5" />}
                      {forecastResult.trend} ({forecastResult.expected_change_pct > 0 ? '+' : ''}{forecastResult.expected_change_pct}%)
                    </span>
                  </div>

                  {/* Labeled Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-gray-600">Model Confidence</span>
                      <span className="text-emerald-800 font-black">{forecastResult.confidence}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${forecastResult.confidence}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Adjusted by price volatility series</p>
                  </div>
                </div>
              </div>
            </div>

            {/* PART 3 — FORECAST LINE CHART (TEAL ACCENT, DISTINCT FORECAST MARKER) */}
            <Card
              title={`Price History & AI Forecast Trajectory — ${forecastResult.crop_name} (${forecastResult.mandi_name})`}
              icon={Sparkles}
            >
              <div className="h-72 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastResult.chart_data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      domain={['auto', 'auto']}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <Tooltip
                      formatter={(value, name, props) => [
                        `₹${value}`,
                        props.payload.type === 'forecast' ? '🤖 AI Forecast Price' : '📈 Mandi Historical Price'
                      ]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#0d9488"
                      strokeWidth={2.5}
                      dot={<CustomForecastDot />}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-6 mt-3 text-xs font-semibold text-gray-600 border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-teal-600 inline-block" />
                  <span>Recent Mandi Historical Series</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-red-500 inline-block shadow-2xs" />
                  <span>AI Forecast Point ({forecastResult.forecast_days} Days Horizon)</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* PART 4 — PREDICTION HISTORY TABLE (PAGINATED, STYLED CONSISTENTLY) */}
        <Card
          title="Prediction History (Past User Forecasts)"
          icon={History}
        >
          {loadingForecastHistory ? (
            <div className="text-center py-6 text-xs text-gray-400 animate-pulse">
              Loading prediction history...
            </div>
          ) : forecastHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              No market price forecasts logged yet. Select a crop and mandi above to generate a prediction.
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto min-w-full">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-emerald-50/60 text-[10px] font-bold text-emerald-900 uppercase border-b border-emerald-100">
                      <th className="py-2.5 px-3">Logged Date</th>
                      <th className="py-2.5 px-3">Crop</th>
                      <th className="py-2.5 px-3">Mandi</th>
                      <th className="py-2.5 px-3">Horizon</th>
                      <th className="py-2.5 px-3">Base Price</th>
                      <th className="py-2.5 px-3">Predicted Price</th>
                      <th className="py-2.5 px-3">Expected Change</th>
                      <th className="py-2.5 px-3">Trend</th>
                      <th className="py-2.5 px-3 text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {paginatedForecastHistory.map(item => (
                      <tr key={`fh-${item.id}`} className="hover:bg-gray-50 transition-all">
                        <td className="py-2.5 px-3 text-gray-500 font-mono text-[10px]">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-gray-900">{item.crop_name}</td>
                        <td className="py-2.5 px-3 text-gray-700">{item.mandi_name || `Mandi #${item.mandi_id}`}</td>
                        <td className="py-2.5 px-3 text-emerald-800 font-bold">{item.forecast_days} Days</td>
                        <td className="py-2.5 px-3 text-gray-700">₹{item.current_price?.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-black text-emerald-900">₹{item.predicted_price?.toLocaleString()}</td>
                        <td className={`py-2.5 px-3 font-bold ${item.expected_change_pct > 0 ? 'text-emerald-600' : item.expected_change_pct < 0 ? 'text-red-600' : 'text-amber-600'
                          }`}>
                          {item.expected_change_pct > 0 ? '+' : ''}{item.expected_change_pct}%
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${item.trend === 'Increasing' ? 'bg-emerald-100 text-emerald-800' :
                            item.trend === 'Decreasing' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                            {item.trend}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-600">
                          {item.confidence}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              {totalForecastPages > 1 && (
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100 text-xs">
                  <span className="text-gray-500 font-medium text-[11px]">
                    Showing page {forecastPage} of {totalForecastPages} ({forecastHistory.length} total prediction logs)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setForecastPage(p => Math.max(1, p - 1))}
                      disabled={forecastPage === 1}
                      className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 disabled:opacity-40 hover:bg-gray-50"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 inline" /> Prev
                    </button>
                    <span className="px-2 py-1 bg-gray-100 font-bold rounded-md text-[11px] text-gray-700">
                      {forecastPage} / {totalForecastPages}
                    </span>
                    <button
                      onClick={() => setForecastPage(p => Math.min(totalForecastPages, p + 1))}
                      disabled={forecastPage === totalForecastPages}
                      className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 disabled:opacity-40 hover:bg-gray-50"
                    >
                      Next <ChevronRight className="h-3.5 w-3.5 inline" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MarketPrice;
