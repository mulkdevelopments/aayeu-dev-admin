"use client";

import React, { useEffect, useState } from "react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import useAxios from "@/hooks/useAxios";
import FileUploader from "@/components/comman/FileUploader";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const initialState = {
  summary_heading: "",
  summary_text: "",
  summary_banner: "",
  top_title: "",
  top_subtitle: "",
  top_text: "",
  top_image_url: "",
  middle_title: "",
  middle_subtitle: "",
  middle_text: "",
  middle_image_url: "",
  bottom_title: "",
  bottom_subtitle: "",
  bottom_text: "",
  bottom_image_url: "",
};

const AboutUsPage = () => {
  const { request, loading, error } = useAxios();
  const [form, setForm] = useState(initialState);
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchAbout = async () => {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/get-about-us",
        authRequired: true,
      });

      if (!error && data) {
        // The actual data is inside data.data based on your JSON response
        const apiData = data.data;

        if (apiData) {
          setForm({
            // Map Nested API Data to Flat Form State
            
            // Summary Section
            summary_heading: apiData.summary?.heading || "",
            summary_text: apiData.summary?.text || "",
            summary_banner: apiData.summary?.summary_banner || "",

            // Top Section
            top_title: apiData.top?.title || "",
            top_subtitle: apiData.top?.subtitle || "",
            top_text: apiData.top?.text || "",
            top_image_url: apiData.top?.image_url || "",

            // Middle Section
            middle_title: apiData.middle?.title || "",
            middle_subtitle: apiData.middle?.subtitle || "",
            middle_text: apiData.middle?.text || "",
            middle_image_url: apiData.middle?.image_url || "",

            // Bottom Section
            bottom_title: apiData.bottom?.title || "",
            bottom_subtitle: apiData.bottom?.subtitle || "",
            bottom_text: apiData.bottom?.text || "",
            bottom_image_url: apiData.bottom?.image_url || "",
          });
          setIsEdit(true);
        } else {
          setIsEdit(false);
        }
      }
    };

    fetchAbout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const removeImage = (fieldName) => () => {
    setForm((prev) => ({ ...prev, [fieldName]: "" }));
  };

  const handleImageUpload = (fieldName) => (uploadData) => {
    console.log("Upload response:", uploadData);
    // Handle the specific structure of your upload response
    const imageUrl =
      uploadData?.data?.uploaded?.[0]?.url ||
      uploadData?.uploaded?.[0]?.url ||
      uploadData?.url;

    if (imageUrl) {
      setForm((prev) => ({
        ...prev,
        [fieldName]: imageUrl,
      }));
      console.log(`Set ${fieldName}:`, imageUrl);
    } else {
      console.log("No image URL found in response");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");

    // Note: Assuming your SAVE API expects the FLAT structure (as per your previous curl).
    // If it expects nested JSON, we would need to restructure 'form' here before sending.
    const { data, error } = await request({
      method: "POST",
      url: "/admin/save-about-us",
      payload: form,
      authRequired: true,
    });

    if (!error) {
      setSuccessMessage(
        isEdit
          ? "About Us updated successfully."
          : "About Us created successfully."
      );
      setIsEdit(true);
    }

    setSaving(false);
  };

  const isLoading = loading || saving;

  return (
    <div className="px-6 py-4">
      <CustomBreadcrumb />

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            About Us Content
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage the content that appears on the public About Us page.
          </p>
        </div>

        {isEdit && (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-100">
            Existing content loaded
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr,1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-6"
        >
          {/* Summary Section */}
          <section>
            <h2 className="text-sm font-semibold text-slate-800">Summary</h2>
            <p className="text-xs text-slate-500 mb-3">
              High-level overview shown at the top of the page.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Summary heading
                </label>
                <input
                  type="text"
                  name="summary_heading"
                  value={form.summary_heading}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:bg-white"
                  placeholder="About Us"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Summary text
                </label>
                <textarea
                  name="summary_text"
                  value={form.summary_text}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:bg-white resize-none"
                  placeholder="Short intro about your brand, mission or story."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Summary Banner
                </label>
                <FileUploader
                  url="/admin/upload-banners"
                  onSuccess={handleImageUpload("summary_banner")}
                  authRequired={true}
                  maxFiles={1}
                  fieldName="banners"
                  multiple={false}
                  allowedTypes={{
                    "image/png": [],
                    "image/jpeg": [],
                    "image/jpg": [],
                    "image/webp": [],
                  }}
                />
                {form.summary_banner && (
                  <div className="mt-2 flex items-start gap-2">
                    <div className="relative w-32 h-20 p-2 bg-slate-50 rounded-md shrink-0">
                      <Image
                        src={form.summary_banner}
                        alt="Summary banner preview"
                        fill
                        style={{ objectFit: "cover" }}
                        className="rounded-md"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeImage("summary_banner")}
                      className="text-slate-500 hover:text-red-600 shrink-0"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Top Section */}
          <section className="pt-4 border-t border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">
              Top section
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Hero content displayed near the top of the page.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="top_title"
                  value={form.top_title}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:bg-white"
                  placeholder="Lorem Ipsum Dolor"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  name="top_subtitle"
                  value={form.top_subtitle}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:bg-white"
                  placeholder="Optional supporting line"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Text
                </label>
                <textarea
                  name="top_text"
                  value={form.top_text}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:bg-white resize-none"
                  placeholder="Nunc convallis diam..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Image
                </label>
                <FileUploader
                  url="/admin/upload-banners"
                  onSuccess={handleImageUpload("top_image_url")}
                  authRequired={true}
                  maxFiles={1}
                  fieldName="banners"
                  multiple={false}
                  allowedTypes={{
                    "image/png": [],
                    "image/jpeg": [],
                    "image/jpg": [],
                    "image/webp": [],
                  }}
                />
                {form.top_image_url && (
                  <div className="mt-2 flex items-start gap-2">
                    <div className="relative w-20 h-20 p-2 bg-slate-50 rounded-md shrink-0">
                      <Image
                        src={form.top_image_url}
                        alt="Top preview"
                        fill
                        style={{ objectFit: "cover" }}
                        className="rounded-md"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeImage("top_image_url")}
                      className="text-slate-500 hover:text-red-600 shrink-0"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Middle Section */}
          <section className="pt-4 border-t border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">
              Middle section
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Additional story content or brand values.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="middle_title"
                  value={form.middle_title}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:bg-white"
                  placeholder="Consectetur Adipiscing"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  name="middle_subtitle"
                  value={form.middle_subtitle}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:bg-white"
                  placeholder="Optional supporting line"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Text
                </label>
                <textarea
                  name="middle_text"
                  value={form.middle_text}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:bg-white resize-none"
                  placeholder="Suspendisse potenti..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Image
                </label>
                <FileUploader
                  url="/admin/upload-banners"
                  onSuccess={handleImageUpload("middle_image_url")}
                  authRequired={true}
                  maxFiles={1}
                  fieldName="banners"
                  multiple={false}
                  allowedTypes={{
                    "image/png": [],
                    "image/jpeg": [],
                    "image/jpg": [],
                    "image/webp": [],
                  }}
                />
                {form.middle_image_url && (
                  <div className="mt-2 flex items-start gap-2">
                    <div className="relative w-20 h-20 p-2 bg-slate-50 rounded-md shrink-0">
                      <Image
                        src={form.middle_image_url}
                        alt="Middle preview"
                        fill
                        style={{ objectFit: "cover" }}
                        className="rounded-md"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeImage("middle_image_url")}
                      className="text-slate-500 hover:text-red-600 shrink-0"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Bottom Section */}
          <section className="pt-4 border-t border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">
              Bottom section
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Closing content or additional highlights.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="bottom_title"
                  value={form.bottom_title}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:bg-white"
                  placeholder="Vestibulum Ante Ipsum"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  name="bottom_subtitle"
                  value={form.bottom_subtitle}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:bg-white"
                  placeholder="Optional supporting line"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Text
                </label>
                <textarea
                  name="bottom_text"
                  value={form.bottom_text}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:bg-white resize-none"
                  placeholder="Pellentesque habitant..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Image
                </label>
                <FileUploader
                  url="/admin/upload-banners"
                  onSuccess={handleImageUpload("bottom_image_url")}
                  authRequired={true}
                  maxFiles={1}
                  fieldName="banners"
                  multiple={false}
                  allowedTypes={{
                    "image/png": [],
                    "image/jpeg": [],
                    "image/jpg": [],
                    "image/webp": [],
                  }}
                />
                {form.bottom_image_url && (
                  <div className="mt-2 flex items-start gap-2">
                    <div className="relative w-20 h-20 p-2 bg-slate-50 rounded-md shrink-0">
                      <Image
                        src={form.bottom_image_url}
                        alt="Bottom preview"
                        fill
                        style={{ objectFit: "cover" }}
                        className="rounded-md"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeImage("bottom_image_url")}
                      className="text-slate-500 hover:text-red-600 shrink-0"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              {error && <span className="text-red-600">{error}</span>}
              {!error && successMessage && (
                <span className="text-emerald-600">{successMessage}</span>
              )}
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 rounded-full border-2 border-slate-300 border-t-white animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                "Update About Us"
              ) : (
                "Create About Us"
              )}
            </Button>
          </div>
        </form>

        {/* Preview Panel */}
        <aside className="hidden lg:block rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Live preview
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Quick preview of how your content roughly appears on the site.
          </p>

          <div className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
                Summary
              </p>
              <h4 className="font-semibold text-slate-900">
                {form.summary_heading || "About Us"}
              </h4>
              <p className="text-xs text-slate-600 mt-1 line-clamp-3">
                {form.summary_text ||
                  "Short introduction about your brand will appear here."}
              </p>
              {form.summary_banner && (
                <div className="relative w-full h-16 rounded overflow-hidden mt-2 bg-slate-100">
                  <Image
                    src={form.summary_banner}
                    alt="Summary banner"
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}
            </div>
            <div className="border-t border-slate-200 pt-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
                Top section
              </p>
              <p className="text-sm font-medium text-slate-900">
                {form.top_title || "Top title"}
              </p>
              <p className="text-xs text-slate-500">
                {form.top_subtitle || "Subtitle"}
              </p>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
                Middle section
              </p>
              <p className="text-sm font-medium text-slate-900">
                {form.middle_title || "Middle title"}
              </p>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
                Bottom section
              </p>
              <p className="text-sm font-medium text-slate-900">
                {form.bottom_title || "Bottom title"}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AboutUsPage;
