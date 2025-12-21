import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../HomePage.css";
import ThemeToggle from "./ThemeToggle";

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="hp-sidebar">
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--hp-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            🏥
          </div>
          <h2
            style={{
              margin: 0,
              color: "var(--hp-text-main)",
              fontSize: "20px",
              fontWeight: "700",
            }}
          >
            Medico
          </h2>
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
        <div style={{ marginBottom: "8px" }}>
          <div
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--hp-text-soft)",
              marginBottom: "8px",
              padding: "0 12px",
              fontWeight: "600",
            }}
          >
            MAIN
          </div>
          <Link
            to="/"
            className={`hp-nav-item ${location.pathname === "/" ? "hp-nav-item--active" : ""}`}
          >
            Dashboard
          </Link>
          <Link
            to="/patients"
            className={`hp-nav-item ${location.pathname === "/patients" ? "hp-nav-item--active" : ""}`}
          >
            Patients
          </Link>
          <Link
            to="/encounters"
            className={`hp-nav-item ${location.pathname === "/encounters" ? "hp-nav-item--active" : ""}`}
          >
            Encounters
          </Link>
          <Link
            to="/procedures"
            className={`hp-nav-item ${location.pathname === "/procedures" ? "hp-nav-item--active" : ""}`}
          >
            Procedures
          </Link>
          <Link
            to="/medications"
            className={`hp-nav-item ${location.pathname === "/medications" ? "hp-nav-item--active" : ""}`}
          >
            Medications
          </Link>
        </div>

        <div style={{ marginTop: "16px" }}>
          <div
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--hp-text-soft)",
              marginBottom: "8px",
              padding: "0 12px",
              fontWeight: "600",
            }}
          >
            ANALYTICS
          </div>
          <Link
            to="/claims"
            className={`hp-nav-item ${location.pathname === "/claims" || location.pathname.startsWith("/claims/") ? "hp-nav-item--active" : ""}`}
          >
            Billing & Claims
          </Link>
          <Link
            to="/denials"
            className={`hp-nav-item ${location.pathname === "/denials" || location.pathname.startsWith("/denials/") ? "hp-nav-item--active" : ""}`}
          >
            Denials
          </Link>
          <Link
            to="/insurers"
            className={`hp-nav-item ${location.pathname === "/insurers" || location.pathname.startsWith("/insurers/") ? "hp-nav-item--active" : ""}`}
          >
            Insurers
          </Link>
          <Link
            to="/lab-tests"
            className={`hp-nav-item ${location.pathname === "/lab-tests" || location.pathname.startsWith("/lab-tests/") ? "hp-nav-item--active" : ""}`}
          >
            Lab Tests
          </Link>
          <Link
            to="/diagnoses"
            className={`hp-nav-item ${location.pathname === "/diagnoses" || location.pathname.startsWith("/diagnoses/") ? "hp-nav-item--active" : ""}`}
          >
            Diagnoses
          </Link>
          <Link
            to="/providers"
            className={`hp-nav-item ${location.pathname === "/providers" || location.pathname.startsWith("/providers/") ? "hp-nav-item--active" : ""}`}
          >
            Providers
          </Link>
          <Link
            to="/department-heads"
            className={`hp-nav-item ${location.pathname === "/department-heads" || location.pathname.startsWith("/department-heads/") ? "hp-nav-item--active" : ""}`}
          >
            Department Heads
          </Link>
        </div>
      </nav>

      <div
        style={{
          marginTop: "auto",
          padding: "12px",
          borderRadius: "8px",
          background: "var(--hp-bg-soft)",
          border: "1px solid var(--hp-border)",
        }}
      >
        <div style={{ marginBottom: "12px" }}>
          <ThemeToggle />
        </div>
        <div
          style={{
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--hp-text-soft)",
            marginBottom: "4px",
          }}
        >
          LOGGED IN AS
        </div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "var(--hp-text-main)",
          }}
        >
          Furkan İslamoğlu
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

