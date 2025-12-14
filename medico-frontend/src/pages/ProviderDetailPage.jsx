import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import "../HomePage.css";

const ProviderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [departmentHeadSearchTerm, setDepartmentHeadSearchTerm] = useState("");

  useEffect(() => {
    fetchProvider();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProvider = async () => {
    try {
      setLoading(true);
      const providerData = await api.getProviderById(id);
      setProvider(providerData);
      setFormData({
        name: providerData.name || "",
        department: providerData.department || "",
        specialty: providerData.specialty || "",
        npi: providerData.npi || "",
        inhouse: providerData.inhouse ? "1" : "0",
        location: providerData.location || "",
        years_experience: providerData.years_experience || "",
        contact_info: providerData.contact_info || "",
        email: providerData.email || "",
        head_id: providerData.head_id || "",
      });
      setError(null);
    } catch (err) {
      console.error("Error fetching provider:", err);
      setError(err.message || "Failed to load provider");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentHeadOptions = async (search = "") => {
    try {
      const options = await api.getProvidersDepartmentHeadsOptions(search, 50);
      const currentHead = options.find(h => h.head_id === provider?.head_id);
      if (currentHead) {
        setDepartmentHeadSearchTerm(`${currentHead.head_id} - ${currentHead.head_name || ""} (${currentHead.department || ""})`);
      }
    } catch (err) {
      console.error("Error fetching department heads:", err);
    }
  };

  useEffect(() => {
    if (isEditing && provider?.head_id) {
      fetchDepartmentHeadOptions();
    }
  }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      // Don't send department, specialty, npi, and head_id - they cannot be changed
      delete submitData.department;
      delete submitData.specialty;
      delete submitData.npi;
      delete submitData.head_id;
      
      submitData.inhouse = submitData.inhouse === "1";
      if (submitData.years_experience) {
        submitData.years_experience = parseInt(submitData.years_experience);
      }
      await api.updateProvider(id, submitData);
      await fetchProvider();
      setIsEditing(false);
      alert("Provider updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to update provider");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete provider ${id}?`)) {
      return;
    }
    try {
      await api.deleteProvider(id);
      navigate("/providers");
    } catch (err) {
      alert(err.message || "Failed to delete provider");
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
              <Link to="/lab-tests" className="hp-nav-item">Lab Tests</Link>
              <Link to="/medications" className="hp-nav-item">Medications</Link>
              <Link to="/diagnoses" className="hp-nav-item">Diagnoses</Link>
              <Link to="/providers" className="hp-nav-item hp-nav-item--active">Providers</Link>
              <Link to="/department-heads" className="hp-nav-item">Department Heads</Link>
            </nav>
          </div>
          <main style={{ flex: 1, padding: "60px", textAlign: "center", color: "var(--hp-text-soft)" }}>
            Loading provider...
          </main>
        </div>
      </div>
    );
  }

  if (error || !provider) {
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
              <Link to="/lab-tests" className="hp-nav-item">Lab Tests</Link>
              <Link to="/medications" className="hp-nav-item">Medications</Link>
              <Link to="/diagnoses" className="hp-nav-item">Diagnoses</Link>
              <Link to="/providers" className="hp-nav-item hp-nav-item--active">Providers</Link>
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
              {error || "Provider not found"}
              <br />
              <Link to="/providers" className="hp-primary-btn" style={{ marginTop: "16px", display: "inline-block" }}>
                Back to Providers
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
            <Link to="/lab-tests" className="hp-nav-item">Lab Tests</Link>
            <Link to="/medications" className="hp-nav-item">Medications</Link>
            <Link to="/diagnoses" className="hp-nav-item">Diagnoses</Link>
            <Link to="/providers" className="hp-nav-item hp-nav-item--active">Providers</Link>
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
                Provider: {provider.provider_id}
              </h1>
              <p style={{ margin: "4px 0 0 0", color: "var(--hp-text-soft)", fontSize: "14px" }}>
                {provider.name} - {provider.specialty}
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {!isEditing ? (
              <>
                <button className="hp-primary-btn" onClick={() => setIsEditing(true)} style={{ marginLeft: "12px" }}>
                  Edit Provider
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
                <Link to="/providers" className="hp-secondary-btn" style={{ marginLeft: "12px" }}>
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
                  Provider Information
                </h5>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        Name *
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
                        Department *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.department || ""}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        disabled
                        className="hp-search"
                        style={{ width: "100%", opacity: 0.6, cursor: "not-allowed" }}
                      />
                      <small style={{ color: "var(--hp-text-soft)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                        Department cannot be changed.
                      </small>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        Specialty *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.specialty || ""}
                        onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                        disabled
                        className="hp-search"
                        style={{ width: "100%", opacity: 0.6, cursor: "not-allowed" }}
                      />
                      <small style={{ color: "var(--hp-text-soft)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                        Specialty cannot be changed.
                      </small>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        NPI *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.npi || ""}
                        onChange={(e) => setFormData({ ...formData, npi: e.target.value })}
                        disabled
                        className="hp-search"
                        style={{ width: "100%", opacity: 0.6, cursor: "not-allowed" }}
                      />
                      <small style={{ color: "var(--hp-text-soft)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                        NPI cannot be changed.
                      </small>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        In-House
                      </label>
                      <select
                        value={formData.inhouse}
                        onChange={(e) => setFormData({ ...formData, inhouse: e.target.value })}
                        className="hp-search"
                        style={{ width: "100%" }}
                      >
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location || ""}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="hp-search"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.years_experience || ""}
                        onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                        className="hp-search"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        Contact Info
                      </label>
                      <input
                        type="text"
                        value={formData.contact_info || ""}
                        onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                        className="hp-search"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Department Head
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        value={departmentHeadSearchTerm}
                        disabled
                        className="hp-search"
                        style={{ width: "100%", opacity: 0.6, cursor: "not-allowed" }}
                        placeholder=""
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div style={{ 
                backgroundColor: "var(--hp-bg-card)", 
                borderRadius: "var(--hp-radius-lg)", 
                padding: "24px",
                border: "1px solid var(--hp-border)"
              }}>
                <h3 style={{ marginTop: 0, marginBottom: "20px", color: "var(--hp-primary)", fontSize: "18px" }}>
                  Provider Information
                </h3>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "8px 0", width: "40%", color: "var(--hp-text-soft)", fontWeight: "500" }}>Provider ID:</td>
                      <td style={{ padding: "8px 0", fontWeight: "600" }}>{provider.provider_id}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Name:</td>
                      <td style={{ padding: "8px 0", fontWeight: "600" }}>{provider.name}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Department:</td>
                      <td style={{ padding: "8px 0" }}>{provider.department}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Specialty:</td>
                      <td style={{ padding: "8px 0" }}>{provider.specialty}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>NPI:</td>
                      <td style={{ padding: "8px 0" }}>{provider.npi}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>In-House:</td>
                      <td style={{ padding: "8px 0" }}>{provider.inhouse ? "Yes" : "No"}</td>
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
                  Contact & Additional Info
                </h3>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "8px 0", width: "40%", color: "var(--hp-text-soft)", fontWeight: "500" }}>Location:</td>
                      <td style={{ padding: "8px 0" }}>{provider.location || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Years of Experience:</td>
                      <td style={{ padding: "8px 0" }}>{provider.years_experience || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Contact Info:</td>
                      <td style={{ padding: "8px 0" }}>{provider.contact_info || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Email:</td>
                      <td style={{ padding: "8px 0" }}>{provider.email || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Department Head:</td>
                      <td style={{ padding: "8px 0" }}>
                        {provider.head_id ? (
                          <Link 
                            to={`/department-heads/${provider.head_id}`}
                            style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}
                          >
                            {provider.head_name} {provider.head_specialty}
                          </Link>
                        ) : (
                          "N/A"
                        )}
                      </td>
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

export default ProviderDetailPage;

