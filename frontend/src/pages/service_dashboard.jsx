import { useState, useEffect } from "react"; // Added
import { useNavigate } from "react-router-dom";
import "../index.css";
import BTRheader from "../components/modals/btrHeader";
import Navbar from "../components/modals/serviceNavbar.jsx";
import Calendar from "../components/modals/serviceCalendar.jsx";
import { Wrench } from 'lucide-react';
import api from '../api/api'; // Added

export default function ServiceDashboard() {
 const navigate = useNavigate();

 const handleCreateServiceAccount = () => navigate("/register/service");
 const handleInventoryList = () => navigate("/service/inventory");
  
  // Added from your admin dashboard logic, path adjusted for service
 const handleMaintenanceList = (e) => navigate(`/service/maintenance-list?id=${e}`);

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
      const response = await api.get('/api/service/serviceReminder?days=2');
      
      
      setDueItems(response.data.data || []);
      
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'An unknown error occurred';
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
       {/* Preventive Maintenance */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Preventive Maintenance */}
        <div className="lg:col-span-2">
         <button
          onClick={handleInventoryList}
          className="w-full h-[350px] bg-white rounded-xl text-gray-800 hover:bg-[#FCFC62] font-medium shadow-md text-3xl flex items-center justify-center transition-colors"
         >
          <Wrench className="h-10 w-10 inline-block mr-2 relative m-4"/>
          Assets to be maintained
         </button>
        </div>
   
        {/* Calendar */}
        <div className="lg:col-span-1 justify-center flex">
         <Calendar />
        </div>
       </div>
   
       {/* Reminders - UPDATED DYNAMICALLY */}
       <div className="w-full min-w-[300px] h-[350px] bg-gray-100 rounded-xl shadow-md p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Reminders</h2>
        <ul className="flex-1 overflow-y-auto space-y-2">
         {isLoading ? (
          <li className="text-gray-500 text-center py-4">Loading...</li>
         ) : error ? (
          <li className="text-red-500 text-center py-4">Error: {error}</li>
         ) : dueItems.length === 0 ? (
          <li className="text-gray-500">No items are due for maintenance in the next 2 days.</li>
         ) : (
          dueItems.map((item) => (
           <li 
            key={item.id} 
            className="bg-white p-3 rounded shadow-sm border-l-4 border-yellow-500 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={()=>handleMaintenanceList(item.asset_id)}
           >
             <div className="font-semibold text-gray-800">{item.asset_name}</div>
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
 );
}