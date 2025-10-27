import { useState, useEffect } from "react";
import api from "../../api/api";
import { Button } from "@/components/ui/button";

export default function EditItemModal({ isOpen, item, onClose, onSave }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (item) {
      setForm({
        ...item,
        start_date: item.start_date ? item.start_date.substr(0, 10) : "",
        end_date: item.end_date ? item.end_date.substr(0, 10) : "",
      });
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const recorded = Number(form.recorded_count) || 0;
    const actual = Number(form.actual_count) || 0;
    const diffQty = actual - recorded;
    const unitVal = Number(form.unit_value) || 0;
    setForm((prev) => ({
      ...prev,
      shortage_or_overage_qty: diffQty,
      shortage_or_overage_val: diffQty * unitVal,
    }));
  }, [form.recorded_count, form.actual_count, form.unit_value]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item) return;

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      await api.put(`/api/inventory/${item._id || item.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Item updated successfully!");
      onSave?.(form);
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Update failed");
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl shadow-lg relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl leading-none"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Modal Title */}
        <h2 className="text-md font-bold text-gray-500 mb-6 border-b pb-4">
          Edit Equipment
        </h2>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 text-black"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Article */}
            <div className="relative w-full">
              <input
                type="text"
                id="article"
                name="article"
                value={form.article || ""}
                onChange={handleChange}
                required
                className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                placeholder="Article"
              />
              <label
                htmlFor="article"
                className={`absolute left-0 transition-all duration-300
              ${
                form.article
                  ? "-top-3 text-sm text-gray-800"
                  : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
              }
            `}
              >
                Article
              </label>
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
            </div>

            {/* Description */}
            <div className="relative w-full">
              <input
                type="text"
                name="description"
                id="description"
                value={form.description || ""}
                onChange={handleChange}
                required
                className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                placeholder="Description"
              />
              <label
                htmlFor="description"
                className={`absolute left-0 transition-all duration-300
              ${
                form.description
                  ? "-top-3 text-sm text-gray-800"
                  : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
              }
            `}
              >
                Description
              </label>
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
            </div>

            {/* Conditional Property No */}
            {form.category === "PPE" ? (
              <>
                <div className="relative w-full">
                  <input
                    type="text"
                    name="property_ro"
                    id="property_ro"
                    value={form.property_ro || ""}
                    onChange={handleChange}
                    required
                    className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                    placeholder="Property RO"
                  />
                  <label
                    htmlFor="property_ro"
                    className={`absolute left-0 transition-all duration-300
                  ${
                    form.property_ro
                      ? "-top-3 text-sm text-gray-800"
                      : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
                  }
                `}
                  >
                    Property RO
                  </label>
                  <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
                </div>

                <div className="relative w-full">
                  <input
                    type="text"
                    name="property_co"
                    id="property_co"
                    value={form.property_co || ""}
                    onChange={handleChange}
                    className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                    placeholder="Property CO"
                  />
                  <label
                    htmlFor="property_co"
                    className={`absolute left-0 transition-all duration-300
                  ${
                    form.property_co
                      ? "-top-3 text-sm text-gray-800"
                      : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
                  }
                `}
                  >
                    Property CO
                  </label>
                  <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
                </div>
              </>
            ) : (
              <div className="relative w-full">
                <input
                  type="text"
                  name="semi_expendable_property_no"
                  id="semi_expendable_property_no"
                  value={form.semi_expendable_property_no || ""}
                  onChange={handleChange}
                  required
                  className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                  placeholder="Semi-Expendable Property No"
                />
                <label
                  htmlFor="semi_expendable_property_no"
                  className={`absolute left-0 transition-all duration-300
                ${
                  form.semi_expendable_property_no
                    ? "-top-3 text-sm text-gray-800"
                    : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
                }
              `}
                >
                  Semi-Expendable Property No
                </label>
                <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
              </div>
            )}

            {/* Unit */}
            <div className="relative w-full">
              <input
                type="text"
                id="unit"
                value={form.unit || ""}
                onChange={handleChange}
                required
                className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                placeholder="Unit"
              />
              <label
                htmlFor="unit"
                className={`absolute left-0 transition-all duration-300
              ${
                form.unit
                  ? "-top-3 text-sm text-gray-800"
                  : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
              }
            `}
              >
                Unit
              </label>
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
            </div>

            {/* Unit Value */}
            <div className="relative w-full">
              <input
                type="number"
                id="unit_value"
                min="0"
                step="0.01"
                value={form.unit_value || ""}
                onChange={handleChange}
                className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                placeholder="Unit Value"
              />
              <label
                htmlFor="unit_value"
                className={`absolute left-0 transition-all duration-300
              ${
                form.unit_value
                  ? "-top-3 text-sm text-gray-800"
                  : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
              }
            `}
              >
                Unit Value
              </label>
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
            </div>

            {/* Recorded Count */}
            <div className="relative w-full">
              <input
                type="number"
                id="recorded_count"
                value={form.recorded_count || ""}
                onChange={handleChange}
                min="0"
                className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                placeholder="Balance per Card"
              />
              <label
                htmlFor="recorded_count"
                className={`absolute left-0 transition-all duration-300
              ${
                form.recorded_count
                  ? "-top-3 text-sm text-gray-800"
                  : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
              }
            `}
              >
                Balance per Card
              </label>
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
            </div>

            {/* Actual Count */}
            <div className="relative w-full">
              <input
                type="number"
                id="actual_count"
                value={form.actual_count || ""}
                onChange={handleChange}
                min="0"
                className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                placeholder="On-hand Count"
              />
              <label
                htmlFor="actual_count"
                className={`absolute left-0 transition-all duration-300
              ${
                form.actual_count
                  ? "-top-3 text-sm text-gray-800"
                  : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
              }
            `}
              >
                On-hand Count
              </label>
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
            </div>

            {/* Shortage/Overage Qty */}
            <div className="relative w-full">
              <input
                type="number"
                id="shortage_or_overage_qty"
                value={form.shortage_or_overage_qty || ""}
                onChange={handleChange}
                min="0"
                className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                placeholder="Shortage/Overage Qty"
              />
              <label
                htmlFor="shortage_or_overage_qty"
                className={`absolute left-0 transition-all duration-300
              ${
                form.shortage_or_overage_qty
                  ? "-top-3 text-sm text-gray-800"
                  : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
              }
            `}
              >
                Shortage/Overage Qty
              </label>
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
            </div>

            {/* Shortage/Overage Value */}
            <div className="relative w-full">
              <input
                type="number"
                id="shortage_or_overage_val"
                value={form.shortage_or_overage_val || ""}
                onChange={handleChange}
                min="0"
                className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                placeholder="Shortage/Overage Value"
              />
              <label
                htmlFor="shortage_or_overage_val"
                className={`absolute left-0 transition-all duration-300
              ${
                form.shortage_or_overage_val
                  ? "-top-3 text-sm text-gray-800"
                  : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
              }
            `}
              >
                Shortage/Overage Value
              </label>
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
            </div>

            {/* Location */}
            <div className="relative w-full">
              <select
                value={form.location || ""}
                onChange={handleChange}
                required
                className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black focus:outline-none focus:border-gray-800"
              >
                <option value="">Select Location</option>
                <option value="RD's Office">RD's Office</option>
                <option value="Storage Room">Storage Room</option>
                <option value="Conference Room">Conference Room</option>
                <option value="Auditor's Office">Auditor's Office</option>
                <option value="Car Port/Garage">Car Port/Garage</option>
                <option value="CTOO II Office">CTOO II Office</option>
                <option value="Records Room">Records Room</option>
                <option value="Outside the building">
                  Outside the building
                </option>
                <option value="Within the building">Within the building</option>
              </select>
            </div>

            {/* Condition */}
            <div className="relative w-full">
              <select
                value={form.condition || ""}
                onChange={handleChange}
                required
                className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black focus:outline-none focus:border-gray-800"
              >
                <option value="">Select Condition</option>
                <option value="Serviceable">Serviceable</option>
                <option value="Needs Repair">Needs Repair</option>
                <option value="Unserviceable">Unserviceable</option>
              </select>
            </div>

            {/* Remarks */}
            <div className="relative w-full">
              <input
                type="text"
                id="remarks"
                value={form.remarks || ""}
                onChange={handleChange}
                className="peer w-full border-b-2 border-gray-400 bg-transparent px-0 py-2 text-black placeholder-transparent focus:outline-none focus:border-gray-800"
                placeholder="Remarks"
              />
              <label
                htmlFor="remarks"
                className={`absolute left-0 transition-all duration-300
              ${
                form.remarks
                  ? "-top-3 text-sm text-gray-800"
                  : "top-2 text-base text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-800"
              }
            `}
              >
                Remarks
              </label>
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gray-800 transition-all duration-300 peer-focus:w-full"></span>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-4 pt-6">
            <Button
              type="submit"
              variant="ghost"
              onClick={handleSubmit}
              className="relative inline-flex items-center text-sm font-medium px-3 py-1 bg-transparent border-none text-blue-900 hover:text-blue-950
            after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px]
            after:h-[3px] after:w-0 after:bg-blue-950 after:rounded-full after:-translate-x-1/2
            after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
            >
              Save Changes
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="relative inline-flex items-center text-sm font-medium px-3 py-1 bg-transparent border-none text-red-800 hover:text-red-900
            after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px]
            after:h-[3px] after:w-0 after:bg-blue-950 after:rounded-full after:-translate-x-1/2
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
