import React, { useState, useEffect } from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";
import { api } from "../services/api";

const initialForm = {
  first_name: "",
  last_name: "",
  dob: "",
  gender: "",
  insurance_type: "",
  phone: "",
  email: "",
  ethnicity: "",
  marital_status: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  registration_date: "",
};

const PAGE_SIZE = 50;

const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState(null);
  const [newPatient, setNewPatient] = useState(initialForm);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [editingPatientId, setEditingPatientId] = useState(null);

  const start = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = total === 0 ? 0 : Math.min(total, page * PAGE_SIZE + patients.length);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const { data, total } = await api.getPatients(PAGE_SIZE, page * PAGE_SIZE, searchTerm);

        if (page > 0 && data.length === 0 && total > 0) {
          setPage((prev) => Math.max(prev - 1, 0));
          return;
        }

        setPatients(data);
        setTotal(total);
        setError(null);
      } catch (err) {
        console.error("Error fetching patients:", err);
        setError("Failed to load patients");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [searchTerm, refreshKey, page]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewPatient((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitPatient = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!newPatient.first_name || !newPatient.last_name) {
      setFormError("First name and last name are required.");
      return;
    }
    try {
      if (editingPatientId) {
        await api.updatePatient(editingPatientId, newPatient);
      } else {
        await api.createPatient(newPatient);
      }
      setNewPatient(initialForm);
      setEditingPatientId(null);
      setShowAddForm(false);
      setPage(0);
      setRefreshKey((prev) => prev + 1);
      alert(editingPatientId ? "Patient updated successfully." : "Patient added successfully.");
    } catch (err) {
      console.error(err);
      setFormError("Failed to save patient. Please check the information.");
    }
  };

  const handleDeletePatient = async (patientId) => {
    if (!window.confirm("Delete this patient? This action cannot be undone.")) return;
    try {
      await api.deletePatient(patientId);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      alert("Unable to delete patient. Make sure the patient has no related records.");
    }
  };

  const beginAdd = () => {
    setShowAddForm((prev) => !prev);
    setEditingPatientId(null);
    setNewPatient(initialForm);
    setFormError(null);
  };

  const handleEditPatient = (patient) => {
    setNewPatient({
      first_name: patient.first_name || "",
      last_name: patient.last_name || "",
      dob: patient.dob ? patient.dob.slice(0, 10) : "",
      gender: patient.gender || "",
      insurance_type: patient.insurance_type || "",
      phone: patient.phone || "",
      email: patient.email || "",
      ethnicity: patient.ethnicity || "",
      marital_status: patient.marital_status || "",
      address: patient.address || "",
      city: patient.city || "",
      state: patient.state || "",
      zip: patient.zip || "",
      registration_date: patient.registration_date ? patient.registration_date.slice(0, 10) : "",
    });
    setEditingPatientId(patient.patient_id);
    setShowAddForm(true);
    setFormError(null);
  };

  return (
    <SharedLayout
      title="Patients"
      subtitle="Search and manage patient profiles, demographics and contact information."
      activePage="patients"
      showSearch={false}
      showAddNew={false}
    >
      {/* Search + Add New üst alan */}
      <div
        className="hp-search-new-container"
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <input
          type="text"
          placeholder="Search patients..."
          value={searchTerm}
          onChange={handleSearch}
          className="hp-search"
          style={{
            flex: 1,
            maxWidth: "500px",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "15px",
          }}
        />
        <button className="hp-primary-btn" onClick={beginAdd}>
          {showAddForm && !editingPatientId
            ? "Close Form"
            : editingPatientId
            ? "Edit Patient"
            : "+ New Patient"}
        </button>
      </div>

      {/* Cards */}
      <div className="page-grid">
        <div className="page-card">
          <h3>👤 Patient List</h3>
          <p>Browse all registered patients in the system.</p>
        </div>

        <div className="page-card">
          <h3>📊 Demographics</h3>
          <p>View distribution by age, gender, location and insurance coverage.</p>
          <button
            className="hp-secondary-btn"
            onClick={() => alert("Analytics feature coming soon!")}
          >
            View Analytics
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="page-section page-form">
          <h3>{editingPatientId ? "Edit Patient" : "Create Patient"}</h3>
          <form className="form-grid" onSubmit={handleSubmitPatient}>
            <label>
              First Name
              <input
                name="first_name"
                value={newPatient.first_name}
                onChange={handleFormChange}
                required
              />
            </label>
            <label>
              Last Name
              <input
                name="last_name"
                value={newPatient.last_name}
                onChange={handleFormChange}
                required
              />
            </label>
            <label>
              Date of Birth
              <input type="date" name="dob" value={newPatient.dob} onChange={handleFormChange} />
            </label>
            <label>
              Gender
              <input name="gender" value={newPatient.gender} onChange={handleFormChange} />
            </label>
            <label>
              Insurance Type
              <input
                name="insurance_type"
                value={newPatient.insurance_type}
                onChange={handleFormChange}
                placeholder="e.g. UHC"
              />
            </label>
            <label>
              Phone
              <input name="phone" value={newPatient.phone} onChange={handleFormChange} />
            </label>
            <label>
              Email
              <input type="email" name="email" value={newPatient.email} onChange={handleFormChange} />
            </label>
            <label>
              Ethnicity
              <input name="ethnicity" value={newPatient.ethnicity} onChange={handleFormChange} />
            </label>
            <label>
              Marital Status
              <input name="marital_status" value={newPatient.marital_status} onChange={handleFormChange} />
            </label>
            <label>
              Address
              <input name="address" value={newPatient.address} onChange={handleFormChange} />
            </label>
            <label>
              City
              <input name="city" value={newPatient.city} onChange={handleFormChange} />
            </label>
            <label>
              State
              <input name="state" value={newPatient.state} onChange={handleFormChange} />
            </label>
            <label>
              ZIP
              <input name="zip" value={newPatient.zip} onChange={handleFormChange} />
            </label>
            <label>
              Registration Date
              <input
                type="date"
                name="registration_date"
                value={newPatient.registration_date}
                onChange={handleFormChange}
              />
            </label>
            {formError && <p className="form-error">{formError}</p>}
            <div className="form-actions">
              <button type="submit" className="hp-primary-btn">
                {editingPatientId ? "Update Patient" : "Save Patient"}
              </button>
              <button
                type="button"
                className="hp-secondary-btn"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingPatientId(null);
                  setNewPatient(initialForm);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Patient Table */}
      <div className="page-section">
        <h3>Patient List ({total.toLocaleString()} total)</h3>
        {loading ? (
          <div style={{ padding: "20px", textAlign: "center" }}>Loading patients...</div>
        ) : error ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#ff4444" }}>{error}</div>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Encounters</th>
                <th>First Visit</th>
                <th>Last Visit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                    No patients found
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.patient_id}>
                    <td>{patient.patient_id}</td>
                    <td>
                      {patient.first_name} {patient.last_name}
                    </td>
                    <td>{patient.encounter_count || 0}</td>
                    <td>{patient.first_visit ? new Date(patient.first_visit).toLocaleDateString() : "N/A"}</td>
                    <td>{patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : "N/A"}</td>
                    <td>
                      <button
                        className="hp-secondary-btn"
                        onClick={() => handleEditPatient(patient)}
                        style={{ marginRight: 8 }}
                      >
                        Edit
                      </button>
                      <button
                        className="hp-danger-btn"
                        onClick={() => handleDeletePatient(patient.patient_id)}
                      >
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
          <button disabled={page === 0} onClick={() => setPage((prev) => Math.max(prev - 1, 0))}>
            ← Previous
          </button>
          <span>
            Showing {start.toLocaleString()}-{end.toLocaleString()} of {total.toLocaleString()}
          </span>
          <button
            disabled={(page + 1) * PAGE_SIZE >= total}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next →
          </button>
        </div>
      </div>
    </SharedLayout>
  );
};

export default PatientsPage;
