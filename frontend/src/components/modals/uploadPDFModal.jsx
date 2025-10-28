// src/components/UploadPDFModal.jsx
import React from 'react';

export default function UploadPDFModal({
  isOpen,
  onClose,
  onSubmit,
  setPdfFile,
  category,
  isParsing,
  parseError
}) {
  if (!isOpen) return null;

  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
    // Note: parseError is cleared in the parent component's handlePdfUpload
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg border border-blue-400">
        <h2 className="text-lg font-bold text-blue-700 mb-4">Upload PDF ({category?.toUpperCase()})</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-2">
              Select PDF File
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-black rounded bg-blue-100 text-black"
              required
              disabled={isParsing}
            />
          </div>

          {/* --- FEEDBACK AREA --- */}
          {isParsing && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700 flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Validating and parsing PDF...
            </div>
          )}

          {parseError && !isParsing && (
             <div className="p-3 bg-red-50 border border-red-300 rounded text-sm text-red-700">
              <strong>Error:</strong> {parseError}
            </div>
          )}
          
          <div className="flex justify-end gap-4 pt-2">
            <button
              type="submit"
              disabled={isParsing}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {isParsing ? "Processing..." : "Upload and Parse"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isParsing}
              className="text-red-400 hover:underline disabled:text-red-200 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}