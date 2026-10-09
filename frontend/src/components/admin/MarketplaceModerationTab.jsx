import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Search, Trash2, CheckCircle2, ShieldAlert, X, Eye, Filter } from 'lucide-react';
import { getAdminMarketplaceItems, updateAdminMarketplaceItem, deleteAdminMarketplaceItem } from '../../utils/api';
import Pagination from '../Pagination';

const MarketplaceModerationTab = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, categoryFilter]);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await getAdminMarketplaceItems();
            setItems(data.items || []);
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to load marketplace listings.' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleStatusChange = async (itemId, newStatus) => {
        try {
            await updateAdminMarketplaceItem(itemId, { status: newStatus });
            setFeedback({ type: 'success', message: `Listing status updated to ${newStatus}.` });
            fetchItems();
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to update listing status.' });
        }
    };

    const handleRemoveListing = async (itemId, title) => {
        if (!window.confirm(`Remove marketplace listing "${title}"?`)) return;
        try {
            await deleteAdminMarketplaceItem(itemId);
            setFeedback({ type: 'success', message: `Listing "${title}" removed successfully.` });
            fetchItems();
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to remove listing.' });
        }
    };

    const categories = ['All', ...Array.from(new Set(items.map(i => i.category).filter(Boolean)))];

    const filteredItems = items.filter(i => {
        const q = search.toLowerCase();
        const matchesSearch = (i.title || '').toLowerCase().includes(q) ||
            (i.seller_name || '').toLowerCase().includes(q) ||
            (i.state || '').toLowerCase().includes(q) ||
            (i.district || '').toLowerCase().includes(q);
        const matchesStatus = statusFilter === 'All' || (i.status || 'Active') === statusFilter;
        const matchesCat = categoryFilter === 'All' || i.category === categoryFilter;
        return matchesSearch && matchesStatus && matchesCat;
    });

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                        <ShoppingBag className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Marketplace Moderation</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Audit, filter, flag, and remove crop & produce listings posted by farmers across all regions.
                        </p>
                    </div>
                </div>
            </div>

            {/* Feedback Alert */}
            {feedback.message && (
                <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                    <span>{feedback.message}</span>
                    <button onClick={() => setFeedback({ type: '', message: '' })} className="cursor-pointer">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center gap-3 justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search listings by title, seller, state..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-500">Category:</span>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none"
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-500">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Flagged">Flagged</option>
                            <option value="Removed">Removed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Listings Grid */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-2xl m-4">
                        <ShoppingBag className="h-10 w-10 text-emerald-300 mx-auto mb-2" />
                        <p className="text-gray-700 font-bold text-sm">No marketplace listings found.</p>
                        <p className="text-gray-400 text-xs mt-1">Adjust search parameters or status filter.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                        <th className="py-3.5 px-5">Listing Title</th>
                                        <th className="py-3.5 px-5">Category</th>
                                        <th className="py-3.5 px-5">Price & Qty</th>
                                        <th className="py-3.5 px-5">Seller Info</th>
                                        <th className="py-3.5 px-5">Location</th>
                                        <th className="py-3.5 px-5">Status</th>
                                        <th className="py-3.5 px-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
                                    {filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/70 transition-all">
                                            <td className="py-3.5 px-5 font-bold text-gray-900">
                                                {item.title}
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                    {item.category || 'Produce'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-5 font-mono font-bold text-emerald-700">
                                                ₹{item.price} <span className="text-gray-400 text-[10px] font-normal">/ {item.quantity}</span>
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <div className="font-bold text-gray-900">{item.seller_name || item.contact}</div>
                                                <div className="text-[10px] text-gray-400">{item.seller_email}</div>
                                            </td>
                                            <td className="py-3.5 px-5 text-gray-600">
                                                {item.district ? `${item.district}, ${item.state}` : item.state || 'India'}
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${(item.status || 'Active') === 'Active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : (item.status === 'Flagged' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-red-100 text-red-800 border-red-200')}`}>
                                                    {item.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-5 text-right space-x-2">
                                                {(item.status || 'Active') !== 'Flagged' && (item.status || 'Active') !== 'Removed' && (
                                                    <button
                                                        onClick={() => handleStatusChange(item.id, 'Flagged')}
                                                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg border border-amber-200 text-[11px] transition-all cursor-pointer"
                                                    >
                                                        Flag
                                                    </button>
                                                )}
                                                {(item.status || 'Active') !== 'Active' && (
                                                    <button
                                                        onClick={() => handleStatusChange(item.id, 'Active')}
                                                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-[11px] transition-all cursor-pointer"
                                                    >
                                                        Activate
                                                    </button>
                                                )}
                                                {(item.status || 'Active') !== 'Removed' && (
                                                    <button
                                                        onClick={() => handleRemoveListing(item.id, item.title)}
                                                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 text-[11px] transition-all cursor-pointer"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-gray-100">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(filteredItems.length / itemsPerPage)}
                                totalItems={filteredItems.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MarketplaceModerationTab;
