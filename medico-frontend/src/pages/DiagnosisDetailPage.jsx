import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import "../HomePage.css";

const DiagnosisDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [encounterOptions, setEncounterOptions] = useState([]);
  const [encounterSearchTerm, setEncounterSearchTerm] = useState("");
  const [showEncounterDropdown, setShowEncounterDropdown] = useState(false);
  const [diagnosisCodeOptions, setDiagnosisCodeOptions] = useState([]);
  const [diagnosisCodeSearchTerm, setDiagnosisCodeSearchTerm] = useState("");
  const [showDiagnosisCodeDropdown, setShowDiagnosisCodeDropdown] = useState(false);

  useEffect(() => {
    fetchDiagnosis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDiagnosis = async () => {
    try {
      setLoading(true);
      const diagnosisData = await api.getDiagnosisById(id);
      setDiagnosis(diagnosisData);
      setFormData({
        encounter_id: diagnosisData.encounter_id || "",
        diagnosis_code: diagnosisData.diagnosis_code || "",
        diagnosis_description: diagnosisData.diagnosis_description || "",
        primary_flag: diagnosisData.primary_flag ? "1" : "0",
        chronic_flag: diagnosisData.chronic_flag !== null ? (diagnosisData.chronic_flag ? "1" : "0") : "",
      });
      setDiagnosisCodeSearchTerm(diagnosisData.diagnosis_code || "");
      setError(null);
    } catch (err) {
      console.error("Error fetching diagnosis:", err);
      setError(err.message || "Failed to load diagnosis");
    } finally {
      setLoading(false);
    }
  };

  const fetchEncounterOptions = async (search = "") => {
    try {
      const options = await api.getDiagnosesEncounterOptions(search, 50);
      setEncounterOptions(options);
      const currentEncounter = options.find(e => e.encounter_id === formData.encounter_id);
      if (currentEncounter) {
        setEncounterSearchTerm(`${currentEncounter.encounter_id} - ${currentEncounter.patient_first_name || ""} ${currentEncounter.patient_last_name || ""}`);
      }
    } catch (err) {
      console.error("Error fetching encounters:", err);
    }
  };

  const fetchDiagnosisCodes = async () => {
    try {
      const codes = await api.getDiagnosisCodes();
      setDiagnosisCodeOptions(codes);
    } catch (err) {
      console.error("Error fetching diagnosis codes:", err);
    }
  };

  useEffect(() => {
    if (isEditing) {
      if (formData.encounter_id) fetchEncounterOptions();
      fetchDiagnosisCodes();
    }
  }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      submitData.primary_flag = submitData.primary_flag === "1";
      submitData.chronic_flag = submitData.chronic_flag === "" ? null : (submitData.chronic_flag === "1");
      await api.updateDiagnosis(id, submitData);
      await fetchDiagnosis();
      setIsEditing(false);
      alert("Diagnosis updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to update diagnosis");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete diagnosis ${id}?`)) {
      return;
    }
    try {
      await api.deleteDiagnosis(id);
      navigate("/diagnoses");
    } catch (err) {
      alert(err.message || "Failed to delete diagnosis");
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
              <Link to="/diagnoses" className="hp-nav-item hp-nav-item--active">Diagnoses</Link>
              <Link to="/providers" className="hp-nav-item">Providers</Link>
              <Link to="/department-heads" className="hp-nav-item">Department Heads</Link>
            </nav>
          </div>
          <main style={{ flex: 1, padding: "60px", textAlign: "center", color: "var(--hp-text-soft)" }}>
            Loading diagnosis...
          </main>
        </div>
      </div>
    );
  }

  if (error || !diagnosis) {
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
              <Link to="/diagnoses" className="hp-nav-item hp-nav-item--active">Diagnoses</Link>
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
              {error || "Diagnosis not found"}
              <br />
              <Link to="/diagnoses" className="hp-primary-btn" style={{ marginTop: "16px", display: "inline-block" }}>
                Back to Diagnoses
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
            <Link to="/diagnoses" className="hp-nav-item hp-nav-item--active">Diagnoses</Link>
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
                Diagnosis: {diagnosis.diagnosis_id}
              </h1>
              <p style={{ margin: "4px 0 0 0", color: "var(--hp-text-soft)", fontSize: "14px" }}>
                {diagnosis.first_name} {diagnosis.last_name} - {diagnosis.diagnosis_code}
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {!isEditing ? (
              <>
                <button className="hp-primary-btn" onClick={() => setIsEditing(true)}>
                  Edit Diagnosis
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
                <Link to="/diagnoses" className="hp-secondary-btn" style={{ marginLeft: "12px" }}>
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
                  Diagnosis Information
                </h5>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Encounter ID *
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        value={formData.encounter_id || ""}
                        readOnly
                        className="hp-search"
                        style={{ width: "100%", opacity: 0.7, cursor: "not-allowed" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                      Diagnosis Code *
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        required
                        value={diagnosisCodeSearchTerm}
                        onChange={(e) => {
                          setDiagnosisCodeSearchTerm(e.target.value);
                          setFormData({ ...formData, diagnosis_code: e.target.value });
                          setShowDiagnosisCodeDropdown(true);
                        }}
                        onFocus={() => setShowDiagnosisCodeDropdown(true)}
                        placeholder="Select or type diagnosis code..."
                        className="hp-search"
                        style={{ width: "100%" }}
                      />
                      {showDiagnosisCodeDropdown && diagnosisCodeOptions.length > 0 && (
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
                          {diagnosisCodeOptions
                            .filter(code => 
                              !diagnosisCodeSearchTerm || 
                              code.diagnosis_code.toLowerCase().includes(diagnosisCodeSearchTerm.toLowerCase()) ||
                              (code.diagnosis_description && code.diagnosis_description.toLowerCase().includes(diagnosisCodeSearchTerm.toLowerCase()))
                            )
                            .map((code) => (
                              <div
                                key={code.diagnosis_code}
                                style={{
                                  padding: "12px",
                                  cursor: "pointer",
                                  borderBottom: "1px solid var(--hp-border)",
                                  color: "var(--hp-text-main)"
                                }}
                                onClick={() => {
                                  setFormData({ 
                                    ...formData, 
                                    diagnosis_code: code.diagnosis_code,
                                    diagnosis_description: code.diagnosis_description || formData.diagnosis_description 
                                  });
                                  setDiagnosisCodeSearchTerm(code.diagnosis_code);
                                  setShowDiagnosisCodeDropdown(false);
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(148, 163, 184, 0.1)"}
                                onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                              >
                                <div style={{ fontWeight: "500" }}>{code.diagnosis_code}</div>
                                {code.diagnosis_description && (
                                  <div style={{ fontSize: "12px", color: "var(--hp-text-soft)" }}>
                                    {code.diagnosis_description}
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
                      Diagnosis Description
                    </label>
                    <textarea
                      value={formData.diagnosis_description || ""}
                      onChange={(e) => setFormData({ ...formData, diagnosis_description: e.target.value })}
                      className="hp-search"
                      rows="3"
                      style={{ width: "100%", resize: "vertical" }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        Primary Flag
                      </label>
                      <select
                        value={formData.primary_flag}
                        onChange={(e) => setFormData({ ...formData, primary_flag: e.target.value })}
                        className="hp-search"
                        style={{ width: "100%" }}
                      >
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                        Chronic Flag
                      </label>
                      <select
                        value={formData.chronic_flag}
                        onChange={(e) => setFormData({ ...formData, chronic_flag: e.target.value })}
                        className="hp-search"
                        style={{ width: "100%" }}
                      >
                        <option value="">Not Specified</option>
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                      </select>
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
                  Diagnosis Information
                </h3>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "8px 0", width: "40%", color: "var(--hp-text-soft)", fontWeight: "500" }}>Diagnosis ID:</td>
                      <td style={{ padding: "8px 0", fontWeight: "600" }}>{diagnosis.diagnosis_id}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Diagnosis Code:</td>
                      <td style={{ padding: "8px 0", fontWeight: "600" }}>{diagnosis.diagnosis_code}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Patient:</td>
                      <td style={{ padding: "8px 0" }}>
                        <Link 
                          to={`/patients/${diagnosis.patient_id}`}
                          style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}
                        >
                          {diagnosis.first_name} {diagnosis.last_name}
                        </Link>
                        <br />
                        <small style={{ color: "var(--hp-text-soft)" }}>{diagnosis.patient_id}</small>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Encounter:</td>
                      <td style={{ padding: "8px 0" }}>
                        <Link 
                          to={`/encounters/${diagnosis.encounter_id}`}
                          style={{ color: "var(--hp-primary)", textDecoration: "none", fontWeight: "500" }}
                        >
                          {diagnosis.encounter_id}
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Primary Flag:</td>
                      <td style={{ padding: "8px 0" }}>{diagnosis.primary_flag ? "Yes" : "No"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Chronic Flag:</td>
                      <td style={{ padding: "8px 0" }}>{diagnosis.chronic_flag === null ? "Not Specified" : (diagnosis.chronic_flag ? "Yes" : "No")}</td>
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
                  Description
                </h3>
                <p style={{ color: "var(--hp-text-main)", lineHeight: "1.6" }}>
                  {diagnosis.diagnosis_description || "No description provided"}
                </p>
              </div>
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DiagnosisDetailPage;

