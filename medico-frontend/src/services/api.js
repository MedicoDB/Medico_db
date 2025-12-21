const API_BASE_URL = '/api';
const jsonHeaders = {
  'Content-Type': 'application/json',
};

const buildParams = (limit, offset, search) => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  if (search) params.append('search', search);
  return params.toString();
};

export const api = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  },

  // Patients
  getPatients: async (limit = 100, offset = 0, search = '') => {
    const response = await fetch(`${API_BASE_URL}/patients/?${buildParams(limit, offset, search)}`);
    if (!response.ok) throw new Error('Failed to fetch patients');
    return response.json();
  },
  createPatient: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/patients/`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create patient');
    return response.json();
  },
  updatePatient: async (patientId, payload) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update patient');
    return response.json();
  },
  deletePatient: async (patientId) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete patient');
    return response.json();
  },

  // Claims
  getClaims: async (limit = 100, offset = 0, search = '') => {
    const response = await fetch(`${API_BASE_URL}/claims/?${buildParams(limit, offset, search)}`);
    if (!response.ok) throw new Error('Failed to fetch claims');
    return response.json();
  },
  createClaim: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/claims/`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create claim');
    return response.json();
  },
  updateClaim: async (billingId, payload) => {
    const response = await fetch(`${API_BASE_URL}/claims/${billingId}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update claim');
    return response.json();
  },
  deleteClaim: async (billingId) => {
    const response = await fetch(`${API_BASE_URL}/claims/${billingId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete claim');
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
  getEncounters: async (limit = 100, offset = 0, search = '') => {
    const response = await fetch(`${API_BASE_URL}/encounters/?${buildParams(limit, offset, search)}`);
    if (!response.ok) throw new Error('Failed to fetch encounters');
    return response.json();
  },
  createEncounter: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/encounters/`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create encounter');
    return response.json();
  },
  updateEncounter: async (encounterId, payload) => {
    const response = await fetch(`${API_BASE_URL}/encounters/${encounterId}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update encounter');
    return response.json();
  },
  deleteEncounter: async (encounterId) => {
    const response = await fetch(`${API_BASE_URL}/encounters/${encounterId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete encounter');
    return response.json();
  },

  // Procedures
  getProcedures: async (limit = 100, offset = 0, search = '') => {
    const response = await fetch(`${API_BASE_URL}/procedures/?${buildParams(limit, offset, search)}`);
    if (!response.ok) throw new Error('Failed to fetch procedures');
    return response.json();
  },
  createProcedure: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/procedures/`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create procedure');
    return response.json();
  },
  updateProcedure: async (procedureId, payload) => {
    const response = await fetch(`${API_BASE_URL}/procedures/${procedureId}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update procedure');
    return response.json();
  },
  deleteProcedure: async (procedureId) => {
    const response = await fetch(`${API_BASE_URL}/procedures/${procedureId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete procedure');
    return response.json();
  },

  // Medications
  getMedications: async (limit = 100, offset = 0, search = '') => {
    const response = await fetch(`${API_BASE_URL}/medications/?${buildParams(limit, offset, search)}`);
    if (!response.ok) throw new Error('Failed to fetch medications');
    return response.json();
  },
  createMedication: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/medications/`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create medication');
    return response.json();
  },
  updateMedication: async (medicationId, payload) => {
    const response = await fetch(`${API_BASE_URL}/medications/${medicationId}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update medication');
    return response.json();
  },
  deleteMedication: async (medicationId) => {
    const response = await fetch(`${API_BASE_URL}/medications/${medicationId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete medication');
    return response.json();
  },

  // Denials
  getDenials: async (limit = 100, offset = 0, search = '') => {
    const response = await fetch(`${API_BASE_URL}/denials/?${buildParams(limit, offset, search)}`);
    if (!response.ok) throw new Error('Failed to fetch denials');
    return response.json();
  },
  createDenial: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/denials/`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create denial');
    return response.json();
  },
  updateDenial: async (denialId, payload) => {
    const response = await fetch(`${API_BASE_URL}/denials/${denialId}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update denial');
    return response.json();
  },
  deleteDenial: async (denialId) => {
    const response = await fetch(`${API_BASE_URL}/denials/${denialId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete denial');
    return response.json();
  },

  // Dropdown Options
  getPatientOptions: async (search = '') => {
    const params = new URLSearchParams({ limit: '50' });
    if (search) params.append('search', search);
    const response = await fetch(`${API_BASE_URL}/encounters/options/patients?${params}`);
    if (!response.ok) throw new Error('Failed to fetch patient options');
    const data = await response.json();
    return Array.isArray(data) ? data : (data.data || []);
  },

  getProviderOptions: async (search = '') => {
    const params = new URLSearchParams({ limit: '50' });
    if (search) params.append('search', search);
    const response = await fetch(`${API_BASE_URL}/encounters/options/providers?${params}`);
    if (!response.ok) throw new Error('Failed to fetch provider options');
    return await response.json();
  },

  getEncounterOptions: async (search = '') => {
    const params = new URLSearchParams({ limit: '50' });
    if (search) params.append('search', search);
    const response = await fetch(`${API_BASE_URL}/procedures/options/encounters?${params}`);
    if (!response.ok) throw new Error('Failed to fetch encounter options');
    const data = await response.json();
    return Array.isArray(data) ? data : (data.data || []);
  },

  getInsurerOptions: async (search = '') => {
    const params = new URLSearchParams({ limit: '50' });
    if (search) params.append('search', search);
    const response = await fetch(`${API_BASE_URL}/patients/options/insurers?${params}`);
    if (!response.ok) throw new Error('Failed to fetch insurer options');
    const data = await response.json();
    return Array.isArray(data) ? data : (data.data || []);
  },

  getClaimOptions: async (search = '') => {
    const params = new URLSearchParams({ limit: '50' });
    if (search) params.append('search', search);
    const response = await fetch(`${API_BASE_URL}/denials/options/claims?${params}`);
    if (!response.ok) throw new Error('Failed to fetch claim options');
    const data = await response.json();
    return Array.isArray(data) ? data : (data.data || []);
  },
};

