import { useState, useEffect, useMemo } from "react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import api from "../../api/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ScheduleModal({ asset, onClose, onScheduled }) {
  const [form, setForm] = useState({
    recipientEmail: "",
    recipientName: "",
    scheduledAt: new Date(),
    message: "",
  });
  const [loading, setLoading] = useState(false);

  /* -------------------------------------------------
   * 1.  Keep form.recipientEmail / Name in sync but
   *     do NOT store the dynamic message in state.
   * ------------------------------------------------- */
  useEffect(() => {
    if (!asset) return;
    setForm((prev) => ({
      ...prev,
      recipientEmail: "",
      recipientName: "",
      scheduledAt: new Date(),
    }));
  }, [asset]);

  // change the message if scheduledAT is changed or asset changes
  const dynamicMessage = useMemo(() => {
    if (!asset) return "";
    const d = form.scheduledAt;
    return (
      `Hi, your ${asset.description} is due for maintenance ` +
      `on ${d.toLocaleDateString()} at ${d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}. Contact this number for inquiries (xxx) xxx-xxxx.`
    );
  }, [asset, form.scheduledAt]);

  if (!asset) return null;

  const handleSchedule = async () => {
    if (!form.recipientEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      alert("Please enter a valid e-mail address.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        assetId: asset.id,
        assetName: asset.description,
        recipientEmail: form.recipientEmail,
        recipientName: form.recipientName || form.recipientEmail.split("@")[0],
        scheduledAt: form.scheduledAt,
        message: dynamicMessage,
      };
      await api.post("/api/maintenance/schedule", payload);
      await api.post("/api/send-email", {
        recipientEmail: form.recipientEmail,
        recipientName: form.recipientName,
        scheduledAt: form.scheduledAt.toISOString(),
        message: dynamicMessage,
      });

      // Add success alert after email is sent
      alert("Email sent successfully!");

      onScheduled();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Scheduling / notification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold border-b pb-3">
          Schedule maintenance for {asset.description}
        </h2>

        <div className="flex flex-col items-start space-y-2">
          <label className="text-base font-medium text-gray-700">
            Service-User E-mail
          </label>
          <Input
            type="email"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-yellow-400"
            placeholder="user@example.com"
            value={form.recipientEmail}
            onChange={(e) =>
              setForm({ ...form, recipientEmail: e.target.value })
            }
          />
        </div>

        <div className="flex flex-col items-start space-y-2">
          <label className="text-base font-medium text-gray-700">
            Service-User Name
          </label>
          <Input
            type="text"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-yellow-400"
            placeholder="Juan Dela Cruz"
            value={form.recipientName}
            onChange={(e) =>
              setForm({ ...form, recipientName: e.target.value })
            }
          />
        </div>

        <div className="flex flex-col items-start space-y-2">
          <label className="text-base font-medium text-gray-700">
            Date & Time
          </label>
          <Flatpickr
            value={form.scheduledAt}
            className="border p-2"
            onChange={([d]) => setForm({ ...form, scheduledAt: d })}
            options={{ enableTime: true, dateFormat: "Y-m-d H:i" }}
          />
        </div>

        <div className="flex flex-col items-start space-y-2">
          <label>Message (preview)</label>
          <textarea
            className="w-full border rounded p-2 "
            rows="4"
            value={dynamicMessage}
            readOnly /* let the user see it update live */
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            onClick={handleSchedule}
            disabled={loading}
            variant="ghost"
            className="relative inline-flex items-center text-sm font-medium px-3 py-1 bg-transparent border-none text-blue-900 hover:text-blue-950
            after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px]
            after:h-[3px] after:w-0 after:bg-blue-950 after:rounded-full after:-translate-x-1/2
            after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
          >
            {loading ? "Scheduling..." : "Schedule & Notify"}
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="relative inline-flex items-center text-sm font-medium px-3 py-1 bg-transparent border-none text-red-800 hover:text-red-900
            after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px]
            after:h-[3px] after:w-0 after:bg-red-900 after:rounded-full after:-translate-x-1/2
            after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
