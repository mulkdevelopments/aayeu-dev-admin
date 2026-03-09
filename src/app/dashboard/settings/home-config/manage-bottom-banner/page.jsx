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

const TABS = [
  { key: "bottomTop", label: "Bottom Top" },
  { key: "bottomLeft", label: "Bottom Left" },
];

const BottomBannerPage = () => {
  const { request } = useAxios();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState("bottomTop");
  const [bottomTop, setBottomTop] = useState({
    title: "",
    link: "",
    mediaUrl: "",
    isEditing: false,
  });
  const [bottomLeft, setBottomLeft] = useState({
    title: "",
    link: "",
    buttonText: "",
    mediaUrl: "",
    isEditing: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const allowedImages = useMemo(
    () => ({
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
    }),
    []
  );

  // Fetch current bottom banners so each tab shows its saved data
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await request({
          method: "GET",
          url: "/admin/get-home-banners",
          authRequired: true,
        });

        if (error || !data?.data) {
          console.error("Failed to fetch bottom banners:", error);
          return;
        }

        const bannersData = data.data;
        const bottomTopBanner = bannersData["bottom-top-banner"];
        const bottomLeftBanner = bannersData["bottom-left-banner"];

        if (bottomTopBanner?.media_url) {
          setBottomTop((prev) => ({
            ...prev,
            title: bottomTopBanner.title || "",
            link: bottomTopBanner.link_url || "",
            mediaUrl: bottomTopBanner.media_url,
            isEditing: true,
          }));
        }

        if (bottomLeftBanner?.media_url) {
          setBottomLeft((prev) => ({
            ...prev,
            title: bottomLeftBanner.title || "",
            link: bottomLeftBanner.link_url || "",
            buttonText: bottomLeftBanner.button_text || "",
            mediaUrl: bottomLeftBanner.media_url,
            isEditing: true,
          }));
        }
      } catch (err) {
        console.error("Error while fetching bottom banners:", err);
      }
    };

    fetchBanners();
  }, []);

  useEffect(() => {
    const section = searchParams.get('section');
    const bannerUrl = searchParams.get('banner');
    const title = searchParams.get('title');
    const link = searchParams.get('link');
    const buttonText = searchParams.get('buttonText');
    
    if (bannerUrl && section) {
      setActiveTab(section);
      if (section === "bottomTop") {
        setBottomTop({
          title: decodeURIComponent(title || ''),
          link: decodeURIComponent(link || ''),
          mediaUrl: decodeURIComponent(bannerUrl),
          isEditing: true,
        });
      } else {
        setBottomLeft({
          title: decodeURIComponent(title || ''),
          link: decodeURIComponent(link || ''),
          buttonText: decodeURIComponent(buttonText || ''),
          mediaUrl: decodeURIComponent(bannerUrl),
          isEditing: true,
        });
      }
    }
  }, [searchParams]);

  const updateSection = (section, field, value) => {
    if (section === "bottomTop") {
      setBottomTop((prev) => ({ ...prev, [field]: value }));
    } else {
      setBottomLeft((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleUpload = (section) => (response) => {
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

    updateSection(section, "mediaUrl", mediaUrl);
    if (section === "bottomTop") {
      setBottomTop(prev => ({ ...prev, isEditing: false }));
    } else {
      setBottomLeft(prev => ({ ...prev, isEditing: false }));
    }
    showToast("success","Banner uploaded successfully");
  };

  const handleSave = async (section) => {
    const state = section === "bottomTop" ? bottomTop : bottomLeft;
    const requiredFields =
      section === "bottomTop"
        ? ["title", "link", "mediaUrl"]
        : ["title", "link", "buttonText", "mediaUrl"];

    const missing = requiredFields.filter(
      (field) => !state[field]?.trim?.() && !state[field]?.length
    );

    if (missing.length) {
      showToast("error", "Fill all fields before saving.");
      return;
    }

    try {
      setIsSaving(true);

      // Same API - different slots
      const bannerObj = {
        slot: section === "bottomTop" ? "bottom-top-banner" : "bottom-left-banner",
        media_type: "image",
        media_url: state.mediaUrl,
        link_url: state.link,
        title: state.title,
        ...(section === "bottomLeft" && { button_text: state.buttonText }),
        subtitle: null,
        is_active: true,
        sort_order: section === "bottomTop" ? 4 : 5,
      };

      const { data, error } = await request({
        method: "POST",
        url: "/admin/create-home-banner",
        payload: {
          banners: [bannerObj],
        },
        authRequired: true,
      });

      if (data?.message) {
        if (data?.success) showToast("success", data.message);
        else showToast("error", data.message);
        router.push('/dashboard/settings/home-config/');
        return;
      }


      if (error) {
        showToast("error", error);
        return;
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = (section) => {
    if (section === "bottomTop") {
      setBottomTop({ title: "", link: "", mediaUrl: "", isEditing: false });
    } else {
      setBottomLeft({ title: "", link: "", buttonText: "", mediaUrl: "", isEditing: false });
    }
  };

  const renderForm = (section) => {
    const state = section === "bottomTop" ? bottomTop : bottomLeft;
    const getState = section === "bottomTop" ? setBottomTop : setBottomLeft;

    return (
      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            placeholder="Title"
            value={state.title}
            onChange={(e) => updateSection(section, "title", e.target.value)}
          />
          <Input
            placeholder="Navigation link"
            value={state.link}
            onChange={(e) => updateSection(section, "link", e.target.value)}
          />
          {section === "bottomLeft" && (
            <Input
              placeholder="Button text"
              value={state.buttonText}
              onChange={(e) =>
                updateSection(section, "buttonText", e.target.value)
              }
            />
          )}
        </div>

        <FileUploader
          url="/admin/upload-banners"
          fieldName="banners"
          maxFiles={1}
          multiple={false}
          allowedTypes={allowedImages}
          onSuccess={handleUpload(section)}
          onError={() => showToast("error", "Failed to upload image.")}
        />

        {state.mediaUrl && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {state.isEditing ? `Current ${section}` : "Preview"}
            </p>
            <div className="relative h-32 w-full overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={state.mediaUrl}
                alt={`${section} banner preview`}
                fill
                className="object-cover"
              />
            </div>
            <p className="mt-3 text-xs text-gray-500 break-all">
              Link: {state.link || "Not provided"}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            className="cursor-pointer"
            onClick={() => handleSave(section)}
            disabled={isSaving || !state.mediaUrl || !state.title.trim() || !state.link.trim()}
          >
            {isSaving
              ? "Saving..."
              : state.isEditing || state.mediaUrl
              ? `Update ${section === "bottomTop" ? "Bottom Top" : "Bottom Left"}`
              : `Save ${section === "bottomTop" ? "Bottom Top" : "Bottom Left"}`}
          </Button>
          {state.isEditing && (
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => handleCancel(section)}
              disabled={isSaving}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb />
      <div>
        <h1 className="text-3xl font-bold mt-4 mb-2">Bottom Banner</h1>
        <p className="text-sm text-muted-foreground">
          Configure the two bottom banner slots with unique content.
        </p>
      </div>

      <div className="inline-flex rounded-full border bg-white p-1 text-sm font-medium">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full transition ${
              activeTab === tab.key
                ? "bg-black text-white"
                : "text-gray-600 hover:text-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "bottomTop" ? renderForm("bottomTop") : renderForm("bottomLeft")}
    </div>
  );
};

export default BottomBannerPage;
