"use client";

import useFileUpload from "@/hooks/useFileUpload";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";
import Image from "next/image";
import { showToast } from "@/components/_ui/toast-utils";

export default function FileUploader({
  url = "/upload-endpoint",
  authRequired = true,
  allowedTypes = {
    "image/png": [],
    "image/jpeg": [],
    "application/pdf": [],
    "text/csv": [],
    "video/mp4": [],
    "video/webm": [],
    "video/ogg": [],
    "video/mp3": [],
    "video/wav": [],
    "video/aac": [],
     "video/m4a": [],
    "video/m4v": [],
  },
  fieldName = "files",
  // maxFileSize = 5, // MB  
  maxFiles = 5,
  multiple = true,
  onSuccess, // Callback function on successful upload
  onError, // Callback function on upload error
}) {
  const {
    uploadFile,
    loading,
    progress,
    filePreviews,
    removeFile,
    clearFiles,
    setSelectedFiles,
    selectedFiles,
    validateFiles,
  } = useFileUpload({
    url,
    authRequired,
    allowedTypes: Object.keys(allowedTypes), // Pass only keys as types
    fieldName,
    // maxFileSize,
    maxFiles,
    multiple,
  });

  const [previewImage, setPreviewImage] = useState(null);

  const { getRootProps, getInputProps } = useDropzone({
    accept: allowedTypes, // Fixed accept format
    maxFiles: maxFiles,
    // maxSize: maxFileSize * 1024 * 1024,
    multiple,
    onDrop: (acceptedFiles, rejectedFiles) => {
      let errorMessages = [];

      if (rejectedFiles.length > 0) {
        return showToast(
          "error",
          `You can only upload up to ${maxFiles} files. You selected ${rejectedFiles.length}.`
        );
      }

      if (acceptedFiles.length === 0)
        return showToast("error", "No files selected.");

      const totalFiles = selectedFiles.length + acceptedFiles.length;
      if (totalFiles > maxFiles) {
        errorMessages.push(
          `You can only upload up to ${maxFiles} files. You selected ${totalFiles}.`
        );
        acceptedFiles = acceptedFiles.slice(0, maxFiles - selectedFiles.length);
      }

      // rejectedFiles.forEach(({ file, errors }) => {
      //   errors.forEach((error) => {
      //     if (error.code === "file-too-large") {
      //       errorMessages.push(`${file.name} exceeds ${maxFileSize}MB limit.`);
      //     } else if (error.code === "file-invalid-type") {
      //       errorMessages.push(`${file.name} is not a supported format.`);
      //     }
      //   });
      // });

      // Show all errors in ONE toast
      if (errorMessages.length > 0) {
        showToast("error", errorMessages.join("\n"));
        return;
      }

      // Validate accepted files before adding
      if (validateFiles(acceptedFiles)) {
        setSelectedFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
      }
    },
  });

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      showToast("error", "No files selected.");
      return;
    }

    const { data, error } = await uploadFile();

    if (error) {
      if (onError) onError(error);
    } else {
      if (onSuccess) onSuccess(data);
    }
  };

  return (
    <div className="p-4">
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <input {...getInputProps()} />
        <p className="text-gray-500">
          Drag & drop files here, or click to select
        </p>
      </div>

      {filePreviews.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-4">
          {filePreviews.map(({ url, type, name }, index) => (
            <div key={index} className=" w-20 relative flex flex-col items-center">
              {type === "image" ? (
                <Image
                  src={url}
                  width={100}
                  height={100}
                  alt={name}
                  className="h-24 w-24 object-cover rounded-md border cursor-pointer"
                  onClick={() => setPreviewImage(url)}
                />
              ) : (
                <div className="h-16 w-16 flex items-center justify-center bg-gray-200 rounded-md">
                  <span className="text-gray-700">{name.split(".").pop()}</span>
                </div>
              )}
              <button
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <Button
          onClick={handleUpload}
          disabled={loading || selectedFiles.length === 0}
        >
          {loading ? "Uploading..." : "Upload Files"}
        </Button>
        {selectedFiles.length > 0 && (
          <Button onClick={clearFiles} variant="outline">
            Clear All
          </Button>
        )}
      </div>

      {progress > 0 && (
        <p className="text-gray-500 mt-2">Progress: {progress}%</p>
      )}

      {previewImage && (
        <Dialog
          open={!!previewImage}
          onOpenChange={() => setPreviewImage(null)}
        >
          <DialogContent>
            <DialogTitle>Preview</DialogTitle>
            <DialogDescription>Preview of the file</DialogDescription>
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-auto rounded-lg object-contain"
            />
            <DialogClose />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
