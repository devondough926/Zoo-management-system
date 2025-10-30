/**
 * Image preloader utility for optimizing image loading performance
 */

// Track preloaded images to avoid duplicate work
const preloadedImages = new Set();

// Cache priority levels - higher priority images get fetched with higher priority
const PRIORITY_HIGH = "high";
const PRIORITY_LOW = "low";

/**
 * Preload a single image
 * @param {string} src - Image URL to preload
 * @param {string} priority - 'high' or 'low' priority
 * @returns {Promise<void>}
 */
export function preloadImage(src, priority = PRIORITY_LOW) {
  if (!src || preloadedImages.has(src)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const img = new Image();

    // Set loading priority hint for better browser scheduling
    if (priority === PRIORITY_HIGH) {
      img.fetchPriority = "high";
    }

    // Force browser to decode immediately for faster display
    img.decoding = "async";

    img.onload = () => {
      preloadedImages.add(src);
      // Sync with ImageWithFallback cache
      if (typeof window !== "undefined" && window.__IMAGE_CACHE__) {
        window.__IMAGE_CACHE__.add(src);
      }
      resolve();
    };

    img.onerror = () => {
      console.warn(`Failed to preload image: ${src}`);
      // Don't reject - just resolve so other images continue loading
      resolve();
    };

    img.src = src;
  });
}

/**
 * Preload multiple images in parallel
 * @param {string[]} urls - Array of image URLs to preload
 * @param {string} priority - 'high' or 'low' priority for all images
 * @returns {Promise<void[]>}
 */
export function preloadImages(urls, priority = PRIORITY_LOW) {
  const validUrls = urls.filter((url) => url && !preloadedImages.has(url));

  if (validUrls.length === 0) {
    return Promise.resolve([]);
  }

  return Promise.allSettled(
    validUrls.map((url) => preloadImage(url, priority))
  );
}

/**
 * Preload images with priority (hero images first, then others)
 * @param {string[]} priorityUrls - High priority image URLs
 * @param {string[]} normalUrls - Normal priority image URLs
 * @returns {Promise<void>}
 */
export async function preloadImagesWithPriority(
  priorityUrls = [],
  normalUrls = []
) {
  // Load priority images first with high priority
  if (priorityUrls.length > 0) {
    await preloadImages(priorityUrls, PRIORITY_HIGH);
  }

  // Then load normal priority images in background
  if (normalUrls.length > 0) {
    setTimeout(() => {
      preloadImages(normalUrls, PRIORITY_LOW);
    }, 100);
  }
}

/**
 * Check if an image is already preloaded
 * @param {string} src - Image URL
 * @returns {boolean}
 */
export function isImagePreloaded(src) {
  return preloadedImages.has(src);
}

/**
 * Clear the preloaded images cache
 */
export function clearPreloadCache() {
  preloadedImages.clear();
}

/**
 * Get count of preloaded images
 * @returns {number}
 */
export function getPreloadedCount() {
  return preloadedImages.size;
}
