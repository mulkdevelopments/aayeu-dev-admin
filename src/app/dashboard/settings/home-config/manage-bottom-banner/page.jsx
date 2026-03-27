"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import FileUploader from "@/components/comman/FileUploader";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";

const TABS = [
  { key: "bottomTop", label: "Bottom Top" },
  { key: "bottomLeft", label: "Club panel (left)" },
  { key: "bottomRight", label: "Newsletter panel (right)" },
];

const SECTION_TO_SLOT = {
  bottomTop: "bottom-top-banner",
  bottomLeft: "bottom-left-banner",
  bottomRight: "bottom-right-banner",
};

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
  const [bottomRight, setBottomRight] = useState({
    title: "",
    link: "",
    buttonText: "",
    mediaUrl: "",
    isEditing: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [removeSection, setRemoveSection] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const allowedImages = useMemo(
    () => ({
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
    }),
    []
  );

  const loadBanners = useCallback(async () => {
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
      setBottomTop({
        title: "",
        link: "",
        mediaUrl: "",
        isEditing: false,
      });
      setBottomLeft({
        title: "",
        link: "",
        buttonText: "",
        mediaUrl: "",
        isEditing: false,
      });
      setBottomRight({
        title: "",
        link: "",
        buttonText: "",
        mediaUrl: "",
        isEditing: false,
      });

      const bottomTopBanner = bannersData["bottom-top-banner"];
      const bottomLeftBanner = bannersData["bottom-left-banner"];
      const bottomRightBanner = bannersData["bottom-right-banner"];

      if (bottomTopBanner?.media_url) {
        setBottomTop({
          title: bottomTopBanner.title || "",
          link: bottomTopBanner.link_url || "",
          mediaUrl: bottomTopBanner.media_url,
          isEditing: true,
        });
      }

      if (bottomLeftBanner?.media_url) {
        setBottomLeft({
          title: bottomLeftBanner.title || "",
          link: bottomLeftBanner.link_url || "",
          buttonText: bottomLeftBanner.button_text || "",
          mediaUrl: bottomLeftBanner.media_url,
          isEditing: true,
        });
      }

      if (bottomRightBanner?.media_url) {
        setBottomRight({
          title: bottomRightBanner.title || "",
          link: bottomRightBanner.link_url || "",
          buttonText: bottomRightBanner.button_text || "",
          mediaUrl: bottomRightBanner.media_url,
          isEditing: true,
        });
      }
    } catch (err) {
      console.error("Error while fetching bottom banners:", err);
    }
  }, [request]);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  const confirmRemoveBanner = async () => {
    const section = removeSection;
    if (!section) return;
    const slot = SECTION_TO_SLOT[section];
    setIsRemoving(true);
    try {
      const { data, error } = await request({
        method: "DELETE",
        url: `/admin/delete-home-banner?slot=${encodeURIComponent(slot)}`,
        authRequired: true,
      });
      if (error) {
        showToast("error", error);
        return;
      }
      if (data?.success) {
        showToast("success", data.message || "Banner removed");
      }
      await loadBanners();
    } finally {
      setIsRemoving(false);
      setRemoveSection(null);
    }
  };

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab === "bottomTop" ||
      tab === "bottomLeft" ||
      tab === "bottomRight"
    ) {
      setActiveTab(tab);
    }

    const section = searchParams.get("section");
    const bannerUrl = searchParams.get("banner");
    const title = searchParams.get("title");
    const link = searchParams.get("link");
    const buttonText = searchParams.get("buttonText");

    if (bannerUrl && section) {
      setActiveTab(section);
      if (section === "bottomTop") {
        setBottomTop({
          title: decodeURIComponent(title || ""),
          link: decodeURIComponent(link || ""),
          mediaUrl: decodeURIComponent(bannerUrl),
          isEditing: true,
        });
      } else if (section === "bottomLeft") {
        setBottomLeft({
          title: decodeURIComponent(title || ""),
          link: decodeURIComponent(link || ""),
          buttonText: decodeURIComponent(buttonText || ""),
          mediaUrl: decodeURIComponent(bannerUrl),
          isEditing: true,
        });
      } else if (section === "bottomRight") {
        setBottomRight({
          title: decodeURIComponent(title || ""),
          link: decodeURIComponent(link || ""),
          buttonText: decodeURIComponent(buttonText || ""),
          mediaUrl: decodeURIComponent(bannerUrl),
          isEditing: true,
        });
      }
    }
  }, [searchParams]);

  const updateSection = (section, field, value) => {
    if (section === "bottomTop") {
      setBottomTop((prev) => ({ ...prev, [field]: value }));
    } else if (section === "bottomLeft") {
      setBottomLeft((prev) => ({ ...prev, [field]: value }));
    } else {
      setBottomRight((prev) => ({ ...prev, [field]: value }));
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
      setBottomTop((prev) => ({ ...prev, isEditing: false }));
    } else if (section === "bottomLeft") {
      setBottomLeft((prev) => ({ ...prev, isEditing: false }));
    } else {
      setBottomRight((prev) => ({ ...prev, isEditing: false }));
    }
    showToast("success","Banner uploaded successfully");
  };

  const handleSave = async (section) => {
    const state =
      section === "bottomTop"
        ? bottomTop
        : section === "bottomLeft"
          ? bottomLeft
          : bottomRight;

    const requiredFields =
      section === "bottomTop"
        ? ["title", "link", "mediaUrl"]
        : section === "bottomLeft"
          ? ["title", "link", "buttonText", "mediaUrl"]
          : ["title", "mediaUrl"];

    const missing = requiredFields.filter(
      (field) => !state[field]?.trim?.() && !state[field]?.length
    );

    if (missing.length) {
      showToast("error", "Fill all required fields before saving.");
      return;
    }

    if (
      section === "bottomRight" &&
      state.buttonText?.trim() &&
      !state.link?.trim()
    ) {
      showToast(
        "error",
        "Add a navigation link when you set a button on the right panel."
      );
      return;
    }

    try {
      setIsSaving(true);

      const slotMap = {
        bottomTop: "bottom-top-banner",
        bottomLeft: "bottom-left-banner",
        bottomRight: "bottom-right-banner",
      };
      const sortMap = { bottomTop: 4, bottomLeft: 5, bottomRight: 6 };

      const link_url =
        section === "bottomRight"
          ? state.link?.trim()
            ? state.link
            : null
          : state.link;

      const button_text =
        section === "bottomTop"
          ? null
          : section === "bottomLeft"
            ? state.buttonText
            : state.buttonText?.trim() || null;

      const bannerObj = {
        slot: slotMap[section],
        media_type: "image",
        media_url: state.mediaUrl,
        link_url,
        title: state.title,
        button_text,
        subtitle: null,
        is_active: true,
        sort_order: sortMap[section],
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
    } else if (section === "bottomLeft") {
      setBottomLeft({
        title: "",
        link: "",
        buttonText: "",
        mediaUrl: "",
        isEditing: false,
      });
    } else {
      setBottomRight({
        title: "",
        link: "",
        buttonText: "",
        mediaUrl: "",
        isEditing: false,
      });
    }
  };

  const renderForm = (section) => {
    const state =
      section === "bottomTop"
        ? bottomTop
        : section === "bottomLeft"
          ? bottomLeft
          : bottomRight;

    const tabLabel =
      section === "bottomTop"
        ? "Bottom Top"
        : section === "bottomLeft"
          ? "Club panel"
          : "Newsletter panel";

    const saveDisabled =
      isSaving ||
      !state.mediaUrl ||
      !state.title.trim() ||
      (section === "bottomTop" && !state.link?.trim()) ||
      (section === "bottomLeft" &&
        (!state.link?.trim() || !state.buttonText?.trim()));

    return (
      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            placeholder="Title / headline"
            value={state.title}
            onChange={(e) => updateSection(section, "title", e.target.value)}
          />
          <Input
            placeholder={
              section === "bottomRight"
                ? "Link (optional — required if you add a button)"
                : "Navigation link"
            }
            value={state.link}
            onChange={(e) => updateSection(section, "link", e.target.value)}
          />
          {(section === "bottomLeft" || section === "bottomRight") && (
            <Input
              className={section === "bottomRight" ? "md:col-span-2" : ""}
              placeholder={
                section === "bottomRight"
                  ? "Button label (optional)"
                  : "Button text"
              }
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <div>
            {state.isEditing && state.mediaUrl ? (
              <Button
                type="button"
                variant="destructive"
                className="cursor-pointer"
                onClick={() => setRemoveSection(section)}
                disabled={isSaving || isRemoving}
              >
                Remove from site
              </Button>
            ) : null}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              className="cursor-pointer"
              onClick={() => handleSave(section)}
              disabled={saveDisabled}
            >
              {isSaving
                ? "Saving..."
                : state.isEditing || state.mediaUrl
                  ? `Update ${tabLabel}`
                  : `Save ${tabLabel}`}
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
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb />
      <div>
        <h1 className="text-3xl font-bold mt-4 mb-2">Bottom &amp; club banners</h1>
        <p className="text-sm text-muted-foreground">
          Full-width bottom top strip, the club panel (left), and the newsletter
          headline panel (right) on the homepage.
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

      {activeTab === "bottomTop" && renderForm("bottomTop")}
      {activeTab === "bottomLeft" && renderForm("bottomLeft")}
      {activeTab === "bottomRight" && renderForm("bottomRight")}

      <AlertDialog
        open={removeSection !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveSection(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this banner?</AlertDialogTitle>
            <AlertDialogDescription>
              The homepage will fall back to its default image and text for this
              slot. Images stored in Cloudinary for this banner will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              className="cursor-pointer"
              disabled={isRemoving}
              onClick={confirmRemoveBanner}
            >
              {isRemoving ? "Removing…" : "Remove"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BottomBannerPage;
