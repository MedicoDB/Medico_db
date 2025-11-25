import React, { useState, useEffect } from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";
import { api } from "../services/api";

const ProceduresPage = () => {
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchProcedures = async () => {
      try {
        setLoading(true);
        const data = await api.getProcedures(100, searchTerm);
        setProcedures(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching procedures:", err);
        setError("Failed to load procedures");
      } finally {
        setLoading(false);
      }
    };

    fetchProcedures();
  }, [searchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <SharedLayout
      title="Procedures"
      subtitle="View procedures linked to encounters and providers, including costs and codes."
      activePage="procedures"
      searchValue={searchTerm}
      onSearchChange={handleSearch}
      onAddNew={() => alert('Add New Procedure feature coming soon!')}
    >
      <div className="page-grid">
        <div className="page-card">
          <h3>🧪 Procedure List</h3>
          <p>Browse all recorded medical procedures in the system.</p>
          <button className="hp-link-btn" onClick={() => window.scrollTo({ top: document.querySelector('.page-section').offsetTop, behavior: 'smooth' })}>View All →</button>
        </div>

        <div className="page-card">
          <h3>➕ Add Procedure</h3>
          <p>Add a new medical procedure associated with encounter & provider.</p>
          <button className="hp-primary-btn" onClick={() => alert('Add Procedure feature coming soon!')}>Add Procedure</button>
        </div>

        <div className="page-card">
          <h3>📊 Procedure Analytics</h3>
          <p>Analyze cost distribution, frequency and provider mapping.</p>
          <button className="hp-secondary-btn" onClick={() => alert('Analytics feature coming soon!')}>View Analytics</button>
        </div>
      </div>

      <div className="page-section">
        <h3>Recent Procedures ({procedures.length} shown)</h3>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading procedures...</div>
        ) : error ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#ff4444' }}>{error}</div>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>Procedure Code</th>
                <th>Description</th>
                <th>Date</th>
                <th>Cost</th>
                <th>Provider</th>
                <th>Patient</th>
              </tr>
            </thead>
            <tbody>
              {procedures.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                    No procedures found
                  </td>
                </tr>
              ) : (
                procedures.map((procedure) => (
                  <tr key={procedure.procedure_id}>
                    <td>{procedure.procedure_code}</td>
                    <td>{procedure.procedure_description || 'N/A'}</td>
                    <td>{procedure.procedure_date ? new Date(procedure.procedure_date).toLocaleDateString() : 'N/A'}</td>
                    <td>${procedure.procedure_cost ? parseFloat(procedure.procedure_cost).toFixed(2) : '0.00'}</td>
                    <td>{procedure.provider_name || 'N/A'}</td>
                    <td>{procedure.first_name} {procedure.last_name}</td>
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

export default ProceduresPage;
