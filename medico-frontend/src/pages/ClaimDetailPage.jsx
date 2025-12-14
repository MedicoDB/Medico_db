import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import "../HomePage.css";

const ClaimDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [denial, setDenial] = useState(null);

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
    fetchClaim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchClaim = async () => {
    try {
      setLoading(true);
      const claimData = await api.getClaimById(id);
      setClaim(claimData);
      const normalizedDate = normalizeDate(claimData.claim_billing_date);
      setFormData({
        encounter_id: claimData.encounter_id || "",
        insurance_provider: claimData.insurance_provider || "",
        payment_method: claimData.payment_method || "",
        claim_billing_date: normalizedDate || "",
        billed_amount: claimData.billed_amount || 0,
        paid_amount: claimData.paid_amount || 0,
        claim_status: claimData.claim_status || "",
        denial_reason: claimData.denial_reason || "",
      });

      // Fetch denial if claim_id exists
      if (claimData.claim_id) {
        try {
          const denialData = await api.getDenialByClaimId(claimData.claim_id);
          setDenial(denialData);
        } catch {
          // No denial found, that's okay
          setDenial(null);
        }
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching claim:", err);
      setError(err.message || "Failed to load claim");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      
      // When editing, if claim_billing_date is not provided, keep the original value
      if (!submitData.claim_billing_date && claim) {
        const originalDate = normalizeDate(claim.claim_billing_date);
        if (originalDate) {
          submitData.claim_billing_date = originalDate;
        }
      }
      
      await api.updateClaim(id, submitData);
      await fetchClaim();
      setIsEditing(false);
      alert("Claim updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to update claim");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete claim ${id}? This will fail if the claim has linked denial records.`)) {
      return;
    }
    try {
      await api.deleteClaim(id);
      navigate("/claims");
    } catch (err) {
      alert(err.message || "Failed to delete claim");
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
              <Link to="/claims" className="hp-nav-item hp-nav-item--active">Claims</Link>
              <Link to="/denials" className="hp-nav-item">Denials</Link>
              <Link to="/procedures" className="hp-nav-item">Procedures</Link>
              <Link to="/lab-tests" className="hp-nav-item">Lab Tests</Link>
              <Link to="/medications" className="hp-nav-item">Medications</Link>
              <Link to="/diagnoses" className="hp-nav-item">Diagnoses</Link>
              <Link to="/providers" className="hp-nav-item">Providers</Link>
              <Link to="/department-heads" className="hp-nav-item">Department Heads</Link>
            </nav>
          </div>
          <main style={{ flex: 1, padding: "60px", textAlign: "center", color: "var(--hp-text-soft)" }}>
            Loading claim...
          </main>
        </div>
      </div>
    );
  }

  if (error || !claim) {
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
              <Link to="/claims" className="hp-nav-item hp-nav-item--active">Claims</Link>
              <Link to="/denials" className="hp-nav-item">Denials</Link>
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
              {error || "Claim not found"}
              <br />
              <Link to="/claims" className="hp-primary-btn" style={{ marginTop: "16px", display: "inline-block" }}>
                Back to Claims
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
            <Link to="/claims" className="hp-nav-item hp-nav-item--active">Claims</Link>
            <Link to="/denials" className="hp-nav-item">Denials</Link>
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
                Claim: {claim.billing_id}
              </h1>
              <p style={{ margin: "4px 0 0 0", color: "var(--hp-text-soft)", fontSize: "14px" }}>
                {claim.first_name} {claim.last_name} - {formatDate(claim.claim_billing_date)}
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {!isEditing ? (
              <>
                <button className="hp-primary-btn" onClick={() => setIsEditing(true)}>
                  Edit Claim
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
                <Link to="/claims" className="hp-secondary-btn" style={{ marginLeft: "12px" }}>
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
                  Claim Information
                </h5>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Encounter ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.encounter_id || ""}
                      onChange={(e) => setFormData({ ...formData, encounter_id: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Claim Billing Date
                    </label>
                    <input
                      type="date"
                      value={formData.claim_billing_date || ""}
                      onChange={(e) => setFormData({ ...formData, claim_billing_date: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Insurance Provider
                    </label>
                    <input
                      type="text"
                      value={formData.insurance_provider || ""}
                      onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Payment Method
                    </label>
                    <input
                      type="text"
                      value={formData.payment_method || ""}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Billed Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.billed_amount || 0}
                      onChange={(e) => setFormData({ ...formData, billed_amount: parseFloat(e.target.value) || 0 })}
                      className="hp-search"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Paid Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.paid_amount || 0}
                      onChange={(e) => setFormData({ ...formData, paid_amount: parseFloat(e.target.value) || 0 })}
                      className="hp-search"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Claim Status *
                    </label>
                    <select
                      required
                      value={formData.claim_status || ""}
                      onChange={(e) => setFormData({ ...formData, claim_status: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%", padding: "10px" }}
                    >
                      <option value="">Select...</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Denied">Denied</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Denial Reason
                    </label>
                    <textarea
                      value={formData.denial_reason || ""}
                      onChange={(e) => setFormData({ ...formData, denial_reason: e.target.value })}
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
                  Claim Information
                </h3>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "8px 0", width: "40%", color: "var(--hp-text-soft)", fontWeight: "500" }}>Billing ID:</td>
                      <td style={{ padding: "8px 0", fontWeight: "600" }}>{claim.billing_id}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Claim ID:</td>
                      <td style={{ padding: "8px 0" }}>{claim.claim_id || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Patient:</td>
                      <td style={{ padding: "8px 0" }}>
                        <Link 
                          to={`/patients/${claim.patient_id}`}
                          style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}
                        >
                          {claim.first_name} {claim.last_name}
                        </Link>
                        <br />
                        <small style={{ color: "var(--hp-text-soft)" }}>{claim.patient_id}</small>
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
                      <td style={{ padding: "8px 0" }}>{formatDate(claim.claim_billing_date)}</td>
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

              <div style={{ 
                backgroundColor: "var(--hp-bg-card)", 
                borderRadius: "var(--hp-radius-lg)", 
                padding: "24px",
                border: "1px solid var(--hp-border)"
              }}>
                <h3 style={{ marginTop: 0, marginBottom: "20px", color: "var(--hp-primary)", fontSize: "18px" }}>
                  Billing Details
                </h3>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "8px 0", width: "40%", color: "var(--hp-text-soft)", fontWeight: "500" }}>Insurance Provider:</td>
                      <td style={{ padding: "8px 0" }}>{claim.insurance_provider || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Payment Method:</td>
                      <td style={{ padding: "8px 0" }}>{claim.payment_method || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Billed Amount:</td>
                      <td style={{ padding: "8px 0", fontWeight: "600", fontSize: "16px" }}>${(parseFloat(claim.billed_amount) || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Paid Amount:</td>
                      <td style={{ padding: "8px 0", fontWeight: "600", fontSize: "16px" }}>${(parseFloat(claim.paid_amount) || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Outstanding:</td>
                      <td style={{ padding: "8px 0", fontWeight: "600", fontSize: "16px", color: "var(--hp-primary)" }}>
                        ${((parseFloat(claim.billed_amount) || 0) - (parseFloat(claim.paid_amount) || 0)).toFixed(2)}
                      </td>
                    </tr>
                    {claim.denial_reason && (
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Denial Reason:</td>
                        <td style={{ padding: "8px 0" }}>{claim.denial_reason}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Denial Section */}
          {!isEditing && denial && (
            <div style={{ 
              backgroundColor: "var(--hp-bg-card)", 
              borderRadius: "var(--hp-radius-lg)", 
              padding: "24px",
              border: "1px solid var(--hp-border)",
              marginTop: "24px"
            }}>
              <h3 style={{ marginTop: 0, marginBottom: "20px", color: "var(--hp-primary)", fontSize: "18px" }}>
                Related Denial
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div>
                  <table style={{ width: "100%" }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: "8px 0", width: "40%", color: "var(--hp-text-soft)", fontWeight: "500" }}>Denial ID:</td>
                        <td style={{ padding: "8px 0" }}>
                          <Link 
                            to={`/denials/${denial.denial_id}`}
                            style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}
                          >
                            {denial.denial_id}
                          </Link>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Claim ID:</td>
                        <td style={{ padding: "8px 0" }}>{denial.claim_id}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Denial Date:</td>
                        <td style={{ padding: "8px 0" }}>{formatDate(denial.denial_date)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Denied Amount:</td>
                        <td style={{ padding: "8px 0", fontWeight: "600", fontSize: "16px", color: "#ef4444" }}>
                          ${(parseFloat(denial.denied_amount) || 0).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <table style={{ width: "100%" }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: "8px 0", width: "40%", color: "var(--hp-text-soft)", fontWeight: "500" }}>Reason Code:</td>
                        <td style={{ padding: "8px 0" }}>{denial.denial_reason_code}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Appeal Filed:</td>
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
                      {denial.denial_reason_description && (
                        <tr>
                          <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Description:</td>
                          <td style={{ padding: "8px 0" }}>{denial.denial_reason_description}</td>
                        </tr>
                      )}
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

export default ClaimDetailPage;

