import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import LoginAdmin from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import ForgotPassword from "./pages/Auth/ForgotPasswordPage";
import PinPage from "./pages/Auth/PinPage";
import HomePage from "./pages/website/HomePage";
import ShopPage from "./pages/website/ShopPage";
import OrderPage from "./pages/website/OrderPage";
import ProductDetailPage from "./pages/website/ProductDetailPage";
import WishlistPage from "./pages/website/WishlistPage";
import RecommendationPage from "./pages/website/RecommendationPage";
import Dashboard from "./pages/Admin/Dashboard";
import CategoryPage from "./pages/Admin/CategoryPage";
import ProductPage from "./pages/Admin/ProductPage";
import MainLayout from "./components/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import BrandPage from "./pages/Admin/BrandPage";
import NotFound from "./components/NotFound";
import CustomersPage from "./pages/Admin/CustomersPage";
import StaffPage from "./pages/Admin/StaffPage";
import InventoryPage from "./pages/Admin/InventoryPage";
import SupplierPage from "./pages/Admin/SupplierPage";
import PurchasePage from "./pages/Admin/PurchasePage";
import AdminOrderPage from "./pages/Admin/OrderPage";
import OrderMonitorPage from "./pages/Admin/OrderMonitorPage";
import FlashSalePage from "./pages/Admin/FlashSalePage";
import SettingsPage from "./pages/Admin/SettingsPage";
import MessagesPage from "./pages/Admin/MessagesPage";
import ReportPage from "./pages/Admin/ReportPage";
import AttendancePage from "./pages/Admin/AttendancePage";
import ChatBot from "./components/ChatBot";
import useHeartbeat from "./hooks/useHeartbeat";

function App() {
  useHeartbeat();

  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/recommendations" element={<RecommendationPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/orders" element={<OrderPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/auth/login" element={<LoginAdmin />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/pin" element={<PinPage />} />
          <Route path="*" element={<NotFound />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<MainLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="flash-sale" element={<FlashSalePage />} />
              <Route path="products" element={<ProductPage />} />
              <Route path="categories" element={<CategoryPage />} />
              <Route path="brands" element={<BrandPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="suppliers" element={<SupplierPage />} />
              <Route path="purchases" element={<PurchasePage />} />
              <Route path="orders" element={<AdminOrderPage />} />
              <Route path="order-monitor" element={<OrderMonitorPage />} />
              <Route path="orders/monitor" element={<OrderMonitorPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="reports" element={<ReportPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
        {/* Global AI ChatBot Assistant on all pages */}
        <ChatBot />
      </BrowserRouter>
    </LanguageProvider>
  </ThemeProvider>
  );
}

export default App;
