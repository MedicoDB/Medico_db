import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import "../HomePage.css";

const MedicationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medication, setMedication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [_encounterOptions, setEncounterOptions] = useState([]);
  const [_prescriberOptions, setPrescriberOptions] = useState([]);
  const [_encounterSearchTerm, setEncounterSearchTerm] = useState("");
  const [_prescriberSearchTerm, setPrescriberSearchTerm] = useState("");
  const [_showEncounterDropdown, _setShowEncounterDropdown] = useState(false);
  const [_showPrescriberDropdown, _setShowPrescriberDropdown] = useState(false);

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
    fetchMedication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchMedication = async () => {
    try {
      setLoading(true);
      const medicationData = await api.getMedicationById(id);
      setMedication(medicationData);
      const normalizedDate = normalizeDate(medicationData.prescribed_date);
      setFormData({
        encounter_id: medicationData.encounter_id || "",
        drug_name: medicationData.drug_name || "",
        dosage: medicationData.dosage || "",
        route: medicationData.route || "",
        frequency: medicationData.frequency || "",
        duration: medicationData.duration || "",
        prescribed_date: normalizedDate || "",
        prescriber_id: medicationData.prescriber_id || "",
        cost: medicationData.cost || 0,
      });
      setError(null);
    } catch (err) {
      console.error("Error fetching medication:", err);
      setError(err.message || "Failed to load medication");
    } finally {
      setLoading(false);
    }
  };

  const fetchEncounterOptions = async (search = "") => {
    try {
      const options = await api.getMedicationsEncounterOptions(search, 50);
      setEncounterOptions(options);
      const currentEncounter = options.find(e => e.encounter_id === formData.encounter_id);
      if (currentEncounter) {
        setEncounterSearchTerm(`${currentEncounter.encounter_id} - ${currentEncounter.patient_first_name || ""} ${currentEncounter.patient_last_name || ""}`);
      }
    } catch (err) {
      console.error("Error fetching encounters:", err);
    }
  };

  const fetchPrescriberOptions = async (search = "") => {
    try {
      const options = await api.getPrescribersOptions(search, 50);
      setPrescriberOptions(options);
      const currentPrescriber = options.find(p => p.provider_id === formData.prescriber_id);
      if (currentPrescriber) {
        setPrescriberSearchTerm(`${currentPrescriber.provider_id} - ${currentPrescriber.name}`);
      }
    } catch (err) {
      console.error("Error fetching prescribers:", err);
    }
  };

  useEffect(() => {
    if (isEditing) {
      if (formData.encounter_id) fetchEncounterOptions();
      if (formData.prescriber_id) fetchPrescriberOptions();
    }
  }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      submitData.cost = parseFloat(submitData.cost) || 0;
      
      // When editing, if prescribed_date is not provided, keep the original value
      if (!submitData.prescribed_date && medication) {
        const originalDate = normalizeDate(medication.prescribed_date);
        if (originalDate) {
          submitData.prescribed_date = originalDate;
        }
      }
      
      await api.updateMedication(id, submitData);
      await fetchMedication();
      setIsEditing(false);
      alert("Medication updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to update medication");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete medication ${id}?`)) {
      return;
    }
    try {
      await api.deleteMedication(id);
      navigate("/medications");
    } catch (err) {
      alert(err.message || "Failed to delete medication");
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
              <Link to="/lab-tests" className="hp-nav-item">Lab Tests</Link>
              <Link to="/medications" className="hp-nav-item hp-nav-item--active">Medications</Link>
              <Link to="/diagnoses" className="hp-nav-item">Diagnoses</Link>
              <Link to="/providers" className="hp-nav-item">Providers</Link>
              <Link to="/department-heads" className="hp-nav-item">Department Heads</Link>
            </nav>
          </div>
          <main style={{ flex: 1, padding: "60px", textAlign: "center", color: "var(--hp-text-soft)" }}>
            Loading medication...
          </main>
        </div>
      </div>
    );
  }

  if (error || !medication) {
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
              <Link to="/medications" className="hp-nav-item hp-nav-item--active">Medications</Link>
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
              {error || "Medication not found"}
              <br />
              <Link to="/medications" className="hp-primary-btn" style={{ marginTop: "16px", display: "inline-block" }}>
                Back to Medications
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
            <Link to="/medications" className="hp-nav-item hp-nav-item--active">Medications</Link>
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
                Medication: {medication.medication_id}
              </h1>
              <p style={{ margin: "4px 0 0 0", color: "var(--hp-text-soft)", fontSize: "14px" }}>
                {medication.first_name} {medication.last_name} - {formatDate(medication.prescribed_date)}
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {!isEditing ? (
              <>
                <button className="hp-primary-btn" onClick={() => setIsEditing(true)}>
                  Edit Medication
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
                <Link to="/medications" className="hp-secondary-btn" style={{ marginLeft: "12px" }}>
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
                  Medication Information
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
                      Drug Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.drug_name || ""}
                      onChange={(e) => setFormData({ ...formData, drug_name: e.target.value })}
                      className="hp-search"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        Dosage
                      </label>
                      <input
                        type="text"
                        value={formData.dosage || ""}
                        onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                        className="hp-search"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        Route
                      </label>
                      <input
                        type="text"
                        value={formData.route || ""}
                        onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                        className="hp-search"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        Frequency
                      </label>
                      <input
                        type="text"
                        value={formData.frequency || ""}
                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                        className="hp-search"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        Duration
                      </label>
                      <input
                        type="text"
                        value={formData.duration || ""}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        className="hp-search"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Prescriber
                    </label>
                    <input
                      type="text"
                      value={medication.prescriber_name || medication.prescriber_id || ""}
                      readOnly
                      className="hp-search"
                      style={{ width: "100%", opacity: 0.7, cursor: "not-allowed" }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        Prescribed Date
                      </label>
                      <input
                        type="date"
                        value={formData.prescribed_date || ""}
                        onChange={(e) => setFormData({ ...formData, prescribed_date: e.target.value })}
                        className="hp-search"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        Cost
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.cost || 0}
                        onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                        className="hp-search"
                        style={{ width: "100%" }}
                      />
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
                  Medication Information
                </h3>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "8px 0", width: "40%", color: "var(--hp-text-soft)", fontWeight: "500" }}>Medication ID:</td>
                      <td style={{ padding: "8px 0", fontWeight: "600" }}>{medication.medication_id}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Drug Name:</td>
                      <td style={{ padding: "8px 0", fontWeight: "600" }}>{medication.drug_name}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Patient:</td>
                      <td style={{ padding: "8px 0" }}>
                        <Link 
                          to={`/patients/${medication.patient_id}`}
                          style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}
                        >
                          {medication.first_name} {medication.last_name}
                        </Link>
                        <br />
                        <small style={{ color: "var(--hp-text-soft)" }}>{medication.patient_id}</small>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Encounter:</td>
                      <td style={{ padding: "8px 0" }}>
                        <Link 
                          to={`/encounters/${medication.encounter_id}`}
                          style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}
                        >
                          {medication.encounter_id}
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Prescriber:</td>
                      <td style={{ padding: "8px 0" }}>
                        {medication.prescriber_name || medication.prescriber_id || "N/A"}
                        {medication.prescriber_specialty && (
                          <>
                            <br />
                            <small style={{ color: "var(--hp-text-soft)" }}>{medication.prescriber_specialty}</small>
                          </>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Prescribed Date:</td>
                      <td style={{ padding: "8px 0" }}>{formatDate(medication.prescribed_date)}</td>
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
                  Prescription Details
                </h3>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "8px 0", width: "40%", color: "var(--hp-text-soft)", fontWeight: "500" }}>Dosage:</td>
                      <td style={{ padding: "8px 0" }}>{medication.dosage || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Route:</td>
                      <td style={{ padding: "8px 0" }}>{medication.route || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Frequency:</td>
                      <td style={{ padding: "8px 0" }}>{medication.frequency || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Duration:</td>
                      <td style={{ padding: "8px 0" }}>{medication.duration || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Cost:</td>
                      <td style={{ padding: "8px 0", fontWeight: "600", fontSize: "16px" }}>
                        ${(parseFloat(medication.cost) || 0).toFixed(2)}
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

export default MedicationDetailPage;

