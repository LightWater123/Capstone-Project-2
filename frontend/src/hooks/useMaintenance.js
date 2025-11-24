import { useState, useEffect } from "react";
import axios from "../api/api";

export function useMaintenance() {
  const [maintenanceSchedules, setMaintenanceSchedules] = useState([]);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await axios.get("/api/maintenance/schedule");
      setMaintenanceSchedules(res.data);
    } catch (err) {
      console.error("Schedule fetch failed:", err);
      setMaintenanceSchedules([]);
    }
  };

  const fetchOverdue = async () => {
    try {
      const res = await axios.get("/api/maintenance/overdue");
      return res.data.data;
    } catch (err) {
      console.error("Overdue fetch failed:", err);
      return [];
    }
  };

  return {
    maintenanceSchedules,
    fetchSchedules,
    fetchOverdue
  };
}
