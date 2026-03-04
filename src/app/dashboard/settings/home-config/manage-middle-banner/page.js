"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import FileUploader from "@/components/comman/FileUploader";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";

export default function ManageMiddleBanner() {
  const { request } = useAxios();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [navLink, setNavLink] = useState("");
  const [draftBanner, setDraftBanner] = useState(null);
  const [savedBanners, setSavedBanners] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  const allowedImages = useMemo(
    () => ({
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
    }),
    []
  );

  useEffect(() => {
    const fetchInitialBanner = async () => {
      try {
        setIsLoadingInitial(true);
        
         const { data: apiData, error: apiError } = await request({
          method: "GET",
          url: "/admin/get-home-banners",
          authRequired: true,
        });


        const bannerUrl = searchParams.get('banner');
        const bannerLink = searchParams.get('link');

        let middleBannerData = null;


        if (!apiError && apiData?.data) {
          const middleBanner = apiData.data["middle-banner"];
          if (middleBanner?.media_url) {
            middleBannerData = {
              id: "middle-banner-fixed",
              url: middleBanner.media_url,
              navLink: middleBanner.link_url || "",
            };
            console.log("✅ Middle banner loaded from API:", middleBannerData);
          }
        }

        // URL params fallback (newly saved)
        if (!middleBannerData && bannerUrl) {
          middleBannerData = {
            id: Date.now().toString(),
            url: decodeURIComponent(bannerUrl),
            navLink: decodeURIComponent(bannerLink || ''),
          };
        }

        // Prefill form
        if (middleBannerData) {
          setDraftBanner({ id: middleBannerData.id, url: middleBannerData.url });
          setNavLink(middleBannerData.navLink);
          setSavedBanners([middleBannerData]);
          setIsEditing(true);
        }
      } catch (err) {
        console.error("Failed to fetch middle banner:", err);
      } finally {
        setIsLoadingInitial(false);
      }
    };

    fetchInitialBanner();
  }, []); 

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
      showToast("error", "Upload succeeded but server returned no URL.");
      return;
    }

    setDraftBanner({
      id: Date.now().toString(),
      url: mediaUrl,
    });
    setIsEditing(false);
    showToast("success", "Banner uploaded successfully");
  };

  const handleSave = async () => {
    const trimmedLink = navLink.trim();

    if (!draftBanner?.url) {
      showToast("error", "Upload an image first.");
      return;
    }

    if (!trimmedLink) {
      showToast("error", "Navigation link required.");
      return;
    }

    try {
      setIsSaving(true);

      const { data, error } = await request({
        method: "POST",
        url: "/admin/create-home-banner",
        payload: {
          banners: [{
            slot: "middle-banner",
            media_type: "image",
            media_url: draftBanner.url,
            link_url: trimmedLink,
            title: null,
            subtitle: null,
            button_text: null,
            is_active: true,
            sort_order: 3,
          }]
        },
        authRequired: true,
      });

      if (data?.message) {
        if (data?.success) {
          showToast("success", data.message);
          router.push('/dashboard/settings/home-config/');
        } else {
          showToast("error", data.message);
        }
        return;
      }

      if (error) {
        showToast("error", error || "Failed to save banner.");
        return;
      }

      // Update local state
      const newBanner = {
        ...draftBanner,
        link: trimmedLink,
      };
      
      setSavedBanners([newBanner]);
      setDraftBanner(null);
      setNavLink("");
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const removeBanner = (id) => {
    setSavedBanners((prev) => prev.filter((item) => item.id !== id));
    if (draftBanner?.id === id) {
      setDraftBanner(null);
      setNavLink("");
      setIsEditing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb />
      <div className="mt-4">
        <h1 className="text-3xl font-bold">Middle Banner</h1>
        <p className="text-muted-foreground">
          Upload a single banner image and choose where it should redirect.
        </p>
      </div>

      {isLoadingInitial ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">Loading middle banner...</p>
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-dashed border-gray-300 bg-white p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Navigation Link
            </label>
            <Input
              placeholder="https://example.com/collection"
              value={navLink}
              onChange={(e) => setNavLink(e.target.value)}
            />
          </div>

          <FileUploader
            url="/admin/upload-banners"
            fieldName="banners"
            maxFiles={1}
            multiple={false}
            allowedTypes={allowedImages}
            onSuccess={handleUploadSuccess}
            onError={() => showToast("error", "Failed to upload image.")}
          />

          {draftBanner && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {isEditing ? "Current Middle Banner" : "Preview"}
              </p>
              <div className="relative h-32 w-full overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={draftBanner.url}
                  alt="Middle banner preview"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 break-all">
                {navLink ? `Link: ${navLink}` : "No link supplied yet"}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !draftBanner || !navLink.trim()}
            >
              {isSaving
                ? "Saving..."
                : isEditing || savedBanners.length > 0
                ? "Update Middle Banner"
                : "Save Middle Banner"}
            </Button>
            {(isEditing || savedBanners.length > 0) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDraftBanner(null);
                  setNavLink("");
                  setIsEditing(false);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Saved Banners</h2>
        {savedBanners.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
            No middle banners saved yet.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {savedBanners.map((banner) => (
              <div
                key={banner.id}
                className="rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div className="relative h-36 w-full overflow-hidden rounded-md">
                  <Image
                    src={banner.url}
                    alt="Middle banner"
                    fill
                    className="object-cover"
                  />
                </div>
                <a
                  href={banner.link || banner.navLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block text-sm text-blue-600 break-all"
                >
                  {banner.link || banner.navLink}
                </a>
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDraftBanner({ id: banner.id, url: banner.url });
                      setNavLink(banner.link || banner.navLink);
                      setIsEditing(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    type="button"
                    onClick={() => removeBanner(banner.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
