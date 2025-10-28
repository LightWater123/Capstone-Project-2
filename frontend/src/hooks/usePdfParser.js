// usePdfParser.js
import axios from "../api/api";

export async function parsePdf(pdfFile, category) {
  const formData = new FormData();
  formData.append("pdf", pdfFile);
  formData.append("mode", category);

  try {
    const res = await axios.post("/api/parse-pdf", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    // The backend might return { data: [...] } or just [...]
    // We'll handle both cases.
    return res.data.data || res.data || [];

  } catch (err) {
    console.error("PDF parse failed:", err);
    
    // Check for a custom error message from the backend
    if (err.response && err.response.data && err.response.data.error) {
      // Throw a new error with the backend's message
      throw new Error(err.response.data.error);
    }
    
    // If it's a network error or something else, throw a generic error
    throw new Error("Failed to parse PDF. The file might be corrupted or the server is unavailable.");
  }
}