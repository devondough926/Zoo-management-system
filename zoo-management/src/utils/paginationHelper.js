/**
 * Generates a smart pagination array that shows:
 * - First few pages, ellipsis, last page when on early pages (e.g., 1, 2, 3 ... 6)
 * - First page, ellipsis, last few pages when on later pages (e.g., 1 ... 4, 5, 6)
 * - All pages if total is small enough
 *
 * @param {number} currentPage - The current active page (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {number} maxVisible - Maximum number of page buttons to show (default: 5)
 * @returns {Array} Array of page numbers and 'ellipsis' strings
 */
export function generatePaginationArray(
  currentPage,
  totalPages,
  maxVisible = 5
) {
  // New behavior:
  // - Show a centered window currentPage +/- 2
  // - Always include first and last
  // - Use 'ellipsis' when the gap between window and ends is > 1
  // - If the gap is exactly 1, include the intervening page (no ellipsis)
  const total = Math.max(1, totalPages);

  // For very small totals show all pages
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  const left = Math.max(1, currentPage - 2);
  const right = Math.min(total, currentPage + 2);

  const pages = [];

  // always first
  pages.push(1);

  // leading gap
  if (left > 2) {
    pages.push("ellipsis");
  } else if (left === 2) {
    pages.push(2);
  }

  const start = Math.max(left, 2);
  const end = Math.min(right, total - 1);
  for (let p = start; p <= end; p++) pages.push(p);

  // trailing gap
  if (right < total - 1) {
    pages.push("ellipsis");
  } else if (right === total - 1) {
    pages.push(total - 1);
  }

  if (total > 1) pages.push(total);

  // remove duplicates while preserving order
  return pages.filter((v, i, arr) => arr.indexOf(v) === i);
}

/**
 * Hook for managing pagination state and logic
 *
 * @param {number} totalItems - Total number of items to paginate
 * @param {number} itemsPerPage - Number of items per page
 * @returns {Object} Pagination state and helper functions
 */
export function usePagination(totalItems, itemsPerPage = 12) {
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    goToPage(currentPage + 1);
  };

  const prevPage = () => {
    goToPage(currentPage - 1);
  };

  const resetPage = () => {
    setCurrentPage(1);
  };

  // Generate pagination array
  const paginationArray = generatePaginationArray(currentPage, totalPages);

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    paginationArray,
    canGoNext: currentPage < totalPages,
    canGoPrev: currentPage > 1,
  };
}
