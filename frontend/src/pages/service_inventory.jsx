// ServiceInventory.jsx - Service inventory page showing maintenance items and archive
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";
import BTRheader from "../components/modals/btrHeader";
import Navbar from "../components/modals/serviceNavbar.jsx";
import ReportCell from "../components/modals/reportCell.jsx";
import { useServiceInventory } from "../hooks/useServiceInventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const StatusDropdown = ({
  itemId,
  currentStatus,
  updateStatus,
  refetchMaintenance,
  refetchArchived,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus || "pending");
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0, top: 0 });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    setIsOpen(false);
    await updateStatus(itemId, newStatus).then(() => {
      refetchArchived();
      refetchMaintenance();
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const calculateDropdownPosition = () => {
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        left: buttonRect.left,
        top: buttonRect.bottom + 5,
      });
    }
  };

  const handleButtonClick = () => {
    if (!isOpen) calculateDropdownPosition();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => isOpen && setIsOpen(false);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
          status
        )} flex items-center gap-1 w-full text-left`}
      >
        {status}
        <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            zIndex: 9999,
            left: dropdownPosition.left,
            top: dropdownPosition.top,
          }}
          className="w-48 bg-white rounded-md shadow-lg py-1"
        >
          <button
            onClick={() => handleStatusChange("pending")}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Pending
          </button>
          <button
            onClick={() => handleStatusChange("in-progress")}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            In Progress
          </button>
          <button
            onClick={() => handleStatusChange("done")}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};

/* ----------  MAIN PAGE  ---------- */
export default function ServiceInventory() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("inventory");
  const [category, setCategory] = useState("PPE");
  const [selectedId, setSelectedId] = useState(null);

  const {
    maintenanceItems,
    archivedItems,
    maintenanceDetails,
    refetchMaintenance,
    refetchArchived,
    updateStatus,
    fetchMaintenanceDetails,
    setSearchQuery,
    searchQuery,
  } = useServiceInventory();

  const loadMaintenanceDetails = (id) => {
    setSelectedId(id);
    fetchMaintenanceDetails(id);
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <BTRheader />
      <Navbar />

      <main className="max-w-[88rem] mx-auto px-4 sm:px-6 mt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Service Inventory
          </h1>
        </div>

        {/* Tabs & Category */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setTab("inventory")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded ${
                tab === "inventory"
                  ? "bg-blue-900 border hover:bg-blue-900 text-white"
                  : "bg-gray-800 border hover:bg-blue-900"
              }`}
            >
              Inventory
            </Button>
            <Button
              onClick={() => setTab("archive")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded ${
                tab === "archive"
                  ? "bg-blue-900 border hover:bg-blue-900 text-white"
                  : "bg-gray-800 border hover:bg-blue-900"
              }`}
            >
              Archive
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 flex gap-2 sm:justify-end mt-4">
          <input
            type="text"
            placeholder="Search by equipment name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm "
          />
        </div>

        {/* INVENTORY TABLE */}
        {tab === "inventory" && (
          <div className="bg-white rounded shadow overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left">
                <thead className="bg-gray-100 text-sm uppercase text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Equipment</th>
                    <th className="px-4 py-3">Scheduled At</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Report</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t hover:bg-gray-50"
                      onClick={() => loadMaintenanceDetails(item.asset_id)}
                    >
                      <td className="px-4 py-3 cursor-pointer hover:text-blue-600">
                        {item.asset_name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {item.scheduled_at
                          ? new Date(item.scheduled_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <StatusDropdown
                          itemId={item.id}
                          currentStatus={item.status}
                          updateStatus={updateStatus}
                          refetchArchived={refetchArchived}
                          refetchMaintenance={refetchMaintenance}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <ReportCell
                          item={item}
                          onUpdate={() => {
                            refetchMaintenance();
                            refetchArchived();
                          }}
                        />
                      </td>
                      <td
                        className="px-4 py-3 text-blue-600 cursor-pointer"
                        onClick={() => loadMaintenanceDetails(item.id)}
                      >
                        {">"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ARCHIVE TABLE */}
        {tab === "archive" && (
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-sm uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3">Asset Name</th>
                  <th className="px-4 py-3">Scheduled Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Report</th> {/*  was Message  */}
                  <th className="px-4 py-3">Date Sent</th>
                </tr>
              </thead>
              <tbody>
                {archivedItems.map((item, k) => (
                  <tr
                    key={item.job?.asset_id ?? k}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">{item.job?.asset_name || "—"}</td>
                    <td className="px-4 py-3">
                      {item.job?.scheduled_at
                        ? new Date(item.job.scheduled_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          item.job?.status === "done"
                            ? "bg-green-100 text-green-800"
                            : item.job?.status === "in-progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item.job?.status || "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ReportCell
                        item={item.job}
                        onUpdate={() => {
                          refetchMaintenance();
                          refetchArchived();
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DETAIL SIDE-PANEL */}
        {selectedId && (
          <section className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg p-6 overflow-y-auto z-40">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Maintenance Details</h2>
              <button
                onClick={() => setSelectedId(null)}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>

            {maintenanceDetails ? (
              <>
                <p className="text-sm text-gray-500 mb-2">Equipment</p>
                <p className="mb-4">{maintenanceDetails.article || "—"}</p>

                <p className="text-sm text-gray-500 mb-2">Description</p>
                <p className="mb-4">{maintenanceDetails.description || "—"}</p>

                <p className="text-sm text-gray-500 mb-2">Asset ID</p>
                <p className="mb-4">{maintenanceDetails.asset_id || "—"}</p>

                {maintenanceDetails.maintenance?.length > 0 ? (
                  <>
                    <p className="text-sm text-gray-500 mb-2">
                      Maintenance History
                    </p>
                    {maintenanceDetails.maintenance.map((job) => (
                      <div key={job.id} className="mb-4 p-3 bg-gray-50 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              job.status === "done"
                                ? "bg-green-100 text-green-800"
                                : job.status === "in-progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {job.status || "pending"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {job.scheduled_at
                              ? new Date(job.scheduled_at).toLocaleDateString()
                              : "—"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">Condition</p>
                        <p className="mb-2">{job.condition || "—"}</p>
                        <p className="text-sm text-gray-500 mb-1">Remarks</p>
                        <p className="mb-2 whitespace-pre-wrap">
                          {job.remarks || "—"}
                        </p>
                        <div className="flex text-xs text-gray-500">
                          <span className="mr-4">
                            Start:{" "}
                            {job.start_date
                              ? new Date(job.start_date).toLocaleDateString()
                              : "—"}
                          </span>
                          <span>
                            End:{" "}
                            {job.end_date
                              ? new Date(job.end_date).toLocaleDateString()
                              : "—"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-gray-500">No maintenance history found</p>
                )}
              </>
            ) : (
              <p className="text-gray-500">Loading maintenance details...</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
