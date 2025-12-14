import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./HomePage";
import PatientsPage from "./pages/PatientsPage";
import EncountersPage from "./pages/EncountersPage";
import InsurersPage from "./pages/InsurersPage";
import PatientDetailPage from "./pages/PatientDetailPage";
import EncounterDetailPage from "./pages/EncounterDetailPage";
import InsurerDetailPage from "./pages/InsurerDetailPage";
import ClaimsPage from "./pages/ClaimsPage";
import DenialsPage from "./pages/DenialsPage";
import ClaimDetailPage from "./pages/ClaimDetailPage";
import DenialDetailPage from "./pages/DenialDetailPage";
import MedicationsPage from "./pages/MedicationsPage";
import ProceduresPage from "./pages/ProceduresPage";
import LabTestsPage from "./pages/LabTestsPage";
import LabTestDetailPage from "./pages/LabTestDetailPage";
import MedicationDetailPage from "./pages/MedicationDetailPage";
import ProcedureDetailPage from "./pages/ProcedureDetailPage";
import DiagnosesPage from "./pages/DiagnosesPage";
import ProvidersPage from "./pages/ProvidersPage";
import DepartmentHeadsPage from "./pages/DepartmentHeadsPage";
import DiagnosisDetailPage from "./pages/DiagnosisDetailPage";
import ProviderDetailPage from "./pages/ProviderDetailPage";
import DepartmentHeadDetailPage from "./pages/DepartmentHeadDetailPage";
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
            <Route path="/claims" element={<ClaimsPage />} />
            <Route path="/claims/:id" element={<ClaimDetailPage />} />
            <Route path="/denials" element={<DenialsPage />} />
            <Route path="/denials/:id" element={<DenialDetailPage />} />
            <Route path="/medications" element={<MedicationsPage />} />
            <Route path="/medications/:id" element={<MedicationDetailPage />} />
            <Route path="/procedures" element={<ProceduresPage />} />
            <Route path="/procedures/:id" element={<ProcedureDetailPage />} />
            <Route path="/lab-tests" element={<LabTestsPage />} />
            <Route path="/lab-tests/:id" element={<LabTestDetailPage />} />
            <Route path="/diagnoses" element={<DiagnosesPage />} />
            <Route path="/diagnoses/:id" element={<DiagnosisDetailPage />} />
            <Route path="/providers" element={<ProvidersPage />} />
            <Route path="/providers/:id" element={<ProviderDetailPage />} />
            <Route path="/department-heads" element={<DepartmentHeadsPage />} />
            <Route path="/department-heads/:id" element={<DepartmentHeadDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
    </Router>
  );
}

export default App;
