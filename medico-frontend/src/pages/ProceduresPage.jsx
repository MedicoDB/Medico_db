import React from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";

const ProceduresPage = () => {
  return (
    <SharedLayout
      title="Procedures"
      subtitle="View procedures linked to encounters and providers, including costs and codes."
      activePage="procedures"
    >
      <div className="page-grid">
        <div className="page-card">
          <h3>🧪 Procedure List</h3>
          <p>Browse all recorded medical procedures in the system.</p>
          <button className="hp-link-btn">View All →</button>
        </div>

        <div className="page-card">
          <h3>➕ Add Procedure</h3>
          <p>Add a new medical procedure associated with encounter & provider.</p>
          <button className="hp-primary-btn">Add Procedure</button>
        </div>

        <div className="page-card">
          <h3>📊 Procedure Analytics</h3>
          <p>Analyze cost distribution, frequency and provider mapping.</p>
          <button className="hp-secondary-btn">View Analytics</button>
        </div>
      </div>

      <div className="page-section">
        <h3>Recent Procedures</h3>
        <table className="page-table">
          <thead>
            <tr>
              <th>Procedure Code</th>
              <th>Description</th>
              <th>Date</th>
              <th>Cost</th>
              <th>Provider</th>
              <th>Patient</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>PROC-0043</td>
              <td>Blood Test</td>
              <td>2025-11-10</td>
              <td>$45</td>
              <td>Dr. Ayşe Kaya</td>
              <td>Ali Demir</td>
            </tr>
            <tr>
              <td>PROC-0101</td>
              <td>X-Ray Imaging</td>
              <td>2025-11-14</td>
              <td>$120</td>
              <td>Dr. Mehmet Acar</td>
              <td>Zeynep Yılmaz</td>
            </tr>
          </tbody>
        </table>
      </div>
    </SharedLayout>
  );
};

export default ProceduresPage;
