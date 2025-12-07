const API_BASE_URL = '/api';

export const api = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  },

  // Patients
  getPatients: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('q', params.search);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.direction) queryParams.append('direction', params.direction);
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    
    const response = await fetch(`${API_BASE_URL}/patients/?${queryParams}`);
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch patients');
      } else {
        throw new Error(`Backend server error: ${response.status} ${response.statusText}. Make sure the Flask backend is running on port 5000.`);
      }
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Backend returned non-JSON response. Make sure the Flask backend is running on port 5000.');
    }
    return response.json();
  },

  getPatientById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch patient');
    }
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

  getInsurers: async () => {
    const response = await fetch(`${API_BASE_URL}/patients/options/insurers`);
    if (!response.ok) throw new Error('Failed to fetch insurers');
    return response.json();
  },

  // Encounters
  getEncounters: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('q', params.search);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.direction) queryParams.append('direction', params.direction);
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });
    }
    
    const response = await fetch(`${API_BASE_URL}/encounters/?${queryParams}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch encounters');
    }
    return response.json();
  },

  getEncounterById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/encounters/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch encounter');
    }
    return response.json();
  },

  createEncounter: async (encounterData) => {
    const response = await fetch(`${API_BASE_URL}/encounters/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(encounterData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create encounter');
    }
    return response.json();
  },

  updateEncounter: async (id, encounterData) => {
    const response = await fetch(`${API_BASE_URL}/encounters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(encounterData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update encounter');
    }
    return response.json();
  },

  deleteEncounter: async (id) => {
    const response = await fetch(`${API_BASE_URL}/encounters/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete encounter');
    }
    return response.json();
  },

  getPatientsOptions: async (search = '', limit = 50) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', limit);
    const response = await fetch(`${API_BASE_URL}/encounters/options/patients?${params}`);
    if (!response.ok) throw new Error('Failed to fetch patients options');
    return response.json();
  },

  getProvidersOptions: async (search = '', limit = 50) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', limit);
    const response = await fetch(`${API_BASE_URL}/encounters/options/providers?${params}`);
    if (!response.ok) throw new Error('Failed to fetch providers options');
    return response.json();
  },

  getDepartmentsOptions: async () => {
    const response = await fetch(`${API_BASE_URL}/encounters/options/departments`);
    if (!response.ok) throw new Error('Failed to fetch departments options');
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

