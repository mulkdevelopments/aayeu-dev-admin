"use client";

// components/InvoicePdfModal.jsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function InvoicePdfModal({
  isOpen,
  onClose,
  pdfUrl,
  title = "Invoice Preview",
}) {
  if (!pdfUrl) return null;

  console.log("PDF URL:", pdfUrl);

  // Google Docs Viewer fallback (CORS-safe)
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
    pdfUrl
  )}&embedded=true`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="p-4 border-b bg-white flex flex-row justify-between items-center">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          {/* <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(pdfUrl, "_blank")}
            >
              Download
            </Button>
          </div> */}
        </DialogHeader>

        {/* PDF Viewer */}
        <div className="flex-1 bg-gray-50">
          <iframe
            src={viewerUrl}
            className="w-full h-full border-0"
            title="PDF Invoice Viewer"
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
