"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import SectionToggle from "@/components/_ui/sectiontoggle";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";
import FileUploader from "@/components/comman/FileUploader";
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
import { Trash2, Edit3 } from "lucide-react";

export default function ManageSalesByCategory() {
  const { request } = useAxios();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sectionActive, setSectionActive] = useState(false);
  const [sectionData, setSectionData] = useState({});

  const [form, setForm] = useState({
    image_url: "",
    redirect_url: "",
    title: "",
    button_text: "",
  });
  const [isEdit, setIsEdit] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const allowedMedia = useMemo(
    () => ({
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
      "image/gif": [],
    }),
    []
  );

  useEffect(() => {
    fetchSales();
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/section-by-key?key=sale",
      });

      if (error) {
        showToast("error", "Failed to fetch section status");
        return;
      }

      if (data && data.success && data.data) {
        setSectionActive(!!data.data.active);
        setSectionData(data);
      } else {
        showToast("error", "Invalid section status data received");
      }
    } catch (err) {
      console.error("Error fetching status:", err);
      showToast("error", err.message || "Error fetching status");
    }
  };

  const fetchSales = async () => {
    setLoading(true);
    const { data, error } = await request({
      method: "GET",
      url: "/admin/list-sale-by-categories",
      authRequired: true,
    });

    if (!error) {
      const items = data?.data?.items || data?.data || [];
      setSales(Array.isArray(items) ? items : []);
    } else {
      showToast("error", data?.message || "Failed to fetch sales by category");
    }
    setLoading(false);
  };

  const handleToggle = async () => {
    const payload = { ...sectionData, key: "sale", active: !sectionActive };
    const { error } = await request({
      method: "PUT",
      url: "/admin/update-section",
      payload,
      authRequired: true,
    });
    if (!error) setSectionActive((prev) => !prev);
  };

  const resetForm = () => {
    setForm({
      image_url: "",
      redirect_url: "",
      title: "",
      button_text: "",
    });
    setIsEdit(false);
    setActiveId(null);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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
      showToast(
        "error",
        "Upload completed but no media URL was returned by the server."
      );
      return;
    }

    setForm((prev) => ({
      ...prev,
      image_url: mediaUrl,
    }));
    showToast("success", "Banner uploaded successfully.");
  };

  const handleEdit = (sale) => {
    setIsEdit(true);
    setActiveId(sale.id);
    setForm({
      image_url: sale.image_url || "",
      redirect_url: sale.redirect_url || "",
      title: sale.title || "",
      button_text: sale.button_text || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.image_url || !form.redirect_url || !form.title || !form.button_text) {
      showToast("error", "All fields (image, URL, title, button text) are required.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        image_url: form.image_url,
        redirect_url: form.redirect_url,
        title: form.title,
        button_text: form.button_text,
        created_by: 1, // TODO: replace with actual admin id if available
      };

      const endpoint = isEdit
        ? "/admin/update-sale-by-category"
        : "/admin/create-sale-by-category";

      if (isEdit && activeId) {
        payload.saleId = activeId;
      }

      const { data, error } = await request({
        method: isEdit ? "PUT" : "POST",
        url: endpoint,
        payload,
        authRequired: true,
      });

      if (error || data?.success === false) {
        showToast("error", data?.message || error || "Failed to save sale.");
        return;
      }

      showToast(
        "success",
        data?.message ||
          `Sale Banner ${isEdit ? "updated" : "created"} successfully.`
      );

      resetForm();
      await fetchSales();
    } finally {
      setLoading(false);
    }
  };

  const openDelete = (id) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const handleRemove = async () => {
    if (!deleteId) return;

    const { data, error } = await request({
      method: "DELETE",
      url: `/admin/delete-sale-by-category?saleId=${encodeURIComponent(deleteId)}`,
      authRequired: true,
    });

    if (error || data?.success === false) {
      showToast("error", data?.message || error || "Failed to delete sale.");
      return;
    }

    showToast("success", data?.message || "Sale deleted successfully.");
    setSales((prev) => prev.filter((s) => s.id !== deleteId));
    setDeleteId(null);
    setIsDeleteOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb />

      {/* Header + Toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4">
        <div>
          <h1 className="text-2xl font-bold">Sale by Category</h1>
          <p className="text-sm text-muted-foreground">
            Manage promotional banner cards linked to specific collections or categories.
          </p>
        </div>
        {/* <div className="flex items-center gap-3">
          <SectionToggle sectionActive={sectionActive} handleToggle={handleToggle} />
          <span className="text-sm">
            {sectionActive ? "Section Active" : "Section Inactive"}
          </span>
        </div> */}
      </div>

      {/* Form card */}
      <form
        onSubmit={handleSubmit}
        className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Banner media (image)
            </label>
            <FileUploader
              url="/admin/upload-banners"
              fieldName="banners"
              maxFiles={1}
              multiple={false}
              allowedTypes={allowedMedia}
              onSuccess={handleUploadSuccess}
              onError={() =>
                showToast("error", "Failed to upload banner media.")
              }
            />
            {form.image_url && (
              <div className="mt-3 flex items-center gap-3 rounded-xl border p-3 bg-gray-50">
                <div className="relative h-20 w-32 overflow-hidden rounded-lg bg-gray-100">
                  {/\.mp4|\.webm|\.ogg$/i.test(form.image_url) ? (
                    <video
                      src={form.image_url}
                      className="h-full w-full object-cover"
                      controls
                    />
                  ) : (
                    <img
                      src={form.image_url}
                      alt="Sale banner preview"
                      className="h-full w-50 object-cover"
                    />
                  )}
                </div>
                {/* <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    Current media
                  </p>
                  <p className="text-xs text-gray-600 break-all">
                    {form.image_url}
                  </p>
                </div> */}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Redirect URL</label>
            <Input
              placeholder="https://www.aayeu.com/shop/..."
              value={form.redirect_url}
              onChange={(e) => handleChange("redirect_url", e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Title</label>
            <Input
              placeholder="Sale Banner Title"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Button text</label>
            <Input
              placeholder="Button Text"
              value={form.button_text}
              onChange={(e) => handleChange("button_text", e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t mt-4">
          {isEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={loading}
            > 
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : isEdit ? "Update Sale" : "Create Sale"}
          </Button>
        </div>
      </form>

      {/* Cards grid */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">Sale cards</h2>
        {loading && sales.length === 0 ? (
          <p className="text-sm text-gray-500">Loading sales...</p>
        ) : sales.length === 0 ? (
          <p className="text-sm text-gray-500">No sale cards configured yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                {sale.image_url && (
                  <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                    <img
                      src={sale.image_url}
                      alt={sale.title || "Sale"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate">
                      {sale.title || "Untitled banner"}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 break-all">
                      {sale.redirect_url || "No redirect URL set"}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3 border-t">
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                      {sale.button_text || "Shop Now"}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => handleEdit(sale)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => openDelete(sale.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete sale card?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The sale card will be removed from the
              home page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteId(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleRemove}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

