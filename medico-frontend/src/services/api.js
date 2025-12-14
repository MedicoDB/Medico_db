const API_BASE_URL = '/api';

export const api = {
  // Dashboard
  getDashboardStats: async (date = null) => {
    const url = date 
      ? `${API_BASE_URL}/dashboard/stats?date=${date}`
      : `${API_BASE_URL}/dashboard/stats`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  },

  getRecentActivities: async (date = null) => {
    const url = date 
      ? `${API_BASE_URL}/dashboard/recent-activities?date=${date}`
      : `${API_BASE_URL}/dashboard/recent-activities`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch recent activities');
    return response.json();
  },

  // Patients CRUD
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

  // Insurers CRUD
  getInsurersList: async (params = {}) => {
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
    
    const response = await fetch(`${API_BASE_URL}/insurers/?${queryParams}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch insurers');
    }
    return response.json();
  },

  getInsurerById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/insurers/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch insurer');
    }
    return response.json();
  },

  createInsurer: async (insurerData) => {
    const response = await fetch(`${API_BASE_URL}/insurers/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(insurerData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create insurer');
    }
    return response.json();
  },

  updateInsurer: async (id, insurerData) => {
    const response = await fetch(`${API_BASE_URL}/insurers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(insurerData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update insurer');
    }
    return response.json();
  },

  deleteInsurer: async (id) => {
    const response = await fetch(`${API_BASE_URL}/insurers/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete insurer');
    }
    return response.json();
  },

  // Encounters CRUD
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

  getEncounterRelated: async (encounterId) => {
    const response = await fetch(`${API_BASE_URL}/encounters/${encounterId}/related`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch encounter related data');
    }
    return response.json();
  },

  getDepartmentsOptions: async () => {
    const response = await fetch(`${API_BASE_URL}/encounters/options/departments`);
    if (!response.ok) throw new Error('Failed to fetch departments options');
    return response.json();
  },

  // Claims CRUD
  getClaimsList: async (params = {}) => {
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
    const response = await fetch(`${API_BASE_URL}/claims/?${queryParams}`);
    if (!response.ok) {
      let errorMessage = 'Failed to fetch claims';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } else {
          errorMessage = `Backend error: ${response.status} ${response.statusText}`;
        }
      } catch (e) {
        errorMessage = `Backend error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Backend returned non-JSON response. Make sure the Flask backend is running on port 5000.');
    }
    const text = await response.text();
    if (!text) {
      throw new Error('Backend returned empty response');
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('JSON parse error:', text);
      throw new Error('Failed to parse JSON response from backend');
    }
  },

  getClaimById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/claims/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch claim');
    }
    return response.json();
  },

  createClaim: async (claimData) => {
    const response = await fetch(`${API_BASE_URL}/claims/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claimData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create claim');
    }
    return response.json();
  },

  updateClaim: async (id, claimData) => {
    const response = await fetch(`${API_BASE_URL}/claims/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claimData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update claim');
    }
    return response.json();
  },

  deleteClaim: async (id) => {
    const response = await fetch(`${API_BASE_URL}/claims/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete claim');
    }
    return response.json();
  },

  getEncountersOptions: async (search = '', limit = 50) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', limit);
    const response = await fetch(`${API_BASE_URL}/claims/options/encounters?${params}`);
    if (!response.ok) throw new Error('Failed to fetch encounters options');
    return response.json();
  },

  // Denials CRUD
  getDenialsList: async (params = {}) => {
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
    const response = await fetch(`${API_BASE_URL}/denials/?${queryParams}`);
    if (!response.ok) {
      let errorMessage = 'Failed to fetch denials';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } else {
          errorMessage = `Backend error: ${response.status} ${response.statusText}`;
        }
      } catch (e) {
        errorMessage = `Backend error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Backend returned non-JSON response. Make sure the Flask backend is running on port 5000.');
    }
    const text = await response.text();
    if (!text) {
      throw new Error('Backend returned empty response');
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('JSON parse error:', text);
      throw new Error('Failed to parse JSON response from backend');
    }
  },

  getDenialById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/denials/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch denial');
    }
    return response.json();
  },

  getDenialByClaimId: async (claimId) => {
    const response = await fetch(`${API_BASE_URL}/denials/claim/${claimId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch denial by claim ID');
    }
    return response.json();
  },

  getClaimByClaimId: async (claimId) => {
    const response = await fetch(`${API_BASE_URL}/claims/by-claim-id/${claimId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch claim by claim ID');
    }
    return response.json();
  },

  createDenial: async (denialData) => {
    const response = await fetch(`${API_BASE_URL}/denials/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(denialData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create denial');
    }
    return response.json();
  },

  updateDenial: async (id, denialData) => {
    const response = await fetch(`${API_BASE_URL}/denials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(denialData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update denial');
    }
    return response.json();
  },

  deleteDenial: async (id) => {
    const response = await fetch(`${API_BASE_URL}/denials/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete denial');
    }
    return response.json();
  },

  getClaimsOptions: async (search = '', limit = 50) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', limit);
    const response = await fetch(`${API_BASE_URL}/denials/options/claims?${params}`);
    if (!response.ok) throw new Error('Failed to fetch claims options');
    return response.json();
  },

  getDenialReasonCodes: async () => {
    const response = await fetch(`${API_BASE_URL}/denials/options/denial-reason-codes`);
    if (!response.ok) throw new Error('Failed to fetch denial reason codes');
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

  // Medications CRUD
  getMedicationsList: async (params = {}) => {
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
    const response = await fetch(`${API_BASE_URL}/medications/?${queryParams}`);
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch medications');
      } else {
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
      }
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Backend returned non-JSON response');
    }
    const text = await response.text();
    if (!text) {
      throw new Error('Backend returned empty response');
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('JSON parse error:', text);
      throw new Error('Failed to parse JSON response from backend');
    }
  },

  getMedicationById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/medications/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch medication');
    }
    return response.json();
  },

  createMedication: async (medicationData) => {
    const response = await fetch(`${API_BASE_URL}/medications/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicationData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create medication');
    }
    return response.json();
  },

  updateMedication: async (id, medicationData) => {
    const response = await fetch(`${API_BASE_URL}/medications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicationData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update medication');
    }
    return response.json();
  },

  deleteMedication: async (id) => {
    const response = await fetch(`${API_BASE_URL}/medications/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete medication');
    }
    return response.json();
  },

  getMedicationsEncounterOptions: async (search = '', limit = 50) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', limit);
    const response = await fetch(`${API_BASE_URL}/medications/options/encounters?${params}`);
    if (!response.ok) throw new Error('Failed to fetch encounters options');
    return response.json();
  },

  getPrescribersOptions: async (search = '', limit = 50) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', limit);
    const response = await fetch(`${API_BASE_URL}/medications/options/prescribers?${params}`);
    if (!response.ok) throw new Error('Failed to fetch prescribers options');
    return response.json();
  },

  // Procedures CRUD
  getProceduresList: async (params = {}) => {
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
    const response = await fetch(`${API_BASE_URL}/procedures/?${queryParams}`);
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch procedures');
      } else {
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
      }
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Backend returned non-JSON response');
    }
    const text = await response.text();
    if (!text) {
      throw new Error('Backend returned empty response');
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('JSON parse error:', text);
      throw new Error('Failed to parse JSON response from backend');
    }
  },

  getProcedureById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/procedures/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch procedure');
    }
    return response.json();
  },

  createProcedure: async (procedureData) => {
    const response = await fetch(`${API_BASE_URL}/procedures/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(procedureData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create procedure');
    }
    return response.json();
  },

  updateProcedure: async (id, procedureData) => {
    const response = await fetch(`${API_BASE_URL}/procedures/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(procedureData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update procedure');
    }
    return response.json();
  },

  deleteProcedure: async (id) => {
    const response = await fetch(`${API_BASE_URL}/procedures/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete procedure');
    }
    return response.json();
  },

  getProceduresEncounterOptions: async (search = '', limit = 50) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', limit);
    const response = await fetch(`${API_BASE_URL}/procedures/options/encounters?${params}`);
    if (!response.ok) throw new Error('Failed to fetch encounters options');
    return response.json();
  },

  getProceduresProviderOptions: async (search = '', limit = 50) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', limit);
    const response = await fetch(`${API_BASE_URL}/procedures/options/providers?${params}`);
    if (!response.ok) throw new Error('Failed to fetch providers options');
    return response.json();
  },

  getProcedureCodes: async () => {
    const response = await fetch(`${API_BASE_URL}/procedures/options/procedure-codes`);
    if (!response.ok) throw new Error('Failed to fetch procedure codes');
    return response.json();
  },

  // Lab Tests CRUD
  getLabTestsList: async (params = {}) => {
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
    const response = await fetch(`${API_BASE_URL}/lab-tests/?${queryParams}`);
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch lab tests');
      } else {
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
      }
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Backend returned non-JSON response');
    }
    const text = await response.text();
    if (!text) {
      throw new Error('Backend returned empty response');
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('JSON parse error:', text);
      throw new Error('Failed to parse JSON response from backend');
    }
  },

  getLabTestById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/lab-tests/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch lab test');
    }
    return response.json();
  },

  createLabTest: async (labTestData) => {
    const response = await fetch(`${API_BASE_URL}/lab-tests/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(labTestData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create lab test');
    }
    return response.json();
  },

  updateLabTest: async (id, labTestData) => {
    const response = await fetch(`${API_BASE_URL}/lab-tests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(labTestData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update lab test');
    }
    return response.json();
  },

  deleteLabTest: async (id) => {
    const response = await fetch(`${API_BASE_URL}/lab-tests/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete lab test');
    }
    return response.json();
  },

  getLabTestsEncounterOptions: async (search = '', limit = 50) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', limit);
    const response = await fetch(`${API_BASE_URL}/lab-tests/options/encounters?${params}`);
    if (!response.ok) throw new Error('Failed to fetch encounters options');
    return response.json();
  },

  getTestCodes: async () => {
    const response = await fetch(`${API_BASE_URL}/lab-tests/options/test-codes`);
    if (!response.ok) throw new Error('Failed to fetch test codes');
    return response.json();
  },

  getUnits: async () => {
    const response = await fetch(`${API_BASE_URL}/lab-tests/options/units`);
    if (!response.ok) throw new Error('Failed to fetch units');
    return response.json();
  },

  getLabIds: async () => {
    const response = await fetch(`${API_BASE_URL}/lab-tests/options/lab-ids`);
    if (!response.ok) throw new Error('Failed to fetch lab IDs');
    return response.json();
  },

  getSpecimenTypes: async () => {
    const response = await fetch(`${API_BASE_URL}/lab-tests/options/specimen-types`);
    if (!response.ok) throw new Error('Failed to fetch specimen types');
    return response.json();
  },

  getNormalRanges: async () => {
    const response = await fetch(`${API_BASE_URL}/lab-tests/options/normal-ranges`);
    if (!response.ok) throw new Error('Failed to fetch normal ranges');
    return response.json();
  },

  // Diagnoses CRUD
  getDiagnosesList: async (params = {}) => {
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
    const response = await fetch(`${API_BASE_URL}/diagnoses/?${queryParams}`);
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch diagnoses');
      } else {
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
      }
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Backend returned non-JSON response');
    }
    const text = await response.text();
    if (!text) {
      throw new Error('Backend returned empty response');
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('JSON parse error:', text);
      throw new Error('Failed to parse JSON response from backend');
    }
  },

  getDiagnosisById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/diagnoses/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch diagnosis');
    }
    return response.json();
  },

  createDiagnosis: async (diagnosisData) => {
    const response = await fetch(`${API_BASE_URL}/diagnoses/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(diagnosisData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create diagnosis');
    }
    return response.json();
  },

  updateDiagnosis: async (id, diagnosisData) => {
    const response = await fetch(`${API_BASE_URL}/diagnoses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(diagnosisData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update diagnosis');
    }
    return response.json();
  },

  deleteDiagnosis: async (id) => {
    const response = await fetch(`${API_BASE_URL}/diagnoses/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete diagnosis');
    }
    return response.json();
  },

  getDiagnosesEncounterOptions: async (search = '', limit = 50, availableOnly = false) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', limit);
    if (availableOnly) params.append('available_only', 'true');
    const response = await fetch(`${API_BASE_URL}/diagnoses/options/encounters?${params}`);
    if (!response.ok) throw new Error('Failed to fetch encounters options');
    return response.json();
  },

  getDiagnosisCodes: async () => {
    const response = await fetch(`${API_BASE_URL}/diagnoses/options/diagnosis-codes`);
    if (!response.ok) throw new Error('Failed to fetch diagnosis codes');
    return response.json();
  },

  // Providers CRUD
  getProvidersList: async (params = {}) => {
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
    const response = await fetch(`${API_BASE_URL}/providers/?${queryParams}`);
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch providers');
      } else {
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
      }
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Backend returned non-JSON response');
    }
    const text = await response.text();
    if (!text) {
      throw new Error('Backend returned empty response');
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('JSON parse error:', text);
      throw new Error('Failed to parse JSON response from backend');
    }
  },

  getProviderById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/providers/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch provider');
    }
    return response.json();
  },

  createProvider: async (providerData) => {
    const response = await fetch(`${API_BASE_URL}/providers/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(providerData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create provider');
    }
    return response.json();
  },

  updateProvider: async (id, providerData) => {
    const response = await fetch(`${API_BASE_URL}/providers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(providerData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update provider');
    }
    return response.json();
  },

  deleteProvider: async (id) => {
    const response = await fetch(`${API_BASE_URL}/providers/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete provider');
    }
    return response.json();
  },

  getProvidersDepartmentHeadsOptions: async (search = '', limit = 50) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', limit);
    const response = await fetch(`${API_BASE_URL}/providers/options/department-heads?${params}`);
    if (!response.ok) throw new Error('Failed to fetch department heads options');
    return response.json();
  },

  // Department Heads CRUD
  getDepartmentHeadsList: async (params = {}) => {
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
    const response = await fetch(`${API_BASE_URL}/department-heads/?${queryParams}`);
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch department heads');
      } else {
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
      }
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Backend returned non-JSON response');
    }
    const text = await response.text();
    if (!text) {
      throw new Error('Backend returned empty response');
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('JSON parse error:', text);
      throw new Error('Failed to parse JSON response from backend');
    }
  },

  getDepartmentHeadById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/department-heads/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch department head');
    }
    return response.json();
  },

  createDepartmentHead: async (headData) => {
    const response = await fetch(`${API_BASE_URL}/department-heads/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(headData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create department head');
    }
    return response.json();
  },

  updateDepartmentHead: async (id, headData) => {
    const response = await fetch(`${API_BASE_URL}/department-heads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(headData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update department head');
    }
    return response.json();
  },

  deleteDepartmentHead: async (id) => {
    const response = await fetch(`${API_BASE_URL}/department-heads/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete department head');
    }
    return response.json();
  },
};

