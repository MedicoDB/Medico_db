import React from "react";
import "../pages/HomePage.css"; // aynı stiller kullanılacak

const SharedLayout = ({ title, subtitle, children, activePage }) => {
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

          <button
            className={`hp-nav-item ${activePage === "dashboard" ? "hp-nav-item--active" : ""}`}
          >
            Dashboard
          </button>
          <button
            className={`hp-nav-item ${activePage === "patients" ? "hp-nav-item--active" : ""}`}
          >
            Patients
          </button>
          <button
            className={`hp-nav-item ${activePage === "encounters" ? "hp-nav-item--active" : ""}`}
          >
            Encounters
          </button>
          <button
            className={`hp-nav-item ${activePage === "procedures" ? "hp-nav-item--active" : ""}`}
          >
            Procedures
          </button>
          <button
            className={`hp-nav-item ${activePage === "medications" ? "hp-nav-item--active" : ""}`}
          >
            Medications
          </button>

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
            />
            <button className="hp-primary-btn">+ Add New</button>
          </div>
        </header>

        {/* Page Content */}
        <section className="page-content">{children}</section>
      </main>
    </div>
  );
};

export default SharedLayout;
