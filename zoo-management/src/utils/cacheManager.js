/**
 * Cache Management Utilities
 *
 * Centralized cache management for the Zoo Management System
 * Use these utilities when data changes to keep the UI in sync
 */

import { clearAllCache } from "../hooks/useOptimizedFetch";

/**
 * Clear all caches - useful after major data changes or logout
 */
export function invalidateAllCaches() {
  clearAllCache();
}

/**
 * Clear specific cache by key
 */
export function invalidateCache(key) {
  try {
    localStorage.removeItem(`cache_${key}`);
  } catch (err) {
    console.warn(`Failed to clear cache: ${key}`, err);
  }
}

/**
 * Cache keys used throughout the application
 * Centralized for easy reference and updates
 */
export const CACHE_KEYS = {
  // Customer-facing data
  ANIMALS: "animals",
  ENCLOSURES: "enclosures",
  EXHIBITS: "exhibits",
  ACTIVITIES: "activities",
  SHOP_ITEMS: "shop_items",
  CONCESSION_ITEMS: "concession_items",

  // Admin data
  EMPLOYEES: "employees",
  LOCATIONS: "locations",
  JOB_TITLES: "job_titles",
  MEMBERSHIPS: "memberships",
  REVENUE: "revenue_data",

  // Pricing
  PRICING: "pricing",
};

/**
 * Invalidate related caches when specific data changes
 * Call this after create/update/delete operations
 */
export function invalidateRelatedCaches(operation) {
  switch (operation) {
    case "animal":
      invalidateCache(CACHE_KEYS.ANIMALS);
      invalidateCache(CACHE_KEYS.ENCLOSURES);
      break;

    case "exhibit":
      invalidateCache(CACHE_KEYS.EXHIBITS);
      invalidateCache(CACHE_KEYS.ACTIVITIES);
      break;

    case "shop":
      invalidateCache(CACHE_KEYS.SHOP_ITEMS);
      break;

    case "concession":
      invalidateCache(CACHE_KEYS.CONCESSION_ITEMS);
      break;

    case "employee":
      invalidateCache(CACHE_KEYS.EMPLOYEES);
      invalidateCache(CACHE_KEYS.LOCATIONS);
      break;

    case "pricing":
      invalidateCache(CACHE_KEYS.PRICING);
      break;

    case "all":
      invalidateAllCaches();
      break;

    default:
      console.warn(`Unknown operation: ${operation}`);
  }
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats() {
  const stats = {};
  try {
    Object.values(CACHE_KEYS).forEach((key) => {
      const cached = localStorage.getItem(`cache_${key}`);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        stats[key] = {
          age: Math.round(age / 1000) + "s",
          size: new Blob([JSON.stringify(data)]).size + " bytes",
          itemCount: Array.isArray(data) ? data.length : "N/A",
        };
      } else {
        stats[key] = "Not cached";
      }
    });
  } catch (err) {
    console.error("Error getting cache stats:", err);
  }
  return stats;
}

/**
 * Usage Examples:
 *
 * // After creating a new animal
 * const handleAddAnimal = async (animalData) => {
 *   await animalsAPI.create(animalData);
 *   invalidateRelatedCaches('animal');
 * };
 *
 * // After updating pricing
 * const handleUpdatePricing = async (prices) => {
 *   await updatePrices(prices);
 *   invalidateRelatedCaches('pricing');
 * };
 *
 * // On logout
 * const handleLogout = () => {
 *   invalidateAllCaches();
 *   navigate('/login');
 * };
 *
 * // Debug cache in console
 * console.table(getCacheStats());
 */
