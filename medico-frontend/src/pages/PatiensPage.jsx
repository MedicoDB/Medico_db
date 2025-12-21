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

  // Date range filters
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [insuranceFilter, setInsuranceFilter] = useState("");

  const start = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = total === 0 ? 0 : Math.min(total, page * PAGE_SIZE + patients.length);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const { data, total } = await api.getPatients(PAGE_SIZE, page * PAGE_SIZE, searchTerm);

        // Apply frontend filters
        let filteredData = data;

        if (dateFrom) {
          filteredData = filteredData.filter(p => {
            const regDate = p.registration_date ? new Date(p.registration_date) : null;
            return regDate && regDate >= new Date(dateFrom);
          });
        }

        if (dateTo) {
          filteredData = filteredData.filter(p => {
            const regDate = p.registration_date ? new Date(p.registration_date) : null;
            return regDate && regDate <= new Date(dateTo);
          });
        }

        if (genderFilter) {
          filteredData = filteredData.filter(p => p.gender === genderFilter);
        }

        if (insuranceFilter) {
          filteredData = filteredData.filter(p => p.insurance_type === insuranceFilter);
        }

        if (page > 0 && filteredData.length === 0 && total > 0) {
          setPage((prev) => Math.max(prev - 1, 0));
          return;
        }

        setPatients(filteredData);
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
  }, [searchTerm, refreshKey, page, dateFrom, dateTo, genderFilter, insuranceFilter]);

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
        <button
          className="hp-secondary-btn"
          onClick={() => setShowFilters(!showFilters)}
          style={{ marginLeft: "8px" }}
        >
          🔍 {showFilters ? "Hide Filters" : "Filters"}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div
          className="page-section"
          style={{
            marginBottom: "20px",
            padding: "16px",
            background: "var(--hp-bg-soft, #334155)",
            borderRadius: "12px"
          }}
        >
          <h4 style={{ marginBottom: "12px", color: "var(--hp-text-main)" }}>🔍 Advanced Filters</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--hp-text-soft)" }}>
                Registration From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #555", background: "#1e293b", color: "#fff" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--hp-text-soft)" }}>
                Registration To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #555", background: "#1e293b", color: "#fff" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--hp-text-soft)" }}>
                Gender
              </label>
              <select
                value={genderFilter}
                onChange={(e) => { setGenderFilter(e.target.value); setPage(0); }}
                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #555", background: "#1e293b", color: "#fff", minWidth: "120px" }}
              >
                <option value="">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--hp-text-soft)" }}>
                Insurance
              </label>
              <select
                value={insuranceFilter}
                onChange={(e) => { setInsuranceFilter(e.target.value); setPage(0); }}
                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #555", background: "#1e293b", color: "#fff", minWidth: "150px" }}
              >
                <option value="">All</option>
                <option value="Aetna">Aetna</option>
                <option value="BCBS">Blue Cross Blue Shield</option>
                <option value="Cigna">Cigna</option>
                <option value="Humana">Humana</option>
                <option value="Medicaid">Medicaid</option>
                <option value="Medicare">Medicare</option>
                <option value="UHC">UnitedHealthcare</option>
              </select>
            </div>
            <button
              className="hp-secondary-btn"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setGenderFilter("");
                setInsuranceFilter("");
                setSearchTerm("");
                setPage(0);
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="page-grid">
        <div className="page-card">
          <h3>👤 Patient List</h3>
          <p>Browse all registered patients in the system.</p>
        </div>

        <div className="page-card">
          <h3>📊 Demographics</h3>
          <p>View distribution by age, gender, location and insurance coverage.</p>
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
              <select name="gender" value={newPatient.gender} onChange={handleFormChange}>
                <option value="">-- Select Gender --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </label>
            <label>
              Insurance Type
              <select
                name="insurance_type"
                value={newPatient.insurance_type}
                onChange={handleFormChange}
              >
                <option value="">-- Select Insurance --</option>
                <option value="Aetna">Aetna</option>
                <option value="BCBS">Blue Cross Blue Shield (BCBS)</option>
                <option value="Cigna">Cigna</option>
                <option value="Humana">Humana</option>
                <option value="Medicaid">Medicaid</option>
                <option value="Medicare">Medicare</option>
                <option value="UHC">UnitedHealthcare (UHC)</option>
              </select>
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
              <select name="ethnicity" value={newPatient.ethnicity} onChange={handleFormChange}>
                <option value="">-- Select Ethnicity --</option>
                <option value="White">White</option>
                <option value="Hispanic">Hispanic</option>
                <option value="Asian">Asian</option>
                <option value="Black">Black / African American</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label>
              Marital Status
              <select name="marital_status" value={newPatient.marital_status} onChange={handleFormChange}>
                <option value="">-- Select Status --</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed/Divorced/Separated">Widowed / Divorced / Separated</option>
                <option value="Unknown">Unknown</option>
              </select>
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
