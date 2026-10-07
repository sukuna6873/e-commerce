import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import { StoreProvider, useStore } from "./store/StoreContext";
import { AdminAuthProvider } from "./store/AdminAuthContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { CartDrawer } from "./components/CartDrawer";
import { CompareTray } from "./components/CompareTray";
import { Toaster } from "./components/Toaster";
import { RedirectIfAuthed, RequireAuth } from "./components/guards";
import { RedirectIfAdminAuthed, RequireAdminAuth } from "./components/adminGuards";

import { HomePage } from "./pages/HomePage";
import { CatalogPage } from "./pages/CatalogPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { ComparePage } from "./pages/ComparePage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderConfirmationPage } from "./pages/OrderConfirmationPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";

import { AccountLayout } from "./pages/account/AccountLayout";
import { AccountOverviewPage } from "./pages/account/AccountOverviewPage";
import {
  AccountOrderDetailPage,
  AccountOrdersPage,
} from "./pages/account/AccountOrdersPage";
import { AccountWishlistPage } from "./pages/account/AccountWishlistPage";
import { AccountAddressesPage } from "./pages/account/AccountAddressesPage";

import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminOverviewPage } from "./pages/admin/AdminOverviewPage";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage";
import { AdminInventoryPage } from "./pages/admin/AdminInventoryPage";
import { AdminOrdersPage } from "./pages/admin/AdminOrdersPage";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminRegisterPage } from "./pages/admin/AdminRegisterPage";

/** Restores scroll position on navigation, the way a page-based site would. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/**
 * Page chrome. The bottom padding clears the fixed compare tray so it never
 * covers the last row of content.
 */
function Shell() {
  const { state } = useStore();
  const trayActive = state.compare.length > 0;

  return (
    <div className={`flex min-h-dvh flex-col ${trayActive ? "pb-16" : ""}`}>
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<CatalogPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />

          <Route
            path="/login"
            element={
              <RedirectIfAuthed>
                <LoginPage />
              </RedirectIfAuthed>
            }
          />

          <Route
            path="/account"
            element={
              <RequireAuth>
                <AccountLayout />
              </RequireAuth>
            }
          >
            <Route index element={<AccountOverviewPage />} />
            <Route path="orders" element={<AccountOrdersPage />} />
            <Route path="orders/:id" element={<AccountOrderDetailPage />} />
            <Route path="wishlist" element={<AccountWishlistPage />} />
            <Route path="addresses" element={<AccountAddressesPage />} />
          </Route>

          <Route
            path="/admin/login"
            element={
              <RedirectIfAdminAuthed>
                <AdminLoginPage />
              </RedirectIfAdminAuthed>
            }
          />
          <Route
            path="/admin/register"
            element={
              <RedirectIfAdminAuthed>
                <AdminRegisterPage />
              </RedirectIfAdminAuthed>
            }
          />

          <Route
            path="/admin"
            element={
              <RequireAdminAuth>
                <AdminLayout />
              </RequireAdminAuth>
            }
          >
            <Route index element={<AdminOverviewPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="inventory" element={<AdminInventoryPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
      <CompareTray />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AdminAuthProvider>
        <Shell />
      </AdminAuthProvider>
    </StoreProvider>
  );
}