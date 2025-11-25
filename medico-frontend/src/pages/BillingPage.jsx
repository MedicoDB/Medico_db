import React, { useState, useEffect } from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";
import { api } from "../services/api";

const BillingPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoading(true);
        const data = await api.getClaims();
        const filtered = searchTerm 
          ? data.filter(c => 
              c.billing_id?.toString().includes(searchTerm) ||
              c.patient_id?.toString().includes(searchTerm) ||
              c.claim_status?.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : data.slice(0, 100); // Limit to 100 for display
        setClaims(filtered);
        setError(null);
      } catch (err) {
        console.error("Error fetching claims:", err);
        setError("Failed to load claims");
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [searchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <SharedLayout
      title="Billing & Claims"
      subtitle="Manage billing, claims, and payment information."
      activePage="billing"
      searchValue={searchTerm}
      onSearchChange={handleSearch}
      onAddNew={() => alert('Add New Claim feature coming soon!')}
    >
      <div className="page-grid">
        <div className="page-card">
          <h3>💰 Claims Overview</h3>
          <p>View all billing claims and their status.</p>
          <button className="hp-link-btn" onClick={() => window.scrollTo({ top: document.querySelector('.page-section').offsetTop, behavior: 'smooth' })}>View All →</button>
        </div>

        <div className="page-card">
          <h3>➕ New Claim</h3>
          <p>Create a new billing claim for a patient encounter.</p>
          <button className="hp-primary-btn" onClick={() => alert('Add New Claim feature coming soon!')}>Add Claim</button>
        </div>

        <div className="page-card">
          <h3>📊 Claims Analytics</h3>
          <p>Analyze claim approval rates and payment trends.</p>
          <button className="hp-secondary-btn" onClick={() => alert('Analytics feature coming soon!')}>View Analytics</button>
        </div>
      </div>

      <div className="page-section">
        <h3>Claims & Billing ({claims.length} shown)</h3>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading claims...</div>
        ) : error ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#ff4444' }}>{error}</div>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>Billing ID</th>
                <th>Patient ID</th>
                <th>Encounter ID</th>
                <th>Insurance</th>
                <th>Billed Amount</th>
                <th>Paid Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {claims.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                    No claims found
                  </td>
                </tr>
              ) : (
                claims.map((claim) => (
                  <tr key={claim.billing_id}>
                    <td>{claim.billing_id}</td>
                    <td>{claim.patient_id}</td>
                    <td>{claim.encounter_id}</td>
                    <td>{claim.insurance_provider || 'N/A'}</td>
                    <td>${claim.billed_amount ? parseFloat(claim.billed_amount).toFixed(2) : '0.00'}</td>
                    <td>${claim.paid_amount ? parseFloat(claim.paid_amount).toFixed(2) : '0.00'}</td>
                    <td>{claim.claim_status || 'N/A'}</td>
                    <td>{claim.claim_billing_date ? new Date(claim.claim_billing_date).toLocaleDateString() : 'N/A'}</td>
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

export default BillingPage;

