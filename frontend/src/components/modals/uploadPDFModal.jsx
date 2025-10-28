// src/components/UploadPDFModal.jsx
import React from "react";
import { Button } from "@/components/ui/button";
import {
  AlertCircleIcon,
  PaperclipIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";

export default function UploadPDFModal({
  isOpen,
  onClose,
  onSubmit,
  setPdfFile,
  category,
  isParsing,
  parseError,
}) {
  if (!isOpen) return null;

  const maxSize = 10 * 1024 * 1024; // 10 MB

  /* -------------------------------------------------
   * useFileUpload does everything: drag, click, validation
   * ------------------------------------------------*/
  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    maxSize,
    accept: "application/pdf",
  });

  /* keep parent state in sync */
  React.useEffect(() => {
    setPdfFile(files[0]?.file ?? null);
  }, [files, setPdfFile]);

  /* derive the file we will render */
  const file = files[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
        <h2 className="text-lg font-bold text-gray-500 mb-4 border-b pb-3">
          Upload PDF ({category?.toUpperCase()})
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          {/*  NEW  –  drag / drop / click area  */}
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-2">
              Select PDF File
            </label>

            <div
              role="button"
              onClick={openFileDialog}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              data-dragging={isDragging || undefined}
              className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-input p-4 transition-colors hover:bg-accent/50 has-disabled:pointer-events-none has-disabled:opacity-50 has-[input:focus]:border-ring has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50 data-[dragging=true]:bg-accent/50"
            >
              <input
                {...getInputProps()}
                className="sr-only"
                aria-label="Upload PDF"
                disabled={Boolean(file) || isParsing}
              />

              <div className="flex flex-col items-center justify-center text-center">
                <div
                  className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border bg-background"
                  aria-hidden="true"
                >
                  <UploadIcon className="size-4 opacity-60" />
                </div>
                <p className="mb-1.5 text-sm font-medium">
                  {file ? "Replace file" : "Upload file"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag & drop or click to browse (max. {formatBytes(maxSize)})
                </p>
              </div>
            </div>

            {/*  error under dropzone  */}
            {errors.length > 0 && (
              <div
                className="flex items-center gap-1 text-xs text-destructive mt-2"
                role="alert"
              >
                <AlertCircleIcon className="size-3 shrink-0" />
                <span>{errors[0]}</span>
              </div>
            )}
          </div>

          {/*  file list (single file)  */}
          {file && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 rounded-xl border px-4 py-2">
                <div className="flex items-center gap-3 overflow-hidden">
                  <PaperclipIcon
                    className="size-4 shrink-0 opacity-60"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">
                      {file.file.name}
                    </p>
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="-me-2 size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
                  onClick={() => removeFile(file.id)}
                  aria-label="Remove file"
                  disabled={isParsing}
                >
                  <XIcon className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}

          {/*  FEEDBACK AREA  */}
          {isParsing && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700 flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-700"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Validating and parsing PDF...
            </div>
          )}

          {parseError && !isParsing && (
            <div className="p-3 bg-red-50 border border-red-300 rounded text-sm text-red-700">
              <strong>Error:</strong> {parseError}
            </div>
          )}

          {/*  ACTION BUTTONS  */}
          <div className="flex justify-end gap-4 pt-2">
            <Button
              type="submit"
              disabled={!file || isParsing}
              variant="ghost"
              className="relative inline-flex items-center text-sm font-medium px-3 py-1 bg-transparent border-none text-blue-900 hover:text-blue-950
                after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px]
                after:h-[3px] after:w-0 after:bg-blue-950 after:rounded-full after:-translate-x-1/2
                after:transition-all after:duration-300 hover:after:w-full focus:outline-none disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {isParsing ? "Processing..." : "Upload and Parse"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isParsing}
              className="relative inline-flex items-center text-sm font-medium px-3 py-1 bg-transparent border-none text-red-800 hover:text-red-900
                after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px]
                after:h-[3px] after:w-0 after:bg-red-900 after:rounded-full after:-translate-x-1/2
                after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
