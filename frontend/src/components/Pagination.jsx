import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const getPaginationRange = (current, total) => {
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

const Pagination = ({
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    itemsPerPage = 10,
    onPageChange,
    className = "",
}) => {
    if (totalPages <= 1) return null;

    const pageNumbers = getPaginationRange(currentPage, totalPages);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 text-xs font-medium text-gray-500 ${className}`}>
            <div>
                Showing <strong className="text-gray-900">{startItem}</strong> to <strong className="text-gray-900">{endItem}</strong> of <strong className="text-gray-900">{totalItems}</strong> entries
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="flex items-center justify-center p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                    title="Previous Page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                {pageNumbers.map((page, index) => {
                    if (page === '...') {
                        return (
                            <span key={`ellipse-${index}`} className="px-2 py-1 text-gray-400 font-bold select-none">
                                ...
                            </span>
                        );
                    }
                    const isActive = page === currentPage;
                    return (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`min-w-[32px] h-8 px-2 flex items-center justify-center rounded-lg font-bold transition-all text-xs cursor-pointer ${isActive
                                    ? 'bg-eco-600 text-white shadow-xs border border-eco-600'
                                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {page}
                        </button>
                    );
                })}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="flex items-center justify-center p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                    title="Next Page"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
