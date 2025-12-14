import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import "../HomePage.css";

const InsurerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [insurer, setInsurer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const payerTypeOptions = ["Private", "Public", "Medicare", "Medicaid"];

  const fetchInsurer = async () => {
    try {
      setLoading(true);
      const insurerData = await api.getInsurerById(id);
      setInsurer(insurerData);
      setFormData({
        code: insurerData.code || "",
        name: insurerData.name || "",
        payer_type: insurerData.payer_type || "Private",
        phone: insurerData.phone || "",
      });
      setError(null);
    } catch (err) {
      console.error("Error fetching insurer:", err);
      setError(err.message || "Failed to load insurer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsurer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      
      // Validate required fields
      if (!submitData.code || !submitData.name || !submitData.payer_type) {
        alert("Please fill in all required fields: Code, Name, and Payer Type");
        return;
      }
      
      await api.updateInsurer(id, submitData);
      await fetchInsurer();
      setIsEditing(false);
      alert("Insurer updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to update insurer");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete insurer ${id}? This action cannot be undone and will fail if the insurer is referenced by patients.`)) {
      return;
    }
    try {
      await api.deleteInsurer(id);
      navigate("/insurers");
    } catch (err) {
      alert(err.message || "Failed to delete insurer");
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
              <Link to="/insurers" className="hp-nav-item hp-nav-item--active">Insurers</Link>
              <Link to="/claims" className="hp-nav-item">Claims</Link>
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
            Loading insurer details...
          </main>
        </div>
      </div>
    );
  }

  if (error || !insurer) {
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
              <Link to="/insurers" className="hp-nav-item hp-nav-item--active">Insurers</Link>
              <Link to="/claims" className="hp-nav-item">Claims</Link>
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
              {error || "Insurer not found"}
              <br />
              <Link to="/insurers" className="hp-primary-btn" style={{ marginTop: "16px", display: "inline-block" }}>
                Back to Insurers
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
            <Link to="/insurers" className="hp-nav-item hp-nav-item--active">Insurers</Link>
            <Link to="/claims" className="hp-nav-item">Claims</Link>
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
                {insurer.name}
              </h1>
              <p style={{ margin: "4px 0 0 0", color: "var(--hp-text-soft)", fontSize: "14px" }}>
                Insurance company details and information
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <Link to="/insurers" className="hp-secondary-btn">
                Back to List
              </Link>
            </div>
          </header>

          <div style={{ padding: "24px" }}>
          {error && (
            <div style={{ padding: "12px", marginBottom: "16px", backgroundColor: "rgba(220, 53, 69, 0.1)", color: "#dc3545", borderRadius: "8px", border: "1px solid rgba(220, 53, 69, 0.3)" }}>
              {error}
            </div>
          )}

          <div style={{ 
            backgroundColor: "var(--hp-bg-card)", 
            borderRadius: "var(--hp-radius-lg)", 
            padding: "32px",
            border: "1px solid var(--hp-border)",
            boxShadow: "var(--hp-shadow-soft)",
            marginBottom: "24px"
          }}>
            {!isEditing ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                  <h2 style={{ margin: 0, color: "var(--hp-text-main)" }}>Insurer Information</h2>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="hp-primary-btn"
                      style={{ padding: "10px 20px" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "rgba(220, 53, 69, 0.2)",
                        color: "#dc3545",
                        border: "1px solid rgba(220, 53, 69, 0.3)",
                        borderRadius: "999px",
                        cursor: "pointer",
                        transition: "var(--hp-transition-fast)"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(220, 53, 69, 0.3)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(220, 53, 69, 0.2)"}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                  <div>
                    <table style={{ width: "100%" }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Insurer ID:</td>
                          <td style={{ padding: "8px 0" }}>{insurer.insurer_id}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Code:</td>
                          <td style={{ padding: "8px 0" }}>
                            <span style={{
                              padding: "4px 10px",
                              backgroundColor: "rgba(59, 130, 246, 0.15)",
                              borderRadius: "6px",
                              fontSize: "14px",
                              fontWeight: "500",
                              color: "var(--hp-primary)",
                              border: "1px solid rgba(59, 130, 246, 0.3)"
                            }}>
                              {insurer.code}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Name:</td>
                          <td style={{ padding: "8px 0", fontWeight: "500", color: "var(--hp-text-main)" }}>{insurer.name}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Payer Type:</td>
                          <td style={{ padding: "8px 0" }}>{insurer.payer_type}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Phone:</td>
                          <td style={{ padding: "8px 0" }}>{insurer.phone || "N/A"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    backgroundColor: "rgba(148, 163, 184, 0.05)",
                    borderRadius: "var(--hp-radius-lg)",
                    minHeight: "200px"
                  }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "64px", marginBottom: "16px" }}>🏢</div>
                      <p style={{ color: "var(--hp-text-soft)", margin: 0 }}>Insurance Provider Details</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ marginTop: 0, marginBottom: "24px", color: "var(--hp-text-main)" }}>Edit Insurer</h2>
                <form onSubmit={handleSubmit}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "24px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        Company Code * (Unique)
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.code}
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
                        value={formData.name}
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
                        value={formData.payer_type}
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
                        value={formData.phone}
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
                      onClick={() => {
                        setIsEditing(false);
                        fetchInsurer(); // Reset form data
                      }}
                      style={{ padding: "10px 20px" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="hp-primary-btn"
                      style={{ padding: "10px 20px" }}
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default InsurerDetailPage;

