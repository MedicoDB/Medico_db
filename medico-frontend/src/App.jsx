import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import ProceduresPage from "./pages/ProceduresPage.jsx";
import MedicationsPage from "./pages/MedicationsPage.jsx";
import PatientsPage from "./pages/PatiensPage.jsx";
import EncountersPage from "./pages/EncountersPage.jsx";
import BillingPage from "./pages/BillingPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import DenialsPage from "./pages/DenialsPage.jsx";
import DiagnosesPage from "./pages/DiagnosesPage.jsx";
import LabTestsPage from "./pages/LabTestsPage.jsx";
import ProvidersPage from "./pages/ProvidersPage.jsx";
import InsurersPage from "./pages/InsurersPage.jsx";
import DepartmentHeadsPage from "./pages/DepartmentHeadsPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/patients" element={<PatientsPage />} />
      <Route path="/encounters" element={<EncountersPage />} />
      <Route path="/procedures" element={<ProceduresPage />} />
      <Route path="/medications" element={<MedicationsPage />} />
      <Route path="/diagnoses" element={<DiagnosesPage />} />
      <Route path="/lab-tests" element={<LabTestsPage />} />
      <Route path="/providers" element={<ProvidersPage />} />
      <Route path="/insurers" element={<InsurersPage />} />
      <Route path="/department-heads" element={<DepartmentHeadsPage />} />
      <Route path="/billing" element={<BillingPage />} />
      <Route path="/denials" element={<DenialsPage />} />
      <Route path="/reports" element={<ReportsPage />} />
    </Routes>
  );
}

export default App;