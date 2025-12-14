import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "./services/api";
import "./HomePage.css";

const HomePage = () => {
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Default to today's date in YYYY-MM-DD format
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, activitiesData] = await Promise.all([
        api.getDashboardStats(selectedDate),
        api.getRecentActivities(selectedDate)
      ]);
      setStats(statsData);
      setActivities(activitiesData.activities || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'procedure':
        return '🧪';
      case 'medication':
        return '💊';
      case 'encounter':
        return '📋';
      default:
        return '📄';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--hp-bg-main)" }}>
      <div style={{ display: "flex" }}>
      {/* Sidebar */}
        <div style={{
          width: "260px",
          backgroundColor: "var(--hp-bg-card)",
          borderRight: "1px solid var(--hp-border)",
          minHeight: "100vh",
          padding: "24px 0",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto"
        }}>
          <div style={{ padding: "0 20px", marginBottom: "32px" }}>
            <h2 style={{ margin: 0, color: "var(--hp-primary)", fontSize: "24px", fontWeight: "700" }}>
              Medico
            </h2>
        </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "0 12px" }}>
          <Link to="/" className={`hp-nav-item ${location.pathname === '/' ? 'hp-nav-item--active' : ''}`}>
            Dashboard
          </Link>
          <Link to="/patients" className={`hp-nav-item ${location.pathname === '/patients' ? 'hp-nav-item--active' : ''}`}>
            Patients
          </Link>
          <Link to="/encounters" className={`hp-nav-item ${location.pathname === '/encounters' ? 'hp-nav-item--active' : ''}`}>
            Encounters
          </Link>
            <Link to="/insurers" className={`hp-nav-item ${location.pathname === '/insurers' ? 'hp-nav-item--active' : ''}`}>
              Insurers
            </Link>
            <Link to="/claims" className={`hp-nav-item ${location.pathname === '/claims' ? 'hp-nav-item--active' : ''}`}>
              Claims
            </Link>
            <Link to="/denials" className={`hp-nav-item ${location.pathname === '/denials' ? 'hp-nav-item--active' : ''}`}>
              Denials
            </Link>
            <Link to="/procedures" className={`hp-nav-item ${location.pathname === '/procedures' ? 'hp-nav-item--active' : ''}`}>
              Procedures
            </Link>
            <Link to="/lab-tests" className={`hp-nav-item ${location.pathname === '/lab-tests' ? 'hp-nav-item--active' : ''}`}>
              Lab Tests
            </Link>
            <Link to="/medications" className={`hp-nav-item ${location.pathname === '/medications' ? 'hp-nav-item--active' : ''}`}>
              Medications
            </Link>
            <Link to="/diagnoses" className={`hp-nav-item ${location.pathname === '/diagnoses' ? 'hp-nav-item--active' : ''}`}>
              Diagnoses
            </Link>
            <Link to="/providers" className={`hp-nav-item ${location.pathname === '/providers' ? 'hp-nav-item--active' : ''}`}>
              Providers
            </Link>
            <Link to="/department-heads" className={`hp-nav-item ${location.pathname === '/department-heads' ? 'hp-nav-item--active' : ''}`}>
              Department Heads
            </Link>
        </nav>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          <header style={{
            backgroundColor: "var(--hp-bg-card)",
            borderBottom: "1px solid var(--hp-border)",
            padding: "20px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "600", color: "var(--hp-text-main)" }}>
              Dashboard
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <label htmlFor="dashboard-date" style={{ 
                fontSize: "14px", 
                fontWeight: "500", 
                color: "var(--hp-text-main)",
                marginRight: "8px"
              }}>
                Pick a date for Dashboard:
              </label>
              <input
                id="dashboard-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: "8px 12px",
                  fontSize: "14px",
                  border: "1px solid var(--hp-border)",
                  borderRadius: "6px",
                  backgroundColor: "var(--hp-bg-main)",
                  color: "var(--hp-text-main)",
                  cursor: "pointer"
                }}
              />
            </div>
        </header>

        {error && (
          <div style={{ 
            padding: "16px", 
            margin: "24px", 
            backgroundColor: "rgba(220, 53, 69, 0.1)", 
            color: "#dc3545", 
            borderRadius: "8px", 
            border: "1px solid rgba(220, 53, 69, 0.3)" 
          }}>
            {error}
            </div>
        )}

        {/* Dashboard Snapshot */}
        <section className="hp-section">
          <div className="hp-section-header">
            <h2>Dashboard Snapshot</h2>
            <p>Statistics for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--hp-text-soft)" }}>
              Loading statistics...
            </div>
          ) : stats ? (
            <div className="hp-hero-card hp-hero-card--gradient" style={{ marginTop: "24px" }}>
              <div className="hp-hero-card-grid">
                <div>
                  <p className="hp-hero-card-number">{stats.active_patients || 0}</p>
                  <p className="hp-hero-card-caption">Active Patients</p>
                </div>
                <div>
                  <p className="hp-hero-card-number">{stats.open_encounters || 0}</p>
                  <p className="hp-hero-card-caption">Open Encounters</p>
                </div>
                <div>
                  <p className="hp-hero-card-number">{stats.procedures_today || 0}</p>
                  <p className="hp-hero-card-caption">Procedures Today</p>
                </div>
                <div>
                  <p className="hp-hero-card-number">{stats.medications_issued || 0}</p>
                  <p className="hp-hero-card-caption">Medications Issued</p>
              </div>
            </div>

              <div className="hp-hero-mini-cards" style={{ marginTop: "24px" }}>
              <div className="hp-mini-card">
                <p className="hp-mini-label">Average stay</p>
                <p className="hp-mini-main">
                    {stats.avg_stay || 0} <span>days</span>
                </p>
              </div>
              <div className="hp-mini-card">
                <p className="hp-mini-label">Claims approval</p>
                <p className="hp-mini-main">
                    {stats.claims_approval_rate || 0}<span>%</span>
                </p>
              </div>
            </div>
          </div>
          ) : null}
        </section>

        {/* Recent Activities */}
        <section className="hp-section">
          <div className="hp-section-header">
            <h2>Recent Activities</h2>
            <p>Latest procedures, medications, and encounters from the past 7 days</p>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--hp-text-soft)" }}>
              Loading activities...
            </div>
          ) : activities.length > 0 ? (
            <div style={{ 
              backgroundColor: "var(--hp-bg-card)", 
              borderRadius: "var(--hp-radius-lg)", 
              overflow: "hidden",
              border: "1px solid var(--hp-border)",
              marginTop: "24px"
            }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ backgroundColor: "rgba(148, 163, 184, 0.1)" }}>
                    <tr>
                      <th style={{ padding: "16px", textAlign: "left", color: "var(--hp-text-main)", fontWeight: "600", fontSize: "13px", textTransform: "uppercase" }}>
                        Type
                      </th>
                      <th style={{ padding: "16px", textAlign: "left", color: "var(--hp-text-main)", fontWeight: "600", fontSize: "13px", textTransform: "uppercase" }}>
                        Date
                      </th>
                      <th style={{ padding: "16px", textAlign: "left", color: "var(--hp-text-main)", fontWeight: "600", fontSize: "13px", textTransform: "uppercase" }}>
                        Description
                      </th>
                      <th style={{ padding: "16px", textAlign: "left", color: "var(--hp-text-main)", fontWeight: "600", fontSize: "13px", textTransform: "uppercase" }}>
                        Patient
                      </th>
                      <th style={{ padding: "16px", textAlign: "left", color: "var(--hp-text-main)", fontWeight: "600", fontSize: "13px", textTransform: "uppercase" }}>
                        Provider
                      </th>
                      <th style={{ padding: "16px", textAlign: "left", color: "var(--hp-text-main)", fontWeight: "600", fontSize: "13px", textTransform: "uppercase" }}>
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity) => (
                      <tr key={`${activity.type}-${activity.id}`} style={{ borderTop: "1px solid var(--hp-border)" }}>
                        <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                          <span style={{ fontSize: "20px", marginRight: "8px" }}>
                            {getActivityIcon(activity.type)}
                          </span>
                          <span style={{ textTransform: "capitalize", fontWeight: "500" }}>
                            {activity.type}
                          </span>
                        </td>
                        <td style={{ padding: "16px", color: "var(--hp-text-soft)" }}>
                          {formatDate(activity.date)}
                        </td>
                        <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                          {activity.description}
                        </td>
                        <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                          <Link 
                            to={`/patients/${activity.patient_id || ''}`} 
                            style={{ color: "var(--hp-primary)", textDecoration: "none" }}
                          >
                            {activity.patient_name}
                          </Link>
                        </td>
                        <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                          {activity.provider_name}
                        </td>
                        <td style={{ padding: "16px", color: "var(--hp-text-main)" }}>
                          {activity.type === 'procedure' && activity.cost && (
                            <span>${parseFloat(activity.cost).toFixed(2)}</span>
                          )}
                          {activity.type === 'medication' && activity.frequency && (
                            <span style={{ fontSize: "12px", color: "var(--hp-text-soft)" }}>
                              {activity.frequency}
                            </span>
                          )}
                          {activity.type === 'encounter' && activity.status && (
                            <span style={{ 
                              padding: "4px 8px", 
                              borderRadius: "4px", 
                              backgroundColor: activity.status === 'Completed' ? "rgba(34, 197, 94, 0.1)" : "rgba(251, 191, 36, 0.1)",
                              color: activity.status === 'Completed' ? "#22c55e" : "#fbbf24",
                              fontSize: "12px",
                              fontWeight: "500"
                            }}>
                              {activity.status}
                            </span>
                          )}
                          {activity.encounter_id && (
                            <Link 
                              to={`/encounters/${activity.encounter_id}`}
                              style={{ 
                                marginLeft: "8px",
                                color: "var(--hp-primary)", 
                                textDecoration: "none",
                                fontSize: "12px"
                              }}
                            >
                              View →
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </div>
          ) : (
            <div style={{ 
              padding: "40px", 
              textAlign: "center", 
              color: "var(--hp-text-soft)",
              backgroundColor: "var(--hp-bg-card)",
              borderRadius: "var(--hp-radius-lg)",
              border: "1px solid var(--hp-border)",
              marginTop: "24px"
            }}>
              No recent activities found
            </div>
          )}
        </section>
          </div>
          </div>
    </div>
  );
};

export default HomePage;
