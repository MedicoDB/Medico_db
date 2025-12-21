import React, { useState, useEffect } from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";
import { api } from "../services/api";
import AsyncSelect from "../components/AsyncSelect";
import Pagination from "../components/Pagination";

const API_BASE = "/api";
const PAGE_SIZE = 50;

const emptyDiagnosis = {
    encounter_id: "",
    diagnosis_code: "",
    diagnosis_description: "",
    primary_flag: true,
    chronic_flag: false,
};

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
    const [showAddForm, setShowAddForm] = useState(false);
    const [formError, setFormError] = useState(null);
    const [newDiagnosis, setNewDiagnosis] = useState(emptyDiagnosis);
    const [editingDiagnosisId, setEditingDiagnosisId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

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
    }, [searchTerm, page, chronicFilter, primaryFilter, refreshKey]);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this diagnosis?")) return;
        try {
            await fetch(`${API_BASE}/diagnoses/${id}`, { method: "DELETE" });
            setPage(0);
            setRefreshKey((prev) => prev + 1);
        } catch {
            alert("Failed to delete");
        }
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewDiagnosis((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleFKChange = (field, value) => {
        setNewDiagnosis((prev) => ({ ...prev, [field]: value }));
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

    const handleSubmitDiagnosis = async (e) => {
        e.preventDefault();
        setFormError(null);
        if (!newDiagnosis.encounter_id || !newDiagnosis.diagnosis_code) {
            setFormError("Encounter and diagnosis code are required.");
            return;
        }
        try {
            const payload = {
                ...newDiagnosis,
                primary_flag: newDiagnosis.primary_flag ? 1 : 0,
                chronic_flag: newDiagnosis.chronic_flag ? 1 : 0,
            };
            if (editingDiagnosisId) {
                await fetch(`${API_BASE}/diagnoses/${editingDiagnosisId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            } else {
                await fetch(`${API_BASE}/diagnoses/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }
            setNewDiagnosis(emptyDiagnosis);
            setEditingDiagnosisId(null);
            setShowAddForm(false);
            setPage(0);
            setRefreshKey((prev) => prev + 1);
            alert(editingDiagnosisId ? "Diagnosis updated." : "Diagnosis added.");
        } catch (err) {
            console.error(err);
            setFormError("Failed to save diagnosis.");
        }
    };

    const beginCreate = () => {
        setNewDiagnosis(emptyDiagnosis);
        setEditingDiagnosisId(null);
        setShowAddForm(true);
        setFormError(null);
    };

    const handleEditDiagnosis = (diagnosis) => {
        setNewDiagnosis({
            encounter_id: diagnosis.encounter_id || "",
            diagnosis_code: diagnosis.diagnosis_code || "",
            diagnosis_description: diagnosis.diagnosis_description || "",
            primary_flag: diagnosis.primary_flag || false,
            chronic_flag: diagnosis.chronic_flag || false,
        });
        setEditingDiagnosisId(diagnosis.diagnosis_id);
        setShowAddForm(true);
        setFormError(null);
    };

    const totalPages = Math.ceil(total / PAGE_SIZE);

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
                <button className="hp-primary-btn" onClick={beginCreate}>
                    + New Diagnosis
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

            {showAddForm && (
                <div className="page-section page-form">
                    <h3>{editingDiagnosisId ? "Edit Diagnosis" : "Create Diagnosis"}</h3>
                    <form className="form-grid" onSubmit={handleSubmitDiagnosis}>
                        <label>
                            Encounter
                            <AsyncSelect
                                value={newDiagnosis.encounter_id}
                                onChange={(value) => handleFKChange('encounter_id', value)}
                                fetchOptions={api.getEncounterOptions}
                                getOptionLabel={formatEncounterLabel}
                                getOptionValue={(opt) => opt.encounter_id}
                                placeholder="Select encounter..."
                                required
                            />
                        </label>
                        <label>
                            Diagnosis Code
                            <input
                                name="diagnosis_code"
                                value={newDiagnosis.diagnosis_code}
                                onChange={handleFormChange}
                                required
                            />
                        </label>
                        <label>
                            Description
                            <input
                                name="diagnosis_description"
                                value={newDiagnosis.diagnosis_description}
                                onChange={handleFormChange}
                            />
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                                type="checkbox"
                                name="primary_flag"
                                checked={newDiagnosis.primary_flag}
                                onChange={handleFormChange}
                            />
                            Primary Diagnosis
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                                type="checkbox"
                                name="chronic_flag"
                                checked={newDiagnosis.chronic_flag}
                                onChange={handleFormChange}
                            />
                            Chronic Condition
                        </label>
                        {formError && <p className="form-error">{formError}</p>}
                        <div className="form-actions">
                            <button type="submit" className="hp-primary-btn">
                                {editingDiagnosisId ? "Update Diagnosis" : "Save Diagnosis"}
                            </button>
                            <button
                                type="button"
                                className="hp-secondary-btn"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setEditingDiagnosisId(null);
                                    setNewDiagnosis(emptyDiagnosis);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
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
                                            <button className="hp-secondary-btn" onClick={() => handleEditDiagnosis(d)} style={{ marginRight: 8 }}>
                                                Edit
                                            </button>
                                            <button className="hp-danger-btn" onClick={() => handleDelete(d.diagnosis_id)}>Delete</button>
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

export default DiagnosesPage;
