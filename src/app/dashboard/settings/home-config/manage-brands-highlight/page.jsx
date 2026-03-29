"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import useAxios from "@/hooks/useAxios";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/_ui/toast-utils";
import FileUploader from "@/components/comman/FileUploader";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2 } from "lucide-react";

export default function ManageBrandsHighlightPage() {
  const { request } = useAxios();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [allBrands, setAllBrands] = useState([]);
  const [brandSearch, setBrandSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    brand_name: "",
    display_label: "",
    image_url: "",
    link_url: "",
    sort_order: 0,
    active: true,
  });

  const allowedImages = useMemo(
    () => ({
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
    }),
    []
  );

  useEffect(() => {
    document.title = "Brands highlight";
  }, []);

  useEffect(() => {
    loadItems();
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/users/get-all-brands",
      });
      if (!error && data?.success) {
        setAllBrands((data?.data || []).map((b) => b.brand_name).filter(Boolean));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/brand-highlights",
        authRequired: true,
      });
      if (error) {
        showToast("error", "Failed to load highlights");
        return;
      }
      setItems(data?.data?.items || []);
    } finally {
      setLoading(false);
    }
  };

  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return [];
    const term = brandSearch.toLowerCase();
    return allBrands.filter((b) => b.toLowerCase().includes(term)).slice(0, 12);
  }, [allBrands, brandSearch]);

  const resetForm = () => {
    setEditingId(null);
    setBrandSearch("");
    setForm({
      brand_name: "",
      display_label: "",
      image_url: "",
      link_url: "",
      sort_order: 0,
      active: true,
    });
  };

  const handleUpload = (response) => {
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
      showToast("error", "Upload succeeded but no URL returned.");
      return;
    }
    setForm((f) => ({ ...f, image_url: mediaUrl }));
    showToast("success", "Image uploaded");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.brand_name.trim() || !form.image_url.trim()) {
      showToast("error", "Brand and image are required.");
      return;
    }
    const payload = {
      brand_name: form.brand_name.trim(),
      display_label: form.display_label.trim() || null,
      image_url: form.image_url.trim(),
      link_url: form.link_url.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      active: !!form.active,
    };
    if (editingId) {
      const { data, error } = await request({
        method: "PATCH",
        url: `/admin/brand-highlights/${editingId}`,
        payload,
        authRequired: true,
      });
      if (error || data?.success === false) {
        showToast("error", data?.message || error || "Update failed");
        return;
      }
      showToast("success", "Updated");
    } else {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/brand-highlights",
        payload,
        authRequired: true,
      });
      if (error || data?.success === false) {
        showToast("error", data?.message || error || "Create failed");
        return;
      }
      showToast("success", "Added");
    }
    resetForm();
    loadItems();
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm({
      brand_name: row.brand_name || "",
      display_label: row.display_label || "",
      image_url: row.image_url || "",
      link_url: row.link_url || "",
      sort_order: row.sort_order ?? 0,
      active: !!row.active,
    });
    setBrandSearch(row.brand_name || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const { error } = await request({
      method: "DELETE",
      url: `/admin/brand-highlights/${id}`,
      authRequired: true,
    });
    if (error) {
      showToast("error", "Delete failed");
      return;
    }
    showToast("success", "Removed");
    if (editingId === id) resetForm();
    loadItems();
  };

  return (
    <div className="p-6 space-y-8">
      <CustomBreadcrumb tail="Brands highlight" />

      <div>
        <h1 className="text-2xl font-bold">Brands highlight</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Pick a catalog brand, upload a portrait image, and it appears on the
          homepage in a &quot;Brands of the moment&quot; row. Optional label
          overrides the name on the card; optional link overrides the default
          shop filter URL.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold">
          {editingId ? "Edit highlight" : "Add highlight"}
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Brand</Label>
            <Input
              value={brandSearch}
              onChange={(e) => {
                const v = e.target.value;
                setBrandSearch(v);
                setForm((f) => ({ ...f, brand_name: v }));
              }}
              placeholder="Search brand name…"
              disabled={!!editingId}
            />
            {!editingId && filteredBrands.length > 0 && (
              <div className="flex flex-wrap gap-2 rounded-md border border-gray-100 bg-gray-50 p-2">
                {filteredBrands.map((b) => (
                  <button
                    key={b}
                    type="button"
                    className="rounded-full bg-white px-3 py-1 text-xs border hover:bg-gray-100"
                    onClick={() => {
                      setBrandSearch(b);
                      setForm((f) => ({ ...f, brand_name: b }));
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Card label (optional)</Label>
            <Input
              value={form.display_label}
              onChange={(e) =>
                setForm((f) => ({ ...f, display_label: e.target.value }))
              }
              placeholder="e.g. Dolce&Gabbana"
            />
          </div>

          <div className="space-y-2">
            <Label>Sort order</Label>
            <Input
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm((f) => ({ ...f, sort_order: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Custom link (optional)</Label>
            <Input
              value={form.link_url}
              onChange={(e) =>
                setForm((f) => ({ ...f, link_url: e.target.value }))
              }
              placeholder="Leave empty to use /shop?brand=…"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Image</Label>
            <FileUploader
              url="/admin/upload-banners"
              fieldName="banners"
              maxFiles={1}
              multiple={false}
              allowedTypes={allowedImages}
              onSuccess={handleUpload}
              onError={() => showToast("error", "Upload failed")}
            />
            {form.image_url ? (
              <div className="relative mt-2 h-40 w-full max-w-xs overflow-hidden rounded-lg border bg-gray-100">
                <Image
                  src={form.image_url}
                  alt="Preview"
                  fill
                  className="object-cover object-top"
                  unoptimized
                />
              </div>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm((f) => ({ ...f, active: e.target.checked }))
              }
            />
            Active on site
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={loading}>
            {editingId ? "Save changes" : "Add highlight"}
          </Button>
          {editingId ? (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel edit
            </Button>
          ) : null}
        </div>
      </form>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Current highlights</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.brand_name}</TableCell>
                <TableCell>{row.display_label || "—"}</TableCell>
                <TableCell>{row.sort_order ?? 0}</TableCell>
                <TableCell>{row.active ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(row)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" size="sm" variant="destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove highlight?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Removes this tile from the homepage and deletes the
                          image from storage when hosted on Cloudinary.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => handleDelete(row.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  No highlights yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
