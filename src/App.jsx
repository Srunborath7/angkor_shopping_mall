import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginAdmin from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import ForgotPassword from "./pages/Auth/ForgotPasswordPage";
import HomePage from "./pages/website/HomePage";
import Dashboard from "./pages/Admin/Dashboard";
import CategoryPage from "./pages/Admin/CategoryPage";
import MainLayout from "./components/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />}/>
        <Route path="/auth/login" element={<LoginAdmin />}/>
        <Route path="/auth/register" element={<RegisterPage />}/>
        <Route path="/auth/forgot-password" element={<ForgotPassword />}/>
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<MainLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="categories" element={<CategoryPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;