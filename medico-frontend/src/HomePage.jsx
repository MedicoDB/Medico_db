import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => {
  const location = useLocation();
  
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
          <Link to="/" className={`hp-nav-item ${location.pathname === '/' ? 'hp-nav-item--active' : ''}`}>
            Dashboard
          </Link>
          <Link to="/patients" className={`hp-nav-item ${location.pathname === '/patients' ? 'hp-nav-item--active' : ''}`}>
            Patients
          </Link>
          <Link to="/encounters" className={`hp-nav-item ${location.pathname === '/encounters' ? 'hp-nav-item--active' : ''}`}>
            Encounters
          </Link>
          <button className="hp-nav-item">Procedures</button>
          <button className="hp-nav-item">Medications</button>

          <p className="hp-nav-title hp-nav-title--secondary">Analytics</p>
          <button className="hp-nav-item">Billing & Claims</button>
          <button className="hp-nav-item">Reports</button>
        </nav>

        <div className="hp-sidebar-footer">
          <p className="hp-footer-title">Logged in as</p>
          <p className="hp-footer-name">Furkan İslamoğlu</p>
          <p className="hp-footer-role">Frontend Lead</p>
        </div>
      </aside>

      {/* Main */}
      <main className="hp-main">
        {/* Top Bar */}
        <header className="hp-topbar">
          <div>
            <h1 className="hp-page-title">Hospital Overview</h1>
            <p className="hp-page-subtitle">
              Centralized view of patients, encounters, procedures and
              medications.
            </p>
          </div>
          <div className="hp-topbar-actions">
            <input
              className="hp-search"
              placeholder="Search patients, encounters..."
            />
            <button className="hp-primary-btn">+ New Encounter</button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="hp-hero">
          <div className="hp-hero-left">
            <h2 className="hp-hero-title">
              Smarter Hospital Management with{" "}
              <span>Medico Platform</span>
            </h2>
            <p className="hp-hero-text">
              Monitor patient journeys from admission to discharge, track
              procedures & medications, and keep financials aligned –
              all from a single modern dashboard.
            </p>
            <div className="hp-hero-actions">
              <button className="hp-primary-btn">View Live Dashboard</button>
              <button className="hp-secondary-btn">Quick Demo Data</button>
            </div>
            <div className="hp-hero-meta">
              <span>✓ Real hospital dataset</span>
              <span>✓ Encounter–Procedure–Medication links</span>
              <span>✓ Ready for analytics & reports</span>
            </div>
          </div>

          <div className="hp-hero-right">
            <div className="hp-hero-card hp-hero-card--gradient">
              <p className="hp-hero-card-label">Today’s Snapshot</p>
              <div className="hp-hero-card-grid">
                <div>
                  <p className="hp-hero-card-number">128</p>
                  <p className="hp-hero-card-caption">Active Patients</p>
                </div>
                <div>
                  <p className="hp-hero-card-number">63</p>
                  <p className="hp-hero-card-caption">Open Encounters</p>
                </div>
                <div>
                  <p className="hp-hero-card-number">214</p>
                  <p className="hp-hero-card-caption">Procedures Today</p>
                </div>
                <div>
                  <p className="hp-hero-card-number">97</p>
                  <p className="hp-hero-card-caption">Medications Issued</p>
                </div>
              </div>
            </div>

            <div className="hp-hero-mini-cards">
              <div className="hp-mini-card">
                <p className="hp-mini-label">Average stay</p>
                <p className="hp-mini-main">
                  3.1 <span>days</span>
                </p>
                <p className="hp-mini-trend hp-mini-trend--up">
                  ▲ 8% better than last week
                </p>
              </div>
              <div className="hp-mini-card">
                <p className="hp-mini-label">Claims approval</p>
                <p className="hp-mini-main">
                  92<span>%</span>
                </p>
                <p className="hp-mini-trend hp-mini-trend--neutral">
                  Stable vs last week
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Access Cards */}
        <section className="hp-section">
          <div className="hp-section-header">
            <h3>Quick access</h3>
            <p>Jump directly into core modules of the system.</p>
          </div>

          <div className="hp-card-grid">
            <div className="hp-card">
              <div className="hp-card-icon hp-card-icon--patients">👤</div>
              <h4>Patients</h4>
              <p>
                Search and manage patient profiles, demographics and
                contact information.
              </p>
              <Link to="/patients" className="hp-link-btn">Go to Patients →</Link>
            </div>

            <div className="hp-card">
              <div className="hp-card-icon hp-card-icon--encounters">📋</div>
              <h4>Encounters</h4>
              <p>
                Track visits, admission details, diagnoses and overall
                patient journey.
              </p>
              <Link to="/encounters" className="hp-link-btn">Go to Encounters →</Link>
            </div>

            <div className="hp-card">
              <div className="hp-card-icon hp-card-icon--procedures">🧪</div>
              <h4>Procedures</h4>
              <p>
                View procedures linked to encounters and providers,
                including costs and codes.
              </p>
              <button className="hp-link-btn">Manage Procedures →</button>
            </div>

            <div className="hp-card">
              <div className="hp-card-icon hp-card-icon--medications">💊</div>
              <h4>Medications</h4>
              <p>
                Review medication history, prescribed dosages and
                prescriber information.
              </p>
              <button className="hp-link-btn">View Medications →</button>
            </div>
          </div>
        </section>

        {/* Bottom Section */}
        <section className="hp-section hp-section--split">
          <div className="hp-section-panel">
            <h3>Why this matters for the project?</h3>
            <p>
              This UI is built around real relations: patient → encounter
              → procedure / medication, plus billing and denials. It helps
              you visually validate database design and SQL queries from
              the backend.
            </p>
            <ul className="hp-list">
              <li>Visual proof of your ERD and foreign keys</li>
              <li>Easy way to demo queries & reports</li>
              <li>Clear separation of frontend, backend and database layers</li>
            </ul>
          </div>

          <div className="hp-section-panel hp-section-panel--bordered">
            <h3>Next steps for you (Frontend)</h3>
            <ol className="hp-list hp-list--ordered">
              <li>Connect this page to real API endpoints.</li>
              <li>
                Add real navigation to Procedures & Medications pages
                you’ll build.
              </li>
              <li>
                Replace static numbers with live stats from encounters,
                procedures and medications tables.
              </li>
            </ol>
          </div>
        </section>
      </main>
    </div>
    
  );
};

export default HomePage;
