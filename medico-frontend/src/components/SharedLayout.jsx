import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../pages/HomePage.css"; // aynı stiller kullanılacak

const SharedLayout = ({ title, subtitle, children, activePage, searchValue = "", onSearchChange, onAddNew }) => {
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

          <Link to="/">
            <button
              className={`hp-nav-item ${location.pathname === "/" ? "hp-nav-item--active" : ""}`}
            >
              Dashboard
            </button>
          </Link>
          <Link to="/patients">
            <button
              className={`hp-nav-item ${activePage === "patients" || location.pathname === "/patients" ? "hp-nav-item--active" : ""}`}
            >
              Patients
            </button>
          </Link>
          <Link to="/encounters">
            <button
              className={`hp-nav-item ${activePage === "encounters" || location.pathname === "/encounters" ? "hp-nav-item--active" : ""}`}
            >
              Encounters
            </button>
          </Link>
          <Link to="/procedures">
            <button
              className={`hp-nav-item ${activePage === "procedures" || location.pathname === "/procedures" ? "hp-nav-item--active" : ""}`}
            >
              Procedures
            </button>
          </Link>
          <Link to="/medications">
            <button
              className={`hp-nav-item ${activePage === "medications" || location.pathname === "/medications" ? "hp-nav-item--active" : ""}`}
            >
              Medications
            </button>
          </Link>

          <p className="hp-nav-title hp-nav-title--secondary">Analytics</p>
          <Link to="/billing">
            <button className={`hp-nav-item ${location.pathname === "/billing" ? "hp-nav-item--active" : ""}`}>Billing & Claims</button>
          </Link>
          <Link to="/reports">
            <button className={`hp-nav-item ${location.pathname === "/reports" ? "hp-nav-item--active" : ""}`}>Reports</button>
          </Link>
        </nav>

        <div className="hp-sidebar-footer">
          <p className="hp-footer-title">Logged in as</p>
          <p className="hp-footer-name">Furkan İslamoğlu</p>
          <p className="hp-footer-role">Frontend Lead</p>
        </div>
      </aside>

      {/* Main Section */}
      <main className="hp-main">
        <header className="hp-topbar">
          <div>
            <h1 className="hp-page-title">{title}</h1>
            <p className="hp-page-subtitle">{subtitle}</p>
          </div>
          <div className="hp-topbar-actions">
            <input
              className="hp-search"
              placeholder="Search..."
              value={searchValue}
              onChange={onSearchChange || (() => {})}
            />
            <button className="hp-primary-btn" onClick={onAddNew || (() => alert('Add New feature coming soon!'))}>+ Add New</button>
          </div>
        </header>

        {/* Page Content */}
        <section className="page-content">{children}</section>
      </main>
    </div>
  );
};

export default SharedLayout;
