import { useState } from "react";
import ScheduleModal from "./scheduleModal";

export default function ViewItemDetailModal({
  isOpen,
  onClose,
  item,
  onEdit,
  onViewHistory,
  onDelete,
}) {
  const [showSchedule, setShowSchedule] = useState(false);

  const openScheduler = () => {
    onClose(); // close detail modal
    setShowSchedule(true); // open schedule modal
  };

  if (!isOpen && !showSchedule) return null;

  console.log(item);

  return (
    <>
      {/* ----------  DETAIL MODAL  ---------- */}
      {isOpen && item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Equipment Details
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <strong>Article:</strong> {item.article}
              </div>
              <div>
                <strong>Description:</strong> {item.description}
              </div>
              {item.category === "PPE" ? (
                <>
                  <div>
                    <strong>Property No. (RO):</strong> {item.property_ro}
                  </div>
                  <div>
                    <strong>Property No. (CO):</strong>{" "}
                    {item.property_co || "—"}
                  </div>
                </>
              ) : (
                <div>
                  <strong>Semi-Expendable Property No.:</strong>{" "}
                  {item.semi_expendable_property_no}
                </div>
              )}
              <div>
                <strong>Unit:</strong> {item.unit}
              </div>
              <div>
                <strong>Unit Value:</strong> ₱
                {Number(item.unit_value).toLocaleString()}
              </div>
              <div>
                <strong>Balance per Card:</strong> {item.recorded_count}
              </div>
              <div>
                <strong>On-hand Count:</strong> {item.actual_count}
              </div>
              <div>
                <strong>Shortage/Overage Qty:</strong>{" "}
                {item.shortage_or_overage_qty}
              </div>
              <div>
                <strong>Shortage/Overage Value:</strong> ₱
                {item.shortage_or_overage_val}
              </div>
              <div>
                <strong>Location:</strong> {item.location}
              </div>
              <div>
                <strong>Remarks:</strong> {item.remarks}
              </div>
              <div>
                <strong>Date Added:</strong>{" "}
                {item.created_at
                  ? new Date(item.created_at).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </div>
              <div>
                <strong>Condition:</strong> {item.condition || "—"}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onEdit}
                className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="px-3 py-1 bg-red-400 text-white rounded hover:bg-red-500 text-sm"
              >
                Remove
              </button>
              <button
                onClick={() => onViewHistory(true)}
                className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-sm"
              >
                View History
              </button>
              <button
                onClick={openScheduler}
                className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-sm"
              >
                Schedule Maintenance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------  SCHEDULE MODAL  ---------- */}
      {showSchedule && (
        <ScheduleModal
          asset={item}
          onClose={() => setShowSchedule(false)}
          onScheduled={() => setShowSchedule(false)}
        />
      )}
    </>
  );
}
