import { useState, useEffect } from "react"; // Added
import { useNavigate } from "react-router-dom";
import "../index.css";
import BTRheader from "../components/modals/btrHeader";
import Navbar from "../components/modals/serviceNavbar.jsx";
import Calendar from "../components/modals/serviceCalendar.jsx";
import { ChevronRight } from "lucide-react";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "../api/api"; // Added

export default function ServiceDashboard() {
  const navigate = useNavigate();

  const handleCreateServiceAccount = () => navigate("/register/service");
  const handleInventoryList = (assetId = null) => {
    const path = assetId
      ? `/service/inventory?highlight=${assetId}`
      : `/service/inventory`;
    navigate(path);
  };

  // Added from your admin dashboard logic, path adjusted for service
  //const handleMaintenanceList = (e) => navigate(`/service/maintenance-list?id=${e}`);

  // State for data, loading, and errors
  const [dueItems, setDueItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from the API on component mount
  useEffect(() => {
    const fetchDueItems = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Use the api instance
        const response = await api.get("/api/service/serviceReminder?days=2");

        setDueItems(response.data.data || []);
      } catch (err) {
        const errorMessage =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "An unknown error occurred";
        setError(errorMessage);
        //console.error("Failed to fetch maintenance items:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDueItems();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <BTRheader />
      <Navbar />

      <div className="max-w-[88rem] mx-auto px-6 py-6">
        <div className="grid gap-4 mb-6 grid-cols-1 grid-rows-auto lg:grid-cols-5 lg:grid-rows-5">
          <div className="flex items-start justify-end col-span-1 row-span-1 lg:col-span-3 lg:row-span-5 p-4 border-b">
            <Button
              onClick={handleInventoryList}
              variant="ghost"
              className="relative text-sm px-3 py-1 bg-transparent border-none 
             after:content-[''] after:absolute after:left-0 after:bottom-[-1px] 
             after:h-[3px] after:w-0 after:bg-gray-800 after:rounded-full 
             after:transition-all after:duration-300 hover:after:w-full 
             focus:outline-none"
            >
              View Full Details
              <ChevronRight className="h-2 w-2" />
            </Button>
          </div>

          {/* Calendar */}
          <div className="flex justify-center items-center col-span-1 row-span-1 lg:col-span-2 lg:row-span-3 lg:col-start-4">
            <Calendar />
          </div>

          {/* Reminders - UPDATED DYNAMICALLY */}
          <div className="bg-gray-100 rounded-xl shadow-md p-4 flex flex-col col-span-1 row-span-1 lg:col-span-2 lg:row-span-2 lg:col-start-4 lg:row-start-4">
            <h2 className="text-xl font-bold mb-4">Reminders</h2>
            <ul className="flex-1 overflow-y-auto space-y-2">
              {isLoading ? (
                <li className="text-gray-500 text-center py-4">Loading...</li>
              ) : error ? (
                <li className="text-red-500 text-center py-4">
                  Error: {error}
                </li>
              ) : dueItems.length === 0 ? (
                <li className="text-gray-500">
                  No items are due for maintenance in the next 2 days.
                </li>
              ) : (
                dueItems.map((item) => (
                  <li
                    key={item.id}
                    className="bg-white p-3 rounded shadow-sm border-l-4 border-yellow-500 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleInventoryList(item.asset_id)}
                  >
                    <div className="font-semibold text-gray-800">
                      {item.asset_name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Due: {new Date(item.scheduled_at).toLocaleDateString()} |
                      Assigned to: {item.user_email} | Status: {item.status}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
