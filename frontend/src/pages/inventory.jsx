import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useInventory } from "../hooks/useInventory";
import { useMaintenance } from "../hooks/useMaintenance";
import { parsePdf } from "../hooks/usePdfParser";
import { useCsrf } from "../hooks/useCsrf";
import api from "../api/api";
import BTRheader from "../components/modals/btrHeader";
import BTRNavbar from "../components/modals/btrNavbar.jsx";

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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

//Icons
import {
  ArrowUpAZ,
  Icon,
  Plus,
  Wrench,
  Monitor,
  Calendar,
  Car,
  Keyboard,
  Search,
  ArrowUpDown,
  ChevronDownIcon,
  ArrowDownAZ,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // derive paginated data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredData.slice(startIndex, endIndex);

  // Function to handle page changes
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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
      inventoryData.filter((item) => selectedEquipmentIds.includes(item.id)),
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
        {/* <Button
          onClick={() => {
            toast.success("Hello");
          }}
        >
          TEST
        </Button> */}

        <div className="max-w-[88rem] mx-auto px-4 sm:px-6 mt-4 justify-start flex">
          <nav className="w-full border-b mb-4 flex flex-col gap-4 py-4 px-1 sm:px-6 relative">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full">
              {/* Search */}
              <div className="relative w-full ">
                <Input
                  type="text"
                  placeholder={`Search ${category} items...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 py-2 text-base"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
              {/* Sort Dropdown */}
              <div className="relative w-full sm:w-auto">
                <Button
                  onClick={() => setShowSortOptions(!showSortOptions)}
                  className="px-2 py-0.2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300 w-full sm:w-auto"
                >
                  Sort by:
                  <ChevronDownIcon
                    className="-me-1 opacity-60"
                    size={16}
                    aria-hidden="true"
                  />
                </Button>

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
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full">
              <Button
                className="flex-1 text-white px-2 sm:px-3 py-1 rounded-md font-semiboldtext-xs sm:text-sm leading-tight whitespace-nowrap bg-blue-900 hover:bg-blue-950"
                onClick={() => setShowTypeSelector(true)}
              >
                <Plus className="h-5 w-5 inline-block mr-2" />
                Add Equipment
              </Button>

              <Button
                onClick={() => navigate("/admin/maintenance-list")}
                className="flex-1 px-3 py-0.5  text-white rounded-md font-semibold bg-blue-900 hover:bg-blue-950 "
              >
                <Monitor className="h-5 w-5 inline-block mr-2" />
                Monitor Maintenance
              </Button>

              <Button
                disabled={selectedEquipmentIds.length === 0}
                onClick={openScheduleModal}
                className={`flex-1 px-2 sm:px-3 py-0.5 rounded-md font-semibold text-xs sm:text-sm whitespace-nowrap bg-blue-900 hover:bg-blue-950 ${
                  selectedEquipmentIds.length > 0
                    ? "bg-blue-900 hover:bg-blue-950 text-white "
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Calendar className="h-5 w-5 inline-block mr-2" />
                Schedule Maintenance
              </Button>

              <Button
                className="flex-1 px-2 sm:px-3 py-0.5 rounded-md font-semibold text-xs sm:text-sm whitespace-nowrap disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white bg-blue-900 hover:bg-blue-950"
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
              </Button>
            </div>
          </nav>
        </div>

        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 mt-4 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          {/* Category Buttons */}
          <div className="flex flex-wrap w-full md:w-auto gap-3">
            {[
              { name: "PPE", Icon: Car },
              { name: "RPCSP", Icon: Keyboard },
              { name: "Due soon", Icon: Calendar },
            ].map((type) => {
              const isActive = category === type.name;
              return (
                <Button
                  key={type.name}
                  onClick={() => setCategory(type.name)}
                  variant="ghost"
                  className={`relative flex-1 md:flex-none flex items-center justify-center gap-2 text-sm font-medium px-3 py-1 bg-transparent border-none text-blue-950 
                    after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px]
                    after:h-[3px] after:rounded-full after:-translate-x-1/2
                    after:transition-all after:duration-300
          ${
            isActive
              ? "after:w-full after:bg-blue-900 text-blue-900"
              : "after:w-0 after:bg-blue-950 hover:after:w-full hover:text-blue-900"
          }
          focus:outline-none
        `}
                >
                  <type.Icon className="h-4 w-4" />
                  {type.name}
                </Button>
              );
            })}
          </div>

          {/* Items per page selector */}
          <div className="flex w-full md:w-auto justify-center md:justify-end items-center gap-2">
            <Label>Items per page:</Label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="w-full md:w-auto px-2 py-1 border rounded">
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={40}>40</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Equipment Table */}
        <div className="max-w-[88rem] mx-auto px-4 sm:px-6">
          <div className="px-1 pt-3 pb-3 rounded-md border mt-4 mb-5">
            {filteredData.length === 0 ? (
              <p className="text-gray-500">No equipment found in {category}.</p>
            ) : category !== "Due soon" ? (
              <>
                <div className="overflow-x-auto w-full">
                  <Table className="w-full table-auto">
                    <TableHeader className="sticky top-0 bg-black-100">
                      <TableRow>
                        <TableHead className="px-2 py-1">Article</TableHead>
                        <TableHead className="px-2 py-1">Description</TableHead>
                        {category === "PPE" ? (
                          <>
                            <TableHead className="px-2 py-1">
                              Property Number (RO)
                            </TableHead>
                            <TableHead className="px-2 py-1">
                              Property Number (CO)
                            </TableHead>
                          </>
                        ) : (
                          <TableHead className="px-2 py-1">
                            Semi-Expendable Property No.
                          </TableHead>
                        )}
                        <TableHead className="px-2 py-1">Unit</TableHead>
                        <TableHead className="px-2 py-1">Unit Value</TableHead>
                        <TableHead className="px-2 py-1">Actions</TableHead>
                        <TableHead className="px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={
                              currentItems.length > 0 &&
                              selectedEquipmentIds.length ===
                                currentItems.length &&
                              currentItems.every((item) =>
                                selectedEquipmentIds.includes(item.id)
                              )
                            }
                            onChange={(e) => {
                              const currentIds = currentItems.map(
                                (item) => item.id
                              );
                              setSelectedEquipmentIds(
                                (prev) =>
                                  e.target.checked
                                    ? [...new Set([...prev, ...currentIds])] // Add current page's IDs
                                    : prev.filter(
                                        (id) => !currentIds.includes(id)
                                      ) // Remove current page's IDs
                              );
                            }}
                            className="accent-green-500 w-4 h-4"
                            title="Select All on This Page"
                          />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.map((item, index) => (
                        <TableRow
                          key={index}
                          className="hover:bg-gray-100 transition"
                        >
                          <TableCell className="px-2 py-1 min-w-[128px] max-w-[192px] truncate">
                            {item.article}
                          </TableCell>
                          <TableCell className="px-2 py-1 min-w-[160px] max-w-[288px] truncate">
                            {item.description}
                          </TableCell>
                          {item.category === "PPE" ? (
                            <>
                              <TableCell className="px-2 py-1 min-w-[128px] max-w-[176px] truncate">
                                {item.property_ro}
                              </TableCell>
                              <TableCell className="px-2 py-1 min-w-[128px] max-w-[176px] truncate">
                                {item.property_co || (
                                  <span className="text-gray-400 italic">
                                    —
                                  </span>
                                )}
                              </TableCell>
                            </>
                          ) : (
                            <TableCell className="px-2 py-1 min-w-[128px] max-w-[176px] truncate">
                              {item.semi_expendable_property_no}
                            </TableCell>
                          )}
                          <TableCell className="px-2 py-1 min-w-[96px] max-w-[120px] truncate">
                            {item.unit}
                          </TableCell>
                          <TableCell className="px-2 py-1 min-w-[96px] max-w-[128px] truncate">
                            ₱
                            {Number(item.unit_value).toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="px-2 py-1 space-x-2 min-w-[112px] max-w-[144px]">
                            <Button
                              className="bg-blue-900 text-white px-2 py-1 rounded hover:bg-blue-950 "
                              onClick={() => {
                                setSelectedDetailItem(item);
                                setShowDetailModal(true);
                              }}
                            >
                              View Full Detail
                            </Button>
                          </TableCell>
                          <TableCell className="px-2 py-1 text-center">
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
                              className="accent-blue-900 w-4 h-4"
                              title="Select for Maintenance"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <>
                <div className="overflow-x-auto w-full">
                  <Table className="w-full table-auto">
                    <TableHeader className="bg-black-100">
                      <TableRow>
                        <TableHead className="px-2 py-1">Article</TableHead>
                        <TableHead className="px-2 py-1">Description</TableHead>
                        <TableHead className="px-2 py-1">Type</TableHead>
                        <TableHead className="px-2 py-1">Due Date</TableHead>
                        <TableHead className="px-2 py-1">Actions</TableHead>
                        <TableHead className="px-2 py-1 text-center">
                          Select
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.map((item, index) => (
                        <TableRow
                          key={item.id}
                          className="hover:bg-gray-100 transition"
                        >
                          <TableCell className="px-2 py-1">
                            {item.article}
                          </TableCell>
                          <TableCell className="px-2 py-1">
                            {item.description}
                          </TableCell>
                          <TableCell className="px-2 py-1">
                            {item.category}
                          </TableCell>
                          <TableCell className="px-2 py-1">
                            {item.next_maintenance_date ? (
                              new Date(
                                item.next_maintenance_date
                              ).toLocaleDateString()
                            ) : (
                              <span className="text-gray-400 italic">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-1 text-center space-x-2">
                            <Button
                              className="bg-blue-900 text-white px-2 py-1 rounded hover:bg-blue-950"
                              onClick={() => {
                                setSelectedDetailItem(item);
                                setShowDetailModal(true);
                              }}
                            >
                              View Full Detail
                            </Button>
                          </TableCell>
                          <TableCell className="px-2 py-1 text-center">
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-4 space-x-2 mb-4 overflow-x-auto">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 text-black hover:bg-gray-400"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded ${
                      page === currentPage
                        ? "bg-blue-900 text-white"
                        : "bg-gray-200 text-black hover:bg-gray-300"
                    }`}
                  >
                    {page}
                  </Button>
                )
              )}
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 text-black hover:bg-gray-400"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
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
          selectedEquipment={currentTemplateItem}
          onClose={() => setShowPredictive(false)}
          onSubmit={handlePredictiveSubmit}
        />
      </div>
    </>
  );
}
