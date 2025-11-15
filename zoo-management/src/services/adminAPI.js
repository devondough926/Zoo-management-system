const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Data caching removed - only images are cached

export const employeeAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/employees`);
    if (!response.ok) throw new Error("Failed to fetch employees");
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/employees/${id}`);
    if (!response.ok) throw new Error("Failed to fetch employee");
    return response.json();
  },

  create: async (employeeData) => {
    const response = await fetch(`${API_BASE_URL}/admin/employees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employeeData),
    });
    if (!response.ok) throw new Error("Failed to create employee");
    return response.json();
  },

  update: async (id, employeeData) => {
    const response = await fetch(`${API_BASE_URL}/admin/employees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employeeData),
    });
    if (!response.ok) throw new Error("Failed to update employee");
    return response.json();
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
    return response.json();
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
    return response.json();
  },
};

export const locationAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/locations`);
    if (!response.ok) throw new Error("Failed to fetch locations");
    return response.json();
  },

  getEmployees: async (locationId) => {
    const response = await fetch(
      `${API_BASE_URL}/admin/locations/${locationId}/employees`
    );
    if (!response.ok) throw new Error("Failed to fetch employees for location");
    return response.json();
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
    return response.json();
  },
};

export const exhibitAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/exhibits`);
    if (!response.ok) throw new Error("Failed to fetch exhibits");
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/exhibits/${id}`);
    if (!response.ok) throw new Error("Failed to fetch exhibit");
    return response.json();
  },

  create: async (exhibitData) => {
    const response = await fetch(`${API_BASE_URL}/admin/exhibits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(exhibitData),
    });
    if (!response.ok) throw new Error("Failed to create exhibit");
    return response.json();
  },

  update: async (id, exhibitData) => {
    const response = await fetch(`${API_BASE_URL}/admin/exhibits/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(exhibitData),
    });
    if (!response.ok) throw new Error("Failed to update exhibit");
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/exhibits/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete exhibit");
    return response.json();
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
    return response.json();
  },

  removeImage: async (id) => {
    const response = await fetch(
      `${API_BASE_URL}/admin/exhibits/${id}/remove-image`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) throw new Error("Failed to remove exhibit image");
    return response.json();
  },
};

export const animalAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/animals`);
    if (!response.ok) throw new Error("Failed to fetch animals");
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/animals/${id}`);
    if (!response.ok) throw new Error("Failed to fetch animal");
    return response.json();
  },
  create: async (animalData) => {
    const response = await fetch(`${API_BASE_URL}/admin/animals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(animalData),
    });
    if (!response.ok) throw new Error("Failed to create animal");
    return response.json();
  },

  update: async (id, animalData) => {
    const response = await fetch(`${API_BASE_URL}/admin/animals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(animalData),
    });
    if (!response.ok) throw new Error("Failed to update animal");
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/animals/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete animal");
    return response.json();
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
    return response.json();
  },

  removeImage: async (id) => {
    const response = await fetch(
      `${API_BASE_URL}/admin/animals/${id}/remove-image`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) throw new Error("Failed to remove animal image");
    return response.json();
  },
};

export const analyticsAPI = {
  getRevenue: async (startDate = null, endDate = null) => {
    let url = `${API_BASE_URL}/admin/revenue`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch revenue data");
    return response.json();
  },

  getStatistics: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/statistics`);
    if (!response.ok) throw new Error("Failed to fetch statistics");
    return response.json();
  },

  getDetailedTransactions: async (startDate = null, endDate = null) => {
    let url = `${API_BASE_URL}/admin/transactions/detailed`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch detailed transactions");
    return response.json();
  },
};

export const referenceAPI = {
  getJobTitles: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/job-titles`);
    if (!response.ok) throw new Error("Failed to fetch job titles");
    return response.json();
  },

  getEnclosures: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/exhibits-for-animals`);
    if (!response.ok) throw new Error("Failed to fetch exhibits");
    return response.json();
  },
};

export const transactionAPI = {
  getPurchases: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/purchases`);
    if (!response.ok) throw new Error("Failed to fetch purchases");
    return response.json();
  },

  getTickets: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/tickets`);
    if (!response.ok) throw new Error("Failed to fetch tickets");
    return response.json();
  },

  getPurchaseItems: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/purchase-items`);
    if (!response.ok) throw new Error("Failed to fetch purchase items");
    return response.json();
  },

  getPurchaseConcessionItems: async () => {
    const response = await fetch(
      `${API_BASE_URL}/admin/purchase-concession-items`
    );
    if (!response.ok)
      throw new Error("Failed to fetch purchase concession items");
    return response.json();
  },

  getMemberships: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/memberships`);
    if (!response.ok) throw new Error("Failed to fetch memberships");
    return response.json();
  },
};

export const pricingAPI = {
  getPricing: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/pricing`);
    if (!response.ok) throw new Error("Failed to fetch pricing");
    return response.json();
  },

  updatePricing: async (ticketPrices, membershipPrice) => {
    const response = await fetch(`${API_BASE_URL}/admin/pricing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketPrices, membershipPrice }),
    });
    if (!response.ok) throw new Error("Failed to update pricing");
    return response.json();
  },
};

export const getDateRange = (range) => {
  const now = new Date();
  const startDate = new Date(now);

  switch (range) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "yesterday":
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "quarter":
      startDate.setMonth(now.getMonth() - 3);
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
