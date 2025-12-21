import React, { useState, useEffect } from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";
import Pagination from "../components/Pagination";

const API_BASE = "/api";
const PAGE_SIZE = 50;

const DepartmentHeadsPage = () => {
    const [heads, setHeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [departmentFilter, setDepartmentFilter] = useState("");

    useEffect(() => {
        const fetchHeads = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams({
                    limit: PAGE_SIZE,
                    page: page + 1,
                });
                if (searchTerm) params.append("q", searchTerm);
                if (departmentFilter) params.append("department", departmentFilter);

                const res = await fetch(`${API_BASE}/department-heads/?${params}`);
                const json = await res.json();
                setHeads(json.data || []);
                setTotal(json.total || 0);
                setError(null);
            } catch (err) {
                setError("Failed to load department heads");
            } finally {
                setLoading(false);
            }
        };
        fetchHeads();
    }, [searchTerm, page, departmentFilter]);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this department head?")) return;
        try {
            await fetch(`${API_BASE}/department-heads/${id}`, { method: "DELETE" });
            setPage(0);
            window.location.reload();
        } catch {
            alert("Failed to delete");
        }
    };

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <SharedLayout
            title="Department Heads"
            subtitle="View and manage department heads."
            activePage="departmentheads"
            showSearch={false}
            showAddNew={false}
        >
            <div className="hp-search-new-container" style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px" }}>
                <input
                    className="hp-search hp-search--big"
                    placeholder="Search department heads..."
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
                        <button className="hp-secondary-btn" onClick={() => { setDepartmentFilter(""); setSearchTerm(""); setPage(0); }}>
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            <div className="page-section">
                <h3>Department Heads ({total.toLocaleString()} total)</h3>
                {loading ? (
                    <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>
                ) : error ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#ff4444" }}>{error}</div>
                ) : (
                    <table className="page-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Department</th>
                                <th>Contact</th>
                                <th>Email</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {heads.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>No department heads found</td></tr>
                            ) : (
                                heads.map((h) => (
                                    <tr key={h.head_id}>
                                        <td>{h.head_id}</td>
                                        <td>{h.department || h.head_department || "N/A"}</td>
                                        <td>{h.contact_info || "N/A"}</td>
                                        <td>{h.email || "N/A"}</td>
                                        <td>
                                            <button className="hp-danger-btn" onClick={() => handleDelete(h.head_id)}>Delete</button>
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

export default DepartmentHeadsPage;
