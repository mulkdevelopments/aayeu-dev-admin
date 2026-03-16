"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import FileUploader from "@/components/comman/FileUploader";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";
import { useRouter } from "next/navigation";

const allowedMedia = {
  "image/png": [],
  "image/jpeg": [],
  "image/webp": [],
  "image/gif": [],
};

export default function ManageHeroSection() {
  const { request } = useAxios();
  const router = useRouter();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "",
    redirect_url: "/shop",
    collection_slug: "",
    sort_order: 0,
    is_active: true,
  });
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchSlides = async () => {
      try {
        setLoading(true);
        const { data, error } = await request({
          method: "GET",
          url: "/admin/hero-slides",
          authRequired: true,
        });
        if (cancelled) return;
        if (error) {
          showToast("error", error || "Failed to load hero slides");
          return;
        }
        const list = data?.data ?? data ?? [];
        setSlides(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          showToast("error", "Failed to load hero slides");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSlides();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch once on mount
  }, []);

  const handleUploadSuccess = (response) => {
    const payload = response?.data;
    const uploaded =
      payload?.uploaded ||
      payload?.files ||
      payload?.data ||
      (payload?.url ? [payload] : []);
    const items = (Array.isArray(uploaded) ? uploaded : [uploaded])
      .map((f) => f?.url || f?.secure_url || (typeof f === "string" ? f : ""))
      .filter(Boolean);
    if (items.length) {
      setUploadedImageUrl(items[0]);
      setForm((prev) => ({ ...prev, image_url: items[0] }));
      showToast("success", "Image uploaded");
    } else {
      showToast("error", "No image URL returned");
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      image_url: "",
      redirect_url: "/shop",
      collection_slug: "",
      sort_order: slides.length,
      is_active: true,
    });
    setUploadedImageUrl(null);
    setEditingId(null);
  };

  const handleEdit = (slide) => {
    setEditingId(slide.id);
    setForm({
      title: slide.title || "",
      description: slide.description || "",
      image_url: slide.image_url || "",
      redirect_url: slide.redirect_url || "/shop",
      collection_slug: slide.collection_slug || "",
      sort_order: slide.sort_order ?? 0,
      is_active: slide.is_active !== false,
    });
    setUploadedImageUrl(slide.image_url || null);
  };

  const handleSave = async () => {
    const title = (form.title || "").trim();
    if (!title) {
      showToast("error", "Title is required");
      return;
    }
    const slugRaw = (form.collection_slug || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const payload = {
      title,
      description: (form.description || "").trim() || null,
      image_url: (form.image_url || "").trim() || null,
      redirect_url: (form.redirect_url || "").trim() || "/shop",
      collection_slug: slugRaw || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: !!form.is_active,
    };

    try {
      setSaving(true);
      if (editingId) {
        const { data, error } = await request({
          method: "PUT",
          url: `/admin/hero-slides/${editingId}`,
          payload,
          authRequired: true,
        });
        if (error) {
          showToast("error", error || "Failed to update slide");
          return;
        }
        setSlides((prev) =>
          prev.map((s) => (s.id === editingId ? (data?.data ?? data ?? s) : s))
        );
        showToast("success", "Slide updated");
      } else {
        const { data, error } = await request({
          method: "POST",
          url: "/admin/hero-slides",
          payload,
          authRequired: true,
        });
        if (error) {
          showToast("error", error || "Failed to create slide");
          return;
        }
        const newSlide = data?.data ?? data;
        if (newSlide) setSlides((prev) => [...prev, newSlide].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
        showToast("success", "Slide added");
      }
      resetForm();
    } catch (err) {
      console.error(err);
      showToast("error", "Request failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this hero slide?")) return;
    try {
      setSaving(true);
      const { error } = await request({
        method: "DELETE",
        url: `/admin/hero-slides/${id}`,
        authRequired: true,
      });
      if (error) {
        showToast("error", error || "Failed to delete");
        return;
      }
      setSlides((prev) => prev.filter((s) => s.id !== id));
      if (editingId === id) resetForm();
      showToast("success", "Slide removed");
    } catch (err) {
      console.error(err);
      showToast("error", "Request failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb />
      <div>
        <h1 className="text-3xl font-bold mt-4 mb-2">Manage Hero Section</h1>
        <p className="text-sm text-muted-foreground">
          Control the homepage hero carousel: title, description, image, and Shop Now link. Slides rotate automatically on the site.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">
          {editingId ? "Edit slide" : "Add new slide"}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Title</label>
            <Input
              placeholder="e.g. Pick Your Essentials"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Redirect URL</label>
            <Input
              placeholder="/shop"
              value={form.redirect_url}
              onChange={(e) => setForm((prev) => ({ ...prev, redirect_url: e.target.value }))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Collection slug (curated Shop Now)</label>
            <Input
              placeholder="e.g. timeless-modern-wardrobe — when set, Shop Now shows hand-picked products"
              value={form.collection_slug}
              onChange={(e) => setForm((prev) => ({ ...prev, collection_slug: e.target.value }))}
            />
            <p className="text-xs text-gray-500">Use letters, numbers, hyphens only. Then use &quot;Manage products&quot; below to pick 20+ products.</p>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Description</label>
          <Textarea
            placeholder="Short description for the hero block"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            className="min-h-[80px]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Image</label>
          <FileUploader
            url="/admin/upload-hero-images"
            fieldName="images"
            maxFiles={1}
            multiple={false}
            allowedTypes={allowedMedia}
            onSuccess={handleUploadSuccess}
            onError={(err) => showToast("error", err?.message || "Upload failed")}
          />
          {(uploadedImageUrl || form.image_url) && (
            <div className="relative h-40 w-64 rounded-lg overflow-hidden border bg-gray-100 mt-2">
              <Image
                src={uploadedImageUrl || form.image_url}
                alt="Hero preview"
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hero-active"
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="hero-active" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Order</label>
            <Input
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) => setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) || 0 }))}
              className="w-20"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
          >
            {saving ? "Saving..." : editingId ? "Update slide" : "Add slide"}
          </Button>
          {(editingId || form.title || form.image_url) && (
            <Button variant="outline" onClick={resetForm} disabled={saving}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 py-4">Loading slides...</p>
      ) : (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Current slides</h2>
          {slides.length === 0 ? (
            <p className="text-sm text-gray-500">No slides yet. Add one above.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {slides.map((slide) => (
                <div
                  key={slide.id}
                  className="rounded-xl border bg-white shadow-sm overflow-hidden"
                >
                  <div className="relative aspect-[3/4] w-full bg-gray-100">
                    {slide.image_url ? (
                      <Image
                        src={slide.image_url}
                        alt={slide.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t space-y-1">
                    <p className="font-medium text-gray-900 truncate">{slide.title}</p>
                    <p className="text-xs text-gray-500 truncate">{slide.description || "—"}</p>
                    <p className="text-xs text-blue-600 truncate">
                      {slide.collection_slug ? `/shop/curated/${slide.collection_slug}` : (slide.redirect_url || "/shop")}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button size="sm" onClick={() => handleEdit(slide)}>
                        Edit
                      </Button>
                      {slide.collection_slug && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => router.push(`/dashboard/settings/home-config/manage-hero-section/${slide.id}/products`)}
                        >
                          Manage products
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(slide.id)}
                        disabled={saving}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
