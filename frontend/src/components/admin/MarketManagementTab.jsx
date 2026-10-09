import React, { useState, useEffect, useCallback } from 'react';
import {
    TrendingUp, Store, Plus, Search, Filter, Edit, Trash2, CheckCircle,
    AlertCircle, X, Calendar, MapPin, Tag, RefreshCw, BarChart3, Layers
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../Card';
import Button from '../Button';
import Pagination from '../Pagination';
import {
    getMandis, createMandi, updateMandi, deleteMandi,
    getMarketPrices, addMarketPrice, updateMarketPrice, deleteMarketPrice,
    getMandiPriceHistory
} from '../../utils/api';
import { INDIAN_STATES, getDistrictsForState } from '../../data/indianLocations';

const CROPS = [
    'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Pulses', 'Potato', 'Tomato'
];

const UNITS = ['Quintal', 'Kg', 'Ton'];

const MarketManagementTab = () => {
    const [subTab, setSubTab] = useState('prices'); // 'mandis' | 'prices' | 'history'
    const [currentPagePrices, setCurrentPagePrices] = useState(1);
    const [currentPageMandis, setCurrentPageMandis] = useState(1);
    const itemsPerPage = 10;

    // ── Mandi State ─────────────────────────────────────────────────────────────
    const [mandis, setMandis] = useState([]);
    const [loadingMandis, setLoadingMandis] = useState(false);
    const [mandiSearch, setMandiSearch] = useState('');
    const [mandiStateFilter, setMandiStateFilter] = useState('');
    const [showMandiModal, setShowMandiModal] = useState(false);
    const [editingMandi, setEditingMandi] = useState(null);
    const [mandiForm, setMandiForm] = useState({
        name: '',
        state: 'Andhra Pradesh',
        district: 'Krishna',
        location: '',
        status: 'Active',
    });

    // ── Market Prices State ──────────────────────────────────────────────────────
    const [prices, setPrices] = useState([]);
    const [loadingPrices, setLoadingPrices] = useState(false);
    const [priceSearch, setPriceSearch] = useState('');
    const [cropFilter, setCropFilter] = useState('');
    const [mandiFilter, setMandiFilter] = useState('');
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [editingPrice, setEditingPrice] = useState(null);
    const [priceForm, setPriceForm] = useState({
        mandi_id: '',
        crop_name: 'Rice',
        price: '',
        unit: 'Quintal',
        price_date: new Date().toISOString().split('T')[0],
        min_price: '',
        max_price: '',
        modal_price: '',
        status: 'Active',
    });

    // ── History State ────────────────────────────────────────────────────────────
    const [histMandi, setHistMandi] = useState('');
    const [histCrop, setHistCrop] = useState('Rice');
    const [historyData, setHistoryData] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Status & Alerts
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [actionLoading, setActionLoading] = useState(false);

    // ── Data Fetchers ────────────────────────────────────────────────────────────
    const fetchMandis = useCallback(async () => {
        setLoadingMandis(true);
        try {
            const { data } = await getMandis({ state: mandiStateFilter, search: mandiSearch });
            setMandis(data.mandis || []);
            if (data.mandis?.length > 0) {
                setPriceForm(prev => (prev.mandi_id ? prev : { ...prev, mandi_id: data.mandis[0].id }));
                setHistMandi(prev => (prev || data.mandis[0].id));
            }
        } catch {
            setMandis([]);
        } finally {
            setLoadingMandis(false);
        }
    }, [mandiStateFilter, mandiSearch]);

    const fetchPrices = useCallback(async () => {
        setLoadingPrices(true);
        try {
            const { data } = await getMarketPrices({ crop: cropFilter, mandi_id: mandiFilter });
            setPrices(data.prices || []);
        } catch {
            setPrices([]);
        } finally {
            setLoadingPrices(false);
        }
    }, [cropFilter, mandiFilter]);

    const fetchHistory = useCallback(async () => {
        if (!histMandi) return;
        setLoadingHistory(true);
        try {
            const { data } = await getMandiPriceHistory({ mandi_id: histMandi, crop: histCrop });
            setHistoryData(data.history || []);
        } catch {
            setHistoryData([]);
        } finally {
            setLoadingHistory(false);
        }
    }, [histMandi, histCrop]);

    useEffect(() => { fetchMandis(); }, [fetchMandis]);
    useEffect(() => { fetchPrices(); }, [fetchPrices]);
    useEffect(() => { if (subTab === 'history') fetchHistory(); }, [subTab, fetchHistory]);
    useEffect(() => { setCurrentPagePrices(1); }, [priceSearch, cropFilter, mandiFilter]);
    useEffect(() => { setCurrentPageMandis(1); }, [mandiSearch, mandiStateFilter]);

    const showFeedback = (type, text) => {
        setMsg({ type, text });
        setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    };

    // ── Mandi Handlers ───────────────────────────────────────────────────────────
    const handleSaveMandi = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            if (editingMandi) {
                await updateMandi(editingMandi.id, mandiForm);
                showFeedback('success', `Mandi "${mandiForm.name}" updated successfully.`);
            } else {
                await createMandi(mandiForm);
                showFeedback('success', `Mandi "${mandiForm.name}" created successfully.`);
            }
            setShowMandiModal(false);
            setEditingMandi(null);
            setMandiForm({ name: '', state: 'Andhra Pradesh', district: 'Krishna', location: '', status: 'Active' });
            fetchMandis();
        } catch (err) {
            showFeedback('error', err.response?.data?.error || 'Failed to save Mandi.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeactivateMandi = async (mandi) => {
        if (!window.confirm(`Are you sure you want to deactivate ${mandi.name}?`)) return;
        try {
            await deleteMandi(mandi.id);
            showFeedback('success', `Mandi ${mandi.name} deactivated.`);
            fetchMandis();
        } catch (err) {
            showFeedback('error', err.response?.data?.error || 'Failed to deactivate Mandi.');
        }
    };

    // ── Market Price Handlers ────────────────────────────────────────────────────
    const handleSavePrice = async (e) => {
        e.preventDefault();
        const p = parseFloat(priceForm.price);
        const minP = priceForm.min_price ? parseFloat(priceForm.min_price) : p * 0.95;
        const maxP = priceForm.max_price ? parseFloat(priceForm.max_price) : p * 1.05;
        const modalP = priceForm.modal_price ? parseFloat(priceForm.modal_price) : p;

        if (minP > modalP || modalP > maxP) {
            showFeedback('error', 'Validation failed: Minimum price must be ≤ Modal price ≤ Maximum price.');
            return;
        }

        setActionLoading(true);
        try {
            if (editingPrice) {
                await updateMarketPrice(editingPrice.id, priceForm);
                showFeedback('success', 'Market price entry updated.');
            } else {
                await addMarketPrice(priceForm);
                showFeedback('success', 'New Mandi crop price saved to database.');
            }
            setShowPriceModal(false);
            setEditingPrice(null);
            setPriceForm({
                mandi_id: mandis[0]?.id || '',
                crop_name: 'Rice',
                price: '',
                unit: 'Quintal',
                price_date: new Date().toISOString().split('T')[0],
                min_price: '',
                max_price: '',
                modal_price: '',
                status: 'Active',
            });
            fetchPrices();
        } catch (err) {
            showFeedback('error', err.response?.data?.error || 'Failed to save market price.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleArchivePrice = async (price) => {
        if (!window.confirm('Archive this market price entry?')) return;
        try {
            await deleteMarketPrice(price.id);
            showFeedback('success', 'Price entry archived.');
            fetchPrices();
        } catch (err) {
            showFeedback('error', err.response?.data?.error || 'Failed to archive price.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-eco-50 rounded-2xl text-eco-600">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-gray-900">Mandi Agricultural Market Price Control</h2>
                            <span className="bg-eco-100 text-eco-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-eco-200">
                                MySQL DB Sync Active
                            </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5">
                            Manage APMC Mandis, publish daily crop rates, and maintain historical pricing data for farmers across India.
                        </p>
                    </div>
                </div>

                {/* Sub-Navigation Buttons */}
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setSubTab('prices')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${subTab === 'prices' ? 'bg-white text-eco-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        Crop Prices
                    </button>
                    <button
                        onClick={() => setSubTab('mandis')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${subTab === 'mandis' ? 'bg-white text-eco-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        Mandi Registry
                    </button>
                    <button
                        onClick={() => setSubTab('history')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${subTab === 'history' ? 'bg-white text-eco-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        Price Trends & History
                    </button>
                </div>
            </div>

            {/* Alert Banner */}
            {msg.text && (
                <div className={`p-4 rounded-xl text-xs font-bold border flex items-center justify-between ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                    <div className="flex items-center gap-2">
                        {msg.type === 'success' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                        <span>{msg.text}</span>
                    </div>
                    <button onClick={() => setMsg({ type: '', text: '' })}><X className="h-4 w-4" /></button>
                </div>
            )}

            {/* ── SUB-TAB 1: CROP PRICES ────────────────────────────────────────── */}
            {subTab === 'prices' && (
                <div className="space-y-4">
                    {/* Controls Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs">
                                <Search className="h-3.5 w-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search crop or mandi..."
                                    value={priceSearch}
                                    onChange={(e) => setPriceSearch(e.target.value)}
                                    className="bg-transparent border-none text-xs focus:outline-none w-44"
                                />
                            </div>

                            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold">
                                <Tag className="h-3.5 w-3.5 text-gray-500" />
                                <select
                                    value={cropFilter}
                                    onChange={(e) => setCropFilter(e.target.value)}
                                    className="bg-transparent border-none text-xs font-semibold text-gray-700 focus:outline-none"
                                >
                                    <option value="">All Crops</option>
                                    {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold">
                                <Store className="h-3.5 w-3.5 text-gray-500" />
                                <select
                                    value={mandiFilter}
                                    onChange={(e) => setMandiFilter(e.target.value)}
                                    className="bg-transparent border-none text-xs font-semibold text-gray-700 focus:outline-none"
                                >
                                    <option value="">All Mandis</option>
                                    {mandis.map(m => <option key={m.id} value={m.id}>{m.name} ({m.state})</option>)}
                                </select>
                            </div>

                            <button
                                onClick={fetchPrices}
                                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-all"
                                title="Refresh Prices"
                            >
                                <RefreshCw className={`h-4 w-4 ${loadingPrices ? 'animate-spin' : ''}`} />
                            </button>

                            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                                {prices.length} Latest Active Mandi Rates
                            </span>
                        </div>

                        <Button
                            icon={Plus}
                            onClick={() => {
                                setEditingPrice(null);
                                setPriceForm({
                                    mandi_id: mandis[0]?.id || '',
                                    crop_name: 'Rice',
                                    price: '',
                                    unit: 'Quintal',
                                    price_date: new Date().toISOString().split('T')[0],
                                    min_price: '',
                                    max_price: '',
                                    modal_price: '',
                                    status: 'Active',
                                });
                                setShowPriceModal(true);
                            }}
                            className="py-2 px-4 text-xs font-bold"
                        >
                            + Add Mandi Price Entry
                        </Button>
                    </div>

                    {/* Price Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loadingPrices ? (
                            <div className="flex justify-center py-16">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eco-600" />
                            </div>
                        ) : prices.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl m-4">
                                <TrendingUp className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm font-bold text-gray-700">No market price records found.</p>
                                <p className="text-xs text-gray-400 mt-1">Click "+ Add Mandi Price Entry" to record crop rates.</p>
                            </div>
                        ) : (() => {
                            const filteredPrices = prices.filter(p => !priceSearch || p.mandi_name?.toLowerCase().includes(priceSearch.toLowerCase()) || p.crop_name?.toLowerCase().includes(priceSearch.toLowerCase()) || p.state?.toLowerCase().includes(priceSearch.toLowerCase()) || p.district?.toLowerCase().includes(priceSearch.toLowerCase()));
                            const paginatedPrices = filteredPrices.slice((currentPagePrices - 1) * itemsPerPage, currentPagePrices * itemsPerPage);
                            return (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                                    <th className="py-3 px-4">Mandi</th>
                                                    <th className="py-3 px-4">Crop</th>
                                                    <th className="py-3 px-4">Current Price</th>
                                                    <th className="py-3 px-4">Price Range (Min - Max)</th>
                                                    <th className="py-3 px-4">Date</th>
                                                    <th className="py-3 px-4">Status</th>
                                                    <th className="py-3 px-4">Logged By</th>
                                                    <th className="py-3 px-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 font-medium">
                                                {paginatedPrices.map(p => (
                                                    <tr key={p.id} className="hover:bg-gray-50/70 transition-all">
                                                        <td className="py-3 px-4 font-bold text-gray-900">
                                                            {p.mandi_name}
                                                            <span className="block text-[10px] text-gray-400 font-normal">{p.district}, {p.state}</span>
                                                        </td>
                                                        <td className="py-3 px-4 font-bold text-eco-700">{p.crop_name}</td>
                                                        <td className="py-3 px-4 font-black text-gray-900 text-sm">
                                                            ₹{p.price?.toLocaleString()} <span className="text-[10px] text-gray-500 font-normal">/ {p.unit}</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-600">
                                                            ₹{p.min_price || Math.round(p.price * 0.95)} – ₹{p.max_price || Math.round(p.price * 1.05)}
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-500 font-mono">{p.price_date}</td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                                                                {p.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-500 text-[11px]">{p.creator_name || 'Admin'}</td>
                                                        <td className="py-3 px-4 text-right space-x-1">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingPrice(p);
                                                                    setPriceForm({
                                                                        mandi_id: p.mandi_id,
                                                                        crop_name: p.crop_name,
                                                                        price: p.price,
                                                                        unit: p.unit,
                                                                        price_date: p.price_date,
                                                                        min_price: p.min_price || '',
                                                                        max_price: p.max_price || '',
                                                                        modal_price: p.modal_price || '',
                                                                        status: p.status || 'Active',
                                                                    });
                                                                    setShowPriceModal(true);
                                                                }}
                                                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                                                                title="Edit Price"
                                                            >
                                                                <Edit className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleArchivePrice(p)}
                                                                className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                                                                title="Archive Entry"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="px-4 pb-4">
                                        <Pagination
                                            currentPage={currentPagePrices}
                                            totalPages={Math.ceil(filteredPrices.length / itemsPerPage)}
                                            totalItems={filteredPrices.length}
                                            itemsPerPage={itemsPerPage}
                                            onPageChange={setCurrentPagePrices}
                                        />
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* ── SUB-TAB 2: MANDI REGISTRY ────────────────────────────────────── */}
            {subTab === 'mandis' && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs">
                                <Search className="h-3.5 w-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search mandi name or district..."
                                    value={mandiSearch}
                                    onChange={(e) => setMandiSearch(e.target.value)}
                                    className="bg-transparent border-none text-xs focus:outline-none w-48"
                                />
                            </div>

                            <select
                                value={mandiStateFilter}
                                onChange={(e) => setMandiStateFilter(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700"
                            >
                                <option value="">All States</option>
                                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <Button
                            icon={Plus}
                            onClick={() => {
                                setEditingMandi(null);
                                setMandiForm({ name: '', state: 'Andhra Pradesh', district: 'Krishna', location: '', status: 'Active' });
                                setShowMandiModal(true);
                            }}
                            className="py-2 px-4 text-xs font-bold"
                        >
                            + Add New Mandi
                        </Button>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loadingMandis ? (
                            <div className="flex justify-center py-16">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eco-600" />
                            </div>
                        ) : mandis.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl m-4">
                                <Store className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm font-bold text-gray-700">No mandis found in registry.</p>
                            </div>
                        ) : (() => {
                            const paginatedMandis = mandis.slice((currentPageMandis - 1) * itemsPerPage, currentPageMandis * itemsPerPage);
                            return (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                                    <th className="py-3 px-4">Mandi Name</th>
                                                    <th className="py-3 px-4">State</th>
                                                    <th className="py-3 px-4">District</th>
                                                    <th className="py-3 px-4">Location / Address</th>
                                                    <th className="py-3 px-4">Status</th>
                                                    <th className="py-3 px-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 font-medium">
                                                {paginatedMandis.map(m => (
                                                    <tr key={m.id} className="hover:bg-gray-50/70 transition-all">
                                                        <td className="py-3 px-4 font-bold text-gray-900">{m.name}</td>
                                                        <td className="py-3 px-4 text-gray-700">{m.state}</td>
                                                        <td className="py-3 px-4 text-gray-700">{m.district}</td>
                                                        <td className="py-3 px-4 text-gray-500">{m.location || 'N/A'}</td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${m.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                                                {m.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right space-x-1">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingMandi(m);
                                                                    setMandiForm({ name: m.name, state: m.state, district: m.district, location: m.location || '', status: m.status || 'Active' });
                                                                    setShowMandiModal(true);
                                                                }}
                                                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                                                                title="Edit Mandi"
                                                            >
                                                                <Edit className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeactivateMandi(m)}
                                                                className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                                                                title="Deactivate Mandi"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="px-4 pb-4">
                                        <Pagination
                                            currentPage={currentPageMandis}
                                            totalPages={Math.ceil(mandis.length / itemsPerPage)}
                                            totalItems={mandis.length}
                                            itemsPerPage={itemsPerPage}
                                            onPageChange={setCurrentPageMandis}
                                        />
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* ── SUB-TAB 3: PRICE HISTORY ──────────────────────────────────────── */}
            {subTab === 'history' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-gray-700">Mandi:</label>
                            <select
                                value={histMandi}
                                onChange={(e) => setHistMandi(e.target.value)}
                                className="px-3 py-1.5 border rounded-xl text-xs bg-white font-semibold"
                            >
                                {mandis.map(m => <option key={m.id} value={m.id}>{m.name} ({m.state})</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-gray-700">Crop:</label>
                            <select
                                value={histCrop}
                                onChange={(e) => setHistCrop(e.target.value)}
                                className="px-3 py-1.5 border rounded-xl text-xs bg-white font-semibold"
                            >
                                {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <Card title="Historical Price Trajectory" icon={BarChart3}>
                        <div className="h-72">
                            {loadingHistory ? (
                                <div className="flex flex-col items-center justify-center h-full text-eco-600">
                                    <RefreshCw className="h-8 w-8 animate-spin mb-2" />
                                    <p className="text-xs font-semibold">Loading price trajectory...</p>
                                </div>
                            ) : historyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={historyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip formatter={(val) => [`₹${val}`, 'Price/Quintal']} />
                                        <Line type="monotone" dataKey="price" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <BarChart3 className="h-10 w-10 text-gray-300 mb-2" />
                                    <p className="text-xs text-center">No historical entries recorded for this Mandi + Crop selection.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* ── MODAL: Add/Edit Mandi ────────────────────────────────────────── */}
            {showMandiModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-lg font-bold text-gray-900">{editingMandi ? 'Edit Mandi' : 'Add New Mandi'}</h3>
                            <button onClick={() => setShowMandiModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                        </div>

                        <form onSubmit={handleSaveMandi} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Mandi Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Vijayawada Mandi"
                                    value={mandiForm.name}
                                    onChange={(e) => setMandiForm({ ...mandiForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-xl"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">State *</label>
                                    <select
                                        value={mandiForm.state}
                                        onChange={(e) => {
                                            const st = e.target.value;
                                            const dists = getDistrictsForState(st);
                                            setMandiForm({ ...mandiForm, state: st, district: dists[0] || '' });
                                        }}
                                        className="w-full px-3 py-2 border rounded-xl bg-white"
                                    >
                                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">District *</label>
                                    <select
                                        value={mandiForm.district}
                                        onChange={(e) => setMandiForm({ ...mandiForm, district: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-xl bg-white"
                                    >
                                        {getDistrictsForState(mandiForm.state).map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Location / Market Address</label>
                                <input
                                    type="text"
                                    placeholder="e.g. APMC Yard, Governorpet"
                                    value={mandiForm.location}
                                    onChange={(e) => setMandiForm({ ...mandiForm, location: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-xl"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Status</label>
                                <select
                                    value={mandiForm.status}
                                    onChange={(e) => setMandiForm({ ...mandiForm, status: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-xl bg-white font-bold"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <Button type="button" variant="secondary" onClick={() => setShowMandiModal(false)}>Cancel</Button>
                                <Button type="submit" isLoading={actionLoading}>Save Mandi</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL: Add/Edit Market Price ───────────────────────────────────── */}
            {showPriceModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-lg font-bold text-gray-900">{editingPrice ? 'Edit Mandi Price' : 'Add Mandi Crop Price'}</h3>
                            <button onClick={() => setShowPriceModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                        </div>

                        <form onSubmit={handleSavePrice} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Select Mandi *</label>
                                <select
                                    required
                                    value={priceForm.mandi_id}
                                    onChange={(e) => setPriceForm({ ...priceForm, mandi_id: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-xl bg-white font-bold text-gray-900"
                                >
                                    {mandis.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.district}, {m.state})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Crop Type *</label>
                                    <select
                                        value={priceForm.crop_name}
                                        onChange={(e) => setPriceForm({ ...priceForm, crop_name: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-xl bg-white font-bold"
                                    >
                                        {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Price Unit *</label>
                                    <select
                                        value={priceForm.unit}
                                        onChange={(e) => setPriceForm({ ...priceForm, unit: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-xl bg-white font-bold"
                                    >
                                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Current Price (₹) *</label>
                                    <input
                                        type="number"
                                        step="1"
                                        required
                                        placeholder="e.g. 2400"
                                        value={priceForm.price}
                                        onChange={(e) => setPriceForm({ ...priceForm, price: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-xl font-bold text-emerald-700"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Price Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={priceForm.price_date}
                                        onChange={(e) => setPriceForm({ ...priceForm, price_date: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-xl font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Min Price (₹)</label>
                                    <input
                                        type="number"
                                        placeholder="Optional (e.g. 2300)"
                                        value={priceForm.min_price}
                                        onChange={(e) => setPriceForm({ ...priceForm, min_price: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Max Price (₹)</label>
                                    <input
                                        type="number"
                                        placeholder="Optional (e.g. 2500)"
                                        value={priceForm.max_price}
                                        onChange={(e) => setPriceForm({ ...priceForm, max_price: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <Button type="button" variant="secondary" onClick={() => setShowPriceModal(false)}>Cancel</Button>
                                <Button type="submit" isLoading={actionLoading}>Save Crop Price</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketManagementTab;
