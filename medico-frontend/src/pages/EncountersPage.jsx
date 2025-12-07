import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import "../HomePage.css";

const EncountersPage = () => {
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEncounter, setEditingEncounter] = useState(null);
  const [formData, setFormData] = useState({});
  const [patients, setPatients] = useState([]);
  const [providers, setProviders] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Searchable select states - these are used for SQL search on backend
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [providerSearchTerm, setProviderSearchTerm] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    encounter_id: "",
    patient_id: "",
    provider_id: "",
    patient_name: "",
    provider_name: "",
    department: "",
    status: "",
    visit_from: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Sorting
  const [sortBy, setSortBy] = useState("visit_date");
  const [sortDirection, setSortDirection] = useState("desc");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50;

  const statusOptions = ["Scheduled", "Completed", "In Progress", "Cancelled", "Discharged"];
  const visitTypeOptions = ["Emergency", "Outpatient", "Inpatient", "Surgery", "Follow-up", "Telehealth"];

  const fetchEncounters = useCallback(async () => {
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
      if (filters.encounter_id) params.filters = { ...params.filters, encounter_id: filters.encounter_id };
      if (filters.patient_id) params.filters = { ...params.filters, patient_id: filters.patient_id };
      if (filters.provider_id) params.filters = { ...params.filters, provider_id: filters.provider_id };
      if (filters.patient_name) params.filters = { ...params.filters, patient_name: filters.patient_name };
      if (filters.provider_name) params.filters = { ...params.filters, provider_name: filters.provider_name };
      if (filters.department) params.filters = { ...params.filters, department: filters.department };
      if (filters.status) params.filters = { ...params.filters, status: filters.status };
      if (filters.visit_from) params.filters = { ...params.filters, visit_from: filters.visit_from };
      
      const response = await api.getEncounters(params);
      
      // Handle both old format (array) and new format (object with data, total, etc.)
      if (Array.isArray(response)) {
        setEncounters(response);
        setTotalCount(response.length);
        setTotalPages(Math.ceil(response.length / itemsPerPage));
      } else {
        setEncounters(response.data || []);
        setTotalCount(response.total || 0);
        setTotalPages(response.total_pages || 1);
      }
      
      setError(null);
    } catch (err) {
      console.error("Error fetching encounters:", err);
      setError(err.message || "Failed to load encounters");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, sortBy, sortDirection, filters, itemsPerPage]);

  const fetchOptions = async () => {
    try {
      const [patientsData, providersData, departmentsData] = await Promise.all([
        api.getPatientsOptions("", 100), // Initial load - get first 100
        api.getProvidersOptions("", 100),
        api.getDepartmentsOptions(),
      ]);
      setPatients(patientsData);
      setProviders(providersData);
      setDepartments(departmentsData);
      setFilteredPatients(patientsData);
      setFilteredProviders(providersData);
    } catch (err) {
      console.error("Error fetching options:", err);
    }
  };

  // Search patients using SQL on backend
  const searchPatients = useCallback(async (searchTerm) => {
    try {
      const results = await api.getPatientsOptions(searchTerm, 50);
      setFilteredPatients(results);
    } catch (err) {
      console.error("Error searching patients:", err);
      setFilteredPatients([]);
    }
  }, []);

  // Search providers using SQL on backend
  const searchProviders = useCallback(async (searchTerm) => {
    try {
      const results = await api.getProvidersOptions(searchTerm, 50);
      setFilteredProviders(results);
    } catch (err) {
      console.error("Error searching providers:", err);
      setFilteredProviders([]);
    }
  }, []);

  // Debounce search with useEffect
  useEffect(() => {
    if (!showPatientDropdown) return;
    
    const timeoutId = setTimeout(() => {
      searchPatients(patientSearchTerm);
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [patientSearchTerm, showPatientDropdown, searchPatients]);

  useEffect(() => {
    if (!showProviderDropdown) return;
    
    const timeoutId = setTimeout(() => {
      searchProviders(providerSearchTerm);
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [providerSearchTerm, showProviderDropdown, searchProviders]);

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters/search/sort changes
  }, [searchTerm, filters, sortBy, sortDirection]);

  useEffect(() => {
    fetchEncounters();
  }, [fetchEncounters]);

  const handleAdd = () => {
    setEditingEncounter(null);
    setFormData({
      visit_date: new Date().toISOString().split('T')[0],
      status: "Scheduled",
      visit_type: "",
      readmitted_flag: false,
    });
    setPatientSearchTerm("");
    setProviderSearchTerm("");
    setShowPatientDropdown(false);
    setShowProviderDropdown(false);
    setShowModal(true);
  };

  const handleEdit = (encounter) => {
    setEditingEncounter(encounter);
    setFormData({
      patient_id: encounter.patient_id || "",
      provider_id: encounter.provider_id || "",
      visit_date: encounter.visit_date ? encounter.visit_date.split('T')[0] : new Date().toISOString().split('T')[0],
      visit_type: encounter.visit_type || "",
      department: encounter.department || "",
      reason_for_visit: encounter.reason_for_visit || "",
      diagnosis_code: encounter.diagnosis_code || "",
      admission_type: encounter.admission_type || "",
      discharge_date: encounter.discharge_date ? encounter.discharge_date.split('T')[0] : "",
      length_of_stay: encounter.length_of_stay || 0,
      status: encounter.status || "Scheduled",
      readmitted_flag: encounter.readmitted_flag || false,
    });
    // Set search terms based on selected patient/provider
    const selectedPatient = patients.find(p => p.patient_id === encounter.patient_id);
    const selectedProvider = providers.find(p => p.provider_id === encounter.provider_id);
    setPatientSearchTerm(selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : "");
    setProviderSearchTerm(selectedProvider ? selectedProvider.name : "");
    setShowPatientDropdown(false);
    setShowProviderDropdown(false);
    setShowModal(true);
  };

  const handleDelete = async (encounterId) => {
    if (!window.confirm("Are you sure you want to delete this encounter? This will fail if the encounter has linked billing records.")) {
      return;
    }
    try {
      await api.deleteEncounter(encounterId);
      await fetchEncounters();
    } catch (err) {
      alert(err.message || "Failed to delete encounter");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (!submitData.discharge_date) submitData.discharge_date = null;
      
      if (editingEncounter) {
        await api.updateEncounter(editingEncounter.encounter_id, submitData);
      } else {
        await api.createEncounter(submitData);
      }
      setShowModal(false);
      await fetchEncounters();
    } catch (err) {
      alert(err.message || "Failed to save encounter");
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

  const handleProviderChange = (providerId) => {
    const provider = providers.find(p => p.provider_id === providerId);
    setFormData({
      ...formData,
      provider_id: providerId,
      department: provider?.department || formData.department,
    });
  };

  const resetFilters = () => {
    setFilters({
      encounter_id: "",
      patient_id: "",
      provider_id: "",
      patient_name: "",
      provider_name: "",
      department: "",
      status: "",
      visit_from: "",
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const hasFilters = Object.values(filters).some(v => v) || searchTerm;

  return (
    <div className="hp-root">
      <aside className="hp-sidebar">
        <div className="hp-logo">
          <span className="hp-logo-icon">🩺</span>
          <span className="hp-logo-text">Medico</span>
        </div>
        <nav className="hp-nav">
          <p className="hp-nav-title">Main</p>
          <Link to="/" className="hp-nav-item">Dashboard</Link>
          <Link to="/patients" className="hp-nav-item">Patients</Link>
          <Link to="/encounters" className="hp-nav-item hp-nav-item--active">Encounters</Link>
          <Link to="/insurers" className="hp-nav-item">Insurers</Link>
        </nav>
      </aside>

      <main className="hp-main">
        <header className="hp-topbar">
          <div>
            <h1 className="hp-page-title">Encounters</h1>
            <p className="hp-page-subtitle">
              Track visits, admission details, diagnoses and overall patient journey.
            </p>
          </div>
          <div className="hp-topbar-actions">
            <input
              className="hp-search"
              placeholder="Search encounters..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <button className="hp-primary-btn" onClick={handleAdd}>+ New Encounter</button>
          </div>
        </header>

        <div style={{ padding: "24px" }}>
          {error && (
            <div style={{ padding: "12px", marginBottom: "16px", backgroundColor: "rgba(220, 53, 69, 0.1)", color: "#dc3545", borderRadius: "8px", border: "1px solid rgba(220, 53, 69, 0.3)" }}>
              {error}
            </div>
          )}

          {/* Advanced Filters Card */}
          <div style={{ 
            backgroundColor: "var(--hp-bg-card)", 
            borderRadius: "var(--hp-radius-lg)", 
            marginBottom: "24px",
            border: "1px solid var(--hp-border)",
            overflow: "hidden"
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
                      Encounter ID
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      value={filters.encounter_id}
                      onChange={(e) => handleFilterChange("encounter_id", e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                      Patient ID
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      value={filters.patient_id}
                      onChange={(e) => handleFilterChange("patient_id", e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                      Provider ID
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      value={filters.provider_id}
                      onChange={(e) => handleFilterChange("provider_id", e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                      Patient Name
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      placeholder="Name or Surname"
                      value={filters.patient_name}
                      onChange={(e) => handleFilterChange("patient_name", e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                      Provider Name
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      placeholder="Dr. Name"
                      value={filters.provider_name}
                      onChange={(e) => handleFilterChange("provider_name", e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                      Department
                    </label>
                    <select
                      className="hp-search"
                      value={filters.department}
                      onChange={(e) => handleFilterChange("department", e.target.value)}
                      style={{ width: "100%", padding: "10px" }}
                    >
                      <option value="">All Departments</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                      Status
                    </label>
                    <select
                      className="hp-search"
                      value={filters.status}
                      onChange={(e) => handleFilterChange("status", e.target.value)}
                      style={{ width: "100%", padding: "10px" }}
                    >
                      <option value="">All Statuses</option>
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                      Visit Date From
                    </label>
                    <input
                      type="date"
                      className="hp-search"
                      value={filters.visit_from}
                      onChange={(e) => handleFilterChange("visit_from", e.target.value)}
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
              Loading encounters...
            </div>
          ) : (
            <>
              <div style={{ 
                backgroundColor: "var(--hp-bg-card)", 
                borderRadius: "var(--hp-radius-lg)", 
                overflow: "hidden",
                border: "1px solid var(--hp-border)",
                boxShadow: "var(--hp-shadow-soft)"
              }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                    <thead style={{ backgroundColor: "rgba(148, 163, 184, 0.1)" }}>
                      <tr>
                        <th style={{ 
                          padding: "16px", 
                          textAlign: "left", 
                          cursor: "pointer",
                          color: "var(--hp-text-main)",
                          fontWeight: "600",
                          fontSize: "13px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em"
                        }} onClick={() => handleSort("encounter_id")}>
                          ID {sortBy === "encounter_id" && (sortDirection === "asc" ? "↑" : "↓")}
                        </th>
                        <th style={{ 
                          padding: "16px", 
                          textAlign: "left", 
                          cursor: "pointer",
                          color: "var(--hp-text-main)",
                          fontWeight: "600",
                          fontSize: "13px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em"
                        }} onClick={() => handleSort("visit_date")}>
                          Date {sortBy === "visit_date" && (sortDirection === "asc" ? "↑" : "↓")}
                        </th>
                        <th style={{ 
                          padding: "16px", 
                          textAlign: "left", 
                          cursor: "pointer",
                          color: "var(--hp-text-main)",
                          fontWeight: "600",
                          fontSize: "13px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em"
                        }} onClick={() => handleSort("patient_id")}>
                          Patient {sortBy === "patient_id" && (sortDirection === "asc" ? "↑" : "↓")}
                        </th>
                        <th style={{ 
                          padding: "16px", 
                          textAlign: "left", 
                          cursor: "pointer",
                          color: "var(--hp-text-main)",
                          fontWeight: "600",
                          fontSize: "13px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em"
                        }} onClick={() => handleSort("provider_id")}>
                          Provider {sortBy === "provider_id" && (sortDirection === "asc" ? "↑" : "↓")}
                        </th>
                        <th style={{ 
                          padding: "16px", 
                          textAlign: "left",
                          color: "var(--hp-text-main)",
                          fontWeight: "600",
                          fontSize: "13px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em"
                        }}>
                          Department
                        </th>
                        <th style={{ 
                          padding: "16px", 
                          textAlign: "left",
                          color: "var(--hp-text-main)",
                          fontWeight: "600",
                          fontSize: "13px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em"
                        }}>
                          Type
                        </th>
                        <th style={{ 
                          padding: "16px", 
                          textAlign: "left", 
                          cursor: "pointer",
                          color: "var(--hp-text-main)",
                          fontWeight: "600",
                          fontSize: "13px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em"
                        }} onClick={() => handleSort("status")}>
                          Status {sortBy === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                        </th>
                        <th style={{ 
                          padding: "16px", 
                          textAlign: "right",
                          color: "var(--hp-text-main)",
                          fontWeight: "600",
                          fontSize: "13px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em"
                        }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {encounters.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ padding: "60px", textAlign: "center", color: "var(--hp-text-soft)" }}>
                            No encounters found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        encounters.map((encounter) => (
                          <tr 
                            key={encounter.encounter_id} 
                            style={{ 
                              borderTop: "1px solid var(--hp-border)",
                              transition: "var(--hp-transition-fast)"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(148, 163, 184, 0.05)"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                          >
                            <td style={{ padding: "16px" }}>
                              <Link 
                                to={`/encounters/${encounter.encounter_id}`}
                                style={{ 
                                  textDecoration: "none"
                                }}
                              >
                                <span style={{
                                  padding: "4px 10px",
                                  backgroundColor: "rgba(148, 163, 184, 0.15)",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  color: "var(--hp-primary)",
                                  cursor: "pointer",
                                  display: "inline-block",
                                  transition: "var(--hp-transition-fast)"
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(59, 130, 246, 0.2)"}
                                onMouseLeave={(e) => e.target.style.backgroundColor = "rgba(148, 163, 184, 0.15)"}
                                >
                                  {encounter.encounter_id}
                                </span>
                              </Link>
                            </td>
                            <td style={{ padding: "16px", color: "var(--hp-text-soft)" }}>
                              {formatDate(encounter.visit_date)}
                            </td>
                            <td style={{ padding: "16px" }}>
                              <div style={{ fontWeight: "500", color: "var(--hp-text-main)" }}>
                                {encounter.patient_first_name || ''} {encounter.patient_last_name || ''}
                              </div>
                              <div style={{ fontSize: "12px", color: "var(--hp-text-soft)", marginTop: "2px" }}>
                                {encounter.patient_id || '-'}
                              </div>
                            </td>
                            <td style={{ padding: "16px", color: "var(--hp-text-soft)" }}>
                              {encounter.provider_name || encounter.provider_id || "-"}
                            </td>
                            <td style={{ padding: "16px", color: "var(--hp-text-soft)" }}>
                              {encounter.department || "-"}
                            </td>
                            <td style={{ padding: "16px", color: "var(--hp-text-soft)" }}>
                              {encounter.visit_type || "-"}
                            </td>
                            <td style={{ padding: "16px" }}>
                              <span
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  backgroundColor:
                                    encounter.status === "Completed"
                                      ? "rgba(34, 197, 94, 0.2)"
                                      : encounter.status === "Cancelled"
                                      ? "rgba(220, 53, 69, 0.2)"
                                      : encounter.status === "In Progress"
                                      ? "rgba(59, 130, 246, 0.2)"
                                      : "rgba(251, 191, 36, 0.2)",
                                  color:
                                    encounter.status === "Completed"
                                      ? "#22c55e"
                                      : encounter.status === "Cancelled"
                                      ? "#dc3545"
                                      : encounter.status === "In Progress"
                                      ? "#3b82f6"
                                      : "#fbbf24",
                                  border: `1px solid ${
                                    encounter.status === "Completed"
                                      ? "rgba(34, 197, 94, 0.3)"
                                      : encounter.status === "Cancelled"
                                      ? "rgba(220, 53, 69, 0.3)"
                                      : encounter.status === "In Progress"
                                      ? "rgba(59, 130, 246, 0.3)"
                                      : "rgba(251, 191, 36, 0.3)"
                                  }`
                                }}
                              >
                                {encounter.status || "-"}
                              </span>
                            </td>
                            <td style={{ padding: "16px", textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                <button
                                  onClick={() => handleEdit(encounter)}
                                  className="hp-primary-btn"
                                  style={{ padding: "6px 12px", fontSize: "13px" }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(encounter.encounter_id)}
                                  style={{
                                    padding: "6px 12px",
                                    backgroundColor: "rgba(220, 53, 69, 0.2)",
                                    color: "#dc3545",
                                    border: "1px solid rgba(220, 53, 69, 0.3)",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    transition: "var(--hp-transition-fast)"
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(220, 53, 69, 0.3)"}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(220, 53, 69, 0.2)"}
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
                      Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} encounters
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
      </main>

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
              maxWidth: "900px",
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
              border: "1px solid var(--hp-border)",
              boxShadow: "var(--hp-shadow-soft)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: "24px", color: "var(--hp-text-main)" }}>
              {editingEncounter ? "Edit Encounter" : "Add New Encounter"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "24px" }}>
                <h5 style={{ color: "var(--hp-primary)", marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>
                  1. Patient & Provider
                </h5>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  {/* Searchable Patient Select */}
                  <div style={{ position: "relative" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Select Patient *
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        required
                        value={
                          formData.patient_id
                            ? (filteredPatients.find(p => p.patient_id === formData.patient_id) || patients.find(p => p.patient_id === formData.patient_id))
                              ? `${(filteredPatients.find(p => p.patient_id === formData.patient_id) || patients.find(p => p.patient_id === formData.patient_id)).first_name} ${(filteredPatients.find(p => p.patient_id === formData.patient_id) || patients.find(p => p.patient_id === formData.patient_id)).last_name} (ID: ${formData.patient_id})`
                              : patientSearchTerm
                            : patientSearchTerm
                        }
                        onChange={(e) => {
                          setPatientSearchTerm(e.target.value);
                          setShowPatientDropdown(true);
                          if (!e.target.value) {
                            setFormData({ ...formData, patient_id: "" });
                            setFilteredPatients(patients); // Reset to all patients when search is cleared
                          }
                        }}
                        onFocus={() => {
                          setShowPatientDropdown(true);
                          // Load initial patients if not already loaded
                          if (filteredPatients.length === 0 && !patientSearchTerm) {
                            setFilteredPatients(patients);
                          }
                        }}
                        onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)}
                        placeholder="Search patient by name or ID..."
                        className="hp-search"
                        style={{ width: "100%", padding: "10px" }}
                      />
                      {showPatientDropdown && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            zIndex: 1000,
                            backgroundColor: "var(--hp-bg-card)",
                            border: "1px solid var(--hp-border)",
                            borderRadius: "8px",
                            marginTop: "4px",
                            maxHeight: "250px",
                            overflowY: "auto",
                            boxShadow: "var(--hp-shadow-soft)"
                          }}
                        >
                          {filteredPatients.map((patient) => (
                              <div
                                key={patient.patient_id}
                                onClick={() => {
                                  setFormData({ ...formData, patient_id: patient.patient_id });
                                  setPatientSearchTerm(`${patient.first_name} ${patient.last_name} (ID: ${patient.patient_id})`);
                                  setShowPatientDropdown(false);
                                }}
                                style={{
                                  padding: "10px 14px",
                                  cursor: "pointer",
                                  borderBottom: "1px solid var(--hp-border)",
                                  backgroundColor: formData.patient_id === patient.patient_id ? "rgba(34, 197, 94, 0.1)" : "transparent",
                                  transition: "background-color 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                  if (formData.patient_id !== patient.patient_id) {
                                    e.currentTarget.style.backgroundColor = "rgba(148, 163, 184, 0.1)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (formData.patient_id !== patient.patient_id) {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                  }
                                }}
                              >
                                <div style={{ fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                                  {patient.first_name} {patient.last_name}
                                </div>
                                <div style={{ fontSize: "12px", color: "var(--hp-text-soft)", marginTop: "2px" }}>
                                  ID: {patient.patient_id} • Age: {patient.age}yo
                                </div>
                              </div>
                            ))}
                          {filteredPatients.length === 0 && patientSearchTerm && (
                            <div style={{ padding: "14px", textAlign: "center", color: "var(--hp-text-soft)", fontSize: "13px" }}>
                              No patients found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Searchable Provider Select */}
                  <div style={{ position: "relative" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Select Provider *
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        required
                        value={
                          formData.provider_id
                            ? (filteredProviders.find(p => p.provider_id === formData.provider_id) || providers.find(p => p.provider_id === formData.provider_id))
                              ? `${(filteredProviders.find(p => p.provider_id === formData.provider_id) || providers.find(p => p.provider_id === formData.provider_id)).name} (${(filteredProviders.find(p => p.provider_id === formData.provider_id) || providers.find(p => p.provider_id === formData.provider_id)).specialty})`
                              : providerSearchTerm
                            : providerSearchTerm
                        }
                        onChange={(e) => {
                          setProviderSearchTerm(e.target.value);
                          setShowProviderDropdown(true);
                          if (!e.target.value) {
                            setFormData({ ...formData, provider_id: "" });
                            setFilteredProviders(providers); // Reset to all providers when search is cleared
                          }
                        }}
                        onFocus={() => {
                          setShowProviderDropdown(true);
                          // Load initial providers if not already loaded
                          if (filteredProviders.length === 0 && !providerSearchTerm) {
                            setFilteredProviders(providers);
                          }
                        }}
                        onBlur={() => setTimeout(() => setShowProviderDropdown(false), 200)}
                        placeholder="Search provider by name or specialty..."
                        className="hp-search"
                        style={{ width: "100%", padding: "10px" }}
                      />
                      {showProviderDropdown && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            zIndex: 1000,
                            backgroundColor: "var(--hp-bg-card)",
                            border: "1px solid var(--hp-border)",
                            borderRadius: "8px",
                            marginTop: "4px",
                            maxHeight: "250px",
                            overflowY: "auto",
                            boxShadow: "var(--hp-shadow-soft)"
                          }}
                        >
                          {filteredProviders.map((provider) => (
                              <div
                                key={provider.provider_id}
                                onClick={() => {
                                  handleProviderChange(provider.provider_id);
                                  setProviderSearchTerm(`${provider.name} (${provider.specialty})`);
                                  setShowProviderDropdown(false);
                                }}
                                style={{
                                  padding: "10px 14px",
                                  cursor: "pointer",
                                  borderBottom: "1px solid var(--hp-border)",
                                  backgroundColor: formData.provider_id === provider.provider_id ? "rgba(34, 197, 94, 0.1)" : "transparent",
                                  transition: "background-color 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                  if (formData.provider_id !== provider.provider_id) {
                                    e.currentTarget.style.backgroundColor = "rgba(148, 163, 184, 0.1)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (formData.provider_id !== provider.provider_id) {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                  }
                                }}
                              >
                                <div style={{ fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                                  {provider.name}
                                </div>
                                <div style={{ fontSize: "12px", color: "var(--hp-text-soft)", marginTop: "2px" }}>
                                  {provider.specialty || "No specialty"} • ID: {provider.provider_id}
                                </div>
                              </div>
                            ))}
                          {filteredProviders.length === 0 && providerSearchTerm && (
                            <div style={{ padding: "14px", textAlign: "center", color: "var(--hp-text-soft)", fontSize: "13px" }}>
                              No providers found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <h5 style={{ color: "var(--hp-primary)", marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>
                  2. Visit Details
                </h5>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Visit Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.visit_date || ""}
                      onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Visit Type
                    </label>
                    <select
                      value={formData.visit_type || ""}
                      onChange={(e) => setFormData({ ...formData, visit_type: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%", padding: "10px" }}
                    >
                      <option value="">Select...</option>
                      {visitTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Department (Auto)
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      value={formData.department || ""}
                      readOnly
                      placeholder="Auto-filled"
                      style={{ width: "100%", opacity: 0.7, cursor: "not-allowed" }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Reason for Visit
                  </label>
                  <textarea
                    value={formData.reason_for_visit || ""}
                    onChange={(e) => setFormData({ ...formData, reason_for_visit: e.target.value })}
                    rows={3}
                    className="hp-search"
                    style={{ width: "100%", resize: "vertical" }}
                    placeholder="e.g. Chest pain, Follow-up..."
                  />
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <h5 style={{ color: "var(--hp-primary)", marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>
                  3. Clinical & Status
                </h5>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Diagnosis Code (ICD)
                    </label>
                    <input
                      type="text"
                      value={formData.diagnosis_code || ""}
                      onChange={(e) => setFormData({ ...formData, diagnosis_code: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%" }}
                      placeholder="e.g. I10"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Status *
                    </label>
                    <select
                      required
                      value={formData.status || "Scheduled"}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%", padding: "10px" }}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Admission Type
                    </label>
                    <select
                      value={formData.admission_type || ""}
                      onChange={(e) => setFormData({ ...formData, admission_type: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%", padding: "10px" }}
                    >
                      <option value="">None</option>
                      <option value="Elective">Elective</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Discharge Date
                    </label>
                    <input
                      type="date"
                      value={formData.discharge_date || ""}
                      onChange={(e) => setFormData({ ...formData, discharge_date: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Length of Stay (Days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.length_of_stay || 0}
                      onChange={(e) => setFormData({ ...formData, length_of_stay: parseInt(e.target.value) || 0 })}
                      className="hp-search"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.readmitted_flag || false}
                        onChange={(e) => setFormData({ ...formData, readmitted_flag: e.target.checked })}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                      />
                      Patient Readmitted?
                    </label>
                  </div>
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
                  {editingEncounter ? "Update Encounter" : "Save Encounter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EncountersPage;
