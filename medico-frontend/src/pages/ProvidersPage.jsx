import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import Sidebar from "../components/Sidebar";
import "../HomePage.css";

const ProvidersPage = () => {
  const _navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    provider_id: "",
    name: "",
    department: "",
    specialty: "",
    npi: "",
    inhouse: "",
    head_id: "",
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

  // Department heads options for searchable select
  const [departmentHeadOptions, setDepartmentHeadOptions] = useState([]);
  const [departmentHeadSearchTerm, setDepartmentHeadSearchTerm] = useState("");
  const [showDepartmentHeadDropdown, setShowDepartmentHeadDropdown] = useState(false);

  const fetchProviders = useCallback(async () => {
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
      
      const response = await api.getProvidersList(params);
      
      setProviders(response.data || []);
      setTotalCount(response.total || 0);
      setTotalPages(response.total_pages || 1);
      
      setError(null);
    } catch (err) {
      console.error("Error fetching providers:", err);
      setError(err.message || "Failed to load providers");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, sortBy, sortDirection, filters.provider_id, filters.name, filters.department, filters.specialty, filters.npi, filters.inhouse, filters.head_id]);

  // Reset to page 1 when filters/search/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortDirection, filters.provider_id, filters.name, filters.department, filters.specialty, filters.npi, filters.inhouse, filters.head_id]);

  // Fetch when dependencies change
  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Fetch department heads options
  const fetchDepartmentHeadOptions = useCallback(async (search = "") => {
    try {
      const options = await api.getProvidersDepartmentHeadsOptions(search, 50);
      setDepartmentHeadOptions(options);
    } catch (err) {
      console.error("Error fetching department heads:", err);
    }
  }, []);

  useEffect(() => {
    if (showModal && showDepartmentHeadDropdown) {
      fetchDepartmentHeadOptions(departmentHeadSearchTerm);
    }
  }, [showModal, showDepartmentHeadDropdown, departmentHeadSearchTerm, fetchDepartmentHeadOptions]);

  const handleAdd = () => {
    setEditingProvider(null);
    setFormData({
      name: "",
      department: "",
      specialty: "",
      npi: "",
      inhouse: "1",
      location: "",
      years_experience: "",
      contact_info: "",
      email: "",
      head_id: "",
    });
    setDepartmentHeadSearchTerm("");
    setShowDepartmentHeadDropdown(false);
    setShowModal(true);
  };

  const handleEdit = async (provider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name || "",
      department: provider.department || "",
      specialty: provider.specialty || "",
      npi: provider.npi || "",
      inhouse: provider.inhouse ? "1" : "0",
      location: provider.location || "",
      years_experience: provider.years_experience || "",
      contact_info: provider.contact_info || "",
      email: provider.email || "",
      head_id: provider.head_id || "",
    });
    // Fetch department heads to get the current head info
    try {
      const options = await api.getProvidersDepartmentHeadsOptions("", 1000);
      setDepartmentHeadOptions(options);
      const currentHead = options.find(h => h.head_id === provider.head_id);
      if (currentHead) {
        setDepartmentHeadSearchTerm(`${currentHead.head_id} - ${currentHead.head_name || ""} (${currentHead.department || ""})`);
      } else {
        setDepartmentHeadSearchTerm("");
      }
    } catch (err) {
      console.error("Error fetching department heads:", err);
      setDepartmentHeadSearchTerm("");
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      submitData.inhouse = submitData.inhouse === "1";
      if (submitData.years_experience) {
        submitData.years_experience = parseInt(submitData.years_experience);
      }
      if (submitData.head_id) {
        submitData.head_id = parseInt(submitData.head_id);
      }

      if (editingProvider) {
        await api.updateProvider(editingProvider.provider_id, submitData);
      } else {
        await api.createProvider(submitData);
      }
      setShowModal(false);
      fetchProviders();
    } catch (err) {
      setError(err.message || "Failed to save provider");
    }
  };

  const handleDelete = async (provider_id) => {
    try {
      await api.deleteProvider(provider_id);
      setDeleteConfirm(null);
      fetchProviders();
    } catch (err) {
      setError(err.message || "Failed to delete provider");
      setDeleteConfirm(null);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      provider_id: "",
      name: "",
      department: "",
      specialty: "",
      npi: "",
      inhouse: "",
      head_id: "",
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
              <h1 className="hp-header-title">Providers</h1>
              <p className="hp-header-subtitle">Manage healthcare providers, specialties and departments.</p>
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
                placeholder="Search providers by ID, name, department, specialty, NPI, or department head..."
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
                        Name
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. Dr. Smith"
                        value={filters.name}
                        onChange={(e) => handleFilterChange("name", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Department
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. Cardiology"
                        value={filters.department}
                        onChange={(e) => handleFilterChange("department", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Specialty
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. Cardiologist"
                        value={filters.specialty}
                        onChange={(e) => handleFilterChange("specialty", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        NPI
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. 1234567890"
                        value={filters.npi}
                        onChange={(e) => handleFilterChange("npi", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        In-House
                      </label>
                      <select
                        className="hp-search"
                        value={filters.inhouse}
                        onChange={(e) => handleFilterChange("inhouse", e.target.value)}
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
                Loading providers...
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
                          }} onClick={() => handleSort("provider_id")}>
                            Provider ID {sortBy === "provider_id" && (sortDirection === "asc" ? "↑" : "↓")}
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
                          }} onClick={() => handleSort("name")}>
                            Name {sortBy === "name" && (sortDirection === "asc" ? "↑" : "↓")}
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
                          }} onClick={() => handleSort("department")}>
                            Department {sortBy === "department" && (sortDirection === "asc" ? "↑" : "↓")}
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
                          }} onClick={() => handleSort("specialty")}>
                            Specialty {sortBy === "specialty" && (sortDirection === "asc" ? "↑" : "↓")}
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
                          }} onClick={() => handleSort("npi")}>
                            NPI {sortBy === "npi" && (sortDirection === "asc" ? "↑" : "↓")}
                          </th>
                          <th style={{ padding: "16px", textAlign: "center", color: "var(--hp-text-main)", fontWeight: "600", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            In-House
                          </th>
                          <th style={{ padding: "16px", textAlign: "center", color: "var(--hp-text-main)", fontWeight: "600", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {providers.length === 0 ? (
                          <tr>
                            <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: "var(--hp-text-soft)" }}>
                              No providers found
                            </td>
                          </tr>
                        ) : (
                          providers.map((provider) => (
                            <tr key={provider.provider_id} style={{ borderTop: "1px solid var(--hp-border)" }}>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                <Link to={`/providers/${provider.provider_id}`} style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}>
                                  {provider.provider_id}
                                </Link>
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                {provider.name}
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                {provider.department}
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                {provider.specialty}
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                {provider.npi}
                              </td>
                              <td style={{ padding: "16px", textAlign: "center", color: "var(--hp-text-main)" }}>
                                {provider.inhouse ? "Yes" : "No"}
                              </td>
                              <td style={{ padding: "16px", textAlign: "center" }}>
                                <button
                                  className="hp-btn-edit"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(provider);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="hp-btn-delete"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm(provider.provider_id);
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
            maxWidth: "700px",
            width: "90%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "var(--hp-shadow-lg)"
          }}>
            <h2 style={{ marginTop: 0, marginBottom: "24px", color: "var(--hp-text-main)" }}>
              {editingProvider ? "Edit Provider" : "Add New Provider"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Name <span style={{ color: "#dc3545" }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Department <span style={{ color: "#dc3545" }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      required={!editingProvider}
                      disabled={editingProvider !== null}
                      style={{ width: "100%", opacity: editingProvider ? 0.6 : 1, cursor: editingProvider ? "not-allowed" : "text" }}
                    />
                    {editingProvider && (
                      <small style={{ color: "var(--hp-text-soft)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                        Department cannot be changed.
                      </small>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Specialty <span style={{ color: "#dc3545" }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      required={!editingProvider}
                      disabled={editingProvider !== null}
                      style={{ width: "100%", opacity: editingProvider ? 0.6 : 1, cursor: editingProvider ? "not-allowed" : "text" }}
                    />
                    {editingProvider && (
                      <small style={{ color: "var(--hp-text-soft)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                        Specialty cannot be changed.
                      </small>
                    )}
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      NPI <span style={{ color: "#dc3545" }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      value={formData.npi}
                      onChange={(e) => setFormData({ ...formData, npi: e.target.value })}
                      required={!editingProvider}
                      disabled={editingProvider !== null}
                      style={{ width: "100%", opacity: editingProvider ? 0.6 : 1, cursor: editingProvider ? "not-allowed" : "text" }}
                    />
                    {editingProvider && (
                      <small style={{ color: "var(--hp-text-soft)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                        NPI cannot be changed.
                      </small>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      In-House
                    </label>
                    <select
                      className="hp-search"
                      value={formData.inhouse}
                      onChange={(e) => setFormData({ ...formData, inhouse: e.target.value })}
                      style={{ width: "100%" }}
                    >
                      <option value="1">Yes</option>
                      <option value="0">No</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Location
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      className="hp-search"
                      value={formData.years_experience}
                      onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                      min="0"
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Contact Info
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      value={formData.contact_info}
                      onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    className="hp-search"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Department Head
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      className="hp-search"
                      placeholder={editingProvider ? "" : "Search and select department head..."}
                      value={departmentHeadSearchTerm}
                      onChange={(e) => {
                        if (!editingProvider) {
                          setDepartmentHeadSearchTerm(e.target.value);
                          setShowDepartmentHeadDropdown(true);
                          fetchDepartmentHeadOptions(e.target.value);
                        }
                      }}
                      onFocus={() => {
                        if (!editingProvider) {
                          setShowDepartmentHeadDropdown(true);
                          if (!departmentHeadOptions.length) fetchDepartmentHeadOptions();
                        }
                      }}
                      disabled={editingProvider !== null}
                      style={{ width: "100%", opacity: editingProvider ? 0.6 : 1, cursor: editingProvider ? "not-allowed" : "text" }}
                    />
                    {!editingProvider && showDepartmentHeadDropdown && departmentHeadOptions.length > 0 && (
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
                        {departmentHeadOptions.map((head) => (
                          <div
                            key={head.head_id}
                            style={{
                              padding: "12px",
                              cursor: "pointer",
                              borderBottom: "1px solid var(--hp-border)",
                              color: "var(--hp-text-main)"
                            }}
                            onClick={() => {
                              setFormData({ ...formData, head_id: head.head_id });
                              setDepartmentHeadSearchTerm(`${head.head_id} - ${head.head_name || ""} (${head.department || ""})`);
                              setShowDepartmentHeadDropdown(false);
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(148, 163, 184, 0.1)"}
                            onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                          >
                            <div style={{ fontWeight: "500" }}>{head.head_id} - {head.head_name}</div>
                            <div style={{ fontSize: "12px", color: "var(--hp-text-soft)" }}>
                              {head.specialty}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                  {editingProvider ? "Update" : "Create"}
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
              Are you sure you want to delete this provider? This action cannot be undone.
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

export default ProvidersPage;

