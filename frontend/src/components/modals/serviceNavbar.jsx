import Bell from "../../assets/notification.png";
import profileuser from "../../assets/profile-user.png";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "./LogoutButton";
import { User, Settings, Menu, X } from "lucide-react";
import { useServiceAuth } from "../../hooks/useServiceAuth";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [isDropOpen, setIsDropOpen] = useState(false);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const handleBack = () => navigate("/service/dashboard");
  const { user, isLoading } = useServiceAuth();
  const { user: userData } = useAuth();
  const handleSettings = () => navigate("/service/Settings");
  // Log the user data to see what we're getting
  // console.log("Service user data:", user);
  // console.log("Is loading:", isLoading);

  return (
    <div className="max-w-[88rem] mx-auto px-4 sm:px-6 mt-4">
      <nav className="w-full border-b border-gray-300 px-5 py-3 text-sm flex items-center justify-between">
        {/* LEFT */}
        <div className="hidden md:flex justify-start gap-3">
          <Button
            onClick={handleBack}
            variant="ghost"
            className="relative text-sm px-3 py-1 bg-transparent border-none after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px] after:h-[3px] after:w-0 after:bg-gray-800 after:rounded-full after:-translate-x-1/2 after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
          >
            Dashboard
          </Button>

          {/* <Button
            onClick={handleSettings}
            variant="ghost"
            className="relative text-sm px-3 py-1 bg-transparent border-none after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px] after:h-[3px] after:w-0 after:bg-gray-800 after:rounded-full after:-translate-x-1/2 after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
          >
            Settings
          </Button> */}
        </div>

        {/* LEFT — Hamburger (mobile) */}
        <div className="md:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-700 hover:text-black"
          >
            <Menu className="h-6 w-6" />
          </button>
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
                {isLoading
                  ? "Loading..."
                  : userData
                  ? userData.username
                  : "Username"}
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
                {/* <button
                  onClick={() => {
                    setIsDropOpen(false);
                    navigate("/service/settings");
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  <Settings className="h-4 w-4 inline-block mr-2" />
                  Settings
                </button> */}

                <LogoutButton className="block w-full text-left px-4 py-2 hover:bg-gray-100" />
              </div>
            )}
          </div>
        </div>
      </nav>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="bg-black/50 w-full"
          ></div>
          <div className="bg-white w-64 h-full shadow-lg p-4 flex flex-col gap-4 animate-slideIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button onClick={() => setIsSidebarOpen(false)}>
                <X className="h-6 w-6 text-gray-700" />
              </button>
            </div>

            <Button onClick={handleBack} variant="ghost" className="text-left">
              Dashboard
            </Button>
            <Button
              onClick={handleSettings}
              variant="ghost"
              className="text-left"
            >
              Settings
            </Button>

            <hr className="my-2" />

            <LogoutButton className="text-left" />
          </div>
        </div>
      )}
    </div>
  );
}
