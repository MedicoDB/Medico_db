import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import Sidebar from "../components/Sidebar";
import "../HomePage.css";

const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState({});
  const [insurers, setInsurers] = useState([]);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    patient_id: "",
    first_name: "",
    last_name: "",
    gender: "",
    insurance_type: "",
    age_exact: "",
    city: "",
    registration_from: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Sorting
  const [sortBy, setSortBy] = useState("registration_date");
  const [sortDirection, setSortDirection] = useState("desc");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50;

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        sort: sortBy,
        direction: sortDirection,
      };
      
      // Add filters to params
      if (filters.patient_id) params.filters = { ...params.filters, patient_id: filters.patient_id };
      if (filters.first_name) params.filters = { ...params.filters, first_name: filters.first_name };
      if (filters.last_name) params.filters = { ...params.filters, last_name: filters.last_name };
      if (filters.gender) params.filters = { ...params.filters, gender: filters.gender };
      if (filters.insurance_type) params.filters = { ...params.filters, insurance_type: filters.insurance_type };
      if (filters.age_exact) params.filters = { ...params.filters, age: filters.age_exact };
      if (filters.city) params.filters = { ...params.filters, city: filters.city };
      if (filters.registration_from) params.filters = { ...params.filters, registration_from: filters.registration_from };
      
      const response = await api.getPatients(params);
      
      // Handle both old format (array) and new format (object with data, total, etc.)
      if (Array.isArray(response)) {
        setPatients(response);
        setTotalCount(response.length);
        setTotalPages(Math.ceil(response.length / itemsPerPage));
      } else {
        setPatients(response.data || []);
        setTotalCount(response.total || 0);
        setTotalPages(response.total_pages || 1);
      }
      
      setError(null);
    } catch (err) {
      console.error("Error fetching patients:", err);
      setError(err.message || "Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, sortBy, sortDirection, filters, itemsPerPage]);

  useEffect(() => {
    fetchInsurers();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters/search/sort changes
  }, [searchTerm, filters, sortBy, sortDirection]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const fetchInsurers = async () => {
    try {
      const data = await api.getInsurers();
      setInsurers(data);
    } catch (err) {
      console.error("Error fetching insurers:", err);
    }
  };

  // Helper function to normalize date to YYYY-MM-DD format
  // Database uses dd/mm/yyyy format in CSV files, but MySQL returns YYYY-MM-DD
  const normalizeDate = (dateValue) => {
    if (!dateValue) return "";
    try {
      // If it's already in YYYY-MM-DD format (ISO) - this is what MySQL/API returns
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
        return dateValue.split('T')[0].split(' ')[0];
      }
      
      // Handle dd/mm/yyyy format (database CSV format) - priority over mm/dd/yyyy
      if (typeof dateValue === 'string' && /^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(dateValue)) {
        const separator = dateValue.includes('/') ? '/' : '-';
        const parts = dateValue.split(separator);
        
        // Determine if it's dd/mm/yyyy or mm/dd/yyyy by checking if first part > 12
        // If first part > 12, it's likely dd/mm/yyyy (day first)
        let day, month, year;
        if (parseInt(parts[0]) > 12 && parseInt(parts[0]) <= 31) {
          // dd/mm/yyyy format (database format)
          day = parts[0].padStart(2, '0');
          month = parts[1].padStart(2, '0');
          year = parts[2];
        } else if (parseInt(parts[1]) > 12 && parseInt(parts[1]) <= 31) {
          // mm/dd/yyyy format
          month = parts[0].padStart(2, '0');
          day = parts[1].padStart(2, '0');
          year = parts[2];
        } else {
          // Ambiguous - assume dd/mm/yyyy (database format) if both parts <= 12
          day = parts[0].padStart(2, '0');
          month = parts[1].padStart(2, '0');
          year = parts[2];
        }
        return `${year}-${month}-${day}`;
      }
      
      // Try parsing as Date object (handles most formats)
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      console.error("Error normalizing date:", e);
    }
    return "";
  };

  const handleAdd = () => {
    setEditingPatient(null);
    setFormData({
      registration_date: new Date().toISOString().split('T')[0],
      dob: "",
      age: "",
    });
    setShowModal(true);
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    const dob = normalizeDate(patient.dob);
    setFormData({
      first_name: patient.first_name || "",
      last_name: patient.last_name || "",
      dob: dob,
      age: patient.age || "", // Age from database
      gender: patient.gender || "",
      ethnicity: patient.ethnicity || "",
      insurance_type: patient.insurance_type || "",
      marital_status: patient.marital_status || "",
      address: patient.address || "",
      city: patient.city || "",
      state: patient.state || "",
      zip: patient.zip || "",
      phone: patient.phone || "",
      email: patient.email || "",
      registration_date: normalizeDate(patient.registration_date) || new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const handleDelete = async (patientId) => {
    if (!window.confirm("Are you sure you want to delete this patient? This will fail if the patient has encounters.")) {
      return;
    }
    try {
      await api.deletePatient(patientId);
      await fetchPatients();
    } catch (err) {
      alert(err.message || "Failed to delete patient");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      // Remove age from submit - backend calculates it using SQL TIMESTAMPDIFF
      delete submitData.age;
      
      // Validate required fields - when editing, dob is optional if not changed
      if (!submitData.first_name || !submitData.last_name || !submitData.gender) {
        alert("Please fill in all required fields: First Name, Last Name, and Gender");
        return;
      }
      // Only require DOB for new patients, or if it's explicitly cleared during edit
      if (!editingPatient && !submitData.dob) {
        alert("Please fill in Date of Birth");
        return;
      }
      // When editing, if dob is not provided, keep the original value
      if (editingPatient && !submitData.dob) {
        const originalDob = normalizeDate(editingPatient.dob);
        if (originalDob) {
          submitData.dob = originalDob;
        }
      }
      
      if (editingPatient) {
        await api.updatePatient(editingPatient.patient_id, submitData);
      } else {
        await api.createPatient(submitData);
      }
      setShowModal(false);
      await fetchPatients(); // Fetch from database (age is already calculated in DB)
    } catch (err) {
      alert(err.message || "Failed to save patient");
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      patient_id: "",
      first_name: "",
      last_name: "",
      gender: "",
      insurance_type: "",
      age_exact: "",
      city: "",
      registration_from: "",
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const hasFilters = Object.values(filters).some(v => v) || searchTerm;

  return (
    <div className="hp-root">
        <Sidebar />

        {/* Main Content */}
        <div className="hp-main">
          <header className="hp-header">
            <div>
              <h1 className="hp-header-title">Patients</h1>
            </div>
            <div className="hp-header-actions">
              <input
                type="text"
                className="hp-search"
                placeholder="Search..."
                style={{ width: "250px" }}
              />
              <button
                className="hp-primary-btn"
                onClick={handleAdd}
              >
                + Add New
              </button>
            </div>
          </header>

        <div className="hp-page-content">
          {error && (
            <div style={{ padding: "12px", marginBottom: "16px", backgroundColor: "rgba(220, 53, 69, 0.1)", color: "#dc3545", borderRadius: "8px", border: "1px solid rgba(220, 53, 69, 0.3)" }}>
              {error}
            </div>
          )}

            {/* Search Bar */}
            <div style={{ marginBottom: "20px", marginLeft: "20px", marginRight: "20px" }}>
              <input
                type="text"
                className="hp-search"
                placeholder="Search patients by ID, name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", maxWidth: "600px" }}
              />
            </div>

          {/* Advanced Filters Card */}
          <div className="hp-section" style={{ 
            marginBottom: "24px",
            zIndex: 10
          }}>
            <div 
              style={{ 
                padding: "16px 20px", 
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "rgba(148, 163, 184, 0.05)"
              }}
              onClick={() => setShowFilters(!showFilters)}
            >
              <h6 style={{ margin: 0, color: "var(--hp-primary)", fontWeight: "600" }}>
                🔍 Advanced Search & Filter {hasFilters && <span style={{ fontSize: "12px", color: "var(--hp-text-soft)" }}>(Active)</span>}
              </h6>
              <span style={{ color: "var(--hp-text-soft)" }}>
                {showFilters ? "▲" : "▼"}
              </span>
            </div>
            
            {showFilters && (
              <div style={{ padding: "20px", borderTop: "1px solid var(--hp-border)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                      Patient ID
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      placeholder="e.g. PAT-001"
                      value={filters.patient_id}
                      onChange={(e) => handleFilterChange("patient_id", e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      placeholder="e.g. Elizabeth"
                      value={filters.first_name}
                      onChange={(e) => handleFilterChange("first_name", e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      value={filters.last_name}
                      onChange={(e) => handleFilterChange("last_name", e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                      Gender
                    </label>
                    <select
                      className="hp-search"
                      value={filters.gender}
                      onChange={(e) => handleFilterChange("gender", e.target.value)}
                      style={{ width: "100%", padding: "10px" }}
                    >
                      <option value="">All Genders</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                      Age
                    </label>
                    <input
                      type="number"
                      className="hp-search"
                      placeholder="Exact age"
                      value={filters.age_exact}
                      onChange={(e) => handleFilterChange("age_exact", e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                      Insurance Provider
                    </label>
                    <select
                      className="hp-search"
                      value={filters.insurance_type}
                      onChange={(e) => handleFilterChange("insurance_type", e.target.value)}
                      style={{ width: "100%", padding: "10px" }}
                    >
                      <option value="">All Providers</option>
                      {insurers.map((insurer) => (
                        <option key={insurer.code} value={insurer.code}>
                          {insurer.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                      City
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      value={filters.city}
                      onChange={(e) => handleFilterChange("city", e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                      Registration From
                    </label>
                    <input
                      type="date"
                      className="hp-search"
                      value={filters.registration_from}
                      onChange={(e) => handleFilterChange("registration_from", e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button
                    className="hp-secondary-btn"
                    onClick={resetFilters}
                    style={{ padding: "8px 16px", fontSize: "14px" }}
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: "60px", textAlign: "center", color: "var(--hp-text-soft)" }}>
              Loading patients...
            </div>
          ) : (
            <>
              <div className="hp-table-container">
                <div style={{ overflowX: "auto" }}>
                  <table className="hp-table">
                    <thead>
                      <tr>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("patient_id")}>
                          PATIENT ID {sortBy === "patient_id" && (sortDirection === "asc" ? "↑" : "↓")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("first_name")}>
                          NAME {sortBy === "first_name" && (sortDirection === "asc" ? "↑" : "↓")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("age")}>
                          AGE {sortBy === "age" && (sortDirection === "asc" ? "↑" : "↓")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("gender")}>
                          GENDER {sortBy === "gender" && (sortDirection === "asc" ? "↑" : "↓")}
                        </th>
                        <th>INSURANCE</th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("registration_date")}>
                          REGISTRATION {sortBy === "registration_date" && (sortDirection === "asc" ? "↑" : "↓")}
                        </th>
                        <th style={{ textAlign: "right" }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ padding: "60px", textAlign: "center", color: "var(--hp-text-soft)" }}>
                            No patients found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        patients.map((patient) => (
                          <tr 
                            key={patient.patient_id} 
                            style={{ 
                              borderTop: "1px solid var(--hp-border)",
                              transition: "var(--hp-transition-fast)"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(148, 163, 184, 0.05)"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                          >
                            <td style={{ padding: "16px" }}>
                              <span style={{
                                padding: "4px 10px",
                                backgroundColor: "rgba(148, 163, 184, 0.15)",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "500",
                                color: "var(--hp-text-main)"
                              }}>
                                {patient.patient_id}
                              </span>
                            </td>
                            <td style={{ padding: "16px", fontWeight: "500", color: "var(--hp-text-main)" }}>
                              <Link 
                                to={`/patients/${patient.patient_id}`}
                                style={{ 
                                  color: "var(--hp-primary)", 
                                  textDecoration: "none",
                                  fontWeight: "500"
                                }}
                              >
                                {patient.first_name} {patient.last_name}
                              </Link>
                            </td>
                            <td style={{ padding: "16px", color: "var(--hp-text-soft)" }}>{patient.age || "-"}</td>
                            <td style={{ padding: "16px", color: "var(--hp-text-soft)" }}>
                              {patient.gender === 'Male' && '♂️ '}
                              {patient.gender === 'Female' && '♀️ '}
                              {patient.gender || "-"}
                            </td>
                            <td style={{ padding: "16px", color: "var(--hp-text-soft)" }}>
                              {patient.insurance_name || "-"}
                            </td>
                            <td style={{ padding: "16px", color: "var(--hp-text-soft)" }}>
                              {formatDate(patient.registration_date)}
                            </td>
                            <td style={{ padding: "16px", textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                <button
                                  onClick={() => handleEdit(patient)}
                                  className="hp-btn-edit"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(patient.patient_id)}
                                  className="hp-btn-delete"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ 
                    padding: "16px 20px", 
                    borderTop: "1px solid var(--hp-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "rgba(148, 163, 184, 0.05)"
                  }}>
                    <div style={{ color: "var(--hp-text-soft)", fontSize: "14px" }}>
                      Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} patients
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="hp-secondary-btn"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        style={{ 
                          padding: "8px 16px", 
                          fontSize: "14px",
                          opacity: currentPage === 1 ? 0.5 : 1,
                          cursor: currentPage === 1 ? "not-allowed" : "pointer"
                        }}
                      >
                        ← Prev
                      </button>
                      {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 7) {
                          pageNum = i + 1;
                        } else if (currentPage <= 4) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 3) {
                          pageNum = totalPages - 6 + i;
                        } else {
                          pageNum = currentPage - 3 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={currentPage === pageNum ? "hp-primary-btn" : "hp-secondary-btn"}
                            style={{ 
                              padding: "8px 16px", 
                              fontSize: "14px",
                              minWidth: "40px"
                            }}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        className="hp-secondary-btn"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        style={{ 
                          padding: "8px 16px", 
                          fontSize: "14px",
                          opacity: currentPage === totalPages ? 0.5 : 1,
                          cursor: currentPage === totalPages ? "not-allowed" : "pointer"
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
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
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: "var(--hp-bg-card)",
              borderRadius: "var(--hp-radius-lg)",
              padding: "32px",
              maxWidth: "700px",
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
              border: "1px solid var(--hp-border)",
              boxShadow: "var(--hp-shadow-soft)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: "24px", color: "var(--hp-text-main)" }}>
              {editingPatient ? "Edit Patient" : "Add New Patient"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name || ""}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name || ""}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Date of Birth {!editingPatient && "*"}
                  </label>
                  <input
                    type="date"
                    value={formData.dob || ""}
                    onChange={(e) => {
                      // Age will be calculated by backend SQL TIMESTAMPDIFF when saving
                      setFormData({ ...formData, dob: e.target.value });
                    }}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Age (Auto-calculated from DOB)
                  </label>
                  <input
                    type="text"
                    value={formData.age ? `${formData.age} years` : "Will be calculated from Date of Birth"}
                    readOnly
                    disabled
                    className="hp-search"
                    style={{ width: "100%", opacity: 0.7, cursor: "not-allowed", backgroundColor: "rgba(148, 163, 184, 0.1)" }}
                    title="Age is automatically calculated from Date of Birth using SQL TIMESTAMPDIFF"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Gender
                  </label>
                  <select
                    value={formData.gender || ""}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%", padding: "10px" }}
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Ethnicity
                  </label>
                  <input
                    type="text"
                    value={formData.ethnicity || ""}
                    onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Marital Status
                  </label>
                  <select
                    value={formData.marital_status || ""}
                    onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%", padding: "10px" }}
                  >
                    <option value="">Select...</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Insurance
                  </label>
                  <select
                    value={formData.insurance_type || ""}
                    onChange={(e) => setFormData({ ...formData, insurance_type: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%", padding: "10px" }}
                  >
                    <option value="">Select...</option>
                    {insurers.map((insurer) => (
                      <option key={insurer.code} value={insurer.code}>
                        {insurer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address || ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city || ""}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state || ""}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData.zip || ""}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Registration Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.registration_date || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", borderTop: "1px solid var(--hp-border)", paddingTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="hp-secondary-btn"
                  style={{ padding: "10px 24px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hp-primary-btn"
                  style={{ padding: "10px 24px" }}
                >
                  {editingPatient ? "Update Patient" : "Add Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </div>
  );
};

export default PatientsPage;
