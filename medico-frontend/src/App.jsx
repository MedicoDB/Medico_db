import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./HomePage";
import PatientsPage from "./pages/PatientsPage";
import EncountersPage from "./pages/EncountersPage";
import InsurersPage from "./pages/InsurersPage";
import PatientDetailPage from "./pages/PatientDetailPage";
import EncounterDetailPage from "./pages/EncounterDetailPage";
import InsurerDetailPage from "./pages/InsurerDetailPage";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/patients/:id" element={<PatientDetailPage />} />
        <Route path="/encounters" element={<EncountersPage />} />
        <Route path="/encounters/:id" element={<EncounterDetailPage />} />
        <Route path="/insurers" element={<InsurersPage />} />
        <Route path="/insurers/:id" element={<InsurerDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
