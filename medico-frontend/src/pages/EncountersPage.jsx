import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";
import { api } from "../services/api";

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

  const canPrev = page > 0;
  const canNext = (page + 1) * PAGE_SIZE < total;
  const start = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = total === 0 ? 0 : Math.min(total, page * PAGE_SIZE + encounters.length);

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
      searchValue={searchTerm}
      onSearchChange={handleSearch}
      onAddNew={beginCreate}
    >
      <div className="page-grid">
        <div className="page-card">
          <h3>📋 Active Encounters</h3>
          <p>View all ongoing patient visits and admissions.</p>
          <button className="hp-link-btn" onClick={() => window.scrollTo({ top: document.querySelector('.page-section').offsetTop, behavior: 'smooth' })}>Open Dashboard →</button>
        </div>

        <div className="page-card">
          <h3>🧪 New Encounter</h3>
          <p>Create a new encounter and associate with patient and provider records.</p>
          <button
            className="hp-primary-btn"
            onClick={() => (showAddForm ? closeForm() : beginCreate())}
          >
            {showAddForm ? "Close Form" : editingEncounterId ? "Edit Encounter" : "Start New Encounter"}
          </button>
        </div>

        <div className="page-card">
          <h3>🕒 Encounter History</h3>
          <p>Search past visits, diagnoses and outcomes by date or provider.</p>
          <button className="hp-secondary-btn" onClick={() => document.querySelector('.hp-search')?.focus()}>Search Records</button>
        </div>
      </div>

      {showAddForm && (
        <div className="page-section page-form">
          <h3>{editingEncounterId ? "Edit Encounter" : "Create Encounter"}</h3>
          <form className="form-grid" onSubmit={handleSubmitEncounter}>
            <label>
              Patient ID
              <input name="patient_id" value={newEncounter.patient_id} onChange={handleFormChange} required />
            </label>
            <label>
              Provider ID
              <input name="provider_id" value={newEncounter.provider_id} onChange={handleFormChange} required />
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
                    <td>{encounter.first_name} {encounter.last_name}</td>
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
        <div className="page-pagination">
          <button disabled={!canPrev} onClick={() => setPage((prev) => Math.max(prev - 1, 0))}>
            ← Previous
          </button>
          <span>
            Showing {start.toLocaleString()}-{end.toLocaleString()} of {total.toLocaleString()}
          </span>
          <button disabled={!canNext} onClick={() => setPage((prev) => prev + 1)}>
            Next →
          </button>
        </div>
      </div>
    </SharedLayout>
  );
};

export default EncountersPage;
