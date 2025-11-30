import React, { useState, useEffect } from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";
import { api } from "../services/api";

const PAGE_SIZE = 50;

const emptyClaim = {
  patient_id: "",
  encounter_id: "",
  insurance_provider: "",
  payment_method: "",
  billed_amount: "",
  paid_amount: "",
  claim_status: "Pending",
  claim_billing_date: "",
};

const BillingPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState(null);
  const [newClaim, setNewClaim] = useState(emptyClaim);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoading(true);
        const { data, total } = await api.getClaims(PAGE_SIZE, page * PAGE_SIZE, searchTerm);

        if (page > 0 && data.length === 0 && total > 0) {
          setPage((prev) => Math.max(prev - 1, 0));
          return;
        }

        setClaims(data);
        setTotal(total);
        setError(null);
      } catch (err) {
        console.error("Error fetching claims:", err);
        setError("Failed to load claims");
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [searchTerm, refreshKey, page]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewClaim((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddClaim = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!newClaim.patient_id || !newClaim.encounter_id) {
      setFormError("Patient ID and Encounter ID are required.");
      return;
    }
    try {
      await api.createClaim({
        ...newClaim,
        billed_amount: Number(newClaim.billed_amount) || 0,
        paid_amount: Number(newClaim.paid_amount) || 0,
      });
      setNewClaim(emptyClaim);
      setShowAddForm(false);
      setPage(0);
      setRefreshKey((prev) => prev + 1);
      alert("Claim added.");
    } catch (err) {
      console.error(err);
      setFormError("Failed to add claim. Verify patient/encounter IDs.");
    }
  };

  const handleDeleteClaim = async (billingId) => {
    if (!window.confirm("Delete this claim?")) return;
    try {
      await api.deleteClaim(billingId);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      alert("Unable to delete claim.");
    }
  };

  const canPrev = page > 0;
  const canNext = (page + 1) * PAGE_SIZE < total;
  const start = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = total === 0 ? 0 : Math.min(total, page * PAGE_SIZE + claims.length);

  return (
    <SharedLayout
      title="Billing & Claims"
      subtitle="Manage billing, claims, and payment information."
      activePage="billing"
      showSearch={false}   // 🔥 sağ üst search kapalı
      showAddNew={false}   // 🔥 sağ üst +New kapalı
    >
      {/* 🔥 Başlık altına Search + New Claim */}
      <div className="hp-search-new-container" style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px" }}>
        <input
          className="hp-search hp-search--big"
          placeholder="Search claims, patients, encounters..."
          value={searchTerm}
          onChange={handleSearch}
          style={{ flex: "1", maxWidth: "500px" }}
        />
        <button className="hp-primary-btn" onClick={() => setShowAddForm((prev) => !prev)}>
          + New Claim
        </button>
      </div>

      <div className="page-grid">
        <div className="page-card">
          <h3>💰 Claims Overview</h3>
          <p>View all billing claims and their status.</p>
        </div>

        <div className="page-card">
          <h3>➕ New Claim</h3>
          <p>Create a new billing claim for a patient encounter.</p>
        </div>

        <div className="page-card">
          <h3>📊 Claims Analytics</h3>
          <p>Analyze claim approval rates and payment trends.</p>
        </div>
      </div>

      {showAddForm && (
        <div className="page-section page-form">
          <h3>Create Claim</h3>
          <form className="form-grid" onSubmit={handleAddClaim}>
            <label>
              Patient ID
              <input name="patient_id" value={newClaim.patient_id} onChange={handleFormChange} required />
            </label>
            <label>
              Encounter ID
              <input name="encounter_id" value={newClaim.encounter_id} onChange={handleFormChange} required />
            </label>
            <label>
              Insurance Provider
              <input name="insurance_provider" value={newClaim.insurance_provider} onChange={handleFormChange} />
            </label>
            <label>
              Payment Method
              <input name="payment_method" value={newClaim.payment_method} onChange={handleFormChange} />
            </label>
            <label>
              Billed Amount
              <input name="billed_amount" value={newClaim.billed_amount} onChange={handleFormChange} />
            </label>
            <label>
              Paid Amount
              <input name="paid_amount" value={newClaim.paid_amount} onChange={handleFormChange} />
            </label>
            <label>
              Status
              <input name="claim_status" value={newClaim.claim_status} onChange={handleFormChange} />
            </label>
            <label>
              Billing Date
              <input type="datetime-local" name="claim_billing_date" value={newClaim.claim_billing_date} onChange={handleFormChange} />
            </label>
            {formError && <p className="form-error">{formError}</p>}
            <div className="form-actions">
              <button type="submit" className="hp-primary-btn">Save Claim</button>
              <button type="button" className="hp-secondary-btn" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="page-section">
        <h3>Claims & Billing ({total.toLocaleString()} total)</h3>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
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
                    <td>
                      <button className="hp-danger-btn" onClick={() => handleDeleteClaim(claim.billing_id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        <div className="page-pagination">
          <button disabled={!canPrev} onClick={() => setPage((prev) => Math.max(prev - 1, 0))}>
            ← Previous
          </button>
          <span>
            Showing {start.toLocaleString()}-{end.toLocaleString()} of {total.toLocaleString()}
          </span>
          <button disabled={!canNext} onClick={() => setPage((prev) => prev + 1)}>
            Next →
          </button>
        </div>
      </div>
    </SharedLayout>
  );
};

export default BillingPage;
