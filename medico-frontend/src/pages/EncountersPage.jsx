import React from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";

const EncountersPage = () => {
  return (
    <SharedLayout
      title="Encounters"
      subtitle="Track visits, admission details, diagnoses and overall patient journey."
      activePage="encounters"
    >
      <div className="page-grid">
        <div className="page-card">
          <h3>📋 Active Encounters</h3>
          <p>View all ongoing patient visits and admissions.</p>
          <button className="hp-link-btn">Open Dashboard →</button>
        </div>

        <div className="page-card">
          <h3>🧪 New Encounter</h3>
          <p>Create a new encounter and associate with patient and provider records.</p>
          <button className="hp-primary-btn">Start New Encounter</button>
        </div>

        <div className="page-card">
          <h3>🕒 Encounter History</h3>
          <p>Search past visits, diagnoses and outcomes by date or provider.</p>
          <button className="hp-secondary-btn">Search Records</button>
        </div>
      </div>

      <div className="page-section">
        <h3>Recent Encounters</h3>
        <table className="page-table">
          <thead>
            <tr>
              <th>Encounter ID</th>
              <th>Patient</th>
              <th>Provider</th>
              <th>Date</th>
              <th>Diagnosis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ENC-20251110-03</td>
              <td>Ali Demir</td>
              <td>Dr. Ayşe Kaya</td>
              <td>2025-11-10</td>
              <td>Acute bronchitis</td>
            </tr>
            <tr>
              <td>ENC-20251114-07</td>
              <td>Zeynep Yılmaz</td>
              <td>Dr. Mehmet Acar</td>
              <td>2025-11-14</td>
              <td>Check-up</td>
            </tr>
          </tbody>
        </table>
      </div>
    </SharedLayout>
  );
};

export default EncountersPage;
