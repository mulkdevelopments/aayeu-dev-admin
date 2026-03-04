"use client";

import React, { useEffect, useState } from "react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import useAxios from "@/hooks/useAxios";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";

const defaultItem = { question: "", answer: "" };
const defaultSection = { title: "", items: [{ ...defaultItem }] };
const initialState = {
  intro_text: "",
  contact_email: "",
  sections: [{ ...defaultSection }],
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
        if (Array.isArray(c.sections) && c.sections.length > 0) {
          const sections = c.sections.map((s) => ({
            title: s.title || "",
            items: Array.isArray(s.items) && s.items.length
              ? s.items.map((i) => ({ question: i.question || "", answer: i.answer || "" }))
              : [{ ...defaultItem }],
          }));
          setForm({
            intro_text: c.intro_text || "",
            contact_email: c.contact_email || "",
            sections,
          });
        } else {
          const items = Array.isArray(c.items) && c.items.length
            ? c.items.map((i) => ({ question: i.question || "", answer: i.answer || "" }))
            : [{ ...defaultItem }];
          setForm({
            intro_text: c.intro_text || "",
            contact_email: c.contact_email || "",
            sections: [{ title: "FAQ", items }],
          });
        }
      }
      setLoaded(true);
    };
    fetchFaq();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const setSectionTitle = (sectionIdx, value) => {
    setForm((prev) => {
      const next = { ...prev, sections: [...(prev.sections || [])] };
      next.sections[sectionIdx] = { ...(next.sections[sectionIdx] || defaultSection), title: value };
      return next;
    });
  };

  const setItem = (sectionIdx, itemIdx, field, value) => {
    setForm((prev) => {
      const next = { ...prev, sections: prev.sections.map((s, i) => (i === sectionIdx ? { ...s, items: [...(s.items || [])] } : s)) };
      const items = next.sections[sectionIdx].items;
      items[itemIdx] = { ...(items[itemIdx] || defaultItem), [field]: value };
      return next;
    });
  };

  const addSection = () => {
    setForm((prev) => ({ ...prev, sections: [...(prev.sections || []), { ...defaultSection }] }));
  };

  const removeSection = (sectionIdx) => {
    setForm((prev) => {
      const sections = [...(prev.sections || [])];
      if (sections.length <= 1) return prev;
      sections.splice(sectionIdx, 1);
      return { ...prev, sections };
    });
  };

  const addItem = (sectionIdx) => {
    setForm((prev) => {
      const next = { ...prev, sections: prev.sections.map((s, i) => (i === sectionIdx ? { ...s, items: [...(s.items || []), { ...defaultItem }] } : s)) };
      return next;
    });
  };

  const removeItem = (sectionIdx, itemIdx) => {
    setForm((prev) => {
      const sections = prev.sections.map((s, i) => {
        if (i !== sectionIdx) return s;
        const items = [...(s.items || [])];
        if (items.length <= 1) return s;
        items.splice(itemIdx, 1);
        return { ...s, items };
      });
      return { ...prev, sections };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    const sections = (form.sections || []).map((s) => ({
      title: (s.title || "").trim(),
      items: (s.items || []).filter((i) => i.question?.trim() || i.answer?.trim()).map((i) => ({ question: i.question || "", answer: i.answer || "" })),
    })).filter((s) => s.title.trim() || s.items.length > 0);
    const content = {
      intro_text: form.intro_text || "",
      contact_email: form.contact_email || "",
      sections: sections.length ? sections : [{ title: "FAQ", items: [] }],
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
  const sections = form.sections || [];

  return (
    <div className="px-6 py-4">
      <CustomBreadcrumb />
      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">FAQ Content</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage sections and Q&amp;A shown on the public FAQs page (e.g. 1. About AAYEU, 1.1, 1.2).
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
            <label className="block text-xs font-medium text-slate-600 mb-1">Intro text</label>
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
            <label className="block text-xs font-medium text-slate-600 mb-1">Contact email</label>
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
              <label className="block text-xs font-medium text-slate-600">Sections (e.g. 1. About AAYEU, 2. Account &amp; Registration)</label>
              <Button type="button" variant="outline" size="sm" onClick={addSection}>
                <Plus className="h-4 w-4 mr-1" /> Add section
              </Button>
            </div>
            <div className="space-y-6">
              {sections.map((section, sectionIdx) => (
                <div key={sectionIdx} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={section.title || ""}
                      onChange={(e) => setSectionTitle(sectionIdx, e.target.value)}
                      placeholder="Section title (e.g. About AAYEU)"
                      className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSection(sectionIdx)}
                      disabled={sections.length <= 1}
                      className="text-slate-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="pl-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Q&amp;A items (shown as 1.1, 1.2, …)</span>
                      <Button type="button" variant="outline" size="sm" onClick={() => addItem(sectionIdx)}>
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                    {(section.items || []).map((item, itemIdx) => (
                      <div key={itemIdx} className="flex gap-2 rounded-lg border border-slate-200 p-3 bg-white">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={item.question || ""}
                            onChange={(e) => setItem(sectionIdx, itemIdx, "question", e.target.value)}
                            placeholder="Question"
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                          />
                          <textarea
                            value={item.answer || ""}
                            onChange={(e) => setItem(sectionIdx, itemIdx, "answer", e.target.value)}
                            placeholder="Answer (use new lines for bullets)"
                            rows={3}
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm resize-y"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(sectionIdx, itemIdx)}
                          disabled={(section.items || []).length <= 1}
                          className="text-slate-500 hover:text-red-600 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
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
