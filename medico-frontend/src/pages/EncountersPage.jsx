import React, { useState, useEffect } from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";
import { api } from "../services/api";

const EncountersPage = () => {
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchEncounters = async () => {
      try {
        setLoading(true);
        const data = await api.getEncounters(100, searchTerm);
        setEncounters(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching encounters:", err);
        setError("Failed to load encounters");
      } finally {
        setLoading(false);
      }
    };

    fetchEncounters();
  }, [searchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <SharedLayout
      title="Encounters"
      subtitle="Track visits, admission details, diagnoses and overall patient journey."
      activePage="encounters"
      searchValue={searchTerm}
      onSearchChange={handleSearch}
      onAddNew={() => alert('Add New Encounter feature coming soon!')}
    >
      <div className="page-grid">
        <div className="page-card">
          <h3>📋 Active Encounters</h3>
          <p>View all ongoing patient visits and admissions.</p>
          <button className="hp-link-btn" onClick={() => window.scrollTo({ top: document.querySelector('.page-section').offsetTop, behavior: 'smooth' })}>Open Dashboard →</button>
        </div>

        <div className="page-card">
          <h3>🧪 New Encounter</h3>
          <p>Create a new encounter and associate with patient and provider records.</p>
          <button className="hp-primary-btn" onClick={() => alert('Start New Encounter feature coming soon!')}>Start New Encounter</button>
        </div>

        <div className="page-card">
          <h3>🕒 Encounter History</h3>
          <p>Search past visits, diagnoses and outcomes by date or provider.</p>
          <button className="hp-secondary-btn" onClick={() => document.querySelector('.hp-search')?.focus()}>Search Records</button>
        </div>
      </div>

      <div className="page-section">
        <h3>Recent Encounters ({encounters.length} shown)</h3>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading encounters...</div>
        ) : error ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#ff4444' }}>{error}</div>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>Encounter ID</th>
                <th>Patient</th>
                <th>Provider</th>
                <th>Date</th>
                <th>Department</th>
                <th>Status</th>
                <th>Diagnosis</th>
              </tr>
            </thead>
            <tbody>
              {encounters.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                    No encounters found
                  </td>
                </tr>
              ) : (
                encounters.map((encounter) => (
                  <tr key={encounter.encounter_id}>
                    <td>{encounter.encounter_id}</td>
                    <td>{encounter.first_name} {encounter.last_name}</td>
                    <td>{encounter.provider_name || 'N/A'}</td>
                    <td>{encounter.visit_date ? new Date(encounter.visit_date).toLocaleDateString() : 'N/A'}</td>
                    <td>{encounter.department || 'N/A'}</td>
                    <td>{encounter.status || 'N/A'}</td>
                    <td>{encounter.diagnosis_code || 'N/A'}</td>
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

export default EncountersPage;
