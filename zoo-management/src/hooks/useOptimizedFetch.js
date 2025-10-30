import { useState, useEffect, useRef } from "react";

/**
 * Optimized data fetching hook with caching and stale-while-revalidate
 *
 * Features:
 * - localStorage caching for instant page loads
 * - Stale-while-revalidate pattern (show cached data while fetching fresh)
 * - Automatic cache invalidation with timestamps
 * - Prevents unnecessary re-fetches on remount
 *
 * @param {string} cacheKey - Unique key for localStorage cache
 * @param {Function} fetchFn - Async function that fetches the data
 * @param {Object} options - Configuration options
 * @param {number} options.cacheTime - Cache validity in milliseconds (default: 5 minutes)
 * @param {boolean} options.enabled - Whether to fetch immediately (default: true)
 */
export function useOptimizedFetch(cacheKey, fetchFn, options = {}) {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes default
    enabled = true,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);

  // Track if we've already fetched in this session
  const hasFetchedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Prevent duplicate fetches on strict mode double mount
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchData = async () => {
      try {
        // Try to load from cache first
        const cached = getCachedData(cacheKey, cacheTime);

        if (cached) {
          // Show cached data immediately
          if (mountedRef.current) {
            setData(cached.data);
            setIsStale(cached.isStale);
            setLoading(false);
          }

          // If cache is fresh, no need to fetch
          if (!cached.isStale) {
            return;
          }
        }

        // Fetch fresh data
        const freshData = await fetchFn();

        if (!mountedRef.current) return;

        // Update state
        setData(freshData);
        setError(null);
        setIsStale(false);

        // Cache the fresh data
        setCachedData(cacheKey, freshData);
      } catch (err) {
        console.error(`Error fetching ${cacheKey}:`, err);
        if (mountedRef.current) {
          // Only show error if we don't have cached data
          if (!data) {
            setError(err.message || "Failed to fetch data");
          }
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, enabled, cacheTime]); // fetchFn is intentionally excluded to prevent re-fetching

  // Function to manually invalidate cache and refetch
  const refetch = async () => {
    clearCache(cacheKey);
    hasFetchedRef.current = false;
    setLoading(true);

    try {
      const freshData = await fetchFn();
      if (mountedRef.current) {
        setData(freshData);
        setError(null);
        setIsStale(false);
        setCachedData(cacheKey, freshData);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || "Failed to fetch data");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }

    hasFetchedRef.current = true;
  };

  return { data, loading, error, isStale, refetch };
}

// Helper functions for cache management
function getCachedData(key, maxAge) {
  try {
    const cached = localStorage.getItem(`cache_${key}`);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    // Return data with stale flag if it exists
    if (age < maxAge * 2) {
      // Keep stale data for 2x cache time
      return {
        data,
        isStale: age > maxAge,
      };
    }

    // Data is too old, remove it
    localStorage.removeItem(`cache_${key}`);
    return null;
  } catch (err) {
    console.warn("Cache read error:", err);
    return null;
  }
}

function setCachedData(key, data) {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
  } catch (err) {
    console.warn("Cache write error:", err);
  }
}

function clearCache(key) {
  try {
    localStorage.removeItem(`cache_${key}`);
  } catch (err) {
    console.warn("Cache clear error:", err);
  }
}

// Utility to clear specific cache keys
export function clearSpecificCache(...keys) {
  try {
    keys.forEach((key) => {
      localStorage.removeItem(`cache_${key}`);
    });
  } catch (err) {
    console.warn("Failed to clear specific cache:", err);
  }
}

// Utility to clear all cached data (useful for logout or data updates)
export function clearAllCache() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith("cache_")) {
        localStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.warn("Failed to clear all cache:", err);
  }
}
