import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  showFirstLast?: boolean;
  showItemRange?: boolean;
  maxVisiblePages?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = false,
  pageSizeOptions = [10, 25, 50, 100],
  showFirstLast = true,
  showItemRange = true,
  maxVisiblePages = 7,
  size = 'md',
}) => {
  const sizeStyles = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  // Calculate visible page numbers
  const getVisiblePages = (): (number | 'ellipsis')[] => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    const leftBound = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const rightBound = Math.min(totalPages, leftBound + maxVisiblePages - 1);

    if (leftBound > 1) {
      pages.push(1);
      if (leftBound > 2) {
        pages.push('ellipsis');
      }
    }

    for (let i = leftBound; i <= rightBound; i++) {
      pages.push(i);
    }

    if (rightBound < totalPages) {
      if (rightBound < totalPages - 1) {
        pages.push('ellipsis');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  // Calculate item range
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const PageButton: React.FC<{
    page: number;
    isActive?: boolean;
    disabled?: boolean;
    onClick?: () => void;
  }> = ({ page, isActive = false, disabled = false, onClick }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeStyles[size]}
        rounded-lg border transition-colors
        ${
          isActive
            ? 'bg-blue-600 text-white border-blue-600 font-medium'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {page}
    </button>
  );

  const NavButton: React.FC<{
    icon: React.ReactNode;
    disabled?: boolean;
    onClick?: () => void;
    label: string;
  }> = ({ icon, disabled = false, onClick, label }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`
        ${sizeStyles[size]}
        rounded-lg border border-gray-300 bg-white text-gray-700 transition-colors
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
      `}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      {/* Item range info */}
      {showItemRange && (
        <div className={`text-gray-600 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          Showing {startItem.toLocaleString()} to {endItem.toLocaleString()} of{' '}
          {totalItems.toLocaleString()} items
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* First page */}
        {showFirstLast && (
          <NavButton
            icon={<ChevronsLeft className={iconSizes[size]} />}
            disabled={currentPage === 1}
            onClick={() => onPageChange(1)}
            label="First page"
          />
        )}

        {/* Previous page */}
        <NavButton
          icon={<ChevronLeft className={iconSizes[size]} />}
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          label="Previous page"
        />

        {/* Page numbers */}
        {visiblePages.map((page, index) =>
          page === 'ellipsis' ? (
            <div key={`ellipsis-${index}`} className={`${sizeStyles[size]} text-gray-400`}>
              <MoreHorizontal className={iconSizes[size]} />
            </div>
          ) : (
            <PageButton
              key={page}
              page={page}
              isActive={page === currentPage}
              onClick={() => onPageChange(page)}
            />
          )
        )}

        {/* Next page */}
        <NavButton
          icon={<ChevronRight className={iconSizes[size]} />}
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          label="Next page"
        />

        {/* Last page */}
        {showFirstLast && (
          <NavButton
            icon={<ChevronsRight className={iconSizes[size]} />}
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
            label="Last page"
          />
        )}
      </div>

      {/* Page size selector */}
      {showPageSizeSelector && onPageSizeChange && (
        <div className="flex items-center gap-2">
          <label className={`text-gray-600 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            Items per page:
          </label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className={`
              ${sizeStyles[size]}
              border border-gray-300 rounded-lg bg-white text-gray-700
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            `}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default Pagination;
