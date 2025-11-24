import { useState } from "react";
import axios from "../api/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useInventory(category) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date:desc");
  const queryClient = useQueryClient();

  // Fetch inventory using TanStack Query with 10-second refetch interval
  const { data: inventoryData = [], refetch } = useQuery({
    queryKey: ['inventory', category],
    queryFn: async () => {
      try {
        let url = `/api/inventory?category=${category}`
        if(category.toLowerCase() === "due soon"){
          url = '/api/maintenance/inventory/due-soon';
        }
        const res = await axios.get(url);
        return res.data;
      } catch (err) {
        console.error("Inventory fetch failed:", err);
        return [];
      }
    },
    refetchInterval: 10000, // 10 seconds refetch interval
    refetchIntervalInBackground: false,
  });

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await axios.delete(`/api/inventory/${id}`);
      // Invalidate the query to refetch data
      await queryClient.invalidateQueries({ queryKey: ['inventory', category] });
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // search function
  const filteredData = inventoryData.filter(item => {
    const query = searchQuery.toLowerCase();
    return item.article?.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query);
  });

  // Create a sorted copy to avoid mutating the original array
  const sortedData = [...filteredData];
  
  if(sortBy === "name:asc") {
    sortedData.sort((a,b) => {
      const aItem = a.article?.toLowerCase().trim() || "";
      const bItem = b.article?.toLowerCase().trim() || "";
      if(aItem < bItem) return -1
      if(aItem > bItem) return 1
      return 0
    })
  } else if (sortBy === "name:desc") {
    sortedData.sort((a,b) => {
      const aItem = a.article?.toLowerCase().trim() || "";
      const bItem = b.article?.toLowerCase().trim() || "";
      if(aItem < bItem) return 1
      if(aItem > bItem) return -1
      return 0
    })
  } else if(sortBy === "date:asc") {
    sortedData.sort((a,b) => (a.created_at ? new Date(a.created_at).getTime() : 0) - (b.created_at ? new Date(b.created_at).getTime() : 0))
  } else if (sortBy === "date:desc") {
    sortedData.sort((a,b) => (b.created_at ? new Date(b.created_at).getTime() : 0) - (a.created_at ? new Date(a.created_at).getTime() : 0))

  }

  return {
    inventoryData,
    filteredData: sortedData,
    searchQuery,
    setSearchQuery,
    fetchInventory: refetch,
    handleDelete,
    setInventoryData: (data) => {
      // Update the query cache directly
      queryClient.setQueryData(['inventory', category], data);
    },
    setSortBy,
    sortBy
  };
}
