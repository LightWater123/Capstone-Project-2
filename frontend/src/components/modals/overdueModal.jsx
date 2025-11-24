import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function OverdueModal({ 
  maintenanceJob, 
  onClose, 
  onUpdateMaintenance, 
  onCancelMaintenance 
}) {
  const [loading, setLoading] = useState(false);

  const handleUpdateMaintenance = async () => {
    setLoading(true);
    try {
      // Call the API to update maintenance via email
      await onUpdateMaintenance(maintenanceJob);
      onClose();
    } catch (error) {
      console.error("Failed to update maintenance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMaintenance = async () => {
    setLoading(true);
    try {
      // Call the API to cancel maintenance
      await onCancelMaintenance(maintenanceJob);
      onClose();
    } catch (error) {
      console.error("Failed to cancel maintenance:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!maintenanceJob) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold">Equipment Overdue</h2>
        <p className="text-gray-600">
          Equipment <span className="font-medium">{maintenanceJob.asset_name}</span> is overdue for maintenance.
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="text-sm text-yellow-800">
            This equipment is asking for a followup. Please select an action:
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleUpdateMaintenance}
            disabled={loading}
            className="bg-blue-900 hover:bg-blue-950 text-white"
          >
            {loading ? "Sending..." : "Update service maintenance via email"}
          </Button>
          
          <Button 
            onClick={handleCancelMaintenance}
            disabled={loading}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            {loading ? "Canceling..." : "Cancel maintenance"}
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={loading}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}