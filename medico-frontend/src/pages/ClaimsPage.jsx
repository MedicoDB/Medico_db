import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import Sidebar from "../components/Sidebar";
import "../HomePage.css";

const ClaimsPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingClaim, setEditingClaim] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    billing_id: "",
    encounter_id: "",
    claim_status: "",
    billed_amount_min: "",
    billed_amount_max: "",
    claim_date_from: "",
    claim_date_to: "",
    payment_method: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Sorting
  const [sortBy, setSortBy] = useState("claim_billing_date");
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

  const claimStatusOptions = ["Pending", "Approved", "Denied", "Under Review", "Paid", "Rejected"];

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

  const fetchClaims = useCallback(async () => {
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
      
      const response = await api.getClaimsList(params);
      
      setClaims(response.data || []);
      setTotalCount(response.total || 0);
      setTotalPages(response.total_pages || 1);
      
      setError(null);
    } catch (err) {
      console.error("Error fetching claims:", err);
      setError(err.message || "Failed to load claims");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, sortBy, sortDirection, filters]);

  // Reset to page 1 when filters/search/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortDirection, filters.billing_id, filters.encounter_id, filters.claim_status, filters.billed_amount_min, filters.billed_amount_max, filters.claim_date_from, filters.claim_date_to, filters.payment_method]);

  // Fetch when dependencies change
  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Fetch encounter options
  const fetchEncounterOptions = useCallback(async (search = "") => {
    try {
      const options = await api.getEncountersOptions(search, 50);
      setEncounterOptions(options);
    } catch (err) {
      console.error("Error fetching encounters:", err);
    }
  }, []);

  useEffect(() => {
    if (showModal && showEncounterDropdown) {
      fetchEncounterOptions(encounterSearchTerm);
    }
  }, [showModal, showEncounterDropdown, encounterSearchTerm, fetchEncounterOptions]);

  const handleAdd = () => {
    setEditingClaim(null);
    setFormData({
      encounter_id: "",
      claim_billing_date: new Date().toISOString().split('T')[0],
      billed_amount: 0,
      paid_amount: 0,
      claim_status: "Pending",
      payment_method: "",
      insurance_provider: "",
      denial_reason: "",
    });
    setEncounterSearchTerm("");
    setShowEncounterDropdown(false);
    setShowModal(true);
  };

  const handleEdit = (claim) => {
    setEditingClaim(claim);
    const normalizedDate = normalizeDate(claim.claim_billing_date);
    setFormData({
      encounter_id: claim.encounter_id || "",
      claim_billing_date: normalizedDate || "",
      billed_amount: claim.billed_amount || 0,
      paid_amount: claim.paid_amount || 0,
      claim_status: claim.claim_status || "Pending",
      payment_method: claim.payment_method || "",
      insurance_provider: claim.insurance_provider || "",
      denial_reason: claim.denial_reason || "",
    });
    // Set encounter search term to current encounter
    const currentEncounter = encounterOptions.find(e => e.encounter_id === claim.encounter_id);
    setEncounterSearchTerm(currentEncounter ? `${currentEncounter.encounter_id} - ${currentEncounter.patient_first_name || ""} ${currentEncounter.patient_last_name || ""}` : "");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      submitData.billed_amount = parseFloat(submitData.billed_amount) || 0;
      submitData.paid_amount = parseFloat(submitData.paid_amount) || 0;

      // When editing, if claim_billing_date is not provided, keep the original value
      if (editingClaim && !submitData.claim_billing_date) {
        const originalDate = normalizeDate(editingClaim.claim_billing_date);
        if (originalDate) {
          submitData.claim_billing_date = originalDate;
        }
      }

      if (editingClaim) {
        await api.updateClaim(editingClaim.billing_id, submitData);
      } else {
        await api.createClaim(submitData);
      }
      setShowModal(false);
      fetchClaims();
    } catch (err) {
      setError(err.message || "Failed to save claim");
    }
  };

  const handleDelete = async (billing_id) => {
    try {
      await api.deleteClaim(billing_id);
      setDeleteConfirm(null);
      fetchClaims();
    } catch (err) {
      setError(err.message || "Failed to delete claim");
      setDeleteConfirm(null);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      billing_id: "",
      encounter_id: "",
      claim_status: "",
      billed_amount_min: "",
      billed_amount_max: "",
      claim_date_from: "",
      claim_date_to: "",
      payment_method: "",
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
              <h1 className="hp-header-title">Billing & Claims</h1>
              <p className="hp-header-subtitle">Manage billing, claims, and payment information.</p>
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
                placeholder="Search claims by ID, encounter ID, patient name, or status..."
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
                        Billing ID
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. BILL000001"
                        value={filters.billing_id}
                        onChange={(e) => handleFilterChange("billing_id", e.target.value)}
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
                        Claim Status
                      </label>
                      <select
                        className="hp-search"
                        value={filters.claim_status}
                        onChange={(e) => handleFilterChange("claim_status", e.target.value)}
                        style={{ width: "100%", padding: "10px" }}
                      >
                        <option value="">All Statuses</option>
                        {claimStatusOptions.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Min Billed Amount
                      </label>
                      <input
                        type="number"
                        className="hp-search"
                        placeholder="0.00"
                        value={filters.billed_amount_min}
                        onChange={(e) => handleFilterChange("billed_amount_min", e.target.value)}
                        style={{ width: "100%" }}
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Max Billed Amount
                      </label>
                      <input
                        type="number"
                        className="hp-search"
                        placeholder="0.00"
                        value={filters.billed_amount_max}
                        onChange={(e) => handleFilterChange("billed_amount_max", e.target.value)}
                        style={{ width: "100%" }}
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Payment Method
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. Insurance, Cash"
                        value={filters.payment_method}
                        onChange={(e) => handleFilterChange("payment_method", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Date From
                      </label>
                      <input
                        type="date"
                        className="hp-search"
                        value={filters.claim_date_from}
                        onChange={(e) => handleFilterChange("claim_date_from", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Date To
                      </label>
                      <input
                        type="date"
                        className="hp-search"
                        value={filters.claim_date_to}
                        onChange={(e) => handleFilterChange("claim_date_to", e.target.value)}
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
                Loading claims...
              </div>
            ) : (
              <>
                <div className="hp-table-container">
                  <div style={{ overflowX: "auto" }}>
                    <table className="hp-table">
                      <thead>
                        <tr>
                          <th>BILLING ID</th>
                          <th>PATIENT ID</th>
                          <th>ENCOUNTER ID</th>
                          <th>INSURANCE</th>
                          <th style={{ textAlign: "right" }}>BILLED AMOUNT</th>
                          <th style={{ textAlign: "right" }}>PAID AMOUNT</th>
                          <th style={{ cursor: "pointer" }} onClick={() => handleSort("claim_status")}>
                            STATUS {sortBy === "claim_status" && (sortDirection === "asc" ? "↑" : "↓")}
                          </th>
                          <th style={{ cursor: "pointer" }} onClick={() => handleSort("claim_billing_date")}>
                            DATE {sortBy === "claim_billing_date" && (sortDirection === "asc" ? "↑" : "↓")}
                          </th>
                          <th style={{ textAlign: "right" }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {claims.length === 0 ? (
                          <tr>
                            <td colSpan="9" style={{ padding: "40px", textAlign: "center", color: "var(--hp-text-soft)" }}>
                              No claims found
                            </td>
                          </tr>
                        ) : (
                          claims.map((claim) => (
                            <tr key={claim.billing_id}>
                              <td>
                                <Link to={`/claims/${claim.billing_id}`} style={{ color: "var(--hp-primary)", textDecoration: "none" }}>
                                  {claim.billing_id}
                                </Link>
                              </td>
                              <td>
                                <Link to={`/patients/${claim.patient_id}`} style={{ color: "var(--hp-primary)", textDecoration: "none" }}>
                                  {claim.patient_id}
                                </Link>
                              </td>
                              <td>
                                <Link to={`/encounters/${claim.encounter_id}`} style={{ color: "var(--hp-primary)", textDecoration: "none" }}>
                                  {claim.encounter_id}
                                </Link>
                              </td>
                              <td>{claim.insurance_provider || "-"}</td>
                              <td style={{ textAlign: "right" }}>${(parseFloat(claim.billed_amount) || 0).toFixed(2)}</td>
                              <td style={{ textAlign: "right" }}>${(parseFloat(claim.paid_amount) || 0).toFixed(2)}</td>
                              <td>
                                <span className={claim.claim_status === "Paid" ? "hp-status-badge hp-status-badge--paid" : claim.claim_status === "Denied" ? "hp-status-badge hp-status-badge--denied" : "hp-status-badge hp-status-badge--pending"}>
                                  {claim.claim_status}
                                </span>
                              </td>
                              <td>{claim.claim_billing_date ? new Date(claim.claim_billing_date).toLocaleDateString('en-GB') : "-"}</td>
                              <td style={{ textAlign: "right" }}>
                                <button
                                  className="hp-btn-delete"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm(claim.billing_id);
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
                        Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} claims
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
                              className={currentPage === pageNum ? "hp-primary-btn" : "hp-secondary-btn"}
                              onClick={() => setCurrentPage(pageNum)}
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
              {editingClaim ? "Edit Claim" : "Add New Claim"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Encounter ID <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    {editingClaim ? (
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
                                  setFormData({ ...formData, encounter_id: encounter.encounter_id });
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
                    Claim Billing Date {!editingClaim && <span style={{ color: "#dc3545" }}>*</span>}
                  </label>
                  <input
                    type="date"
                    className="hp-search"
                    value={formData.claim_billing_date || ""}
                    onChange={(e) => setFormData({ ...formData, claim_billing_date: e.target.value })}
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Billed Amount <span style={{ color: "#dc3545" }}>*</span>
                    </label>
                    <input
                      type="number"
                      className="hp-search"
                      value={formData.billed_amount}
                      onChange={(e) => setFormData({ ...formData, billed_amount: e.target.value })}
                      step="0.01"
                      min="0"
                      required
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Paid Amount
                    </label>
                    <input
                      type="number"
                      className="hp-search"
                      value={formData.paid_amount}
                      onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                      step="0.01"
                      min="0"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Claim Status <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <select
                    className="hp-search"
                    value={formData.claim_status}
                    onChange={(e) => setFormData({ ...formData, claim_status: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px" }}
                  >
                    {claimStatusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Payment Method
                  </label>
                  <input
                    type="text"
                    className="hp-search"
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    placeholder="e.g. Insurance, Cash, Credit Card"
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Insurance Provider
                  </label>
                  <input
                    type="text"
                    className="hp-search"
                    value={formData.insurance_provider}
                    onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                    placeholder="Insurance company name"
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Denial Reason
                  </label>
                  <textarea
                    className="hp-search"
                    value={formData.denial_reason || ""}
                    onChange={(e) => setFormData({ ...formData, denial_reason: e.target.value })}
                    placeholder="Reason for denial (if applicable)"
                    rows="3"
                    style={{ width: "100%", resize: "vertical" }}
                  />
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
                  {editingClaim ? "Update" : "Create"}
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
              Are you sure you want to delete this claim? This action cannot be undone.
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

export default ClaimsPage;

