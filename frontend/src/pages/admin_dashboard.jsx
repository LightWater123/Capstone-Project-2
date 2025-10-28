// src/pages/AdminDashboard.jsx
import { useState } from "react";
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

  const {
    inventoryData: predictiveItems,
    filteredData: filteredPredictiveItems,
  } = useInventory("due soon");

  const { data: dueItems = [], isLoading } = useQuery({
    queryKey: ["getReminders"],
    queryFn: async () => {
      const [maintDue, events] = await Promise.all([
        api
          .get("/api/maintenance/due-for-maintenance?days=2")
          .then((r) => r.data.data),
        api.get("/api/events").then((r) =>
          r.data.map((e) => ({
            id: v4(),
            asset_id: "",
            asset_name: e.title,
            scheduled_at: e.start_date,
            user_email: "",
            status: "",
          }))
        ),
      ]);
      return [...maintDue, ...events];
    },
    staleTime: 5000,
    refetchInterval: 5000,
  });

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <BTRheader />
      <BTRNavbar />

     <div className="max-w-[88rem] mx-auto px-6 py-6 h-[calc(100vh-4rem)]">
  <div className="grid grid-cols-1 gap-4 h-full lg:grid-cols-5 lg:grid-rows-5">
    
    {/* 1️⃣ Main Content (spans 3 cols, 5 rows) */}
    <div className="col-span-1 lg:col-span-3 lg:row-span-5 flex flex-col bg-white rounded-xl shadow-md p-5">
      <div className="flex items-start mb-4">
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
      <DueSoon
        dueItems={filteredPredictiveItems}
        isLoading={false}
        error={null}
      />
    </div>

    {/* 2️⃣ Calendar */}
    <div className="col-span-1 lg:col-span-2 lg:col-start-4 lg:row-span-3 flex justify-center items-stretch rounded-lg bg-white ">
      <CalendarModal />
    </div>

    {/* 3️⃣ Reminders */}
    <div className="col-span-1 lg:col-span-2 lg:col-start-4 lg:row-start-4 lg:row-span-2 bg-gray-100 rounded-xl shadow-md p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-4 border-b pb-2">Reminders</h2>
      <ul className="flex-1 overflow-y-auto">
        {isLoading ? (
          <li className="text-gray-500 text-center py-4">Loading...</li>
        ) : dueItems.length === 0 ? (
          <li className="text-gray-500">
            No items are due for maintenance in the next 2 days.
          </li>
        ) : (
          dueItems.map((item) => (
            <li
              key={item.id}
              className="bg-white p-3 rounded shadow-sm border-l-4 border-blue-900 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => navigate(`/calendar-full`)}
            >
              <div className="font-semibold text-gray-800">
                {item.asset_name}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Due: {new Date(item.scheduled_at).toLocaleDateString()} | Assigned to: {item.user_email} | Status: {item.status}
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
