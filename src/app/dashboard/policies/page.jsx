"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";
import { InfoIcon } from "lucide-react";

// Jodit rich text editor (loaded only on client)
const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
});

const POLICY_TYPES = [
  { key: "terms", label: "Terms & Conditions", defaultSlug: "terms-and-conditions" },
  { key: "privacy", label: "Privacy Policy", defaultSlug: "privacy-policy" },
  { key: "payment", label: "Payment Policy", defaultSlug: "payment-policy" },
  { key: "shipping", label: "Shipping Policy", defaultSlug: "shipping-policy" },
  { key: "refund", label: "Refund & Returns Policy", defaultSlug: "refund-and-returns" },
];

const DEFAULT_POLICY = {
  policy_type: "",
  title: "",
  content: "",
  slug: "",
  status: true,
};

export default function PoliciesPage() {
  const { request } = useAxios();
  const [policiesByType, setPoliciesByType] = useState({});
  const [activeType, setActiveType] = useState("terms");
  const [form, setForm] = useState(DEFAULT_POLICY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const activeMeta = useMemo(
    () => POLICY_TYPES.find((p) => p.key === activeType) || POLICY_TYPES[0],
    [activeType]
  );

  const updateForm = (field, value) =>
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

  const resetFormForType = (typeKey, existing) => {
    const meta = POLICY_TYPES.find((p) => p.key === typeKey);
    setForm({
      policy_type: typeKey,
      title: existing?.title || meta?.label || "",
      content: existing?.content || "",
      slug: existing?.slug || meta?.defaultSlug || "",
      status: existing?.status ?? true,
    });
  };

  // Fetch existing policies
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await request({
          method: "GET",
          url: "/admin/get-policies",
          authRequired: true,
        });

        if (error) {
          console.error("Failed to fetch policies:", error);
          return;
        }

        const list = Array.isArray(data?.data?.policies) ? data.data.policies : [];
        const grouped = {};
        list.forEach((item) => {
          if (item.policy_type) {
            grouped[item.policy_type] = item;
          }
        });
        

        setPoliciesByType(grouped);

        // Initialise form for default active type
        resetFormForType(activeType, grouped[activeType]);
      } catch (err) {
        console.error("Error while fetching policies:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When tab/type changes, refresh form with that policy
  useEffect(() => {
    resetFormForType(activeType, policiesByType[activeType]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType, policiesByType]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.policy_type) {
      showToast("error", "Select a policy type first.");
      return;
    }

    if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
      showToast("error", "Title, slug and content are required.");
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        policy_type: form.policy_type,
        title: form.title.trim(),
        content: form.content,
        slug: form.slug.trim(),
        status: !!form.status,
      };

      const { data, error } = await request({
        method: "POST",
        url: "/admin/create-policies",
        payload,
        authRequired: true,
      });

      if (error || data?.success === false) {
        showToast("error", data?.message || error || "Failed to save policy.");
        return;
      };

      showToast("success", data?.message || "Policy saved successfully.");

      // Update local state for this policy type
      setPoliciesByType((prev) => ({
        ...prev,
        [form.policy_type]: {
          ...(prev[form.policy_type] || {}),
          ...payload,
        },
      }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb />

      <div className="mt-4">
        <h1 className="text-3xl font-bold">Content &amp; Policies</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage legal and informational pages for your storefront.
        </p>
      </div>

      {/* Policy type overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {POLICY_TYPES.map((policy) => {
          const existing = policiesByType[policy.key];
          const isActive = activeType === policy.key;

          return (
            <button
              key={policy.key}
              type="button"
              onClick={() => setActiveType(policy.key)}
              className={`text-left rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${
                isActive ? "border-yellow-600 bg-yellow-50" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-gray-900">{policy.label}</h2>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    existing ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {existing ? "Configured" : "Not configured"}
                </span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">
                {existing?.title || "No content added yet."}
              </p>
              <p className="mt-3 text-xs font-medium text-yellow-700">
                {existing ? "Edit policy" : "Add policy"}
              </p>
            </button>
          );
        })}
        <Link
          href="/dashboard/settings/about-us"
          className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <InfoIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">About Us</div>
              <div className="text-xs text-gray-500">
                Manage About Us page content.
              </div>
            </div>
          </div>
          <span className="text-xs font-medium text-amber-700">Edit</span>
        </Link>
      </div>

      {/* Editor for selected policy */}
      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {activeMeta.label}
            </h2>
            <p className="text-xs text-gray-500">
              {policiesByType[activeType]
                ? "Edit the existing policy content."
                : "Add content for this policy."}
            </p>
          </div>
          {/* <div className="flex items-center gap-2">
            <Switch
              id="policy-status"
              checked={!!form.status}
              onCheckedChange={(checked) => updateForm("status", checked)}
            />
            <Label htmlFor="policy-status" className="text-sm text-gray-700">
              {form.status ? "Active" : "Inactive"}
            </Label>
          </div> */}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="policy-title">Title</Label>
              <Input
                id="policy-title"
                placeholder="Enter policy title"
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="policy-slug">Slug</Label>
              <Input
                id="policy-slug"
                placeholder="URL slug (e.g. terms-and-conditions)"
                value={form.slug}
                onChange={(e) => updateForm("slug", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Editor */}
            <div className="space-y-1">
              <Label htmlFor="policy-content">Content</Label>
              <div className="border rounded-lg overflow-hidden bg-white">
                <JoditEditor
                  value={form.content}
                  onChange={(newContent) => updateForm("content", newContent)}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Use the rich text editor to format your policy (headings, lists, links, etc.).
              </p>
            </div>

            {/* Live preview using dangerouslySetInnerHTML */}
            <div className="space-y-1">
              <Label>Live preview</Label>
              <div className="border rounded-lg p-3 min-h-[120px] prose max-w-none text-sm bg-gray-50 overflow-auto">
                {form.content ? (
                  <div
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: form.content }}
                  />
                ) : (
                  <p className="text-xs text-gray-400">
                    Start typing in the editor to see a preview here.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t mt-6">
            <Button type="submit" disabled={isSaving || isLoading}>
              {isSaving
                ? "Saving..."
                : policiesByType[activeType]
                ? "Update Policy"
                : "Add Policy"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

