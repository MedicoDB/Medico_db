import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import Sidebar from "../components/Sidebar";
import "../HomePage.css";

const ProceduresPage = () => {
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    procedure_id: "",
    encounter_id: "",
    procedure_code: "",
    provider_id: "",
    procedure_date_from: "",
    procedure_date_to: "",
    procedure_cost_min: "",
    procedure_cost_max: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Sorting
  const [sortBy, setSortBy] = useState("procedure_date");
  const [sortDirection, setSortDirection] = useState("desc");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50;

  // Encounter and provider options for searchable selects
  const [encounterOptions, setEncounterOptions] = useState([]);
  const [encounterSearchTerm, setEncounterSearchTerm] = useState("");
  const [showEncounterDropdown, setShowEncounterDropdown] = useState(false);
  const [providerOptions, setProviderOptions] = useState([]);
  const [providerSearchTerm, setProviderSearchTerm] = useState("");
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [procedureCodeOptions, setProcedureCodeOptions] = useState([]);
  const [showProcedureCodeDropdown, setShowProcedureCodeDropdown] = useState(false);
  const [procedureCodeSearchTerm, setProcedureCodeSearchTerm] = useState("");

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

  const fetchProcedures = useCallback(async () => {
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
      
      const response = await api.getProceduresList(params);
      
      setProcedures(response.data || []);
      setTotalCount(response.total || 0);
      setTotalPages(response.total_pages || 1);
      
      setError(null);
    } catch (err) {
      console.error("Error fetching procedures:", err);
      setError(err.message || "Failed to load procedures");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, sortBy, sortDirection, filters.procedure_id, filters.encounter_id, filters.procedure_code, filters.provider_id, filters.procedure_date_from, filters.procedure_date_to, filters.procedure_cost_min, filters.procedure_cost_max]);

  // Reset to page 1 when filters/search/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortDirection, filters.procedure_id, filters.encounter_id, filters.procedure_code, filters.provider_id, filters.procedure_date_from, filters.procedure_date_to, filters.procedure_cost_min, filters.procedure_cost_max]);

  // Fetch when dependencies change
  useEffect(() => {
    fetchProcedures();
  }, [fetchProcedures]);

  // Fetch encounter options
  const fetchEncounterOptions = useCallback(async (search = "") => {
    try {
      const options = await api.getProceduresEncounterOptions(search, 50);
      setEncounterOptions(options);
    } catch (err) {
      console.error("Error fetching encounters:", err);
    }
  }, []);

  // Fetch provider options
  const fetchProviderOptions = useCallback(async (search = "") => {
    try {
      const options = await api.getProceduresProviderOptions(search, 50);
      setProviderOptions(options);
    } catch (err) {
      console.error("Error fetching providers:", err);
    }
  }, []);

  // Fetch procedure codes
  const fetchProcedureCodes = useCallback(async () => {
    try {
      const codes = await api.getProcedureCodes();
      setProcedureCodeOptions(codes);
    } catch (err) {
      console.error("Error fetching procedure codes:", err);
    }
  }, []);

  useEffect(() => {
    if (showModal) {
      fetchProcedureCodes();
    }
  }, [showModal, fetchProcedureCodes]);

  useEffect(() => {
    if (showModal && showEncounterDropdown) {
      fetchEncounterOptions(encounterSearchTerm);
    }
  }, [showModal, showEncounterDropdown, encounterSearchTerm, fetchEncounterOptions]);

  useEffect(() => {
    if (showModal && showProviderDropdown) {
      fetchProviderOptions(providerSearchTerm);
    }
  }, [showModal, showProviderDropdown, providerSearchTerm, fetchProviderOptions]);

  const handleAdd = () => {
    setEditingProcedure(null);
    setFormData({
      encounter_id: "",
      procedure_code: "",
      procedure_description: "",
      procedure_date: new Date().toISOString().slice(0, 10),
      provider_id: "",
      procedure_cost: 0,
    });
    setEncounterSearchTerm("");
    setProviderSearchTerm("");
    setProcedureCodeSearchTerm("");
    setShowEncounterDropdown(false);
    setShowProviderDropdown(false);
    setShowProcedureCodeDropdown(false);
    setShowModal(true);
  };

  const handleEdit = (procedure) => {
    setEditingProcedure(procedure);
    const normalizedDate = normalizeDate(procedure.procedure_date);
    setFormData({
      encounter_id: procedure.encounter_id || "",
      procedure_code: procedure.procedure_code || "",
      procedure_description: procedure.procedure_description || "",
      procedure_date: normalizedDate || "",
      provider_id: procedure.provider_id || "",
      procedure_cost: procedure.procedure_cost || 0,
    });
    const currentEncounter = encounterOptions.find(e => e.encounter_id === procedure.encounter_id);
    setEncounterSearchTerm(currentEncounter ? `${currentEncounter.encounter_id} - ${currentEncounter.patient_first_name || ""} ${currentEncounter.patient_last_name || ""}` : "");
    const currentProvider = providerOptions.find(p => p.provider_id === procedure.provider_id);
    setProviderSearchTerm(currentProvider ? `${currentProvider.provider_id} - ${currentProvider.name}` : "");
    setProcedureCodeSearchTerm(procedure.procedure_code || "");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      submitData.procedure_cost = parseFloat(submitData.procedure_cost) || 0;

      // When editing, if procedure_date is not provided, keep the original value
      if (editingProcedure && !submitData.procedure_date) {
        const originalDate = normalizeDate(editingProcedure.procedure_date);
        if (originalDate) {
          submitData.procedure_date = originalDate;
        }
      }

      if (editingProcedure) {
        await api.updateProcedure(editingProcedure.procedure_id, submitData);
      } else {
        await api.createProcedure(submitData);
      }
      setShowModal(false);
      fetchProcedures();
    } catch (err) {
      setError(err.message || "Failed to save procedure");
    }
  };

  const handleDelete = async (procedure_id) => {
    try {
      await api.deleteProcedure(procedure_id);
      setDeleteConfirm(null);
      fetchProcedures();
    } catch (err) {
      setError(err.message || "Failed to delete procedure");
      setDeleteConfirm(null);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      procedure_id: "",
      encounter_id: "",
      procedure_code: "",
      provider_id: "",
      procedure_date_from: "",
      procedure_date_to: "",
      procedure_cost_min: "",
      procedure_cost_max: "",
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
              <h1 className="hp-header-title">Procedures</h1>
              <p className="hp-header-subtitle">View procedures linked to encounters and providers, including costs and codes.</p>
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
                placeholder="Search procedures by ID, procedure code, encounter ID, or patient name..."
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
                        Procedure ID
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. PROC000001"
                        value={filters.procedure_id}
                        onChange={(e) => handleFilterChange("procedure_id", e.target.value)}
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
                        Procedure Code
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. CPT12345"
                        value={filters.procedure_code}
                        onChange={(e) => handleFilterChange("procedure_code", e.target.value)}
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
                        placeholder="e.g. PROV000001"
                        value={filters.provider_id}
                        onChange={(e) => handleFilterChange("provider_id", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Min Cost
                      </label>
                      <input
                        type="number"
                        className="hp-search"
                        placeholder="0.00"
                        value={filters.procedure_cost_min}
                        onChange={(e) => handleFilterChange("procedure_cost_min", e.target.value)}
                        style={{ width: "100%" }}
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Max Cost
                      </label>
                      <input
                        type="number"
                        className="hp-search"
                        placeholder="0.00"
                        value={filters.procedure_cost_max}
                        onChange={(e) => handleFilterChange("procedure_cost_max", e.target.value)}
                        style={{ width: "100%" }}
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Procedure Date From
                      </label>
                      <input
                        type="date"
                        className="hp-search"
                        value={filters.procedure_date_from}
                        onChange={(e) => handleFilterChange("procedure_date_from", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Procedure Date To
                      </label>
                      <input
                        type="date"
                        className="hp-search"
                        value={filters.procedure_date_to}
                        onChange={(e) => handleFilterChange("procedure_date_to", e.target.value)}
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
                Loading procedures...
              </div>
            ) : (
              <>
                <div className="hp-table-container">
                  <div style={{ overflowX: "auto" }}>
                    <table className="hp-table">
                      <thead>
                        <tr>
                          <th style={{ cursor: "pointer" }} onClick={() => handleSort("procedure_code")}>
                            PROCEDURE CODE {sortBy === "procedure_code" && (sortDirection === "asc" ? "↑" : "↓")}
                          </th>
                          <th>DESCRIPTION</th>
                          <th style={{ cursor: "pointer" }} onClick={() => handleSort("procedure_date")}>
                            DATE {sortBy === "procedure_date" && (sortDirection === "asc" ? "↑" : "↓")}
                          </th>
                          <th style={{ cursor: "pointer", textAlign: "right" }} onClick={() => handleSort("procedure_cost")}>
                            COST {sortBy === "procedure_cost" && (sortDirection === "asc" ? "↑" : "↓")}
                          </th>
                          <th>PROVIDER</th>
                          <th>PATIENT</th>
                          <th style={{ textAlign: "right" }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {procedures.length === 0 ? (
                          <tr>
                            <td colSpan="8" style={{ padding: "40px", textAlign: "center", color: "var(--hp-text-soft)" }}>
                              No procedures found
                            </td>
                          </tr>
                        ) : (
                          procedures.map((procedure) => (
                            <tr key={procedure.procedure_id}>
                              <td>{procedure.procedure_code}</td>
                              <td>{procedure.procedure_description || "-"}</td>
                              <td>{procedure.procedure_date ? new Date(procedure.procedure_date).toLocaleDateString('en-GB') : "-"}</td>
                              <td style={{ textAlign: "right" }}>${(parseFloat(procedure.procedure_cost) || 0).toFixed(2)}</td>
                              <td>
                                {procedure.provider_id ? (
                                  <Link to={`/providers/${procedure.provider_id}`} style={{ color: "var(--hp-primary)", textDecoration: "none" }}>
                                    {procedure.provider_name || "-"}
                                  </Link>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td>
                                <Link to={`/patients/${procedure.patient_id}`} style={{ color: "var(--hp-primary)", textDecoration: "none" }}>
                                  {procedure.first_name} {procedure.last_name}
                                </Link>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <button
                                  className="hp-btn-edit"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(procedure);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="hp-btn-delete"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm(procedure.procedure_id);
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
              {editingProcedure ? "Edit Procedure" : "Add New Procedure"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Encounter ID <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    {editingProcedure ? (
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
                                  if (encounter.provider_id) {
                                    newFormData.provider_id = encounter.provider_id;
                                    setProviderSearchTerm(`${encounter.provider_id} - ${encounter.provider_name || ""}`);
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
                    Procedure Code <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      className="hp-search"
                      value={procedureCodeSearchTerm}
                      onChange={(e) => {
                        setProcedureCodeSearchTerm(e.target.value);
                        setFormData({ ...formData, procedure_code: e.target.value });
                        setShowProcedureCodeDropdown(true);
                      }}
                      onFocus={() => setShowProcedureCodeDropdown(true)}
                      required
                      placeholder="Select or type procedure code..."
                      style={{ width: "100%" }}
                    />
                    {showProcedureCodeDropdown && procedureCodeOptions.length > 0 && (
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
                        {procedureCodeOptions
                          .filter(code => 
                            !procedureCodeSearchTerm || 
                            code.procedure_code.toLowerCase().includes(procedureCodeSearchTerm.toLowerCase()) ||
                            (code.procedure_description && code.procedure_description.toLowerCase().includes(procedureCodeSearchTerm.toLowerCase()))
                          )
                          .map((code) => (
                            <div
                              key={code.procedure_code}
                              style={{
                                padding: "12px",
                                cursor: "pointer",
                                borderBottom: "1px solid var(--hp-border)",
                                color: "var(--hp-text-main)"
                              }}
                              onClick={() => {
                                setFormData({ 
                                  ...formData, 
                                  procedure_code: code.procedure_code,
                                  procedure_description: code.procedure_description || formData.procedure_description 
                                });
                                setProcedureCodeSearchTerm(code.procedure_code);
                                setShowProcedureCodeDropdown(false);
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(148, 163, 184, 0.1)"}
                              onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                            >
                              <div style={{ fontWeight: "500" }}>{code.procedure_code}</div>
                              {code.procedure_description && (
                                <div style={{ fontSize: "12px", color: "var(--hp-text-soft)" }}>
                                  {code.procedure_description}
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
                    Procedure Description
                  </label>
                  <textarea
                    className="hp-search"
                    value={formData.procedure_description}
                    onChange={(e) => setFormData({ ...formData, procedure_description: e.target.value })}
                    placeholder="Description of the procedure"
                    rows="3"
                    style={{ width: "100%", resize: "vertical" }}
                  />
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Provider
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      className="hp-search"
                      placeholder="Provider will be selected automatically..."
                      value={providerSearchTerm}
                      readOnly
                      style={{ width: "100%", backgroundColor: "var(--hp-bg-surface)" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Procedure Date {!editingProcedure && <span style={{ color: "#dc3545" }}>*</span>}
                    </label>
                    <input
                      type="date"
                      className="hp-search"
                      value={formData.procedure_date || ""}
                      onChange={(e) => setFormData({ ...formData, procedure_date: e.target.value })}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Procedure Cost
                    </label>
                    <input
                      type="number"
                      className="hp-search"
                      value={formData.procedure_cost}
                      onChange={(e) => setFormData({ ...formData, procedure_cost: e.target.value })}
                      step="0.01"
                      min="0"
                      style={{ width: "100%" }}
                    />
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
                  {editingProcedure ? "Update" : "Create"}
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
              Are you sure you want to delete this procedure? This action cannot be undone.
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

export default ProceduresPage;

