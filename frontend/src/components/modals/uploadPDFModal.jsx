"use client";
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
}) {
  if (!isOpen) return null;

  const maxSize = 100 * 1024 * 1024; //100 mb upload
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
  ] = useFileUpload({ maxSize, accept: "application/pdf" });

  const file = files[0];

  React.useEffect(() => {
    setPdfFile(file?.file ?? null);
  }, [file, setPdfFile]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
        <h2 className="text-lg font-bold text-gray-500 mb-4 border-b pb-3">
          Upload PDF
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-600">
            Select PDF File
          </label>

          {/* drag-and-drop */}
          <div
            role="button"
            onClick={openFileDialog}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            data-dragging={isDragging || undefined}
            className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-input p-4 transition-colors hover:bg-accent/50 data-[dragging=true]:bg-accent/50"
          >
            <input
              {...getInputProps()}
              className="sr-only"
              aria-label="Upload PDF"
              disabled={Boolean(file)}
            />
            <div className="flex flex-col items-center justify-center text-center">
              <div
                className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border bg-background"
                aria-hidden="true"
              >
                <UploadIcon className="size-4 opacity-60" />
              </div>
              <p className="mb-1.5 text-sm font-medium">Upload file</p>
              <p className="text-xs text-muted-foreground">
                Drag & drop or click to browse (max. {formatBytes(maxSize)})
              </p>
            </div>
          </div>

          {errors.length > 0 && (
            <div
              className="flex items-center gap-1 text-xs text-destructive"
              role="alert"
            >
              <AlertCircleIcon className="size-3 shrink-0" />
              <span>{errors[0]}</span>
            </div>
          )}

          {/* selected file */}
          {file && (
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
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.file.size)}
                  </p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="-me-2 size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
                onClick={() => removeFile(file.id)}
                aria-label="Remove file"
              >
                <XIcon className="size-4" aria-hidden="true" />
              </Button>
            </div>
          )}

          {/* buttons */}
          <div className="flex justify-end gap-4 pt-2">
            <Button
              type="submit"
              variant="ghost"
              disabled={!file}
              className="relative inline-flex items-center text-sm font-medium px-3 py-1 bg-transparent border-none text-blue-900 hover:text-blue-950
                after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px]
                after:h-[3px] after:w-0 after:bg-blue-950 after:rounded-full after:-translate-x-1/2
                after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
            >
              Upload/Parse PDF
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
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
