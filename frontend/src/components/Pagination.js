import React from "react";

// Returns page numbers with "..." gaps. Cases:
// 1. Few pages: show them all.
// 2. Current page near the start: 1 2 3 4 5 ... last
// 3. Current page near the end: 1 ... last-4 ... last
// 4. Middle: 1 ... current-1 current current+1 ... last
export function getPageNumbers(currentPage, totalPages) {
  const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

  if (totalPages <= 7) return range(1, totalPages);

  if (currentPage <= 4) return [...range(1, 5), "...", totalPages];

  if (currentPage >= totalPages - 3) {
    return [1, "...", ...range(totalPages - 4, totalPages)];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="page-button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        Previous
      </button>
      <ul className="page-numbers">
        {getPageNumbers(currentPage, totalPages).map((page, index) =>
          page === "..." ? (
            <li key={`ellipsis-${index}`} className="page-ellipsis" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={page}>
              <button
                type="button"
                className={`page-button${page === currentPage ? " page-button--active" : ""}`}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? "page" : undefined}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            </li>
          )
        )}
      </ul>
      <button
        type="button"
        className="page-button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Next
      </button>
    </nav>
  );
}

export default Pagination;
