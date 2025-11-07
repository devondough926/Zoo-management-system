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

  return (
    <div className={`flex justify-center items-center gap-2 ${className}`}>
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="gap-1"
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page Numbers */}
      <div className="flex gap-1">
        {(paginationArray && paginationArray.length
          ? paginationArray
          : Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1)
        ).map((page, index) => {
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
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className="min-w-[40px]"
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
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="gap-1"
        aria-label="Go to next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
