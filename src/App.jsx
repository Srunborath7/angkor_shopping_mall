import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginAdmin from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import ForgotPassword from "./pages/Auth/ForgotPasswordPage";
import HomePage from "./pages/website/HomePage";
import ShopPage from "./pages/website/ShopPage";
import OrderPage from "./pages/website/OrderPage";
import ProductDetailPage from "./pages/website/ProductDetailPage";
import WishlistPage from "./pages/website/WishlistPage";
import RecommendationPage from "./pages/website/RecommendationPage";
import WebsiteTradingPage from "./pages/website/TradingPage";
import Dashboard from "./pages/Admin/Dashboard";
import CategoryPage from "./pages/Admin/CategoryPage";
import ProductPage from "./pages/Admin/ProductPage";
import TradingPage from "./pages/Admin/TradingPage";
import MainLayout from "./components/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import BrandPage from "./pages/Admin/BrandPage";
import NotFound from "./components/NotFound";
import CustomersPage from "./pages/Admin/CustomersPage";
import InventoryPage from "./pages/Admin/InventoryPage";
import SupplierPage from "./pages/Admin/SupplierPage";
import PurchasePage from "./pages/Admin/PurchasePage";
import AdminOrderPage from "./pages/Admin/OrderPage";
import FlashSalePage from "./pages/Admin/FlashSalePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/recommendations" element={<RecommendationPage />} />
        <Route path="/trading" element={<WebsiteTradingPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/orders" element={<OrderPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/auth/login" element={<LoginAdmin />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<NotFound />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<MainLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="flash-sale" element={<FlashSalePage />} />
            <Route path="products" element={<ProductPage />} />
            <Route path="trading" element={<TradingPage />} />
            <Route path="categories" element={<CategoryPage />} />
            <Route path="brands" element={<BrandPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="suppliers" element={<SupplierPage />} />
            <Route path="purchases" element={<PurchasePage />} />
            <Route path="orders" element={<AdminOrderPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
