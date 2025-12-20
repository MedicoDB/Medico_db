import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "./services/api";
import Sidebar from "./components/Sidebar";
import "./HomePage.css";

const HomePage = () => {
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
        <Sidebar />

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
            <div className="hp-table-container">
              <div style={{ overflowX: "auto" }}>
                <table className="hp-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Patient</th>
                      <th>Provider</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity) => (
                      <tr key={`${activity.type}-${activity.id}`}>
                        <td>
                          <span style={{ fontSize: "20px", marginRight: "8px" }}>
                            {getActivityIcon(activity.type)}
                          </span>
                          <span style={{ textTransform: "capitalize", fontWeight: "500" }}>
                            {activity.type}
                          </span>
                        </td>
                        <td>{formatDate(activity.date)}</td>
                        <td>{activity.description}</td>
                        <td>
                          <Link 
                            to={`/patients/${activity.patient_id || ''}`} 
                            style={{ color: "var(--hp-primary)", textDecoration: "none" }}
                          >
                            {activity.patient_name}
                          </Link>
                        </td>
                        <td>{activity.provider_name}</td>
                        <td>
                          {activity.type === 'procedure' && activity.cost && (
                            <span>${parseFloat(activity.cost).toFixed(2)}</span>
                          )}
                          {activity.type === 'medication' && activity.frequency && (
                            <span style={{ fontSize: "12px", color: "var(--hp-text-soft)" }}>
                              {activity.frequency}
                            </span>
                          )}
                          {activity.type === 'encounter' && activity.status && (
                            <span className={activity.status === 'Completed' ? 'hp-status-badge hp-status-badge--completed' : 'hp-status-badge hp-status-badge--pending'}>
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
