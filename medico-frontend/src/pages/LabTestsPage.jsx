import React, { useState, useEffect } from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";

const API_BASE = "/api";
const PAGE_SIZE = 50;

const LabTestsPage = () => {
    const [labTests, setLabTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    useEffect(() => {
        const fetchLabTests = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams({
                    limit: PAGE_SIZE,
                    page: page + 1,
                });
                if (searchTerm) params.append("q", searchTerm);
                if (statusFilter) params.append("status", statusFilter);
                if (dateFrom) params.append("test_date_from", dateFrom);
                if (dateTo) params.append("test_date_to", dateTo);

                const res = await fetch(`${API_BASE}/lab-tests/?${params}`);
                const json = await res.json();
                setLabTests(json.data || []);
                setTotal(json.total || 0);
                setError(null);
            } catch (err) {
                setError("Failed to load lab tests");
            } finally {
                setLoading(false);
            }
        };
        fetchLabTests();
    }, [searchTerm, page, statusFilter, dateFrom, dateTo]);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this lab test?")) return;
        try {
            await fetch(`${API_BASE}/lab-tests/${id}`, { method: "DELETE" });
            setPage(0);
            window.location.reload();
        } catch {
            alert("Failed to delete");
        }
    };

    const start = total === 0 ? 0 : page * PAGE_SIZE + 1;
    const end = Math.min(total, page * PAGE_SIZE + labTests.length);

    return (
        <SharedLayout
            title="Lab Tests"
            subtitle="View and manage laboratory test results."
            activePage="labtests"
            showSearch={false}
            showAddNew={false}
        >
            <div className="hp-search-new-container" style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px" }}>
                <input
                    className="hp-search hp-search--big"
                    placeholder="Search lab tests..."
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
                            <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--hp-text-soft)" }}>Test Date From</label>
                            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #555", background: "#1e293b", color: "#fff" }} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--hp-text-soft)" }}>Test Date To</label>
                            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #555", background: "#1e293b", color: "#fff" }} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--hp-text-soft)" }}>Status</label>
                            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #555", background: "#1e293b", color: "#fff", minWidth: "120px" }}>
                                <option value="">All</option>
                                <option value="Completed">Completed</option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                            </select>
                        </div>
                        <button className="hp-secondary-btn" onClick={() => { setDateFrom(""); setDateTo(""); setStatusFilter(""); setSearchTerm(""); setPage(0); }}>
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            <div className="page-section">
                <h3>Lab Tests ({total.toLocaleString()} total)</h3>
                {loading ? (
                    <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>
                ) : error ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#ff4444" }}>{error}</div>
                ) : (
                    <table className="page-table">
                        <thead>
                            <tr>
                                <th>Test ID</th>
                                <th>Test Code</th>
                                <th>Test Name</th>
                                <th>Result</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {labTests.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>No lab tests found</td></tr>
                            ) : (
                                labTests.map((t) => (
                                    <tr key={t.test_id}>
                                        <td>{t.test_id}</td>
                                        <td>{t.test_code}</td>
                                        <td>{t.test_name || "N/A"}</td>
                                        <td>{t.result_value || "N/A"} {t.units || ""}</td>
                                        <td>{t.status || "N/A"}</td>
                                        <td>{t.test_date ? new Date(t.test_date).toLocaleDateString() : "N/A"}</td>
                                        <td>
                                            <button className="hp-danger-btn" onClick={() => handleDelete(t.test_id)}>Delete</button>
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

export default LabTestsPage;
