import React, { useState } from 'react';
import {
    History, ChevronDown, ChevronUp, RefreshCw, Calendar, FlaskConical,
    Calculator, ChevronLeft, ChevronRight, Info, CheckCircle2, TrendingUp,
    TrendingDown, Droplet, Sprout, AlertCircle
} from 'lucide-react';
import Card from './Card';

const SubmissionHistory = ({
    title = "Past Submissions",
    records = [],
    loading = false,
    type = "crop",
    onRefresh,
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const itemsPerPage = 5;

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Recent';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const totalPages = Math.ceil((records?.length || 0) / itemsPerPage);
    const currentRecords = records?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || [];

    const toggleRow = (id, e) => {
        if (e) e.stopPropagation();
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Numbered pagination range generator (1 2 3 ... 33 34 style)
    const getPaginationRange = (current, total) => {
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }
        const pages = [];
        pages.push(1);
        if (current > 3) {
            pages.push('...');
        }
        const start = Math.max(2, current - 1);
        const end = Math.min(total - 1, current + 1);
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        if (current < total - 2) {
            pages.push('...');
        }
        pages.push(total);
        return pages;
    };

    const renderBadge = (item) => {
        if (type === 'crop' || type === 'pest' || type === 'yield' || type === 'soil') {
            const isLab = item.status === 'Lab-Based' ||
                item.is_estimated === false ||
                (item.details && !item.details.includes('Qualitative') && !item.details.includes('Estimated'));
            if (isLab) {
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        <FlaskConical className="h-3 w-3" />
                        Lab-Based
                    </span>
                );
            }
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                    <Calculator className="h-3 w-3" />
                    Estimated
                </span>
            );
        }
        if (type === 'sustainability') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                    <Sprout className="h-3 w-3 text-emerald-600" />
                    Grade: {item.grade || 'Audit'}
                </span>
            );
        }
        if (type === 'financial') {
            const isProfit = (item.profit || 0) >= 0;
            return (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded border shrink-0 ${isProfit ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {isProfit ? 'Profitable' : 'Net Loss'}
                </span>
            );
        }
        return null;
    };

    const renderItemDetails = (item) => {
        switch (type) {
            case 'crop':
                return {
                    summaryOutput: `Recommended Crop: ${item.predicted_crop}`,
                    summaryInputs: `N: ${item.n_content} | P: ${item.p_content} | K: ${item.k_content} | pH: ${item.ph}`,
                    extraBadge: item.confidence ? `${item.confidence.toFixed(1)}% match` : null,
                };
            case 'pest':
                return {
                    summaryOutput: item.details ? item.details.split(' for ')[0] : 'Pest Risk Analysis',
                    summaryInputs: item.details || 'Risk diagnosis & spray schedule',
                    extraBadge: item.pest_name ? `Pest: ${item.pest_name}` : null,
                };
            case 'yield':
                return {
                    summaryOutput: `Yield: ${item.expected_yield_kg ? item.expected_yield_kg.toLocaleString() : 0} kg`,
                    summaryInputs: `${item.crop_type || 'Crop'}, ${item.area_acres || 1} acre(s)`,
                    extraBadge: item.yield_per_acre ? `${item.yield_per_acre} kg/acre` : null,
                };
            case 'soil':
                return {
                    summaryOutput: `Soil Rating: ${item.health_status || 'Analyzed'}`,
                    summaryInputs: `NPK: ${item.n_content}-${item.p_content}-${item.k_content} | pH: ${item.ph}`,
                    extraBadge: item.ph ? `pH ${item.ph}` : null,
                };
            case 'financial':
                return {
                    summaryOutput: `Net Profit: ₹${(item.profit || 0).toLocaleString()}`,
                    summaryInputs: `${item.crop_type || 'Crop'} | Total Cost: ₹${(item.total_expense || 0).toLocaleString()}`,
                    extraBadge: `Revenue: ₹${(item.revenue || 0).toLocaleString()}`,
                };
            case 'sustainability':
                return {
                    summaryOutput: `Score: ${item.score || 0}/100 (${item.grade || 'N/A'})`,
                    summaryInputs: `${item.crop || 'Crop'} | Water: ${item.water_hours || 0}h/day | Fertilizer: ${item.fertilizer_type || 'Mixed'}`,
                    extraBadge: item.label || 'Assessment',
                };
            default:
                return {
                    summaryOutput: 'Submission Recorded',
                    summaryInputs: item.details || 'Feature Record',
                    extraBadge: null,
                };
        }
    };

    const renderExpandedContent = (item) => {
        switch (type) {
            case 'crop':
                return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-gray-400 block text-[10px]">Nitrogen (N)</span>
                            <span className="font-bold text-gray-800">{item.n_content} mg/kg</span>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-gray-400 block text-[10px]">Phosphorus (P)</span>
                            <span className="font-bold text-gray-800">{item.p_content} mg/kg</span>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-gray-400 block text-[10px]">Potassium (K)</span>
                            <span className="font-bold text-gray-800">{item.k_content} mg/kg</span>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-gray-400 block text-[10px]">pH Level</span>
                            <span className="font-bold text-gray-800">{item.ph}</span>
                        </div>
                        {item.rainfall && (
                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-gray-400 block text-[10px]">Rainfall</span>
                                <span className="font-bold text-gray-800">{item.rainfall} mm</span>
                            </div>
                        )}
                        {item.temperature && (
                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-gray-400 block text-[10px]">Temperature</span>
                                <span className="font-bold text-gray-800">{item.temperature} °C</span>
                            </div>
                        )}
                        {item.humidity && (
                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-gray-400 block text-[10px]">Humidity</span>
                                <span className="font-bold text-gray-800">{item.humidity} %</span>
                            </div>
                        )}
                        {item.confidence && (
                            <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 col-span-2 sm:col-span-1">
                                <span className="text-emerald-700 block text-[10px] font-bold">Prediction Match</span>
                                <span className="font-black text-emerald-800">{item.confidence.toFixed(1)}% Score</span>
                            </div>
                        )}
                    </div>
                );
            case 'yield':
                return (
                    <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-gray-400 block text-[10px]">Crop Type</span>
                                <span className="font-bold text-gray-800">{item.crop_type}</span>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-gray-400 block text-[10px]">Farm Area</span>
                                <span className="font-bold text-gray-800">{item.area_acres} Acre(s)</span>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-gray-400 block text-[10px]">Predicted Yield</span>
                                <span className="font-bold text-emerald-700">{item.expected_yield_kg ? item.expected_yield_kg.toLocaleString() : 0} kg</span>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-gray-400 block text-[10px]">Yield Density</span>
                                <span className="font-bold text-gray-800">{item.yield_per_acre || 0} kg/acre</span>
                            </div>
                        </div>
                    </div>
                );
            case 'pest':
                return (
                    <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900 leading-relaxed font-medium">
                        {item.details}
                    </div>
                );
            case 'soil':
                return (
                    <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-gray-400 block text-[10px]">Nitrogen</span>
                                <span className="font-bold text-gray-800">{item.n_content} mg/kg</span>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-gray-400 block text-[10px]">Phosphorus</span>
                                <span className="font-bold text-gray-800">{item.p_content} mg/kg</span>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-gray-400 block text-[10px]">Potassium</span>
                                <span className="font-bold text-gray-800">{item.k_content} mg/kg</span>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-gray-400 block text-[10px]">pH Level</span>
                                <span className="font-bold text-gray-800">{item.ph}</span>
                            </div>
                        </div>
                        {item.npk_summary && (
                            <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-medium">
                                {item.npk_summary}
                            </p>
                        )}
                    </div>
                );
            case 'financial':
                return (
                    <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-2 bg-red-50/70 border border-red-100 rounded-lg">
                                <span className="text-red-700 block text-[10px] font-bold">Total Expenses</span>
                                <span className="font-bold text-red-800">₹{(item.total_expense || 0).toLocaleString()}</span>
                            </div>
                            <div className="p-2 bg-emerald-50/70 border border-emerald-100 rounded-lg">
                                <span className="text-emerald-700 block text-[10px] font-bold">Gross Revenue</span>
                                <span className="font-bold text-emerald-800">₹{(item.revenue || 0).toLocaleString()}</span>
                            </div>
                            <div className="p-2 bg-eco-50 border border-eco-100 rounded-lg">
                                <span className="text-eco-800 block text-[10px] font-bold">Estimated Net Profit</span>
                                <span className="font-black text-eco-900">₹{(item.profit || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                );
            case 'sustainability':
                return (
                    <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-gray-400 block text-[10px]">Water Usage</span>
                                <span className="font-bold text-gray-800">{item.water_hours || 0} hrs/day</span>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-gray-400 block text-[10px]">Fertilizer Type</span>
                                <span className="font-bold text-gray-800">{item.fertilizer_type || 'Mixed'}</span>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-gray-400 block text-[10px]">Crop Rotation</span>
                                <span className="font-bold text-gray-800">{item.crop_rotation || 'Occasional'}</span>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-gray-400 block text-[10px]">Tillage Practice</span>
                                <span className="font-bold text-gray-800">{item.tillage_type || 'Reduced'}</span>
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                        {item.details || 'No additional parameters available.'}
                    </div>
                );
        }
    };

    const paginationRange = getPaginationRange(currentPage, totalPages);

    return (
        <Card className="mt-6 border border-gray-200 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-eco-50 text-eco-600">
                        <History className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            {title}
                            {records && records.length > 0 && (
                                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-eco-100 text-eco-800 border border-eco-200">
                                    {records.length}
                                </span>
                            )}
                        </h3>
                        <p className="text-xs text-gray-500">Your previous analysis records, most recent first</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {onRefresh && (
                        <button
                            type="button"
                            onClick={onRefresh}
                            className="p-1.5 text-gray-400 hover:text-eco-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Refresh history"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-eco-600' : ''}`} />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-eco-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        {isExpanded ? (
                            <>
                                <span>Collapse</span>
                                <ChevronUp className="h-4 w-4" />
                            </>
                        ) : (
                            <>
                                <span>Expand</span>
                                <ChevronDown className="h-4 w-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="pt-3 space-y-3">
                    {loading ? (
                        <div className="flex justify-center items-center py-8 text-gray-400">
                            <RefreshCw className="h-6 w-6 animate-spin text-eco-500 mr-2" />
                            <span className="text-sm font-medium">Loading your past submissions...</span>
                        </div>
                    ) : !records || records.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-gray-400 py-8 px-4 bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
                            <History className="h-8 w-8 text-gray-300 mb-2" />
                            <p className="text-xs font-semibold text-gray-600 text-center">
                                No past submissions yet — your results will appear here after you submit the form.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Compact Expandable Rows List */}
                            <div className="space-y-2">
                                {currentRecords.map((item, idx) => {
                                    const rowId = item.id || `row-${idx}`;
                                    const isRowExpanded = expandedRows.has(rowId);
                                    const details = renderItemDetails(item);

                                    return (
                                        <div
                                            key={rowId}
                                            onClick={(e) => toggleRow(rowId, e)}
                                            className={`group px-3 py-2 bg-white border rounded-xl transition-all cursor-pointer select-none ${isRowExpanded
                                                    ? 'border-eco-300 ring-2 ring-eco-500/10 shadow-xs'
                                                    : 'border-gray-100 hover:border-eco-200 hover:bg-gray-50/60'
                                                }`}
                                        >
                                            {/* Compact Summary Header Line */}
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap sm:flex-nowrap">
                                                    <span className="text-xs font-bold text-gray-900 shrink-0">
                                                        {details.summaryOutput}
                                                    </span>

                                                    <span className="text-gray-300 hidden sm:inline">•</span>

                                                    <span className="text-xs text-gray-500 truncate">
                                                        {details.summaryInputs}
                                                    </span>

                                                    {details.extraBadge && (
                                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 shrink-0">
                                                            {details.extraBadge}
                                                        </span>
                                                    )}

                                                    {renderBadge(item)}
                                                </div>

                                                <div className="flex items-center gap-2 text-xs shrink-0">
                                                    <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                                                        <Calendar className="h-3 w-3 text-gray-400" />
                                                        <span>{formatDate(item.created_at || item.harvest_date)}</span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => toggleRow(rowId, e)}
                                                        className="p-1 rounded-md text-gray-400 hover:text-eco-700 hover:bg-eco-50 transition-colors"
                                                    >
                                                        {isRowExpanded ? (
                                                            <ChevronUp className="h-4 w-4 text-eco-600" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 group-hover:text-gray-600" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expanded Detailed Panel */}
                                            {isRowExpanded && (
                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="mt-2.5 pt-2.5 border-t border-gray-100 text-xs animate-fadeIn"
                                                >
                                                    {renderExpandedContent(item)}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* PART 1 — TRUNCATED NUMBERED PAGINATION FOOTER */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs flex-wrap gap-2">
                                    <span className="text-gray-500 font-medium text-[11px]">
                                        Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, records.length)} of {records.length} records
                                    </span>

                                    <div className="flex items-center gap-1">
                                        {/* Previous Button */}
                                        <button
                                            type="button"
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                                            title="Previous Page"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>

                                        {/* Page Numbers */}
                                        {paginationRange.map((page, idx) => {
                                            if (page === '...') {
                                                return (
                                                    <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-400 text-xs font-bold">
                                                        ...
                                                    </span>
                                                );
                                            }
                                            const isActive = page === currentPage;
                                            return (
                                                <button
                                                    key={`page-${page}`}
                                                    type="button"
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors border ${isActive
                                                            ? 'bg-eco-600 text-white border-eco-600 shadow-xs'
                                                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}

                                        {/* Next Button */}
                                        <button
                                            type="button"
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                                            title="Next Page"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </Card>
    );
};

export default SubmissionHistory;

