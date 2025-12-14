import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import "../HomePage.css";

const DepartmentHeadDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [head, setHead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  
  // Provider options for searchable select
  const [providerOptions, setProviderOptions] = useState([]);
  const [providerSearchTerm, setProviderSearchTerm] = useState("");
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);

  useEffect(() => {
    fetchHead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchHead = async () => {
    try {
      setLoading(true);
      const headData = await api.getDepartmentHeadById(id);
      setHead(headData);
      setFormData({
        department: headData.department || "",
        head_provider_id: headData.head_provider_id || "",
        head_name: headData.head_name || "",
        head_email: headData.head_email || "",
      });
      setError(null);
    } catch (err) {
      console.error("Error fetching department head:", err);
      setError(err.message || "Failed to load department head");
    } finally {
      setLoading(false);
    }
  };

  // Fetch provider options filtered by department
  const fetchProviderOptions = async (department, currentProviderId = null) => {
    try {
      // Fetch more providers to ensure we get all matches (increase limit to 1000)
      const options = await api.getProvidersOptions("", 1000);
      // Filter providers by department
      const filteredOptions = options.filter(provider => 
        provider.department && provider.department.toLowerCase() === department.toLowerCase()
      );
      setProviderOptions(filteredOptions);
      
      // Set current provider in search term
      if (currentProviderId) {
        const currentProvider = filteredOptions.find(p => p.provider_id === currentProviderId) || 
                                options.find(p => p.provider_id === currentProviderId);
        if (currentProvider) {
          setProviderSearchTerm(`${currentProvider.provider_id} - ${currentProvider.name}`);
        } else {
          setProviderSearchTerm(currentProviderId);
        }
      }
    } catch (err) {
      console.error("Error fetching providers:", err);
    }
  };

  useEffect(() => {
    if (isEditing && head?.department) {
      // Fetch all providers with matching department when entering edit mode
      fetchProviderOptions(head.department, formData.head_provider_id || head.head_provider_id);
    }
  }, [isEditing, head?.department]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // When editing, only send head_provider_id (backend will auto-fill name and email)
      const submitData = {
        head_provider_id: formData.head_provider_id
      };
      await api.updateDepartmentHead(id, submitData);
      await fetchHead();
      setIsEditing(false);
      alert("Department head updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to update department head");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete department head ${id}?`)) {
      return;
    }
    try {
      await api.deleteDepartmentHead(id);
      navigate("/department-heads");
    } catch (err) {
      alert(err.message || "Failed to delete department head");
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
              <Link to="/providers" className="hp-nav-item">Providers</Link>
              <Link to="/department-heads" className="hp-nav-item hp-nav-item--active">Department Heads</Link>
            </nav>
          </div>
          <main style={{ flex: 1, padding: "60px", textAlign: "center", color: "var(--hp-text-soft)" }}>
            Loading department head...
          </main>
        </div>
      </div>
    );
  }

  if (error || !head) {
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
              <Link to="/providers" className="hp-nav-item">Providers</Link>
              <Link to="/department-heads" className="hp-nav-item hp-nav-item--active">Department Heads</Link>
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
              {error || "Department head not found"}
              <br />
              <Link to="/department-heads" className="hp-primary-btn" style={{ marginTop: "16px", display: "inline-block" }}>
                Back to Department Heads
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
            <Link to="/providers" className="hp-nav-item">Providers</Link>
            <Link to="/department-heads" className="hp-nav-item hp-nav-item--active">Department Heads</Link>
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
                Department Head: {head.head_id}
              </h1>
              <p style={{ margin: "4px 0 0 0", color: "var(--hp-text-soft)", fontSize: "14px" }}>
                {head.head_name} - {head.department}
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {!isEditing ? (
              <>
                <button className="hp-primary-btn" onClick={() => setIsEditing(true)}>
                  Edit Department Head
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
                <Link to="/department-heads" className="hp-secondary-btn" style={{ marginLeft: "12px" }}>
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
                  Department Head Information
                </h5>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
                      Department cannot be changed. Each department must have a chief.
                    </small>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Provider ID *
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        placeholder="Search and select provider..."
                        value={providerSearchTerm}
                        onChange={(e) => {
                          setProviderSearchTerm(e.target.value);
                          setShowProviderDropdown(true);
                        }}
                        onFocus={() => {
                          setShowProviderDropdown(true);
                          // Always refresh provider options when dropdown opens to ensure we have all providers
                          if (head?.department) {
                            fetchProviderOptions(head.department, formData.head_provider_id);
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowProviderDropdown(false), 200);
                        }}
                        required
                        className="hp-search"
                        style={{ width: "100%" }}
                      />
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
                          {providerOptions
                            .filter(provider => 
                              !providerSearchTerm || 
                              `${provider.provider_id} - ${provider.name}`.toLowerCase().includes(providerSearchTerm.toLowerCase())
                            )
                            .map((provider) => (
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
                                setFormData({ ...formData, head_provider_id: provider.provider_id });
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(148, 163, 184, 0.1)"}
                              onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                            >
                              <div style={{ fontWeight: "500" }}>{provider.provider_id} - {provider.name}</div>
                              <div style={{ fontSize: "12px", color: "var(--hp-text-soft)" }}>
                                {provider.department} - {provider.department}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <small style={{ color: "var(--hp-text-soft)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                      Changing provider ID will automatically update name and email. Only providers with department "{formData.department}" can be selected.
                    </small>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Head Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.head_name || ""}
                      onChange={(e) => setFormData({ ...formData, head_name: e.target.value })}
                      disabled
                      className="hp-search"
                      style={{ width: "100%", opacity: 0.6, cursor: "not-allowed" }}
                    />
                    <small style={{ color: "var(--hp-text-soft)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                      Name is automatically filled from provider.
                    </small>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.head_email || ""}
                      onChange={(e) => setFormData({ ...formData, head_email: e.target.value })}
                      disabled
                      className="hp-search"
                      style={{ width: "100%", opacity: 0.6, cursor: "not-allowed" }}
                    />
                    <small style={{ color: "var(--hp-text-soft)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                      Email is automatically filled from provider.
                    </small>
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
                  Department Head Information
                </h3>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "8px 0", width: "40%", color: "var(--hp-text-soft)", fontWeight: "500" }}>Head ID:</td>
                      <td style={{ padding: "8px 0", fontWeight: "600" }}>{head.head_id}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Department:</td>
                      <td style={{ padding: "8px 0", fontWeight: "600" }}>{head.department}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Provider ID:</td>
                      <td style={{ padding: "8px 0" }}>{head.head_provider_id}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Head Name:</td>
                      <td style={{ padding: "8px 0", fontWeight: "600" }}>{head.head_name}</td>
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
                  Contact Information
                </h3>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "8px 0", width: "40%", color: "var(--hp-text-soft)", fontWeight: "500" }}>Email:</td>
                      <td style={{ padding: "8px 0" }}>{head.head_email || "N/A"}</td>
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

export default DepartmentHeadDetailPage;

