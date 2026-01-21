"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronRight, PlusCircle, Sparkles, Check, Loader2 } from "lucide-react";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";
import AddCategoryModel from "@/components/_dialogs/AddCategoryModel";

const normalizeCategories = (categories = []) =>
  (categories || []).map((category) => ({
    ...category,
    id: category.id || category._id,
    name: category.name || category.title || "Untitled",
    children: category.children ? normalizeCategories(category.children) : [],
  }));

const filterTree = (categories = [], searchTerm = "") => {
  if (!searchTerm) return categories;
  const lower = searchTerm.toLowerCase();

  const recurse = (node) => {
    const childMatches = (node.children || [])
      .map(recurse)
      .filter((child) => child !== null);
    const isMatch = node.name?.toLowerCase().includes(lower);
    if (isMatch || childMatches.length > 0) {
      return {
        ...node,
        children: childMatches,
      };
    }
    return null;
  };

  return categories
    .map(recurse)
    .filter((node) => node !== null);
};

const getConfidenceColor = (confidence) => {
  if (confidence >= 85) return "bg-green-100 border-green-500 text-green-800";
  if (confidence >= 70) return "bg-yellow-100 border-yellow-500 text-yellow-800";
  return "bg-orange-100 border-orange-500 text-orange-800";
};

const getConfidenceBadgeColor = (confidence) => {
  if (confidence >= 85) return "bg-green-500";
  if (confidence >= 70) return "bg-yellow-500";
  return "bg-orange-500";
};

const MapProductCategoryDialog = ({
  open,
  onClose,
  productId,
  productName,
  initialCategoryId = null,
  onSuccess,
}) => {
  const router = useRouter();
  const { request } = useAxios();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialCategoryId
  );
  const [expanded, setExpanded] = useState({});
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [preselectCategoryId, setPreselectCategoryId] = useState("");

  // AI Suggestions state
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setSelectedCategoryId(initialCategoryId || null);
      setAiSuggestions([]);
      setAiError(null);
      return;
    }
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (initialCategoryId) {
      setSelectedCategoryId(initialCategoryId);
    }
  }, [initialCategoryId]);

  // Auto-fetch AI suggestions when dialog opens with a productId
  useEffect(() => {
    if (open && productId && categories.length > 0) {
      fetchAISuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, productId, categories.length]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/get-our-categories",
        authRequired: true,
      });

      if (error) throw new Error(error?.message || error);

      const normalized = normalizeCategories(data?.data || []);
      setCategories(normalized);
      setExpanded((prev) => {
        const next = { ...prev };
        normalized.forEach((cat) => {
          if (typeof next[cat.id] === "undefined") {
            next[cat.id] = true;
          }
        });
        return next;
      });
    } catch (err) {
      console.error("Error fetching categories:", err);
      showToast("error", err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const fetchAISuggestions = async () => {
    if (!productId) return;

    setAiLoading(true);
    setAiError(null);
    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/ai-category-suggestions",
        payload: { productId },
        authRequired: true,
      });

      if (error) throw new Error(error?.message || error);

      if (data?.success && data?.data?.suggestions) {
        setAiSuggestions(data.data.suggestions);
      }
    } catch (err) {
      console.error("Error fetching AI suggestions:", err);
      setAiError(err.message || "Failed to get AI suggestions");
    } finally {
      setAiLoading(false);
    }
  };

  const filteredCategories = useMemo(
    () => filterTree(categories, searchTerm),
    [categories, searchTerm]
  );

  const handleSubmit = async () => {
    if (!selectedCategoryId) {
      showToast("error", "Please select a category");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/map-product-directly-to-category",
        payload: {
          our_category_id: selectedCategoryId,
          product_ids: [productId],
        },
        authRequired: true,
      });

      if (error) throw new Error(error?.message || error);

      showToast(
        "success",
        data?.message || "Product mapped successfully"
      );

      onSuccess?.(selectedCategoryId);
      onClose();
    } catch (err) {
      console.error("Error mapping product:", err);
      showToast("error", err.message || "Failed to map product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptSuggestion = (categoryId) => {
    setSelectedCategoryId(categoryId);
    // Expand parents to show the selected category
    expandToCategory(categoryId);
  };

  const expandToCategory = (categoryId) => {
    // Find the category and expand all its parents
    const findAndExpand = (cats, targetId, parents = []) => {
      for (const cat of cats) {
        if (cat.id === targetId) {
          // Found it - expand all parents
          const newExpanded = { ...expanded };
          parents.forEach((p) => (newExpanded[p] = true));
          setExpanded(newExpanded);
          return true;
        }
        if (cat.children && cat.children.length > 0) {
          if (findAndExpand(cat.children, targetId, [...parents, cat.id])) {
            return true;
          }
        }
      }
      return false;
    };
    findAndExpand(categories, categoryId);
  };

  const toggleExpanded = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAddCategory = (categoryId) => {
    setPreselectCategoryId(categoryId || "");
    setIsAddCategoryOpen(true);
  };

  const renderTree = (items = [], depth = 0) => {
    return items.map((cat) => {
      const hasChildren = cat.children && cat.children.length > 0;
      const isExpanded = searchTerm
        ? true
        : expanded[cat.id] ?? depth === 0;

      return (
        <div key={cat.id} className="border-b border-muted/40">
          <div
            className={`flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors ${
              selectedCategoryId === cat.id ? "bg-yellow-50 border-l-4 border-yellow-500" : ""
            }`}
            style={{ paddingLeft: `${depth * 20}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpanded(cat.id)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <span className="w-4" />
            )}

            <input
              type="radio"
              name="our-category"
              value={cat.id}
              checked={selectedCategoryId === cat.id}
              onChange={() => setSelectedCategoryId(cat.id)}
              className="h-4 w-4 border border-gray-300 text-primary focus:ring-primary"
            />

            <span className="flex-1 text-sm text-foreground">
              {cat.name}
            </span>

            <Button
            //   variant="ghost"
              size="sm"
              className="gap-1 text-xs rounded-md"
              onClick={() => handleAddCategory(cat.id)}
            >
              <PlusCircle className="h-3 w-3" />
              Add Category
            </Button>
          </div>

          {hasChildren && isExpanded && (
            <div>{renderTree(cat.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-h-[90vh] w-full max-w-5xl overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Map Product To Category</DialogTitle>
            <DialogDescription>
              Select a category to map{" "}
              <span className="font-semibold text-foreground">
                {productName || "this product"}
              </span>{" "}
              to our catalog.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">
            {/* AI Suggestions Section */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">AI Category Suggestions</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAISuggestions}
                  disabled={aiLoading}
                  className="text-xs"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Refresh
                    </>
                  )}
                </Button>
              </div>

              {aiLoading ? (
                <div className="flex items-center gap-3 py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                  <span className="text-sm text-purple-700">Analyzing product and finding best category matches...</span>
                </div>
              ) : aiError ? (
                <div className="text-sm text-red-600 py-2">
                  {aiError}
                </div>
              ) : aiSuggestions.length > 0 ? (
                <div className="space-y-2">
                  {aiSuggestions.map((suggestion, idx) => (
                    <div
                      key={suggestion.category_id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${getConfidenceColor(suggestion.confidence)} ${
                        selectedCategoryId === suggestion.category_id ? "ring-2 ring-purple-500 ring-offset-1" : ""
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${getConfidenceBadgeColor(suggestion.confidence)}`}>
                            {suggestion.confidence}% match
                          </span>
                          <span className="font-semibold text-sm">
                            {suggestion.category_name}
                          </span>
                        </div>
                        <p className="text-xs opacity-75 mb-1">{suggestion.category_path}</p>
                        <p className="text-xs italic">{suggestion.reason}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={selectedCategoryId === suggestion.category_id ? "default" : "outline"}
                        className={`ml-3 ${selectedCategoryId === suggestion.category_id ? "bg-green-600 hover:bg-green-700" : ""}`}
                        onClick={() => handleAcceptSuggestion(suggestion.category_id)}
                      >
                        {selectedCategoryId === suggestion.category_id ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Selected
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-purple-600 py-2">
                  No AI suggestions available. Click refresh to generate suggestions.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Input
                placeholder="Search our categories..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="sm:w-72"
              />

              <Button
                variant="default"
                onClick={() => router.push("/dashboard/inventories/categorymanagement")}
              >
                Manage Category
              </Button>
            </div>

            <div className="max-h-[40vh] overflow-y-auto rounded-lg border">
              {loading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No categories found. Try adjusting your search.
                </div>
              ) : (
                <div className="divide-y">{renderTree(filteredCategories)}</div>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 px-6 pb-6 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !selectedCategoryId}
              className="w-full sm:w-auto"
            >
              {submitting ? "Mapping..." : "Map Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddCategoryModel
        open={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onSuccess={() => {
          setIsAddCategoryOpen(false);
          fetchCategories();
        }}
        categories={categories}
        preselectCategoryId={preselectCategoryId}
      />
    </>
  );
};

export default MapProductCategoryDialog;
