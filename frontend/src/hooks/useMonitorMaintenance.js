import { useState } from "react";
import api from "../api/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useMonitorMaintenance() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("asset_name");
  const queryClient = useQueryClient();

  // Fetch maintenance schedules using TanStack Query with 10-second refetch interval
  const { data: schedulesData = [], refetch, isLoading, error } = useQuery({
    queryKey: ['maintenance-schedules'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/api/maintenance/schedule');
        return data;
      } catch (err) {
        console.error("Maintenance schedules fetch failed:", err);
        return [];
      }
    },
    refetchInterval: 10000, // 10 seconds refetch interval
    refetchIntervalInBackground: false,
  });

  // Filter function
  const filteredData = schedulesData.filter(schedule => {
    const query = searchQuery.toLowerCase();
    if(query.startsWith("id:"))
      {
        const idQuery = query.slice(3);
        //console.log(idQuery);
        return schedule.asset_id?.toLowerCase().includes(idQuery);
      }
    return schedule.asset_name?.toLowerCase().includes(query) || 
           (schedule.user_email && schedule.user_email.toLowerCase().includes(query));
  });

  // Create a sorted copy to avoid mutating the original array
  const sortedData = [...filteredData];
  
  if(sortBy === "asset_name") {
    sortedData.sort((a,b) => {
      const aItem = a.asset_name?.toLowerCase().trim() || "";
      const bItem = b.asset_name?.toLowerCase().trim() || "";
      if(aItem < bItem) return -1
      if(aItem > bItem) return 1
      return 0
    })
  } else if(sortBy === "scheduled_at") {
    sortedData.sort((a,b) => new Date(b.scheduled_at) - new Date(a.scheduled_at))
  } else if(sortBy === "status") {
    sortedData.sort((a,b) => {
      const statusOrder = { 'pending': 1, 'in-progress': 2, 'done': 3 };
      return statusOrder[a.status || 'pending'] - statusOrder[b.status || 'pending'];
    })
  }

  return {
    schedulesData,
    filteredSchedules: sortedData,
    searchQuery,
    setSearchQuery,
    fetchSchedules: refetch,
    refetch,
    loading: isLoading,
    error,
    setSchedulesData: (data) => {
      // Update the query cache directly
      queryClient.setQueryData(['maintenance-schedules'], data);
    },
    setSortBy
  };
}