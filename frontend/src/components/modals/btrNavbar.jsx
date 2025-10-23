import Bell from "../../assets/notification.png";
import profileuser from "../../assets/profile-user.png";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "./LogoutButton";
import { Settings } from "lucide-react";
import { UserPlus } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

export default function BTRNavbar() {
  const [isDropOpen, setIsDropOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCreateServiceAccount = () => navigate("/register/service");
  const handleCreateAdminAccount = () => navigate("/register/admin");
  const handleBack = () => navigate("/admin/dashboard");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
      <nav className="w-full bg-white shadow-sm rounded-xl mb-4 flex items-center justify-between px-5 py-3 text-sm">
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="text-sm bg-white px-3 py-1 rounded"
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg text-gray-500 font-bold text-lg">
              Dashboard
            </span>
          </button>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">
          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropOpen((v) => !v)}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-700"
            >
              <img
                src={profileuser}
                alt="User"
                className="h-7 w-7 rounded-full object-cover"
              />
              <span className="hidden sm:inline text-lg p-2">
                {user ? user.name ?? user.username : "Username"}
              </span>
              <svg
                className={`h-4 w-4 transition ${
                  isDropOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m19 9-7 7-7-7"
                />
              </svg>
            </button>

            {isDropOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 rounded-lg border bg-white shadow-lg py-1 z-40">
                <a
                  onClick={handleCreateServiceAccount}
                  href="#"
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  <UserPlus className="h-4 w-4 inline-block mr-2" />
                  Create Service User Account
                </a>

                <a
                  href="#"
                  onClick={handleCreateAdminAccount}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  <UserPlus className="h-4 w-4 inline-block mr-2" />
                  Create an Admin Account
                </a>
                <button
                  onClick={() => {
                    setIsDropOpen(false);
                    navigate("/settings");
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  <Settings className="h-4 w-4 inline-block mr-2" />
                  Settings
                </button>

                <LogoutButton className=" w-full text-left px-4 py-2 hover:bg-gray-100" />
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
