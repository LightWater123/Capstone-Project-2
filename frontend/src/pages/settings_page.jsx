import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ChangePasswordModal from '../components/modals/changePasswordModal';
import BTRheader from "../components/modals/btrHeader";
import BTRNavbar from "../components/modals/btrNavbar.jsx";
import { ChevronLeftCircle } from "lucide-react"
import { Mail } from 'lucide-react';
import { Lock } from 'lucide-react';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <BTRheader />
      <BTRNavbar />
      {/* Header */}
      <div className="max-w-[88rem] mx-auto px-4 sm:px-6 mt-4">
        <h2 className="text-2xl font-semibold mb-6  border-b pb-4">
          <Settings className="h-6 w-6 inline-block mr-2" />
          Settings
        </h2>
       {/* Security card */}
        <div className="bg-white shadow-sm rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Security</h2>
        {/* Change Password button opens modal */}
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-yellow-400 text-white rounded hover:bg-yellow-500"
        >
          <Lock className="h-5 w-5 inline-block mr-2" />
          Change Password
        </button>

        <button
          onClick={() => navigate("/forgot-password")}
          className="px-4 py-2 bg-yellow-400 text-white rounded hover:bg-yellow-500 ml-4"
        >
          <Mail className="h-5 w-5 inline-block mr-2" />
          Reset via Email
        </button>
      </div>
      </div>

      {/* Render modal */}
      {showModal && <ChangePasswordModal onClose={() => setShowModal(false)} />}
    </div>

  );
}