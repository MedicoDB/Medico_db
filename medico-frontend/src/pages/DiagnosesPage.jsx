import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import Sidebar from "../components/Sidebar";
import "../HomePage.css";

const DiagnosesPage = () => {
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDiagnosis, setEditingDiagnosis] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    diagnosis_id: "",
    encounter_id: "",
    diagnosis_code: "",
    primary_flag: "",
    chronic_flag: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Sorting
  const [sortBy, setSortBy] = useState("diagnosis_id");
  const [sortDirection, setSortDirection] = useState("desc");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50;

  // Encounter options for searchable select
  const [encounterOptions, setEncounterOptions] = useState([]);
  const [encounterSearchTerm, setEncounterSearchTerm] = useState("");
  const [showEncounterDropdown, setShowEncounterDropdown] = useState(false);
  const [diagnosisCodeOptions, setDiagnosisCodeOptions] = useState([]);
  const [showDiagnosisCodeDropdown, setShowDiagnosisCodeDropdown] = useState(false);
  const [diagnosisCodeSearchTerm, setDiagnosisCodeSearchTerm] = useState("");

  const fetchDiagnoses = useCallback(async () => {
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
      const activeFilters = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          activeFilters[key] = value;
        }
      });
      if (Object.keys(activeFilters).length > 0) {
        params.filters = activeFilters;
      }
      
      const response = await api.getDiagnosesList(params);
      
      setDiagnoses(response.data || []);
      setTotalCount(response.total || 0);
      setTotalPages(response.total_pages || 1);
      
      setError(null);
    } catch (err) {
      console.error("Error fetching diagnoses:", err);
      setError(err.message || "Failed to load diagnoses");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, sortBy, sortDirection, filters.diagnosis_id, filters.encounter_id, filters.diagnosis_code, filters.primary_flag, filters.chronic_flag]);

  // Reset to page 1 when filters/search/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortDirection, filters.diagnosis_id, filters.encounter_id, filters.diagnosis_code, filters.primary_flag, filters.chronic_flag]);

  // Fetch when dependencies change
  useEffect(() => {
    fetchDiagnoses();
  }, [fetchDiagnoses]);

  // Fetch encounter options
  const fetchEncounterOptions = useCallback(async (search = "") => {
    try {
      const isAdding = editingDiagnosis === null;
      // If adding new diagnosis, show only encounters without diagnosis (availableOnly=true)
      // If editing, show all (or could filter to current + available, but search all is simpler for edit context)
      // Actually for edit, we might just want to keep the current one or allow changing to another available one.
      // But typically user won't change encounter in edit. Let's stick to "available only" for ADD mode.
      
      // Better logic: Always ask for available ones when adding.
      const options = await api.getDiagnosesEncounterOptions(search, 50, isAdding);
      setEncounterOptions(options);
    } catch (err) {
      console.error("Error fetching encounters:", err);
    }
  }, [editingDiagnosis]);

  // Fetch diagnosis codes
  const fetchDiagnosisCodes = useCallback(async () => {
    try {
      const codes = await api.getDiagnosisCodes();
      setDiagnosisCodeOptions(codes);
    } catch (err) {
      console.error("Error fetching diagnosis codes:", err);
    }
  }, []);

  useEffect(() => {
    if (showModal) {
      fetchDiagnosisCodes();
    }
  }, [showModal, fetchDiagnosisCodes]);

  useEffect(() => {
    if (showModal && showEncounterDropdown) {
      fetchEncounterOptions(encounterSearchTerm);
    }
  }, [showModal, showEncounterDropdown, encounterSearchTerm, fetchEncounterOptions]);

  const handleAdd = () => {
    setEditingDiagnosis(null);
    setFormData({
      encounter_id: "",
      diagnosis_code: "",
      diagnosis_description: "",
      primary_flag: "1",
      chronic_flag: "0",
    });
    setEncounterSearchTerm("");
    setDiagnosisCodeSearchTerm("");
    setShowEncounterDropdown(false);
    setShowDiagnosisCodeDropdown(false);
    setShowModal(true);
    fetchDiagnosisCodes();
    fetchEncounterOptions();
  };

  const handleEdit = (diagnosis) => {
    setEditingDiagnosis(diagnosis);
    setFormData({
      encounter_id: diagnosis.encounter_id || "",
      diagnosis_code: diagnosis.diagnosis_code || "",
      diagnosis_description: diagnosis.diagnosis_description || "",
      primary_flag: diagnosis.primary_flag ? "1" : "0",
      chronic_flag: diagnosis.chronic_flag !== null ? (diagnosis.chronic_flag ? "1" : "0") : "",
    });
    const currentEncounter = encounterOptions.find(e => e.encounter_id === diagnosis.encounter_id);
    setEncounterSearchTerm(currentEncounter ? `${currentEncounter.encounter_id} - ${currentEncounter.patient_first_name || ""} ${currentEncounter.patient_last_name || ""}` : (diagnosis.encounter_id || ""));
    setDiagnosisCodeSearchTerm(diagnosis.diagnosis_code || "");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      submitData.primary_flag = submitData.primary_flag === "1";
      submitData.chronic_flag = submitData.chronic_flag === "" ? null : (submitData.chronic_flag === "1");

      if (editingDiagnosis) {
        await api.updateDiagnosis(editingDiagnosis.diagnosis_id, submitData);
      } else {
        await api.createDiagnosis(submitData);
      }
      setShowModal(false);
      fetchDiagnoses();
    } catch (err) {
      setError(err.message || "Failed to save diagnosis");
    }
  };

  const handleDelete = async (diagnosis_id) => {
    try {
      await api.deleteDiagnosis(diagnosis_id);
      setDeleteConfirm(null);
      fetchDiagnoses();
    } catch (err) {
      setError(err.message || "Failed to delete diagnosis");
      setDeleteConfirm(null);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      diagnosis_id: "",
      encounter_id: "",
      diagnosis_code: "",
      primary_flag: "",
      chronic_flag: "",
    });
    setSearchTerm("");
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  const hasFilters = Object.values(filters).some(v => v !== "" && v !== null) || searchTerm;

  return (
    <div className="hp-root">
      <Sidebar />

      {/* Main Content */}
      <div className="hp-main">
          <header className="hp-header">
            <div>
              <h1 className="hp-header-title">Diagnoses</h1>
              <p className="hp-header-subtitle">Manage patient diagnoses and medical conditions.</p>
            </div>
            <div className="hp-header-actions">
              <input
                type="text"
                className="hp-search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                placeholder="Search diagnoses by ID, diagnosis code, encounter ID, or patient name..."
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
                        Diagnosis ID
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. DIAG000001"
                        value={filters.diagnosis_id}
                        onChange={(e) => handleFilterChange("diagnosis_id", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Encounter ID
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. ENC000001"
                        value={filters.encounter_id}
                        onChange={(e) => handleFilterChange("encounter_id", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Diagnosis Code
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. I10"
                        value={filters.diagnosis_code}
                        onChange={(e) => handleFilterChange("diagnosis_code", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Primary Flag
                      </label>
                      <select
                        className="hp-search"
                        value={filters.primary_flag}
                        onChange={(e) => handleFilterChange("primary_flag", e.target.value)}
                        style={{ width: "100%" }}
                      >
                        <option value="">All</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Chronic Flag
                      </label>
                      <select
                        className="hp-search"
                        value={filters.chronic_flag}
                        onChange={(e) => handleFilterChange("chronic_flag", e.target.value)}
                        style={{ width: "100%" }}
                      >
                        <option value="">All</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
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
                Loading diagnoses...
              </div>
            ) : (
              <>
                <div className="hp-table-container">
                  <div style={{ overflowX: "auto" }}>
                    <table className="hp-table">
                      <thead>
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
                          }} onClick={() => handleSort("diagnosis_id")}>
                            Diagnosis ID {sortBy === "diagnosis_id" && (sortDirection === "asc" ? "↑" : "↓")}
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
                          }} onClick={() => handleSort("encounter_id")}>
                            Encounter {sortBy === "encounter_id" && (sortDirection === "asc" ? "↑" : "↓")}
                          </th>
                          <th style={{ padding: "16px", textAlign: "left", color: "var(--hp-text-main)", fontWeight: "600", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Patient
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
                          }} onClick={() => handleSort("diagnosis_code")}>
                            Diagnosis Code {sortBy === "diagnosis_code" && (sortDirection === "asc" ? "↑" : "↓")}
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
                          }} onClick={() => handleSort("primary_flag")}>
                            Primary {sortBy === "primary_flag" && (sortDirection === "asc" ? "↑" : "↓")}
                          </th>
                          <th style={{ padding: "16px", textAlign: "center", color: "var(--hp-text-main)", fontWeight: "600", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {diagnoses.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ padding: "40px", textAlign: "center", color: "var(--hp-text-soft)" }}>
                              No diagnoses found
                            </td>
                          </tr>
                        ) : (
                          diagnoses.map((diagnosis) => (
                            <tr key={diagnosis.diagnosis_id} style={{ borderTop: "1px solid var(--hp-border)" }}>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                <Link to={`/diagnoses/${diagnosis.diagnosis_id}`} style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}>
                                  {diagnosis.diagnosis_id}
                                </Link>
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                <Link to={`/encounters/${diagnosis.encounter_id}`} style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}>
                                  {diagnosis.encounter_id}
                                </Link>
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                <Link to={`/patients/${diagnosis.patient_id}`} style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}>
                                  {diagnosis.first_name} {diagnosis.last_name}
                                </Link>
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                {diagnosis.diagnosis_code}
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)", textAlign: "center" }}>
                                {diagnosis.primary_flag ? "Yes" : "No"}
                              </td>
                              <td style={{ padding: "16px", textAlign: "center" }}>
                                <button
                                  className="hp-btn-edit"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(diagnosis);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="hp-btn-delete"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm(diagnosis.diagnosis_id);
                                  }}
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
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ 
                    marginTop: "24px", 
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <button
                      className="hp-secondary-btn"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{ padding: "8px 16px" }}
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 10) {
                        pageNum = i + 1;
                      } else if (currentPage <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 4) {
                        pageNum = totalPages - 9 + i;
                      } else {
                        pageNum = currentPage - 5 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          className={currentPage === pageNum ? "hp-primary-btn" : "hp-secondary-btn"}
                          onClick={() => setCurrentPage(pageNum)}
                          style={{ padding: "8px 16px", minWidth: "40px" }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      className="hp-secondary-btn"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      style={{ padding: "8px 16px" }}
                    >
                      Next
                    </button>
                    <span style={{ marginLeft: "16px", color: "var(--hp-text-soft)", fontSize: "14px" }}>
                      Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Add/Edit Modal */}
          {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "var(--hp-bg-card)",
            borderRadius: "var(--hp-radius-lg)",
            padding: "32px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "var(--hp-shadow-lg)"
          }}>
            <h2 style={{ marginTop: 0, marginBottom: "24px", color: "var(--hp-text-main)" }}>
              {editingDiagnosis ? "Edit Diagnosis" : "Add New Diagnosis"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Encounter ID <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    {editingDiagnosis ? (
                      <input
                        type="text"
                        value={formData.encounter_id || ""}
                        readOnly
                        className="hp-search"
                        style={{ width: "100%", opacity: 0.7, cursor: "not-allowed" }}
                      />
                    ) : (
                      <>
                        <input
                          type="text"
                          className="hp-search"
                          placeholder="Search and select encounter..."
                          value={encounterSearchTerm}
                          onChange={(e) => {
                            setEncounterSearchTerm(e.target.value);
                            setShowEncounterDropdown(true);
                            fetchEncounterOptions(e.target.value);
                          }}
                          onFocus={() => {
                            setShowEncounterDropdown(true);
                            if (!encounterOptions.length) fetchEncounterOptions();
                          }}
                          required
                          style={{ width: "100%" }}
                        />
                        {showEncounterDropdown && encounterOptions.length > 0 && (
                          <div style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            backgroundColor: "var(--hp-bg-card)",
                            border: "1px solid var(--hp-border)",
                            borderRadius: "var(--hp-radius-md)",
                            maxHeight: "200px",
                            overflowY: "auto",
                            zIndex: 100,
                            marginTop: "4px",
                            boxShadow: "var(--hp-shadow-md)"
                          }}>
                            {encounterOptions.map((encounter) => (
                              <div
                                key={encounter.encounter_id}
                                style={{
                                  padding: "12px",
                                  cursor: "pointer",
                                  borderBottom: "1px solid var(--hp-border)",
                                  color: "var(--hp-text-main)"
                                }}
                                onClick={() => {
                                  const newFormData = { ...formData, encounter_id: encounter.encounter_id };
                                  
                                  // If encounter has a diagnosis code, pre-fill it
                                  if (encounter.diagnosis_code) {
                                    newFormData.diagnosis_code = encounter.diagnosis_code;
                                    setDiagnosisCodeSearchTerm(encounter.diagnosis_code);
                                    
                                    // Try to find description
                                    const codeOption = diagnosisCodeOptions.find(c => c.diagnosis_code === encounter.diagnosis_code);
                                    if (codeOption && codeOption.diagnosis_description) {
                                      newFormData.diagnosis_description = codeOption.diagnosis_description;
                                    }
                                  }
                                  
                                  setFormData(newFormData);
                                  setEncounterSearchTerm(`${encounter.encounter_id} - ${encounter.patient_first_name || ""} ${encounter.patient_last_name || ""}`);
                                  setShowEncounterDropdown(false);
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(148, 163, 184, 0.1)"}
                                onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                              >
                                <div style={{ fontWeight: "500" }}>{encounter.encounter_id}</div>
                                <div style={{ fontSize: "12px", color: "var(--hp-text-soft)" }}>
                                  {encounter.patient_first_name} {encounter.patient_last_name} - {encounter.visit_date ? new Date(encounter.visit_date).toLocaleDateString() : ""}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Diagnosis Code <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      className="hp-search"
                      value={diagnosisCodeSearchTerm}
                      onChange={(e) => {
                        setDiagnosisCodeSearchTerm(e.target.value);
                        setFormData({ ...formData, diagnosis_code: e.target.value });
                        setShowDiagnosisCodeDropdown(true);
                      }}
                      onFocus={() => setShowDiagnosisCodeDropdown(true)}
                      required
                      placeholder="Select or type diagnosis code..."
                      style={{ width: "100%" }}
                    />
                    {showDiagnosisCodeDropdown && diagnosisCodeOptions.length > 0 && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "var(--hp-bg-card)",
                        border: "1px solid var(--hp-border)",
                        borderRadius: "var(--hp-radius-md)",
                        maxHeight: "200px",
                        overflowY: "auto",
                        zIndex: 100,
                        marginTop: "4px",
                        boxShadow: "var(--hp-shadow-md)"
                      }}>
                        {diagnosisCodeOptions
                          .filter(code => {
                            const term = diagnosisCodeSearchTerm ? diagnosisCodeSearchTerm.toLowerCase() : "";
                            const codeMatch = code.diagnosis_code && code.diagnosis_code.toLowerCase().includes(term);
                            const descMatch = code.diagnosis_description && code.diagnosis_description.toLowerCase().includes(term);
                            return !term || codeMatch || descMatch;
                          })
                          .map((code) => (
                            <div
                              key={code.diagnosis_code}
                              style={{
                                padding: "12px",
                                cursor: "pointer",
                                borderBottom: "1px solid var(--hp-border)",
                                color: "var(--hp-text-main)"
                              }}
                              onClick={() => {
                                setFormData({ 
                                  ...formData, 
                                  diagnosis_code: code.diagnosis_code,
                                  diagnosis_description: code.diagnosis_description || formData.diagnosis_description
                                });
                                setDiagnosisCodeSearchTerm(code.diagnosis_code);
                                setShowDiagnosisCodeDropdown(false);
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(148, 163, 184, 0.1)"}
                              onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                            >
                              <div style={{ fontWeight: "500" }}>{code.diagnosis_code}</div>
                              {code.diagnosis_description && (
                                <div style={{ fontSize: "12px", color: "var(--hp-text-soft)" }}>
                                  {code.diagnosis_description}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Diagnosis Description
                  </label>
                  <textarea
                    className="hp-search"
                    value={formData.diagnosis_description}
                    onChange={(e) => setFormData({ ...formData, diagnosis_description: e.target.value })}
                    placeholder="Description of the diagnosis"
                    rows="3"
                    style={{ width: "100%", resize: "vertical" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Primary Flag
                    </label>
                    <select
                      className="hp-search"
                      value={formData.primary_flag}
                      onChange={(e) => setFormData({ ...formData, primary_flag: e.target.value })}
                      style={{ width: "100%" }}
                    >
                      <option value="1">Yes</option>
                      <option value="0">No</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Chronic Flag
                    </label>
                    <select
                      className="hp-search"
                      value={formData.chronic_flag}
                      onChange={(e) => setFormData({ ...formData, chronic_flag: e.target.value })}
                      style={{ width: "100%" }}
                    >
                      <option value="">Not Specified</option>
                      <option value="1">Yes</option>
                      <option value="0">No</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
                <button
                  type="button"
                  className="hp-secondary-btn"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "10px 20px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hp-primary-btn"
                  style={{ padding: "10px 20px" }}
                >
                  {editingDiagnosis ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: "var(--hp-bg-card)",
            borderRadius: "var(--hp-radius-lg)",
            padding: "24px",
            maxWidth: "400px",
            width: "90%"
          }}>
            <h3 style={{ marginTop: 0, color: "var(--hp-text-main)" }}>Confirm Delete</h3>
            <p style={{ color: "var(--hp-text-soft)" }}>
              Are you sure you want to delete this diagnosis? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
              <button
                className="hp-secondary-btn"
                onClick={() => setDeleteConfirm(null)}
                style={{ padding: "10px 20px" }}
              >
                Cancel
              </button>
              <button
                className="hp-danger-btn"
                onClick={() => handleDelete(deleteConfirm)}
                style={{ padding: "10px 20px" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default DiagnosesPage;

