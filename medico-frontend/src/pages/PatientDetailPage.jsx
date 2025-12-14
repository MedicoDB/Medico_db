import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import "../HomePage.css";

const PatientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [insurers, setInsurers] = useState([]);

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
    fetchPatient();
    fetchInsurers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const patientData = await api.getPatientById(id);
      setPatient(patientData);
      const dob = normalizeDate(patientData.dob);
      
      setFormData({
        first_name: patientData.first_name || "",
        last_name: patientData.last_name || "",
        dob: dob,
        age: patientData.age || "", // Age comes from database
        gender: patientData.gender || "",
        ethnicity: patientData.ethnicity || "",
        insurance_type: patientData.insurance_type || "",
        marital_status: patientData.marital_status || "",
        address: patientData.address || "",
        city: patientData.city || "",
        state: patientData.state || "",
        zip: patientData.zip || "",
        phone: patientData.phone || "",
        email: patientData.email || "",
        registration_date: normalizeDate(patientData.registration_date),
      });
      
      // Fetch encounters for this patient
      const queryParams = new URLSearchParams();
      queryParams.append('limit', '10000');
      queryParams.append('page', '1');
      queryParams.append('patient_id', id);
      const response = await fetch(`/api/encounters/?${queryParams}`);
      if (response.ok) {
        const encountersData = await response.json();
        // Handle both old format (array) and new format (object with data)
        if (Array.isArray(encountersData)) {
          setEncounters(encountersData);
        } else if (encountersData && encountersData.data) {
          setEncounters(encountersData.data);
        } else {
          setEncounters([]);
        }
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching patient:", err);
      setError(err.message || "Failed to load patient");
    } finally {
      setLoading(false);
    }
  };

  const fetchInsurers = async () => {
    try {
      const data = await api.getInsurers();
      setInsurers(data || []);
    } catch (err) {
      console.error("Error fetching insurers:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      // Remove age from submit - backend calculates it using SQL TIMESTAMPDIFF
      delete submitData.age;
      
      // Validate required fields - dob is optional when editing
      if (!submitData.first_name || !submitData.last_name || !submitData.gender) {
        alert("Please fill in all required fields: First Name, Last Name, and Gender");
        return;
      }
      
      // When editing, if dob is not provided, keep the original value
      if (!submitData.dob && patient) {
        const originalDob = normalizeDate(patient.dob);
        if (originalDob) {
          submitData.dob = originalDob;
        }
      }
      
      await api.updatePatient(id, submitData);
      await fetchPatient(); // Fetch updated patient from database (age is already in DB)
      setIsEditing(false);
      alert("Patient updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to update patient");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete patient ${id}? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.deletePatient(id);
      navigate("/patients");
    } catch (err) {
      alert(err.message || "Failed to delete patient");
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
              <Link to="/patients" className="hp-nav-item hp-nav-item--active">Patients</Link>
              <Link to="/encounters" className="hp-nav-item">Encounters</Link>
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
            Loading patient...
          </main>
        </div>
      </div>
    );
  }

  if (error || !patient) {
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
              <Link to="/patients" className="hp-nav-item hp-nav-item--active">Patients</Link>
              <Link to="/encounters" className="hp-nav-item">Encounters</Link>
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
              {error || "Patient not found"}
              <br />
              <Link to="/patients" className="hp-primary-btn" style={{ marginTop: "16px", display: "inline-block" }}>
                Back to Patients
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
            <Link to="/patients" className="hp-nav-item hp-nav-item--active">Patients</Link>
            <Link to="/encounters" className="hp-nav-item">Encounters</Link>
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
                Patient: {patient.first_name} {patient.last_name}
              </h1>
              <p style={{ margin: "4px 0 0 0", color: "var(--hp-text-soft)", fontSize: "14px" }}>
                Patient ID: {patient.patient_id}
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {!isEditing ? (
              <>
                <button className="hp-primary-btn" onClick={() => setIsEditing(true)}>
                  Edit Patient
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
                <Link to="/patients" className="hp-secondary-btn" style={{ marginLeft: "12px" }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dob || ""}
                    onChange={(e) => {
                      // Age will be calculated by backend SQL TIMESTAMPDIFF when saving
                      setFormData({ ...formData, dob: e.target.value });
                    }}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Age (Auto-calculated from DOB)
                  </label>
                  <input
                    type="text"
                    value={formData.age ? `${formData.age} years` : "Will be calculated from Date of Birth"}
                    readOnly
                    disabled
                    className="hp-search"
                    style={{ width: "100%", opacity: 0.7, cursor: "not-allowed", backgroundColor: "rgba(148, 163, 184, 0.1)" }}
                    title="Age is automatically calculated from Date of Birth using SQL TIMESTAMPDIFF"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%", padding: "10px" }}
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Ethnicity
                  </label>
                  <input
                    type="text"
                    value={formData.ethnicity}
                    onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Insurance Provider
                  </label>
                  <select
                    value={formData.insurance_type}
                    onChange={(e) => setFormData({ ...formData, insurance_type: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%", padding: "10px" }}
                  >
                    <option value="">No Insurance</option>
                    {insurers.map((insurer) => (
                      <option key={insurer.code} value={insurer.code}>
                        {insurer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Marital Status
                  </label>
                  <select
                    value={formData.marital_status}
                    onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%", padding: "10px" }}
                  >
                    <option value="">Select...</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--hp-text-main)", fontSize: "14px" }}>
                    Registration Date
                  </label>
                  <input
                    type="date"
                    value={formData.registration_date}
                    onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                    className="hp-search"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </form>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                <div style={{ 
                  backgroundColor: "var(--hp-bg-card)", 
                  borderRadius: "var(--hp-radius-lg)", 
                  padding: "24px",
                  border: "1px solid var(--hp-border)"
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: "20px", color: "var(--hp-primary)", fontSize: "18px" }}>
                    Personal Information
                  </h3>
                  <table style={{ width: "100%" }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: "8px 0", width: "40%", color: "var(--hp-text-soft)", fontWeight: "500" }}>Patient ID:</td>
                        <td style={{ padding: "8px 0", fontWeight: "600" }}>{patient.patient_id}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Name:</td>
                        <td style={{ padding: "8px 0" }}>{patient.first_name} {patient.last_name}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Date of Birth:</td>
                        <td style={{ padding: "8px 0" }}>{formatDate(patient.dob)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Age:</td>
                        <td style={{ padding: "8px 0" }}>{patient.age || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Gender:</td>
                        <td style={{ padding: "8px 0" }}>{patient.gender || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Ethnicity:</td>
                        <td style={{ padding: "8px 0" }}>{patient.ethnicity || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Marital Status:</td>
                        <td style={{ padding: "8px 0" }}>{patient.marital_status || "N/A"}</td>
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
                    Contact & Insurance
                  </h3>
                  <table style={{ width: "100%" }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: "8px 0", width: "40%", color: "var(--hp-text-soft)", fontWeight: "500" }}>Address:</td>
                        <td style={{ padding: "8px 0" }}>{patient.address || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>City:</td>
                        <td style={{ padding: "8px 0" }}>{patient.city || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>State:</td>
                        <td style={{ padding: "8px 0" }}>{patient.state || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>ZIP:</td>
                        <td style={{ padding: "8px 0" }}>{patient.zip || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Phone:</td>
                        <td style={{ padding: "8px 0" }}>{patient.phone || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Email:</td>
                        <td style={{ padding: "8px 0" }}>{patient.email || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Insurance:</td>
                        <td style={{ padding: "8px 0" }}>{patient.insurance_name || patient.insurance_type || "No Insurance"}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: "var(--hp-text-soft)", fontWeight: "500" }}>Registration Date:</td>
                        <td style={{ padding: "8px 0" }}>{formatDate(patient.registration_date)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Encounters */}
              <div style={{ 
                backgroundColor: "var(--hp-bg-card)", 
                borderRadius: "var(--hp-radius-lg)", 
                padding: "24px",
                border: "1px solid var(--hp-border)"
              }}>
                <h3 style={{ marginTop: 0, marginBottom: "20px", color: "var(--hp-primary)", fontSize: "18px" }}>
                  Encounters
                </h3>
                {encounters.length === 0 ? (
                  <p style={{ color: "var(--hp-text-soft)" }}>No encounters found for this patient.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--hp-border)" }}>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Encounter ID</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Visit Date</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Type</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Department</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Provider</th>
                          <th style={{ padding: "12px", textAlign: "left", color: "var(--hp-text-soft)", fontWeight: "600", fontSize: "13px" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {encounters.map((encounter) => (
                          <tr key={encounter.encounter_id} style={{ borderTop: "1px solid var(--hp-border)" }}>
                            <td style={{ padding: "12px" }}>
                              <Link 
                                to={`/encounters/${encounter.encounter_id}`}
                                style={{ 
                                  color: "var(--hp-primary)", 
                                  textDecoration: "none",
                                  fontWeight: "500"
                                }}
                              >
                                {encounter.encounter_id}
                              </Link>
                            </td>
                            <td style={{ padding: "12px", color: "var(--hp-text-soft)" }}>{formatDate(encounter.visit_date)}</td>
                            <td style={{ padding: "12px", color: "var(--hp-text-soft)" }}>{encounter.visit_type || "N/A"}</td>
                            <td style={{ padding: "12px", color: "var(--hp-text-soft)" }}>{encounter.department || "N/A"}</td>
                            <td style={{ padding: "12px", color: "var(--hp-text-soft)" }}>{encounter.provider_name || "N/A"}</td>
                            <td style={{ padding: "12px" }}>
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

export default PatientDetailPage;

