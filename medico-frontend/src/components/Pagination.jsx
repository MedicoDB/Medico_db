import React from "react";
import "./Pagination.css";

/**
 * Pagination component with page number buttons
 * 
 * @param {number} currentPage - Current page (0-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {number} total - Total number of items
 * @param {number} pageSize - Items per page
 * @param {function} onPageChange - Callback when page changes (receives new page number, 0-indexed)
 */
const Pagination = ({ currentPage, totalPages, total, pageSize, onPageChange }) => {
  const start = total === 0 ? 0 : currentPage * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(total, (currentPage + 1) * pageSize);

  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7; // Show max 7 page buttons
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(0);
      
      let startPage = Math.max(1, currentPage - 1);
      let endPage = Math.min(totalPages - 2, currentPage + 1);
      
      // Adjust if we're near the start
      if (currentPage <= 2) {
        endPage = Math.min(4, totalPages - 2);
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 3) {
        startPage = Math.max(1, totalPages - 5);
      }
      
      // Add ellipsis after first page if needed
      if (startPage > 1) {
        pages.push('ellipsis-start');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 2) {
        pages.push('ellipsis-end');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages - 1);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const canPrev = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Showing {start.toLocaleString()}-{end.toLocaleString()} of {total.toLocaleString()}
      </div>
      
      <div className="pagination-controls">
        <button
          className="pagination-btn pagination-btn-nav"
          onClick={() => onPageChange(0)}
          disabled={!canPrev}
          title="First page"
        >
          ««
        </button>
        
        <button
          className="pagination-btn pagination-btn-nav"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canPrev}
          title="Previous page"
        >
          ← Previous
        </button>

        <div className="pagination-numbers">
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis-start' || page === 'ellipsis-end') {
              return (
                <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                  ...
                </span>
              );
            }
            
            const isActive = page === currentPage;
            return (
              <button
                key={page}
                className={`pagination-btn pagination-btn-number ${isActive ? 'active' : ''}`}
                onClick={() => onPageChange(page)}
                disabled={isActive}
              >
                {page + 1}
              </button>
            );
          })}
        </div>

        <button
          className="pagination-btn pagination-btn-nav"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
          title="Next page"
        >
          Next →
        </button>
        
        <button
          className="pagination-btn pagination-btn-nav"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={!canNext}
          title="Last page"
        >
          »»
        </button>
      </div>
    </div>
  );
};

export default Pagination;
