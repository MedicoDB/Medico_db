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
  const [_patients, setPatients] = useState([]);
  const [providers, setProviders] = useState([]);
  const [relatedData, setRelatedData] = useState({
    medications: [],
    procedures: [],
    diagnoses: [],
    lab_tests: [],
    claims: []
  });

  const statusOptions = ["Scheduled", "Completed", "In Progress", "Cancelled", "Discharged"];
  const visitTypeOptions = ["Emergency", "Outpatient", "Inpatient", "Surgery", "Follow-up", "Telehealth"];

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
    fetchEncounter();
    fetchOptions();
    fetchRelatedData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchEncounter = async () => {
    try {
      setLoading(true);
      const encounterData = await api.getEncounterById(id);
      setEncounter(encounterData);
      const normalizedVisitDate = normalizeDate(encounterData.visit_date);
      setFormData({
        patient_id: encounterData.patient_id || "",
        provider_id: encounterData.provider_id || "",
        visit_date: normalizedVisitDate || "",
        visit_type: encounterData.visit_type || "",
        department: encounterData.department || "",
        reason_for_visit: encounterData.reason_for_visit || "",
        diagnosis_code: encounterData.diagnosis_code || "",
        admission_type: encounterData.admission_type || "",
        discharge_date: normalizeDate(encounterData.discharge_date),
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

  const fetchRelatedData = async () => {
    try {
      const data = await api.getEncounterRelated(id);
      setRelatedData(data || {
        medications: [],
        procedures: [],
        diagnoses: [],
        lab_tests: [],
        claims: []
      });
    } catch (err) {
      console.error("Error fetching related data:", err);
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
      
      // When editing, if visit_date is not provided, keep the original value
      if (!submitData.visit_date && encounter) {
        const originalVisitDate = normalizeDate(encounter.visit_date);
        if (originalVisitDate) {
          submitData.visit_date = originalVisitDate;
        }
      }
      
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
              <Link to="/encounters" className="hp-nav-item hp-nav-item--active">Encounters</Link>
              <Link to="/insurers" className="hp-nav-item">Insurers</Link>
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
            Loading encounter...
          </main>
        </div>
      </div>
    );
  }

  if (error || !encounter) {
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
              <Link to="/encounters" className="hp-nav-item hp-nav-item--active">Encounters</Link>
              <Link to="/insurers" className="hp-nav-item">Insurers</Link>
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
              {error || "Encounter not found"}
              <br />
              <Link to="/encounters" className="hp-primary-btn" style={{ marginTop: "16px", display: "inline-block" }}>
                Back to Encounters
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
            <Link to="/encounters" className="hp-nav-item hp-nav-item--active">Encounters</Link>
            <Link to="/insurers" className="hp-nav-item">Insurers</Link>
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
                Encounter: {encounter.encounter_id}
              </h1>
              <p style={{ margin: "4px 0 0 0", color: "var(--hp-text-soft)", fontSize: "14px" }}>
                {encounter.patient_first_name} {encounter.patient_last_name} - {formatDate(encounter.visit_date)}
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {!isEditing ? (
              <>
                <button className="hp-primary-btn" onClick={() => setIsEditing(true)}>
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
                      Patient
                    </label>
                    <input
                      type="text"
                      value={encounter.patient_first_name + " " + encounter.patient_last_name + " (" + encounter.patient_id + ")"}
                      readOnly
                      className="hp-search"
                      style={{ width: "100%", opacity: 0.7, cursor: "not-allowed" }}
                    />
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
                      Visit Date
                    </label>
                    <input
                      type="date"
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

          {/* Related Data Sections */}
          {!isEditing && (
            <>
              {/* Medications */}
              <div style={{ 
                backgroundColor: "var(--hp-bg-card)", 
                borderRadius: "var(--hp-radius-lg)", 
                padding: "24px",
                border: "1px solid var(--hp-border)",
                marginTop: "24px"
              }}>
                <h3 style={{ marginTop: 0, marginBottom: "20px", color: "var(--hp-primary)", fontSize: "18px" }}>
                  Medications
                </h3>
                {relatedData.medications.length === 0 ? (
                  <p style={{ color: "var(--hp-text-soft)" }}>No medications found for this encounter.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--hp-border)" }}>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Drug Name</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Dosage</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Route</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Frequency</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Prescriber</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatedData.medications.map((med) => (
                          <tr key={med.medication_id} style={{ borderTop: "1px solid var(--hp-border)" }}>
                            <td style={{ padding: "12px", color: "var(--hp-text-main)" }}>{med.drug_name}</td>
                            <td style={{ padding: "12px", color: "var(--hp-text-soft)" }}>{med.dosage || "N/A"}</td>
                            <td style={{ padding: "12px", color: "var(--hp-text-soft)" }}>{med.route || "N/A"}</td>
                            <td style={{ padding: "12px", color: "var(--hp-text-soft)" }}>{med.frequency || "N/A"}</td>
                            <td style={{ padding: "12px", color: "var(--hp-text-soft)" }}>{med.prescriber_name || "N/A"}</td>
                            <td style={{ padding: "12px", color: "var(--hp-text-soft)" }}>{formatDate(med.prescribed_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Procedures */}
              <div style={{ 
                backgroundColor: "var(--hp-bg-card)", 
                borderRadius: "var(--hp-radius-lg)", 
                padding: "24px",
                border: "1px solid var(--hp-border)",
                marginTop: "24px"
              }}>
                <h3 style={{ marginTop: 0, marginBottom: "20px", color: "var(--hp-primary)", fontSize: "18px" }}>
                  Procedures
                </h3>
                {relatedData.procedures.length === 0 ? (
                  <p style={{ color: "var(--hp-text-soft)" }}>No procedures found for this encounter.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--hp-border)" }}>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Procedure Code</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Description</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Provider</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Date</th>
                          <th style={{ padding: "12px", textAlign: "right", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatedData.procedures.map((proc) => (
                          <tr key={proc.procedure_id} style={{ borderTop: "1px solid var(--hp-border)" }}>
                            <td style={{ padding: "12px", color: "var(--hp-text-main)" }}>{proc.procedure_code}</td>
                            <td style={{ padding: "12px", color: "var(--hp-text-soft)" }}>{proc.procedure_description || "N/A"}</td>
                            <td style={{ padding: "12px", color: "var(--hp-text-soft)" }}>{proc.provider_name || "N/A"}</td>
                            <td style={{ padding: "12px", color: "var(--hp-text-soft)" }}>{formatDate(proc.procedure_date)}</td>
                            <td style={{ padding: "12px", textAlign: "right", color: "var(--hp-text-main)" }}>${(parseFloat(proc.procedure_cost) || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Diagnoses */}
              <div style={{ 
                backgroundColor: "var(--hp-bg-card)", 
                borderRadius: "var(--hp-radius-lg)", 
                padding: "24px",
                border: "1px solid var(--hp-border)",
                marginTop: "24px"
              }}>
                <h3 style={{ marginTop: 0, marginBottom: "20px", color: "var(--hp-primary)", fontSize: "18px" }}>
                  Diagnoses
                </h3>
                {relatedData.diagnoses.length === 0 ? (
                  <p style={{ color: "var(--hp-text-soft)" }}>No diagnoses found for this encounter.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--hp-border)" }}>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Diagnosis Code</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Description</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Primary</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Chronic</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatedData.diagnoses.map((diag) => (
                          <tr key={diag.diagnosis_id} style={{ borderTop: "1px solid var(--hp-border)" }}>
                            <td style={{ padding: "12px", color: "var(--hp-text-main)" }}>{diag.diagnosis_code}</td>
                            <td style={{ padding: "12px", color: "var(--hp-text-soft)" }}>{diag.diagnosis_description || "N/A"}</td>
                            <td style={{ padding: "12px" }}>
                              <span style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "500",
                                backgroundColor: diag.primary_flag ? "rgba(34, 197, 94, 0.2)" : "rgba(148, 163, 184, 0.2)",
                                color: diag.primary_flag ? "#22c55e" : "var(--hp-text-soft)",
                              }}>
                                {diag.primary_flag ? "Yes" : "No"}
                              </span>
                            </td>
                            <td style={{ padding: "12px" }}>
                              <span style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "500",
                                backgroundColor: diag.chronic_flag ? "rgba(251, 191, 36, 0.2)" : "rgba(148, 163, 184, 0.2)",
                                color: diag.chronic_flag ? "#fbbf24" : "var(--hp-text-soft)",
                              }}>
                                {diag.chronic_flag ? "Yes" : "No"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Lab Tests */}
              <div style={{ 
                backgroundColor: "var(--hp-bg-card)", 
                borderRadius: "var(--hp-radius-lg)", 
                padding: "24px",
                border: "1px solid var(--hp-border)",
                marginTop: "24px"
              }}>
                <h3 style={{ marginTop: 0, marginBottom: "20px", color: "var(--hp-primary)", fontSize: "18px" }}>
                  Lab Tests
                </h3>
                {relatedData.lab_tests.length === 0 ? (
                  <p style={{ color: "var(--hp-text-soft)" }}>No lab tests found for this encounter.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--hp-border)" }}>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Test Name</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Code</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Result</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Status</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatedData.lab_tests.map((test) => (
                          <tr key={test.test_id} style={{ borderTop: "1px solid var(--hp-border)" }}>
                            <td style={{ padding: "12px", color: "var(--hp-text-main)" }}>{test.test_name}</td>
                            <td style={{ padding: "12px", color: "var(--hp-text-soft)" }}>{test.test_code}</td>
                            <td style={{ padding: "12px", color: "var(--hp-text-soft)" }}>{test.test_result || "N/A"}</td>
                            <td style={{ padding: "12px" }}>
                              <span style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "500",
                                backgroundColor: test.status === "Completed" ? "rgba(34, 197, 94, 0.2)" : "rgba(148, 163, 184, 0.2)",
                                color: test.status === "Completed" ? "#22c55e" : "var(--hp-text-soft)",
                              }}>
                                {test.status}
                              </span>
                            </td>
                            <td style={{ padding: "12px", color: "var(--hp-text-soft)" }}>{formatDate(test.test_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Claims */}
              <div style={{ 
                backgroundColor: "var(--hp-bg-card)", 
                borderRadius: "var(--hp-radius-lg)", 
                padding: "24px",
                border: "1px solid var(--hp-border)",
                marginTop: "24px"
              }}>
                <h3 style={{ marginTop: 0, marginBottom: "20px", color: "var(--hp-primary)", fontSize: "18px" }}>
                  Claims & Billing
                </h3>
                {relatedData.claims.length === 0 ? (
                  <p style={{ color: "var(--hp-text-soft)" }}>No claims found for this encounter.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--hp-border)" }}>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Billing ID</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Claim Date</th>
                          <th style={{ padding: "12px", textAlign: "right", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Billed</th>
                          <th style={{ padding: "12px", textAlign: "right", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Paid</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatedData.claims.map((claim) => (
                          <tr key={claim.billing_id} style={{ borderTop: "1px solid var(--hp-border)" }}>
                            <td style={{ padding: "12px" }}>
                              <Link 
                                to={`/claims/${claim.billing_id}`}
                                style={{ 
                                  color: "var(--hp-primary)", 
                                  textDecoration: "none",
                                  fontWeight: "500"
                                }}
                              >
                                {claim.billing_id}
                              </Link>
                            </td>
                            <td style={{ padding: "12px", color: "var(--hp-text-soft)" }}>
                              {claim.claim_billing_date ? new Date(claim.claim_billing_date).toLocaleDateString() : "N/A"}
                            </td>
                            <td style={{ padding: "12px", textAlign: "right", color: "var(--hp-text-main)" }}>${(parseFloat(claim.billed_amount) || 0).toFixed(2)}</td>
                            <td style={{ padding: "12px", textAlign: "right", color: "var(--hp-text-soft)" }}>${(parseFloat(claim.paid_amount) || 0).toFixed(2)}</td>
                            <td style={{ padding: "12px" }}>
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default EncounterDetailPage;

