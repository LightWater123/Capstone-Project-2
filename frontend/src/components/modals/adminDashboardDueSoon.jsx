// src/components/modals/adminDashboardDueSoon.jsx
import React from "react";

export default function DueSoon({ dueItems, isLoading, error }) {
  // Function to safely format dates
  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";

    try {
      // Try to parse the date
      const date = new Date(dateValue);

      // Check if the date is valid
      if (isNaN(date.getTime())) return "Invalid Date";

      // Return formatted date
      return date.toLocaleDateString();
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (
    <div className="bg-gray-100 rounded-xl p-4 flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4 border-b pb-3">Predictive Maintenance</h2>

      {/* Table header */}
      <div className="grid grid-cols-4 gap-2 mb-2 text-xs font-semibold text-white rounded-md bg-blue-900/90 p-3">
        <div>Article</div>
        <div>Description</div>
        <div>Type</div>
        <div>Due Date</div>
      </div>

      <ul className="flex-1 overflow-y-auto">
        {isLoading ? (
          <li className="text-gray-500 text-center py-4">Loading...</li>
        ) : error ? (
          <li className="text-red-500 text-center py-4">Error: {error}</li>
        ) : dueItems.length === 0 ? (
          <li className="text-gray-500">No items found.</li>
        ) : (
          dueItems.map((item) => (
            <li
              key={item.id || item._id || item.asset_id || item.article}
              className="grid grid-cols-4 gap-2 p-2 border-b transition-colors"
              // Removed onClick handler, cursor-pointer, and hover effect
            >
              <div className="text-sm truncate" title={item.article}>
                {item.article || "N/A"}
              </div>
              <div className="text-sm truncate" title={item.description}>
                {item.description || "N/A"}
              </div>
              <div
                className="text-sm truncate"
                title={item.type || item.category}
              >
                {item.type || item.category || "N/A"}
              </div>
              <div
                className="text-sm truncate"
                title={formatDate(
                  item.next_maintenance_date || item.next_maintenance_checkup
                )}
              >
                {formatDate(
                  item.next_maintenance_date || item.next_maintenance_checkup
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
