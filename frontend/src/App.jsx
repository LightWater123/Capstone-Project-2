import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import Login from "./pages/login";
import AdminRegister from "./pages/admin_register";
import ServiceRegister from "./pages/service_register";
import AdminDashboard from "./pages/admin_dashboard";
import ServiceDashboard from "./pages/service_dashboard";
import DirectorDashboard from "./pages/director_dashboard";
import Inventory from "./pages/inventory";
import ServiceArchive from "./pages/service_archive";
import AdminMessages from "./pages/admin_messages";
import MaintenanceList from "./pages/maintenance_list";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import ServiceInventory from "./pages/service_inventory";
import SettingsPage from "./pages/settings_page";
import CalendarFullPage from "./pages/full_calendar";
import ForgotPassword from "./pages/forgot_password";
import ResetPassword from "./pages/reset_password";
import AuthProvider from "./auth/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import ServiceSettings from "./pages/service_settings";

export const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="*" element={<Login />} />

            <Route path="/register/admin" element={<AdminRegister />} />
            <Route path="/register/service" element={<ServiceRegister />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/service/dashboard" element={<ServiceDashboard />} />
            <Route path="/oic/dashboard" element={<DirectorDashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/service/archive" element={<ServiceArchive />} />
            <Route path="/admin/messages" element={<AdminMessages />} />
            <Route
              path="/admin/maintenance-list"
              element={<MaintenanceList />}
            />
            <Route path="/service/inventory" element={<ServiceInventory />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/calendar-full" element={<CalendarFullPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/service/settings" element={<ServiceSettings />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}
