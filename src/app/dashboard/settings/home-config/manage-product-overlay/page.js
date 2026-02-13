"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";

import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import FileUploader from "@/components/comman/FileUploader";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DEFAULT_OVERLAY = {
  id: null,
  title: "",
  mrp: "",
  salePrice: "",
  link: "",
  mediaUrl: "",
};

export default function ManageProductOverlay() {
  const { request } = useAxios();
  const [overlays, setOverlays] = useState([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState({ ...DEFAULT_OVERLAY });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const allowedMedia = useMemo(
    () => ({
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
      "image/svg+xml": [],
    }),
    []
  );

  const fetchOverlayGrid = async () => {
    try {
      setIsLoadingInitial(true);
      const { data, error } = await request({
        method: "GET",
        url: "/admin/get-overlay-grid",
        authRequired: true,
      });

      if (error) {
        showToast("error", error || "Failed to fetch overlays.");
        setOverlays([]);
        return;
      }

      const raw = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.data?.data)
        ? data.data.data
        : [];
      const items = raw;

      if (!items.length) {
        setOverlays([]);
        return;
      }

      const formattedOverlays = items.map((item) => ({
        id: item.id,
        title: item.title || "",
        mrp: item.mrp ?? "",
        salePrice: item.sale_price ?? "",
        link: item.product_redirect_url || "",
        mediaUrl: item.product_image || "",
      }));

      setOverlays(formattedOverlays);
    } catch (err) {
      console.error("Failed to fetch overlay grid:", err);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  useEffect(() => {
    fetchOverlayGrid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateActiveOverlay = (field, value) =>
    setActiveOverlay((prev) => ({
      ...prev,
      [field]: value,
    }));

  const handleUploadSuccess = (response) => {
    const payload = response?.data;
    const uploaded =
      payload?.uploaded ||
      payload?.files ||
      payload?.data ||
      (payload?.url ? [payload] : []);

    const mediaUrl =
      Array.isArray(uploaded) && uploaded.length > 0
        ? uploaded[0]?.url ||
          uploaded[0]?.location ||
          uploaded[0]?.path ||
          uploaded[0]?.image_url
        : typeof uploaded === "string"
        ? uploaded
        : "";

    if (!mediaUrl) {
      showToast("error", "Upload succeeded but no URL returned from server.");
      return;
    }

    updateActiveOverlay("mediaUrl", mediaUrl);
    showToast("success", "Overlay media uploaded.");
  };

  const handleSaveOverlay = async (event) => {
    event?.preventDefault?.();
    if (!activeOverlay.title.trim() || !activeOverlay.link.trim() || !activeOverlay.mediaUrl) {
      showToast("error", "Title, link, and image are required.");
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        title: activeOverlay.title,
        mrp: activeOverlay.mrp,
        sale_price: activeOverlay.salePrice,
        product_image: activeOverlay.mediaUrl,
        product_redirect_url: activeOverlay.link,
      };
      if (activeOverlay.id) payload.id = activeOverlay.id;

      const { error } = await request({
        method: "POST",
        url: "/admin/create-overlay-grid",
        payload,
        authRequired: true,
      });

      if (error) {
        showToast("error", error || "Failed to save overlay.");
        return;
      }

      showToast("success", "Overlay saved successfully.");
      setIsDialogOpen(false);
      setActiveOverlay({ ...DEFAULT_OVERLAY });
      await fetchOverlayGrid();
    } finally {
      setIsSaving(false);
    }
  };

  const openAddDialog = () => {
    setActiveOverlay({ ...DEFAULT_OVERLAY });
    setIsDialogOpen(true);
  };

  const openEditDialog = (overlay) => {
    setActiveOverlay({ ...overlay });
    setIsDialogOpen(true);
  };

  const handleDeleteOverlay = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const { error } = await request({
        method: "DELETE",
        url: `/admin/delete-overlay-grid?id=${deleteTarget.id}`,
        authRequired: true,
      });
      if (error) {
        showToast("error", error || "Failed to delete overlay.");
        return;
      }
      showToast("success", "Overlay deleted successfully.");
      setDeleteTarget(null);
      await fetchOverlayGrid();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb />
      <div className="mt-4">
        <h1 className="text-3xl font-bold">Product Overlay</h1>
        <p className="text-muted-foreground">
          Manage the promotional overlay that sits just below the top banner.
        </p>
      </div>

      {isLoadingInitial ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">Loading overlay data...</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 p-6 bg-white space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Overlay Items</h2>
              <p className="text-sm text-muted-foreground">
                You can create up to 3 overlay items. Edit or remove anytime.
              </p>
            </div>
            <Button
              type="button"
              onClick={openAddDialog}
              disabled={overlays.length >= 3}
            >
              Add Overlay
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Live Overlays</h2>
        {overlays.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
            No overlay configured yet. Click “Add Overlay” to create one.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {overlays.map((overlay) => (
              <div
                key={overlay.id}
                className="rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold">{overlay.title}</p>
                    <p className="text-xs text-muted-foreground">
                      MRP: {overlay.mrp || "-"} | Sale:{" "}
                      {overlay.salePrice || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {overlay.link || "No link set"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => openEditDialog(overlay)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      type="button"
                      onClick={() => setDeleteTarget(overlay)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {overlay.mediaUrl && (
                  <div className="mt-3 relative h-32 w-full overflow-hidden rounded-md">
                    <Image
                      src={overlay.mediaUrl}
                      alt={overlay.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <a
                  href={overlay.link || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block text-sm text-blue-600 break-all"
                >
                  {overlay.link || "No link"}
                </a>

              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {activeOverlay.id ? "Edit Overlay" : "Add Overlay"}
            </DialogTitle>
            <DialogDescription>
              Title, link, and image are required for each overlay.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveOverlay} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                placeholder="Overlay title"
                value={activeOverlay.title}
                onChange={(e) => updateActiveOverlay("title", e.target.value)}
              />
              <Input
                placeholder="MRP"
                type="number"
                value={activeOverlay.mrp}
                onChange={(e) => updateActiveOverlay("mrp", e.target.value)}
              />
              <Input
                placeholder="Sale price"
                type="number"
                value={activeOverlay.salePrice}
                onChange={(e) => updateActiveOverlay("salePrice", e.target.value)}
              />
            </div>

            <Input
              placeholder="Product redirect URL"
              value={activeOverlay.link}
              onChange={(e) => updateActiveOverlay("link", e.target.value)}
            />

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Overlay Art / Image
              </p>
              <FileUploader
                url="/admin/upload-banners"
                fieldName="banners"
                maxFiles={1}
                multiple={false}
                allowedTypes={allowedMedia}
                onSuccess={(res) => handleUploadSuccess(res)}
                onError={() =>
                  showToast("error", "Failed to upload overlay media.")
                }
              />
              {activeOverlay.mediaUrl && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border p-3 bg-white">
                  <div className="relative h-20 w-32 overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={activeOverlay.mediaUrl}
                      alt="Overlay preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Current preview
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-xs">
                      {activeOverlay.mediaUrl}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Overlay"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete overlay?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the overlay from the home page. You can add it
              again later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteOverlay}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
