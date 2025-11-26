const API_BASE_URL = '/api';

export const api = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  },

  // Patients - Full CRUD
  getPatients: async (limit = 1000, params = null) => {
    // If params is already a URLSearchParams object, use it directly
    // Otherwise, create a new one (backward compatibility)
    const queryParams = params instanceof URLSearchParams 
      ? params 
      : new URLSearchParams({ limit: limit.toString() });
    
    const response = await fetch(`${API_BASE_URL}/patients/?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch patients');
    return response.json();
  },

  getPatientById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`);
    if (!response.ok) throw new Error('Failed to fetch patient');
    return response.json();
  },

  createPatient: async (patientData) => {
    const response = await fetch(`${API_BASE_URL}/patients/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create patient');
    }
    return response.json();
  },

  updatePatient: async (id, patientData) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update patient');
    }
    return response.json();
  },

  deletePatient: async (id) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete patient');
    }
    return response.json();
  },

  getPatientEncounters: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/encounters`);
    if (!response.ok) throw new Error('Failed to fetch patient encounters');
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

