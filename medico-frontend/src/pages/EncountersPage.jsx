import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";
import { api } from "../services/api";
import AsyncSelect from "../components/AsyncSelect";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 50;

const EncountersPage = () => {
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState(null);

  const emptyEncounter = {
    patient_id: "",
    provider_id: "",
    visit_date: "",
    visit_type: "",
    department: "",
    reason_for_visit: "",
    diagnosis_code: "",
    admission_type: "",
    discharge_date: "",
    status: "Scheduled",
    length_of_stay: "",
    readmitted_flag: "",
  };

  const [newEncounter, setNewEncounter] = useState(emptyEncounter);
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [editingEncounterId, setEditingEncounterId] = useState(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  useEffect(() => {
    const fetchEncounters = async () => {
      try {
        setLoading(true);
        const { data, total } = await api.getEncounters(PAGE_SIZE, page * PAGE_SIZE, searchTerm);

        if (page > 0 && data.length === 0 && total > 0) {
          setPage((prev) => Math.max(prev - 1, 0));
          return;
        }

        setEncounters(data);
        setTotal(total);
        setError(null);
      } catch (err) {
        console.error("Error fetching encounters:", err);
        setError("Failed to load encounters");
      } finally {
        setLoading(false);
      }
    };

    fetchEncounters();
  }, [searchTerm, refreshKey, page]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setShowAddForm(true);
    }
  }, [searchParams]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewEncounter((prev) => ({ ...prev, [name]: value }));
  };

  const handleFKChange = (field, value) => {
    setNewEncounter((prev) => ({ ...prev, [field]: value }));
  };

  // Label formatters for dropdowns
  const formatPatientLabel = (patient) => {
    return `${patient.patient_id} — ${patient.first_name} ${patient.last_name}`;
  };

  const formatProviderLabel = (provider) => {
    return `${provider.provider_id} — ${provider.name}${provider.specialty ? ` (${provider.specialty})` : ''}`;
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditingEncounterId(null);
    setNewEncounter(emptyEncounter);
    if (searchParams.get("action")) {
      searchParams.delete("action");
      setSearchParams(searchParams, { replace: true });
    }
  };

  const handleSubmitEncounter = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!newEncounter.patient_id || !newEncounter.provider_id) {
      setFormError("Patient ID and Provider ID are required.");
      return;
    }
    try {
      const payload = {
        ...newEncounter,
        length_of_stay: Number(newEncounter.length_of_stay) || 0,
        discharge_date: newEncounter.discharge_date || null,
        visit_date: newEncounter.visit_date || null,
        readmitted_flag: newEncounter.readmitted_flag || false,
      };
      if (editingEncounterId) {
        await api.updateEncounter(editingEncounterId, payload);
      } else {
        await api.createEncounter(payload);
      }
      closeForm();
      setPage(0);
      setRefreshKey((prev) => prev + 1);
      alert(editingEncounterId ? "Encounter updated." : "Encounter added.");
    } catch (err) {
      console.error(err);
      setFormError("Failed to save encounter. Verify patient/provider IDs.");
    }
  };

  const handleDeleteEncounter = async (id) => {
    if (!window.confirm("Delete this encounter? Related records may also be removed.")) return;
    try {
      await api.deleteEncounter(id);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      alert("Unable to delete encounter. Remove linked procedures/medications first.");
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const beginCreate = () => {
    setShowAddForm(true);
    setEditingEncounterId(null);
    setNewEncounter(emptyEncounter);
    setFormError(null);
    setSearchParams({ action: "new" }, { replace: true });
  };

  const handleEditEncounter = (encounter) => {
    setNewEncounter({
      patient_id: encounter.patient_id || "",
      provider_id: encounter.provider_id || "",
      visit_date: encounter.visit_date ? encounter.visit_date.slice(0, 10) : "",
      visit_type: encounter.visit_type || "",
      department: encounter.department || "",
      reason_for_visit: encounter.reason_for_visit || "",
      diagnosis_code: encounter.diagnosis_code || "",
      admission_type: encounter.admission_type || "",
      discharge_date: encounter.discharge_date ? encounter.discharge_date.slice(0, 10) : "",
      status: encounter.status || "",
      length_of_stay: encounter.length_of_stay ?? "",
      readmitted_flag: encounter.readmitted_flag ? "true" : "",
    });
    setEditingEncounterId(encounter.encounter_id);
    setShowAddForm(true);
    setFormError(null);
  };

  return (
    <SharedLayout
      title="Encounters"
      subtitle="Track visits, admission details, diagnoses and overall patient journey."
      activePage="encounters"
      showSearch={false}   // 🔥 sağ üst search kapalı
      showAddNew={false}   // 🔥 sağ üst +New kapalı
    >
      {/* 🔥 Başlık altına Search ve +New Encounter */}
      <div className="hp-search-new-container" style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px" }}>
        <input
          className="hp-search hp-search--big"
          placeholder="Search patients, encounters, medications..."
          value={searchTerm}
          onChange={handleSearch}
          style={{ flex: "1", maxWidth: "500px" }}
        />
        <button className="hp-primary-btn" onClick={beginCreate}>
          + New Encounter
        </button>
        <button
          className="hp-secondary-btn"
          onClick={() => setShowFilters(!showFilters)}
          style={{ marginLeft: "8px" }}
        >
          🔍 {showFilters ? "Hide Filters" : "Filters"}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="page-section" style={{ marginBottom: "20px", padding: "16px", background: "var(--hp-bg-soft, #334155)", borderRadius: "12px" }}>
          <h4 style={{ marginBottom: "12px", color: "var(--hp-text-main)" }}>🔍 Advanced Filters</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--hp-text-soft)" }}>Visit Date From</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #555", background: "#1e293b", color: "#fff" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--hp-text-soft)" }}>Visit Date To</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #555", background: "#1e293b", color: "#fff" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--hp-text-soft)" }}>Status</label>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #555", background: "#1e293b", color: "#fff", minWidth: "120px" }}>
                <option value="">All</option>
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Discharged">Discharged</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--hp-text-soft)" }}>Department</label>
              <select value={departmentFilter} onChange={(e) => { setDepartmentFilter(e.target.value); setPage(0); }}
                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #555", background: "#1e293b", color: "#fff", minWidth: "150px" }}>
                <option value="">All</option>
                <option value="Emergency">Emergency</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Oncology">Oncology</option>
              </select>
            </div>
            <button className="hp-secondary-btn" onClick={() => { setDateFrom(""); setDateTo(""); setStatusFilter(""); setDepartmentFilter(""); setSearchTerm(""); setPage(0); }}>
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="page-grid">
        <div className="page-card">
          <h3>📋 Active Encounters</h3>
          <p>View all ongoing patient visits and admissions.</p>
        </div>

        <div className="page-card">
          <h3>🕒 Encounter History</h3>
          <p>Search past visits, diagnoses and outcomes by date or provider.</p>
        </div>
      </div>

      {showAddForm && (
        <div className="page-section page-form">
          <h3>{editingEncounterId ? "Edit Encounter" : "Create Encounter"}</h3>
          <form className="form-grid" onSubmit={handleSubmitEncounter}>
            <label>
              Patient
              <AsyncSelect
                value={newEncounter.patient_id}
                onChange={(value) => handleFKChange('patient_id', value)}
                fetchOptions={api.getPatientOptions}
                getOptionLabel={formatPatientLabel}
                getOptionValue={(opt) => opt.patient_id}
                placeholder="Select patient..."
                required
              />
            </label>
            <label>
              Provider
              <AsyncSelect
                value={newEncounter.provider_id}
                onChange={(value) => handleFKChange('provider_id', value)}
                fetchOptions={api.getProviderOptions}
                getOptionLabel={formatProviderLabel}
                getOptionValue={(opt) => opt.provider_id}
                placeholder="Select provider..."
                required
              />
            </label>
            <label>
              Visit Date
              <input type="date" name="visit_date" value={newEncounter.visit_date} onChange={handleFormChange} />
            </label>
            <label>
              Visit Type
              <input name="visit_type" value={newEncounter.visit_type} onChange={handleFormChange} />
            </label>
            <label>
              Department
              <input name="department" value={newEncounter.department} onChange={handleFormChange} />
            </label>
            <label>
              Reason
              <input name="reason_for_visit" value={newEncounter.reason_for_visit} onChange={handleFormChange} />
            </label>
            <label>
              Diagnosis Code
              <input name="diagnosis_code" value={newEncounter.diagnosis_code} onChange={handleFormChange} />
            </label>
            <label>
              Admission Type
              <input name="admission_type" value={newEncounter.admission_type} onChange={handleFormChange} />
            </label>
            <label>
              Discharge Date
              <input type="date" name="discharge_date" value={newEncounter.discharge_date} onChange={handleFormChange} />
            </label>
            <label>
              Status
              <input name="status" value={newEncounter.status} onChange={handleFormChange} />
            </label>
            <label>
              Length of Stay
              <input name="length_of_stay" value={newEncounter.length_of_stay} onChange={handleFormChange} />
            </label>
            <label>
              Readmitted?
              <select name="readmitted_flag" value={newEncounter.readmitted_flag} onChange={handleFormChange}>
                <option value="">Select</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
            {formError && <p className="form-error">{formError}</p>}
            <div className="form-actions">
              <button type="submit" className="hp-primary-btn">{editingEncounterId ? "Update Encounter" : "Save Encounter"}</button>
              <button type="button" className="hp-secondary-btn" onClick={closeForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="page-section">
        <h3>Recent Encounters ({total.toLocaleString()} total)</h3>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading encounters...</div>
        ) : error ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#ff4444' }}>{error}</div>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>Encounter ID</th>
                <th>Patient</th>
                <th>Provider</th>
                <th>Date</th>
                <th>Department</th>
                <th>Status</th>
                <th>Diagnosis</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {encounters.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                    No encounters found
                  </td>
                </tr>
              ) : (
                encounters.map((encounter) => (
                  <tr key={encounter.encounter_id}>
                    <td>{encounter.encounter_id}</td>
                    <td>{encounter.patient_first_name} {encounter.patient_last_name}</td>
                    <td>{encounter.provider_name || 'N/A'}</td>
                    <td>{encounter.visit_date ? new Date(encounter.visit_date).toLocaleDateString() : 'N/A'}</td>
                    <td>{encounter.department || 'N/A'}</td>
                    <td>{encounter.status || 'N/A'}</td>
                    <td>{encounter.diagnosis_code || 'N/A'}</td>
                    <td>
                      <button className="hp-secondary-btn" onClick={() => handleEditEncounter(encounter)} style={{ marginRight: 8 }}>
                        Edit
                      </button>
                      <button className="hp-danger-btn" onClick={() => handleDeleteEncounter(encounter.encounter_id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>
    </SharedLayout>
  );
};

export default EncountersPage;
