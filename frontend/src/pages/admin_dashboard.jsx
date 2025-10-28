import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";
import BTRheader from "../components/modals/btrHeader";
import BTRNavbar from "../components/modals/btrNavbar.jsx";
import { ChevronRight } from "lucide-react";
import CalendarModal from "../components/modals/calendar.jsx";
import api from "../api/api";
import { Button } from "@/components/ui/button";
import DueSoon from "../components/modals/adminDashboardDueSoon";
import { useInventory } from "../hooks/useInventory";
import { useQuery } from "@tanstack/react-query";
import { v4 } from "uuid";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const handleInventoryList = () => navigate("/inventory");

  const [open, setOpen] = useState(false);
  const eventDates = [];

  // State for regular maintenance data (for Reminders section)
  // const [dueItems, setDueItems] = useState([]);
  // const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use the useInventory hook with "due soon" category for predictive maintenance data
  const {
    inventoryData: predictiveItems,
    filteredData: filteredPredictiveItems,
  } = useInventory("due soon");

  const {data: dueItems = [], isLoading} = useQuery({
    queryKey: ["getReminders"],
    queryFn: async () => {
      const [maintDue, events] = await Promise.all([
        api.get("/api/maintenance/due-for-maintenance?days=2").then(r => r.data.data),
        api.get("/api/events").then(r => r.data.map((e) =>({
          id: v4(),
          asset_id: "",
          asset_name: e.title,
          scheduled_at: e.start_date,
          user_email: "",
          status: ""
        })))
      ])
      // console.log("maintDUe", maintDue)
      console.log("event", events)
      // console.log([...maintDue, ...events])


      return [...maintDue, ...events]
    },
    staleTime: 5000,
    refetchInterval: 5000
  })

  console.log(dueItems)

  // Fetch regular maintenance data on component mount
  // useEffect(() => {
  //   const fetchDueItems = async () => {
  //     try {
  //       setIsLoading(true);
  //       setError(null);

  //       const response = await api.get(
  //         "/api/maintenance/due-for-maintenance?days=2"
  //       );

  //       setDueItems(response.data.data || []);
  //     } catch (err) {
  //       const errorMessage =
  //         err.response?.data?.error ||
  //         err.response?.data?.message ||
  //         err.message ||
  //         "An unknown error occurred";
  //       setError(errorMessage);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchDueItems();
  // }, []);

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <BTRheader />
      <BTRNavbar />

      <div className="max-w-[88rem] mx-auto px-6 py-6">
        <div className="grid gap-4 mb-6 grid-cols-1 grid-rows-auto lg:grid-cols-5 lg:grid-rows-5">
          <div className="flex flex-col col-span-1 row-span-1 lg:col-span-3 lg:row-span-5">
            <div className="flex items-start justify-start mb-4">
              <Button
                onClick={handleInventoryList}
                variant="ghost"
                className="relative text-sm px-3 py-1 bg-transparent border-none 
                after:content-[''] after:absolute after:left-0 after:bottom-[-1px] 
                after:h-[3px] after:w-0 after:bg-gray-800 after:rounded-full 
                after:transition-all after:duration-300 hover:after:w-full 
                focus:outline-none"
              >
                View Inventory
                <ChevronRight className="h-2 w-2" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <DueSoon
                dueItems={filteredPredictiveItems}
                isLoading={false} // The hook handles loading internally
                error={null} // The hook handles errors internally
                // Removed onItemClick prop to make items non-clickable
              />
            </div>
          </div>

          <div className="flex justify-center items-center col-span-1 row-span-1 lg:col-span-2 lg:row-span-3 lg:col-start-4">
            <CalendarModal />
          </div>

          <div className="bg-gray-100 rounded-xl shadow-md p-4 flex flex-col col-span-1 row-span-1 lg:col-span-2 lg:row-span-2 lg:col-start-4 lg:row-start-4">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Reminders</h2>
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
                    className="bg-white p-3 rounded shadow-sm border-l-4 border-blue-900 cursor-pointer hover:bg-gray-50 transition-colors"
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
