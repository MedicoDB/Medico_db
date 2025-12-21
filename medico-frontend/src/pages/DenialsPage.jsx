import React, { useState, useEffect } from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";
import { api } from "../services/api";
import AsyncSelect from "../components/AsyncSelect";
import Pagination from "../components/Pagination";

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

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("");

  useEffect(() => {
    const fetchDenials = async () => {
      try {
        setLoading(true);
        const { data, total } = await api.getDenials(
          PAGE_SIZE,
          page * PAGE_SIZE,
          searchTerm
        );

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

  const handleFKChange = (field, value) => {
    setNewDenial((prev) => ({ ...prev, [field]: value }));
  };

  // Label formatter for claim dropdown
  const formatClaimLabel = (claim) => {
    const date = claim.claim_billing_date ? new Date(claim.claim_billing_date).toLocaleDateString() : 'N/A';
    const patientName = (claim.patient_first_name && claim.patient_last_name)
      ? `${claim.patient_first_name} ${claim.patient_last_name}`
      : (claim.first_name && claim.last_name)
        ? `${claim.first_name} ${claim.last_name}`
        : 'Unknown';
    const amount = claim.billed_amount ? `$${parseFloat(claim.billed_amount).toFixed(2)}` : '$0.00';
    return `${claim.claim_id || claim.billing_id} — ${patientName} — ${date} — ${amount}`;
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

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <SharedLayout
      title="Denials"
      subtitle="Track claim denials, reasons, appeals, and final outcomes."
      activePage="denials"
      showSearch={false}   // sağ üst search kapalı
      showAddNew={false}   // sağ üst +Add kapalı
    >
      {/* Başlık altına search bar ve +New Denial butonu */}
      <div
        className="hp-search-new-container"
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <input
          className="hp-search hp-search--big"
          placeholder="Search denials..."
          value={searchTerm}
          onChange={handleSearch}
          style={{ flex: 1, maxWidth: "500px" }}
        />
        <button
          className="hp-primary-btn"
          onClick={() => setShowAddForm((prev) => !prev)}
        >
          + New Denial
        </button>
        <button className="hp-secondary-btn" onClick={() => setShowFilters(!showFilters)} style={{ marginLeft: "8px" }}>
          🔍 {showFilters ? "Hide Filters" : "Filters"}
        </button>
      </div>

      {showFilters && (
        <div className="page-section" style={{ marginBottom: "20px", padding: "16px", background: "var(--hp-bg-soft, #334155)", borderRadius: "12px" }}>
          <h4 style={{ marginBottom: "12px", color: "var(--hp-text-main)" }}>🔍 Advanced Filters</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--hp-text-soft)" }}>Denial Date From</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #555", background: "#1e293b", color: "#fff" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--hp-text-soft)" }}>Denial Date To</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #555", background: "#1e293b", color: "#fff" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--hp-text-soft)" }}>Final Outcome</label>
              <select value={outcomeFilter} onChange={(e) => { setOutcomeFilter(e.target.value); setPage(0); }}
                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #555", background: "#1e293b", color: "#fff", minWidth: "140px" }}>
                <option value="">All</option>
                <option value="Upheld">Upheld</option>
                <option value="Overturned">Overturned</option>
                <option value="Partial">Partial</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <button className="hp-secondary-btn" onClick={() => { setDateFrom(""); setDateTo(""); setOutcomeFilter(""); setSearchTerm(""); setPage(0); }}>
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="page-grid">
        <div className="page-card">
          <h3>🚫 Denial Records</h3>
          <p>Review claim denials and appeal progress.</p>
          <button
            className="hp-link-btn"
            onClick={() =>
              window.scrollTo({
                top: document.querySelector(".page-section").offsetTop,
                behavior: "smooth",
              })
            }
          >
            View All →
          </button>
        </div>

        <div className="page-card">
          <h3>📈 Appeal Tracking</h3>
          <p>Monitor appeal status and outcomes.</p>
        </div>
      </div>

      {showAddForm && (
        <div className="page-section page-form">
          <h3>Create Denial</h3>
          <form className="form-grid" onSubmit={handleAddDenial}>
            <label>
              Claim
              <AsyncSelect
                value={newDenial.claim_id}
                onChange={(value) => handleFKChange('claim_id', value)}
                fetchOptions={api.getClaimOptions}
                getOptionLabel={formatClaimLabel}
                getOptionValue={(opt) => opt.claim_id || opt.billing_id}
                placeholder="Select claim..."
                required
              />
            </label>
            <label>
              Denial Reason Code
              <input
                name="denial_reason_code"
                value={newDenial.denial_reason_code}
                onChange={handleFormChange}
              />
            </label>
            <label>
              Denial Description
              <input
                name="denial_reason_description"
                value={newDenial.denial_reason_description}
                onChange={handleFormChange}
              />
            </label>
            <label>
              Denied Amount
              <input
                name="denied_amount"
                value={newDenial.denied_amount}
                onChange={handleFormChange}
              />
            </label>
            <label>
              Denial Date
              <input
                type="date"
                name="denial_date"
                value={newDenial.denial_date}
                onChange={handleFormChange}
              />
            </label>
            <label>
              Appeal Filed
              <input
                name="appeal_filed"
                value={newDenial.appeal_filed}
                onChange={handleFormChange}
              />
            </label>
            <label>
              Appeal Status
              <input
                name="appeal_status"
                value={newDenial.appeal_status}
                onChange={handleFormChange}
              />
            </label>
            <label>
              Appeal Resolution Date
              <input
                type="date"
                name="appeal_resolution_date"
                value={newDenial.appeal_resolution_date}
                onChange={handleFormChange}
              />
            </label>
            <label>
              Final Outcome
              <input
                name="final_outcome"
                value={newDenial.final_outcome}
                onChange={handleFormChange}
              />
            </label>
            {formError && <p className="form-error">{formError}</p>}
            <div className="form-actions">
              <button type="submit" className="hp-primary-btn">
                Save Denial
              </button>
              <button
                type="button"
                className="hp-secondary-btn"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="page-section">
        <h3>Denials ({total.toLocaleString()} total)</h3>
        {loading ? (
          <div style={{ padding: "20px", textAlign: "center" }}>
            Loading denials...
          </div>
        ) : error ? (
          <div
            style={{ padding: "20px", textAlign: "center", color: "#ff4444" }}
          >
            {error}
          </div>
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
                  <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
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
                      <button
                        className="hp-danger-btn"
                        onClick={() => handleDeleteDenial(denial.denial_id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>
    </SharedLayout>
  );
};

export default DenialsPage;
