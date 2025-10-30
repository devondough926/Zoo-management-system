// Hero image utility with dynamic imports
// Automatically handles missing images without build errors

import { useState, useEffect } from "react";

/**
 * Dynamically import a hero image if it exists
 * @param {string} pageName - Name of the page (e.g., 'food', 'animals')
 * @returns {Promise<string|null>} - Image URL or null if not available
 */
async function loadHeroImage(pageName) {
  try {
    const module = await import(`../assets/images/hero/${pageName}-hero.jpg`);
    return module.default;
  } catch (error) {
    console.warn(`Hero image for '${pageName}' not found`);
    return null;
  }
}

/**
 * Hero image cache to avoid re-importing
 */
const imageCache = {};

/**
 * Get hero image for a page (with caching)
 * @param {string} pageName - Name of the page (e.g., 'food', 'animals')
 * @returns {Promise<string|null>} - Image URL or null if not available
 */
export async function getHeroImage(pageName) {
  if (imageCache[pageName] !== undefined) {
    return imageCache[pageName];
  }

  const image = await loadHeroImage(pageName);
  imageCache[pageName] = image;
  return image;
}

/**
 * React hook to use hero images
 * @param {string} pageName - Name of the page
 * @returns {string|null} - Image URL or null if not available/loading
 */
export function useHeroImage(pageName) {
  const [image, setImage] = useState(imageCache[pageName] || null);

  useEffect(() => {
    getHeroImage(pageName).then(setImage);
  }, [pageName]);

  return image;
}

/**
 * Preload hero images for specific pages
 * Call this on app initialization to cache images
 * @param {string[]} pageNames - Array of page names to preload
 */
export async function preloadHeroImages(
  pageNames = ["food", "animals", "attractions", "tickets", "shop", "customer"]
) {
  await Promise.all(pageNames.map((name) => getHeroImage(name)));
}
