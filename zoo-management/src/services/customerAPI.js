const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Helper to add credentials to fetch options
const fetchWithCredentials = (url, options = {}) => {
  return fetch(url, {
    ...options,
    credentials: "include",
  });
};

// Data caching removed - only images are cached

export const authAPI = {
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
        credentials: "include",
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

  loginEmployee: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/employee/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to login");
      }

      return data;
    } catch (error) {
      console.error("Employee login error:", error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to logout");
      }

      return await response.json();
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  },

  validateSession: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/session`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Session validation error:", error);
      return null;
    }
  },

  getProfile: async (customerId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/profile/${customerId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
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
          credentials: "include",
          body: JSON.stringify(profileData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

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
          credentials: "include",
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
    const response = await fetchWithCredentials(
      `${API_BASE_URL}/customer/exhibits`
    );
    if (!response.ok) throw new Error("Failed to fetch exhibits");
    const data = await response.json();
    return data;
  },

  getById: async (id) => {
    const response = await fetchWithCredentials(
      `${API_BASE_URL}/customer/exhibits/${id}`
    );
    if (!response.ok) throw new Error("Failed to fetch exhibit");
    const data = await response.json();
    return data;
  },
};

export const activitiesAPI = {
  getAll: async () => {
    const response = await fetchWithCredentials(
      `${API_BASE_URL}/customer/activities`
    );
    if (!response.ok) throw new Error("Failed to fetch activities");
    const data = await response.json();
    return data;
  },

  getByExhibit: async (exhibitId) => {
    const response = await fetchWithCredentials(
      `${API_BASE_URL}/customer/exhibits/${exhibitId}/activities`
    );
    if (!response.ok) throw new Error("Failed to fetch exhibit activities");
    const data = await response.json();
    return data;
  },

  getTodaysSchedule: async () => {
    const response = await fetchWithCredentials(
      `${API_BASE_URL}/customer/schedule/today`
    );
    if (!response.ok) throw new Error("Failed to fetch today's schedule");
    const data = await response.json();
    return data;
  },
};

export const animalsAPI = {
  getAll: async () => {
    const response = await fetchWithCredentials(
      `${API_BASE_URL}/customer/animals`
    );
    if (!response.ok) throw new Error("Failed to fetch animals");
    const data = await response.json();
    return data;
  },
};

export const enclosuresAPI = {
  getAll: async () => {
    const response = await fetchWithCredentials(
      `${API_BASE_URL}/customer/enclosures`
    );
    if (!response.ok) throw new Error("Failed to fetch enclosures");
    const data = await response.json();
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
      const response = await fetchWithCredentials(
        `${API_BASE_URL}/customer/purchases/history/${customerId}`
      );
      if (!response.ok) throw new Error("Failed to fetch purchase history");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get purchase history error:", error);
      throw error;
    }
  },

  getDetails: async (purchaseId) => {
    try {
      const response = await fetchWithCredentials(
        `${API_BASE_URL}/customer/purchases/details/${purchaseId}`
      );
      if (!response.ok) throw new Error("Failed to fetch purchase details");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get purchase details error:", error);
      throw error;
    }
  },

  create: async (purchaseData) => {
    try {
      const response = await fetchWithCredentials(
        `${API_BASE_URL}/customer/purchases`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(purchaseData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create purchase");
      }

      return data;
    } catch (error) {
      console.error("Create purchase error:", error);
      throw error;
    }
  },
};

export const membershipAPI = {
  getMembership: async (customerId) => {
    try {
      const response = await fetchWithCredentials(
        `${API_BASE_URL}/customer/membership/${customerId}`
      );
      if (!response.ok) throw new Error("Failed to fetch membership");
      return await response.json();
    } catch (error) {
      console.error("Get membership error:", error);
      return null;
    }
  },
};
