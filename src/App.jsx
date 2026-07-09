import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginAdmin from "./pages/Auth/LoginPage";
import Dashboard from "./pages/Admin/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginAdmin />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;