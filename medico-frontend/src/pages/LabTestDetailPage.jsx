import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import "../HomePage.css";

const LabTestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [labTest, setLabTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [testCodeOptions, setTestCodeOptions] = useState([]);
  const [testCodeSearchTerm, setTestCodeSearchTerm] = useState("");
  const [showTestCodeDropdown, setShowTestCodeDropdown] = useState(false);
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

  useEffect(() => {
    fetchLabTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTestCodes = async () => {
    try {
      const codes = await api.getTestCodes();
      setTestCodeOptions(codes);
    } catch (err) {
      console.error("Error fetching test codes:", err);
    }
  };

  const fetchLabIds = async () => {
    try {
      const labIds = await api.getLabIds();
      setLabIdOptions(labIds);
    } catch (err) {
      console.error("Error fetching lab IDs:", err);
    }
  };

  const fetchSpecimenTypes = async () => {
    try {
      const specimenTypes = await api.getSpecimenTypes();
      setSpecimenTypeOptions(specimenTypes);
    } catch (err) {
      console.error("Error fetching specimen types:", err);
    }
  };

  const fetchUnits = async () => {
    try {
      const units = await api.getUnits();
      setUnitsOptions(units);
    } catch (err) {
      console.error("Error fetching units:", err);
    }
  };

  const fetchNormalRanges = async () => {
    try {
      const normalRanges = await api.getNormalRanges();
      setNormalRangeOptions(normalRanges);
    } catch (err) {
      console.error("Error fetching normal ranges:", err);
    }
  };

  useEffect(() => {
    if (isEditing) {
      fetchTestCodes();
      fetchLabIds();
      fetchSpecimenTypes();
      fetchUnits();
      fetchNormalRanges();
    }
  }, [isEditing]);

  const fetchLabTest = async () => {
    try {
      setLoading(true);
      const labTestData = await api.getLabTestById(id);
      setLabTest(labTestData);
      const normalizedDate = normalizeDate(labTestData.test_date);
      setFormData({
        encounter_id: labTestData.encounter_id || "",
        test_code: labTestData.test_code || "",
        test_name: labTestData.test_name || "",
        lab_id: labTestData.lab_id || "",
        specimen_type: labTestData.specimen_type || "",
        test_result: labTestData.test_result || "",
        units: labTestData.units || "N/A",
        normal_range: labTestData.normal_range || "N/A",
        test_date: normalizedDate || "",
        status: labTestData.status || "Preliminary",
      });
      setTestCodeSearchTerm(labTestData.test_code || "");
      setLabIdSearchTerm(labTestData.lab_id || "");
      setError(null);
    } catch (err) {
      console.error("Error fetching lab test:", err);
      setError(err.message || "Failed to load lab test");
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      
      // When editing, if test_date is not provided, keep the original value
      if (!submitData.test_date && labTest) {
        const originalDate = normalizeDate(labTest.test_date);
        if (originalDate) {
          submitData.test_date = originalDate;
        }
      }
      
      await api.updateLabTest(id, submitData);
      await fetchLabTest();
      setIsEditing(false);
      alert("Lab test updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to update lab test");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete lab test ${id}?`)) {
      return;
    }
    try {
      await api.deleteLabTest(id);
      navigate("/lab-tests");
    } catch (err) {
      alert(err.message || "Failed to delete lab test");
    }
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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--hp-bg-main)" }}>
        <div style={{ display: "flex" }}>
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
          <main style={{ flex: 1, padding: "60px", textAlign: "center", color: "var(--hp-text-soft)" }}>
            Loading lab test...
          </main>
        </div>
      </div>
    );
  }

  if (error || !labTest) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--hp-bg-main)" }}>
        <div style={{ display: "flex" }}>
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
          <main style={{ flex: 1, padding: "60px" }}>
            <div style={{ 
              padding: "20px", 
              backgroundColor: "rgba(220, 53, 69, 0.1)", 
              color: "#dc3545", 
              borderRadius: "8px",
              border: "1px solid rgba(220, 53, 69, 0.3)"
            }}>
              {error || "Lab test not found"}
              <br />
              <Link to="/lab-tests" className="hp-primary-btn" style={{ marginTop: "16px", display: "inline-block" }}>
                Back to Lab Tests
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--hp-bg-main)" }}>
      <div style={{ display: "flex" }}>
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

        <main style={{ flex: 1 }}>
          <header style={{
            backgroundColor: "var(--hp-bg-card)",
            borderBottom: "1px solid var(--hp-border)",
            padding: "20px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "600", color: "var(--hp-text-main)" }}>
                Lab Test: {labTest.test_id}
              </h1>
              <p style={{ margin: "4px 0 0 0", color: "var(--hp-text-soft)", fontSize: "14px" }}>
                {labTest.first_name} {labTest.last_name} - {formatDate(labTest.test_date)}
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {!isEditing ? (
                <>
                  <button className="hp-primary-btn" onClick={() => setIsEditing(true)}>
                    Edit Lab Test
                  </button>
                  <button
                    onClick={handleDelete}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "rgba(220, 53, 69, 0.2)",
                      color: "#dc3545",
                      border: "1px solid rgba(220, 53, 69, 0.3)",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    Delete
                  </button>
                  <Link to="/lab-tests" className="hp-secondary-btn">
                    Back to List
                  </Link>
                </>
              ) : (
                <>
                  <button className="hp-secondary-btn" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                  <button className="hp-primary-btn" onClick={handleSubmit}>
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </header>

        <div style={{ padding: "24px" }}>
          {isEditing ? (
            <form onSubmit={handleSubmit} style={{ 
              backgroundColor: "var(--hp-bg-card)", 
              borderRadius: "var(--hp-radius-lg)", 
              padding: "32px",
              border: "1px solid var(--hp-border)"
            }}>
              <div style={{ marginBottom: "24px" }}>
                <h5 style={{ color: "var(--hp-primary)", marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>
                  Lab Test Information
                </h5>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Encounter ID
                    </label>
                    <input
                      type="text"
                      value={formData.encounter_id || ""}
                      readOnly
                      className="hp-search"
                      style={{ width: "100%", opacity: 0.7, cursor: "not-allowed" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Test Code *
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        required
                        value={testCodeSearchTerm}
                        onChange={(e) => {
                          setTestCodeSearchTerm(e.target.value);
                          setFormData({ ...formData, test_code: e.target.value });
                          setShowTestCodeDropdown(true);
                        }}
                        onFocus={() => setShowTestCodeDropdown(true)}
                        placeholder="Select or type test code..."
                        className="hp-search"
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
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Test Name *
                    </label>
                    <textarea
                      value={formData.test_name || ""}
                      onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                      rows={3}
                      className="hp-search"
                      style={{ width: "100%", resize: "vertical" }}
                      required
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        Lab ID
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          value={labIdSearchTerm}
                          onChange={(e) => {
                            setLabIdSearchTerm(e.target.value);
                            setFormData({ ...formData, lab_id: e.target.value });
                            setShowLabIdDropdown(true);
                          }}
                          onFocus={() => setShowLabIdDropdown(true)}
                          placeholder="Select or type lab ID..."
                          className="hp-search"
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
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        Specimen Type
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          value={specimenTypeSearchTerm}
                          onChange={(e) => {
                            setSpecimenTypeSearchTerm(e.target.value);
                            setFormData({ ...formData, specimen_type: e.target.value });
                            setShowSpecimenTypeDropdown(true);
                          }}
                          onFocus={() => setShowSpecimenTypeDropdown(true)}
                          placeholder="Select or type specimen type..."
                          className="hp-search"
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
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        Test Date
                      </label>
                      <input
                        type="date"
                        value={formData.test_date || ""}
                        onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
                        className="hp-search"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        Status *
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
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Test Result
                    </label>
                    <input
                      type="text"
                      value={formData.test_result || ""}
                      onChange={(e) => setFormData({ ...formData, test_result: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        Units
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          value={unitsSearchTerm}
                          onChange={(e) => {
                            setUnitsSearchTerm(e.target.value);
                            setFormData({ ...formData, units: e.target.value });
                            setShowUnitsDropdown(true);
                          }}
                          onFocus={() => setShowUnitsDropdown(true)}
                          placeholder="Select or type units..."
                          className="hp-search"
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
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        Normal Range
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          value={normalRangeSearchTerm}
                          onChange={(e) => {
                            setNormalRangeSearchTerm(e.target.value);
                            setFormData({ ...formData, normal_range: e.target.value });
                            setShowNormalRangeDropdown(true);
                          }}
                          onFocus={() => setShowNormalRangeDropdown(true)}
                          placeholder="Select or type normal range..."
                          className="hp-search"
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
              </div>
            </form>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
              <div style={{ 
                backgroundColor: "var(--hp-bg-card)", 
                borderRadius: "var(--hp-radius-lg)", 
                padding: "24px",
                border: "1px solid var(--hp-border)"
              }}>
                <h3 style={{ marginTop: 0, marginBottom: "20px", color: "var(--hp-primary)", fontSize: "18px" }}>
                  Lab Test Information
                </h3>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "8px 0", width: "40%", color: "var(--hp-text-soft)", fontWeight: "500" }}>Test ID:</td>
                      <td style={{ padding: "8px 0", fontWeight: "600" }}>{labTest.test_id}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Test Code:</td>
                      <td style={{ padding: "8px 0", fontWeight: "600" }}>{labTest.test_code}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Test Name:</td>
                      <td style={{ padding: "8px 0" }}>{labTest.test_name || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Patient:</td>
                      <td style={{ padding: "8px 0" }}>
                        <Link 
                          to={`/patients/${labTest.patient_id}`}
                          style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}
                        >
                          {labTest.first_name} {labTest.last_name}
                        </Link>
                        <br />
                        <small style={{ color: "var(--hp-text-soft)" }}>{labTest.patient_id}</small>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Encounter:</td>
                      <td style={{ padding: "8px 0" }}>
                        <Link 
                          to={`/encounters/${labTest.encounter_id}`}
                          style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}
                        >
                          {labTest.encounter_id}
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Test Date:</td>
                      <td style={{ padding: "8px 0" }}>{formatDate(labTest.test_date)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ 
                backgroundColor: "var(--hp-bg-card)", 
                borderRadius: "var(--hp-radius-lg)", 
                padding: "24px",
                border: "1px solid var(--hp-border)"
              }}>
                <h3 style={{ marginTop: 0, marginBottom: "20px", color: "var(--hp-primary)", fontSize: "18px" }}>
                  Test Details
                </h3>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "8px 0", width: "40%", color: "var(--hp-text-soft)", fontWeight: "500" }}>Lab ID:</td>
                      <td style={{ padding: "8px 0" }}>{labTest.lab_id || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Specimen Type:</td>
                      <td style={{ padding: "8px 0" }}>{labTest.specimen_type || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Status:</td>
                      <td style={{ padding: "8px 0", fontWeight: "600" }}>{labTest.status || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Test Result:</td>
                      <td style={{ padding: "8px 0" }}>{labTest.test_result || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Units:</td>
                      <td style={{ padding: "8px 0" }}>{labTest.units || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Normal Range:</td>
                      <td style={{ padding: "8px 0" }}>{labTest.normal_range || "N/A"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
      </div>
    </div>
  );
};

export default LabTestDetailPage;

