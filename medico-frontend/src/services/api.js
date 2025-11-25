const API_BASE_URL = '/api';

export const api = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  },

  // Patients
  getPatients: async (limit = 500000) => {
    const response = await fetch(`${API_BASE_URL}/patients/?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch patients');
    return response.json();
  },

  // Claims
  getClaims: async () => {
    const response = await fetch(`${API_BASE_URL}/claims/`);
    if (!response.ok) throw new Error('Failed to fetch claims');
    return response.json();
  },

  getClaimById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/claims/${id}`);
    if (!response.ok) throw new Error('Failed to fetch claim');
    return response.json();
  },

  getClaimsByPatient: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/claims/patient/${patientId}`);
    if (!response.ok) throw new Error('Failed to fetch patient claims');
    return response.json();
  },

  // Denials
  getDenials: async () => {
    const response = await fetch(`${API_BASE_URL}/denials/`);
    if (!response.ok) throw new Error('Failed to fetch denials');
    return response.json();
  },

  // Encounters
  getEncounters: async (limit = 1000, search = '') => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (search) params.append('search', search);
    const response = await fetch(`${API_BASE_URL}/encounters/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch encounters');
    return response.json();
  },

  // Procedures
  getProcedures: async (limit = 1000, search = '') => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (search) params.append('search', search);
    const response = await fetch(`${API_BASE_URL}/procedures/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch procedures');
    return response.json();
  },

  // Medications
  getMedications: async (limit = 1000, search = '') => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (search) params.append('search', search);
    const response = await fetch(`${API_BASE_URL}/medications/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch medications');
    return response.json();
  },
};

