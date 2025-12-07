import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import "../HomePage.css";

const EncounterDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [encounter, setEncounter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [patients, setPatients] = useState([]);
  const [providers, setProviders] = useState([]);

  const statusOptions = ["Scheduled", "Completed", "In Progress", "Cancelled", "Discharged"];
  const visitTypeOptions = ["Emergency", "Outpatient", "Inpatient", "Surgery", "Follow-up", "Telehealth"];

  useEffect(() => {
    fetchEncounter();
    fetchOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchEncounter = async () => {
    try {
      setLoading(true);
      const encounterData = await api.getEncounterById(id);
      setEncounter(encounterData);
      setFormData({
        patient_id: encounterData.patient_id || "",
        provider_id: encounterData.provider_id || "",
        visit_date: encounterData.visit_date ? encounterData.visit_date.split('T')[0] : "",
        visit_type: encounterData.visit_type || "",
        department: encounterData.department || "",
        reason_for_visit: encounterData.reason_for_visit || "",
        diagnosis_code: encounterData.diagnosis_code || "",
        admission_type: encounterData.admission_type || "",
        discharge_date: encounterData.discharge_date ? encounterData.discharge_date.split('T')[0] : "",
        length_of_stay: encounterData.length_of_stay || 0,
        status: encounterData.status || "Scheduled",
        readmitted_flag: encounterData.readmitted_flag || false,
      });
      setError(null);
    } catch (err) {
      console.error("Error fetching encounter:", err);
      setError(err.message || "Failed to load encounter");
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [patientsData, providersData] = await Promise.all([
        api.getPatientsOptions("", 100),
        api.getProvidersOptions("", 100),
      ]);
      setPatients(patientsData || []);
      setProviders(providersData || []);
    } catch (err) {
      console.error("Error fetching options:", err);
    }
  };

  const handleProviderChange = (providerId) => {
    const provider = providers.find(p => p.provider_id === providerId);
    setFormData({
      ...formData,
      provider_id: providerId,
      department: provider?.department || formData.department,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (!submitData.discharge_date) submitData.discharge_date = null;
      
      await api.updateEncounter(id, submitData);
      await fetchEncounter();
      setIsEditing(false);
      alert("Encounter updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to update encounter");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete encounter ${id}? This will fail if the encounter has linked billing records.`)) {
      return;
    }
    try {
      await api.deleteEncounter(id);
      navigate("/encounters");
    } catch (err) {
      alert(err.message || "Failed to delete encounter");
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
      <div className="hp-root">
        <main className="hp-main" style={{ padding: "60px", textAlign: "center", color: "var(--hp-text-soft)" }}>
          Loading encounter...
        </main>
      </div>
    );
  }

  if (error || !encounter) {
    return (
      <div className="hp-root">
        <main className="hp-main" style={{ padding: "60px" }}>
          <div style={{ 
            padding: "20px", 
            backgroundColor: "rgba(220, 53, 69, 0.1)", 
            color: "#dc3545", 
            borderRadius: "8px",
            border: "1px solid rgba(220, 53, 69, 0.3)"
          }}>
            {error || "Encounter not found"}
            <br />
            <Link to="/encounters" className="hp-primary-btn" style={{ marginTop: "16px", display: "inline-block" }}>
              Back to Encounters
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="hp-root">
      <aside className="hp-sidebar">
        <div className="hp-logo">
          <span className="hp-logo-icon">🩺</span>
          <span className="hp-logo-text">Medico</span>
        </div>
        <nav className="hp-nav">
          <p className="hp-nav-title">Main</p>
          <Link to="/" className="hp-nav-item">Dashboard</Link>
          <Link to="/patients" className="hp-nav-item">Patients</Link>
          <Link to="/encounters" className="hp-nav-item hp-nav-item--active">Encounters</Link>
          <Link to="/insurers" className="hp-nav-item">Insurers</Link>
        </nav>
      </aside>

      <main className="hp-main">
        <header className="hp-topbar">
          <div>
            <h1 className="hp-page-title">
              Encounter: {encounter.encounter_id}
            </h1>
            <p className="hp-page-subtitle">
              {encounter.patient_first_name} {encounter.patient_last_name} - {formatDate(encounter.visit_date)}
            </p>
          </div>
          <div className="hp-topbar-actions">
            {!isEditing ? (
              <>
                <Link 
                  to={`/patients/${encounter.patient_id}`}
                  className="hp-secondary-btn"
                >
                  View Patient
                </Link>
                <button className="hp-primary-btn" onClick={() => setIsEditing(true)} style={{ marginLeft: "12px" }}>
                  Edit Encounter
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
                <Link to="/encounters" className="hp-secondary-btn" style={{ marginLeft: "12px" }}>
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
                  1. Patient & Provider
                </h5>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Select Patient *
                    </label>
                    <select
                      required
                      value={formData.patient_id || ""}
                      onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%", padding: "10px" }}
                    >
                      <option value="">Select a patient...</option>
                      {patients.map((patient) => (
                        <option key={patient.patient_id} value={patient.patient_id}>
                          {patient.first_name} {patient.last_name} (ID: {patient.patient_id}) - {patient.age}yo
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Select Provider *
                    </label>
                    <select
                      required
                      value={formData.provider_id || ""}
                      onChange={(e) => handleProviderChange(e.target.value)}
                      className="hp-search"
                      style={{ width: "100%", padding: "10px" }}
                    >
                      <option value="">Select a provider...</option>
                      {providers.map((provider) => (
                        <option key={provider.provider_id} value={provider.provider_id}>
                          {provider.name} ({provider.specialty})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <h5 style={{ color: "var(--hp-primary)", marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>
                  2. Visit Details
                </h5>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Visit Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.visit_date || ""}
                      onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Visit Type
                    </label>
                    <select
                      value={formData.visit_type || ""}
                      onChange={(e) => setFormData({ ...formData, visit_type: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%", padding: "10px" }}
                    >
                      <option value="">Select...</option>
                      {visitTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Department (Auto)
                    </label>
                    <input
                      type="text"
                      className="hp-search"
                      value={formData.department || ""}
                      readOnly
                      placeholder="Auto-filled"
                      style={{ width: "100%", opacity: 0.7, cursor: "not-allowed" }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Reason for Visit
                  </label>
                  <textarea
                    value={formData.reason_for_visit || ""}
                    onChange={(e) => setFormData({ ...formData, reason_for_visit: e.target.value })}
                    rows={3}
                    className="hp-search"
                    style={{ width: "100%", resize: "vertical" }}
                    placeholder="e.g. Chest pain, Follow-up..."
                  />
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <h5 style={{ color: "var(--hp-primary)", marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>
                  3. Clinical & Status
                </h5>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Diagnosis Code (ICD)
                    </label>
                    <input
                      type="text"
                      value={formData.diagnosis_code || ""}
                      onChange={(e) => setFormData({ ...formData, diagnosis_code: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%" }}
                      placeholder="e.g. I10"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Status *
                    </label>
                    <select
                      required
                      value={formData.status || "Scheduled"}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%", padding: "10px" }}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Admission Type
                    </label>
                    <select
                      value={formData.admission_type || ""}
                      onChange={(e) => setFormData({ ...formData, admission_type: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%", padding: "10px" }}
                    >
                      <option value="">None</option>
                      <option value="Elective">Elective</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Discharge Date
                    </label>
                    <input
                      type="date"
                      value={formData.discharge_date || ""}
                      onChange={(e) => setFormData({ ...formData, discharge_date: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Length of Stay (Days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.length_of_stay || 0}
                      onChange={(e) => setFormData({ ...formData, length_of_stay: parseInt(e.target.value) || 0 })}
                      className="hp-search"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.readmitted_flag || false}
                        onChange={(e) => setFormData({ ...formData, readmitted_flag: e.target.checked })}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                      />
                      Patient Readmitted?
                    </label>
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
                  Encounter Information
                </h3>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "8px 0", width: "40%", color: "var(--hp-text-soft)", fontWeight: "500" }}>Encounter ID:</td>
                      <td style={{ padding: "8px 0", fontWeight: "600" }}>{encounter.encounter_id}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Patient:</td>
                      <td style={{ padding: "8px 0" }}>
                        <Link 
                          to={`/patients/${encounter.patient_id}`}
                          style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}
                        >
                          {encounter.patient_first_name} {encounter.patient_last_name}
                        </Link>
                        <br />
                        <small style={{ color: "var(--hp-text-soft)" }}>{encounter.patient_id}</small>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Provider:</td>
                      <td style={{ padding: "8px 0" }}>{encounter.provider_name || encounter.provider_id || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Visit Date:</td>
                      <td style={{ padding: "8px 0" }}>{formatDate(encounter.visit_date)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Visit Type:</td>
                      <td style={{ padding: "8px 0" }}>{encounter.visit_type || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Department:</td>
                      <td style={{ padding: "8px 0" }}>{encounter.department || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Status:</td>
                      <td style={{ padding: "8px 0" }}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "500",
                          backgroundColor: encounter.status === "Completed" ? "rgba(34, 197, 94, 0.2)" : "rgba(251, 191, 36, 0.2)",
                          color: encounter.status === "Completed" ? "#22c55e" : "#fbbf24",
                        }}>
                          {encounter.status || "N/A"}
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
                  Visit Details
                </h3>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "8px 0", width: "40%", color: "var(--hp-text-soft)", fontWeight: "500" }}>Reason for Visit:</td>
                      <td style={{ padding: "8px 0" }}>{encounter.reason_for_visit || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Diagnosis Code:</td>
                      <td style={{ padding: "8px 0" }}>{encounter.diagnosis_code || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Admission Type:</td>
                      <td style={{ padding: "8px 0" }}>{encounter.admission_type || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Discharge Date:</td>
                      <td style={{ padding: "8px 0" }}>{formatDate(encounter.discharge_date)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Length of Stay:</td>
                      <td style={{ padding: "8px 0" }}>{encounter.length_of_stay || 0} days</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Readmitted:</td>
                      <td style={{ padding: "8px 0" }}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "500",
                          backgroundColor: encounter.readmitted_flag ? "rgba(251, 191, 36, 0.2)" : "rgba(34, 197, 94, 0.2)",
                          color: encounter.readmitted_flag ? "#fbbf24" : "#22c55e",
                        }}>
                          {encounter.readmitted_flag ? "Yes" : "No"}
                        </span>
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
  );
};

export default EncounterDetailPage;

