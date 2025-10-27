import React, { useEffect, useState } from "react";
import { Send, CircleX, Upload, CirclePlus,  } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AddEquipmentModal({
  isOpen,
  category,
  newItem,
  setNewItem,
  onClose,
  onSubmit,
  onUploadPDF,
}) {
  // NEW: State to manage the visibility of predictive maintenance fields
  const [isPredictiveActive, setIsPredictiveActive] = useState(false);

  useEffect(() => {
    // When the modal opens or closes, reset the toggle state
    setIsPredictiveActive(false);
  }, [isOpen]);

  if (!isOpen) return null;

  // NEW: Handler for the operating days checkboxes
  const handleDayChange = (dayValue) => {
    const currentDays = newItem.operating_days || [];
    const updatedDays = currentDays.includes(dayValue)
      ? currentDays.filter((d) => d !== dayValue) // Uncheck: remove the day
      : [...currentDays, dayValue]; // Check: add the day

    setNewItem({
      ...newItem,
      operating_days: updatedDays.sort((a, b) => a - b),
    });
  };

  const daysOfWeek = [
    { label: "Mon", value: 1 },
    { label: "Tue", value: 2 },
    { label: "Wed", value: 3 },
    { label: "Thu", value: 4 },
    { label: "Fri", value: 5 },
    { label: "Sat", value: 6 },
    { label: "Sun", value: 7 },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl shadow-lg border-collapse relative max-h-[90vh] overflow-y-auto ">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl leading-none"
          aria-label="Close"
        >
          &times;
        </button>

        <h2 className="text-md font-bold text-gray-500 mb-6 border-b pb-4">
          <CirclePlus className="h-5 w-5 inline-block mr-2" />
          Add {category} Equipment
        </h2>

        <form onSubmit={onSubmit} className="flex flex-col gap-6 text-black">
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* article */}
            <div className="relative w-full">
              <input
                type="text"
                id="article"
                value={newItem.article || ""}
                onChange={(e) =>
                  setNewItem({ ...newItem, article: e.target.value })
                }
                required
                className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                placeholder="Article"
              />
              <label
                htmlFor="article"
                className={`absolute left-0 transition-all duration-300
                  ${
                    newItem.article
                      ? "-top-3 text-sm text-gray-800"
                      : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
                  }`}
              >
                Article
              </label>
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
            </div>

            {/* description */}
            <div className="relative w-full">
              <input
                type="text"
                id="description"
                value={newItem.description || ""}
                onChange={(e) =>
                  setNewItem({ ...newItem, description: e.target.value })
                }
                required
                className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                placeholder="Description"
              />
              <label
                htmlFor="description"
                className={`absolute left-0 transition-all duration-300
                  ${
                    newItem.description
                      ? "-top-3 text-sm text-gray-800"
                      : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
                  }`}
              >
                Description
              </label>
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
            </div>
            {category === "PPE" ? (
              <>
                {/* property ro */}
                <div className="relative w-full">
                  <input
                    type="text"
                    id="property_ro"
                    value={newItem.property_ro || ""}
                    onChange={(e) =>
                      setNewItem({ ...newItem, property_ro: e.target.value })
                    }
                    required
                    className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                    placeholder="Property RO"
                  />
                  <label
                    htmlFor="property_ro"
                    className={`absolute left-0 transition-all duration-300
                      ${
                        newItem.property_ro
                          ? "-top-3 text-sm text-gray-800"
                          : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
                      }`}
                  >
                    Property RO
                  </label>
                  <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
                </div>

                {/* property co */}
                <div className="relative w-full">
                  <input
                    type="text"
                    id="property_co"
                    value={newItem.property_co || ""}
                    onChange={(e) =>
                      setNewItem({ ...newItem, property_co: e.target.value })
                    }
                    className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                    placeholder="Property CO"
                  />
                  <label
                    htmlFor="property_co"
                    className={`absolute left-0 transition-all duration-300
                      ${
                        newItem.property_co
                          ? "-top-3 text-sm text-gray-800"
                          : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
                      }`}
                  >
                    Property CO
                  </label>
                  <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
                </div>
              </>
            ) : (
              // semi-expandale property_no
              <div className="relative w-full">
                <input
                  type="text"
                  id="semi_expendable_property_no"
                  value={newItem.semi_expendable_property_no || ""}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      semi_expendable_property_no: e.target.value,
                    })
                  }
                  required
                  className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                  placeholder="Semi-Expendable Property No"
                />
                <label
                  htmlFor="semi_expendable_property_no"
                  className={`absolute left-0 transition-all duration-300
                    ${
                      newItem.semi_expendable_property_no
                        ? "-top-3 text-sm text-gray-800"
                        : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
                    }`}
                >
                  Semi-Expendable Property No
                </label>
                <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
              </div>
            )}

            {/* unit of measure */}
            <div className="relative w-full">
              <input
                type="text"
                id="unit"
                value={newItem.unit || ""}
                onChange={(e) =>
                  setNewItem({ ...newItem, unit: e.target.value })
                }
                required
                className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                placeholder="Unit of Measure"
              />
              <label
                htmlFor="unit"
                className={`absolute left-0 transition-all duration-300
                  ${
                    newItem.unit
                      ? "-top-3 text-sm text-gray-800"
                      : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
                  }`}
              >
                Unit of Measure
              </label>
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
            </div>

            {/* unit value */}
            <div className="relative w-full">
              <input
                type="number"
                id="unit_value"
                min="0"
                step="0.01"
                value={newItem.unit_value || ""}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    unit_value: parseFloat(e.target.value) || 0,
                  })
                }
                required
                className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                placeholder="Unit Value"
              />
              <label
                htmlFor="unit_value"
                className={`absolute left-0 transition-all duration-300
                  ${
                    newItem.unit_value
                      ? "-top-3 text-sm text-gray-800"
                      : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
                  }`}
              >
                Unit Value
              </label>
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
            </div>
            {/* Quantity per Property Card */}
            <div className="relative w-full">
              <input
                type="number"
                id="recorded_count"
                min="0"
                value={newItem.recorded_count || ""}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    recorded_count: parseInt(e.target.value) || 0,
                  })
                }
                required
                className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                placeholder="Quantity per Property Card"
              />
              <label
                htmlFor="recorded_count"
                className={`absolute left-0 transition-all duration-300
                  ${
                    newItem.recorded_count
                      ? "-top-3 text-sm text-gray-800"
                      : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
                  }`}
              >
                Quantity per Property Card
              </label>
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
            </div>
            {/* Quantity per Physical Count */}
            <div className="relative w-full">
              <input
                type="number"
                id="actual_count"
                min="0"
                value={newItem.actual_count || ""}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    actual_count: parseInt(e.target.value) || 0,
                  })
                }
                required
                className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                placeholder="Quantity per Physical Count"
              />
              <label
                htmlFor="actual_count"
                className={`absolute left-0 transition-all duration-300
                  ${
                    newItem.actual_count
                      ? "-top-3 text-sm text-gray-800"
                      : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
                  }`}
              >
                Quantity per Physical Count
              </label>
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
            </div>

            {/* location */}
            <select
              value={newItem.location || ""}
              onChange={(e) =>
                setNewItem({ ...newItem, location: e.target.value })
              }
              className="w-full px-3 py-2 border-0 border-b-2 border-gray-400 bg-white text-gray-400"
              required
            >
              <option value="">Select Location</option>
              <option value="RD's Office">RD's Office</option>
              <option value="Storage Room">Storage Room</option>
              <option value="Conference Room">Conference Room</option>
              <option value="Auditor's Office">Auditor's Office</option>
              <option value="Car Port/Garage">Car Port/Garage</option>
              <option value="CTOO II Office">CTOO II Office</option>
              <option value="Records Room">Records Room</option>
              <option value="Outside the building">Outside the building</option>
              <option value="Within the building">Within the building</option>
            </select>

            {/* remarks */}
            <div className="relative w-full">
              <input
                type="text"
                id="remarks"
                value={newItem.remarks || ""}
                onChange={(e) =>
                  setNewItem({ ...newItem, remarks: e.target.value })
                }
                className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                placeholder="Remarks"
              />
              <label
                htmlFor="remarks"
                className={`absolute left-0 transition-all duration-300
                  ${
                    newItem.remarks
                      ? "-top-3 text-sm text-gray-800"
                      : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
                  }`}
              >
                Remarks
              </label>
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
            </div>
          </div>

          {/* action buttons */}
          <div className="flex flex-wrap justify-end gap-4 pt-6">
            <Button
              type="submit"
              variant="ghost"
              className="relative inline-flex items-center text-sm font-medium px-3 py-1 bg-transparent border-none text-blue-900 hover:text-blue-950
            after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px]
            after:h-[3px] after:w-0 after:bg-blue-950 after:rounded-full after:-translate-x-1/2
            after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
            >
              <Send className="inline-block h-4 w-4 mr-2" />
              Submit
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
              <CircleX className="inline-block h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onUploadPDF}
              className="relative inline-flex items-center text-sm font-medium px-3 py-1 bg-transparent border-none text-blue-900 hover:text-blue-950
            after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px]
            after:h-[3px] after:w-0 after:bg-blue-950 after:rounded-full after:-translate-x-1/2
            after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
            >
              <Upload className="inline-block h-4 w-4 mr-2" />
              Upload PPE/RPCSP PDF
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
