"use client";

import React, { useEffect, useState } from "react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import useAxios from "@/hooks/useAxios";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

const defaultStep = { title: "", text: "" };
const initialState = {
  title: "",
  subtitle: "",
  steps: [{ ...defaultStep }],
};

const HowToShopPage = () => {
  const { request, loading } = useAxios();
  const [form, setForm] = useState(initialState);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/get-page-content",
        authRequired: true,
        params: { key: "how_to_shop" },
      });

      if (!error && data?.data?.content) {
        const c = data.data.content;
        const steps = Array.isArray(c.steps) && c.steps.length
          ? c.steps.map((s) => ({ title: s.title || "", text: s.text || "" }))
          : [{ ...defaultStep }];
        setForm({
          title: c.title || "",
          subtitle: c.subtitle || "",
          steps,
        });
      }
      setLoaded(true);
    };
    fetchContent();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const setStep = (index, field, value) => {
    setForm((prev) => {
      const next = { ...prev };
      next.steps = [...(next.steps || [])];
      next.steps[index] = { ...(next.steps[index] || defaultStep), [field]: value };
      return next;
    });
  };

  const addStep = () => {
    setForm((prev) => ({ ...prev, steps: [...(prev.steps || []), { ...defaultStep }] }));
  };

  const removeStep = (index) => {
    setForm((prev) => {
      const steps = [...(prev.steps || [])];
      if (steps.length <= 1) return prev;
      steps.splice(index, 1);
      return { ...prev, steps };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    const content = {
      title: form.title,
      subtitle: form.subtitle,
      steps: (form.steps || []).filter((s) => s.title.trim() || s.text.trim()),
    };
    const { error } = await request({
      method: "POST",
      url: "/admin/save-page-content",
      authRequired: true,
      payload: { key: "how_to_shop", content },
    });
    if (!error) setSuccessMessage("How to Shop content saved successfully.");
    setSaving(false);
  };

  const isLoading = loading || saving;

  return (
    <div className="px-6 py-4">
      <CustomBreadcrumb />
      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">How to Shop Content</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage the content that appears on the public How to Shop page.
          </p>
        </div>
      </div>

      {!loaded ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Loading...
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-6"
        >
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Page title
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:bg-white"
              placeholder="How to Shop"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Subtitle
            </label>
            <textarea
              name="subtitle"
              value={form.subtitle}
              onChange={handleChange}
              rows={2}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:bg-white resize-none"
              placeholder="Discover curated luxury and shop with confidence..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-slate-600">Steps</label>
              <Button type="button" variant="outline" size="sm" onClick={addStep}>
                <Plus className="h-4 w-4 mr-1" /> Add step
              </Button>
            </div>
            <div className="space-y-4">
              {(form.steps || []).map((step, index) => (
                <div
                  key={index}
                  className="flex gap-2 rounded-lg border border-slate-200 p-3 bg-slate-50/50"
                >
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => setStep(index, "title", e.target.value)}
                      placeholder="Step title (e.g. 1. Browse Collections)"
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                    <textarea
                      value={step.text}
                      onChange={(e) => setStep(index, "text", e.target.value)}
                      placeholder="Step description"
                      rows={2}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm resize-none"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStep(index)}
                    disabled={(form.steps || []).length <= 1}
                    className="text-slate-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              {successMessage && <span className="text-emerald-600">{successMessage}</span>}
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save How to Shop"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default HowToShopPage;
