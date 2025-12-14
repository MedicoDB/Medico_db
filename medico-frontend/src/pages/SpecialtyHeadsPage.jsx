import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "../HomePage.css";

const DepartmentHeadsPage = () => {
  const _navigate = useNavigate();
  const [departmentHeads, setDepartmentHeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingHead, setEditingHead] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    head_id: "",
    department: "",
    head_provider_id: "",
    head_name: "",
    head_email: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Provider options for searchable select
  const [providerOptions, setProviderOptions] = useState([]);
  const [providerSearchTerm, setProviderSearchTerm] = useState("");
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  
  // Sorting
  const [sortBy, setSortBy] = useState("department");
  const [sortDirection, setSortDirection] = useState("asc");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50;

  const fetchDepartmentHeads = useCallback(async () => {
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
      
      const response = await api.getDepartmentHeadsList(params);
      
      setDepartmentHeads(response.data || []);
      setTotalCount(response.total || 0);
      setTotalPages(response.total_pages || 1);
      
      setError(null);
    } catch (err) {
      console.error("Error fetching department heads:", err);
      setError(err.message || "Failed to load department heads");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, sortBy, sortDirection, filters.head_id, filters.department, filters.head_provider_id, filters.head_name, filters.head_email]);

  // Reset to page 1 when filters/search/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortDirection, filters.head_id, filters.specialty, filters.head_provider_id, filters.head_name, filters.head_email]);

  // Fetch when dependencies change
  useEffect(() => {
    fetchDepartmentHeads();
  }, [fetchSpecialtyHeads]);

  // Fetch provider options - filter by department if provided
  const fetchProviderOptions = useCallback(async (search = "", department = null) => {
    try {
      // Fetch more providers to ensure we get all matches (increase limit to 1000)
      const options = await api.getProvidersOptions(search, 1000);
      // Filter providers by department if department is selected
      let filteredOptions = options;
      if (department) {
        filteredOptions = options.filter(provider => 
          provider.department && provider.department.toLowerCase() === department.toLowerCase()
        );
      }
      setProviderOptions(filteredOptions);
    } catch (err) {
      console.error("Error fetching providers:", err);
    }
  }, []);

  useEffect(() => {
    if (showModal && showProviderDropdown) {
      fetchProviderOptions(providerSearchTerm, formData.department);
    }
  }, [showModal, showProviderDropdown, providerSearchTerm, formData.specialty, fetchProviderOptions]);

  // Re-fetch provider options when department changes (only when adding, not editing)
  useEffect(() => {
    if (showModal && !editingHead && formData.department) {
      // Clear provider selection when department changes
      setProviderSearchTerm("");
      setFormData(prev => ({
        ...prev,
        head_provider_id: "",
        head_name: "",
        head_email: ""
      }));
      // Re-fetch filtered providers if dropdown is showing
      if (showProviderDropdown) {
        fetchProviderOptions("", formData.department);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.department, showModal, editingHead]);

  const handleAdd = () => {
    setEditingHead(null);
    setFormData({
      department: "",
      head_provider_id: "",
      head_name: "",
      head_email: "",
    });
    setProviderSearchTerm("");
    setShowProviderDropdown(false);
    setShowModal(true);
  };

  const handleEdit = async (head) => {
    setEditingHead(head);
    setFormData({
      department: head.department || "",
      head_provider_id: head.head_provider_id || "",
      head_name: head.head_name || "",
      head_email: head.head_email || "",
    });
    // Fetch providers filtered by the department for this head
    if (head.department) {
      // Fetch more providers to ensure we get all matches (increase limit to 1000)
      const options = await api.getProvidersOptions("", 1000);
      const filteredOptions = options.filter(provider => 
        provider.department && provider.department.toLowerCase() === head.department.toLowerCase()
      );
      setProviderOptions(filteredOptions);
      const currentProvider = filteredOptions.find(p => p.provider_id === head.head_provider_id);
      setProviderSearchTerm(currentProvider ? `${currentProvider.provider_id} - ${currentProvider.name}` : head.head_provider_id || "");
    } else {
      setProviderSearchTerm(head.head_provider_id || "");
    }
    setShowProviderDropdown(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let submitData;

      if (editingHead) {
        // When editing, only send head_provider_id (backend will auto-fill name and email)
        // Don't send specialty, head_name, or head_email
        submitData = {
          head_provider_id: formData.head_provider_id
        };
        await api.updateSpecialtyHead(editingHead.head_id, submitData);
      } else {
        // When adding, send all required fields
        submitData = { ...formData };
        await api.createSpecialtyHead(submitData);
      }
      setShowModal(false);
      fetchDepartmentHeads();
    } catch (err) {
      setError(err.message || "Failed to save specialty head");
    }
  };

  const handleDelete = async (head_id) => {
    try {
      await api.deleteSpecialtyHead(head_id);
      setDeleteConfirm(null);
      fetchDepartmentHeads();
    } catch (err) {
      setError(err.message || "Failed to delete specialty head");
      setDeleteConfirm(null);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      head_id: "",
      department: "",
      head_provider_id: "",
      head_name: "",
      head_email: "",
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
    <div style={{ minHeight: "100vh", backgroundColor: "var(--hp-bg-main)" }}>
      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <div style={{
          width: "260px",
          backgroundColor: "var(--hp-bg-card)",
          borderRight: "1px solid var(--hp-border)",
          minHeight: "100vh",
          padding: "24px 0",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto"
        }}>
          <div style={{ padding: "0 20px", marginBottom: "32px" }}>
            <h2 style={{ margin: 0, color: "var(--hp-primary)", fontSize: "24px", fontWeight: "700" }}>
              Medico
            </h2>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "0 12px" }}>
            <Link to="/" className="hp-nav-item">Dashboard</Link>
            <Link to="/patients" className="hp-nav-item">Patients</Link>
            <Link to="/encounters" className="hp-nav-item">Encounters</Link>
            <Link to="/insurers" className="hp-nav-item">Insurers</Link>
            <Link to="/claims" className="hp-nav-item">Claims</Link>
            <Link to="/denials" className="hp-nav-item">Denials</Link>
            <Link to="/procedures" className="hp-nav-item">Procedures</Link>
            <Link to="/medications" className="hp-nav-item">Medications</Link>
            <Link to="/diagnoses" className="hp-nav-item">Diagnoses</Link>
            <Link to="/providers" className="hp-nav-item">Providers</Link>
            <Link to="/department-heads" className="hp-nav-item hp-nav-item--active">Department Heads</Link>
          </nav>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          <header style={{
            backgroundColor: "var(--hp-bg-card)",
            borderBottom: "1px solid var(--hp-border)",
            padding: "20px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "600", color: "var(--hp-text-main)" }}>
              Department Heads
            </h1>
            <button
              className="hp-primary-btn"
              onClick={handleAdd}
              style={{ padding: "12px 24px" }}
            >
              + Add New Department Head
            </button>
          </header>

          <div style={{ padding: "24px" }}>
            {error && (
              <div style={{ padding: "12px", marginBottom: "16px", backgroundColor: "rgba(220, 53, 69, 0.1)", color: "#dc3545", borderRadius: "8px", border: "1px solid rgba(220, 53, 69, 0.3)" }}>
                {error}
              </div>
            )}

            {/* Search Bar */}
            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                className="hp-search"
                placeholder="Search department heads by ID, department, provider ID, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", maxWidth: "600px" }}
              />
            </div>

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
                        Head ID
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. 1"
                        value={filters.head_id}
                        onChange={(e) => handleFilterChange("head_id", e.target.value)}
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
                        Provider ID
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. PROV000001"
                        value={filters.head_provider_id}
                        onChange={(e) => handleFilterChange("head_provider_id", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Head Name
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. Dr. Smith"
                        value={filters.head_name}
                        onChange={(e) => handleFilterChange("head_name", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Email
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. head@hospital.com"
                        value={filters.head_email}
                        onChange={(e) => handleFilterChange("head_email", e.target.value)}
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
                Loading department heads...
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
                          }} onClick={() => handleSort("head_id")}>
                            Head ID {sortBy === "head_id" && (sortDirection === "asc" ? "↑" : "↓")}
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
                          }} onClick={() => handleSort("head_provider_id")}>
                            Provider ID {sortBy === "head_provider_id" && (sortDirection === "asc" ? "↑" : "↓")}
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
                          }} onClick={() => handleSort("head_name")}>
                            Head Name {sortBy === "head_name" && (sortDirection === "asc" ? "↑" : "↓")}
                          </th>
                          <th style={{ padding: "16px", textAlign: "left", color: "var(--hp-text-main)", fontWeight: "600", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Email
                          </th>
                          <th style={{ padding: "16px", textAlign: "center", color: "var(--hp-text-main)", fontWeight: "600", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {departmentHeads.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ padding: "40px", textAlign: "center", color: "var(--hp-text-soft)" }}>
                              No department heads found
                            </td>
                          </tr>
                        ) : (
                          departmentHeads.map((head) => (
                            <tr key={head.head_id} style={{ borderTop: "1px solid var(--hp-border)" }}>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                <Link to={`/department-heads/${head.head_id}`} style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}>
                                  {head.head_id}
                                </Link>
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                {head.department}
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                {head.head_provider_id}
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                {head.head_name}
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                {head.head_email || "-"}
                              </td>
                              <td style={{ padding: "16px", textAlign: "center" }}>
                                <button
                                  className="hp-secondary-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(head);
                                  }}
                                  style={{ padding: "6px 12px", marginRight: "8px", fontSize: "12px" }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="hp-danger-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm(head.head_id);
                                  }}
                                  style={{ padding: "6px 12px", fontSize: "12px" }}
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
        </div>
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
              {editingHead ? "Edit Department Head" : "Add New Department Head"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Department <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="hp-search"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required={!editingHead}
                    disabled={editingHead !== null}
                    style={{ width: "100%", opacity: editingHead ? 0.6 : 1, cursor: editingHead ? "not-allowed" : "text" }}
                  />
                  {editingHead && (
                    <small style={{ color: "var(--hp-text-soft)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                      Department cannot be changed. Each department must have a chief.
                    </small>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Provider ID <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="hp-search"
                      placeholder="Search and select provider..."
                      value={providerSearchTerm}
                      onChange={(e) => {
                        setProviderSearchTerm(e.target.value);
                        setShowProviderDropdown(true);
                        fetchProviderOptions(e.target.value, formData.specialty);
                      }}
                      onFocus={() => {
                        setShowProviderDropdown(true);
                        fetchProviderOptions(providerSearchTerm, formData.department);
                      }}
                      disabled={!editingHead && !formData.department}
                      onBlur={() => {
                        // Delay to allow click event on dropdown items
                        setTimeout(() => setShowProviderDropdown(false), 200);
                      }}
                    required
                      style={{ width: "100%", opacity: (!editingHead && !formData.department) ? 0.6 : 1 }}
                  />
                    {showProviderDropdown && !formData.department && !editingHead && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "var(--hp-bg-card)",
                        border: "1px solid var(--hp-border)",
                        borderRadius: "var(--hp-radius-md)",
                        padding: "12px",
                        zIndex: 100,
                        marginTop: "4px",
                        boxShadow: "var(--hp-shadow-md)",
                        color: "var(--hp-text-soft)",
                        fontSize: "14px"
                      }}>
                        Please select a department first.
                      </div>
                    )}
                    {showProviderDropdown && formData.department && providerOptions.length === 0 && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "var(--hp-bg-card)",
                        border: "1px solid var(--hp-border)",
                        borderRadius: "var(--hp-radius-md)",
                        padding: "12px",
                        zIndex: 100,
                        marginTop: "4px",
                        boxShadow: "var(--hp-shadow-md)",
                        color: "var(--hp-text-soft)",
                        fontSize: "14px"
                      }}>
                        No providers found with department "{formData.department}".
                      </div>
                    )}
                    {showProviderDropdown && providerOptions.length > 0 && (
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
                        {providerOptions.map((provider) => (
                          <div
                            key={provider.provider_id}
                            style={{
                              padding: "12px",
                              cursor: "pointer",
                              borderBottom: "1px solid var(--hp-border)",
                              color: "var(--hp-text-main)"
                            }}
                            onClick={() => {
                              setProviderSearchTerm(`${provider.provider_id} - ${provider.name}`);
                              setShowProviderDropdown(false);
                              // Auto-fill name and email (will be updated by backend, but show for user feedback)
                              if (editingHead) {
                                // When editing, only update provider_id (backend will auto-fill name/email)
                                setFormData({ ...formData, head_provider_id: provider.provider_id });
                              } else {
                                // When adding, auto-fill all fields
                                setFormData({
                                  ...formData,
                                  head_provider_id: provider.provider_id,
                                  head_name: provider.name || "",
                                  head_email: provider.email || ""
                                });
                              }
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(148, 163, 184, 0.1)"}
                            onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                          >
                            <div style={{ fontWeight: "500" }}>{provider.provider_id} - {provider.name}</div>
                            <div style={{ fontSize: "12px", color: "var(--hp-text-soft)" }}>
                              {provider.department} - {provider.specialty}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {editingHead ? (
                    <small style={{ color: "var(--hp-text-soft)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                      Changing provider ID will automatically update name and email. Only providers with department "{formData.department}" can be selected.
                    </small>
                  ) : (
                    <small style={{ color: "var(--hp-text-soft)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                      {formData.department 
                        ? `Only providers with department "${formData.department}" can be selected.`
                        : "Please select a department first, then choose a provider with matching department."}
                    </small>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Head Name <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="hp-search"
                    value={formData.head_name}
                    onChange={(e) => setFormData({ ...formData, head_name: e.target.value })}
                    required={!editingHead}
                    disabled={editingHead !== null}
                    style={{ width: "100%", opacity: editingHead ? 0.6 : 1, cursor: editingHead ? "not-allowed" : "text" }}
                  />
                  {editingHead && (
                    <small style={{ color: "var(--hp-text-soft)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                      Name is automatically filled from provider.
                    </small>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    className="hp-search"
                    value={formData.head_email || ""}
                    onChange={(e) => setFormData({ ...formData, head_email: e.target.value })}
                    disabled={editingHead !== null}
                    style={{ width: "100%", opacity: editingHead ? 0.6 : 1, cursor: editingHead ? "not-allowed" : "text" }}
                  />
                  {editingHead && (
                    <small style={{ color: "var(--hp-text-soft)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                      Email is automatically filled from provider.
                    </small>
                  )}
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
                  {editingHead ? "Update" : "Create"}
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
              Are you sure you want to delete this department head? This action cannot be undone.
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
  );
};

export default DepartmentHeadsPage;

