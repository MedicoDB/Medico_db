import React, { useState, useEffect } from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";
import Pagination from "../components/Pagination";

const API_BASE = "/api";
const PAGE_SIZE = 50;

const ProvidersPage = () => {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [inhouseFilter, setInhouseFilter] = useState("");

    useEffect(() => {
        const fetchProviders = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams({
                    limit: PAGE_SIZE,
                    page: page + 1,
                });
                if (searchTerm) params.append("q", searchTerm);
                if (departmentFilter) params.append("department", departmentFilter);
                if (inhouseFilter) params.append("inhouse", inhouseFilter);

                const res = await fetch(`${API_BASE}/providers/?${params}`);
                const json = await res.json();
                setProviders(json.data || []);
                setTotal(json.total || 0);
                setError(null);
            } catch (err) {
                setError("Failed to load providers");
            } finally {
                setLoading(false);
            }
        };
        fetchProviders();
    }, [searchTerm, page, departmentFilter, inhouseFilter]);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this provider?")) return;
        try {
            await fetch(`${API_BASE}/providers/${id}`, { method: "DELETE" });
            setPage(0);
            window.location.reload();
        } catch {
            alert("Failed to delete");
        }
    };

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <SharedLayout
            title="Providers"
            subtitle="View and manage healthcare providers."
            activePage="providers"
            showSearch={false}
            showAddNew={false}
        >
            <div className="hp-search-new-container" style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px" }}>
                <input
                    className="hp-search hp-search--big"
                    placeholder="Search providers..."
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
                            <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--hp-text-soft)" }}>Department</label>
                            <select value={departmentFilter} onChange={(e) => { setDepartmentFilter(e.target.value); setPage(0); }}
                                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #555", background: "#1e293b", color: "#fff", minWidth: "150px" }}>
                                <option value="">All</option>
                                <option value="Cardiology">Cardiology</option>
                                <option value="Emergency">Emergency</option>
                                <option value="Orthopedics">Orthopedics</option>
                                <option value="Pediatrics">Pediatrics</option>
                                <option value="Oncology">Oncology</option>
                                <option value="Neurology">Neurology</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--hp-text-soft)" }}>In-House</label>
                            <select value={inhouseFilter} onChange={(e) => { setInhouseFilter(e.target.value); setPage(0); }}
                                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #555", background: "#1e293b", color: "#fff", minWidth: "100px" }}>
                                <option value="">All</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        </div>
                        <button className="hp-secondary-btn" onClick={() => { setDepartmentFilter(""); setInhouseFilter(""); setSearchTerm(""); setPage(0); }}>
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            <div className="page-section">
                <h3>Providers ({total.toLocaleString()} total)</h3>
                {loading ? (
                    <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>
                ) : error ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#ff4444" }}>{error}</div>
                ) : (
                    <table className="page-table">
                        <thead>
                            <tr>
                                <th>Provider ID</th>
                                <th>Name</th>
                                <th>Specialty</th>
                                <th>Department</th>
                                <th>NPI</th>
                                <th>In-House</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {providers.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>No providers found</td></tr>
                            ) : (
                                providers.map((p) => (
                                    <tr key={p.provider_id}>
                                        <td>{p.provider_id}</td>
                                        <td>{p.name}</td>
                                        <td>{p.specialty || "N/A"}</td>
                                        <td>{p.department || "N/A"}</td>
                                        <td>{p.npi || "N/A"}</td>
                                        <td>{p.inhouse ? "Yes" : "No"}</td>
                                        <td>
                                            <button className="hp-danger-btn" onClick={() => handleDelete(p.provider_id)}>Delete</button>
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

export default ProvidersPage;
