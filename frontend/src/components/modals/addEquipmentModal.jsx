import React, { useEffect, useState } from 'react';

export default function AddEquipmentModal({
  isOpen,
  category,
  newItem,
  setNewItem,
  onClose,
  onSubmit,
  onUploadPDF
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
      ? currentDays.filter(d => d !== dayValue) // Uncheck: remove the day
      : [...currentDays, dayValue]; // Check: add the day

    setNewItem({ ...newItem, operating_days: updatedDays.sort((a, b) => a - b) });
  };
  
  const daysOfWeek = [
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
    { label: 'Sun', value: 7 },
  ];

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
              value={newItem.article || ''}
              onChange={(e) =>
                setNewItem({ ...newItem, article: e.target.value })
              }
              className="w-full px-3 py-2 border border-black rounded bg-white placeholder-black"
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={newItem.description || ''}
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
                  value={newItem.property_ro || ''}
                  onChange={(e) =>
                    setNewItem({ ...newItem, property_ro: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-black rounded bg-white placeholder-black"
                  required
                />
                <input
                  type="text"
                  placeholder="Property CO"
                  value={newItem.property_co || ''}
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
                value={newItem.semi_expendable_property_no || ''}
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
              value={newItem.unit || ''}
              onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              className="w-full px-3 py-2 border border-black rounded bg-white placeholder-black"
              required
            />
            <input
              type="number"
              placeholder="Unit Value"
              min="0"
              step="0.01"
              value={newItem.unit_value || ''}
              onChange={(e) => setNewItem({ ...newItem, unit_value: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-black rounded bg-white placeholder-black"
              required
            />
            <input
              type="number"
              placeholder="Quantity per Property Card"
              min="0"
              value={newItem.recorded_count || ''}
              onChange={(e) => setNewItem({ ...newItem, recorded_count: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-black rounded bg-white placeholder-black"
              required
            />
            <input
              type="number"
              placeholder="Quantity per Physical Count"
              min="0"
              value={newItem.actual_count || ''}
              onChange={(e) => setNewItem({ ...newItem, actual_count: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-black rounded bg-white placeholder-black"
              required
            />
            <select
              value={newItem.location || ''}
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
              value={newItem.remarks || ''}
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
