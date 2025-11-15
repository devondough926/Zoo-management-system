const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ============================================
// ZOOKEEPER API SERVICE
// ============================================

export const zookeeperAPI = {
  // Dashboard Stats
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/zookeeper/stats`);
    if (!response.ok) throw new Error("Failed to fetch zookeeper stats");
    return response.json();
  },

  // Feeding Tasks (needs_feeding VIEW logic)
  getFeedingTasks: async () => {
    const response = await fetch(`${API_BASE_URL}/zookeeper/feeding-tasks`);
    if (!response.ok) throw new Error("Failed to fetch feeding tasks");
    return response.json();
  },

  // Cleaning Schedules
  getCleaningSchedules: async () => {
    const response = await fetch(
      `${API_BASE_URL}/zookeeper/cleaning-schedules`
    );
    if (!response.ok) throw new Error("Failed to fetch cleaning schedules");
    return response.json();
  },

  // Cleaning Card Data (from cleaning_card_data view)
  getCleaningCardData: async () => {
    const response = await fetch(
      `${API_BASE_URL}/zookeeper/cleaning-card-data`
    );
    if (!response.ok) throw new Error("Failed to fetch cleaning card data");
    return response.json();
  },

  // Mark habitat as cleaned
  markHabitatCleaned: async (enclosureId, employeeId, notes = "") => {
    const response = await fetch(
      `${API_BASE_URL}/zookeeper/exhibits/${enclosureId}/clean`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, notes }),
      }
    );
    if (!response.ok) throw new Error("Failed to mark habitat as cleaned");
    return response.json();
  },

  // Cancel/postpone cleaning
  cancelCleaning: async (enclosureId, skipDays = 1) => {
    const response = await fetch(
      `${API_BASE_URL}/zookeeper/exhibits/${enclosureId}/skip-cleaning`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skipDays }),
      }
    );
    if (!response.ok) throw new Error("Failed to cancel cleaning");
    return response.json();
  },

  // Notifications
  // Accepts an optional options object: { range: 'daily'|'weekly' }
  getNotifications: async (options = {}) => {
    const params = new URLSearchParams();
    if (options.range) params.append("range", options.range);
    const qs = params.toString();
    const url = `${API_BASE_URL}/zookeeper/notifications${qs ? `?${qs}` : ""}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch notifications");
    return response.json();
  },

  // Exhibits
  getAllEnclosures: async () => {
    const response = await fetch(`${API_BASE_URL}/zookeeper/exhibits`);
    if (!response.ok) throw new Error("Failed to fetch exhibits");
    return response.json();
  },

  getEnclosureStatus: async (enclosureId) => {
    const response = await fetch(
      `${API_BASE_URL}/zookeeper/exhibits/${enclosureId}/status`
    );
    if (!response.ok) throw new Error("Failed to fetch exhibit status");
    return response.json();
  },

  getAnimalsByEnclosure: async (enclosureId) => {
    const response = await fetch(
      `${API_BASE_URL}/zookeeper/exhibits/${enclosureId}/animals`
    );
    if (!response.ok) throw new Error("Failed to fetch animals");
    return response.json();
  },

  // Care Logs
  getAllCareLogs: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.logTypes) queryParams.append("logTypes", params.logTypes);
    if (params.search) queryParams.append("search", params.search);
    if (params.limit) queryParams.append("limit", params.limit);

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/zookeeper/care-logs${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch care logs");
    return response.json();
  },

  getAnimalCareLogs: async (animalId) => {
    const response = await fetch(
      `${API_BASE_URL}/zookeeper/care-logs/animal/${animalId}`
    );
    if (!response.ok) throw new Error("Failed to fetch animal care logs");
    return response.json();
  },

  createCareLog: async (logData) => {
    const response = await fetch(`${API_BASE_URL}/zookeeper/care-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logData),
    });
    if (!response.ok) throw new Error("Failed to create care log");
    return response.json();
  },

  // Feeding Schedule
  getFeedingSchedule: async (date = null) => {
    const url = date
      ? `${API_BASE_URL}/zookeeper/feeding-schedule?date=${date}`
      : `${API_BASE_URL}/zookeeper/feeding-schedule`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch feeding schedule");
    return response.json();
  },

  getFeedingScheduleByEnclosure: async (enclosureId, date = null) => {
    const url = date
      ? `${API_BASE_URL}/zookeeper/feeding-schedule/enclosure/${enclosureId}?date=${date}`
      : `${API_BASE_URL}/zookeeper/feeding-schedule/enclosure/${enclosureId}`;
    const response = await fetch(url);
    if (!response.ok)
      throw new Error("Failed to fetch feeding schedule for enclosure");
    return response.json();
  },

  createFeedingSchedule: async (scheduleData) => {
    const response = await fetch(`${API_BASE_URL}/zookeeper/feeding-schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scheduleData),
    });
    if (!response.ok) throw new Error("Failed to create feeding schedule");
    return response.json();
  },

  updateFeedingSchedule: async (feedingId, scheduleData) => {
    const response = await fetch(
      `${API_BASE_URL}/zookeeper/feeding-schedule/${feedingId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
      }
    );
    if (!response.ok) throw new Error("Failed to update feeding schedule");
    return response.json();
  },

  deleteFeedingSchedule: async (feedingId) => {
    const response = await fetch(
      `${API_BASE_URL}/zookeeper/feeding-schedule/${feedingId}`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) throw new Error("Failed to delete feeding schedule");
    return response.json();
  },
};

// Animals API (reused from other services)
export const animalsAPI = {
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
};

// Employees API (for zookeeper selection)
export const employeeAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/employees`);
    if (!response.ok) throw new Error("Failed to fetch employees");
    return response.json();
  },

  getZookeepers: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/employees`);
    if (!response.ok) throw new Error("Failed to fetch employees");
    const employees = await response.json();
    // Filter for Job_ID = 4 (Zookeeper)
    return employees.filter((emp) => emp.Job_ID === 4);
  },
};
