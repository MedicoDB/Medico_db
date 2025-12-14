import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import "../HomePage.css";

const DenialDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [denial, setDenial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [claim, setClaim] = useState(null);
  const [denialReasonCodeOptions, setDenialReasonCodeOptions] = useState([]);
  const [denialReasonCodeSearchTerm, setDenialReasonCodeSearchTerm] = useState("");
  const [showDenialReasonCodeDropdown, setShowDenialReasonCodeDropdown] = useState(false);

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
    fetchDenial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fetch denial reason codes
  const fetchDenialReasonCodes = async () => {
    try {
      const codes = await api.getDenialReasonCodes();
      setDenialReasonCodeOptions(codes);
    } catch (err) {
      console.error("Error fetching denial reason codes:", err);
    }
  };

  useEffect(() => {
    if (isEditing) {
      fetchDenialReasonCodes();
    }
  }, [isEditing]);

  const fetchDenial = async () => {
    try {
      setLoading(true);
      const denialData = await api.getDenialById(id);
      setDenial(denialData);
      const normalizedDenialDate = normalizeDate(denialData.denial_date);
      const normalizedAppealDate = normalizeDate(denialData.appeal_resolution_date);
      setFormData({
        claim_id: denialData.claim_id || "",
        denial_reason_code: denialData.denial_reason_code || "",
        denial_reason_description: denialData.denial_reason_description || "",
        denied_amount: denialData.denied_amount || 0,
        denial_date: normalizedDenialDate || "",
        appeal_filed: denialData.appeal_filed || "",
        appeal_status: denialData.appeal_status || "",
        appeal_resolution_date: normalizedAppealDate || "",
        final_outcome: denialData.final_outcome || "",
      });
      setDenialReasonCodeSearchTerm(denialData.denial_reason_code || "");

      // Fetch claim details using claim_id
      if (denialData.claim_id) {
        try {
          const claimData = await api.getClaimByClaimId(denialData.claim_id);
          setClaim(claimData);
        } catch (err) {
          console.error("Error fetching claim:", err);
        }
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching denial:", err);
      setError(err.message || "Failed to load denial");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      
      // When editing, if denial_date is not provided, keep the original value
      if (!submitData.denial_date && denial) {
        const originalDate = normalizeDate(denial.denial_date);
        if (originalDate) {
          submitData.denial_date = originalDate;
        }
      }
      
      // When editing, if appeal_resolution_date is not provided, keep the original value (or null if it was null)
      if (!submitData.appeal_resolution_date && denial) {
        if (denial.appeal_resolution_date) {
          const originalDate = normalizeDate(denial.appeal_resolution_date);
          if (originalDate) {
            submitData.appeal_resolution_date = originalDate;
          }
        } else {
          submitData.appeal_resolution_date = null;
        }
      }
      
      await api.updateDenial(id, submitData);
      await fetchDenial();
      setIsEditing(false);
      alert("Denial updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to update denial");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete denial ${id}?`)) {
      return;
    }
    try {
      await api.deleteDenial(id);
      navigate("/denials");
    } catch (err) {
      alert(err.message || "Failed to delete denial");
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
              <Link to="/denials" className="hp-nav-item hp-nav-item--active">Denials</Link>
              <Link to="/procedures" className="hp-nav-item">Procedures</Link>
              <Link to="/lab-tests" className="hp-nav-item">Lab Tests</Link>
              <Link to="/medications" className="hp-nav-item">Medications</Link>
              <Link to="/diagnoses" className="hp-nav-item">Diagnoses</Link>
              <Link to="/providers" className="hp-nav-item">Providers</Link>
              <Link to="/department-heads" className="hp-nav-item">Department Heads</Link>
            </nav>
          </div>
          <main style={{ flex: 1, padding: "60px", textAlign: "center", color: "var(--hp-text-soft)" }}>
            Loading denial...
          </main>
        </div>
      </div>
    );
  }

  if (error || !denial) {
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
              <Link to="/denials" className="hp-nav-item hp-nav-item--active">Denials</Link>
              <Link to="/procedures" className="hp-nav-item">Procedures</Link>
              <Link to="/lab-tests" className="hp-nav-item">Lab Tests</Link>
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
              {error || "Denial not found"}
              <br />
              <Link to="/denials" className="hp-primary-btn" style={{ marginTop: "16px", display: "inline-block" }}>
                Back to Denials
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
            <Link to="/denials" className="hp-nav-item hp-nav-item--active">Denials</Link>
            <Link to="/procedures" className="hp-nav-item">Procedures</Link>
            <Link to="/lab-tests" className="hp-nav-item">Lab Tests</Link>
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
                Denial: {denial.denial_id}
              </h1>
              <p style={{ margin: "4px 0 0 0", color: "var(--hp-text-soft)", fontSize: "14px" }}>
                Claim ID: {denial.claim_id} - {formatDate(denial.denial_date)}
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {!isEditing ? (
              <>
                <button className="hp-primary-btn" onClick={() => setIsEditing(true)}>
                  Edit Denial
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "rgba(220, 53, 69, 0.2)",
                    color: "#dc3545",
                    border: "1px solid rgba(220, 53, 69, 0.3)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    marginLeft: "12px"
                  }}
                >
                  Delete
                </button>
                <Link to="/denials" className="hp-secondary-btn" style={{ marginLeft: "12px" }}>
                  Back to List
                </Link>
              </>
            ) : (
              <>
                <button className="hp-secondary-btn" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button className="hp-primary-btn" onClick={handleSubmit} style={{ marginLeft: "12px" }}>
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
                  Denial Information
                </h5>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Claim ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.claim_id || ""}
                      onChange={(e) => setFormData({ ...formData, claim_id: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Denial Date
                    </label>
                    <input
                      type="date"
                      value={formData.denial_date || ""}
                      onChange={(e) => setFormData({ ...formData, denial_date: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Denial Reason Code *
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        required
                        value={denialReasonCodeSearchTerm}
                        onChange={(e) => {
                          setDenialReasonCodeSearchTerm(e.target.value);
                          setFormData({ ...formData, denial_reason_code: e.target.value });
                          setShowDenialReasonCodeDropdown(true);
                        }}
                        onFocus={() => setShowDenialReasonCodeDropdown(true)}
                        className="hp-search"
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
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Denied Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.denied_amount || 0}
                      onChange={(e) => setFormData({ ...formData, denied_amount: parseFloat(e.target.value) || 0 })}
                      className="hp-search"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Appeal Filed
                    </label>
                    <select
                      value={formData.appeal_filed || ""}
                      onChange={(e) => setFormData({ ...formData, appeal_filed: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%", padding: "10px" }}
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Appeal Status
                    </label>
                    <select
                      value={formData.appeal_status || ""}
                      onChange={(e) => setFormData({ ...formData, appeal_status: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%", padding: "10px" }}
                    >
                      <option value="">Select...</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Appeal Resolution Date
                    </label>
                    <input
                      type="date"
                      value={formData.appeal_resolution_date || ""}
                      onChange={(e) => setFormData({ ...formData, appeal_resolution_date: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Final Outcome
                    </label>
                    <input
                      type="text"
                      value={formData.final_outcome || ""}
                      onChange={(e) => setFormData({ ...formData, final_outcome: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Denial Reason Description
                    </label>
                    <textarea
                      value={formData.denial_reason_description || ""}
                      onChange={(e) => setFormData({ ...formData, denial_reason_description: e.target.value })}
                      rows={3}
                      className="hp-search"
                      style={{ width: "100%", resize: "vertical" }}
                    />
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
                  Denial Information
                </h3>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "8px 0", width: "40%", color: "var(--hp-text-soft)", fontWeight: "500" }}>Denial ID:</td>
                      <td style={{ padding: "8px 0", fontWeight: "600" }}>{denial.denial_id}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Claim ID:</td>
                      <td style={{ padding: "8px 0", fontWeight: "600" }}>{denial.claim_id}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Denial Date:</td>
                      <td style={{ padding: "8px 0" }}>{formatDate(denial.denial_date)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Denial Reason Code:</td>
                      <td style={{ padding: "8px 0" }}>{denial.denial_reason_code}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Denied Amount:</td>
                      <td style={{ padding: "8px 0", fontWeight: "600", fontSize: "16px", color: "#ef4444" }}>
                        ${(parseFloat(denial.denied_amount) || 0).toFixed(2)}
                      </td>
                    </tr>
                    {denial.denial_reason_description && (
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Description:</td>
                        <td style={{ padding: "8px 0" }}>{denial.denial_reason_description}</td>
                      </tr>
                    )}
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
                  Appeal Information
                </h3>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "8px 0", width: "40%", color: "var(--hp-text-soft)", fontWeight: "500" }}>Appeal Filed:</td>
                      <td style={{ padding: "8px 0" }}>{denial.appeal_filed || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Appeal Status:</td>
                      <td style={{ padding: "8px 0" }}>
                        {denial.appeal_status ? (
                          <span style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "500",
                            backgroundColor: denial.appeal_status === "Approved" ? "rgba(34, 197, 94, 0.2)" : 
                                            denial.appeal_status === "Rejected" ? "rgba(239, 68, 68, 0.2)" :
                                            "rgba(148, 163, 184, 0.2)",
                            color: denial.appeal_status === "Approved" ? "#22c55e" :
                                    denial.appeal_status === "Rejected" ? "#ef4444" :
                                    "var(--hp-text-soft)",
                          }}>
                            {denial.appeal_status}
                          </span>
                        ) : "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Appeal Resolution Date:</td>
                      <td style={{ padding: "8px 0" }}>{formatDate(denial.appeal_resolution_date)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Final Outcome:</td>
                      <td style={{ padding: "8px 0" }}>{denial.final_outcome || "N/A"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Related Claim Section */}
          {!isEditing && claim && (
            <div style={{ 
              backgroundColor: "var(--hp-bg-card)", 
              borderRadius: "var(--hp-radius-lg)", 
              padding: "24px",
              border: "1px solid var(--hp-border)",
              marginTop: "24px"
            }}>
              <h3 style={{ marginTop: 0, marginBottom: "20px", color: "var(--hp-primary)", fontSize: "18px" }}>
                Related Claim
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div>
                  <table style={{ width: "100%" }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: "8px 0", width: "40%", color: "var(--hp-text-soft)", fontWeight: "500" }}>Billing ID:</td>
                        <td style={{ padding: "8px 0" }}>
                          <Link 
                            to={`/claims/${claim.billing_id}`}
                            style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}
                          >
                            {claim.billing_id}
                          </Link>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Claim ID:</td>
                        <td style={{ padding: "8px 0" }}>{claim.claim_id}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Billed Amount:</td>
                        <td style={{ padding: "8px 0", fontWeight: "600" }}>${(parseFloat(claim.billed_amount) || 0).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Status:</td>
                        <td style={{ padding: "8px 0" }}>
                          <span style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "500",
                            backgroundColor: claim.claim_status === "Approved" || claim.claim_status === "Paid" ? "rgba(34, 197, 94, 0.2)" : 
                                            claim.claim_status === "Denied" || claim.claim_status === "Rejected" ? "rgba(239, 68, 68, 0.2)" :
                                            "rgba(148, 163, 184, 0.2)",
                            color: claim.claim_status === "Approved" || claim.claim_status === "Paid" ? "#22c55e" :
                                    claim.claim_status === "Denied" || claim.claim_status === "Rejected" ? "#ef4444" :
                                    "var(--hp-text-soft)",
                          }}>
                            {claim.claim_status}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <table style={{ width: "100%" }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: "8px 0", width: "40%", color: "var(--hp-text-soft)", fontWeight: "500" }}>Patient:</td>
                        <td style={{ padding: "8px 0" }}>
                          {claim.first_name} {claim.last_name}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Encounter:</td>
                        <td style={{ padding: "8px 0" }}>
                          <Link 
                            to={`/encounters/${claim.encounter_id}`}
                            style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}
                          >
                            {claim.encounter_id}
                          </Link>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Billing Date:</td>
                        <td style={{ padding: "8px 0" }}>
                          {claim.claim_billing_date ? new Date(claim.claim_billing_date).toLocaleDateString() : "N/A"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DenialDetailPage;

