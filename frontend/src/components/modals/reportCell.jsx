import { useState } from "react";
import api from "../../api/api"; // your axios instance

export default function ReportCell({ item, onUpdate }) {
  const [remarks, setRemarks] = useState(item.remarks || "");
  const [uploading, setUploading] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false); // New state for PDF loading

  // save typed note
  const saveText = async (val) => {
    await api.patch(`/api/maintenance/${item.id}/report`, { remarks: val });
    onUpdate?.();
  };

  // upload pdf
  const uploadPdf = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      alert("Please select a PDF file.");
      return;
    }
    setUploading(true);
    const body = new FormData();
    body.append("report_file", file);
    body.append("job_id", item.id);
    try {
      const { data } = await api.post("/api/upload/report", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // save the base-64 string (not the url) to MongoDB
      await api.patch(`/api/maintenance/${item.id}/report`, { report_pdf: data.b64 });
      onUpdate?.();
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // NEW FUNCTION to handle viewing the PDF
  const handleViewPdf = async () => {
    if (!item.id) return;
    
    setLoadingPdf(true);
    try {
      // Use your authenticated API instance to get the PDF
      // The crucial part is `responseType: 'blob'`
      const response = await api.get(`/api/pdf/${item.id}`, {
        responseType: 'blob', // Important!
      });

      // Create a URL from the Blob
      const fileURL = URL.createObjectURL(response.data);
      
      // Open the URL in a new tab
      window.open(fileURL, '_blank');

    } catch (error) {
      console.error("Error fetching PDF:", error);
      alert("Could not load the PDF. You might not have permission.");
    } finally {
      setLoadingPdf(false);
    }
  };

  /* -------- UI -------- */
  return (
    <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
      <textarea
        className="w-full text-xs border rounded p-2 resize-none"
        rows={2}
        placeholder="Type report…"
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        onBlur={(e) => saveText(e.target.value)}
      />

      <label className="cursor-pointer text-xs text-blue-600 hover:underline">
        {uploading ? "Uploading…" : "Attach PDF"}
        <input 
          type="file" 
          accept=".pdf" 
          className="hidden" 
          onChange={uploadPdf} // This now correctly references the function above
        />
      </label>

      <div className="text-xs text-gray-500 mt-1">
        {item.report_pdf ? (
          <span 
            onClick={handleViewPdf}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            {loadingPdf ? "Loading PDF…" : "View PDF"}
          </span>
        ) : remarks ? (
          <span className="italic">{remarks}</span>
        ) : (
          "—"
        )}
      </div>
    </div>
  );
}