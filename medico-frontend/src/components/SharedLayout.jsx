import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../pages/HomePage.css";
import ThemeToggle from "../components/ThemeToggle";

const SharedLayout = ({
  title,
  subtitle,
  children,
  activePage,
  searchValue = "",
  onSearchChange,
  onAddNew,
  showSearch = true,
  showAddNew = true
}) => {
  const location = useLocation();

  const isActive = (paths) => {
    if (Array.isArray(paths)) {
      return paths.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
    }
    return location.pathname === paths || location.pathname.startsWith(paths + '/');
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
            <button className={`hp-nav-item ${isActive("/") && location.pathname === "/" ? "hp-nav-item--active" : ""}`}>
              Dashboard
            </button>
          </Link>

          <Link to="/patients">
            <button className={`hp-nav-item ${isActive("/patients") ? "hp-nav-item--active" : ""}`}>
              Patients
            </button>
          </Link>

          <Link to="/encounters">
            <button className={`hp-nav-item ${isActive("/encounters") ? "hp-nav-item--active" : ""}`}>
              Encounters
            </button>
          </Link>

          <Link to="/procedures">
            <button className={`hp-nav-item ${isActive("/procedures") ? "hp-nav-item--active" : ""}`}>
              Procedures
            </button>
          </Link>

          <Link to="/medications">
            <button className={`hp-nav-item ${isActive("/medications") ? "hp-nav-item--active" : ""}`}>
              Medications
            </button>
          </Link>

          <Link to="/lab-tests">
            <button className={`hp-nav-item ${isActive("/lab-tests") ? "hp-nav-item--active" : ""}`}>
              Lab Tests
            </button>
          </Link>

          <Link to="/diagnoses">
            <button className={`hp-nav-item ${isActive("/diagnoses") ? "hp-nav-item--active" : ""}`}>
              Diagnoses
            </button>
          </Link>

          <p className="hp-nav-title hp-nav-title--secondary">Analytics</p>

          <Link to="/claims">
            <button className={`hp-nav-item ${isActive("/claims") ? "hp-nav-item--active" : ""}`}>
              Billing & Claims
            </button>
          </Link>

          <Link to="/denials">
            <button className={`hp-nav-item ${isActive("/denials") ? "hp-nav-item--active" : ""}`}>
              Denials
            </button>
          </Link>

          <Link to="/insurers">
            <button className={`hp-nav-item ${isActive("/insurers") ? "hp-nav-item--active" : ""}`}>
              Insurers
            </button>
          </Link>

          <p className="hp-nav-title hp-nav-title--secondary">Resources</p>

          <Link to="/providers">
            <button className={`hp-nav-item ${isActive("/providers") ? "hp-nav-item--active" : ""}`}>
              Providers
            </button>
          </Link>

          <Link to="/department-heads">
            <button className={`hp-nav-item ${isActive("/department-heads") ? "hp-nav-item--active" : ""}`}>
              Department Heads
            </button>
          </Link>

        </nav>

        <div className="hp-sidebar-footer">
          <p className="hp-footer-title">Logged in as</p>
          <p className="hp-footer-name">Admin User</p>
          <p className="hp-footer-role">System Administrator</p>
        </div>
      </aside>

      {/* Main Section */}
      <main className="hp-main">
        <header className="hp-topbar">
          <div className="hp-topbar-left">
            <h1 className="hp-page-title">{title}</h1>
            <p className="hp-page-subtitle">{subtitle}</p>
          </div>

          <div className="hp-topbar-right">

            {/* 🌗 Light/Dark Toggle */}
            <ThemeToggle />

            {/* 🔍 Search */}
            {showSearch && (
              <input
                className="hp-search"
                placeholder="Search..."
                value={searchValue}
                onChange={onSearchChange || (() => { })}
              />
            )}

            {/* ➕ Add New */}
            {showAddNew && (
              <button
                className="hp-primary-btn"
                onClick={onAddNew || (() => alert("Add New feature coming soon!"))}
              >
                + Add New
              </button>
            )}
          </div>
        </header>

        <section className="page-content">{children}</section>
      </main>
    </div>
  );
};

export default SharedLayout;
