import React from "react";
import SharedLayout from "../components/SharedLayout";
import "./Pages.css";

const PatientsPage = () => {
  return (
    <SharedLayout
      title="Patients"
      subtitle="Search and manage patient profiles, demographics and contact information."
      activePage="patients"
    >
      <div className="page-grid">
        <div className="page-card">
          <h3>👤 Patient List</h3>
          <p>Browse all registered patients in the system.</p>
          <button className="hp-link-btn">View All →</button>
        </div>

        <div className="page-card">
          <h3>➕ Add New Patient</h3>
          <p>Create a new patient profile including demographics, insurance and contacts.</p>
          <button className="hp-primary-btn">Add Patient</button>
        </div>

        <div className="page-card">
          <h3>📊 Demographics</h3>
          <p>View distribution by age, gender, location and insurance coverage.</p>
          <button className="hp-secondary-btn">View Analytics</button>
        </div>
      </div>

      <div className="page-section">
        <h3>Recently Added Patients</h3>
        <table className="page-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Last Visit</th>
              <th>Insurance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Ali Demir</td>
              <td>34</td>
              <td>Male</td>
              <td>2025-11-10</td>
              <td>Anadolu Sigorta</td>
            </tr>
            <tr>
              <td>Zeynep Yılmaz</td>
              <td>29</td>
              <td>Female</td>
              <td>2025-11-14</td>
              <td>AXA</td>
            </tr>
          </tbody>
        </table>
      </div>
    </SharedLayout>
  );
};

export default PatientsPage;
