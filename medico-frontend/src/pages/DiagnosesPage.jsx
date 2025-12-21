import React, { useState, useEffect } from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";

const API_BASE = "/api";
const PAGE_SIZE = 50;

const DiagnosesPage = () => {
    const [diagnoses, setDiagnoses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [chronicFilter, setChronicFilter] = useState("");
    const [primaryFilter, setPrimaryFilter] = useState("");

    useEffect(() => {
        const fetchDiagnoses = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams({
                    limit: PAGE_SIZE,
                    page: page + 1,
                });
                if (searchTerm) params.append("q", searchTerm);
                if (chronicFilter) params.append("chronic_flag", chronicFilter);
                if (primaryFilter) params.append("primary_flag", primaryFilter);

                const res = await fetch(`${API_BASE}/diagnoses/?${params}`);
                const json = await res.json();
                setDiagnoses(json.data || []);
                setTotal(json.total || 0);
                setError(null);
            } catch (err) {
                setError("Failed to load diagnoses");
            } finally {
                setLoading(false);
            }
        };
        fetchDiagnoses();
    }, [searchTerm, page, chronicFilter, primaryFilter]);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this diagnosis?")) return;
        try {
            await fetch(`${API_BASE}/diagnoses/${id}`, { method: "DELETE" });
            setPage(0);
            window.location.reload();
        } catch {
            alert("Failed to delete");
        }
    };

    const start = total === 0 ? 0 : page * PAGE_SIZE + 1;
    const end = Math.min(total, page * PAGE_SIZE + diagnoses.length);

    return (
        <SharedLayout
            title="Diagnoses"
            subtitle="View and manage patient diagnoses linked to encounters."
            activePage="diagnoses"
            showSearch={false}
            showAddNew={false}
        >
            <div className="hp-search-new-container" style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px" }}>
                <input
                    className="hp-search hp-search--big"
                    placeholder="Search diagnoses..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                    style={{ flex: 1, maxWidth: "500px" }}
                />
                <button className="hp-secondary-btn" onClick={() => setShowFilters(!showFilters)} style={{ marginLeft: "8px" }}>
                    🔍 {showFilters ? "Hide Filters" : "Filters"}
                </button>
            </div>

            {showFilters && (
                <div className="page-section" style={{ marginBottom: "20px", padding: "16px", background: "var(--hp-bg-soft, #334155)", borderRadius: "12px" }}>
                    <h4 style={{ marginBottom: "12px", color: "var(--hp-text-main)" }}>🔍 Advanced Filters</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--hp-text-soft)" }}>Chronic</label>
                            <select value={chronicFilter} onChange={(e) => { setChronicFilter(e.target.value); setPage(0); }}
                                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #555", background: "#1e293b", color: "#fff", minWidth: "100px" }}>
                                <option value="">All</option>
                                <option value="1">Yes</option>
                                <option value="0">No</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--hp-text-soft)" }}>Primary</label>
                            <select value={primaryFilter} onChange={(e) => { setPrimaryFilter(e.target.value); setPage(0); }}
                                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #555", background: "#1e293b", color: "#fff", minWidth: "100px" }}>
                                <option value="">All</option>
                                <option value="1">Yes</option>
                                <option value="0">No</option>
                            </select>
                        </div>
                        <button className="hp-secondary-btn" onClick={() => { setChronicFilter(""); setPrimaryFilter(""); setSearchTerm(""); setPage(0); }}>
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            <div className="page-section">
                <h3>Diagnoses ({total.toLocaleString()} total)</h3>
                {loading ? (
                    <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>
                ) : error ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#ff4444" }}>{error}</div>
                ) : (
                    <table className="page-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Encounter</th>
                                <th>Diagnosis Code</th>
                                <th>Description</th>
                                <th>Primary</th>
                                <th>Chronic</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {diagnoses.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>No diagnoses found</td></tr>
                            ) : (
                                diagnoses.map((d) => (
                                    <tr key={d.diagnosis_id}>
                                        <td>{d.diagnosis_id}</td>
                                        <td>{d.encounter_id}</td>
                                        <td>{d.diagnosis_code}</td>
                                        <td>{d.diagnosis_description || "N/A"}</td>
                                        <td>{d.primary_flag ? "Yes" : "No"}</td>
                                        <td>{d.chronic_flag ? "Yes" : "No"}</td>
                                        <td>
                                            <button className="hp-danger-btn" onClick={() => handleDelete(d.diagnosis_id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
                <div className="page-pagination">
                    <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>← Previous</button>
                    <span>Showing {start}-{end} of {total.toLocaleString()}</span>
                    <button disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
            </div>
        </SharedLayout>
    );
};

export default DiagnosesPage;
