import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import "../HomePage.css";

const LabTestsPage = () => {
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingLabTest, setEditingLabTest] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    test_id: "",
    encounter_id: "",
    test_code: "",
    lab_id: "",
    test_date_from: "",
    test_date_to: "",
    status: "",
    specimen_type: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Sorting
  const [sortBy, setSortBy] = useState("test_date");
  const [sortDirection, setSortDirection] = useState("desc");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50;

  // Encounter and test code options for searchable selects
  const [encounterOptions, setEncounterOptions] = useState([]);
  const [encounterSearchTerm, setEncounterSearchTerm] = useState("");
  const [showEncounterDropdown, setShowEncounterDropdown] = useState(false);
  const [testCodeOptions, setTestCodeOptions] = useState([]);
  const [showTestCodeDropdown, setShowTestCodeDropdown] = useState(false);
  const [testCodeSearchTerm, setTestCodeSearchTerm] = useState("");
  const [labIdOptions, setLabIdOptions] = useState([]);
  const [labIdSearchTerm, setLabIdSearchTerm] = useState("");
  const [showLabIdDropdown, setShowLabIdDropdown] = useState(false);
  const [specimenTypeOptions, setSpecimenTypeOptions] = useState([]);
  const [specimenTypeSearchTerm, setSpecimenTypeSearchTerm] = useState("");
  const [showSpecimenTypeDropdown, setShowSpecimenTypeDropdown] = useState(false);
  const [unitsOptions, setUnitsOptions] = useState([]);
  const [unitsSearchTerm, setUnitsSearchTerm] = useState("");
  const [showUnitsDropdown, setShowUnitsDropdown] = useState(false);
  const [normalRangeOptions, setNormalRangeOptions] = useState([]);
  const [normalRangeSearchTerm, setNormalRangeSearchTerm] = useState("");
  const [showNormalRangeDropdown, setShowNormalRangeDropdown] = useState(false);

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

  const fetchLabTests = useCallback(async () => {
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
      
      const response = await api.getLabTestsList(params);
      
      setLabTests(response.data || []);
      setTotalCount(response.total || 0);
      setTotalPages(response.total_pages || 1);
      
      setError(null);
    } catch (err) {
      console.error("Error fetching lab tests:", err);
      setError(err.message || "Failed to load lab tests");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, sortBy, sortDirection, filters.test_id, filters.encounter_id, filters.test_code, filters.lab_id, filters.test_date_from, filters.test_date_to, filters.status, filters.specimen_type]);

  // Reset to page 1 when filters/search/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortDirection, filters.test_id, filters.encounter_id, filters.test_code, filters.lab_id, filters.test_date_from, filters.test_date_to, filters.status, filters.specimen_type]);

  // Fetch when dependencies change
  useEffect(() => {
    fetchLabTests();
  }, [fetchLabTests]);

  // Fetch encounter options
  const fetchEncounterOptions = useCallback(async (search = "") => {
    try {
      const options = await api.getLabTestsEncounterOptions(search, 50);
      setEncounterOptions(options);
    } catch (err) {
      console.error("Error fetching encounters:", err);
    }
  }, []);

  // Fetch test codes
  const fetchTestCodes = useCallback(async () => {
    try {
      const codes = await api.getTestCodes();
      setTestCodeOptions(codes);
    } catch (err) {
      console.error("Error fetching test codes:", err);
    }
  }, []);

  const fetchLabIds = useCallback(async () => {
    try {
      const labIds = await api.getLabIds();
      setLabIdOptions(labIds);
    } catch (err) {
      console.error("Error fetching lab IDs:", err);
    }
  }, []);

  const fetchSpecimenTypes = useCallback(async () => {
    try {
      const specimenTypes = await api.getSpecimenTypes();
      setSpecimenTypeOptions(specimenTypes);
    } catch (err) {
      console.error("Error fetching specimen types:", err);
    }
  }, []);

  const fetchUnits = useCallback(async () => {
    try {
      const units = await api.getUnits();
      setUnitsOptions(units);
    } catch (err) {
      console.error("Error fetching units:", err);
    }
  }, []);

  const fetchNormalRanges = useCallback(async () => {
    try {
      const normalRanges = await api.getNormalRanges();
      setNormalRangeOptions(normalRanges);
    } catch (err) {
      console.error("Error fetching normal ranges:", err);
    }
  }, []);

  useEffect(() => {
    if (showModal) {
      fetchTestCodes();
      fetchLabIds();
      fetchSpecimenTypes();
      fetchUnits();
      fetchNormalRanges();
    }
  }, [showModal, fetchTestCodes, fetchLabIds, fetchSpecimenTypes, fetchUnits, fetchNormalRanges]);

  useEffect(() => {
    if (showModal && showEncounterDropdown) {
      fetchEncounterOptions(encounterSearchTerm);
    }
  }, [showModal, showEncounterDropdown, encounterSearchTerm, fetchEncounterOptions]);

  const handleAdd = () => {
    setEditingLabTest(null);
    setFormData({
      encounter_id: "",
      test_code: "",
      test_name: "",
      lab_id: "",
      specimen_type: "",
      test_result: "",
      units: "N/A",
      normal_range: "N/A",
      test_date: new Date().toISOString().slice(0, 10),
      status: "Preliminary",
    });
    setEncounterSearchTerm("");
    setTestCodeSearchTerm("");
    setLabIdSearchTerm("");
    setSpecimenTypeSearchTerm("");
    setUnitsSearchTerm("N/A");
    setNormalRangeSearchTerm("N/A");
    setShowEncounterDropdown(false);
    setShowTestCodeDropdown(false);
    setShowLabIdDropdown(false);
    setShowSpecimenTypeDropdown(false);
    setShowUnitsDropdown(false);
    setShowNormalRangeDropdown(false);
    setShowModal(true);
  };

  const handleEdit = (labTest) => {
    setEditingLabTest(labTest);
    const normalizedDate = normalizeDate(labTest.test_date);
    setFormData({
      encounter_id: labTest.encounter_id || "",
      test_code: labTest.test_code || "",
      test_name: labTest.test_name || "",
      lab_id: labTest.lab_id || "",
      specimen_type: labTest.specimen_type || "",
      test_result: labTest.test_result || "",
      units: labTest.units || "N/A",
      normal_range: labTest.normal_range || "N/A",
      test_date: normalizedDate || "",
      status: labTest.status || "Preliminary",
    });
    setLabIdSearchTerm(labTest.lab_id || "");
    setSpecimenTypeSearchTerm(labTest.specimen_type || "");
    setUnitsSearchTerm(labTest.units || "N/A");
    setNormalRangeSearchTerm(labTest.normal_range || "N/A");
    const currentEncounter = encounterOptions.find(e => e.encounter_id === labTest.encounter_id);
    setEncounterSearchTerm(currentEncounter ? `${currentEncounter.encounter_id} - ${currentEncounter.patient_first_name || ""} ${currentEncounter.patient_last_name || ""}` : "");
    setTestCodeSearchTerm(labTest.test_code || "");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };

      // When editing, if test_date is not provided, keep the original value
      if (editingLabTest && !submitData.test_date) {
        const originalDate = normalizeDate(editingLabTest.test_date);
        if (originalDate) {
          submitData.test_date = originalDate;
        }
      }

      if (editingLabTest) {
        await api.updateLabTest(editingLabTest.test_id, submitData);
      } else {
        await api.createLabTest(submitData);
      }
      setShowModal(false);
      fetchLabTests();
    } catch (err) {
      setError(err.message || "Failed to save lab test");
    }
  };

  const handleDelete = async (test_id) => {
    try {
      await api.deleteLabTest(test_id);
      setDeleteConfirm(null);
      fetchLabTests();
    } catch (err) {
      setError(err.message || "Failed to delete lab test");
      setDeleteConfirm(null);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      test_id: "",
      encounter_id: "",
      test_code: "",
      lab_id: "",
      test_date_from: "",
      test_date_to: "",
      status: "",
      specimen_type: "",
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
            <Link to="/lab-tests" className="hp-nav-item hp-nav-item--active">Lab Tests</Link>
            <Link to="/medications" className="hp-nav-item">Medications</Link>
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
              Lab Tests
            </h1>
            <button
              className="hp-primary-btn"
              onClick={handleAdd}
              style={{ padding: "12px 24px" }}
            >
              + Add New Lab Test
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
                placeholder="Search lab tests by ID, test code, encounter ID, lab ID, or patient name..."
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
                        Test ID
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. T00022"
                        value={filters.test_id}
                        onChange={(e) => handleFilterChange("test_id", e.target.value)}
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
                        Test Code
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. TEST012"
                        value={filters.test_code}
                        onChange={(e) => handleFilterChange("test_code", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Lab ID
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. LAB013"
                        value={filters.lab_id}
                        onChange={(e) => handleFilterChange("lab_id", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Status
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. Preliminary, Final"
                        value={filters.status}
                        onChange={(e) => handleFilterChange("status", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Specimen Type
                      </label>
                      <input
                        type="text"
                        className="hp-search"
                        placeholder="e.g. Imaging, Blood"
                        value={filters.specimen_type}
                        onChange={(e) => handleFilterChange("specimen_type", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Test Date From
                      </label>
                      <input
                        type="date"
                        className="hp-search"
                        value={filters.test_date_from}
                        onChange={(e) => handleFilterChange("test_date_from", e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--hp-text-soft)", fontWeight: "500" }}>
                        Test Date To
                      </label>
                      <input
                        type="date"
                        className="hp-search"
                        value={filters.test_date_to}
                        onChange={(e) => handleFilterChange("test_date_to", e.target.value)}
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
                Loading lab tests...
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
                          }} onClick={() => handleSort("test_id")}>
                            Test ID {sortBy === "test_id" && (sortDirection === "asc" ? "↑" : "↓")}
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
                          }} onClick={() => handleSort("test_code")}>
                            Test Code {sortBy === "test_code" && (sortDirection === "asc" ? "↑" : "↓")}
                          </th>
                          <th style={{ padding: "16px", textAlign: "left", color: "var(--hp-text-main)", fontWeight: "600", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Lab ID
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
                          }} onClick={() => handleSort("test_date")}>
                            Test Date {sortBy === "test_date" && (sortDirection === "asc" ? "↑" : "↓")}
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
                          <th style={{ padding: "16px", textAlign: "center", color: "var(--hp-text-main)", fontWeight: "600", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {labTests.length === 0 ? (
                          <tr>
                            <td colSpan="8" style={{ padding: "40px", textAlign: "center", color: "var(--hp-text-soft)" }}>
                              No lab tests found
                            </td>
                          </tr>
                        ) : (
                          labTests.map((labTest) => (
                            <tr key={labTest.test_id} style={{ borderTop: "1px solid var(--hp-border)" }}>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                <Link to={`/lab-tests/${labTest.test_id}`} style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}>
                                  {labTest.test_id}
                                </Link>
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                <Link to={`/encounters/${labTest.encounter_id}`} style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}>
                                  {labTest.encounter_id}
                                </Link>
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                <Link to={`/patients/${labTest.patient_id}`} style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}>
                                  {labTest.first_name} {labTest.last_name}
                                </Link>
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                {labTest.test_code}
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                {labTest.lab_id || "-"}
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                                {labTest.test_date ? new Date(labTest.test_date).toLocaleDateString() : "-"}
                              </td>
                              <td style={{ padding: "16px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                                {labTest.status || "-"}
                              </td>
                              <td style={{ padding: "16px", textAlign: "center" }}>
                                <button
                                  className="hp-secondary-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(labTest);
                                  }}
                                  style={{ padding: "6px 12px", marginRight: "8px", fontSize: "12px" }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="hp-danger-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm(labTest.test_id);
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
              {editingLabTest ? "Edit Lab Test" : "Add New Lab Test"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Encounter ID <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    {editingLabTest ? (
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
                    Test Code <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      className="hp-search"
                      value={testCodeSearchTerm}
                      onChange={(e) => {
                        setTestCodeSearchTerm(e.target.value);
                        setFormData({ ...formData, test_code: e.target.value });
                        setShowTestCodeDropdown(true);
                      }}
                      onFocus={() => setShowTestCodeDropdown(true)}
                      required
                      placeholder="Select or type test code..."
                      style={{ width: "100%" }}
                    />
                    {showTestCodeDropdown && testCodeOptions.length > 0 && (
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
                        {testCodeOptions
                          .filter(code => 
                            !testCodeSearchTerm || 
                            code.test_code.toLowerCase().includes(testCodeSearchTerm.toLowerCase()) ||
                            (code.test_name && code.test_name.toLowerCase().includes(testCodeSearchTerm.toLowerCase()))
                          )
                          .map((code) => (
                            <div
                              key={code.test_code}
                              style={{
                                padding: "12px",
                                cursor: "pointer",
                                borderBottom: "1px solid var(--hp-border)",
                                color: "var(--hp-text-main)"
                              }}
                              onClick={() => {
                                setFormData({ 
                                  ...formData, 
                                  test_code: code.test_code,
                                  test_name: code.test_name || formData.test_name 
                                });
                                setTestCodeSearchTerm(code.test_code);
                                setShowTestCodeDropdown(false);
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(148, 163, 184, 0.1)"}
                              onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                            >
                              <div style={{ fontWeight: "500" }}>{code.test_code}</div>
                              {code.test_name && (
                                <div style={{ fontSize: "12px", color: "var(--hp-text-soft)" }}>
                                  {code.test_name}
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
                    Test Name <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <textarea
                    className="hp-search"
                    value={formData.test_name}
                    onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                    placeholder="Name/description of the test"
                    rows="3"
                    style={{ width: "100%", resize: "vertical" }}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Lab ID
                  </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        className="hp-search"
                        value={labIdSearchTerm}
                        onChange={(e) => {
                          setLabIdSearchTerm(e.target.value);
                          setFormData({ ...formData, lab_id: e.target.value });
                          setShowLabIdDropdown(true);
                        }}
                        onFocus={() => setShowLabIdDropdown(true)}
                        placeholder="Select or type lab ID..."
                        style={{ width: "100%" }}
                      />
                      {showLabIdDropdown && labIdOptions.length > 0 && (
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
                          {labIdOptions
                            .filter(lab => 
                              !labIdSearchTerm || 
                              (lab.lab_id && lab.lab_id.toLowerCase().includes(labIdSearchTerm.toLowerCase()))
                            )
                            .map((lab) => (
                              <div
                                key={lab.lab_id}
                                style={{
                                  padding: "12px",
                                  cursor: "pointer",
                                  borderBottom: "1px solid var(--hp-border)",
                                  color: "var(--hp-text-main)"
                                }}
                                onClick={() => {
                                  setFormData({ ...formData, lab_id: lab.lab_id });
                                  setLabIdSearchTerm(lab.lab_id);
                                  setShowLabIdDropdown(false);
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(148, 163, 184, 0.1)"}
                                onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                              >
                                <div style={{ fontWeight: "500" }}>{lab.lab_id}</div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Specimen Type
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        className="hp-search"
                        value={specimenTypeSearchTerm}
                        onChange={(e) => {
                          setSpecimenTypeSearchTerm(e.target.value);
                          setFormData({ ...formData, specimen_type: e.target.value });
                          setShowSpecimenTypeDropdown(true);
                        }}
                        onFocus={() => setShowSpecimenTypeDropdown(true)}
                        placeholder="Select or type specimen type..."
                        style={{ width: "100%" }}
                      />
                      {showSpecimenTypeDropdown && specimenTypeOptions.length > 0 && (
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
                          {specimenTypeOptions
                            .filter(spec => 
                              !specimenTypeSearchTerm || 
                              (spec.specimen_type && spec.specimen_type.toLowerCase().includes(specimenTypeSearchTerm.toLowerCase()))
                            )
                            .map((spec) => (
                              <div
                                key={spec.specimen_type}
                                style={{
                                  padding: "12px",
                                  cursor: "pointer",
                                  borderBottom: "1px solid var(--hp-border)",
                                  color: "var(--hp-text-main)"
                                }}
                                onClick={() => {
                                  setFormData({ ...formData, specimen_type: spec.specimen_type });
                                  setSpecimenTypeSearchTerm(spec.specimen_type);
                                  setShowSpecimenTypeDropdown(false);
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(148, 163, 184, 0.1)"}
                                onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                              >
                                <div style={{ fontWeight: "500" }}>{spec.specimen_type}</div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Test Date {!editingLabTest && <span style={{ color: "#dc3545" }}>*</span>}
                    </label>
                    <input
                      type="date"
                      className="hp-search"
                      value={formData.test_date || ""}
                      onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
                      style={{ width: "100%" }}
                      required={!editingLabTest}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Status <span style={{ color: "#dc3545" }}>*</span>
                    </label>
                    <select
                      className="hp-search"
                      value={formData.status || "Preliminary"}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      style={{ width: "100%" }}
                      required
                    >
                      <option value="Preliminary">Preliminary</option>
                      <option value="Final">Final</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                    Test Result
                    </label>
                    <input
                    type="text"
                      className="hp-search"
                    value={formData.test_result || ""}
                    onChange={(e) => setFormData({ ...formData, test_result: e.target.value })}
                    placeholder="Test result"
                      style={{ width: "100%" }}
                    />
                  </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Units
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        className="hp-search"
                        value={unitsSearchTerm}
                        onChange={(e) => {
                          setUnitsSearchTerm(e.target.value);
                          setFormData({ ...formData, units: e.target.value });
                          setShowUnitsDropdown(true);
                        }}
                        onFocus={() => setShowUnitsDropdown(true)}
                        placeholder="Select or type units..."
                        style={{ width: "100%" }}
                      />
                      {showUnitsDropdown && unitsOptions.length > 0 && (
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
                          {unitsOptions
                            .filter(unit => 
                              !unitsSearchTerm || 
                              (unit.units && unit.units.toLowerCase().includes(unitsSearchTerm.toLowerCase()))
                            )
                            .map((unit) => (
                              <div
                                key={unit.units}
                                style={{
                                  padding: "12px",
                                  cursor: "pointer",
                                  borderBottom: "1px solid var(--hp-border)",
                                  color: "var(--hp-text-main)"
                                }}
                                onClick={() => {
                                  setFormData({ ...formData, units: unit.units });
                                  setUnitsSearchTerm(unit.units);
                                  setShowUnitsDropdown(false);
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(148, 163, 184, 0.1)"}
                                onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                              >
                                <div style={{ fontWeight: "500" }}>{unit.units}</div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--hp-text-main)", fontWeight: "500" }}>
                      Normal Range
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        className="hp-search"
                        value={normalRangeSearchTerm}
                        onChange={(e) => {
                          setNormalRangeSearchTerm(e.target.value);
                          setFormData({ ...formData, normal_range: e.target.value });
                          setShowNormalRangeDropdown(true);
                        }}
                        onFocus={() => setShowNormalRangeDropdown(true)}
                        placeholder="Select or type normal range..."
                        style={{ width: "100%" }}
                      />
                      {showNormalRangeDropdown && normalRangeOptions.length > 0 && (
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
                          {normalRangeOptions
                            .filter(range => 
                              !normalRangeSearchTerm || 
                              (range.normal_range && range.normal_range.toLowerCase().includes(normalRangeSearchTerm.toLowerCase()))
                            )
                            .map((range) => (
                              <div
                                key={range.normal_range}
                                style={{
                                  padding: "12px",
                                  cursor: "pointer",
                                  borderBottom: "1px solid var(--hp-border)",
                                  color: "var(--hp-text-main)"
                                }}
                                onClick={() => {
                                  setFormData({ ...formData, normal_range: range.normal_range });
                                  setNormalRangeSearchTerm(range.normal_range);
                                  setShowNormalRangeDropdown(false);
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(148, 163, 184, 0.1)"}
                                onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                              >
                                <div style={{ fontWeight: "500" }}>{range.normal_range}</div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
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
                  {editingLabTest ? "Update" : "Create"}
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
              Are you sure you want to delete this lab test? This action cannot be undone.
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

export default LabTestsPage;

