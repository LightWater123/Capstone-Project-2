  import { useQuery, useQueryClient } from "@tanstack/react-query";
  import axios from "../api/api";
  import { useMemo, useState } from "react";

  export function useServiceInventory() {
    const queryClient = useQueryClient();
    const [maintId, setMaintId] = useState(undefined);

    // ➊  search / sort state
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch inventory maintenance items using TanStack Query with 10-second refetch interval
    const { data: maintenanceItems = [], refetch: refetchMaintenance } = useQuery(
      {
        queryKey: ["service-inventory", "maintenance"],
        queryFn: async () => {
          try {
            const res = await axios.get("/api/service/inventory");
            return res.data;
          } catch (err) {
            console.error("Maintenance items fetch failed:", err);
            return [];
          }
        },
        refetchOnMount: "always",
        refetchInterval: 10000, // 10 seconds refetch interval
        refetchIntervalInBackground: false,
      }
    );

    // Fetch overdue items using TanStack Query with 10-second refetch interval
    const { data: overdueItems = [], refetch: refetchOverdue } = useQuery(
      {
        queryKey: ["service-inventory", "overdue"],
        queryFn: async () => {
          try {
            // Fetch items with overdue status OR overdue condition
            const [statusOverdue, conditionOverdue] = await Promise.all([
              axios.get("/api/service/inventory?status=overdue"),
              axios.get("/api/service/inventory?condition=overdue")
            ]);
            
            // Combine results and remove duplicates
            const statusItems = statusOverdue.data || [];
            const conditionItems = conditionOverdue.data || [];
            const allItems = [...statusItems, ...conditionItems];
            
            // Remove duplicates based on id
            const uniqueItems = allItems.filter((item, index, self) =>
              index === self.findIndex((t) => t.id === item.id)
            );
            
            return uniqueItems;
          } catch (err) {
            console.error("Overdue items fetch failed:", err);
            return [];
          }
        },
        refetchOnMount: "always",
        refetchInterval: 10000, // 10 seconds refetch interval
        refetchIntervalInBackground: false,
      }
    );

    // Fetch archived items using TanStack Query with 10-second refetch interval
    const { data: archivedItems = [], refetch: refetchArchived } = useQuery({
      queryKey: ["service-inventory", "archive"],
      queryFn: async () => {
        try {
          const res = await axios.get("/api/my-messages?status=done");
          return res.data;
        } catch (err) {
          console.error("Archived items fetch failed:", err);
          return [];
        }
      },
      refetchOnMount: "always",
      refetchInterval: 10000, // 10 seconds refetch interval
      refetchIntervalInBackground: false,
    });

    // Fetch maintenance details for a specific item
    const { data: maintenanceDetails = [] } = useQuery({
      queryKey: ["service-inventory", "details", maintId ?? "default"],
      queryFn: async ({ queryKey }) => {
        try {
          const id = queryKey[2]; // Extract ID from queryKey
          if (!id) return null;

          const res = await axios.get(`/api/service/inventory/${id}/maintenance`);
          return res.data;
        } catch (err) {
          console.error("Maintenance details fetch failed:", err);
          return null;
        }
      },
      staleTime: Infinity,
      enabled: !!maintId, // Only fetch when manually enabled
    });

    // Update maintenance status
    const updateStatus = async (jobId, newStatus) => {
      try {
        await axios.patch(`/api/maintenance-jobs/${jobId}/status`, {
          status: newStatus,
        });

        // Update cache for maintenance items
        queryClient.setQueryData(["service-inventory", "maintenance"], (prev) =>
          prev.map((item) =>
            item.id === jobId ? { ...item, status: newStatus } : item
          )
        );

        // Update cache for overdue items
        if (newStatus === 'overdue') {
          queryClient.setQueryData(["service-inventory", "overdue"], (prev) => {
            const existingItem = prev.find(item => item.id === jobId);
            if (existingItem) {
              return prev.map(item =>
                item.id === jobId ? { ...item, status: newStatus } : item
              );
            } else {
              // Add to overdue if not already there
              const maintenanceItem = queryClient.getQueryData(["service-inventory", "maintenance"])?.find(item => item.id === jobId);
              return maintenanceItem ? [...prev, { ...maintenanceItem, status: newStatus }] : prev;
            }
          });
        } else {
          // Remove from overdue if status changes from overdue
          queryClient.setQueryData(["service-inventory", "overdue"], (prev) =>
            prev.filter(item => item.id !== jobId)
          );
        }

        // Update cache for archived items
        queryClient.setQueryData(["service-inventory", "archive"], (prev) =>
          prev.map((item) =>
            item.job?.id === jobId
              ? { ...item, job: { ...item.job, status: newStatus } }
              : item
          )
        );

        // Invalidate queries to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ["service-inventory", "maintenance"] });
        queryClient.invalidateQueries({ queryKey: ["service-inventory", "overdue"] });
        queryClient.invalidateQueries({ queryKey: ["service-inventory", "archive"] });

        return true;
      } catch (err) {
        console.error("Status update failed:", err);
        return false;
      }
    };

    // Update maintenance condition
    const updateCondition = async (jobId, newCondition) => {
      try {
        await axios.patch(`/api/maintenance-jobs/${jobId}/condition`, {
          condition: newCondition,
        });

        // Update cache for maintenance items
        queryClient.setQueryData(["service-inventory", "maintenance"], (prev) =>
          prev.map((item) =>
            item.id === jobId ? { ...item, condition: newCondition } : item
          )
        );

        // Update cache for overdue items if condition is overdue
        if (newCondition === 'overdue') {
          queryClient.setQueryData(["service-inventory", "overdue"], (prev) => {
            const existingItem = prev.find(item => item.id === jobId);
            if (existingItem) {
              return prev.map(item =>
                item.id === jobId ? { ...item, condition: newCondition } : item
              );
            } else {
              // Add to overdue if not already there
              const maintenanceItem = queryClient.getQueryData(["service-inventory", "maintenance"])?.find(item => item.id === jobId);
              return maintenanceItem ? [...prev, { ...maintenanceItem, condition: newCondition }] : prev;
            }
          });
        } else {
          // Remove from overdue if condition changes from overdue
          queryClient.setQueryData(["service-inventory", "overdue"], (prev) =>
            prev.filter(item => item.id !== jobId)
          );
        }

        // Invalidate queries to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ["service-inventory", "maintenance"] });
        queryClient.invalidateQueries({ queryKey: ["service-inventory", "overdue"] });
        queryClient.invalidateQueries({ queryKey: ["service-inventory", "archive"] });

        return true;
      } catch (err) {
        console.error("Condition update failed:", err);
        return false;
      }
    };

    // close job and save pickup details
    const submitDoneDetails = async (jobId, payload) => {
      try {
        await axios.put(`/api/maintenance/${jobId}/done-details`, payload);

        // optional: instantly update local cache so UI reflects “done”
        queryClient.setQueryData(["service-inventory", "maintenance"], (prev) =>
          prev.map((item) =>
            item.id === jobId ? { ...item, status: "done", ...payload } : item
          )
        );
        return true;
      } catch (err) {
        console.error("submitDoneDetails failed:", err);
        return false;
      }
    };

    // Enable maintenance details query for specific ID
    const fetchMaintenanceDetails = async (id) => {
      setMaintId(id);
      await queryClient.invalidateQueries({
        queryKey: ["service-inventory", "details", id ?? "default"],
      });
      // console.log("test");

      // await queryClient.setQueryData(["service-inventory", "details", id], null);
    };

    const filteredMaintenanceItems = useMemo(
      () =>
        maintenanceItems.filter((e) =>
          e.asset_name.toString().toLowerCase().includes(searchQuery)
        ) ?? maintenanceItems,
      [maintenanceItems, searchQuery]
    );

    const filteredArchiveItems = useMemo(
      () =>
        archivedItems.filter((e) =>
          e.job?.asset_name.toString().toLowerCase().includes(searchQuery)
        ) ?? archivedItems,
      [archivedItems, searchQuery]
    );

    return {
      maintenanceItems,
      filteredMaintenanceItems,
      archivedItems,
      filteredArchiveItems,
      overdueItems,
      maintenanceDetails,
      refetchMaintenance,
      refetchArchived,
      refetchOverdue,
      updateStatus,
      updateCondition,
      fetchMaintenanceDetails,
      setSearchQuery,
      submitDoneDetails,
    };
  }
