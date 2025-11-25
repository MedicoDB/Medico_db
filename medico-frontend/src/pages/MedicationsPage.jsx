import React, { useState, useEffect } from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";
import { api } from "../services/api";

const MedicationsPage = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchMedications = async () => {
      try {
        setLoading(true);
        const data = await api.getMedications(100, searchTerm);
        setMedications(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching medications:", err);
        setError("Failed to load medications");
      } finally {
        setLoading(false);
      }
    };

    fetchMedications();
  }, [searchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <SharedLayout
      title="Medications"
      subtitle="Review medication history, prescribed dosages and prescriber information."
      activePage="medications"
      searchValue={searchTerm}
      onSearchChange={handleSearch}
      onAddNew={() => alert('Add New Medication feature coming soon!')}
    >
      <div className="page-grid">
        <div className="page-card">
          <h3>💊 Medication List</h3>
          <p>Explore all prescribed medications across patient records.</p>
          <button className="hp-link-btn" onClick={() => window.scrollTo({ top: document.querySelector('.page-section').offsetTop, behavior: 'smooth' })}>View All →</button>
        </div>

        <div className="page-card">
          <h3>➕ Add Medication</h3>
          <p>Create a new medication entry for a patient & encounter.</p>
          <button className="hp-primary-btn" onClick={() => alert('Add Medication feature coming soon!')}>Add Medication</button>
        </div>

        <div className="page-card">
          <h3>📈 Medication Stats</h3>
          <p>Check top prescribed drugs, dosage patterns and more.</p>
          <button className="hp-secondary-btn" onClick={() => alert('Analytics feature coming soon!')}>View Analytics</button>
        </div>
      </div>

      <div className="page-section">
        <h3>Recent Medications ({medications.length} shown)</h3>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading medications...</div>
        ) : error ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#ff4444' }}>{error}</div>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>Drug Name</th>
                <th>Dosage</th>
                <th>Route</th>
                <th>Prescriber</th>
                <th>Date</th>
                <th>Patient</th>
              </tr>
            </thead>
            <tbody>
              {medications.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                    No medications found
                  </td>
                </tr>
              ) : (
                medications.map((medication) => (
                  <tr key={medication.medication_id}>
                    <td>{medication.drug_name}</td>
                    <td>{medication.dosage || 'N/A'}</td>
                    <td>{medication.route || 'N/A'}</td>
                    <td>{medication.prescriber_name || 'N/A'}</td>
                    <td>{medication.prescribed_date ? new Date(medication.prescribed_date).toLocaleDateString() : 'N/A'}</td>
                    <td>{medication.first_name} {medication.last_name}</td>
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

export default MedicationsPage;
