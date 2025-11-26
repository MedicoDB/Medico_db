import React, { useState, useEffect } from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";
import { api } from "../services/api";

const PAGE_SIZE = 50;

const DenialsPage = () => {
  const [denials, setDenials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState(null);
  const [newDenial, setNewDenial] = useState({
    claim_id: "",
    denial_reason_code: "",
    denial_reason_description: "",
    denied_amount: "",
    denial_date: "",
    appeal_filed: "",
    appeal_status: "",
    appeal_resolution_date: "",
    final_outcome: "",
  });
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchDenials = async () => {
      try {
        setLoading(true);
        const { data, total } = await api.getDenials(PAGE_SIZE, page * PAGE_SIZE, searchTerm);

        if (page > 0 && data.length === 0 && total > 0) {
          setPage((prev) => Math.max(prev - 1, 0));
          return;
        }

        setDenials(data);
        setTotal(total);
        setError(null);
      } catch (err) {
        console.error("Error fetching denials:", err);
        setError("Failed to load denials");
      } finally {
        setLoading(false);
      }
    };

    fetchDenials();
  }, [searchTerm, refreshKey, page]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewDenial((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddDenial = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!newDenial.claim_id) {
      setFormError("Claim ID is required.");
      return;
    }
    try {
      await api.createDenial({
        ...newDenial,
        denied_amount: Number(newDenial.denied_amount) || 0,
      });
      setNewDenial({
        claim_id: "",
        denial_reason_code: "",
        denial_reason_description: "",
        denied_amount: "",
        denial_date: "",
        appeal_filed: "",
        appeal_status: "",
        appeal_resolution_date: "",
        final_outcome: "",
      });
      setShowAddForm(false);
      setPage(0);
      setRefreshKey((prev) => prev + 1);
      alert("Denial added.");
    } catch (err) {
      console.error(err);
      setFormError("Failed to add denial. Verify claim ID.");
    }
  };

  const handleDeleteDenial = async (denialId) => {
    if (!window.confirm("Delete this denial record?")) return;
    try {
      await api.deleteDenial(denialId);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      alert("Unable to delete denial.");
    }
  };

  const canPrev = page > 0;
  const canNext = (page + 1) * PAGE_SIZE < total;
  const start = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = total === 0 ? 0 : Math.min(total, page * PAGE_SIZE + denials.length);

  return (
    <SharedLayout
      title="Denials"
      subtitle="Track claim denials, reasons, appeals, and final outcomes."
      activePage="denials"
      searchValue={searchTerm}
      onSearchChange={handleSearch}
      onAddNew={() => setShowAddForm((prev) => !prev)}
    >
      <div className="page-grid">
        <div className="page-card">
          <h3>🚫 Denial Records</h3>
          <p>Review claim denials and appeal progress.</p>
          <button className="hp-link-btn" onClick={() => window.scrollTo({ top: document.querySelector('.page-section').offsetTop, behavior: 'smooth' })}>
            View All →
          </button>
        </div>

        <div className="page-card">
          <h3>➕ Add Denial</h3>
          <p>Log a new claim denial and its details.</p>
          <button className="hp-primary-btn" onClick={() => setShowAddForm((prev) => !prev)}>
            {showAddForm ? "Close Form" : "Add Denial"}
          </button>
        </div>

        <div className="page-card">
          <h3>📈 Appeal Tracking</h3>
          <p>Monitor appeal status and outcomes.</p>
          <button className="hp-secondary-btn" onClick={() => alert('Appeal analytics coming soon!')}>
            View Analytics
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="page-section page-form">
          <h3>Create Denial</h3>
          <form className="form-grid" onSubmit={handleAddDenial}>
            <label>
              Claim ID
              <input name="claim_id" value={newDenial.claim_id} onChange={handleFormChange} required />
            </label>
            <label>
              Denial Reason Code
              <input name="denial_reason_code" value={newDenial.denial_reason_code} onChange={handleFormChange} />
            </label>
            <label>
              Denial Description
              <input name="denial_reason_description" value={newDenial.denial_reason_description} onChange={handleFormChange} />
            </label>
            <label>
              Denied Amount
              <input name="denied_amount" value={newDenial.denied_amount} onChange={handleFormChange} />
            </label>
            <label>
              Denial Date
              <input type="date" name="denial_date" value={newDenial.denial_date} onChange={handleFormChange} />
            </label>
            <label>
              Appeal Filed
              <input name="appeal_filed" value={newDenial.appeal_filed} onChange={handleFormChange} />
            </label>
            <label>
              Appeal Status
              <input name="appeal_status" value={newDenial.appeal_status} onChange={handleFormChange} />
            </label>
            <label>
              Appeal Resolution Date
              <input type="date" name="appeal_resolution_date" value={newDenial.appeal_resolution_date} onChange={handleFormChange} />
            </label>
            <label>
              Final Outcome
              <input name="final_outcome" value={newDenial.final_outcome} onChange={handleFormChange} />
            </label>
            {formError && <p className="form-error">{formError}</p>}
            <div className="form-actions">
              <button type="submit" className="hp-primary-btn">Save Denial</button>
              <button type="button" className="hp-secondary-btn" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="page-section">
        <h3>Denials ({total.toLocaleString()} total)</h3>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading denials...</div>
        ) : error ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#ff4444' }}>{error}</div>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>Denial ID</th>
                <th>Claim ID</th>
                <th>Reason</th>
                <th>Denied Amount</th>
                <th>Denial Date</th>
                <th>Appeal Status</th>
                <th>Final Outcome</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {denials.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                    No denials found
                  </td>
                </tr>
              ) : (
                denials.map((denial) => (
                  <tr key={denial.denial_id}>
                    <td>{denial.denial_id}</td>
                    <td>{denial.claim_id}</td>
                    <td>{denial.denial_reason_description || denial.denial_reason_code || 'N/A'}</td>
                    <td>${denial.denied_amount ? parseFloat(denial.denied_amount).toFixed(2) : '0.00'}</td>
                    <td>{denial.denial_date ? new Date(denial.denial_date).toLocaleDateString() : 'N/A'}</td>
                    <td>{denial.appeal_status || 'N/A'}</td>
                    <td>{denial.final_outcome || 'N/A'}</td>
                    <td>
                      <button className="hp-danger-btn" onClick={() => handleDeleteDenial(denial.denial_id)}>
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

export default DenialsPage;

