import React, { useState, useEffect } from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";
import { api } from "../services/api";

const PAGE_SIZE = 50;

const emptyMedication = {
  encounter_id: "",
  drug_name: "",
  dosage: "",
  route: "",
  frequency: "",
  duration: "",
  prescribed_date: "",
  prescriber_id: "",
  cost: "",
};

const MedicationsPage = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState(null);
  const [newMedication, setNewMedication] = useState(emptyMedication);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [editingMedicationId, setEditingMedicationId] = useState(null);

  useEffect(() => {
    const fetchMedications = async () => {
      try {
        setLoading(true);
        const { data, total } = await api.getMedications(PAGE_SIZE, page * PAGE_SIZE, searchTerm);

        if (page > 0 && data.length === 0 && total > 0) {
          setPage((prev) => Math.max(prev - 1, 0));
          return;
        }

        setMedications(data);
        setTotal(total);
        setError(null);
      } catch (err) {
        console.error("Error fetching medications:", err);
        setError("Failed to load medications");
      } finally {
        setLoading(false);
      }
    };

    fetchMedications();
  }, [searchTerm, refreshKey, page]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewMedication((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!newMedication.encounter_id || !newMedication.drug_name) {
      setFormError("Encounter ID and drug name are required.");
      return;
    }
    try {
      const payload = {
        ...newMedication,
        cost: Number(newMedication.cost) || 0,
      };
      if (editingMedicationId) {
        await api.updateMedication(editingMedicationId, payload);
      } else {
        await api.createMedication(payload);
      }
      setNewMedication(emptyMedication);
      setEditingMedicationId(null);
      setShowAddForm(false);
      setPage(0);
      setRefreshKey((prev) => prev + 1);
      alert(editingMedicationId ? "Medication updated." : "Medication added.");
    } catch (err) {
      console.error(err);
      setFormError("Failed to save medication. Verify encounter/provider IDs.");
    }
  };

  const handleDeleteMedication = async (id) => {
    if (!window.confirm("Delete this medication record?")) return;
    try {
      await api.deleteMedication(id);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      alert("Unable to delete medication.");
    }
  };

  const canPrev = page > 0;
  const canNext = (page + 1) * PAGE_SIZE < total;
  const start = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = total === 0 ? 0 : Math.min(total, page * PAGE_SIZE + medications.length);

  const beginCreate = () => {
    setNewMedication(emptyMedication);
    setEditingMedicationId(null);
    setShowAddForm(true);
    setFormError(null);
  };

  const handleEditMedication = (medication) => {
    setNewMedication({
      encounter_id: medication.encounter_id || "",
      drug_name: medication.drug_name || "",
      dosage: medication.dosage || "",
      route: medication.route || "",
      frequency: medication.frequency || "",
      duration: medication.duration || "",
      prescribed_date: medication.prescribed_date ? medication.prescribed_date.slice(0, 10) : "",
      prescriber_id: medication.prescriber_id || "",
      cost: medication.cost ?? "",
    });
    setEditingMedicationId(medication.medication_id);
    setShowAddForm(true);
    setFormError(null);
  };

  return (
    <SharedLayout
      title="Medications"
      subtitle="Review medication history, prescribed dosages and prescriber information."
      activePage="medications"
      searchValue={searchTerm}
      onSearchChange={handleSearch}
      onAddNew={beginCreate}
    >
      <div className="page-grid">
        <div className="page-card">
          <h3>💊 Medication List</h3>
          <p>Explore all prescribed medications across patient records.</p>
          <button className="hp-link-btn" onClick={() => window.scrollTo({ top: document.querySelector('.page-section').offsetTop, behavior: 'smooth' })}>View All →</button>
        </div>

        <div className="page-card">
          <h3>➕ Add Medication</h3>
          <p>Create a new medication entry for a patient & encounter.</p>
          <button className="hp-primary-btn" onClick={() => (showAddForm ? setShowAddForm(false) : beginCreate())}>
            {showAddForm ? "Close Form" : editingMedicationId ? "Edit Medication" : "Add Medication"}
          </button>
        </div>

        <div className="page-card">
          <h3>📈 Medication Stats</h3>
          <p>Check top prescribed drugs, dosage patterns and more.</p>
          <button className="hp-secondary-btn" onClick={() => alert('Analytics feature coming soon!')}>View Analytics</button>
        </div>
      </div>

      {showAddForm && (
        <div className="page-section page-form">
          <h3>{editingMedicationId ? "Edit Medication" : "Create Medication"}</h3>
          <form className="form-grid" onSubmit={handleAddMedication}>
            <label>
              Encounter ID
              <input name="encounter_id" value={newMedication.encounter_id} onChange={handleFormChange} required />
            </label>
            <label>
              Drug Name
              <input name="drug_name" value={newMedication.drug_name} onChange={handleFormChange} required />
            </label>
            <label>
              Dosage
              <input name="dosage" value={newMedication.dosage} onChange={handleFormChange} />
            </label>
            <label>
              Route
              <input name="route" value={newMedication.route} onChange={handleFormChange} />
            </label>
            <label>
              Frequency
              <input name="frequency" value={newMedication.frequency} onChange={handleFormChange} />
            </label>
            <label>
              Duration
              <input name="duration" value={newMedication.duration} onChange={handleFormChange} />
            </label>
            <label>
              Prescribed Date
              <input type="date" name="prescribed_date" value={newMedication.prescribed_date} onChange={handleFormChange} />
            </label>
            <label>
              Prescriber ID
              <input name="prescriber_id" value={newMedication.prescriber_id} onChange={handleFormChange} />
            </label>
            <label>
              Cost
              <input name="cost" value={newMedication.cost} onChange={handleFormChange} />
            </label>
            {formError && <p className="form-error">{formError}</p>}
            <div className="form-actions">
              <button type="submit" className="hp-primary-btn">{editingMedicationId ? "Update Medication" : "Save Medication"}</button>
              <button
                type="button"
                className="hp-secondary-btn"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingMedicationId(null);
                  setNewMedication(emptyMedication);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="page-section">
        <h3>Recent Medications ({total.toLocaleString()} total)</h3>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading medications...</div>
        ) : error ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#ff4444' }}>{error}</div>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>Drug Name</th>
                <th>Dosage</th>
                <th>Route</th>
                <th>Prescriber</th>
                <th>Date</th>
                <th>Patient</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {medications.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                    No medications found
                  </td>
                </tr>
              ) : (
                medications.map((medication) => (
                  <tr key={medication.medication_id}>
                    <td>{medication.drug_name}</td>
                    <td>{medication.dosage || 'N/A'}</td>
                    <td>{medication.route || 'N/A'}</td>
                    <td>{medication.prescriber_name || 'N/A'}</td>
                    <td>{medication.prescribed_date ? new Date(medication.prescribed_date).toLocaleDateString() : 'N/A'}</td>
                    <td>{medication.first_name} {medication.last_name}</td>
                    <td>
                      <button className="hp-secondary-btn" onClick={() => handleEditMedication(medication)} style={{ marginRight: 8 }}>
                        Edit
                      </button>
                      <button className="hp-danger-btn" onClick={() => handleDeleteMedication(medication.medication_id)}>
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

export default MedicationsPage;
