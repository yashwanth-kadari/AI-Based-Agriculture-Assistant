import React, { useState, useEffect, useCallback } from 'react';
import {
    ShoppingBag, Search, MapPin, Plus, X, Phone, Globe, AlertCircle, Trash2
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { getMarketplaceItems, addMarketplaceItem, deleteMarketplaceItem } from '../utils/api';
import { INDIAN_STATES, getDistrictsForState } from '../data/indianLocations';

const CATEGORIES = ['All', 'Seeds', 'Fertilizers', 'Machinery', 'Crops', 'Other'];

const Marketplace = ({ user }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');

    // Location filter state
    const [scope, setScope] = useState('nearby'); // 'nearby' | 'all'
    const [selectedState, setSelectedState] = useState(user?.state || '');
    const [selectedDistrict, setSelectedDistrict] = useState(user?.district || '');

    // Response metadata from backend
    const [userLocationInfo, setUserLocationInfo] = useState({ state: user?.state, district: user?.district });
    const [locationMissing, setLocationMissing] = useState(false);

    // Modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [form, setForm] = useState({
        title: '',
        category: 'Seeds',
        price: '',
        quantity: '',
        contact: user?.phone || '',
        description: '',
        state: user?.state || 'Andhra Pradesh',
        district: user?.district || 'Guntur',
        village: user?.village || ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Fetch Marketplace Items
    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                user_id: user?.id || user?.user_id,
                category: category !== 'All' ? category : undefined,
                q: search || undefined,
                scope: scope,
                state: selectedState || undefined,
                district: selectedDistrict || undefined,
            };

            const { data } = await getMarketplaceItems(params);
            setItems(data.items || []);
            setUserLocationInfo(data.user_location || { state: user?.state, district: user?.district });
            setLocationMissing(Boolean(data.user_location_missing));
        } catch (err) {
            console.error('Failed to fetch marketplace items:', err);
        } finally {
            setLoading(false);
        }
    }, [user, category, search, scope, selectedState, selectedDistrict]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchItems();
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [fetchItems]);

    const handleAddListing = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await addMarketplaceItem({
                ...form,
                user_id: user?.id || user?.user_id
            });
            setForm({
                title: '',
                category: 'Seeds',
                price: '',
                quantity: '',
                contact: user?.phone || '',
                description: '',
                state: user?.state || 'Andhra Pradesh',
                district: user?.district || 'Guntur',
                village: user?.village || ''
            });
            setShowAddModal(false);
            fetchItems();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to list item. Try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (itemId) => {
        if (!window.confirm('Are you sure you want to remove this listing?')) return;
        try {
            await deleteMarketplaceItem(itemId, user?.id || user?.user_id);
            fetchItems();
        } catch {
            alert('Failed to delete item listing.');
        }
    };

    const activeDistrict = selectedDistrict || userLocationInfo?.district || user?.district || '';
    const activeState = selectedState || userLocationInfo?.state || user?.state || '';
    const hasLocation = Boolean(activeState || activeDistrict);

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 page-header bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-gray-900">Farmers Marketplace</h1>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Location Filtered
                        </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                        Buy, sell, or rent farming seeds, equipment, and harvests directly from nearby farmers.
                    </p>
                </div>
                <Button onClick={() => setShowAddModal(true)} icon={Plus} className="shadow-md bg-emerald-600 hover:bg-emerald-700">
                    Add Listing
                </Button>
            </div>

            {/* Scope Banner Indicator */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${scope === 'nearby' && hasLocation ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {scope === 'nearby' && hasLocation ? <MapPin className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                    </div>
                    <div>
                        {!hasLocation || locationMissing ? (
                            <div>
                                <p className="text-xs font-bold text-amber-800 flex items-center gap-1">
                                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" /> Set your location in Profile to see nearby listings
                                </p>
                                <p className="text-[11px] text-gray-500">Currently showing all listings across India.</p>
                            </div>
                        ) : scope === 'nearby' ? (
                            <div>
                                <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                    <span>Showing listings near you</span>
                                    <span className="bg-emerald-100 text-emerald-900 font-extrabold px-2 py-0.5 rounded-md border border-emerald-200">
                                        📍 {activeDistrict ? `${activeDistrict}, ` : ''}{activeState}
                                    </span>
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5">Listings from your district and state are prioritized first.</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                    <span>Showing all listings across India</span>
                                    <span className="bg-blue-100 text-blue-900 font-extrabold px-2 py-0.5 rounded-md border border-blue-200">
                                        🇮🇳 All India Scope
                                    </span>
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5">Showing marketplace inventory from all states.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scope Toggle Buttons */}
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => { setScope('nearby'); setSelectedState(''); setSelectedDistrict(''); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${scope === 'nearby'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <MapPin className="h-3.5 w-3.5" />
                        Nearby Only {activeDistrict ? `(${activeDistrict})` : ''}
                    </button>
                    <button
                        onClick={() => setScope('all')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${scope === 'all'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Globe className="h-3.5 w-3.5" />
                        All India
                    </button>
                </div>
            </div>

            {/* Filter Toolbar: Search, Location Dropdowns & Categories */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Search Box */}
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search tractor, wheat seeds, location..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                    </div>

                    {/* State Filter Dropdown */}
                    <div>
                        <select
                            value={selectedState}
                            onChange={(e) => { setSelectedState(e.target.value); setSelectedDistrict(''); setScope('nearby'); }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 text-gray-800"
                        >
                            <option value="">All States</option>
                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* City / District Dropdown */}
                    <div>
                        <select
                            value={selectedDistrict}
                            onChange={(e) => { setSelectedDistrict(e.target.value); setScope('nearby'); }}
                            disabled={!selectedState}
                            className={`w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 text-gray-800 ${!selectedState ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            <option value="">{selectedState ? 'All Cities' : 'Select a state first'}</option>
                            {selectedState && getDistrictsForState(selectedState).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>

                {/* Category Pills */}
                <div className="flex gap-2 overflow-x-auto pb-1 w-full scrollbar-thin pt-1 border-t border-gray-100">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-3.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${category === cat
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid List */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                </div>
            ) : items.length === 0 ? (
                /* PART 2 EMPTY STATE WITH CLEAR ACTION BUTTON */
                <div className="text-center py-12 px-6 bg-white rounded-2xl border border-gray-100 shadow-xs space-y-4">
                    <div className="bg-emerald-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                        <ShoppingBag className="h-7 w-7" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900">
                            No listings found {scope === 'nearby' ? `near ${activeDistrict}, ${activeState}` : ''}
                        </h3>
                        <p className="text-gray-500 text-xs max-w-sm mx-auto mt-1 leading-relaxed">
                            {scope === 'nearby'
                                ? `No farmers in ${activeDistrict} have posted ${category !== 'All' ? category : ''} listings yet. Expand your search area to view listings from all across India.`
                                : 'Be the first to add a listing or try adjusting your search terms.'}
                        </p>
                    </div>
                    {scope === 'nearby' && (
                        <div>
                            <Button
                                onClick={() => setScope('all')}
                                icon={Globe}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                            >
                                Expand Search to All India
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => {
                        const isOwner = str(item.user_id) === str(user?.id) || str(item.user_id) === str(user?.user_id);
                        const isSameDistrict = item.is_same_district || item.district === activeDistrict;
                        const isSameState = item.is_same_state || item.state === activeState;

                        return (
                            <div
                                key={item.id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col p-5 space-y-4 relative group"
                            >
                                {/* Card Header: Category Badge + Price */}
                                <div className="flex justify-between items-start gap-2">
                                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                                        {item.category}
                                    </span>
                                    <span className="text-xl font-black text-emerald-700">₹{item.price?.toLocaleString()}</span>
                                </div>

                                {/* Title & Description */}
                                <div className="flex-1 space-y-1.5">
                                    <h3 className="text-base font-bold text-gray-950 truncate">{item.title}</h3>
                                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">{item.description}</p>
                                    {item.quantity && (
                                        <p className="text-xs font-semibold text-gray-700">
                                            Quantity: <span className="font-normal text-gray-500">{item.quantity}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Seller Location Bar */}
                                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5 text-gray-700 font-medium truncate">
                                        <MapPin className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                                        <span className="truncate">
                                            {item.village ? `${item.village}, ` : ''}{item.district}, {item.state}
                                        </span>
                                    </div>
                                    {isSameDistrict ? (
                                        <span className="px-2 py-0.5 text-[9px] font-extrabold bg-emerald-100 text-emerald-900 rounded-full border border-emerald-200 flex-shrink-0">
                                            📍 Same District
                                        </span>
                                    ) : isSameState ? (
                                        <span className="px-2 py-0.5 text-[9px] font-bold bg-teal-50 text-teal-800 rounded-full border border-teal-200 flex-shrink-0">
                                            Same State
                                        </span>
                                    ) : null}
                                </div>

                                {/* Card Footer: Contact & Ownership Actions */}
                                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                                        <Phone className="h-3.5 w-3.5 text-emerald-600" />
                                        <span>{item.contact}</span>
                                    </div>

                                    {isOwner ? (
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                            title="Remove listing"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    ) : (
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            Seller: {item.seller_name || 'Farmer'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Listing Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg shadow-2xl relative fade-in" title="Add Marketplace Listing" icon={ShoppingBag}>
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute right-4 top-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {error && <div className="bg-red-50 border border-red-100 text-red-700 p-2.5 rounded-xl text-xs mb-4">{error}</div>}

                        <form onSubmit={handleAddListing} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Item Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                                        placeholder="e.g. Tractor for Rent, Seeds"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500"
                                    >
                                        {CATEGORIES.slice(1).map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Price (₹) *</label>
                                    <input
                                        type="number"
                                        required
                                        value={form.price}
                                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                                        placeholder="e.g. 500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Quantity / Unit</label>
                                    <input
                                        type="text"
                                        value={form.quantity}
                                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                                        placeholder="e.g. 50 kg, Daily"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Listing State *</label>
                                    <select
                                        value={form.state}
                                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500"
                                    >
                                        {INDIAN_STATES.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Listing District *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.district}
                                        onChange={(e) => setForm({ ...form, district: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                                        placeholder="e.g. Ludhiana"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Contact Info *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.contact}
                                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                                    placeholder="e.g. Call +91 9876543210"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Detailed Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 h-20"
                                    placeholder="Additional specifications, age of equipment, quality levels..."
                                />
                            </div>

                            <div className="flex gap-3 justify-end pt-2">
                                <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                                    Submit Listing
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

// Helper strictly matching users ID representation
const str = (val) => String(val || '');

export default Marketplace;
