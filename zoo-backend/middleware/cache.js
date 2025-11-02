/**
 * Simple in-memory cache middleware for GET requests
 * Cache is automatically cleared on any POST, PUT, PATCH, DELETE request
 */

const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(req) {
  return `${req.method}:${req.originalUrl}`;
}

function clearRelatedCache(path) {
  const keys = Array.from(cache.keys());
  keys.forEach((key) => {
    if (key.includes(path) || key.includes("GET:")) {
      cache.delete(key);
    }
  });
}

function cacheMiddleware(req, res, next) {
  if (req.method !== "GET") {
    const pathSegments = req.originalUrl.split("/").filter(Boolean);
    const basePath = pathSegments.slice(0, 3).join("/");
    clearRelatedCache(basePath);
    return next();
  }

  const cacheKey = getCacheKey(req);
  const cached = cache.get(cacheKey);

  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < CACHE_DURATION) {
      return res.json(cached.data);
    }
    cache.delete(cacheKey);
  }

  const originalJson = res.json.bind(res);
  res.json = function (data) {
    if (res.statusCode === 200) {
      cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
    }
    return originalJson(data);
  };

  next();
}

function clearAllCache() {
  cache.clear();
}

function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

export { cacheMiddleware, clearAllCache, getCacheStats };
