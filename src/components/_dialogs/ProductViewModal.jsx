"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";
import { Spinner } from "@/components/_ui/spinner";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { PencilIcon, X, RefreshCw, ChevronRight, Check, Sparkles, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import MapProductCategoryDialog from "@/components/_dialogs/MapProductCategoryDialog";

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

const ProductViewModal = ({ open, onClose, productId, onDeleteSuccess, includeDeleted }) => {
  const { request } = useAxios();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState({});
  const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [unmapLoading, setUnmapLoading] = useState({});
  const [editingPrice, setEditingPrice] = useState({});
  const [priceValues, setPriceValues] = useState({});
  const [priceLoading, setPriceLoading] = useState({});
  const [syncLoading, setSyncLoading] = useState(false);
  const [liveStockData, setLiveStockData] = useState(null);
  const [stockCheckLoading, setStockCheckLoading] = useState(false);

  // AI Suggestions state
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);
  const [aiHasFetched, setAiHasFetched] = useState(false);

  // Edit product (name, description, etc.)
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saveProductLoading, setSaveProductLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [generateDescLoading, setGenerateDescLoading] = useState(false);

  const fetchProduct = async () => {
    if (!productId) return;

    setLoading(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: `/admin/get-product-by-id?productId=${productId}${includeDeleted ? "&includeDeleted=1" : ""}`,
        authRequired: true,
      });
      if (error) throw new Error(error?.message || error);

      if (data?.success) {
        setProduct(data.data);
        console.log("Fetched product data:", data.data);

        // Automatically fetch live stock if vendor supports it
        if (data.data?.vendor_capabilities?.has_individual_syncing) {
          fetchLiveStock();
        }
      }
    } catch (err) {
      console.error("API Error:", err);
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveStock = async () => {
    setStockCheckLoading(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: `/admin/check-live-stock?productId=${productId}`,
        authRequired: true,
      });

      if (error) {
        console.warn("Live stock check failed:", error);
        setLiveStockData({ stockBySize: [], totalStock: 0, error: true });
        return;
      }

      setLiveStockData(data.data);
    } catch (err) {
      console.warn("Error checking live stock:", err);
      setLiveStockData({ stockBySize: [], totalStock: 0, error: true });
    } finally {
      setStockCheckLoading(false);
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
      setAiHasFetched(true);
    }
  };

  const handleAcceptSuggestion = async (categoryId) => {
    if (!productId || !categoryId) return;

    setAcceptingId(categoryId);
    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/map-product-directly-to-category",
        payload: {
          our_category_id: categoryId,
          product_ids: [productId],
        },
        authRequired: true,
      });

      if (error) throw new Error(error?.message || error);

      showToast("success", data?.message || "Product mapped successfully");

      // Refresh product data to show new mapping
      await fetchProduct();
      // Clear the accepted suggestion from the list
      setAiSuggestions(prev => prev.filter(s => s.category_id !== categoryId));
    } catch (err) {
      console.error("Error mapping product:", err);
      showToast("error", err.message || "Failed to map product");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleToggleProductStatus = async () => {
    if (!productId) return;
    setStatusLoading(true);
    try {
      const { data, error } = await request({
        method: "PUT",
        url: "/admin/disable-product",
        payload: {
          productId,
        },
        authRequired: true,
      });

      if (error) throw new Error(error?.message || error);

      showToast(
        "success",
        data?.message ||
        (product?.is_active ? "Product disabled successfully" : "Product enabled successfully")
      );

      setProduct((prev) =>
        prev
          ? {
            ...prev,
            is_active: !prev.is_active,
          }
          : prev
      );
    } catch (err) {
      console.error("Error updating product status:", err);
      showToast("error", err.message || "Failed to update product status");
    } finally {
      setStatusLoading(false);
    }
  };

  const toggleProductFlag = async (field, currentValue) => {
    const key = `${productId}_${field}`;
    setToggleLoading(prev => ({ ...prev, [key]: true }));
    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/manage-op-newest-products",
        payload: {
          product_id: productId,
          field,
        },
        authRequired: true,
      });

      if (error) {
        showToast("error", error || data?.message || "Failed to update");
      } else {
        showToast("success", data?.message || "Updated successfully");
        setProduct(prev => ({
          ...prev,
          [field]: !currentValue
        }));
      }
    } catch (err) {
      console.error(err);
      showToast("error", err.message || "Failed to update");
    } finally {
      setToggleLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleUnmapProduct = async (categoryId) => {
    if (!product?.id || !categoryId) return;

    setUnmapLoading(prev => ({ ...prev, [categoryId]: true }));
    try {
      const { data, error } = await request({
        method: "DELETE",
        url: "/admin/unmap-product-from-category",
        payload: {
          product_id: product.id,
          our_category_id: categoryId,
        },
        authRequired: true,
      });

      if (error) throw new Error(error?.message || error);

      showToast(
        "success",
        data?.message || "Product unmapped from category successfully"
      );

      await fetchProduct();
    } catch (err) {
      console.error("Error unmapping product:", err);
      showToast("error", err.message || "Failed to unmap product");
    } finally {
      setUnmapLoading(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  const handleRefresh = () => {
    fetchProduct();
  };

  const handleSyncProduct = async () => {
    if (!productId) return;
    setSyncLoading(true);
    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/sync-individual-product",
        payload: {
          productId,
        },
        authRequired: true,
      });

      if (error) throw new Error(error?.message || error);

      showToast("success", data?.message || "Product synced successfully");

      await fetchProduct();
    } catch (err) {
      console.error("Error syncing product:", err);
      showToast("error", err.message || "Failed to sync product");
    } finally {
      setSyncLoading(false);
    }
  };

  const handlePriceUpdate = async (variantId, type, newPrice) => {
    if (!product?.id || !variantId) return;

    const key = `${variantId}_${type}`;
    setPriceLoading(prev => ({ ...prev, [key]: true }));

    try {
      const { data, error } = await request({
        method: "PATCH",
        url: "/admin/update-product-price",
        payload: {
          type: type,
          price: parseFloat(newPrice),
          product_id: product.id,
          varient_id: variantId,
        },
        authRequired: true,
      });

      if (error) throw new Error(error?.message || error);

      showToast("success", data?.message || "Price updated successfully");

      await fetchProduct();

      setEditingPrice(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    } catch (err) {
      console.error("Error updating price:", err);
      showToast("error", err.message || "Failed to update price");
    } finally {
      setPriceLoading(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }
  };

  const handlePriceChange = (variantId, type, value) => {
    const key = `${variantId}_${type}`;
    setPriceValues(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const startEditingPrice = (variantId, type, currentValue) => {
    const key = `${variantId}_${type}`;
    setEditingPrice(prev => ({ ...prev, [key]: true }));
    setPriceValues(prev => ({
      ...prev,
      [key]: currentValue,
    }));
  };

  const cancelEditingPrice = (variantId, type) => {
    const key = `${variantId}_${type}`;
    setEditingPrice(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
    setPriceValues(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  };

  const openEditProduct = () => {
    setEditForm({
      name: product?.name ?? "",
      title: product?.title ?? "",
      short_description: product?.short_description ?? "",
      description: product?.description ?? "",
      our_description: product?.our_description ?? "",
      brand_name: product?.brand_name ?? "",
      gender: product?.gender ?? "",
      country_of_origin: product?.country_of_origin ?? product?.product_meta?.made_in ?? "",
      product_img: product?.product_img ?? "",
      product_img1: product?.product_img1 ?? "",
      product_img2: product?.product_img2 ?? "",
      product_img3: product?.product_img3 ?? "",
      product_img4: product?.product_img4 ?? "",
      product_img5: product?.product_img5 ?? "",
    });
    setIsEditingProduct(true);
  };

  const handleSaveProductEdit = async () => {
    if (!productId) return;
    setSaveProductLoading(true);
    try {
      const payload = {
        product_id: productId,
        product: {
          name: editForm.name || undefined,
          title: editForm.title || undefined,
          short_description: editForm.short_description || undefined,
          description: editForm.description || undefined,
          our_description: editForm.our_description || undefined,
          brand_name: editForm.brand_name || undefined,
          gender: editForm.gender || undefined,
          country_of_origin: editForm.country_of_origin || undefined,
          product_img: editForm.product_img || undefined,
          product_img1: editForm.product_img1 || undefined,
          product_img2: editForm.product_img2 || undefined,
          product_img3: editForm.product_img3 || undefined,
          product_img4: editForm.product_img4 || undefined,
          product_img5: editForm.product_img5 || undefined,
        },
      };
      const { data, error } = await request({
        method: "PUT",
        url: "/admin/update-product",
        payload,
        authRequired: true,
      });
      if (error) throw new Error(error?.message || error);
      showToast("success", data?.message || "Product updated (sync will not override).");
      setIsEditingProduct(false);
      await fetchProduct();
    } catch (err) {
      console.error("Error saving product:", err);
      showToast("error", err.message || "Failed to update product");
    } finally {
      setSaveProductLoading(false);
    }
  };

  const handleGenerateOurDescription = async () => {
    if (!productId) return;
    setGenerateDescLoading(true);
    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/generate-our-description",
        payload: { productId },
        authRequired: true,
      });
      if (error) throw new Error(error?.message || error);
      showToast("success", data?.message || "Our description generated.");
      await fetchProduct();
      if (data?.data?.our_description != null) {
        setEditForm((prev) => ({ ...prev, our_description: data.data.our_description }));
      }
    } catch (err) {
      showToast("error", err.message || "Failed to generate description");
    } finally {
      setGenerateDescLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productId) return;
    const confirmed = window.confirm(
      "Soft-delete this product? It will be hidden and sync will not bring it back. You can restore from DB if needed."
    );
    if (!confirmed) return;
    setDeleteLoading(true);
    try {
      const { data, error } = await request({
        method: "DELETE",
        url: "/admin/delete-product",
        payload: { product_id: productId },
        authRequired: true,
      });
      if (error) throw new Error(error?.message || error);
      showToast("success", data?.message || "Product deleted.");
      onDeleteSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error deleting product:", err);
      showToast("error", err.message || "Failed to delete product");
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    if (open && productId) {
      fetchProduct();
    }
  }, [open, productId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setProduct(null);
      setLiveStockData(null);
      setEditingPrice({});
      setPriceValues({});
      setAiSuggestions([]);
      setAiError(null);
      setAiHasFetched(false);
      setIsEditingProduct(false);
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="!max-w-[1400px] w-[98vw] sm:!w-[95vw] md:!w-[90vw] lg:!w-[85vw] xl:!w-[80vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center items-center h-[50vh]">
              <Spinner className="w-12 h-12 text-yellow-600" />
            </div>
          ) : !product ? (
            <div className="text-center text-red-600 p-10">Product not found</div>
          ) : (
            <>
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-bold pr-8">{product.name}</DialogTitle>
              </DialogHeader>

              {isEditingProduct && (
                <Card className="shadow-md border-2 border-amber-500 bg-amber-50/50">
                  <CardContent className="pt-4 space-y-4">
                    <h3 className="font-semibold text-amber-900">Edit product details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={editForm.name ?? ""}
                          onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Product name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={editForm.title ?? ""}
                          onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                          placeholder="Product title"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Short description</Label>
                        <Input
                          value={editForm.short_description ?? ""}
                          onChange={(e) => setEditForm(f => ({ ...f, short_description: e.target.value }))}
                          placeholder="Short description"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Description (vendor, HTML allowed)</Label>
                        <Textarea
                          value={editForm.description ?? ""}
                          onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="Full description"
                          rows={4}
                          className="resize-y"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <div className="flex items-center justify-between">
                          <Label>Our description (HTML)</Label>
                          {(!editForm.our_description || !editForm.our_description.trim()) && (editForm.description || editForm.short_description) && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleGenerateOurDescription}
                              disabled={generateDescLoading}
                              className="text-xs"
                            >
                              {generateDescLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                              Generate
                            </Button>
                          )}
                        </div>
                        <Textarea
                          value={editForm.our_description ?? ""}
                          onChange={(e) => setEditForm(f => ({ ...f, our_description: e.target.value }))}
                          placeholder="Our storefront description (THE DETAILS style)"
                          rows={4}
                          className="resize-y"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Brand</Label>
                        <Input
                          value={editForm.brand_name ?? ""}
                          onChange={(e) => setEditForm(f => ({ ...f, brand_name: e.target.value }))}
                          placeholder="Brand name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Input
                          value={editForm.gender ?? ""}
                          onChange={(e) => setEditForm(f => ({ ...f, gender: e.target.value }))}
                          placeholder="e.g. men, women, unisex"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Country of origin</Label>
                        <Input
                          value={editForm.country_of_origin ?? ""}
                          onChange={(e) => setEditForm(f => ({ ...f, country_of_origin: e.target.value }))}
                          placeholder="Country of origin"
                        />
                      </div>
                      {["product_img", "product_img1", "product_img2", "product_img3", "product_img4", "product_img5"].map((key, i) => (
                        <div key={key} className="space-y-2 md:col-span-2">
                          <Label>Image URL {i === 0 ? "(main)" : i}</Label>
                          <Input
                            value={editForm[key] ?? ""}
                            onChange={(e) => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                            placeholder={`Image ${i + 1} URL`}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleSaveProductEdit}
                        disabled={saveProductLoading}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        {saveProductLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Save changes
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditingProduct(false)} disabled={saveProductLoading}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                <Card className="shadow-md border border-yellow-600">
                  <CardContent className="space-y-3 pt-4">
                    <div className="flex justify-between items-center gap-3 flex-wrap border-b pb-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          className="cursor-pointer"
                          checked={!!product?.is_active}
                          disabled={statusLoading}
                          onCheckedChange={handleToggleProductStatus}
                        />
                        <span className="text-sm font-medium">
                          {product?.is_active ? "Status: Enabled" : "Status: Disabled"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={isEditingProduct ? () => setIsEditingProduct(false) : openEditProduct}
                        >
                          <PencilIcon className="w-4 h-4 mr-2" />
                          {isEditingProduct ? "Cancel edit" : "Edit product"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setIsMappingDialogOpen(true)}
                        >
                          Category Mapping
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleRefresh}
                          variant="outline"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh
                        </Button>
                        {product?.vendor_capabilities?.has_individual_syncing && (
                          <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            size="sm"
                            onClick={handleSyncProduct}
                            disabled={syncLoading}
                          >
                            <RefreshCw className={`w-4 h-4 mr-2 ${syncLoading ? 'animate-spin' : ''}`} />
                            {syncLoading ? 'Syncing...' : 'Sync This'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleDeleteProduct}
                          disabled={deleteLoading}
                          title="Soft-delete product (sync will not restore it)"
                        >
                          {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                          Delete
                        </Button>
                      </div>
                    </div>

                    {product.title && <p className="text-gray-600 text-sm">{product.title}</p>}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-gray-50 p-3 rounded-md">
                      <p className="text-black">
                        <strong>Category:</strong>{" "}
                        {product.categories?.[0]?.name ||
                          product.attributes?.category_path ||
                          "N/A"}
                      </p>
                      <p className="text-black"><strong>Brand:</strong> {product.brand_name || "N/A"}</p>
                      <p className="text-black"><strong>Vendor:</strong> {product.vendor_name || "N/A"}</p>
                      <p className="text-black">
                        <strong>Country:</strong>{" "}
                        {product.country_of_origin ||
                          product.product_meta?.made_in ||
                          "N/A"}
                      </p>
                      <p className="text-black">
                        <strong>Gender:</strong>{" "}
                        {product.gender ||
                          product.attributes?.gender ||
                          product.product_meta?.product_feature_map?.gender ||
                          "N/A"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 bg-blue-50 p-2 rounded-md">
                      <div className="flex items-center gap-2">
                        <Switch
                          className="cursor-pointer data-[state=checked]:bg-yellow-500"
                          checked={!!product?.is_newest}
                          disabled={!!toggleLoading[`${productId}_is_newest`]}
                          onCheckedChange={() => toggleProductFlag("is_newest", !!product?.is_newest)}
                        />
                        <span className="text-xs font-medium">Newest product</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          className="cursor-pointer"
                          checked={!!product?.is_our_picks}
                          disabled={!!toggleLoading[`${productId}_is_our_picks`]}
                          onCheckedChange={() => toggleProductFlag("is_our_picks", !!product?.is_our_picks)}
                        />
                        <span className="text-xs font-medium">Our Picks</span>
                      </div>
                    </div>

                    {(() => {
                      const categories = product?.mapped_categories
                        ? product.mapped_categories
                        : product?.mapped_category
                          ? [product.mapped_category]
                          : [];
                      const mappedIds = new Set(categories.map((c) => c.id));

                      return (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h2 className="font-semibold text-black text-sm">
                            {categories.length > 1 ? "Mapped Categories:" : "Mapped Category:"}
                            </h2>
                            {!aiHasFetched ? (
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
                                    Show suggestion
                                  </>
                                )}
                              </Button>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {categories.length === 0 && (
                              <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-600">
                                No mapped category yet
                              </div>
                            )}
                            {categories.map((category) => (
                              <div
                                key={category.id}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-400 rounded-lg text-sm"
                              >
                                <div className="flex flex-col gap-1">
                                  <span className="font-semibold text-yellow-900">{category.name}</span>
                                  <div className="flex items-center gap-1 text-xs text-yellow-800">
                                    <span className="font-medium opacity-75">Path:</span>
                                    {category.path ? (
                                      <span className="flex items-center gap-1">
                                        {category.path.split('/').map((segment, idx, arr) => (
                                          <span key={idx} className="flex items-center">
                                            <span className="text-yellow-700 font-medium capitalize">{segment}</span>
                                            {idx < arr.length - 1 && (
                                              <ChevronRight className="h-3 w-3 mx-1 text-yellow-600" />
                                            )}
                                          </span>
                                        ))}
                                      </span>
                                    ) : (
                                      <span className="text-yellow-600 italic">N/A</span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleUnmapProduct(category.id)}
                                  disabled={unmapLoading[category.id]}
                                  className="p-1 rounded-full hover:bg-yellow-200 transition-all disabled:opacity-50 cursor-pointer"
                                  title="Remove category mapping"
                                >
                                  <X className="h-4 w-4 text-yellow-700" />
                                </button>
                              </div>
                            ))}

                            {aiHasFetched && aiLoading && (
                              <div className="inline-flex items-center gap-2 px-3 py-2 bg-pink-50 border-2 border-pink-300 rounded-lg text-sm">
                                <Loader2 className="h-4 w-4 animate-spin text-pink-600" />
                                <span className="text-pink-700 text-xs">Analyzing suggestions...</span>
                              </div>
                            )}
                            {aiHasFetched && !aiLoading && aiError && (
                              <div className="inline-flex items-center gap-2 px-3 py-2 bg-pink-50 border-2 border-pink-300 rounded-lg text-sm">
                                <span className="text-pink-700 text-xs">{aiError}</span>
                              </div>
                            )}
                            {aiHasFetched && !aiLoading && aiSuggestions.length > 0 && (
                              [...aiSuggestions]
                                .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
                                .map((suggestion) => {
                                const isAlreadyMapped = mappedIds.has(suggestion.category_id);
                                const containerClass = isAlreadyMapped
                                  ? "bg-gradient-to-r from-green-50 to-green-100 border-green-400"
                                  : "bg-gradient-to-r from-pink-50 to-pink-100 border-pink-400";
                                const badgeClass = isAlreadyMapped ? "bg-green-600" : "bg-pink-500";
                                const textClass = isAlreadyMapped ? "text-green-900" : "text-pink-900";
                                const pathClass = isAlreadyMapped ? "text-green-800" : "text-pink-800";
                                const pathSegmentClass = isAlreadyMapped ? "text-green-700" : "text-pink-700";
                                const chevronClass = isAlreadyMapped ? "text-green-600" : "text-pink-600";
                                const reasonClass = isAlreadyMapped ? "text-[11px] italic text-green-700" : "text-[11px] italic text-pink-700";
                                return (
                                  <div
                                    key={suggestion.category_id}
                                    className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-lg text-sm ${containerClass}`}
                                  >
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${badgeClass}`}>
                                          {suggestion.confidence}%
                                        </span>
                                        <span className={`font-semibold ${textClass}`}>
                                          {suggestion.category_name}
                                        </span>
                                        {isAlreadyMapped && (
                                          <span className="text-[11px] font-semibold text-green-700">
                                            Already mapped
                                          </span>
                                        )}
                                      </div>
                                      <div className={`flex items-center gap-1 text-xs ${pathClass}`}>
                                        <span className="font-medium opacity-75">Path:</span>
                                        {suggestion.category_path ? (
                                          <span className="flex items-center gap-1">
                                            {suggestion.category_path.split(" > ").map((segment, idx, arr) => (
                                              <span key={idx} className="flex items-center">
                                                <span className={`font-medium capitalize ${pathSegmentClass}`}>{segment}</span>
                                                {idx < arr.length - 1 && (
                                                  <ChevronRight className={`h-3 w-3 mx-1 ${chevronClass}`} />
                                                )}
                                              </span>
                                            ))}
                                          </span>
                                        ) : (
                                          <span className="italic">N/A</span>
                                        )}
                                      </div>
                                      {suggestion.reason && (
                                        <span className={reasonClass}>{suggestion.reason}</span>
                                      )}
                                    </div>
                                    {!isAlreadyMapped && (
                                      <Button
                                        size="sm"
                                        className="ml-2 bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => handleAcceptSuggestion(suggestion.category_id)}
                                        disabled={acceptingId === suggestion.category_id}
                                      >
                                        {acceptingId === suggestion.category_id ? (
                                          <>
                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                            Mapping...
                                          </>
                                        ) : (
                                          <>
                                            <Check className="h-4 w-4 mr-1" />
                                            Accept
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                );
                              })
                            )}
                            {aiHasFetched && !aiLoading && aiSuggestions.length === 0 && !aiError && (
                              <div className="inline-flex items-center gap-2 px-3 py-2 bg-pink-50 border-2 border-pink-300 rounded-lg text-sm">
                                <span className="text-pink-700 text-xs">
                                  No suggestions found. Try again or check vendor category/path.
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {product.description && (
                      <div className="border-t pt-3">
                        <h2 className="font-semibold text-black mb-2 text-sm">Description (from vendor):</h2>
                        <div
                          className="text-gray-700 text-xs leading-relaxed max-h-32 overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: product.description }}
                        />
                      </div>
                    )}

                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="font-semibold text-black text-sm">Our description:</h2>
                        {(!product.our_description || !product.our_description.trim()) && (product.description || product.short_description) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateOurDescription}
                            disabled={generateDescLoading}
                            className="text-xs"
                          >
                            {generateDescLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                            Generate description
                          </Button>
                        )}
                      </div>
                      {product.our_description && product.our_description.trim() ? (
                        <div
                          className="text-gray-700 text-xs leading-relaxed max-h-40 overflow-y-auto border border-slate-200 rounded p-2 bg-slate-50"
                          dangerouslySetInnerHTML={{ __html: product.our_description }}
                        />
                      ) : (
                        <p className="text-slate-500 text-xs italic">Not set. Use “Generate description” or edit below.</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                      {product.product_img && (
                        <div className="relative w-full h-40">
                          <Image
                            width={100}
                            height={100}
                            src={product.product_img}
                            alt={product.name}
                            className="object-cover rounded-md shadow-md"
                          />
                        </div>
                      )}
                    </div>

                    {product.variants?.length > 0 && (
                      <div className="border-t pt-3">
                        <h2 className="font-semibold mb-2 text-black text-sm">Variants:</h2>
                        <div className="overflow-x-auto -mx-4 px-4">
                          <table className="w-full border border-gray-300 text-left text-xs min-w-[800px]">
                          <thead className="bg-yellow-600 text-white">
                            <tr>
                              <th rowSpan={2} className="px-2 py-1 border">SKU</th>
                              <th colSpan={2} className="px-2 py-1 border bg-black">Aayeu</th>
                              <th colSpan={2} className="px-2 py-1 border bg-gray-800">Vendor</th>
                              <th rowSpan={2} className="px-2 py-1 border">Markup %</th>
                              <th colSpan={3} className="px-2 py-1 border">Variants</th>
                            </tr>
                            <tr>
                              <th className="px-2 py-1 border bg-black">MRP</th>
                              <th className="px-2 py-1 border bg-black">Price</th>
                              <th className="px-2 py-1 border bg-gray-700">MRP</th>
                              <th className="px-2 py-1 border bg-gray-600">Price</th>
                              <th className="px-2 py-1 border">Color</th>
                              <th className="px-2 py-1 border">Size</th>
                              <th className="px-2 py-1 border">Stock</th>
                            </tr>
                          </thead>
                          <tbody>
                            {product.variants.map((v) => {
                              const mrpKey = `${v.id}_mrp`;
                              const priceKey = `${v.id}_price`;
                              const isEditingMrp = editingPrice[mrpKey];
                              const isEditingPrice = editingPrice[priceKey];
                              const mrpLoading = priceLoading[mrpKey];
                              const isPriceLoading = priceLoading[priceKey];

                              const markup = (v.price && v.vendorsaleprice && v.vendorsaleprice > 0)
                                ? (((v.price / v.vendorsaleprice) - 1) * 100).toFixed(2)
                                : "0.00";

                              return (
                                <tr key={v.id} className="even:bg-gray-50">
                                  <td className="px-2 py-1 border text-xs">{v.sku || "N/A"}</td>

                                  <td className="px-2 py-1 border">
                                    {isEditingMrp ? (
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={priceValues[mrpKey] !== undefined ? priceValues[mrpKey] : v.mrp}
                                          onChange={(e) => handlePriceChange(v.id, "mrp", e.target.value)}
                                          className="w-16 h-6 text-xs"
                                          disabled={mrpLoading}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              const value = priceValues[mrpKey] !== undefined ? priceValues[mrpKey] : v.mrp;
                                              if (value && value !== "") {
                                                handlePriceUpdate(v.id, "mrp", value);
                                              }
                                            } else if (e.key === "Escape") {
                                              cancelEditingPrice(v.id, "mrp");
                                            }
                                          }}
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => {
                                            const value = priceValues[mrpKey] !== undefined ? priceValues[mrpKey] : v.mrp;
                                            if (value && value !== "") {
                                              handlePriceUpdate(v.id, "mrp", value);
                                            }
                                          }}
                                          disabled={mrpLoading}
                                          className="p-0.5 text-green-600 hover:text-green-700"
                                        >
                                          <Check className="h-3 w-3" />
                                        </button>
                                        <button
                                          onClick={() => cancelEditingPrice(v.id, "mrp")}
                                          disabled={mrpLoading}
                                          className="p-0.5 text-red-600 hover:text-red-700"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div
                                        className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 rounded px-1 group"
                                        onClick={() => startEditingPrice(v.id, "mrp", v.mrp)}
                                      >
                                        <span>€{v.mrp}</span>
                                        <PencilIcon className="h-2 w-2 text-gray-400 opacity-0 group-hover:opacity-100" />
                                      </div>
                                    )}
                                  </td>

                                  <td className="px-2 py-1 border bg-green-600">
                                    {isEditingPrice ? (
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={priceValues[priceKey] !== undefined ? priceValues[priceKey] : v.price}
                                          onChange={(e) => handlePriceChange(v.id, "price", e.target.value)}
                                          className="w-16 h-6 text-xs"
                                          disabled={isPriceLoading}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              const value = priceValues[priceKey] !== undefined ? priceValues[priceKey] : v.price;
                                              if (value && value !== "") {
                                                handlePriceUpdate(v.id, "price", value);
                                              }
                                            } else if (e.key === "Escape") {
                                              cancelEditingPrice(v.id, "price");
                                            }
                                          }}
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => {
                                            const value = priceValues[priceKey] !== undefined ? priceValues[priceKey] : v.price;
                                            if (value && value !== "") {
                                              handlePriceUpdate(v.id, "price", value);
                                            }
                                          }}
                                          disabled={isPriceLoading}
                                          className="p-0.5 text-green-600 hover:text-green-700"
                                        >
                                          <Check className="h-3 w-3" />
                                        </button>
                                        <button
                                          onClick={() => cancelEditingPrice(v.id, "price")}
                                          disabled={isPriceLoading}
                                          className="p-0.5 text-red-600 hover:text-red-700"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div
                                        className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 rounded px-1 group"
                                        onClick={() => startEditingPrice(v.id, "price", v.price)}
                                      >
                                        <span>€{v.price}</span>
                                        <PencilIcon className="h-2 w-2 text-gray-400 opacity-0 group-hover:opacity-100" />
                                      </div>
                                    )}
                                  </td>

                                  <td className="px-2 py-1 border">€{v.vendormrp || v.vendor_mrp || "N/A"}</td>
                                  <td className="px-2 py-1 border">€{v.vendorsaleprice || v.vendor_sale_price || "N/A"}</td>
                                  <td className="px-2 py-1 border">
                                    <span className="font-semibold text-blue-600">{markup}%</span>
                                  </td>
                                  <td className="px-2 py-1 border">{v.variant_color || "N/A"}</td>
                                  <td className="px-2 py-1 border">{v.variant_size || "N/A"}</td>
                                  <td className="px-2 py-1 border">
                                    {product?.vendor_capabilities?.has_individual_syncing ? (
                                      stockCheckLoading ? (
                                        <div className="h-3 w-10 bg-gray-200 animate-pulse rounded"></div>
                                      ) : liveStockData ? (
                                        (() => {
                                          const variantSize = v.variant_size?.toLowerCase();
                                          const sizeStock = variantSize
                                            ? liveStockData.stockBySize?.find(
                                                (s) => s.size?.toLowerCase() === variantSize
                                              )
                                            : liveStockData.stockBySize?.find(
                                                (s) =>
                                                  s.size?.toLowerCase() === "n/a" ||
                                                  s.size?.toLowerCase() === "na"
                                              );
                                          const fallbackTotal =
                                            liveStockData.totalStock ??
                                            sizeStock?.quantity ??
                                            v.stock;
                                          return (
                                            <span className="font-medium text-green-600">
                                              {sizeStock?.quantity ?? fallbackTotal ?? 0}
                                            </span>
                                          );
                                        })()
                                      ) : (
                                        <span className="text-gray-400">{v.stock}</span>
                                      )
                                    ) : (
                                      v.stock
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Category Mapping Dialog */}
      <MapProductCategoryDialog
        open={isMappingDialogOpen}
        onClose={() => setIsMappingDialogOpen(false)}
        productId={productId}
        productName={product?.name}
        initialCategoryId={product?.categories?.[0]?.id}
        onSuccess={() => {
          fetchProduct();
        }}
      />
    </>
  );
};

export default ProductViewModal;
