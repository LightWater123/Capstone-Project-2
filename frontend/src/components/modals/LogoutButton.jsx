// src/components/LogoutButton.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { LogOut } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

export default function LogoutButton({ className = "" }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      // await api.post("api/logout"); // Laravel kills the session
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      navigate("/login"); // Always go to login page
    }
  };

  return (
    <button onClick={handleLogout} className={className || "btn btn-danger"}>
      <LogOut className="h-4 w-4 inline-block mr-2" />
      Logout
    </button>
  );
}
