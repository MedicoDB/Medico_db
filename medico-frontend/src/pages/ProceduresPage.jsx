import React, { useState, useEffect } from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";
import { api } from "../services/api";

const PAGE_SIZE = 50;

const emptyProcedure = {
  encounter_id: "",
  procedure_code: "",
  procedure_description: "",
  procedure_date: "",
  provider_id: "",
  procedure_cost: "",
};

const ProceduresPage = () => {
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState(null);
  const [newProcedure, setNewProcedure] = useState(emptyProcedure);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [editingProcedureId, setEditingProcedureId] = useState(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const fetchProcedures = async () => {
      try {
        setLoading(true);
        const { data, total } = await api.getProcedures(PAGE_SIZE, page * PAGE_SIZE, searchTerm);

        if (page > 0 && data.length === 0 && total > 0) {
          setPage((prev) => Math.max(prev - 1, 0));
          return;
        }

        setProcedures(data);
        setTotal(total);
        setError(null);
      } catch (err) {
        console.error("Error fetching procedures:", err);
        setError("Failed to load procedures");
      } finally {
        setLoading(false);
      }
    };

    fetchProcedures();
  }, [searchTerm, refreshKey, page]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewProcedure((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProcedure = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!newProcedure.encounter_id) {
      setFormError("Encounter ID is required.");
      return;
    }
    try {
      const payload = {
        ...newProcedure,
        procedure_cost: Number(newProcedure.procedure_cost) || 0,
      };
      if (editingProcedureId) {
        await api.updateProcedure(editingProcedureId, payload);
      } else {
        await api.createProcedure(payload);
      }
      setNewProcedure(emptyProcedure);
      setEditingProcedureId(null);
      setShowAddForm(false);
      setPage(0);
      setRefreshKey((prev) => prev + 1);
      alert(editingProcedureId ? "Procedure updated." : "Procedure added.");
    } catch (err) {
      console.error(err);
      setFormError("Failed to save procedure. Verify encounter/provider IDs.");
    }
  };

  const handleDeleteProcedure = async (procedureId) => {
    if (!window.confirm("Delete this procedure?")) return;
    try {
      await api.deleteProcedure(procedureId);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      alert("Unable to delete procedure.");
    }
  };

  const canPrev = page > 0;
  const canNext = (page + 1) * PAGE_SIZE < total;
  const start = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = total === 0 ? 0 : Math.min(total, page * PAGE_SIZE + procedures.length);

  const beginCreate = () => {
    setNewProcedure(emptyProcedure);
    setEditingProcedureId(null);
    setShowAddForm(true);
    setFormError(null);
  };

  const handleEditProcedure = (procedure) => {
    setNewProcedure({
      encounter_id: procedure.encounter_id || "",
      procedure_code: procedure.procedure_code || "",
      procedure_description: procedure.procedure_description || "",
      procedure_date: procedure.procedure_date ? procedure.procedure_date.slice(0, 10) : "",
      provider_id: procedure.provider_id || "",
      procedure_cost: procedure.procedure_cost ?? "",
    });
    setEditingProcedureId(procedure.procedure_id);
    setShowAddForm(true);
    setFormError(null);
  };

  return (
    <SharedLayout
      title="Procedures"
      subtitle="View procedures linked to encounters and providers, including costs and codes."
      activePage="procedures"
      showSearch={false}   // 🔥 sağ üst search kapalı
      showAddNew={false}   // 🔥 sağ üst +New kapalı
    >
      {/* 🔥 Başlık altına Search ve +New Procedure */}
      <div className="hp-search-new-container" style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px" }}>
        <input
          className="hp-search hp-search--big"
          placeholder="Search procedures, encounters, providers..."
          value={searchTerm}
          onChange={handleSearch}
          style={{ flex: "1", maxWidth: "500px" }}
        />
        <button className="hp-primary-btn" onClick={beginCreate}>
          + New Procedure
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
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--hp-text-soft)" }}>Procedure Date From</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #555", background: "#1e293b", color: "#fff" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--hp-text-soft)" }}>Procedure Date To</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #555", background: "#1e293b", color: "#fff" }} />
            </div>
            <button className="hp-secondary-btn" onClick={() => { setDateFrom(""); setDateTo(""); setSearchTerm(""); setPage(0); }}>
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="page-grid">
        <div className="page-card">
          <h3>🧪 Procedure List</h3>
          <p>Browse all recorded medical procedures in the system.</p>
        </div>

        <div className="page-card">
          <h3>➕ Add Procedure</h3>
          <p>Add a new medical procedure associated with encounter & provider.</p>
        </div>

        <div className="page-card">
          <h3>📊 Procedure Analytics</h3>
          <p>Analyze cost distribution, frequency and provider mapping.</p>
        </div>
      </div>

      {showAddForm && (
        <div className="page-section page-form">
          <h3>{editingProcedureId ? "Edit Procedure" : "Create Procedure"}</h3>
          <form className="form-grid" onSubmit={handleAddProcedure}>
            <label>
              Encounter ID
              <input name="encounter_id" value={newProcedure.encounter_id} onChange={handleFormChange} required />
            </label>
            <label>
              Procedure Code
              <input name="procedure_code" value={newProcedure.procedure_code} onChange={handleFormChange} />
            </label>
            <label>
              Description
              <input name="procedure_description" value={newProcedure.procedure_description} onChange={handleFormChange} />
            </label>
            <label>
              Procedure Date
              <input type="date" name="procedure_date" value={newProcedure.procedure_date} onChange={handleFormChange} />
            </label>
            <label>
              Provider ID
              <input name="provider_id" value={newProcedure.provider_id} onChange={handleFormChange} />
            </label>
            <label>
              Cost
              <input name="procedure_cost" value={newProcedure.procedure_cost} onChange={handleFormChange} />
            </label>
            {formError && <p className="form-error">{formError}</p>}
            <div className="form-actions">
              <button type="submit" className="hp-primary-btn">{editingProcedureId ? "Update Procedure" : "Save Procedure"}</button>
              <button
                type="button"
                className="hp-secondary-btn"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingProcedureId(null);
                  setNewProcedure(emptyProcedure);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="page-section">
        <h3>Recent Procedures ({total.toLocaleString()} total)</h3>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {procedures.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
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
                    <td>
                      <button className="hp-secondary-btn" onClick={() => handleEditProcedure(procedure)} style={{ marginRight: 8 }}>
                        Edit
                      </button>
                      <button className="hp-danger-btn" onClick={() => handleDeleteProcedure(procedure.procedure_id)}>
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

export default ProceduresPage;
