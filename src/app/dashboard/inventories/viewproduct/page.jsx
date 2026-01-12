"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils"; // shadcn toast
import { Spinner } from "@/components/_ui/spinner"; // shadcn spinner
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Switch } from "@/components/ui/switch";
import { PencilIcon, PencilOffIcon, X, RefreshCw, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MapProductCategoryDialog from "@/components/_dialogs/MapProductCategoryDialog";
// import UpdateProductModal from "@/components/_dialogs/UpdateProduct";



const ViewProduct = () => {

  const fetchedRef = useRef(false);
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");

  const { request } = useAxios();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
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


  const fetchProduct = async () => {
    try {
      const { data, error } = await request({
        method: "GET",
        url: `/admin/get-product-by-id?productId=${productId}`,
        authRequired: true,
      });
      if (error) throw new Error(error?.message || error);

      if (data?.success) {
        setProduct(data.data);
        console.log("Fetched product data:", data.data);
        showToast("success", data.message);

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

  // Fetch live stock automatically (separated from user action)
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
        // Set stock to 0 on error
        setLiveStockData({ stockBySize: [], totalStock: 0, error: true });
        return;
      }

      setLiveStockData(data.data);
    } catch (err) {
      console.warn("Error checking live stock:", err);
      // Set stock to 0 on error
      setLiveStockData({ stockBySize: [], totalStock: 0, error: true });
    } finally {
      setStockCheckLoading(false);
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

  // Toggle product flags (is_newest/is_our_picks)
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
        // Update local state to reflect changed flag
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

  // Unmap product from category
  const handleUnmapProduct = async (categoryId) => {
    if (!product?.id || !categoryId) return;

    setUnmapLoading(prev => ({ ...prev, [categoryId]: true }));
    try {
      const { data, error } = await request({
        method: "DELETE",
        url: "/admin/unmap-product-from-category",
        params: {
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

      // Refresh product data to remove mapped_category
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

  // Handle individual product sync
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

      // Refresh product data after sync
      await fetchProduct();
      // Live stock will be auto-fetched by fetchProduct
    } catch (err) {
      console.error("Error syncing product:", err);
      showToast("error", err.message || "Failed to sync product");
    } finally {
      setSyncLoading(false);
    }
  };

  // Handle price update
  const handlePriceUpdate = async (variantId, type, newPrice) => {
    if (!product?.id || !variantId) return;

    const key = `${variantId}_${type}`;
    setPriceLoading(prev => ({ ...prev, [key]: true }));

    try {
      // Handle mrp and price
      const { data, error } = await request({
        method: "PATCH",
        url: "/admin/update-product-price",
        payload: {
          type: type, // either "mrp" or "price"
          price: parseFloat(newPrice),
          product_id: product.id,
          varient_id: variantId,
        },
        authRequired: true,
      });

      if (error) throw new Error(error?.message || error);

      showToast("success", data?.message || "Price updated successfully");

      // Refresh product data
      await fetchProduct();

      // Exit edit mode
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

  // Handle price input change
  const handlePriceChange = (variantId, type, value) => {
    const key = `${variantId}_${type}`;
    setPriceValues(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Start editing price
  const startEditingPrice = (variantId, type, currentValue) => {
    const key = `${variantId}_${type}`;
    setEditingPrice(prev => ({ ...prev, [key]: true }));
    setPriceValues(prev => ({
      ...prev,
      [key]: currentValue,
    }));
  };

  // Cancel editing
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

  useEffect(() => {
    if (!productId || fetchedRef.current) return;
    fetchedRef.current = true;
    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Spinner className="w-12 h-12 text-yellow-600" />
      </div>
    );
  }

  if (!product) {
    return <div className="text-center text-red-600 mt-10">Product not found</div>;
  }

  return (
    <div className="p-4">
      <CustomBreadcrumb />
      <div className="mt-4">
        <Card className="shadow-lg border border-yellow-600">
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold text-black">{product.name}</h1>
                </div>              
                  </div>
              <div>
                <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      className="cursor-pointer "
                      checked={!!product?.is_active}
                      disabled={statusLoading}
                      onCheckedChange={handleToggleProductStatus}
                    />
                    <span className="text-sm font-medium">
                      {product?.is_active ? "Status: Enabled" : "Status: Disabled"}
                    </span>
                  </div>
                  <Button
                    className="rounded-md"
                    //  variant="outline"
                    size="lg"
                    onClick={() => setIsMappingDialogOpen(true)}>
                    Category Mapping
                  </Button>
                  <Button
                    className="rounded-md"
                    size="lg"
                    onClick={handleRefresh}
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  {product?.vendor_capabilities?.has_individual_syncing && (
                    <Button
                      className="rounded-md bg-blue-600 hover:bg-blue-700"
                      size="lg"
                      onClick={handleSyncProduct}
                      disabled={syncLoading}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${syncLoading ? 'animate-spin' : ''}`} />
                      {syncLoading ? 'Syncing...' : 'Sync This'}
                    </Button>
                  )}
                  {/* <UpdateProductModal product={product} onSuccess={fetchProduct} />  */}
                </div>
              </div>
            </div>
            <p className="text-gray-600">{product.title}</p>

            <div className="flex flex-wrap gap-4">
              <p className="text-black"><strong>Category:</strong> {product.categories?.[0]?.name || "N/A"}</p>
              <p className="text-black"><strong>Brand:</strong> {product.brand_name || "N/A"}</p>
              <p className="text-black"><strong>Vendor:</strong> {product.vendor_name || "N/A"}</p>
              {/* <p className="text-black"><strong>Min Price:</strong> €{product.min_price || "N/A"}</p>
              <p className="text-black"><strong>Max Price:</strong> €{product.max_price || "N/A"}</p> */}
              <p className="text-black"><strong>Country:</strong> {product.country_of_origin || "N/A"}</p>
            </div>

            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  className="cursor-pointer data-[state=checked]:bg-yellow-500 data-[state=checked]:hover:bg-yellow-500/90"
                  checked={!!product?.is_newest}
                  disabled={!!toggleLoading[`${productId}_is_newest`]}
                  onCheckedChange={async () => {
                    await toggleProductFlag("is_newest", !!product?.is_newest);
                  }}
                />
                <span className="text-sm">Newest product</span>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  className="cursor-pointer"
                  checked={!!product?.is_our_picks}
                  disabled={!!toggleLoading[`${productId}_is_our_picks`]}
                  onCheckedChange={async () => {
                    await toggleProductFlag("is_our_picks", !!product?.is_our_picks);
                  }}
                />
                <span className="text-sm">Our Picks</span>
              </div>
            </div>

            {(() => {
              // Support both mapped_categories (array) and mapped_category (single object) for backward compatibility
              const categories = product?.mapped_categories 
                ? product.mapped_categories 
                : product?.mapped_category 
                  ? [product.mapped_category] 
                  : [];
              
              if (categories.length === 0) return null;
              
              return (
                <div className="mt-3">
                  <h2 className="font-semibold text-black mb-2">
                    {categories.length > 1 ? "Mapped Categories:" : "Mapped Category:"}
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="inline-flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-400 rounded-lg shadow-md hover:shadow-lg transition-all"
                      >
                        <div className="flex flex-col gap-1.5">
                          <span className="font-semibold text-yellow-900 text-base">{category.name}</span>
                          <div className="flex items-center gap-1.5 text-xs text-yellow-800">
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
                          className="ml-1 p-1.5 rounded-full hover:bg-yellow-200 active:bg-yellow-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group flex-shrink-0"
                          aria-label="Unmap category"
                          title="Remove category mapping"
                        >
                          <X className="h-4 w-4 text-yellow-700 group-hover:text-yellow-900 transition-colors" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div>
              <h2 className="font-semibold text-black mb-1">Description:</h2>
              <div
                className="text-gray-700"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
              <p className="text-gray-500">{product.short_description}</p>
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
              {product.variants?.[0]?.images?.map((img, idx) => (
                <div key={idx} className="relative w-full h-40">
                  <Image
                    width={100}
                    height={100}
                    src={img}
                    alt={`${product.name} variant`}
                    className="object-cover rounded-md shadow-md"
                  />
                </div>
              ))}
            </div>

            {product.variants?.length > 0 && (
              <div className="mt-6 overflow-x-auto">
                <h2 className="font-semibold mb-2 text-black">Variants:</h2>
                <table className="w-full border-3 border-gray-300 text-left">
                  <thead className="bg-yellow-600 text-white">
                    <tr>
                      <th rowSpan={2} className="px-3 py-2 border">SKU</th>
                      <th colSpan={2} className="px-3 py-2 border bg-black">Aayeu</th>
                      <th colSpan={2} className="px-3 py-2 border bg-gray-800">Vendor</th>
                      <th rowSpan={2} className="px-3 py-2 border">Markup %</th>
                      <th colSpan={3} className="px-3 py-2 border">Variants</th>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 border bg-black">MRP</th>
                      <th className="px-3 py-2 border bg-black">Price</th>
                      <th className="px-3 py-2 border bg-gray-700">MRP</th>
                      <th className="px-3 py-2 border bg-gray-600">price</th>
                      <th className="px-3 py-2 border">Variant Color</th>
                      <th className="px-3 py-2 border">Variant Size</th>
                      <th className="px-3 py-2 border">Stock</th>
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

                      // Calculate markup percentage for display
                      const markup = (v.price && v.vendorsaleprice && v.vendorsaleprice > 0)
                        ? (((v.price / v.vendorsaleprice) - 1) * 100).toFixed(2)
                        : "0.00";
                      
                      return (
                        <tr key={v.id} className="even:bg-gray-50">
                          <td className="px-3 py-2 border">{v.sku || "N/A"}</td>
                          
                          {/* Our MRP - Editable */}
                          <td className="px-3 py-2 border">
                            {isEditingMrp ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={priceValues[mrpKey] !== undefined ? priceValues[mrpKey] : v.mrp}
                                  onChange={(e) => handlePriceChange(v.id, "mrp", e.target.value)}
                                  className="w-20 h-8 text-sm"
                                  disabled={mrpLoading}
                                  onFocus={(e) => {
                                    setTimeout(() => {
                                      e.target.select();
                                    }, 0);
                                  }}
                                  onClick={(e) => {
                                    e.target.select();
                                  }}
                                  onWheel={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.target.blur();
                                  }}
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
                                  disabled={mrpLoading || !priceValues[mrpKey] || priceValues[mrpKey] === ""}
                                  className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                                  title="Save"
                                >
                                  <Check className="h-4 w-4 cursor-pointer" />
                                </button>
                                <button
                                  onClick={() => cancelEditingPrice(v.id, "mrp")}
                                  disabled={mrpLoading}
                                  className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                                  title="Cancel"
                                >
                                  <X className="h-4 w-4 cursor-pointer" />
                                </button>
                              </div>
                            ) : (
                              <div 
                                className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 group"
                                onClick={() => startEditingPrice(v.id, "mrp", v.mrp)}
                                title="Click to edit"
                              >
                                <span>€{v.mrp}</span>
                                <PencilIcon className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            )}
                          </td>

                          {/* Our Price - Editable */}
                          <td className="px-3 py-2 border bg-green-600">
                            {isEditingPrice ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={priceValues[priceKey] !== undefined ? priceValues[priceKey] : v.price}
                                  onChange={(e) => handlePriceChange(v.id, "price", e.target.value)}
                                  className="w-20 h-8 text-sm"
                                  disabled={isPriceLoading}
                                  onFocus={(e) => {
                                    setTimeout(() => {
                                      e.target.select();
                                    }, 0);
                                  }}
                                  onClick={(e) => {
                                    e.target.select();
                                  }}
                                  onWheel={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.target.blur();
                                  }}
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
                                  disabled={isPriceLoading || !priceValues[priceKey] || priceValues[priceKey] === ""}
                                  className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                                  title="Save"
                                >
                                  <Check className="h-4 w-4 cursor-pointer" />
                                </button>
                                <button
                                  onClick={() => cancelEditingPrice(v.id, "price")}
                                  disabled={isPriceLoading}
                                  className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                                  title="Cancel"
                                >
                                  <X className="h-4 w-4 cursor-pointer" />
                                </button>
                              </div>
                            ) : (
                              <div
                                className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 group"
                                onClick={() => startEditingPrice(v.id, "price", v.price)}
                                title="Click to edit"
                              >
                                <span>€{v.price}</span>
                                <PencilIcon className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            )}
                          </td>

                          <td className="px-3 py-2 border">€{v.vendormrp || v.vendor_mrp || "N/A"}</td>
                          <td className="px-3 py-2 border">€{v.vendorsaleprice || v.vendor_sale_price || "N/A"}</td>

                          {/* Markup Percent - Display Only (Calculated) */}
                          <td className="px-3 py-2 border">
                            <span className="font-semibold text-blue-600">{markup}%</span>
                          </td>

                          <td className="px-3 py-2 border">{v.variant_color || "N/A"}</td>
                          <td className="px-3 py-2 border">{v.variant_size || "N/A"}</td>
                          <td className="px-3 py-2 border">
                            {product?.vendor_capabilities?.has_individual_syncing ? (
                              stockCheckLoading ? (
                                <div className="flex items-center gap-2">
                                  <div className="h-4 w-12 bg-gray-200 animate-pulse rounded"></div>
                                </div>
                              ) : liveStockData ? (
                                (() => {
                                  const sizeStock = liveStockData.stockBySize?.find(
                                    s => s.size?.toLowerCase() === v.variant_size?.toLowerCase()
                                  );
                                  return (
                                    <span className="font-medium text-green-600">
                                      {sizeStock?.quantity ?? 0}
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
            )}
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
};

export default ViewProduct;

