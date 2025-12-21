import React, { useState, useEffect } from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";

const API_BASE = "/api";
const PAGE_SIZE = 50;

const InsurersPage = () => {
    const [insurers, setInsurers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [payerTypeFilter, setPayerTypeFilter] = useState("");

    useEffect(() => {
        const fetchInsurers = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams({
                    limit: PAGE_SIZE,
                    page: page + 1,
                });
                if (searchTerm) params.append("q", searchTerm);
                if (payerTypeFilter) params.append("payer_type", payerTypeFilter);

                const res = await fetch(`${API_BASE}/insurers/?${params}`);
                const json = await res.json();
                setInsurers(json.data || []);
                setTotal(json.total || 0);
                setError(null);
            } catch (err) {
                setError("Failed to load insurers");
            } finally {
                setLoading(false);
            }
        };
        fetchInsurers();
    }, [searchTerm, page, payerTypeFilter]);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this insurer?")) return;
        try {
            await fetch(`${API_BASE}/insurers/${id}`, { method: "DELETE" });
            setPage(0);
            window.location.reload();
        } catch {
            alert("Failed to delete");
        }
    };

    const start = total === 0 ? 0 : page * PAGE_SIZE + 1;
    const end = Math.min(total, page * PAGE_SIZE + insurers.length);

    return (
        <SharedLayout
            title="Insurers"
            subtitle="View and manage insurance providers."
            activePage="insurers"
            showSearch={false}
            showAddNew={false}
        >
            <div className="hp-search-new-container" style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px" }}>
                <input
                    className="hp-search hp-search--big"
                    placeholder="Search insurers..."
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
                            <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--hp-text-soft)" }}>Payer Type</label>
                            <select value={payerTypeFilter} onChange={(e) => { setPayerTypeFilter(e.target.value); setPage(0); }}
                                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #555", background: "#1e293b", color: "#fff", minWidth: "150px" }}>
                                <option value="">All</option>
                                <option value="commercial">Commercial</option>
                                <option value="government">Government</option>
                                <option value="medicare">Medicare</option>
                                <option value="medicaid">Medicaid</option>
                            </select>
                        </div>
                        <button className="hp-secondary-btn" onClick={() => { setPayerTypeFilter(""); setSearchTerm(""); setPage(0); }}>
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            <div className="page-section">
                <h3>Insurers ({total.toLocaleString()} total)</h3>
                {loading ? (
                    <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>
                ) : error ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#ff4444" }}>{error}</div>
                ) : (
                    <table className="page-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Payer Type</th>
                                <th>Phone</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {insurers.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>No insurers found</td></tr>
                            ) : (
                                insurers.map((i) => (
                                    <tr key={i.insurer_id}>
                                        <td>{i.insurer_id}</td>
                                        <td>{i.code}</td>
                                        <td>{i.name}</td>
                                        <td>{i.payer_type || "N/A"}</td>
                                        <td>{i.phone || "N/A"}</td>
                                        <td>
                                            <button className="hp-danger-btn" onClick={() => handleDelete(i.insurer_id)}>Delete</button>
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

export default InsurersPage;
