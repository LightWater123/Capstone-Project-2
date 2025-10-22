import React, { useState, useEffect } from 'react';

//(daysOfWeek array is unchanged)
const daysOfWeek = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 7 },
];

/**
 * A modal to activate or update predictive maintenance settings.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal is open.
 * @param {function} props.onClose - Function to close the modal.
 * @param {function} props.onSubmit - Async function to handle form submission. (Takes formData)
 * @param {object | null} props.selectedEquipment - The *first* selected equipment, used to populate the form and show the title.
 */
export default function PredictiveMaintenanceModal({
  isOpen,
  onClose,
  onSubmit,
  selectedEquipment,
}) {
  // ... (useState and useEffect for formData are unchanged) ...
  const [formData, setFormData] = useState({
    install_date: '',
    daily_usage_hours: 0,
    operating_days: [],
  });

  useEffect(() => {
    if (isOpen && selectedEquipment) {
      setFormData({
        install_date: selectedEquipment.install_date ? selectedEquipment.install_date.split('T')[0] : '',
        daily_usage_hours: selectedEquipment.daily_usage_hours || 0,
        operating_days: selectedEquipment.operating_days || [],
      });
    } else if (!isOpen) {
      setFormData({
        install_date: '',
        daily_usage_hours: 0,
        operating_days: [],
      });
    }
  }, [isOpen, selectedEquipment]);

  // ... (handleInputChange and handleDayChange are unchanged) ...
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseFloat(value) || 0 : value;
    setFormData((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  const handleDayChange = (dayValue) => {
    setFormData((prev) => {
      const currentDays = prev.operating_days || [];
      const updatedDays = currentDays.includes(dayValue)
        ? currentDays.filter((d) => d !== dayValue)
        : [...currentDays, dayValue]; 

      return {
        ...prev,
        operating_days: updatedDays.sort((a, b) => a - b),
      };
    });
  };

  // The modal no longer needs to know about the ID. It just passes the data.
  const handleSubmit = (e) => {
    e.preventDefault();
    // Pass the form data to the parent's submit handler.
    // The parent is responsible for knowing which equipment IDs to apply this to.
    onSubmit(formData);
  };
  // -------------------------------

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-lg border border-yellow-400 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl leading-none"
          aria-label="Close"
        >
          &times;
        </button>

        <h2 className="text-xl font-bold text-yellow-700 mb-2">
          Predictive Maintenance
        </h2>
        <p className="text-gray-600 mb-6">
          {/* This will show the article name of the first selected item */}
          Activating for:{' '}
          <strong className="text-black">
            {selectedEquipment?.article || 'Item'}
          </strong>
        </p>

        {/* The form itself is unchanged */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-black">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border">
            {/* Install Date */}
            <div>
              <label
                htmlFor="install_date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Install / Service Date
              </label>
              <input
                id="install_date"
                name="install_date"
                type="date"
                value={formData.install_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-black rounded bg-white placeholder-black text-black"
                required
              />
            </div>

            {/* Daily Usage Hours */}
            <div>
            <label
                htmlFor="daily_usage_hours"
                className="block text-sm font-medium text-gray-700 mb-1"
            >
                Usage Per Day (Hours)
            </label>
            <input
                id="daily_usage_hours"
                name="daily_usage_hours"
                type="number"
                step="0.5"
                placeholder="e.g., 8.5"
                // FIX: Show an empty string if the value is 0
                value={formData.daily_usage_hours === 0 ? '' : formData.daily_usage_hours}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-black rounded bg-white placeholder-black text-black"
                required
            />
            </div>

            {/* Operating Days (Full width) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operating Days Per Week
              </label>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {daysOfWeek.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-gray-200"
                  >
                    <input
                      type="checkbox"
                      checked={formData.operating_days.includes(day.value)}
                      onChange={() => handleDayChange(day.value)}
                      className="h-5 w-5 rounded text-yellow-600 focus:ring-yellow-500 border-gray-300"
                    />
                    <span className="text-gray-800">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-end gap-4 pt-6">
            <button
              type="submit"
              className="bg-yellow-400 text-white px-4 py-2 rounded hover:bg-yellow-700"
            >
              Activate / Update
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

