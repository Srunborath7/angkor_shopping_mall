import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginAdmin from "./pages/Auth/LoginPage";
import ForgotPassword from "./pages/Auth/ForgotPasswordPage";
import Dashboard from "./pages/Admin/Dashboard";
import HomePage from "./pages/website/HomePage";
import RegisterPage from "./pages/Auth/RegisterPage";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Auth */}
        <Route path="/auth/login" element={<LoginAdmin />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route 
          path="/auth/forgot-password" 
          element={<ForgotPassword />} 
        />

        {/* Admin */}
        <Route 
          path="/admin/dashboard" 
          element={<Dashboard />} 
        />

        {/* Customer */}
        <Route 
          path="/" 
          element={<HomePage />} 
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;
