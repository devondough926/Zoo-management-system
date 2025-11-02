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

export const employeeAPI = {
  getAll: async () => {
    const cacheKey = "employees";
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${API_BASE_URL}/admin/employees`);
    if (!response.ok) throw new Error("Failed to fetch employees");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },

  getById: async (id) => {
    const cacheKey = `employee_${id}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${API_BASE_URL}/admin/employees/${id}`);
    if (!response.ok) throw new Error("Failed to fetch employee");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },

  create: async (employeeData) => {
    const response = await fetch(`${API_BASE_URL}/admin/employees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employeeData),
    });
    if (!response.ok) throw new Error("Failed to create employee");
    const data = await response.json();

    clearCache("employees", "locations");
    return data;
  },

  update: async (id, employeeData) => {
    const response = await fetch(`${API_BASE_URL}/admin/employees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employeeData),
    });
    if (!response.ok) throw new Error("Failed to update employee");
    const data = await response.json();

    clearCache("employees", "locations", `employee_${id}`);
    return data;
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/employees/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || "Failed to delete employee");
      error.response = { data: errorData };
      throw error;
    }
    const data = await response.json();

    clearCache("employees", "locations", `employee_${id}`);
    return data;
  },

  updateSalary: async (id, salary) => {
    const response = await fetch(
      `${API_BASE_URL}/admin/employees/${id}/salary`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salary }),
      }
    );
    if (!response.ok) throw new Error("Failed to update salary");
    const data = await response.json();

    clearCache("employees", `employee_${id}`);
    return data;
  },
};

export const locationAPI = {
  getAll: async () => {
    const cacheKey = "locations";
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${API_BASE_URL}/admin/locations`);
    if (!response.ok) throw new Error("Failed to fetch locations");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },

  getEmployees: async (locationId) => {
    const cacheKey = `location_${locationId}_employees`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(
      `${API_BASE_URL}/admin/locations/${locationId}/employees`
    );
    if (!response.ok) throw new Error("Failed to fetch employees for location");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },

  updateSupervisor: async (locationId, supervisorId) => {
    const response = await fetch(
      `${API_BASE_URL}/admin/locations/${locationId}/supervisor`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supervisorId }),
      }
    );
    if (!response.ok) throw new Error("Failed to update supervisor");
    const data = await response.json();

    clearCache("locations", "employees", `location_${locationId}_employees`);
    return data;
  },
};

export const exhibitAPI = {
  getAll: async () => {
    const cacheKey = "exhibits";
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${API_BASE_URL}/admin/exhibits`);
    if (!response.ok) throw new Error("Failed to fetch exhibits");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },

  getById: async (id) => {
    const cacheKey = `exhibit_${id}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${API_BASE_URL}/admin/exhibits/${id}`);
    if (!response.ok) throw new Error("Failed to fetch exhibit");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },

  create: async (exhibitData) => {
    const response = await fetch(`${API_BASE_URL}/admin/exhibits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(exhibitData),
    });
    if (!response.ok) throw new Error("Failed to create exhibit");
    const data = await response.json();

    clearCache("exhibits", "activities", "todaysSchedule");
    return data;
  },

  update: async (id, exhibitData) => {
    const response = await fetch(`${API_BASE_URL}/admin/exhibits/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(exhibitData),
    });
    if (!response.ok) throw new Error("Failed to update exhibit");
    const data = await response.json();

    clearCache("exhibits", "activities", "todaysSchedule", `exhibit_${id}`);
    return data;
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/exhibits/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete exhibit");
    const data = await response.json();

    clearCache("exhibits", "activities", "todaysSchedule", `exhibit_${id}`);
    return data;
  },

  uploadImage: async (id, imageFile) => {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await fetch(
      `${API_BASE_URL}/admin/exhibits/${id}/upload-image`,
      {
        method: "POST",
        body: formData,
      }
    );
    if (!response.ok) throw new Error("Failed to upload exhibit image");
    const data = await response.json();

    clearCache("exhibits", `exhibit_${id}`);
    return data;
  },

  removeImage: async (id) => {
    const response = await fetch(
      `${API_BASE_URL}/admin/exhibits/${id}/remove-image`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) throw new Error("Failed to remove exhibit image");
    const data = await response.json();

    clearCache("exhibits", `exhibit_${id}`);
    return data;
  },
};

export const animalAPI = {
  getAll: async () => {
    const cacheKey = "animals";
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${API_BASE_URL}/admin/animals`);
    if (!response.ok) throw new Error("Failed to fetch animals");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },

  getById: async (id) => {
    const cacheKey = `animal_${id}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${API_BASE_URL}/admin/animals/${id}`);
    if (!response.ok) throw new Error("Failed to fetch animal");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },

  create: async (animalData) => {
    const response = await fetch(`${API_BASE_URL}/admin/animals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(animalData),
    });
    if (!response.ok) throw new Error("Failed to create animal");
    const data = await response.json();

    clearCache("animals", "enclosures");
    return data;
  },

  update: async (id, animalData) => {
    const response = await fetch(`${API_BASE_URL}/admin/animals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(animalData),
    });
    if (!response.ok) throw new Error("Failed to update animal");
    const data = await response.json();

    clearCache("animals", "enclosures", `animal_${id}`);
    return data;
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/animals/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete animal");
    const data = await response.json();

    clearCache("animals", "enclosures", `animal_${id}`);
    return data;
  },

  uploadImage: async (id, imageFile) => {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await fetch(
      `${API_BASE_URL}/admin/animals/${id}/upload-image`,
      {
        method: "POST",
        body: formData,
      }
    );
    if (!response.ok) throw new Error("Failed to upload animal image");
    const data = await response.json();

    clearCache("animals", `animal_${id}`);
    return data;
  },

  removeImage: async (id) => {
    const response = await fetch(
      `${API_BASE_URL}/admin/animals/${id}/remove-image`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) throw new Error("Failed to remove animal image");
    const data = await response.json();

    clearCache("animals", `animal_${id}`);
    return data;
  },
};

export const analyticsAPI = {
  getRevenue: async (startDate = null, endDate = null) => {
    const cacheKey = `revenue_${startDate}_${endDate}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    let url = `${API_BASE_URL}/admin/revenue`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch revenue data");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },

  getStatistics: async () => {
    const cacheKey = "statistics";
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${API_BASE_URL}/admin/statistics`);
    if (!response.ok) throw new Error("Failed to fetch statistics");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },
};

export const referenceAPI = {
  getJobTitles: async () => {
    const cacheKey = "job_titles";
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${API_BASE_URL}/admin/job-titles`);
    if (!response.ok) throw new Error("Failed to fetch job titles");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },

  getEnclosures: async () => {
    const cacheKey = "enclosures";
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${API_BASE_URL}/admin/enclosures`);
    if (!response.ok) throw new Error("Failed to fetch enclosures");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },
};

export const transactionAPI = {
  getPurchases: async () => {
    const cacheKey = "purchases";
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${API_BASE_URL}/admin/purchases`);
    if (!response.ok) throw new Error("Failed to fetch purchases");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },

  getTickets: async () => {
    const cacheKey = "tickets";
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${API_BASE_URL}/admin/tickets`);
    if (!response.ok) throw new Error("Failed to fetch tickets");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },

  getPurchaseItems: async () => {
    const cacheKey = "purchase_items";
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${API_BASE_URL}/admin/purchase-items`);
    if (!response.ok) throw new Error("Failed to fetch purchase items");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },

  getPurchaseConcessionItems: async () => {
    const cacheKey = "purchase_concession_items";
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(
      `${API_BASE_URL}/admin/purchase-concession-items`
    );
    if (!response.ok)
      throw new Error("Failed to fetch purchase concession items");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },

  getMemberships: async () => {
    const cacheKey = "memberships";
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${API_BASE_URL}/admin/memberships`);
    if (!response.ok) throw new Error("Failed to fetch memberships");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },
};

export const pricingAPI = {
  getPricing: async () => {
    const cacheKey = "pricing";
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${API_BASE_URL}/admin/pricing`);
    if (!response.ok) throw new Error("Failed to fetch pricing");
    const data = await response.json();

    setCachedData(cacheKey, data);
    return data;
  },

  updatePricing: async (ticketPrices, membershipPrice) => {
    const response = await fetch(`${API_BASE_URL}/admin/pricing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketPrices, membershipPrice }),
    });
    if (!response.ok) throw new Error("Failed to update pricing");
    const data = await response.json();

    clearCache("pricing");
    return data;
  },
};

export const getDateRange = (range) => {
  const now = new Date();
  const startDate = new Date(now);

  switch (range) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case "all":
    default:
      return { startDate: null, endDate: null };
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: now.toISOString().split("T")[0],
  };
};
