import { useState } from "react";
import ScheduleModal from "./scheduleModal";
import { Button } from "@/components/ui/button";
import { Album } from "lucide-react";

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

  //console.log(item);

  return (
    <>
      {/* ----------  DETAIL MODAL  ---------- */}
      {isOpen && item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 p-6 border-collapse max-h-[90vh] overflow-y-auto ">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-gray-800 ">
                Equipment Details
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-6 auto-rows-min gap-x-12 gap-y-6 text-sm text-gray-700 bg-gray-50 p-6 rounded-xl border border-gray-200 overflow-x-auto">
              {/* article */}
              <div className="col-span-6 flex flex-col items-center border-b pb-2">
                <div className="flex items-center space-x-2">
                  <Album className="h-6 w-6 text-gray-800" />
                  <strong className="text-gray-800 text-xl">Article</strong>
                </div>
                <span className="text-gray-600 break-words text-xl mt-2 text-center">
                  {item.article}
                </span>
              </div>

              {/* descrip */}
              <div className="col-span-3 row-start-2 flex flex-col items-start space-y-1">
                <strong className="text-gray-800">Description:</strong>
                <span className="text-gray-600 break-words whitespace-pre-wrap">
                  {item.description}
                </span>
              </div>

              {item.category === "PPE" ? (
                //property ro
                <div className="col-span-3 col-start-4 row-start-2 flex flex-col items-start space-y-1">
                  <strong className="text-gray-800">Property No. (RO):</strong>
                  <span className="text-gray-600 break-words">
                    {item.property_ro}
                  </span>
                </div>
              ) : (
                // sepn
                <div className="col-span-3 col-start-4 row-start-2 flex flex-col items-start space-y-1">
                  <strong className="text-gray-800">
                    Semi-Expendable Property No.:
                  </strong>
                  <span className="text-gray-600 break-words">
                    {item.semi_expendable_property_no}
                  </span>
                </div>
              )}

              {/* property co*/}
              <div className="col-span-3 row-start-3 flex flex-col items-start space-y-1">
                <strong className="text-gray-800">Property No. (CO):</strong>
                <span className="text-gray-600 break-words">
                  {item.property_co || "—"}
                </span>
              </div>

              {/* unit */}
              <div className="col-span-3 col-start-4 row-start-3 flex flex-col items-start space-y-1">
                <strong className="text-gray-800">Unit:</strong>
                <span className="text-gray-600 break-words">{item.unit}</span>
              </div>

              {/* unit val*/}
              <div className="col-span-3 row-start-4 flex flex-col items-start space-y-1">
                <strong className="text-gray-800">Unit Value:</strong>
                <span className="text-gray-600 break-words">
                  ₱{Number(item.unit_value).toLocaleString()}
                </span>
              </div>

              {/* balance per card*/}
              <div className="col-span-3 col-start-4 row-start-4 flex flex-col items-start space-y-1">
                <strong className="text-gray-800">Balance per Card:</strong>
                <span className="text-gray-600 break-words">
                  {item.recorded_count}
                </span>
              </div>

              {/* on hand count */}
              <div className="col-span-3 row-start-5 flex flex-col items-start space-y-1">
                <strong className="text-gray-800">On-hand Count:</strong>
                <span className="text-gray-600 break-words">
                  {item.actual_count}
                </span>
              </div>

              {/* shortage/overage qty */}
              <div className="col-span-3 col-start-4 row-start-5 flex flex-col items-start space-y-1">
                <strong className="text-gray-800">Shortage/Overage Qty:</strong>
                <span className="text-gray-600 break-words">
                  {item.shortage_or_overage_qty}
                </span>
              </div>

              {/* shortage/overage value */}
              <div className="col-span-3 row-start-6 flex flex-col items-start space-y-1">
                <strong className="text-gray-800">
                  Shortage/Overage Value:
                </strong>
                <span className="text-gray-600 break-words">
                  ₱{item.shortage_or_overage_val}
                </span>
              </div>

              {/* loc */}
              <div className="col-span-3 col-start-4 row-start-6 flex flex-col items-start space-y-1">
                <strong className="text-gray-800">Location:</strong>
                <span className="text-gray-600 break-words">
                  {item.location}
                </span>
              </div>

              {/* remarks */}
              <div className="col-span-3 row-start-7 flex flex-col items-start space-y-1">
                <strong className="text-gray-800">Remarks:</strong>
                <span className="text-gray-600 break-words">
                  {item.remarks}
                </span>
              </div>

              {/* added date*/}
              <div className="col-span-3 col-start-4 row-start-7 flex flex-col items-start space-y-1">
                <strong className="text-gray-800">Date Added:</strong>
                <span className="text-gray-600 break-words">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </span>
              </div>

              {/* condi */}
              <div className="col-span-3 row-start-8 flex flex-col items-start space-y-1">
                <strong className="text-gray-800">Condition:</strong>
                <span className="text-gray-600 break-words">
                  {item.condition || "—"}
                </span>
              </div>
            </div>

            {/* buttons */}
            <div className="flex flex-col md:flex-row justify-end md:justify-end gap-3 mt-6 md:items-start items-end">
              {/* edit button */}
              <Button
                onClick={onEdit}
                variant="ghost"
                className="relative inline-flex items-center text-sm font-medium px-3 py-1 bg-transparent border-none text-blue-900 hover:text-blue-950
            after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px]
            after:h-[3px] after:w-0 after:bg-blue-950 after:rounded-full after:-translate-x-1/2
            after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
              >
                Edit
              </Button>

              {/* remove */}
              {/* <Button
                onClick={() => onDelete(item.id)}
                variant="ghost"
                className="relative inline-flex items-center text-sm font-medium px-3 py-1 bg-transparent border-none text-red-800 hover:text-red-900
            after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px]
            after:h-[3px] after:w-0 after:bg-red-900 after:rounded-full after:-translate-x-1/2
            after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
              >
                Remove
              </Button> */}

              {/* view h */}
              {/* <Button
                onClick={() => onViewHistory(true)}
                variant="ghost"
                className="relative inline-flex items-center text-sm font-medium px-3 py-1 bg-transparent border-none text-blue-900 hover:text-blue-950
            after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px]
            after:h-[3px] after:w-0 after:bg-blue-950 after:rounded-full after:-translate-x-1/2
            after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
              >
                View History
              </Button> */}

              {/* sched */}
              <Button
                onClick={openScheduler}
                variant="ghost"
                className="relative inline-flex items-center text-sm font-medium px-3 py-1 bg-transparent border-none text-blue-900 hover:text-blue-950
            after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px]
            after:h-[3px] after:w-0 after:bg-blue-950 after:rounded-full after:-translate-x-1/2
            after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
              >
                Schedule Maintenance
              </Button>
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
