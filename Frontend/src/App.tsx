import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import TripDetail from "./pages/TripDetail";
import Auth from "./pages/Auth";
import ProfilePage from "./pages/ProfilePage";
import TripBalances from "./pages/TripBalances";
import NotFound from "./pages/NotFound";
import { ToastProvider } from "./components/ui/Toast";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import ResetPassword from "./pages/ResetPassword";
import MainLayout from "./components/layout/MainLayout";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/trip/:id" element={<TripDetail />} />
                <Route path="/trip/:id/balances" element={<TripBalances />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
              <Route
                path="/auth"
                element={
                  <PublicRoute>
                    <Auth />
                  </PublicRoute>
                }
              />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
