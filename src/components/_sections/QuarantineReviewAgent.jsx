"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/_ui/toast-utils";
import { Loader2, Sparkles, Check, X, SkipForward, ListRestart } from "lucide-react";
import Image from "next/image";

/**
 * One-by-one quarantine review: load product → optional AI suggestion → edit → accept (save + recover) or reject/skip.
 */
export default function QuarantineReviewAgent({ request, onApplied }) {
  const [queueIds, setQueueIds] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);

  const [product, setProduct] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftShort, setDraftShort] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [suggestionNote, setSuggestionNote] = useState("");
  const [suggestionFixable, setSuggestionFixable] = useState(null);

  const currentId = queueIds[0] || null;

  const loadQueue = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/deleted-suspicious-products?page=1&limit=150&filter=suspicious",
        authRequired: true,
      });
      if (error) throw new Error(data?.message || error);
      const list = data?.data?.products || [];
      const ids = list.map((p) => p.id).filter(Boolean);
      setQueueIds(ids);
      if (ids.length === 0) {
        showToast("success", "No quarantined (suspicious) products in queue.");
      } else {
        showToast("success", `Loaded ${ids.length} product(s) into review queue.`);
      }
    } catch (e) {
      showToast("error", e?.message || "Failed to load queue");
      setQueueIds([]);
    } finally {
      setLoadingQueue(false);
    }
  }, [request]);

  const loadProduct = useCallback(
    async (productId) => {
      if (!productId) {
        setProduct(null);
        return;
      }
      setLoadingProduct(true);
      setSuggestionNote("");
      setSuggestionFixable(null);
      try {
        const { data, error } = await request({
          method: "GET",
          url: `/admin/get-product-by-id?productId=${productId}&includeDeleted=1`,
          authRequired: true,
        });
        if (error) throw new Error(data?.message || error);
        const p = data?.data;
        if (!p) throw new Error("Product not found");
        setProduct(p);
        setDraftName(p.name || "");
        setDraftTitle(p.title || "");
        setDraftShort(p.short_description || "");
        setDraftDesc(p.description || "");
      } catch (e) {
        showToast("error", e?.message || "Failed to load product");
        setProduct(null);
      } finally {
        setLoadingProduct(false);
      }
    },
    [request]
  );

  useEffect(() => {
    if (currentId) loadProduct(currentId);
    else setProduct(null);
  }, [currentId, loadProduct]);

  const applySuggestionToDraft = useCallback((s) => {
    if (s.suggested_name != null) setDraftName(s.suggested_name);
    if (s.suggested_title != null) setDraftTitle(s.suggested_title);
    if (s.suggested_short_description != null) setDraftShort(s.suggested_short_description);
    if (s.suggested_description != null) setDraftDesc(s.suggested_description);
    setSuggestionNote(s.explanation || "");
    setSuggestionFixable(s.fixable === true);
  }, []);

  const runSuggest = async () => {
    if (!currentId) return;
    setSuggestLoading(true);
    setSuggestionNote("");
    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/quarantine-review-suggest",
        authRequired: true,
        payload: { product_id: currentId },
      });
      if (error) throw new Error(data?.message || error);
      const s = data?.data;
      if (!s) throw new Error("No suggestion data");
      applySuggestionToDraft(s);
      showToast("success", s.fixable ? "Suggestion applied to fields below — review and edit." : "AI could not auto-fix by text alone — see note.");
    } catch (e) {
      showToast("error", e?.message || "Suggestion failed");
    } finally {
      setSuggestLoading(false);
    }
  };

  const popQueue = () => {
    setQueueIds((q) => q.slice(1));
  };

  const handleReject = () => {
    popQueue();
    showToast("success", "Skipped — next product.");
  };

  const handleAccept = async () => {
    if (!currentId) return;
    setApplyLoading(true);
    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/quarantine-review-apply",
        authRequired: true,
        payload: {
          product_id: currentId,
          product: {
            name: draftName,
            title: draftTitle,
            short_description: draftShort,
            description: draftDesc,
          },
          recover: true,
        },
      });
      if (error) throw new Error(data?.message || error);
      showToast("success", data?.message || "Saved and recovered");
      popQueue();
      onApplied?.();
    } catch (e) {
      showToast("error", e?.message || "Save failed");
    } finally {
      setApplyLoading(false);
    }
  };

  return (
    <Card className="mb-6 border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/40 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" aria-hidden />
            <CardTitle className="text-base text-slate-900">Quarantine QA agent</CardTitle>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-slate-300"
            onClick={loadQueue}
            disabled={loadingQueue}
          >
            {loadingQueue ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ListRestart className="h-4 w-4 mr-2" />
            )}
            Load suspicious queue
          </Button>
        </div>
        <p className="text-sm text-slate-500 font-normal">
          Opens <strong>one quarantined product at a time</strong>. Use <strong>Suggest fix</strong> to draft name/description changes, edit the fields, then{" "}
          <strong>Accept</strong> to save and recover — or <strong>Reject</strong> to skip without saving.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <Badge variant="secondary" className="font-normal">
            In queue: {queueIds.length}
          </Badge>
          {currentId && (
            <span className="text-xs font-mono text-slate-500 truncate max-w-[220px]" title={currentId}>
              Current: {currentId}
            </span>
          )}
        </div>

        {!currentId && !loadingQueue && (
          <p className="text-sm text-slate-500">Load the queue to start reviewing.</p>
        )}

        {loadingProduct && (
          <div className="flex items-center gap-2 text-slate-600 text-sm py-8 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading product…
          </div>
        )}

        {product && !loadingProduct && (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="shrink-0">
                {product.product_img ? (
                  <div className="relative w-24 h-24 rounded-md overflow-hidden bg-slate-100">
                    <Image
                      src={product.product_img}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="96px"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-md bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                    No image
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Issue</span>
                  <p className="text-sm text-slate-800 mt-0.5 whitespace-pre-wrap">
                    {product.suspicious_reason || "—"}
                  </p>
                </div>
                {suggestionNote && (
                  <div className="rounded-md bg-indigo-50 border border-indigo-100 px-3 py-2 text-sm text-indigo-900">
                    <span className="font-medium">AI note: </span>
                    {suggestionNote}
                    {suggestionFixable === false && (
                      <span className="block mt-1 text-amber-800 text-xs">
                        Marked as not fully fixable by text edits — you can still edit manually or reject.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">Name</label>
                <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} className="border-slate-200" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">Title</label>
                <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} className="border-slate-200" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Short description</label>
              <Textarea
                value={draftShort}
                onChange={(e) => setDraftShort(e.target.value)}
                rows={3}
                className="border-slate-200 font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Description (HTML ok)</label>
              <Textarea
                value={draftDesc}
                onChange={(e) => setDraftDesc(e.target.value)}
                rows={10}
                className="border-slate-200 font-mono text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="bg-indigo-100 text-indigo-900 hover:bg-indigo-200"
                onClick={runSuggest}
                disabled={suggestLoading}
              >
                {suggestLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Suggest fix (AI)
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleAccept}
                disabled={applyLoading}
              >
                {applyLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Accept — save & recover
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleReject} disabled={applyLoading}>
                <X className="h-4 w-4 mr-2" />
                Reject / skip
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-slate-600"
                onClick={popQueue}
                disabled={applyLoading}
                title="Skip without marking as reviewed"
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Next only
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
