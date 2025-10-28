import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ChangePasswordModal from '../components/modals/changePasswordModal';
import BTRheader from "../components/modals/btrHeader";
import { ChevronLeftCircle } from "lucide-react"
import { Mail } from "lucide-react";
import { Lock } from "lucide-react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from '../components/modals/serviceNavbar';

export default function ServiceSettings() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <BTRheader />
      <Navbar/>
      {/* Header */}
      <div className="max-w-[84rem] mx-auto px-4 sm:px-6 mt-4">
        <h2 className="text-2xl font-semibold mb-6 border-b pb-4 pt-2">
          <Settings className="h-6 w-6 inline-block mr-2" />
          Settings
        </h2>
        {/* Security card */}
        <div className="border-b pb-5 mb-6">
          <h2 className="font-semibold mb-4">Security</h2>
          <Button
            onClick={() => setShowModal(true)}
            variant="ghost"
            className="relative inline-flex items-center text-sm font-medium px-3 py-1 bg-transparent border-none text-gray-800 
            after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px]
            after:h-[3px] after:w-0 after:bg-gray-800 after:rounded-full after:-translate-x-1/2
            after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
          >
            <Lock className="h-5 w-5 mr-2" />
            Change Password
          </Button>

          <Button
            onClick={() => navigate("/forgot-password")}
            variant="ghost"
            className="relative inline-flex items-center text-sm font-medium px-3 py-1 bg-transparent border-none text-white-800 
            after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px]
            after:h-[3px] after:w-0 after:bg-gray-800 after:rounded-full after:-translate-x-1/2
            after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
          >
            <Mail className="h-5 w-5 mr-2" />
            Reset via Email
          </Button>
        </div>
      </div>

      {/* Render modal */}
      {showModal && <ChangePasswordModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

