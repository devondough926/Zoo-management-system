const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ============================================
// VETERINARIAN API SERVICE
// ============================================

export const veterinarianAPI = {
  // Dashboard Stats
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/veterinarian/stats`);
    if (!response.ok) throw new Error("Failed to fetch veterinarian stats");
    return response.json();
  },

  // Animals
  getAllAnimals: async () => {
    const response = await fetch(`${API_BASE_URL}/veterinarian/animals`);
    if (!response.ok) throw new Error("Failed to fetch animals");
    return response.json();
  },

  getAnimalsByEnclosure: async (enclosureId) => {
    const response = await fetch(
      `${API_BASE_URL}/veterinarian/enclosures/${enclosureId}/animals`
    );
    if (!response.ok) throw new Error("Failed to fetch animals by enclosure");
    return response.json();
  },

  getEnclosures: async () => {
    const response = await fetch(`${API_BASE_URL}/veterinarian/enclosures`);
    if (!response.ok) throw new Error("Failed to fetch enclosures");
    return response.json();
  },

  // Vet visits
  getAllVetVisits: async () => {
    const response = await fetch(`${API_BASE_URL}/veterinarian/vet-visits`);
    if (!response.ok) throw new Error("Failed to fetch vet visits");
    return response.json();
  },

  getAnimalVetHistory: async (animalId) => {
    const response = await fetch(
      `${API_BASE_URL}/veterinarian/vet-visits/animal/${animalId}`
    );
    if (!response.ok) throw new Error("Failed to fetch animal vet history");
    return response.json();
  },

  createVetVisit: async (visitData) => {
    const response = await fetch(`${API_BASE_URL}/veterinarian/vet-visits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(visitData),
    });
    if (!response.ok) throw new Error("Failed to create vet visit");
    return response.json();
  },

  // Medical logs
  getMedicalLogs: async (animalId) => {
    const url = animalId
      ? `${API_BASE_URL}/veterinarian/medical-logs/animal/${animalId}`
      : `${API_BASE_URL}/veterinarian/medical-logs`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch medical logs");
    return response.json();
  },

  createMedicalLog: async (logData) => {
    const response = await fetch(`${API_BASE_URL}/veterinarian/medical-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logData),
    });
    if (!response.ok) throw new Error("Failed to create medical log");
    return response.json();
  },

  // Vaccination logs
  getVaccinationLogs: async (animalId) => {
    const url = animalId
      ? `${API_BASE_URL}/veterinarian/vaccination-logs/animal/${animalId}`
      : `${API_BASE_URL}/veterinarian/vaccination-logs`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch vaccination logs");
    return response.json();
  },

  createVaccinationLog: async (logData) => {
    const response = await fetch(
      `${API_BASE_URL}/veterinarian/vaccination-logs`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData),
      }
    );
    if (!response.ok) throw new Error("Failed to create vaccination log");
    return response.json();
  },

  // Animal health updates
  updateAnimalHealthInfo: async (animalId, payload) => {
    const response = await fetch(
      `${API_BASE_URL}/veterinarian/animals/${animalId}/health`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) throw new Error("Failed to update animal health info");
    return response.json();
  },
};
