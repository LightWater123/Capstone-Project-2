import React, { useEffect } from 'react';

export default function AddEquipmentModal({
  isOpen,
  category,
  newItem,
  setNewItem,
  onClose,
  onSubmit,
  onUploadPDF
}) {
  useEffect(() => {
    // Reset logic if needed when modal closes
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-5xl shadow-lg border border-yellow-400 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl leading-none"
          aria-label="Close"
        >
          &times;
        </button>

        <h2 className="text-xl font-bold text-yellow-700 mb-6">
          Add New {category} Equipment
        </h2>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-6 text-black"
        >
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="text"
              placeholder="Article"
              value={newItem.article}
              onChange={(e) =>
                setNewItem({ ...newItem, article: e.target.value })
              }
              className="w-full px-3 py-2 border border-black rounded bg-white placeholder-black"
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={newItem.description}
              onChange={(e) =>
                setNewItem({ ...newItem, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-black rounded bg-white placeholder-black"
            />
            {category === "PPE" ? (
              <>
                <input
                  type="text"
                  placeholder="Property RO"
                  value={newItem.property_ro}
                  onChange={(e) =>
                    setNewItem({ ...newItem, property_ro: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-black rounded bg-white placeholder-black"
                  required
                />
                <input
                  type="text"
                  placeholder="Property CO"
                  value={newItem.property_co}
                  onChange={(e) =>
                    setNewItem({ ...newItem, property_co: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-black rounded bg-white placeholder-black"
                />
              </>
            ) : (
              <input
                type="text"
                placeholder="Semi-Expendable Property No"
                value={newItem.semi_expendable_property_no}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    semi_expendable_property_no: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-black rounded bg-white placeholder-black"
                required
              />
            )}
            <input
              type="text"
              placeholder="Unit of Measure"
              value={newItem.unit}
              onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              className="w-full px-3 py-2 border border-black rounded bg-white placeholder-black"
              required
            />
            <input
              type="number"
              placeholder="Unit Value"
              min="0"
              value={newItem.unit_value === 0 ? "" : newItem.unit_value}
              onKeyDown={(e) => {
                if (
                  e.key === "-" ||
                  e.key === "+" ||
                  e.key === "e" ||
                  e.key === "E"
                ) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const numericValue = Number(e.target.value);
                const value = isNaN(numericValue)
                  ? 0
                  : Math.max(0, numericValue);
                setNewItem({ ...newItem, unit_value: value });
              }}
              className="w-full px-3 py-2 border border-black rounded bg-white placeholder-black"
              required
            />
            <input
              type="number"
              placeholder="Quantity per Property Card"
              value={newItem.recorded_count === 0 ? "" : newItem.recorded_count}
              onChange={(e) => {
                const value =
                  e.target.value === "" ? 0 : Number(e.target.value);
                setNewItem({ ...newItem, recorded_count: value });
              }}
              className="w-full px-3 py-2 border border-black rounded bg-white placeholder-black"
              required
            />
            <input
              type="number"
              placeholder="Quantity per Physical Count"
              value={newItem.actual_count === 0 ? "" : newItem.actual_count}
              onChange={(e) => {
                const value =
                  e.target.value === "" ? 0 : Number(e.target.value);
                setNewItem({ ...newItem, actual_count: value });
              }}
              className="w-full px-3 py-2 border border-black rounded bg-white placeholder-black"
              required
            />
            <select
              value={newItem.location}
              onChange={(e) =>
                setNewItem({ ...newItem, location: e.target.value })
              }
              className="w-full px-3 py-2 border border-black rounded bg-white text-black"
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
            <input
              type="text"
              placeholder="Remarks"
              value={newItem.remarks}
              onChange={(e) =>
                setNewItem({ ...newItem, remarks: e.target.value })
              }
              className="w-full px-3 py-2 border border-black rounded bg-white placeholder-black"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-end gap-4 pt-6">
            <button
              type="submit"
              className="bg-yellow-400 text-white px-4 py-2 rounded hover:bg-yellow-700"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-yellow-400 text-white px-4 py-2 rounded hover:bg-yellow-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onUploadPDF}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Upload PPE/RPCSP PDF
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
