import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import TripDetail from "./components/TripDetail";
import Auth from "./components/Auth";
import ProfilePage from "./components/ProfilePage";
import NotFound from "./components/NotFound";
import { ToastProvider } from "./components/Toast";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import ResetPassword from "./components/ResetPassword";
import MainLayout from "./components/MainLayout";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/trip/:id" element={<TripDetail />} />
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
            <Route
              path="/reset-password"
              element={<ResetPassword />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  </ThemeProvider>
  );
}
