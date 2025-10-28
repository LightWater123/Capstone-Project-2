import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";
import BTRheader from "../components/modals/btrHeader";
import BTRNavbar from "../components/modals/btrNavbar.jsx";
import { ChevronRight } from "lucide-react";
import CalendarModal from "../components/modals/calendar.jsx";
import api from "../api/api";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const handleInventoryList = () => navigate("/inventory");
  const handleMaintenanceList = (e) =>
    navigate(`/admin/maintenance-list?id=${e}`);
  const [open, setOpen] = useState(false);
  const eventDates = [];

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

        // Get current date for debugging
        const today = new Date();
        //console.log("Today's date:", today.toISOString());

        // Use the api instance
        const response = await api.get(
          "/api/maintenance/due-for-maintenance?days=2"
        );

        // Log the response for debugging
        //console.log("API Response:", response.data);

        // The data is in the `data.data` property of the response
        setDueItems(response.data.data || []);

        // Additional debugging info
        if (response.data.date_range) {
          //console.log("Checking dates from", response.data.date_range.from, "to", response.data.date_range.to);
        }
      } catch (err) {
        // Axios provides a more detailed error object
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
      <BTRNavbar />

      <div className="max-w-[88rem] mx-auto px-6 py-6">
        <div className="grid gap-4 mb-6 grid-cols-1 grid-rows-auto lg:grid-cols-5 lg:grid-rows-5" >
          <div className="flex items-start justify-end col-span-1 row-span-1 lg:col-span-3 lg:row-span-5 p-4 border-b">
            <Button
              onClick={handleInventoryList}
              variant="ghost"
              className="relative text-sm px-3 py-1 bg-transparent border-none 
             after:content-[''] after:absolute after:left-0 after:bottom-[-1px] 
             after:h-[3px] after:w-0 after:bg-gray-800 after:rounded-full 
             after:transition-all after:duration-300 hover:after:w-full 
             focus:outline-none">
              View Full Details 
              <ChevronRight className="h-2 w-2" />
            </Button>
          </div>

          <div
            className="flex justify-center items-center col-span-1 row-span-1 lg:col-span-2 lg:row-span-3 lg:col-start-4"
          >
            <CalendarModal />
          </div>

          <div
            className="bg-gray-100 rounded-xl shadow-md p-4 flex flex-col col-span-1 row-span-1 lg:col-span-2 lg:row-span-2 lg:col-start-4 lg:row-start-4"
          >
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
                    onClick={() => handleMaintenanceList(item.asset_id)}
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
