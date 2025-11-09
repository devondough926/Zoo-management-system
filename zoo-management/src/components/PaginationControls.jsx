import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

/**
 * Reusable Pagination Controls Component
 *
 * @param {Object} props
 * @param {number} props.currentPage - Current active page
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPageChange - Callback when page changes
 * @param {Array} props.paginationArray - Array of page numbers and 'ellipsis' strings
 * @param {string} props.className - Optional className for container
 */
export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  paginationArray,
  className = "",
  // when true, always render the controls even for single-page lists
  alwaysShow = false,
}) {
  if (totalPages <= 1 && !alwaysShow) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Build pagination array when one isn't provided via props.

  const buildPagination = () => {
    const total = Math.max(1, totalPages);

    // For very small totals show all pages
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

    const left = Math.max(1, currentPage - 2);
    const right = Math.min(total, currentPage + 2);

    const pages = [];

    pages.push(1);

    // leading gap
    if (left > 2) pages.push("ellipsis");
    else if (left === 2) pages.push(2);

    const start = Math.max(left, 2);
    const end = Math.min(right, total - 1);
    for (let p = start; p <= end; p++) pages.push(p);

    // trailing gap
    if (right < total - 1) pages.push("ellipsis");
    else if (right === total - 1) pages.push(total - 1);

    if (total > 1) pages.push(total);

    // Remove duplicate numeric pages but keep multiple ellipses
    return pages.filter((v, i, arr) =>
      typeof v === "number" ? arr.indexOf(v) === i : true
    );
  };

  // compute pages once and allow debugging output
  const pages = buildPagination();
  // eslint-disable-next-line no-console
  console.log && console.log("Pagination pages:", pages);

  return (
    <div className={`flex justify-center items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2 border-b border-gray-300">
        {/* Previous Button */}
        <Button
          variant="ghost"
          size="lg"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="gap-1 hover:bg-transparent"
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page Numbers */}
        <div className="flex gap-1">
          {pages.map((page, index) => {
            if (page === "ellipsis") {
              return (
                <div
                  key={`ellipsis-${index}`}
                  className="flex items-center justify-center min-w-[40px] h-9"
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
              );
            }

            return (
              <Button
                key={page}
                variant="ghost"
                size="lg"
                onClick={() => onPageChange(page)}
                className="min-w-[40px] text-m font-semibold"
                style={{
                  backgroundColor: "transparent",
                  borderBottom:
                    currentPage === page ? "2px solid black" : "none",
                  color: currentPage === page ? "black" : "inherit",
                  fontWeight: currentPage === page ? "500" : "normal",
                  cursor: "pointer",
                }}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Next Button */}
        <Button
          variant="ghost"
          size="lg"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="gap-1 hover:bg-transparent"
          aria-label="Go to next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
