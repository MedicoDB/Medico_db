import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./HomePage.css";
import { api } from "../services/api";
import TopBar from "../components/TopBar";  // ✅ DARK MODE BUTONUNU GETİREN TOPBAR
import ThemeToggle from "../components/ThemeToggle";  // ✅ Light/Dark mode toggle button

const HomePage = () => {
  const [stats, setStats] = useState({
    active_patients: 0,
    open_encounters: 0,
    procedures_today: 0,
    medications_issued: 0,
    avg_stay: 0,
    claims_approval_rate: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchValue, setSearchValue] = useState("");

  const navigate = useNavigate();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleLiveDashboard = () => {
    document.getElementById("dashboard-stats")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleQuickDemo = async () => {
    await fetchStats();
    alert("Dashboard refreshed with the latest demo data.");
  };

  const handleNewEncounter = () => {
    navigate("/encounters?action=new");
  };

  return (
    <div className="hp-root">
      {/* Sidebar */}
      <aside className="hp-sidebar">
        <div className="hp-logo">
          <span className="hp-logo-icon">🩺</span>
          <span className="hp-logo-text">Medico</span>
        </div>

        <nav className="hp-nav">
          <p className="hp-nav-title">Main</p>

          <Link to="/">
            <button className="hp-nav-item hp-nav-item--active">Dashboard</button>
          </Link>

          <Link to="/patients">
            <button className="hp-nav-item">Patients</button>
          </Link>

          <Link to="/encounters">
            <button className="hp-nav-item">Encounters</button>
          </Link>

          <Link to="/procedures">
            <button className="hp-nav-item">Procedures</button>
          </Link>

          <Link to="/medications">
            <button className="hp-nav-item">Medications</button>
          </Link>

          <p className="hp-nav-title hp-nav-title--secondary">Analytics</p>

          <Link to="/billing">
            <button className="hp-nav-item">Billing & Claims</button>
          </Link>

          <Link to="/reports">
            <button className="hp-nav-item">Reports</button>
          </Link>
        </nav>

        <div className="hp-sidebar-footer">
          <p className="hp-footer-title">Logged in as</p>
          <p className="hp-footer-name">Furkan İslamoğlu</p>
          <p className="hp-footer-role">Frontend Lead</p>
        </div>
      </aside>

      {/* Main */}
      <main className="hp-main">

        {/* ⭐️ TOPBAR WITH DARK MODE TOGGLE */}
        <div className="hp-topbar">
          <div className="hp-topbar-left">
            <h1 className="hp-page-title">Dashboard</h1>
            <p className="hp-page-subtitle">Welcome to Medico Platform overview</p>
          </div>
          <div className="hp-topbar-right">
            <ThemeToggle />
          </div>
        </div>

        {/* Hero Section */}
        <section className="hp-hero">
          <div className="hp-hero-left">
            <h2 className="hp-hero-title">
              Smarter Hospital Management with <span>Medico Platform</span>
            </h2>

            <p className="hp-hero-text">
              Monitor patient journeys from admission to discharge, track procedures & medications,
              and keep financials aligned – all from a single modern dashboard.
            </p>

            <div className="hp-hero-actions">
              <button className="hp-primary-btn" onClick={handleLiveDashboard}>
                View Live Dashboard
              </button>
              <button className="hp-secondary-btn" onClick={handleQuickDemo}>
                Quick Demo Data
              </button>
            </div>

            <div className="hp-hero-meta">
              <span>✓ Real hospital dataset</span>
              <span>✓ Encounter–Procedure–Medication links</span>
              <span>✓ Ready for analytics & reports</span>
            </div>
          </div>

          <div className="hp-hero-right">
            <div className="hp-hero-card hp-hero-card--gradient" id="dashboard-stats">
              <p className="hp-hero-card-label">Today's Snapshot</p>

              {loading ? (
                <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>
              ) : error ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#ff4444" }}>{error}</div>
              ) : (
                <div className="hp-hero-card-grid">
                  <div>
                    <p className="hp-hero-card-number">{stats.active_patients}</p>
                    <p className="hp-hero-card-caption">Active Patients</p>
                  </div>
                  <div>
                    <p className="hp-hero-card-number">{stats.open_encounters}</p>
                    <p className="hp-hero-card-caption">Open Encounters</p>
                  </div>
                  <div>
                    <p className="hp-hero-card-number">{stats.procedures_today}</p>
                    <p className="hp-hero-card-caption">Procedures Today</p>
                  </div>
                  <div>
                    <p className="hp-hero-card-number">{stats.medications_issued}</p>
                    <p className="hp-hero-card-caption">Medications Issued</p>
                  </div>
                </div>
              )}
            </div>

            <div className="hp-hero-mini-cards">
              <div className="hp-mini-card">
                <p className="hp-mini-label">Average stay</p>
                <p className="hp-mini-main">
                  {loading ? "..." : stats.avg_stay} <span>days</span>
                </p>
                <p className="hp-mini-trend hp-mini-trend--up">▲ 8% better than last week</p>
              </div>

              <div className="hp-mini-card">
                <p className="hp-mini-label">Claims approval</p>
                <p className="hp-mini-main">
                  {loading ? "..." : stats.claims_approval_rate}
                  <span>%</span>
                </p>
                <p className="hp-mini-trend hp-mini-trend--neutral">Stable vs last week</p>
              </div>
            </div>
          </div>
        </section>

        {/* 🔥 SEARCH BAR + New Encounter */}
        <section className="hp-section" style={{ marginTop: "30px" }}>
          <div className="hp-search-new-container" style={{ display: "flex", justifyContent: "center", gap: "10px", alignItems: "center" }}>
            <input
              className="hp-search hp-search--big"
              placeholder="Search patients, encounters, medications..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{ flex: "1", maxWidth: "500px" }}
            />
            <button className="hp-primary-btn" onClick={handleNewEncounter}>
              + New
            </button>
          </div>

          {/* Quick Access Cards */}
          <div className="hp-card-grid" style={{ marginTop: "20px" }}>
            <div className="hp-card">
              <div className="hp-card-icon hp-card-icon--patients">👤</div>
              <h4>Patients</h4>
              <p>Search and manage patient profiles, demographics and contact information.</p>
              <Link to="/patients">
                <button className="hp-link-btn">Go to Patients →</button>
              </Link>
            </div>

            <div className="hp-card">
              <div className="hp-card-icon hp-card-icon--encounters">📋</div>
              <h4>Encounters</h4>
              <p>Track visits, admission details, diagnoses and overall patient journey.</p>
              <Link to="/encounters">
                <button className="hp-link-btn">Go to Encounters →</button>
              </Link>
            </div>

            <div className="hp-card">
              <div className="hp-card-icon hp-card-icon--procedures">🧪</div>
              <h4>Procedures</h4>
              <p>View procedures linked to encounters and providers, including costs and codes.</p>
              <Link to="/procedures">
                <button className="hp-link-btn">Manage Procedures →</button>
              </Link>
            </div>

            <div className="hp-card">
              <div className="hp-card-icon hp-card-icon--medications">💊</div>
              <h4>Medications</h4>
              <p>Review medication history, prescribed dosages and prescriber information.</p>
              <Link to="/medications">
                <button className="hp-link-btn">View Medications →</button>
              </Link>
            </div>

            <div className="hp-card">
              <div className="hp-card-icon hp-card-icon--denials">⚖️</div>
              <h4>Denials</h4>
              <p>Track claim denials, reasons, appeals and final outcomes.</p>
              <Link to="/denials">
                <button className="hp-link-btn">Manage Denials →</button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
