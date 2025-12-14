import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import "../HomePage.css";

const MedicationsPage = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    medication_id: "",
    encounter_id: "",
    drug_name: "",
    prescriber_id: "",
    prescribed_date_from: "",
    prescribed_date_to: "",
    cost_min: "",
    cost_max: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Sorting
  const [sortBy, setSortBy] = useState("prescribed_date");
  const [sortDirection, setSortDirection] = useState("desc");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50;

  // Encounter and prescriber options for searchable selects
  const [encounterOptions, setEncounterOptions] = useState([]);
  const [encounterSearchTerm, setEncounterSearchTerm] = useState("");
  const [showEncounterDropdown, setShowEncounterDropdown] = useState(false);
  const [prescriberOptions, setPrescriberOptions] = useState([]);
  const [prescriberSearchTerm, setPrescriberSearchTerm] = useState("");
  const [showPrescriberDropdown, setShowPrescriberDropdown] = useState(false);

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

  const fetchMedications = useCallback(async () => {
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
      
      const response = await api.getMedicationsList(params);
      
      setMedications(response.data || []);
      setTotalCount(response.total || 0);
      setTotalPages(response.total_pages || 1);
      
      setError(null);
    } catch (err) {
      console.error("Error fetching medications:", err);
      setError(err.message || "Failed to load medications");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, sortBy, sortDirection, filters.medication_id, filters.encounter_id, filters.drug_name, filters.prescriber_id, filters.prescribed_date_from, filters.prescribed_date_to, filters.cost_min, filters.cost_max]);

  // Reset to page 1 when filters/search/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortDirection, filters.medication_id, filters.encounter_id, filters.drug_name, filters.prescriber_id, filters.prescribed_date_from, filters.prescribed_date_to, filters.cost_min, filters.cost_max]);

  // Fetch when dependencies change
  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  // Fetch encounter options
  const fetchEncounterOptions = useCallback(async (search = "") => {
    try {
      const options = await api.getMedicationsEncounterOptions(search, 50);
      setEncounterOptions(options);
    } catch (err) {
      console.error("Error fetching encounters:", err);
    }
  }, []);

  // Fetch prescriber options
  const fetchPrescriberOptions = useCallback(async (search = "") => {
    try {
      const options = await api.getPrescribersOptions(search, 50);
      setPrescriberOptions(options);
    } catch (err) {
      console.error("Error fetching prescribers:", err);
    }
  }, []);

  useEffect(() => {
    if (showModal && showEncounterDropdown) {
      fetchEncounterOptions(encounterSearchTerm);
    }
  }, [showModal, showEncounterDropdown, encounterSearchTerm, fetchEncounterOptions]);

  useEffect(() => {
    if (showModal && showPrescriberDropdown) {
      fetchPrescriberOptions(prescriberSearchTerm);
    }
  }, [showModal, showPrescriberDropdown, prescriberSearchTerm, fetchPrescriberOptions]);

  const handleAdd = () => {
    setEditingMedication(null);
    setFormData({
      encounter_id: "",
      drug_name: "",
      dosage: "",
      route: "",
      frequency: "",
      duration: "",
      prescribed_date: new Date().toISOString().slice(0, 10),
      prescriber_id: "",
      cost: 0,
    });
    setEncounterSearchTerm("");
    setPrescriberSearchTerm("");
    setShowEncounterDropdown(false);
    setShowPrescriberDropdown(false);
    setShowModal(true);
  };

  const handleEdit = (medication) => {
    setEditingMedication(medication);
    const normalizedDate = normalizeDate(medication.prescribed_date);
    setFormData({
      encounter_id: medication.encounter_id || "",
      drug_name: medication.drug_name || "",
      dosage: medication.dosage || "",
      route: medication.route || "",
      frequency: medication.frequency || "",
      duration: medication.duration || "",
      prescribed_date: normalizedDate || "",
      prescriber_id: medication.prescriber_id || "",
      cost: medication.cost || 0,
    });
    const currentEncounter = encounterOptions.find(e => e.encounter_id === medication.encounter_id);
    setEncounterSearchTerm(currentEncounter ? `${currentEncounter.encounter_id} - ${currentEncounter.patient_first_name || ""} ${currentEncounter.patient_last_name || ""}` : "");
    const currentPrescriber = prescriberOptions.find(p => p.provider_id === medication.prescriber_id);
    setPrescriberSearchTerm(currentPrescriber ? `${currentPrescriber.provider_id} - ${currentPrescriber.name}` : "");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      submitData.cost = parseFloat(submitData.cost) || 0;

      // When editing, if prescribed_date is not provided, keep the original value
      if (editingMedication && !submitData.prescribed_date) {
        const originalDate = normalizeDate(editingMedication.prescribed_date);
        if (originalDate) {
          submitData.prescribed_date = originalDate;
        }
      }

      if (editingMedication) {
        await api.updateMedication(editingMedication.medication_id, submitData);
      } else {
        await api.createMedication(submitData);
      }
      setShowModal(false);
      fetchMedications();
    } catch (err) {
      setError(err.message || "Failed to save medication");
    }
  };

  const handleDelete = async (medication_id) => {
    try {
      await api.deleteMedication(medication_id);
      setDeleteConfirm(null);
      fetchMedications();
    } catch (err) {
      setError(err.message || "Failed to delete medication");
      setDeleteConfirm(null);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      medication_id: "",
      encounter_id: "",
      drug_name: "",
      prescriber_id: "",
      prescribed_date_from: "",
      prescribed_date_to: "",
      cost_min: "",
      cost_max: "",
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
            <Link to="/lab-tests" className="hp-nav-item">Lab Tests</Link>
            <Link to="/medications" className="hp-nav-item hp-nav-item--active">Medications</Link>
            <Link to="/diagnoses" className="hp-nav-item">Diagnoses</Link>
            <Link to="/providers" className="hp-nav-item">Providers</Link>
            <Link to="/department-heads" className="hp-nav-item">Department Heads</Link>
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
              Medications
            </h1>
            <button
              className="hp-primary-btn"
              onClick={handleAdd}
              style={{ padding: "12px 24px" }}
            >
              + Add New Medication
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
                placeholder="Search medications by ID, drug name, encounter ID, or patient name..."
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
                        Medication ID
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. MED000001"
                        value={filters.medication_id}
                        onChange={(e) => handleFilterChange("medication_id", e.target.value)}
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
                        Drug Name
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. Aspirin"
                        value={filters.drug_name}
                        onChange={(e) => handleFilterChange("drug_name", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Prescriber ID
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. PROV000001"
                        value={filters.prescriber_id}
                        onChange={(e) => handleFilterChange("prescriber_id", e.target.value)}
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
                        value={filters.cost_min}
                        onChange={(e) => handleFilterChange("cost_min", e.target.value)}
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
                        value={filters.cost_max}
                        onChange={(e) => handleFilterChange("cost_max", e.target.value)}
                        style={{ width: "100%" }}
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Prescribed Date From
                      </label>
                      <input
                        type="date"
                        className="hp-search"
                        value={filters.prescribed_date_from}
                        onChange={(e) => handleFilterChange("prescribed_date_from", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Prescribed Date To
                      </label>
                      <input
                        type="date"
                        className="hp-search"
                        value={filters.prescribed_date_to}
                        onChange={(e) => handleFilterChange("prescribed_date_to", e.target.value)}
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
                Loading medications...
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
                          }} onClick={() => handleSort("medication_id")}>
                            Medication ID {sortBy === "medication_id" && (sortDirection === "asc" ? "↑" : "↓")}
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
                          }} onClick={() => handleSort("drug_name")}>
                            Drug Name {sortBy === "drug_name" && (sortDirection === "asc" ? "↑" : "↓")}
                          </th>
                          <th style={{ padding: "16px", textAlign: "left", color: "var(--hp-text-main)", fontWeight: "600", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Prescriber
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
                          }} onClick={() => handleSort("prescribed_date")}>
                            Prescribed Date {sortBy === "prescribed_date" && (sortDirection === "asc" ? "↑" : "↓")}
                          </th>
                          <th style={{ 
                            padding: "16px", 
                            textAlign: "right", 
                            cursor: "pointer",
                            color: "var(--hp-text-main)",
                            fontWeight: "600",
                            fontSize: "13px",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em"
                          }} onClick={() => handleSort("cost")}>
                            Cost {sortBy === "cost" && (sortDirection === "asc" ? "↑" : "↓")}
                          </th>
                          <th style={{ padding: "16px", textAlign: "center", color: "var(--hp-text-main)", fontWeight: "600", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {medications.length === 0 ? (
                          <tr>
                            <td colSpan="8" style={{ padding: "40px", textAlign: "center", color: "var(--hp-text-soft)" }}>
                              No medications found
                            </td>
                          </tr>
                        ) : (
                          medications.map((medication) => (
                            <tr key={medication.medication_id} style={{ borderTop: "1px solid var(--hp-border)" }}>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                <Link to={`/medications/${medication.medication_id}`} style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}>
                                  {medication.medication_id}
                                </Link>
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                <Link to={`/encounters/${medication.encounter_id}`} style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}>
                                  {medication.encounter_id}
                                </Link>
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                <Link to={`/patients/${medication.patient_id}`} style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}>
                                  {medication.first_name} {medication.last_name}
                                </Link>
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                {medication.drug_name}
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                {medication.prescriber_id ? (
                                  <Link to={`/providers/${medication.prescriber_id}`} style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}>
                                    {medication.prescriber_name || "-"}
                                  </Link>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                {medication.prescribed_date ? new Date(medication.prescribed_date).toLocaleDateString() : "-"}
                              </td>
                              <td style={{ padding: "16px", textAlign: "right", color: "var(--hp-text-main)", fontWeight: "500" }}>
                                ${(parseFloat(medication.cost) || 0).toFixed(2)}
                              </td>
                              <td style={{ padding: "16px", textAlign: "center" }}>
                                <button
                                  className="hp-secondary-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(medication);
                                  }}
                                  style={{ padding: "6px 12px", marginRight: "8px", fontSize: "12px" }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="hp-danger-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm(medication.medication_id);
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
              {editingMedication ? "Edit Medication" : "Add New Medication"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Encounter ID <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    {editingMedication ? (
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
                                    newFormData.prescriber_id = encounter.provider_id;
                                    setPrescriberSearchTerm(`${encounter.provider_id} - ${encounter.provider_name || ""}`);
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
                    Drug Name <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="hp-search"
                    value={formData.drug_name}
                    onChange={(e) => setFormData({ ...formData, drug_name: e.target.value })}
                    required
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Dosage
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                      placeholder="e.g. 500mg"
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Route
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      value={formData.route}
                      onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                      placeholder="e.g. Oral, IV"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Frequency
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      placeholder="e.g. Twice daily"
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Duration
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="e.g. 7 days"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Prescriber
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      className="hp-search"
                      placeholder="Prescriber will be selected automatically..."
                      value={prescriberSearchTerm}
                      readOnly
                      style={{ width: "100%", backgroundColor: "var(--hp-bg-surface)" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Prescribed Date {!editingMedication && <span style={{ color: "#dc3545" }}>*</span>}
                    </label>
                    <input
                      type="date"
                      className="hp-search"
                      value={formData.prescribed_date || ""}
                      onChange={(e) => setFormData({ ...formData, prescribed_date: e.target.value })}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Cost
                    </label>
                    <input
                      type="number"
                      className="hp-search"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
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
                  {editingMedication ? "Update" : "Create"}
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
              Are you sure you want to delete this medication? This action cannot be undone.
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

export default MedicationsPage;

