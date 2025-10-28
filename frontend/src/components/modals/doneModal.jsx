// src/components/modals/DoneModal.jsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DoneModal({ jobId, onClose, onSubmit }) {
  const [form, setForm] = useState({
    remarks: "",
    admin_email: "",
    pickup_date: "",
    pickup_place: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    await onSubmit(jobId, form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold">Complete maintenance</h2>

        <div>
          <Label>Remarks</Label>
          <Input
            name="remarks"
            value={form.remarks}
            onChange={handleChange}
            placeholder="Brief description of work done"
          />
        </div>

    
        
          
        

        <div>
          <Label>Pickup date & time</Label>
          <Input
            type="datetime-local"
            name="pickup_date"
            value={form.pickup_date}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label>Pickup place</Label>
          <Input
            name="pickup_place"
            value={form.pickup_place}
            onChange={handleChange}
            placeholder="e.g. Building-A lobby"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}