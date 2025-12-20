import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import Sidebar from "../components/Sidebar";
import "../HomePage.css";

const InsurersPage = () => {
  const [insurers, setInsurers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingInsurer, setEditingInsurer] = useState(null);
  const [formData, setFormData] = useState({});
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    code: "",
    name: "",
    payer_type: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Sorting
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50;

  const payerTypeOptions = ["Private", "Public"];

  const fetchInsurers = useCallback(async () => {
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
      if (filters.code) params.filters = { ...params.filters, code: filters.code };
      if (filters.name) params.filters = { ...params.filters, name: filters.name };
      if (filters.payer_type) params.filters = { ...params.filters, payer_type: filters.payer_type };
      
      const response = await api.getInsurersList(params);
      
      // Handle response format
      if (Array.isArray(response)) {
        setInsurers(response);
        setTotalCount(response.length);
        setTotalPages(Math.ceil(response.length / itemsPerPage));
      } else {
        setInsurers(response.data || []);
        setTotalCount(response.total || 0);
        setTotalPages(response.total_pages || 1);
      }
      
      setError(null);
    } catch (err) {
      console.error("Error fetching insurers:", err);
      setError(err.message || "Failed to load insurers");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, sortBy, sortDirection, filters, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters/search/sort changes
  }, [searchTerm, filters, sortBy, sortDirection]);

  useEffect(() => {
    fetchInsurers();
  }, [fetchInsurers]);

  const handleAdd = () => {
    setEditingInsurer(null);
    setFormData({
      code: "",
      name: "",
      payer_type: "Private",
      phone: "",
    });
    setShowModal(true);
  };

  const handleEdit = (insurer) => {
    setEditingInsurer(insurer);
    setFormData({
      code: insurer.code || "",
      name: insurer.name || "",
      payer_type: insurer.payer_type || "Private",
      phone: insurer.phone || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (insurerId) => {
    if (!window.confirm("Are you sure you want to delete this insurer? This will fail if the insurer is referenced by patients.")) {
      return;
    }
    try {
      await api.deleteInsurer(insurerId);
      await fetchInsurers();
    } catch (err) {
      alert(err.message || "Failed to delete insurer");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      
      // Validate required fields
      if (!submitData.code || !submitData.name || !submitData.payer_type) {
        alert("Please fill in all required fields: Code, Name, and Payer Type");
        return;
      }
      
      if (editingInsurer) {
        await api.updateInsurer(editingInsurer.insurer_id, submitData);
      } else {
        await api.createInsurer(submitData);
      }
      setShowModal(false);
      await fetchInsurers();
    } catch (err) {
      alert(err.message || "Failed to save insurer");
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      code: "",
      name: "",
      payer_type: "",
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const hasFilters = Object.values(filters).some(v => v) || searchTerm;

  return (
    <div className="hp-root">
      <Sidebar />

      {/* Main Content */}
      <div className="hp-main">
          <header className="hp-header">
            <div>
              <h1 className="hp-header-title">Insurers</h1>
              <p className="hp-header-subtitle">Manage insurance providers and payer information.</p>
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
                placeholder="Search insurers by code, name, or payer type..."
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
                      Code
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      placeholder="e.g. BCBS"
                      value={filters.code}
                      onChange={(e) => handleFilterChange("code", e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                      Name
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      placeholder="Company name"
                      value={filters.name}
                      onChange={(e) => handleFilterChange("name", e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                      Payer Type
                    </label>
                    <select
                      className="hp-search"
                      value={filters.payer_type}
                      onChange={(e) => handleFilterChange("payer_type", e.target.value)}
                      style={{ width: "100%", padding: "10px" }}
                    >
                      <option value="">All Types</option>
                      {payerTypeOptions.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
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
              Loading insurers...
            </div>
          ) : (
            <>
              <div className="hp-table-container">
                <div style={{ overflowX: "auto" }}>
                  <table className="hp-table">
                    <thead>
                      <tr>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("code")}>
                          CODE {sortBy === "code" && (sortDirection === "asc" ? "↑" : "↓")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("name")}>
                          NAME {sortBy === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("payer_type")}>
                          PAYER TYPE {sortBy === "payer_type" && (sortDirection === "asc" ? "↑" : "↓")}
                        </th>
                        <th>PHONE</th>
                        <th style={{ textAlign: "right" }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insurers.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ padding: "60px", textAlign: "center", color: "var(--hp-text-soft)" }}>
                            No insurers found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        insurers.map((insurer) => (
                          <tr key={insurer.insurer_id}>
                            <td>{insurer.code}</td>
                            <td>
                              <Link 
                                to={`/insurers/${insurer.insurer_id}`}
                                style={{ 
                                  color: "var(--hp-primary)", 
                                  textDecoration: "none"
                                }}
                              >
                                {insurer.name}
                              </Link>
                            </td>
                            <td>{insurer.payer_type}</td>
                            <td>{insurer.phone || "-"}</td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                onClick={() => handleEdit(insurer)}
                                className="hp-btn-edit"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(insurer.insurer_id)}
                                className="hp-btn-delete"
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
                      Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} insurers
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
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, }} onClick={() => setShowModal(false)}>
          <div
            style={{
              backgroundColor: "var(--hp-bg-card)",
              borderRadius: "var(--hp-radius-lg)",
              padding: "32px",
              maxWidth: "600px",
              width: "90%",
              border: "1px solid var(--hp-border)",
              boxShadow: "var(--hp-shadow-soft)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: "24px", color: "var(--hp-text-main)" }}>
              {editingInsurer ? "Edit Insurer" : "Add New Insurer"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "24px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Company Code * (Unique)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code || ""}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                    placeholder="e.g. MEDI-001"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Payer Type *
                  </label>
                  <select
                    required
                    value={formData.payer_type || "Private"}
                    onChange={(e) => setFormData({ ...formData, payer_type: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%", padding: "10px" }}
                  >
                    {payerTypeOptions.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                    placeholder="e.g. +1-555-0199"
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
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
                  {editingInsurer ? "Update" : "Save"}
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

export default InsurersPage;

