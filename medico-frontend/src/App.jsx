import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import ProceduresPage from "./pages/ProceduresPage.jsx";
import MedicationsPage from "./pages/MedicationsPage.jsx";
import PatientsPage from "./pages/PatiensPage.jsx";
import EncountersPage from "./pages/EncountersPage.jsx";
import BillingPage from "./pages/BillingPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/patients" element={<PatientsPage />} />
      <Route path="/encounters" element={<EncountersPage />} />
      <Route path="/procedures" element={<ProceduresPage />} />
      <Route path="/medications" element={<MedicationsPage />} />
      <Route path="/billing" element={<BillingPage />} />
      <Route path="/reports" element={<ReportsPage />} />
    </Routes>
  );
}

export default App;