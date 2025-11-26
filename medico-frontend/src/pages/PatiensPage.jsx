import React, { useState, useEffect, useCallback } from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";
import { api } from "../services/api";

const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Column-specific search filters
  const [columnFilters, setColumnFilters] = useState({
    patient_id: "",
    first_name: "",
    last_name: "",
    age: "",
    gender: "",
    ethnicity: "",
    insurance_type: "",
    marital_status: "",
    city: "",
    state: "",
    email: "",
  });
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    column: "registration_date",
    order: "desc",
  });
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    dob: "",
    age: "",
    gender: "",
    ethnicity: "",
    insurance_type: "",
    marital_status: "unknown",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",
    registration_date: "",
  });

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        limit: "1000",
        sort_by: sortConfig.column,
        sort_order: sortConfig.order,
      });
      
      // Add general search if exists
      if (searchTerm) {
        params.append("search", searchTerm);
      }
      
      // Add column-specific filters
      Object.entries(columnFilters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });
      
      const data = await api.getPatients(1000, params);
      setPatients(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching patients:", err);
      setError(err.message || "Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, columnFilters, sortConfig]);

  // Initial load only
  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleSearch = () => {
    fetchPatients();
  };
  
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  
  const handleColumnFilterChange = (column, value) => {
    setColumnFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
  };
  
  const handleSort = (column) => {
    setSortConfig((prev) => ({
      column,
      order:
        prev.column === column && prev.order === "asc" ? "desc" : "asc",
    }));
    // Auto-search when sorting
    setTimeout(() => {
      fetchPatients();
    }, 0);
  };
  
  const clearFilters = () => {
    setSearchTerm("");
    setColumnFilters({
      patient_id: "",
      first_name: "",
      last_name: "",
      age: "",
      gender: "",
      ethnicity: "",
      insurance_type: "",
      marital_status: "",
      city: "",
      state: "",
      email: "",
    });
    setSortConfig({ column: "registration_date", order: "desc" });
    // Auto-search after clearing
    setTimeout(() => {
      fetchPatients();
    }, 0);
  };
  
  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddNew = () => {
    setSelectedPatient(null);
    setFormData({
      first_name: "",
      last_name: "",
      dob: "",
      age: "",
      gender: "",
      ethnicity: "",
      insurance_type: "",
      marital_status: "unknown",
      address: "",
      city: "",
      state: "",
      zip: "",
      phone: "",
      email: "",
      registration_date: new Date().toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      first_name: patient.first_name || "",
      last_name: patient.last_name || "",
      dob: patient.dob ? patient.dob.split("T")[0] : "",
      age: patient.age || "",
      gender: patient.gender || "",
      ethnicity: patient.ethnicity || "",
      insurance_type: patient.insurance_type || "",
      marital_status: patient.marital_status || "unknown",
      address: patient.address || "",
      city: patient.city || "",
      state: patient.state || "",
      zip: patient.zip || "",
      phone: patient.phone || "",
      email: patient.email || "",
      registration_date: patient.registration_date
        ? patient.registration_date.split("T")[0]
        : "",
    });
    setShowModal(true);
  };

  const handleDelete = (patient) => {
    setSelectedPatient(patient);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await api.deletePatient(selectedPatient.patient_id);
      setShowDeleteModal(false);
      setSelectedPatient(null);
      fetchPatients();
      alert("Patient deleted successfully!");
    } catch (err) {
      alert(err.message || "Failed to delete patient");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedPatient) {
        // Update
        await api.updatePatient(selectedPatient.patient_id, formData);
        alert("Patient updated successfully!");
      } else {
        // Create
        await api.createPatient(formData);
        alert("Patient created successfully!");
      }
      setShowModal(false);
      setSelectedPatient(null);
      fetchPatients();
    } catch (err) {
      alert(err.message || "Failed to save patient");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <SharedLayout
      title="Patients"
      subtitle="Search and manage patient profiles, demographics and contact information."
      activePage="patients"
      searchValue={searchTerm}
      onSearchChange={handleSearchInputChange}
      onAddNew={handleAddNew}
    >
      <div className="page-grid">
        <div className="page-card">
          <h3>👤 Patient List</h3>
          <p>Browse all registered patients in the system.</p>
          <button
            className="hp-link-btn"
            onClick={() =>
              window.scrollTo({
                top: document.querySelector(".page-section")?.offsetTop || 0,
                behavior: "smooth",
              })
            }
          >
            View All →
          </button>
        </div>

        <div className="page-card">
          <h3>➕ Add New Patient</h3>
          <p>Create a new patient profile including demographics, insurance and contacts.</p>
          <button className="hp-primary-btn" onClick={handleAddNew}>
            Add Patient
          </button>
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

      <div className="page-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
          <h3>Patient List ({patients.length} patients)</h3>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              className="hp-primary-btn"
              onClick={handleSearch}
              style={{ fontSize: "14px", padding: "8px 16px" }}
            >
              🔍 Search
            </button>
            <button
              className="hp-secondary-btn"
              onClick={clearFilters}
              style={{ fontSize: "14px", padding: "8px 16px" }}
            >
              Clear All Filters
            </button>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: "20px", textAlign: "center" }}>Loading patients...</div>
        ) : error ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#ff4444" }}>
            {error}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="page-table" style={{ minWidth: "1200px" }}>
              <thead>
                <tr>
                  <th>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <span>Patient ID</span>
                        <button
                          onClick={() => handleSort("patient_id")}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "12px",
                            color: sortConfig.column === "patient_id" ? "#007bff" : "#666",
                          }}
                          title={`Sort ${sortConfig.column === "patient_id" && sortConfig.order === "asc" ? "Descending" : "Ascending"}`}
                        >
                          {sortConfig.column === "patient_id" 
                            ? (sortConfig.order === "asc" ? "↑" : "↓")
                            : "⇅"}
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Search ID..."
                        value={columnFilters.patient_id}
                        onChange={(e) => handleColumnFilterChange("patient_id", e.target.value)}
                        style={{ padding: "4px", fontSize: "12px", width: "100%" }}
                      />
                    </div>
                  </th>
                  <th>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <span>First Name</span>
                        <button
                          onClick={() => handleSort("first_name")}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "12px",
                            color: sortConfig.column === "first_name" ? "#007bff" : "#666",
                          }}
                        >
                          {sortConfig.column === "first_name" 
                            ? (sortConfig.order === "asc" ? "↑" : "↓")
                            : "⇅"}
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Search first name..."
                        value={columnFilters.first_name}
                        onChange={(e) => handleColumnFilterChange("first_name", e.target.value)}
                        onKeyPress={handleKeyPress}
                        style={{ padding: "4px", fontSize: "12px", width: "100%" }}
                      />
                    </div>
                  </th>
                  <th>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <span>Last Name</span>
                        <button
                          onClick={() => handleSort("last_name")}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "12px",
                            color: sortConfig.column === "last_name" ? "#007bff" : "#666",
                          }}
                        >
                          {sortConfig.column === "last_name" 
                            ? (sortConfig.order === "asc" ? "↑" : "↓")
                            : "⇅"}
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Search last name..."
                        value={columnFilters.last_name}
                        onChange={(e) => handleColumnFilterChange("last_name", e.target.value)}
                        onKeyPress={handleKeyPress}
                        style={{ padding: "4px", fontSize: "12px", width: "100%" }}
                      />
                    </div>
                  </th>
                  <th>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <span>Age</span>
                        <button
                          onClick={() => handleSort("age")}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "12px",
                            color: sortConfig.column === "age" ? "#007bff" : "#666",
                          }}
                        >
                          {sortConfig.column === "age" 
                            ? (sortConfig.order === "asc" ? "↑" : "↓")
                            : "⇅"}
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Search age..."
                        value={columnFilters.age}
                        onChange={(e) => handleColumnFilterChange("age", e.target.value)}
                        onKeyPress={handleKeyPress}
                        style={{ padding: "4px", fontSize: "12px", width: "100%" }}
                      />
                    </div>
                  </th>
                  <th>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <span>Gender</span>
                        <button
                          onClick={() => handleSort("gender")}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "12px",
                            color: sortConfig.column === "gender" ? "#007bff" : "#666",
                          }}
                        >
                          {sortConfig.column === "gender" 
                            ? (sortConfig.order === "asc" ? "↑" : "↓")
                            : "⇅"}
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Search gender..."
                        value={columnFilters.gender}
                        onChange={(e) => handleColumnFilterChange("gender", e.target.value)}
                        onKeyPress={handleKeyPress}
                        style={{ padding: "4px", fontSize: "12px", width: "100%" }}
                      />
                    </div>
                  </th>
                  <th>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <span>Insurance</span>
                        <button
                          onClick={() => handleSort("insurance_type")}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "12px",
                            color: sortConfig.column === "insurance_type" ? "#007bff" : "#666",
                          }}
                        >
                          {sortConfig.column === "insurance_type" 
                            ? (sortConfig.order === "asc" ? "↑" : "↓")
                            : "⇅"}
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Search insurance..."
                        value={columnFilters.insurance_type}
                        onChange={(e) => handleColumnFilterChange("insurance_type", e.target.value)}
                        onKeyPress={handleKeyPress}
                        style={{ padding: "4px", fontSize: "12px", width: "100%" }}
                      />
                    </div>
                  </th>
                  <th>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <span>Encounters</span>
                        <button
                          onClick={() => handleSort("encounter_count")}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "12px",
                            color: sortConfig.column === "encounter_count" ? "#007bff" : "#666",
                          }}
                        >
                          {sortConfig.column === "encounter_count" 
                            ? (sortConfig.order === "asc" ? "↑" : "↓")
                            : "⇅"}
                        </button>
                      </div>
                    </div>
                  </th>
                  <th>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <span>Registration Date</span>
                        <button
                          onClick={() => handleSort("registration_date")}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "12px",
                            color: sortConfig.column === "registration_date" ? "#007bff" : "#666",
                          }}
                        >
                          {sortConfig.column === "registration_date" 
                            ? (sortConfig.order === "asc" ? "↑" : "↓")
                            : "⇅"}
                        </button>
                      </div>
                    </div>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                    No patients found
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.patient_id}>
                    <td>{patient.patient_id}</td>
                    <td>{patient.first_name}</td>
                    <td>{patient.last_name}</td>
                    <td>{patient.age || "N/A"}</td>
                    <td>{patient.gender || "N/A"}</td>
                    <td>{patient.insurance_name || patient.insurance_type || "N/A"}</td>
                    <td>{patient.encounter_count || 0}</td>
                    <td>
                      {patient.registration_date
                        ? new Date(patient.registration_date).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>
                      <button
                        className="hp-link-btn"
                        style={{ marginRight: "8px", fontSize: "12px" }}
                        onClick={() => handleEdit(patient)}
                      >
                        Edit
                      </button>
                      <button
                        className="hp-link-btn"
                        style={{ color: "#ff4444", fontSize: "12px" }}
                        onClick={() => handleDelete(patient)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{selectedPatient ? "Edit Patient" : "Add New Patient"}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label>Age *</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    min="0"
                    max="150"
                    required
                  />
                </div>
                <div>
                  <label>Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label>Ethnicity *</label>
                  <input
                    type="text"
                    name="ethnicity"
                    value={formData.ethnicity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label>Marital Status</label>
                  <select
                    name="marital_status"
                    value={formData.marital_status}
                    onChange={handleInputChange}
                  >
                    <option value="unknown">Unknown</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
                <div>
                  <label>Insurance Type</label>
                  <input
                    type="text"
                    name="insurance_type"
                    value={formData.insurance_type}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label>ZIP Code</label>
                  <input
                    type="text"
                    name="zip"
                    value={formData.zip}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label>Registration Date *</label>
                  <input
                    type="date"
                    name="registration_date"
                    value={formData.registration_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  className="hp-secondary-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="hp-primary-btn">
                  {selectedPatient ? "Update" : "Create"} Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPatient && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              maxWidth: "400px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: "#ff4444" }}>Confirm Delete</h2>
            <p>
              Are you sure you want to delete patient{" "}
              <strong>
                {selectedPatient.patient_id} - {selectedPatient.first_name}{" "}
                {selectedPatient.last_name}
              </strong>
              ?
            </p>
            <p style={{ color: "#ff4444", fontSize: "14px" }}>
              <strong>Warning:</strong> This action cannot be undone. If this patient has
              related encounters or denials, the deletion may fail.
            </p>
            <div
              style={{
                marginTop: "20px",
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="hp-secondary-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="hp-primary-btn"
                style={{ backgroundColor: "#ff4444" }}
                onClick={confirmDelete}
              >
                Delete Patient
              </button>
            </div>
          </div>
        </div>
      )}
    </SharedLayout>
  );
};

export default PatientsPage;
