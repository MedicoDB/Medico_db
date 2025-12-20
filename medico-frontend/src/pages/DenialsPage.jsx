import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import Sidebar from "../components/Sidebar";
import "../HomePage.css";

const DenialsPage = () => {
  const navigate = useNavigate();
  const [denials, setDenials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDenial, setEditingDenial] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    denial_id: "",
    claim_id: "",
    denial_reason_code: "",
    denial_date_from: "",
    denial_date_to: "",
    appeal_status: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Sorting
  const [sortBy, setSortBy] = useState("denial_date");
  const [sortDirection, setSortDirection] = useState("desc");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50;

  // Claim options for searchable select
  const [claimOptions, setClaimOptions] = useState([]);
  const [claimSearchTerm, setClaimSearchTerm] = useState("");
  const [showClaimDropdown, setShowClaimDropdown] = useState(false);
  
  // Denial reason code options for searchable select
  const [denialReasonCodeOptions, setDenialReasonCodeOptions] = useState([]);
  const [denialReasonCodeSearchTerm, setDenialReasonCodeSearchTerm] = useState("");
  const [showDenialReasonCodeDropdown, setShowDenialReasonCodeDropdown] = useState(false);

  const appealStatusOptions = ["Pending", "Approved", "Rejected", "Under Review"];

  const fetchDenials = useCallback(async () => {
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
      
      const response = await api.getDenialsList(params);
      
      setDenials(response.data || []);
      setTotalCount(response.total || 0);
      setTotalPages(response.total_pages || 1);
      
      setError(null);
    } catch (err) {
      console.error("Error fetching denials:", err);
      setError(err.message || "Failed to load denials");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, sortBy, sortDirection, filters.denial_id, filters.claim_id, filters.denial_reason_code, filters.denial_date_from, filters.denial_date_to, filters.appeal_status]);

  // Reset to page 1 when filters/search/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortDirection, filters.denial_id, filters.claim_id, filters.denial_reason_code, filters.denial_date_from, filters.denial_date_to, filters.appeal_status]);

  // Fetch when dependencies change
  useEffect(() => {
    fetchDenials();
  }, [fetchDenials]);

  // Fetch claim options
  const fetchClaimOptions = useCallback(async (search = "") => {
    try {
      const options = await api.getClaimsOptions(search, 50);
      setClaimOptions(options);
    } catch (err) {
      console.error("Error fetching claims:", err);
    }
  }, []);

  // Fetch denial reason codes
  const fetchDenialReasonCodes = useCallback(async () => {
    try {
      const codes = await api.getDenialReasonCodes();
      setDenialReasonCodeOptions(codes);
    } catch (err) {
      console.error("Error fetching denial reason codes:", err);
    }
  }, []);

  useEffect(() => {
    if (showModal && showClaimDropdown) {
      fetchClaimOptions(claimSearchTerm);
    }
  }, [showModal, showClaimDropdown, claimSearchTerm, fetchClaimOptions]);

  useEffect(() => {
    if (showModal) {
      fetchDenialReasonCodes();
    }
  }, [showModal, fetchDenialReasonCodes]);

  const handleAdd = () => {
    setEditingDenial(null);
    setFormData({
      claim_id: "",
      denial_date: new Date().toISOString().slice(0, 10),
      denial_reason_code: "",
      denial_reason_description: "",
      denied_amount: 0,
      appeal_filed: "",
      appeal_status: "",
      appeal_resolution_date: "",
      final_outcome: "",
    });
    setClaimSearchTerm("");
    setShowClaimDropdown(false);
    setDenialReasonCodeSearchTerm("");
    setShowDenialReasonCodeDropdown(false);
    setShowModal(true);
  };

  const handleEdit = (denial) => {
    setEditingDenial(denial);
    setFormData({
      claim_id: denial.claim_id || "",
      denial_date: denial.denial_date ? new Date(denial.denial_date).toISOString().slice(0, 10) : "",
      denial_reason_code: denial.denial_reason_code || "",
      denial_reason_description: denial.denial_reason_description || "",
      denied_amount: denial.denied_amount || 0,
      appeal_filed: denial.appeal_filed || "",
      appeal_status: denial.appeal_status || "",
      appeal_resolution_date: denial.appeal_resolution_date ? new Date(denial.appeal_resolution_date).toISOString().slice(0, 10) : "",
      final_outcome: denial.final_outcome || "",
    });
    // Set search terms
    setClaimSearchTerm(denial.claim_id || "");
    setDenialReasonCodeSearchTerm(denial.denial_reason_code || "");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      submitData.denied_amount = parseFloat(submitData.denied_amount) || 0;

      if (editingDenial) {
        await api.updateDenial(editingDenial.denial_id, submitData);
      } else {
        await api.createDenial(submitData);
      }
      setShowModal(false);
      fetchDenials();
    } catch (err) {
      setError(err.message || "Failed to save denial");
    }
  };

  const handleDelete = async (denial_id) => {
    try {
      await api.deleteDenial(denial_id);
      setDeleteConfirm(null);
      fetchDenials();
    } catch (err) {
      setError(err.message || "Failed to delete denial");
      setDeleteConfirm(null);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      denial_id: "",
      claim_id: "",
      denial_reason_code: "",
      denial_date_from: "",
      denial_date_to: "",
      appeal_status: "",
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
              <h1 className="hp-header-title">Denials</h1>
              <p className="hp-header-subtitle">Track claim denials, reasons, appeals, and final outcomes.</p>
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
                placeholder="Search denials by ID, claim ID, billing ID, reason, or patient name..."
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
                        Denial ID
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. DEN000001"
                        value={filters.denial_id}
                        onChange={(e) => handleFilterChange("denial_id", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Claim ID
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. CLM000001"
                        value={filters.claim_id}
                        onChange={(e) => handleFilterChange("claim_id", e.target.value)}
                        style={{ width: "100%" }}
                      />
                      </div>

                     <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Denial Reason Code
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. CO-27"
                        value={filters.denial_reason_code}
                        onChange={(e) => handleFilterChange("denial_reason_code", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Appeal Status
                      </label>
                      <select
                        className="hp-search"
                        value={filters.appeal_status}
                        onChange={(e) => handleFilterChange("appeal_status", e.target.value)}
                        style={{ width: "100%", padding: "10px" }}
                      >
                        <option value="">All Statuses</option>
                        {appealStatusOptions.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Denial Date From
                      </label>
                      <input
                        type="date"
                        className="hp-search"
                        value={filters.denial_date_from}
                        onChange={(e) => handleFilterChange("denial_date_from", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Denial Date To
                      </label>
                      <input
                        type="date"
                        className="hp-search"
                        value={filters.denial_date_to}
                        onChange={(e) => handleFilterChange("denial_date_to", e.target.value)}
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
                Loading denials...
              </div>
            ) : (
              <>
                <div className="hp-table-container">
                  <div style={{ overflowX: "auto" }}>
                    <table className="hp-table">
                      <thead>
                        <tr>
                          <th>DENIAL ID</th>
                          <th>CLAIM ID</th>
                          <th>REASON</th>
                          <th style={{ textAlign: "right" }}>DENIED AMOUNT</th>
                          <th style={{ cursor: "pointer" }} onClick={() => handleSort("denial_date")}>
                            DENIAL DATE {sortBy === "denial_date" && (sortDirection === "asc" ? "↑" : "↓")}
                          </th>
                          <th>APPEAL STATUS</th>
                          <th>FINAL OUTCOME</th>
                          <th style={{ textAlign: "right" }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {denials.length === 0 ? (
                          <tr>
                            <td colSpan="8" style={{ padding: "40px", textAlign: "center", color: "var(--hp-text-soft)" }}>
                              No denials found
                            </td>
                          </tr>
                        ) : (
                          denials.map((denial) => (
                            <tr key={denial.denial_id}>
                              <td>
                                <Link to={`/denials/${denial.denial_id}`} style={{ color: "var(--hp-primary)", textDecoration: "none" }}>
                                  {denial.denial_id}
                                </Link>
                              </td>
                              <td>
                                {denial.claim_id ? (
                                  <Link 
                                    to={`/claims/${denial.billing_id || denial.claim_id}`}
                                    onClick={async (e) => {
                                      if (!denial.billing_id && denial.claim_id) {
                                        try {
                                          const claim = await api.getClaimByClaimId(denial.claim_id);
                                          if (claim && claim.billing_id) {
                                            e.preventDefault();
                                            navigate(`/claims/${claim.billing_id}`);
                                          }
                                        } catch (err) {
                                          console.error("Error fetching claim:", err);
                                        }
                                      }
                                    }}
                                    style={{ color: "var(--hp-primary)", textDecoration: "none" }}
                                  >
                                    {denial.claim_id}
                                  </Link>
                                ) : "-"}
                              </td>
                              <td>{denial.denial_reason_description || denial.denial_reason_code || "-"}</td>
                              <td style={{ textAlign: "right" }}>${(parseFloat(denial.denied_amount) || 0).toFixed(2)}</td>
                              <td>{denial.denial_date ? new Date(denial.denial_date).toLocaleDateString('en-GB') : "-"}</td>
                              <td>
                                {denial.appeal_status ? (
                                  <span className={denial.appeal_status === "Approved" ? "hp-status-badge hp-status-badge--completed" : denial.appeal_status === "Denied" ? "hp-status-badge hp-status-badge--denied" : "hp-status-badge hp-status-badge--pending"}>
                                    {denial.appeal_status}
                                  </span>
                                ) : "N/A"}
                              </td>
                              <td>{denial.final_outcome || "N/A"}</td>
                              <td style={{ textAlign: "right" }}>
                                <button
                                  className="hp-btn-delete"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm(denial.denial_id);
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
              {editingDenial ? "Edit Denial" : "Add New Denial"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Claim ID <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    {editingDenial ? (
                      <input
                        type="text"
                        value={formData.claim_id || ""}
                        readOnly
                        className="hp-search"
                        style={{ width: "100%", opacity: 0.7, cursor: "not-allowed" }}
                      />
                    ) : (
                      <>
                        <input
                          type="text"
                          className="hp-search"
                          placeholder="Search and select claim..."
                          value={claimSearchTerm}
                          onChange={(e) => {
                            setClaimSearchTerm(e.target.value);
                            setShowClaimDropdown(true);
                            fetchClaimOptions(e.target.value);
                          }}
                          onFocus={() => {
                            setShowClaimDropdown(true);
                            if (!claimOptions.length) fetchClaimOptions();
                          }}
                          required
                          style={{ width: "100%" }}
                        />
                        {showClaimDropdown && claimOptions.length > 0 && (
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
                            {claimOptions.map((claim) => (
                              <div
                                key={claim.claim_id}
                                style={{
                                  padding: "12px",
                                  cursor: "pointer",
                                  borderBottom: "1px solid var(--hp-border)",
                                  color: "var(--hp-text-main)"
                                }}
                                onClick={() => {
                                  setFormData({ ...formData, claim_id: claim.claim_id });
                                  setClaimSearchTerm(claim.claim_id);
                                  setShowClaimDropdown(false);
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(148, 163, 184, 0.1)"}
                                onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                              >
                                <div style={{ fontWeight: "500" }}>{claim.claim_id}</div>
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
                    Denial Date <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="hp-search"
                    value={formData.denial_date}
                    onChange={(e) => setFormData({ ...formData, denial_date: e.target.value })}
                    required
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Denial Reason Code <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      className="hp-search"
                      value={denialReasonCodeSearchTerm}
                      onChange={(e) => {
                        setDenialReasonCodeSearchTerm(e.target.value);
                        setFormData({ ...formData, denial_reason_code: e.target.value });
                        setShowDenialReasonCodeDropdown(true);
                      }}
                      onFocus={() => setShowDenialReasonCodeDropdown(true)}
                      required
                      placeholder="Select or type denial reason code..."
                      style={{ width: "100%" }}
                    />
                    {showDenialReasonCodeDropdown && denialReasonCodeOptions.length > 0 && (
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
                        {denialReasonCodeOptions
                          .filter(code => 
                            !denialReasonCodeSearchTerm || 
                            code.denial_reason_code.toLowerCase().includes(denialReasonCodeSearchTerm.toLowerCase()) ||
                            (code.denial_reason_description && code.denial_reason_description.toLowerCase().includes(denialReasonCodeSearchTerm.toLowerCase()))
                          )
                          .map((code) => (
                            <div
                              key={code.denial_reason_code}
                              style={{
                                padding: "12px",
                                cursor: "pointer",
                                borderBottom: "1px solid var(--hp-border)",
                                color: "var(--hp-text-main)"
                              }}
                              onClick={() => {
                                setFormData({ 
                                  ...formData, 
                                  denial_reason_code: code.denial_reason_code,
                                  denial_reason_description: code.denial_reason_description || formData.denial_reason_description 
                                });
                                setDenialReasonCodeSearchTerm(code.denial_reason_code);
                                setShowDenialReasonCodeDropdown(false);
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(148, 163, 184, 0.1)"}
                              onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                            >
                              <div style={{ fontWeight: "500" }}>{code.denial_reason_code}</div>
                              {code.denial_reason_description && (
                                <div style={{ fontSize: "12px", color: "var(--hp-text-soft)" }}>
                                  {code.denial_reason_description}
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
                    Denial Reason Description
                  </label>
                  <textarea
                    className="hp-search"
                    value={formData.denial_reason_description || ""}
                    onChange={(e) => setFormData({ ...formData, denial_reason_description: e.target.value })}
                    placeholder="Detailed description of denial reason"
                    rows="3"
                    style={{ width: "100%", resize: "vertical" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Denied Amount <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <input
                    type="number"
                    className="hp-search"
                    value={formData.denied_amount}
                    onChange={(e) => setFormData({ ...formData, denied_amount: e.target.value })}
                    step="0.01"
                    min="0"
                    required
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Appeal Filed
                  </label>
                  <select
                    className="hp-search"
                    value={formData.appeal_filed}
                    onChange={(e) => setFormData({ ...formData, appeal_filed: e.target.value })}
                    style={{ width: "100%", padding: "10px" }}
                  >
                    <option value="">Select...</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                {formData.appeal_filed === "yes" && (
                  <>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                        Appeal Status
                      </label>
                      <select
                        className="hp-search"
                        value={formData.appeal_status}
                        onChange={(e) => setFormData({ ...formData, appeal_status: e.target.value })}
                        style={{ width: "100%", padding: "10px" }}
                      >
                        <option value="">Select...</option>
                        {appealStatusOptions.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                        Appeal Resolution Date
                      </label>
                      <input
                        type="date"
                        className="hp-search"
                        value={formData.appeal_resolution_date}
                        onChange={(e) => setFormData({ ...formData, appeal_resolution_date: e.target.value })}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                        Final Outcome
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        value={formData.final_outcome}
                        onChange={(e) => setFormData({ ...formData, final_outcome: e.target.value })}
                        placeholder="Final outcome of appeal"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </>
                )}
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
                  {editingDenial ? "Update" : "Create"}
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
              Are you sure you want to delete this denial? This action cannot be undone.
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

export default DenialsPage;

