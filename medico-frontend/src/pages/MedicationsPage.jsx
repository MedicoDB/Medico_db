import React from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";

const MedicationsPage = () => {
  return (
    <SharedLayout
      title="Medications"
      subtitle="Review medication history, prescribed dosages and prescriber information."
      activePage="medications"
    >
      <div className="page-grid">
        <div className="page-card">
          <h3>💊 Medication List</h3>
          <p>Explore all prescribed medications across patient records.</p>
          <button className="hp-link-btn">View All →</button>
        </div>

        <div className="page-card">
          <h3>➕ Add Medication</h3>
          <p>Create a new medication entry for a patient & encounter.</p>
          <button className="hp-primary-btn">Add Medication</button>
        </div>

        <div className="page-card">
          <h3>📈 Medication Stats</h3>
          <p>Check top prescribed drugs, dosage patterns and more.</p>
          <button className="hp-secondary-btn">View Analytics</button>
        </div>
      </div>

      <div className="page-section">
        <h3>Recent Medications</h3>
        <table className="page-table">
          <thead>
            <tr>
              <th>Drug Name</th>
              <th>Dosage</th>
              <th>Route</th>
              <th>Prescriber</th>
              <th>Date</th>
              <th>Patient</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Amoxicillin</td>
              <td>500 mg</td>
              <td>Oral</td>
              <td>Dr. Ayşe Kaya</td>
              <td>2025-11-11</td>
              <td>Ali Demir</td>
            </tr>
            <tr>
              <td>Ibuprofen</td>
              <td>200 mg</td>
              <td>Oral</td>
              <td>Dr. Mehmet Acar</td>
              <td>2025-11-15</td>
              <td>Zeynep Yılmaz</td>
            </tr>
          </tbody>
        </table>
      </div>
    </SharedLayout>
  );
};

export default MedicationsPage;
