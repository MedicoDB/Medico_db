import React, { useState, useEffect } from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";
import { api } from "../services/api";
import AsyncSelect from "../components/AsyncSelect";
import Pagination from "../components/Pagination";

const API_BASE = "/api";
const PAGE_SIZE = 50;

const emptyLabTest = {
    encounter_id: "",
    test_name: "",
    test_code: "",
    specimen_type: "",
    test_result: "",
    units: "N/A",
    normal_range: "N/A",
    test_date: "",
    status: "Pending",
};

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
    const [showAddForm, setShowAddForm] = useState(false);
    const [formError, setFormError] = useState(null);
    const [newLabTest, setNewLabTest] = useState(emptyLabTest);
    const [editingTestId, setEditingTestId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

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
    }, [searchTerm, page, statusFilter, dateFrom, dateTo, refreshKey]);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this lab test?")) return;
        try {
            await fetch(`${API_BASE}/lab-tests/${id}`, { method: "DELETE" });
            setPage(0);
            setRefreshKey((prev) => prev + 1);
        } catch {
            alert("Failed to delete");
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setNewLabTest((prev) => ({ ...prev, [name]: value }));
    };

    const handleFKChange = (field, value) => {
        setNewLabTest((prev) => ({ ...prev, [field]: value }));
    };

    const formatEncounterLabel = (encounter) => {
        const date = encounter.visit_date ? new Date(encounter.visit_date).toLocaleDateString() : 'N/A';
        const patientName = (encounter.patient_first_name && encounter.patient_last_name)
            ? `${encounter.patient_first_name} ${encounter.patient_last_name}`
            : (encounter.first_name && encounter.last_name)
                ? `${encounter.first_name} ${encounter.last_name}`
                : 'Unknown';
        return `${encounter.encounter_id} — ${patientName} — ${date}`;
    };

    const handleSubmitLabTest = async (e) => {
        e.preventDefault();
        setFormError(null);
        if (!newLabTest.encounter_id || !newLabTest.test_code || !newLabTest.test_name || !newLabTest.test_date || !newLabTest.status) {
            setFormError("Encounter, test code, test name, test date, and status are required.");
            return;
        }
        try {
            const payload = {
                ...newLabTest,
                units: newLabTest.units || "N/A",
                normal_range: newLabTest.normal_range || "N/A",
            };
            if (editingTestId) {
                await fetch(`${API_BASE}/lab-tests/${editingTestId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            } else {
                await fetch(`${API_BASE}/lab-tests/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }
            setNewLabTest(emptyLabTest);
            setEditingTestId(null);
            setShowAddForm(false);
            setPage(0);
            setRefreshKey((prev) => prev + 1);
            alert(editingTestId ? "Lab test updated." : "Lab test added.");
        } catch (err) {
            console.error(err);
            setFormError("Failed to save lab test.");
        }
    };

    const beginCreate = () => {
        setNewLabTest(emptyLabTest);
        setEditingTestId(null);
        setShowAddForm(true);
        setFormError(null);
    };

    const handleEditLabTest = (test) => {
        setNewLabTest({
            encounter_id: test.encounter_id || "",
            test_name: test.test_name || "",
            test_code: test.test_code || "",
            specimen_type: test.specimen_type || "",
            test_result: test.test_result || test.result_value || "",
            units: test.units || "N/A",
            normal_range: test.normal_range || "N/A",
            test_date: test.test_date ? test.test_date.slice(0, 10) : "",
            status: test.status || "Pending",
        });
        setEditingTestId(test.test_id);
        setShowAddForm(true);
        setFormError(null);
    };

    const totalPages = Math.ceil(total / PAGE_SIZE);

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
                <button className="hp-primary-btn" onClick={beginCreate}>
                    + New Lab Test
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

            {showAddForm && (
                <div className="page-section page-form">
                    <h3>{editingTestId ? "Edit Lab Test" : "Create Lab Test"}</h3>
                    <form className="form-grid" onSubmit={handleSubmitLabTest}>
                        <label>
                            Encounter
                            <AsyncSelect
                                value={newLabTest.encounter_id}
                                onChange={(value) => handleFKChange('encounter_id', value)}
                                fetchOptions={api.getEncounterOptions}
                                getOptionLabel={formatEncounterLabel}
                                getOptionValue={(opt) => opt.encounter_id}
                                placeholder="Select encounter..."
                                required
                            />
                        </label>
                        <label>
                            Test Name
                            <input
                                name="test_name"
                                value={newLabTest.test_name}
                                onChange={handleFormChange}
                                required
                            />
                        </label>
                        <label>
                            Test Code
                            <input
                                name="test_code"
                                value={newLabTest.test_code}
                                onChange={handleFormChange}
                                required
                            />
                        </label>
                        <label>
                            Specimen Type
                            <input
                                name="specimen_type"
                                value={newLabTest.specimen_type}
                                onChange={handleFormChange}
                            />
                        </label>
                        <label>
                            Test Result
                            <input
                                name="test_result"
                                value={newLabTest.test_result}
                                onChange={handleFormChange}
                            />
                        </label>
                        <label>
                            Units
                            <input
                                name="units"
                                value={newLabTest.units}
                                onChange={handleFormChange}
                            />
                        </label>
                        <label>
                            Normal Range
                            <input
                                name="normal_range"
                                value={newLabTest.normal_range}
                                onChange={handleFormChange}
                            />
                        </label>
                        <label>
                            Test Date
                            <input
                                type="date"
                                name="test_date"
                                value={newLabTest.test_date}
                                onChange={handleFormChange}
                                required
                            />
                        </label>
                        <label>
                            Status
                            <select
                                name="status"
                                value={newLabTest.status}
                                onChange={handleFormChange}
                                required
                            >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </label>
                        {formError && <p className="form-error">{formError}</p>}
                        <div className="form-actions">
                            <button type="submit" className="hp-primary-btn">
                                {editingTestId ? "Update Lab Test" : "Save Lab Test"}
                            </button>
                            <button
                                type="button"
                                className="hp-secondary-btn"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setEditingTestId(null);
                                    setNewLabTest(emptyLabTest);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
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
                                            <button className="hp-secondary-btn" onClick={() => handleEditLabTest(t)} style={{ marginRight: 8 }}>
                                                Edit
                                            </button>
                                            <button className="hp-danger-btn" onClick={() => handleDelete(t.test_id)}>Delete</button>
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

export default LabTestsPage;
