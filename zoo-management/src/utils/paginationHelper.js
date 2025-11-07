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
  // If total pages is very small (3 or less), show all
  if (totalPages <= 3) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];
  const showEllipsis = "ellipsis";

  // Always show first page
  pages.push(1);

  // Determine if we're closer to the start or end
  const isNearStart = currentPage <= 2;
  const isNearEnd = currentPage >= totalPages - 1;

  if (isNearStart) {
    // Show: 1, 2, 3 ... lastPage
    for (let i = 2; i <= Math.min(3, totalPages - 1); i++) {
      pages.push(i);
    }
    if (totalPages > 4) {
      pages.push(showEllipsis);
    }
  } else if (isNearEnd) {
    // Show: 1 ... lastPage-2, lastPage-1, lastPage
    if (totalPages > 4) {
      pages.push(showEllipsis);
    }
    for (let i = Math.max(2, totalPages - 2); i < totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Show: 1 ... currentPage-1, currentPage, currentPage+1 ... lastPage
    pages.push(showEllipsis);
    pages.push(currentPage - 1);
    pages.push(currentPage);
    pages.push(currentPage + 1);
    pages.push(showEllipsis);
  }

  // Always show last page if not already included
  if (pages[pages.length - 1] !== totalPages) {
    pages.push(totalPages);
  }

  return pages;
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
