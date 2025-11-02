import { clearSpecificCache } from "../hooks/useOptimizedFetch";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CACHE_DURATION = 5 * 60 * 1000;

const cache = new Map();

function getCachedData(key) {
  const cached = cache.get(key);
  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  if (age > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

function setCachedData(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

function clearCache(...keys) {
  keys.forEach((key) => cache.delete(key));
  clearSpecificCache(...keys);
}

export const authAPI = {
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to register");
      }

      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to login");
      }

      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  getProfile: async (customerId) => {
    try {
      const cacheKey = `profile_${customerId}`;
      const cached = getCachedData(cacheKey);
      if (cached) return cached;

      const response = await fetch(
        `${API_BASE_URL}/auth/profile/${customerId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Get profile error:", error);
      throw error;
    }
  },

  updateProfile: async (customerId, profileData) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/profile/${customerId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      clearCache(`profile_${customerId}`);
      return data;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  },

  changePassword: async (customerId, passwordData) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/profile/${customerId}/password`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(passwordData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      return data;
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  },

  checkConnection: async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL.replace("/api", "")}/health`,
        {
          method: "GET",
        }
      );
      return response.ok;
    } catch (error) {
      return false;
    }
  },
};

export const exhibitsAPI = {
  getAll: async () => {
    const cacheKey = "customer_exhibits";
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${API_BASE_URL}/customer/exhibits`);
    if (!response.ok) throw new Error("Failed to fetch exhibits");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },

  getById: async (id) => {
    const cacheKey = `customer_exhibit_${id}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${API_BASE_URL}/customer/exhibits/${id}`);
    if (!response.ok) throw new Error("Failed to fetch exhibit");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },
};

export const activitiesAPI = {
  getAll: async () => {
    const cacheKey = "customer_activities";
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${API_BASE_URL}/customer/activities`);
    if (!response.ok) throw new Error("Failed to fetch activities");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },

  getByExhibit: async (exhibitId) => {
    const cacheKey = `customer_exhibit_${exhibitId}_activities`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(
      `${API_BASE_URL}/customer/exhibits/${exhibitId}/activities`
    );
    if (!response.ok) throw new Error("Failed to fetch exhibit activities");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },

  getTodaysSchedule: async () => {
    const cacheKey = "customer_todays_schedule";
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${API_BASE_URL}/customer/schedule/today`);
    if (!response.ok) throw new Error("Failed to fetch today's schedule");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },
};

export const animalsAPI = {
  getAll: async () => {
    const cacheKey = "customer_animals";
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${API_BASE_URL}/customer/animals`);
    if (!response.ok) throw new Error("Failed to fetch animals");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },
};

export const enclosuresAPI = {
  getAll: async () => {
    const cacheKey = "customer_enclosures";
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${API_BASE_URL}/customer/enclosures`);
    if (!response.ok) throw new Error("Failed to fetch enclosures");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },
};

export const formatTime = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${period}`;
};

export const purchasesAPI = {
  getHistory: async (customerId) => {
    try {
      const cacheKey = `purchases_${customerId}`;
      const cached = getCachedData(cacheKey);
      if (cached) return cached;

      const response = await fetch(
        `${API_BASE_URL}/customer/purchases/${customerId}`
      );
      if (!response.ok) throw new Error("Failed to fetch purchase history");
      const data = await response.json();

      setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Get purchase history error:", error);
      throw error;
    }
  },

  getDetails: async (purchaseId) => {
    try {
      const cacheKey = `purchase_details_${purchaseId}`;
      const cached = getCachedData(cacheKey);
      if (cached) return cached;

      const response = await fetch(
        `${API_BASE_URL}/customer/purchases/${purchaseId}/details`
      );
      if (!response.ok) throw new Error("Failed to fetch purchase details");
      const data = await response.json();

      setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Get purchase details error:", error);
      throw error;
    }
  },

  create: async (purchaseData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customer/purchases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purchaseData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create purchase");
      }

      if (purchaseData.Customer_ID) {
        clearCache(`purchases_${purchaseData.Customer_ID}`);
      }

      return data;
    } catch (error) {
      console.error("Create purchase error:", error);
      throw error;
    }
  },
};
