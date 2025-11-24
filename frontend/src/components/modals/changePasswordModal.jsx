import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { Button } from "@/components/ui/button";
import { Eye, EyeClosed } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  // Track password visibility for each input separately
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Auto-hide after 7 seconds (optional)
  useEffect(() => {
    const timeouts = [];
    Object.entries(showPassword).forEach(([key, visible]) => {
      if (visible) {
        const t = setTimeout(
          () => setShowPassword((prev) => ({ ...prev, [key]: false })),
          7000
        );
        timeouts.push(t);
      }
    });
    return () => timeouts.forEach(clearTimeout);
  }, [showPassword]);

  const toggleVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: "", type: "" });
    try {
      await api.post("/api/admin/change-password", form, {
        withCredentials: true,
      });
      setMsg({ text: "Password updated successfully", type: "success" });
      setForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setMsg({
        text: err.response?.data?.message || "Update failed",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Change Password</h2>

        {msg.text && (
          <div
            className={`mb-3 text-sm border rounded px-3 py-2 ${
              msg.type === "success"
                ? "text-green-700 bg-green-100 border-green-400"
                : "text-red-700 bg-red-100 border-red-400"
            }`}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={save} className="space-y-4">
          {/* Current Password */}
          <div className="relative w-full">
            <Input
              type={showPassword.current ? "text" : "password"}
              name="current_password"
              value={form.current_password}
              onChange={handle}
              placeholder="Current password"
              required
              className="w-full px-3 py-2 pr-10 border rounded"
            />
            <button
              type="button"
              onClick={() => toggleVisibility("current")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
            >
              {showPassword.current ? (
                <Eye className="h-5 w-5" />
              ) : (
                <EyeClosed className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* New Password */}
          <div className="relative w-full">
            <Input
              name="new_password"
              type={showPassword.new ? "text" : "password"}
              required
              placeholder="New password"
              value={form.new_password}
              onChange={handle}
              className="w-full px-3 py-2 border rounded"
            />
            <button
              type="button"
              onClick={() => toggleVisibility("new")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
            >
              {showPassword.new ? (
                <Eye className="h-5 w-5" />
              ) : (
                <EyeClosed className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative w-full">
            <Input
              name="new_password_confirmation"
              type={showPassword.confirm ? "text" : "password"}
              required
              placeholder="Confirm new password"
              value={form.new_password_confirmation}
              onChange={handle}
              className="w-full px-3 py-2 border rounded"
            />
            <button
              type="button"
              onClick={() => toggleVisibility("confirm")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
            >
              {showPassword.confirm ? (
                <Eye className="h-5 w-5" />
              ) : (
                <EyeClosed className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              variant="ghost"
              disabled={loading}
              className="relative inline-flex items-center text-sm font-medium px-3 py-1 bg-transparent border-none text-blue-900 hover:text-blue-950
            after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px]
            after:h-[3px] after:w-0 after:bg-blue-950 after:rounded-full after:-translate-x-1/2
            after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
            >
              {loading ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="relative inline-flex items-center text-sm font-medium px-3 py-1 bg-transparent border-none text-red-800 hover:text-red-900
            after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px]
            after:h-[3px] after:w-0 after:bg-red-900 after:rounded-full after:-translate-x-1/2
            after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
