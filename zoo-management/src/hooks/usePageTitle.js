import { useEffect } from "react";

/**
 * Custom hook to update the browser document title
 * @param {string} title - The title to set for the current page
 */
export function usePageTitle(title) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | WildWood Zoo` : "WildWood Zoo";

    // Cleanup: restore previous title when component unmounts
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
