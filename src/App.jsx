import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginAdmin from "./pages/Auth/LoginPage";
import ForgotPassword from "./pages/Auth/ForgotPasswordPage";
import Dashboard from "./pages/Admin/Dashboard";
import HomePage from "./pages/website/HomePage";
import RegisterPage from "./pages/Auth/RegisterPage";
import MainLayout from "./components/MainLayout";
import CategoryPage from "./pages/Admin/CategoryPage";

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

        <Route path="/admin" element={<MainLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="categories" element={<CategoryPage />} />
        </Route>

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
