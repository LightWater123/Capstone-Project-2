import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useInventory } from "../hooks/useInventory";
import { useMaintenance } from "../hooks/useMaintenance";
import { parsePdf } from "../hooks/usePdfParser";
import { useCsrf } from "../hooks/useCsrf";
import api from "../api/api";
import BTRheader from "../components/modals/btrHeader";
import BTRNavbar from "../components/modals/btrNavbar.jsx";
import { ArrowUpAZ, Icon, Plus, Wrench } from "lucide-react";
import { Monitor } from "lucide-react";
import { Calendar } from "lucide-react";
import { Car } from "lucide-react";
import { Keyboard } from "lucide-react";
import { Search } from "lucide-react";
import { ArrowUpDown } from "lucide-react";
import { ArrowDownAZ } from "lucide-react";

// Modals
import ScheduleMaintenanceModal from "../components/modals/scheduleModal.jsx";
import TypeSelectorModal from "../components/modals/typeSelectorModal.jsx";
import AddEquipmentModal from "../components/modals/addEquipmentModal.jsx";
import UploadPDFModal from "../components/modals/uploadPDFModal.jsx";
import ViewFullDetailModal from "../components/modals/fullDetailModal.jsx";
import EditItemModal from "../components/modals/editItemModal.jsx";
import ViewHistory from "../components/modals/viewHistoryModal.jsx";
import PredictiveModal from "../components/modals/predictiveModal.jsx";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function InventoryDashboard() {
  useCsrf();

  // Category state
  const [category, setCategory] = useState("PPE");

  //Sort
  const [showSortOptions, setShowSortOptions] = useState(false);

  // Inventory hook
  const {
    inventoryData,
    filteredData,
    searchQuery,
    setSearchQuery,
    fetchInventory,
    handleDelete,
    setSortBy,
    sortBy,
    setInventoryData,
  } = useInventory(category);

  // Maintenance hook
  const { maintenanceSchedules, fetchSchedules } = useMaintenance();

  //Sort Handler
  const handleSort = (type) => {
    //console.log("Sorting by:", type);
    const sortFilter = sortBy.split(":");
    if (sortFilter[0] === type) {
      if (sortFilter[1] === "asc") {
        setSortBy(`${type}:desc`);
      } else {
        setSortBy(`${type}:asc`);
      }
    } else {
      setSortBy(`${type}:asc`);
    }

    setShowSortOptions(false); // close after picking
  };
  // Modals
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSentModal, setShowSentModal] = useState(false);
  const [lastSent, setLastSent] = useState(null);
  const [showViewHistory, setShowViewHistory] = useState(false);
  const [showPredictive, setShowPredictive] = useState(false);

  // Selected items
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState([]);

  // back function
  const navigate = useNavigate();
  const handleBack = () => navigate("/admin/dashboard");

  // this toast displays after scheduling
  const handleScheduled = (job) => {
    toast.success("Maintenance scheduled & mail sent!");
    setLastSent(job); // the record we just created
    setShowSentModal(true); // pop the mini receipt
  };

  // PDF file
  const [pdfFile, setPdfFile] = useState(null);

  //New item form
  const initialShape = (cat) => ({
    category: cat,
    article: "",
    description: "",
    property_ro: "",
    property_co: "",
    semi_expendable_property_no: "",
    recorded_count: 0,
    actual_count: 0,
    unit: "pc",
    unit_value: 0,
    location: "",
    remarks: "",
    //image: ""
  });

  // state
  const [newItem, setNewItem] = useState(initialShape(category));

  // keep category in sync
  useEffect(() => {
    setNewItem((prev) => ({ ...prev, category }));
  }, [category]);

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // strip empty spaces
    const payload = Object.fromEntries(
      Object.entries(newItem).map(([k, v]) => [
        k,
        typeof v === "string" && v.trim() === "" ? null : v,
      ])
    );

    //console.log(payload)

    // add item
    try {
      await api.post("/api/inventory", payload);
      setShowModal(false);
      setNewItem(initialShape(category)); // reset
      await fetchInventory();
    } catch (err) {
      console.error("Add item failed:", err.response?.data || err);
      alert("Failed to add item. Please check your input.");
    }
  };

  // PDF upload and parse
  const handlePdfUpload = async (e) => {
    e.preventDefault();
    if (!pdfFile) {
      alert("Please select a PDF file first.");
      return;
    }

    try {
      const rows = await parsePdf(pdfFile, category);

      if (!rows || rows.length === 0) {
        alert("No data found in the PDF.");
        return;
      }

      const formattedItems = rows.map((row, index) => ({
        id: Date.now() + index,
        category,
        article: row.article || "",
        description: row.description || "",
        property_ro: row.property_RO || "",
        property_co: row.property_CO || "",
        semi_expendable_property_no: row.semi_expendable_property_no || "",
        unit: row.unit_of_measure || "",
        unit_value: Number(row.unit_value) || 0,
        recorded_count: Number(row.quantity_per_property_card) || 0,
        actual_count: Number(row.quantity_per_physical_count) || 0,
        location: row.whereabouts || "",
        remarks: row.remarks || "",
      }));

      setInventoryData((prev) => [...prev, ...formattedItems]);
      setShowPdfModal(false);
      setShowModal(false);
      alert("PDF uploaded and inventory updated!");
    } catch (err) {
      console.error("PDF parse failed:", err);
      alert("Failed to parse PDF.");
    }
  };

  // derive the actual equipment object
  const selectedEquipment = inventoryData.find(
    (eq) => eq.id === selectedEquipmentIds[0]
  );

  // opens the schedule modal for only 1 row
  const openScheduleModal = () => {
    if (selectedEquipmentIds.length !== 1) return;
    setShowScheduleModal(true);
  };

  // Get the full item objects for all selected IDs
  const selectedItems = useMemo(
    () =>
      inventoryData.filter((item) => selectedEquipmentIds.includes(item.id)), // <-- THE FIX IS HERE
    [selectedEquipmentIds, inventoryData]
  );

  // Find the first selected item to use as a template for the modal
  const currentTemplateItem = useMemo(
    () => selectedItems[0] || null,
    [selectedItems]
  );

  // Check if the "Predictive Maintenance" button should be disabled
  const isPredictiveButtonDisabled = useMemo(() => {
    if (selectedItems.length === 0) {
      return true; // Disabled if no items are selected
    }
    const firstArticle = selectedItems[0].article;
    // Disabled if not all selected items share the same article
    return !selectedItems.every((item) => item.article === firstArticle);
  }, [selectedItems]);

  // open predictive modal
  const handleOpenPredictiveModal = () => {
    if (isPredictiveButtonDisabled) return; // Guard clause
    setShowPredictive(true);
  };

  // handle predictive submit
  const handlePredictiveSubmit = async (formData) => {
    console.log(
      "Applying data to all selected IDs:",
      selectedEquipmentIds,
      formData
    );

    try {
      // Create an array of API post requests
      const updatePromises = selectedEquipmentIds.map((id) => {
        // 'id' here comes from your selectedEquipmentIds array (item.id)
        return api.post(
          `/api/maintenance/equipment/${id}/predictive-maintenance`,
          formData
        );
      });

      // Wait for all API calls to complete
      await Promise.all(updatePromises);

      toast.success(
        `Successfully activated predictive maintenance for ${selectedEquipmentIds.length} items!`
      );

      // Close modal, clear selection, and refresh the inventory list
      setShowPredictive(false);
      setSelectedEquipmentIds([]);
      fetchInventory(); // Make sure fetchInventory is available here
    } catch (error) {
      console.error("Failed to update one or more items:", error);
      toast.error("An error occurred. Please check the console and try again.");
    }
  };

  // render component UI
  return (
    <>
      <div className="min-h-screen bg-gray-50 relative">
        <BTRheader />
        <BTRNavbar />
        <Button
          onClick={() => {
            toast.success("Hello");
          }}
        >
          TEST
        </Button>

        {/* Category Tabs */}
        <div className="flex gap-4 px-4 pt-4 justify-center ">
          {[
            { name: "PPE", Icon: Car },
            { name: "RPCSP", Icon: Keyboard },
            { name: "Due soon", Icon: Calendar },
          ].map((type) => {
            const isActive = category === type.name;
            return (
              <button
                key={type.name}
                onClick={() => setCategory(type.name)}
                className={`px-4 py-2 rounded-md transition ${
                  isActive
                    ? "bg-yellow-400 text-white"
                    : "bg-gray-200 text-black hover:bg-yellow-400"
                }`}
              >
                <type.Icon className="h-5 w-5 inline-block mr-2" />
                {type.name}
              </button>
            );
          })}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
          <nav className="w-full bg-white shadow-md rounded-xl mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 py-4 px-4 sm:px-6 relative">
            {/* Search */}
            <div className="w-full sm:w-1/2 relative">
              <input
                type="text"
                placeholder={`Search ${category} items...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                style={{ paddingLeft: "2.5rem" }}
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortOptions(!showSortOptions)}
                className="px-2 py-0.5 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300"
              >
                Sort by:
              </button>

              {showSortOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                  <button
                    onClick={() => handleSort("name")}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Name
                    {sortBy.split(":")[0] === "name" &&
                    sortBy.split(":")[1] === "desc" ? (
                      <ArrowUpAZ className="h-5 w-5 inline-block ml-2" />
                    ) : (
                      <ArrowDownAZ className="h-5 w-5 inline-block ml-2" />
                    )}
                  </button>
                  <button
                    onClick={() => handleSort("price")}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Price
                    <ArrowUpDown className="h-5 w-5 inline-block ml-2" />
                  </button>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <button
                className="bg-yellow-400 text-white px-3 py-0.5 rounded-md font-semibold hover:bg-yellow-500"
                onClick={() => setShowTypeSelector(true)}
              >
                <Plus className="h-5 w-5 inline-block mr-2" />
                Add Equipment
              </button>

              <button
                disabled={selectedEquipmentIds.length === 0}
                onClick={openScheduleModal}
                className={`px-3 py-0.5 rounded-md font-semibold ${
                  selectedEquipmentIds.length > 0
                    ? "bg-yellow-400 text-white hover:bg-yellow-500"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Calendar className="h-5 w-5 inline-block mr-2" />
                Schedule Maintenance
              </button>

              <button
                onClick={() => navigate("/admin/maintenance-list")}
                className="px-3 py-0.5 bg-yellow-400 text-white rounded-md font-semibold hover:bg-yellow-500"
              >
                <Monitor className="h-5 w-5 inline-block mr-2" />
                Monitor Maintenance
              </button>

              <button
                className="px-3 py-0.5 bg-yellow-400 text-white rounded-md font-semibold hover:bg-yellow-500 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                onClick={handleOpenPredictiveModal}
                disabled={isPredictiveButtonDisabled}
                title={
                  isPredictiveButtonDisabled
                    ? "Please select one or more items of the SAME article type (e.g., all 'aircon')"
                    : "Activate/Update Predictive Maintenance"
                }
              >
                <Wrench className="h-5 w-5 inline-block mr-2" />
                Predictive Maintenance
              </button>
            </div>
          </nav>
        </div>

        {/* Equipment Table */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="px-1 pt-3 pb-3 bg-transparent rounded-xl shadow-md">
            {filteredData.length === 0 ? (
              <p className="text-gray-500">No equipment found in {category}.</p>
            ) : category !== "Due soon" ? (
              <div className="overflow-x-auto w-full">
                <table className="w-full table-auto border border-gray-300">
                  <thead className="bg-black-100">
                    <tr>
                      <th className="border px-2 py-1">Article</th>
                      <th className="border px-2 py-1">Description</th>
                      {category === "PPE" ? (
                        <>
                          <th className="border px-2 py-1">
                            Property Number (RO)
                          </th>
                          <th className="border px-2 py-1">
                            Property Number (CO)
                          </th>
                        </>
                      ) : (
                        <th className="border px-2 py-1">
                          Semi-Expendable Property No.
                        </th>
                      )}
                      <th className="border px-2 py-1">Unit</th>
                      <th className="border px-2 py-1">Unit Value</th>
                      <th className="border px-2 py-1">Actions</th>
                      <th className="border px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredData.length > 0 &&
                            selectedEquipmentIds.length === filteredData.length
                          }
                          onChange={(e) => {
                            setSelectedEquipmentIds(
                              e.target.checked
                                ? filteredData.map((item) => item.id)
                                : []
                            );
                          }}
                          className="accent-green-500 w-4 h-4"
                          title="Select All"
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-100 transition">
                        <td className="border px-2 py-1 text-center">
                          {item.article}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {item.description}
                        </td>
                        {item.category === "PPE" ? (
                          <>
                            <td className="border px-2 py-1 text-center">
                              {item.property_ro}
                            </td>
                            <td className="border px-2 py-1 text-center">
                              {item.property_co || (
                                <span className="text-gray-400 italic">—</span>
                              )}
                            </td>
                          </>
                        ) : (
                          <td className="border px-2 py-1 text-center">
                            {item.semi_expendable_property_no}
                          </td>
                        )}
                        <td className="border px-2 py-1 text-center">
                          {item.unit}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          ₱
                          {Number(item.unit_value).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="border px-2 py-1 text-center space-x-2">
                          <button
                            className="bg-yellow-400 text-white px-2 py-1 rounded hover:bg-yellow-500"
                            onClick={() => {
                              setSelectedDetailItem(item);
                              setShowDetailModal(true);
                            }}
                          >
                            View Full Detail
                          </button>
                        </td>
                        <td className="border px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={selectedEquipmentIds.includes(item.id)}
                            onChange={(e) => {
                              setSelectedEquipmentIds((prev) =>
                                e.target.checked
                                  ? [...prev, item.id]
                                  : prev.filter((id) => id !== item.id)
                              );
                            }}
                            className="accent-green-500 w-4 h-4"
                            title="Select for Maintenance"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full table-auto border border-gray-300">
                  <thead className="bg-black-100">
                    <tr>
                      {/* --- NEW: Conditional Headers --- */}
                      {category === "Due soon" ? (
                        <>
                          <th className="border px-2 py-1">Article</th>
                          <th className="border px-2 py-1">Description</th>
                          <th className="border px-2 py-1">Type</th>
                          <th className="border px-2 py-1">Due Date</th>
                          <th className="border px-2 py-1">Actions</th>
                          <th className="border px-2 py-1 text-center">
                            Select
                          </th>
                        </>
                      ) : (
                        // --- Original Headers ---
                        <>
                          <th className="border px-2 py-1">Article</th>
                          <th className="border px-2 py-1">Description</th>
                          {category === "PPE" ? (
                            <>
                              <th className="border px-2 py-1">
                                Property Number (RO)
                              </th>
                              <th className="border px-2 py-1">
                                Property Number (CO)
                              </th>
                            </>
                          ) : (
                            <th className="border px-2 py-1">
                              Semi-Expendable Property No.
                            </th>
                          )}
                          <th className="border px-2 py-1">Unit</th>
                          <th className="border px-2 py-1">Unit Value</th>
                          <th className="border px-2 py-1">Actions</th>
                          <th className="border px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={
                                filteredData.length > 0 &&
                                selectedEquipmentIds.length ===
                                  filteredData.length
                              }
                              onChange={(e) => {
                                setSelectedEquipmentIds(
                                  e.target.checked
                                    ? filteredData.map((item) => item.id) // Using item.id as per your code
                                    : []
                                );
                              }}
                              className="accent-green-500 w-4 h-4"
                              title="Select All"
                            />
                          </th>
                        </>
                      )}
                      {/* --- End Conditional Headers --- */}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item, index) => (
                      // Using item.id for the key as per your code
                      <tr
                        key={item.id}
                        className="hover:bg-gray-100 transition"
                      >
                        {/* --- NEW: Conditional Cells --- */}
                        {category === "Due soon" ? (
                          <>
                            <td className="border px-2 py-1 text-center">
                              {item.article}
                            </td>
                            <td className="border px-2 py-1 text-center">
                              {item.description}
                            </td>
                            <td className="border px-2 py-1 text-center">
                              {item.category}
                            </td>
                            <td className="border px-2 py-1 text-center">
                              {item.next_maintenance_date ? (
                                new Date(
                                  item.next_maintenance_date
                                ).toLocaleDateString() // Format the date
                              ) : (
                                <span className="text-gray-400 italic">—</span>
                              )}
                            </td>
                            <td className="border px-2 py-1 text-center space-x-2">
                              <button
                                className="bg-yellow-400 text-white px-2 py-1 rounded hover:bg-yellow-500"
                                onClick={() => {
                                  setSelectedDetailItem(item);
                                  setShowDetailModal(true);
                                }}
                              >
                                View Full Detail
                              </button>
                            </td>
                            <td className="border px-2 py-1 text-center">
                              <input
                                type="checkbox"
                                checked={selectedEquipmentIds.includes(item.id)}
                                onChange={(e) => {
                                  setSelectedEquipmentIds((prev) =>
                                    e.target.checked
                                      ? [...prev, item.id]
                                      : prev.filter((id) => id !== item.id)
                                  );
                                }}
                                className="accent-green-500 w-4 h-4"
                                title="Select for Maintenance"
                              />
                            </td>
                          </>
                        ) : (
                          // --- Original Cells ---
                          <>
                            <td className="border px-2 py-1 text-center">
                              {item.article}
                            </td>
                            <td className="border px-2 py-1 text-center">
                              {item.description}
                            </td>
                            {item.category === "PPE" ? (
                              <>
                                <td className="border px-2 py-1 text-center">
                                  {item.property_ro}
                                </td>
                                <td className="border px-2 py-1 text-center">
                                  {item.property_co || (
                                    <span className="text-gray-400 italic">
                                      —
                                    </span>
                                  )}
                                </td>
                              </>
                            ) : (
                              <td className="border px-2 py-1 text-center">
                                {item.semi_expendable_property_no}
                              </td>
                            )}
                            <td className="border px-2 py-1 text-center">
                              {item.unit}
                            </td>
                            <td className="border px-2 py-1 text-center">
                              ₱
                              {Number(item.unit_value).toLocaleString("en-PH", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="border px-2 py-1 text-center space-x-2">
                              <button
                                className="bg-yellow-400 text-white px-2 py-1 rounded hover:bg-yellow-500"
                                onClick={() => {
                                  setSelectedDetailItem(item);
                                  setShowDetailModal(true);
                                }}
                              >
                                View Full Detail
                              </button>
                            </td>
                            <td className="border px-2 py-1 text-center">
                              <input
                                type="checkbox"
                                checked={selectedEquipmentIds.includes(item.id)}
                                onChange={(e) => {
                                  setSelectedEquipmentIds((prev) =>
                                    e.target.checked
                                      ? [...prev, item.id]
                                      : prev.filter((id) => id !== item.id)
                                  );
                                }}
                                className="accent-green-500 w-4 h-4"
                                title="Select for Maintenance"
                              />
                            </td>
                          </>
                        )}
                        {/* --- End Conditional Cells --- */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <TypeSelectorModal
          isOpen={showTypeSelector}
          onClose={() => setShowTypeSelector(false)}
          onSelectType={(type) => {
            setCategory(type);
            setNewItem((prev) => ({ ...prev, category: type }));
            setShowModal(true);
          }}
        />

        <AddEquipmentModal
          // add equipment
          isOpen={showModal}
          category={category}
          newItem={newItem}
          setNewItem={setNewItem}
          onClose={() => {
            setShowModal(false);
            setNewItem({
              category,
              article: "",
              description: "",
              property_ro: "",
              property_co: "",
              semi_expendable_property_no: "",
              recorded_count: 0,
              actual_count: 0,
              unit: "",
              unit_value: 0,
              location: "",
              remarks: "",
            });
          }}
          onSubmit={handleSubmit}
          onUploadPDF={() => setShowPdfModal(true)}
        />

        <UploadPDFModal
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          onSubmit={handlePdfUpload}
          setPdfFile={setPdfFile}
        />

        {showScheduleModal && selectedEquipment && (
          <ScheduleMaintenanceModal
            isOpen={showScheduleModal}
            onClose={() => setShowScheduleModal(false)}
            asset={selectedEquipment} // whole object
            onScheduled={() => {
              setShowScheduleModal(false);
              setSelectedEquipmentIds([]);
              fetchSchedules();
            }}
          />
        )}

        <ViewFullDetailModal
          isOpen={showDetailModal}
          item={selectedDetailItem}
          onClose={() => setShowDetailModal(false)}
          onViewHistory={() => setShowViewHistory(true)}
          onEdit={() => {
            setSelectedItem(selectedDetailItem);
            setShowEditModal(true);
          }}
          // delete item
          onDelete={async (id) => {
            if (!window.confirm("Are you sure you want to delete this item?"))
              return;
            try {
              await api.delete(`/api/inventory/${id}`);
              alert("Item deleted successfully!");
              setInventoryData((prev) => prev.filter((item) => item.id !== id));
              setShowDetailModal(false);
            } catch (err) {
              alert("Error deleting item. Please try again.");
              console.error("Error deleting item:", err);
            }
          }}
        />

        <ViewHistory
          isOpen={showViewHistory}
          setOpen={setShowViewHistory}
          detailItem={selectedDetailItem}
        />

        <EditItemModal
          // edit item
          isOpen={showEditModal}
          item={selectedItem}
          onClose={() => setShowEditModal(false)}
          onSave={async (updatedItem) => {
            setShowEditModal(false);
            await fetchInventory();
            setSelectedDetailItem(updatedItem);
          }}
        />

        <PredictiveModal
          // open modal
          isOpen={showPredictive}
          item={currentTemplateItem}
          onClose={() => setShowPredictive(false)}
          onSubmit={handlePredictiveSubmit}
        />
      </div>
    </>
  );
}
