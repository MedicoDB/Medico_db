import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./HomePage";
import PatientsPage from "./pages/PatientsPage";
import EncountersPage from "./pages/EncountersPage";
import PatientDetailPage from "./pages/PatientDetailPage";
import EncounterDetailPage from "./pages/EncounterDetailPage";
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
