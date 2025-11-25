import React, { useState, useEffect } from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";
import { api } from "../services/api";

const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const data = await api.getPatients(100); // Limit to 100 for display
        // Client-side search since API doesn't support search yet
        const filtered = searchTerm 
          ? data.filter(p => 
              `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.patient_id.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : data;
        setPatients(filtered);
        setError(null);
      } catch (err) {
        console.error("Error fetching patients:", err);
        setError("Failed to load patients");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [searchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <SharedLayout
      title="Patients"
      subtitle="Search and manage patient profiles, demographics and contact information."
      activePage="patients"
      searchValue={searchTerm}
      onSearchChange={handleSearch}
      onAddNew={() => alert('Add Patient feature coming soon!')}
    >
      <div className="page-grid">
        <div className="page-card">
          <h3>👤 Patient List</h3>
          <p>Browse all registered patients in the system.</p>
          <button className="hp-link-btn" onClick={() => window.scrollTo({ top: document.querySelector('.page-section').offsetTop, behavior: 'smooth' })}>View All →</button>
        </div>

        <div className="page-card">
          <h3>➕ Add New Patient</h3>
          <p>Create a new patient profile including demographics, insurance and contacts.</p>
          <button className="hp-primary-btn" onClick={() => alert('Add Patient feature coming soon! This will allow you to create new patient records.')}>Add Patient</button>
        </div>

        <div className="page-card">
          <h3>📊 Demographics</h3>
          <p>View distribution by age, gender, location and insurance coverage.</p>
          <button className="hp-secondary-btn" onClick={() => alert('Analytics feature coming soon!')}>View Analytics</button>
        </div>
      </div>

      <div className="page-section">
        <h3>Patient List ({patients.length} patients)</h3>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading patients...</div>
        ) : error ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#ff4444' }}>{error}</div>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Encounters</th>
                <th>First Visit</th>
                <th>Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                    No patients found
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.patient_id}>
                    <td>{patient.patient_id}</td>
                    <td>{patient.first_name} {patient.last_name}</td>
                    <td>{patient.encounter_count || 0}</td>
                    <td>{patient.first_visit ? new Date(patient.first_visit).toLocaleDateString() : 'N/A'}</td>
                    <td>{patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </SharedLayout>
  );
};

export default PatientsPage;
