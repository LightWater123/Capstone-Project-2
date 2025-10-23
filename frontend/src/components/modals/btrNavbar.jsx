import Bell from "../../assets/notification.png";
import profileuser from "../../assets/profile-user.png";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "./LogoutButton";
import { Settings } from "lucide-react";
import { UserPlus } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export default function BTRNavbar() {
  const [isDropOpen, setIsDropOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCreateServiceAccount = () => navigate("/register/service");
  const handleCreateAdminAccount = () => navigate("/register/admin");
  const handleBack = () => navigate("/admin/dashboard");
  const handleSettings = () => navigate("/settings");
  const handleCalendar = () => navigate("/calendar-full");

  return (
    <div className="max-w-[88rem] mx-auto px-4 sm:px-6 mt-4">
      <nav className="w-full border-b border-gray-300 px-5 py-3 text-sm flex items-center justify-between">
        {/* LEFT */}
        <div className="flex justify-start gap-3">
          <Button
            onClick={handleBack}
            variant="ghost"
            className="relative text-sm px-3 py-1bg-transparent border-none after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px] after:h-[4px] after:w-0 after:bg-gray-800 after:rounded-full after:-translate-x-1/2 after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
          >
            <span className="">Dashboard</span>
          </Button>

          <Button
            onClick={handleSettings}
            variant="ghost"
            className="relative text-sm px-3 py-1bg-transparent border-none after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px] after:h-[4px] after:w-0 after:bg-gray-800 after:rounded-full after:-translate-x-1/2 after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
          >
            <span className="">Settings</span>
          </Button>

          <Button
            onClick={handleCalendar}
            variant="ghost"
            className="relative text-sm px-3 py-1bg-transparent border-none after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px] after:h-[4px] after:w-0 after:bg-gray-800 after:rounded-full after:-translate-x-1/2 after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
          >
            <span className="">Calendar</span>
          </Button>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">
          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropOpen((v) => !v)}
              className="flex items-center gap-2 text-gray-700 hover:text-black"
            >
              <User className="h-5 w-5" />
              <span className="hidden sm:inline text-base p-2">
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
