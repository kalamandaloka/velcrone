import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import ProductsListPage from "./pages/ProductsListPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import PemesananPage from "./pages/PemesananPage";
import MarketplacePage from "./pages/MarketplacePage";
import KontakPage from "./pages/KontakPage";
import AdminLayout from "./components/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import ProductsPage from "./pages/admin/ProductsPage";
import RawMaterialsPage from "./pages/admin/RawMaterialsPage";
import SuppliersPage from "./pages/admin/SuppliersPage";
import CustomersPage from "./pages/admin/CustomersPage";
import TransactionsPage from "./pages/admin/TransactionsPage";
import ProductionStatusPage from "./pages/admin/ProductionStatusPage";
import PaymentStatusPage from "./pages/admin/PaymentStatusPage";
import ReportsPage from "./pages/admin/ReportsPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import SettingsPage from "./pages/admin/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Marketplace */}
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsListPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/pemesanan" element={<PemesananPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/kontak" element={<KontakPage />} />

              {/* Admin */}
              <Route path="/dashboard" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                <Route index element={<DashboardPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="categories" element={<ProtectedRoute allowedRoles={['superadmin', 'owner', 'manager']}><CategoriesPage /></ProtectedRoute>} />
                <Route path="raw-materials" element={<ProtectedRoute allowedRoles={['superadmin', 'owner', 'manager']}><RawMaterialsPage /></ProtectedRoute>} />
                <Route path="suppliers" element={<ProtectedRoute allowedRoles={['superadmin', 'owner', 'manager']}><SuppliersPage /></ProtectedRoute>} />
                <Route path="customers" element={<ProtectedRoute allowedRoles={['superadmin', 'kasir']}><CustomersPage /></ProtectedRoute>} />
                <Route path="transactions" element={<TransactionsPage />} />
                <Route path="transactions/produksi" element={<ProductionStatusPage />} />
                <Route path="transactions/pembayaran" element={<PaymentStatusPage />} />
                <Route path="reports" element={<ProtectedRoute allowedRoles={['superadmin', 'owner']}><ReportsPage /></ProtectedRoute>} />
                <Route path="users" element={<ProtectedRoute allowedRoles={['superadmin']}><UserManagementPage /></ProtectedRoute>} />
                <Route path="settings" element={<ProtectedRoute allowedRoles={['superadmin']}><SettingsPage /></ProtectedRoute>} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
