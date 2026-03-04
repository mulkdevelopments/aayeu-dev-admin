"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";

import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import FileUploader from "@/components/comman/FileUploader";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";
import { useRouter } from "next/navigation";

const ManageTopBanner = () => {
  const { request } = useAxios();
  const [navLink, setNavLink] = useState("");
  const [savedBanners, setSavedBanners] = useState([]);
  const [draftBanner, setDraftBanner] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const router = useRouter();

  const allowedMedia = useMemo(
    () => ({
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
      "image/gif": [],
      "video/mp4": [],
      "video/webm": [],
      "video/ogg": [],
    }),
    []
  );

  
useEffect(() => {
  const fetchInitialBanner = async () => {
    try {
      setIsLoadingInitial(true);
      const { data, error } = await request({
        method: "GET",
        url: "/admin/get-home-banners",
        authRequired: true,
      });

      if (error || !data?.data) return;

      const topBanner = data.data["top-banner"];
      if (topBanner?.media_url) {
        setDraftBanner({
          id: "top-banner",
          url: topBanner.media_url,
          type: topBanner.media_type === "video" ? "video" : "image",
        });
        setNavLink(topBanner.link_url || "#");
        setIsEditing(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  fetchInitialBanner();
}, []);  


   // useEffect(() => {
  //   const fetchInitialBanner = async () => {
  //     try {
  //       const { data, error } = await request({
  //         method: "GET",
  //         url: "/admin/get-home-banners",
  //         authRequired: true,
  //       });

  //       if (error || !data?.data) {
  //         console.log("No banners found or API error:", error);
  //         return;
  //       }

  //       // ✅ Tumhare response: data.data["top-banner"]
  //       const bannersData = data.data;
  //       const topBanner = bannersData["top-banner"];

  //       if (topBanner && topBanner.media_url) {
  //         setDraftBanner({
  //           id: "top-banner-fixed",
  //           url: topBanner.media_url,
  //           type: topBanner.media_type === "video" ? "video" : "image",
  //         });
  //         setNavLink(topBanner.link_url || "");
  //         setSavedBanners([{
  //           id: "top-banner-fixed",
  //           url: topBanner.media_url,
  //           type: topBanner.media_type === "video" ? "video" : "image",
  //           navLink: topBanner.link_url || "",
  //         }]);
  //         setIsEditing(true);
  //         console.log("✅ Top banner prefilled:", topBanner);
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch banner:", err);
  //     } finally {
  //       setIsLoadingInitial(false);
  //     }
  //   };

  //   fetchInitialBanner();
  // }, [request]);

  const handleUploadSuccess = (response) => {
    const payload = response?.data;
    const uploaded =
      payload?.uploaded ||
      payload?.files ||
      payload?.data ||
      (payload?.url ? [payload] : []);

    const items = (Array.isArray(uploaded) ? uploaded : [uploaded])
      .map((file, index) => {
        const mediaUrl =
          file?.url ||
          file?.location ||
          file?.path ||
          file?.image_url ||
          (typeof file === "string" ? file : "");

        if (!mediaUrl) return null;

        const rawType =
          file?.mimeType || file?.mime || file?.type || file?.contentType || "";
        const isVideo =
          typeof rawType === "string"
            ? rawType.includes("video")
            : /\.(mp4|webm|ogg|mov)$/i.test(mediaUrl);

        return {
          id: `${Date.now()}-${index}`,
          url: mediaUrl,
          type: isVideo ? "video" : "image",
        };
      })
      .filter(Boolean);

    if (!items.length) {
      showToast(
        "error",
        "Upload completed but no media URLs were returned by the server."
      );
      return;
    }

    setDraftBanner(items[0]);
    setIsEditing(false); // New upload = Save mode
    showToast("success", "Banner uploaded successfully");
  };

  const handleRemoveBanner = (id) => {
    setSavedBanners((prev) => prev.filter((item) => item.id !== id));
    if (draftBanner?.id === id) {
      setDraftBanner(null);
      setNavLink("");
      setIsEditing(false);
    }
  };

  const handleEditBanner = (banner) => {
    setDraftBanner(banner);
    setNavLink(banner.navLink || banner.link_url || "");
    setIsEditing(true);
    setEditingBanner(banner);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setDraftBanner(null);
    setNavLink("");
    setIsEditing(false);
    setEditingBanner(null);
  };

  const handleSaveBanner = async () => {
    const trimmedLink = navLink.trim();

    if (!draftBanner?.url) {
      showToast("error", "Upload a banner image or video before saving.");
      return;
    }

    if (!trimmedLink) {
      showToast("error", "Navigation link is required.");
      return;
    }

    try {
      setIsSaving(true);

      const bannerObj = {
        slot: "top-banner",
        media_type: draftBanner.type || "image",
        media_url: draftBanner.url,
        link_url: trimmedLink,
        title: null,
        subtitle: null,
        button_text: null,
        is_active: true,
        sort_order: 1,
      };

      const payload = {
        banners: [bannerObj],
      };

      const { data, error } = await request({
        method: "POST",
        url: "/admin/create-home-banner",
        payload,
        authRequired: true,
      });

      if (data?.message) {
        if (data?.success) showToast("success", data.message);
        else showToast("error", data.message);
        router.push('/dashboard/settings/home-config/');
        return;
      }

      if (error) {
        showToast("error", error || "Failed to save top banner.");
        return;
      }

      // Update UI
      const newItem = {
        ...draftBanner,
        navLink: trimmedLink,
        id: editingBanner?.id || draftBanner.id || `${Date.now()}`,
      };

      setSavedBanners([newItem]); // Single top banner maintain
      setDraftBanner(null);
      setIsEditing(false);
      setEditingBanner(null);
      setNavLink("");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb />
      <div>
        <h1 className="text-3xl font-bold mt-4 mb-2">Manage Top Banner</h1>
        <p className="text-sm text-muted-foreground">
          Upload a hero image or video and attach the navigation link where the
          CTA should redirect.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Navigation Link
          </label>
          <Input
            placeholder="https://example.com/sale"
            value={navLink}
            onChange={(e) => setNavLink(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            This link opens when shoppers tap the banner.
          </p>
        </div>

        <FileUploader
          url="/admin/upload-banners"
          fieldName="banners"
          maxFiles={1}
          multiple={false}
          allowedTypes={allowedMedia}
          onSuccess={handleUploadSuccess}
          onError={(err) => showToast("error", err?.message || "Failed to upload banner.")}
        />

        {isLoadingInitial && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Loading banner...</p>
          </div>
        )}

        {draftBanner && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              {isEditing ? "Current Banner" : "Pending Banner Preview"}
            </p>
            <div className="relative h-40 w-full overflow-hidden rounded-lg bg-gray-200">
              {draftBanner.type === "video" ? (
                <video
                  controls
                  className="h-full w-full object-cover"
                  src={draftBanner.url}
                />
              ) : (
                <Image
                  src={draftBanner.url}
                  alt="Banner preview"
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <p className="mt-3 text-xs text-gray-500 break-all">
              {navLink ? `Link: ${navLink}` : "Link not provided yet"}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            onClick={handleSaveBanner}
            disabled={isSaving || !draftBanner || !navLink.trim()}
          >
            {isSaving
              ? "Saving..."
              : isEditing || savedBanners.length > 0
              ? "Update Top Banner"
              : "Save Top Banner"}
          </Button>
          {(isEditing || savedBanners.length > 0) && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelEdit}
              disabled={isSaving}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Saved Banners Section */}
      {savedBanners.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Saved Banners</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedBanners.map((banner) => (
              <div
                key={banner.id}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm"
              >
                <div className="relative h-48 w-full bg-gray-100">
                  {banner.type === "video" ? (
                    <video
                      controls
                      className="h-full w-full object-cover"
                      src={banner.url}
                    />
                  ) : (
                    <Image
                      src={banner.url}
                      alt="Top banner asset"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex items-start justify-between gap-3 border-t p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Navigation Link
                    </p>
                    <a
                      href={banner.navLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 break-all"
                    >
                      {banner.navLink}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleEditBanner(banner)}>
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveBanner(banner.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTopBanner;
