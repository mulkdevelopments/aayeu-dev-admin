"use client";

import React, { useEffect, useState } from "react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import useAxios from "@/hooks/useAxios";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

const defaultItem = { question: "", answer: "" };
const initialState = {
  intro_text: "",
  contact_email: "",
  items: [{ ...defaultItem }],
};

const FAQPage = () => {
  const { request, loading } = useAxios();
  const [form, setForm] = useState(initialState);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchFaq = async () => {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/get-page-content",
        authRequired: true,
        params: { key: "faq" },
      });

      if (!error && data?.data?.content) {
        const c = data.data.content;
        const items = Array.isArray(c.items) && c.items.length
          ? c.items.map((i) => ({ question: i.question || "", answer: i.answer || "" }))
          : [{ ...defaultItem }];
        setForm({
          intro_text: c.intro_text || "",
          contact_email: c.contact_email || "",
          items,
        });
      }
      setLoaded(true);
    };
    fetchFaq();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const setItem = (index, field, value) => {
    setForm((prev) => {
      const next = { ...prev };
      next.items = [...(next.items || [])];
      next.items[index] = { ...(next.items[index] || defaultItem), [field]: value };
      return next;
    });
  };

  const addItem = () => {
    setForm((prev) => ({ ...prev, items: [...(prev.items || []), { ...defaultItem }] }));
  };

  const removeItem = (index) => {
    setForm((prev) => {
      const items = [...(prev.items || [])];
      if (items.length <= 1) return prev;
      items.splice(index, 1);
      return { ...prev, items };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    const content = {
      intro_text: form.intro_text,
      contact_email: form.contact_email,
      items: (form.items || []).filter((i) => i.question.trim() || i.answer.trim()),
    };
    const { error } = await request({
      method: "POST",
      url: "/admin/save-page-content",
      authRequired: true,
      payload: { key: "faq", content },
    });
    if (!error) setSuccessMessage("FAQ content saved successfully.");
    setSaving(false);
  };

  const isLoading = loading || saving;

  return (
    <div className="px-6 py-4">
      <CustomBreadcrumb />
      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">FAQ Content</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage the content that appears on the public FAQs page.
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
              Intro text
            </label>
            <textarea
              name="intro_text"
              value={form.intro_text}
              onChange={handleChange}
              rows={2}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:bg-white resize-none"
              placeholder="e.g. Find quick answers to common questions. Need more help? Email us."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Contact email
            </label>
            <input
              type="text"
              name="contact_email"
              value={form.contact_email}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:bg-white"
              placeholder="help@aayeu.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-slate-600">FAQ items</label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-4">
              {(form.items || []).map((item, index) => (
                <div
                  key={index}
                  className="flex gap-2 rounded-lg border border-slate-200 p-3 bg-slate-50/50"
                >
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => setItem(index, "question", e.target.value)}
                      placeholder="Question"
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                    <textarea
                      value={item.answer}
                      onChange={(e) => setItem(index, "answer", e.target.value)}
                      placeholder="Answer"
                      rows={2}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm resize-none"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={(form.items || []).length <= 1}
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
              {isLoading ? "Saving..." : "Save FAQ"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default FAQPage;
