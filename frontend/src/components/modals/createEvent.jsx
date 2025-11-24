import api from "@/api/api";
import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function CreateEvent({ show, onClose, formData, setFormData }) {
  if (!show) return null;

  const onSave = async () => {
    try {
      const response = await api.post("/api/events", formData);

      // optional: check HTTP-level errors
      if (!response.ok) {
        throw new Error(`Server answered ${response.status}`);
      }

      const result = await response.json();
      alert("Event saved!");
      onClose();
    } catch (error) {
      // ← parameter is “error”, not “response”
      console.error("Error saving event:", error);
      alert("Failed to save event.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Create New Event</h3>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Event Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full border px-3 py-2 rounded"
          />

          <DatePicker
            selected={formData.date}
            onChange={(date) => setFormData({ ...formData, date })}
            placeholderText="Select Date"
            className="w-full border px-3 py-2 rounded"
          />

          <div className="flex gap-2">
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              className="w-1/2 border px-3 py-2 rounded"
            />
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) =>
                setFormData({ ...formData, endTime: e.target.value })
              }
              className="w-1/2 border px-3 py-2 rounded"
            />
          </div>

          <input
            type="text"
            placeholder="Description"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            className="w-full border px-3 py-2 rounded"
          />

        </div>

        <div className="flex justify-end mt-6 gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Event
          </button>
        </div>
      </div>
    </div>
  );
}
