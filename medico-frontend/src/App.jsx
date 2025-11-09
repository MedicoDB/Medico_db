import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import ProceduresPage from "./pages/ProceduresPage.jsx";
import MedicationsPage from "./pages/MedicationsPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/procedures" element={<ProceduresPage />} />
      <Route path="/medications" element={<MedicationsPage />} />
    </Routes>
  );
}

export default App;