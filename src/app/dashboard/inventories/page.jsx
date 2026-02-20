"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Button } from "@/components/ui/button";
import useAxios from "@/hooks/useAxios";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/_ui/toast-utils";
import { debounce } from "lodash";
import { Check, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import ROUTE_PATH from "@/libs/route-path";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateProductSlug } from "@/utils/utilities";
import ProductViewModal from "@/components/_dialogs/ProductViewModal";

export default function InventoryPage() {
  const router = useRouter();
  const { request } = useAxios();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyRefresh, setKeyRefresh] = useState(0);
  const [categories, setCategories] = useState([]);
  const [localMin, setLocalMin] = useState("");
  const [localMax, setLocalMax] = useState("");
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [jumpToPage, setJumpToPage] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [aiSuggestionsByProduct, setAiSuggestionsByProduct] = useState({});
  const [aiLoadingByProduct, setAiLoadingByProduct] = useState({});
  const [bulkAcceptLoading, setBulkAcceptLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    mapped: 0,
    inactive: 0,
  });
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState(new Set());
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const selectAllCheckboxRef = useRef(null);

  const [state, setState] = useState({
    searchValue: "",
    searchQuery: "",

    currentPage: 1,
    totalPages: 1,
    keyRefresh: 0,
    localminprice: "",
    localmaxprice: "", // 👈 added filters
    filters: {
      gender: "",
      category: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      vendorId: "",
      mappingStatus: "all", // all, mapped, unmapped
    },
  });

  // Vendors dropdown state
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  const normalizeGenderValue = (value) => {
    if (!value) return null;
    const normalized = String(value).trim().toLowerCase();
    if (["man", "men", "mens"].includes(normalized)) return "men";
    if (["woman", "women", "womens", "ladies"].includes(normalized)) return "women";
    if (["boy", "boys"].includes(normalized)) return "boys";
    if (["girl", "girls"].includes(normalized)) return "girls";
    if (["kids", "children", "child"].includes(normalized)) return "kids";
    if (normalized.includes("unisex")) return "unisex";
    return normalized;
  };

  const formatGenderLabel = (value) => {
    if (!value) return "";
    if (value === "men") return "Men";
    if (value === "women") return "Women";
    if (value === "boys") return "Boys";
    if (value === "girls") return "Girls";
    if (value === "kids") return "Kids";
    if (value === "unisex") return "Unisex";
    return value;
  };

  // 🏷️ Fetch Products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      let endpoint = `/admin/get-products?page=${currentPage}`;

      // Search
      if (searchQuery) endpoint += `&q=${searchQuery}`;

      // Filters
      const { gender, category, brand, minPrice, maxPrice, vendorId } =
        state.filters;

      if (gender && gender !== "all") endpoint += `&gender=${gender}`;
      if (category && category !== "all") endpoint += `&category_path=${encodeURIComponent(category)}`;
      if (brand && brand !== "all") endpoint += `&brand=${brand}`;
      if (minPrice) endpoint += `&min_price=${Number(minPrice)}`;
      if (maxPrice) endpoint += `&max_price=${Number(maxPrice)}`;
      if (vendorId && vendorId !== "all") endpoint += `&vendor_id=${vendorId}`;

      const { data, error } = await request({
        method: "GET",
        url: endpoint,
        authRequired: true,
      });

      if (error) throw new Error(error?.message || error);
      setProducts(data?.data?.products || []);

      // Categories are now loaded separately on mount, don't overwrite them

      setTotalPages(data?.data?.total_pages || 1);
      setStats({
        total: data?.data?.total || 0,
        mapped: data?.data?.mapped_total || 0,
        inactive: data?.data?.inactive_total || 0,
      });
    } catch (err) {
      console.error("Error fetching products:", err);
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Refresh
  const handleRefresh = () => setKeyRefresh((prev) => prev + 1);

  const fetchSuggestionForProduct = async (productId) => {
    if (!productId) return;
    if (aiLoadingByProduct[productId] || aiSuggestionsByProduct.hasOwnProperty(productId)) {
      return;
    }

    setAiLoadingByProduct((prev) => ({ ...prev, [productId]: true }));
    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/ai-category-suggestions",
        payload: { productId },
        authRequired: true,
      });
      if (error) throw new Error(error?.message || error);
      const suggestion = Array.isArray(data?.data?.suggestions) && data.data.suggestions.length > 0
        ? [...data.data.suggestions].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0]
        : null;
      setAiSuggestionsByProduct((prev) => ({ ...prev, [productId]: suggestion }));
      if (suggestion?.category_id) {
        setSelectedSuggestionIds((prev) => {
          const next = new Set(prev);
          next.add(productId);
          return next;
        });
      }
    } catch (err) {
      setAiSuggestionsByProduct((prev) => ({ ...prev, [productId]: null }));
    } finally {
      setAiLoadingByProduct((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleAcceptSuggestion = async (productId, categoryId) => {
    if (!productId || !categoryId) return;
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
      handleRefresh();
    } catch (err) {
      showToast("error", err?.message || "Failed to map product");
    }
  };

  const handleBulkAcceptSuggestions = async () => {
    if (bulkAcceptLoading) return;

    const eligible = products.filter((p) => {
      const hasSuggestion = aiSuggestionsByProduct[p.id]?.category_id;
      const isUnmapped = !(p.mapped_category || p.mapped_categories?.length > 0);
      const isSelected = selectedSuggestionIds.has(p.id);
      return isUnmapped && hasSuggestion && isSelected;
    });

    if (eligible.length === 0) {
      showToast("error", "Select at least one suggestion to accept.");
      return;
    }

    const grouped = eligible.reduce((acc, product) => {
      const suggestion = aiSuggestionsByProduct[product.id];
      if (!suggestion?.category_id) return acc;
      if (!acc[suggestion.category_id]) acc[suggestion.category_id] = [];
      acc[suggestion.category_id].push(product.id);
      return acc;
    }, {});

    setBulkAcceptLoading(true);
    try {
      const entries = Object.entries(grouped);
      for (const [categoryId, productIds] of entries) {
        const { error } = await request({
          method: "POST",
          url: "/admin/map-product-directly-to-category",
          payload: {
            our_category_id: categoryId,
            product_ids: productIds,
          },
          authRequired: true,
        });
        if (error) throw new Error(error?.message || error);
      }
      showToast("success", "All suggestions applied successfully.");
      handleRefresh();
    } catch (err) {
      showToast("error", err?.message || "Failed to apply suggestions.");
    } finally {
      setBulkAcceptLoading(false);
      setSelectedSuggestionIds(new Set());
    }
  };

  const toggleSuggestionSelection = (productId) => {
    setSelectedSuggestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Bulk selection
  const filteredProducts = products.filter((product) => {
    const isMapped = product.mapped_category || product.mapped_categories?.length > 0;
    if (state.filters.mappingStatus === "mapped") return isMapped;
    if (state.filters.mappingStatus === "unmapped") return !isMapped;
    return true;
  });

  const toggleBulkSelect = (productId, e) => {
    e?.stopPropagation?.();
    setBulkSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const toggleSelectAll = (e) => {
    e?.stopPropagation?.();
    if (bulkSelectedIds.size >= filteredProducts.length) {
      setBulkSelectedIds(new Set());
    } else {
      setBulkSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const clearBulkSelection = () => setBulkSelectedIds(new Set());

  useEffect(() => {
    const el = selectAllCheckboxRef.current;
    if (el && filteredProducts.length > 0) {
      el.indeterminate = bulkSelectedIds.size > 0 && bulkSelectedIds.size < filteredProducts.length;
    }
  }, [bulkSelectedIds.size, filteredProducts.length]);

  const runBulkAction = async (action) => {
    if (bulkActionLoading || bulkSelectedIds.size === 0) return;
    if (action === "delete" && !window.confirm(`Delete ${bulkSelectedIds.size} product(s)? This will soft-delete them.`)) return;
    setBulkActionLoading(true);
    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/bulk-product-action",
        authRequired: true,
        payload: {
          product_ids: Array.from(bulkSelectedIds),
          action,
        },
      });
      if (error) throw new Error(data?.message || error);
      showToast("success", data?.message || "Done");
      clearBulkSelection();
      handleRefresh();
    } catch (err) {
      showToast("error", err?.message || "Action failed");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // 🔍 Debounced Search
  const debounceSearch = useCallback(
    debounce((val) => {
      setSearchQuery(val);
      setCurrentPage(1);
    }, 500),
    []
  );

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    debounceSearch(val);
  };

  const handleClearFilters = () => {
    setState((prev) => ({
      ...prev,
      filters: {
        gender: "all",
        category: "all",
        brand: "all",
        minPrice: "",
        maxPrice: "",
        vendorId: "all",
        mappingStatus: "all",
      },
      currentPage: 1,
    }));
    setLocalMin("");
    setLocalMax("");
  };

  // Debounced state update for API / filters
  const debounceMinPrice = useCallback(
    debounce((val) => {
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, minPrice: val },
        currentPage: 1,
      }));
    }, 500),
    []
  );

  const debounceMaxPrice = useCallback(
    debounce((val) => {
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, maxPrice: val },
        currentPage: 1,
      }));
    }, 500),
    []
  );

  useEffect(() => {
    fetchProducts();
  }, [currentPage, keyRefresh, searchQuery, state.filters]);

  useEffect(() => {
    const run = async () => {
      if (!showSuggestions) return;
      if (!products?.length) return;
      const unmapped = products.filter(
        (p) => !(p.mapped_category || p.mapped_categories?.length > 0)
      );
      const targets = unmapped.slice(0, 20);
      for (const p of targets) {
        await fetchSuggestionForProduct(p.id);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, showSuggestions]);

  useEffect(() => {
    const saved = localStorage.getItem("inventory_show_suggestions");
    if (saved === "true") {
      setShowSuggestions(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "inventory_show_suggestions",
      showSuggestions ? "true" : "false"
    );
  }, [showSuggestions]);

  // Fetch Vendors for dropdown
  useEffect(() => {
    const fetchVendors = async () => {
      setLoadingVendors(true);
      try {
        const { data, error } = await request({
          method: "GET",
          url: "/admin/get-vendor-list",
          authRequired: true,
          params: {
            status: "active", // ✅ Only fetch active vendors
          },
        });
        if (error) throw new Error(error?.message || error);
        const list = data?.data?.vendors || [];
        // ✅ Show ALL active vendors (removed hardcoded filter)
        setVendors(list);
      } catch (err) {
        showToast("error", err.message || "Failed to load vendors");
      } finally {
        setLoadingVendors(false);
      }
    };
    fetchVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper function to flatten nested categories with full paths
  const flattenCategories = (categories) => {
    let flattened = [];

    for (const cat of categories) {
      flattened.push({
        id: cat.id,
        name: cat.name,
        path: cat.path, // Use the actual path from database
        displayPath: cat.path || cat.name,
        level: cat.path ? cat.path.split('/').length - 1 : 0
      });

      // Recursively flatten children
      if (cat.children && cat.children.length > 0) {
        flattened = flattened.concat(flattenCategories(cat.children));
      }
    }

    return flattened;
  };

  // Fetch all categories (once on mount)
  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const { data, error } = await request({
          method: "GET",
          url: "/admin/get-categories?is_our_category=true", // Only fetch "our categories"
          authRequired: true,
        });

        if (error) throw new Error(error?.message || error);

        // API returns nested tree structure
        const nestedCategories = data?.data?.categories || data?.data || [];

        // Flatten the tree and include full paths
        const flatCategories = flattenCategories(nestedCategories);

        setCategories(flatCategories);
      } catch (err) {
        console.error("Failed to load categories:", err);
        // Fallback: if this fails, categories will remain empty
      }
    };

    fetchAllCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch all brands
  useEffect(() => {
    const fetchBrands = async () => {
      setLoadingBrands(true);
      try {
        const { data, error } = await request({
          method: "GET",
          url: "/admin/get-all-brands",
          authRequired: true,
        });

        if (error) throw new Error(error?.message || error);

        console.log(data.data);

        setBrands(data?.data || []); // expected array
      } catch (err) {
        showToast("error", err.message || "Failed to load brands");
      } finally {
        setLoadingBrands(false);
      }
    };

    fetchBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredBrands = brands.filter((b) =>
    String(b.brand_name || "").toLowerCase().includes(brandSearch.toLowerCase())
  );

  const filteredCategories = categories.filter((cat) => {
    const searchableText = cat.path
      ? cat.path.split("/").map(w => w.replace(/-/g, " ")).join(" ")
      : cat.name;
    return String(searchableText || "")
      .toLowerCase()
      .includes(categorySearch.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <CustomBreadcrumb />

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Inventory
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          View and manage products. Click a row to open details.
        </p>
      </div>

      {/* Search + primary actions */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <Input
            type="text"
            value={searchValue}
            placeholder="Search products..."
            className="w-full sm:max-w-[280px] h-10 bg-white border-slate-200 rounded-lg"
            onChange={handleSearchChange}
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={showSuggestions}
                onCheckedChange={setShowSuggestions}
              />
              <span className="text-sm text-slate-600">Show suggestions</span>
            </div>
            <Button
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
              onClick={() =>
                router.push(ROUTE_PATH.DASHBOARD.CATEGORY_MANAGEMENT)
              }
            >
              Category Management
            </Button>
            <Button
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
              onClick={handleBulkAcceptSuggestions}
              disabled={bulkAcceptLoading || !showSuggestions}
            >
              {bulkAcceptLoading ? "Applying..." : "Accept selected"}
            </Button>
            <Button
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total products</div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Mapped</div>
          <div className="text-2xl font-semibold text-slate-700 mt-1">{stats.mapped}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Inactive</div>
          <div className="text-2xl font-semibold text-slate-600 mt-1">{stats.inactive}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-6">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Filters</div>
        <div className="flex flex-col sm:flex-row lg:flex-row flex-wrap gap-3 items-start sm:items-center">
        {/* Gender Filter */}
        <Select
          value={state.filters.gender}
          onValueChange={(value) =>
            setState((prev) => ({
              ...prev,
              filters: { ...prev.filters, gender: value },
              currentPage: 1,
            }))
          }
        >
          <SelectTrigger className="w-full sm:w-[150px] md:w-[130px] lg:w-[150px]">
            <SelectValue placeholder="All Genders" />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            <SelectItem value="all">All Genders</SelectItem>
            {[
              ...new Set(
                products
                  .map((p) => normalizeGenderValue(p.gender))
                  .filter(Boolean)
              ),
            ].map((gender) => (
              <SelectItem key={gender} value={gender}>
                {formatGenderLabel(gender)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select
          value={state.filters.category}
          onValueChange={(value) =>
            setState((prev) => ({
              ...prev,
              filters: { ...prev.filters, category: value },
              currentPage: 1,
            }))
          }
        >
          <SelectTrigger className="w-full sm:w-[180px] md:w-[130px] lg:w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="p-0">
            {/* Category Search Bar */}
            <div className="sticky top-0 z-20 bg-white p-2 border-b shadow-sm">
              <Input
                placeholder="Search category..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            {/* Scrollable Category List */}
            <div className="max-h-60 lg:max-w-96 overflow-y-auto">
              <SelectItem value="all">All Categories</SelectItem>

              {filteredCategories.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">No categories found</div>
              ) : (
                filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.path}>
                    <span className={cat.level > 0 ? "text-gray-600" : ""}>
                      {cat.path
                        ? cat.path.split("/").map(w => w.replace(/-/g, " ")).join(" › ")
                        : cat.name}
                    </span>
                  </SelectItem>
                ))
              )}
            </div>
          </SelectContent>
        </Select>

        {/* Brand Filter */}
        <Select
          value={state.filters.brand}
          onValueChange={(value) =>
            setState((prev) => ({
              ...prev,
              filters: { ...prev.filters, brand: value },
              currentPage: 1,
            }))
          }
        >
          <SelectTrigger className="w-full sm:w-[180px] md:w-[130px] lg:w-[180px]">
            <SelectValue
              placeholder={loadingBrands ? "Loading brands..." : "All Brands"}
            />
          </SelectTrigger>

          <SelectContent className="p-0">
            {/* 🔍 FIXED SEARCH BAR */}
            <div className="sticky top-0 z-20 bg-white p-2 border-b shadow-sm">
              <Input
                placeholder="Search brand..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            {/* SCROLLABLE LIST ONLY */}
            <div className="max-h-60 overflow-y-auto">
              <SelectItem value="all">All Brands</SelectItem>

              {filteredBrands.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">No brands found</div>
              ) : (
                filteredBrands.map((item) => {
                  const key = item?.id ?? item?.brand_name;
                  return (
                    <SelectItem key={key} value={item.brand_name}>
                      {item.brand_name}
                    </SelectItem>
                  );
                })
              )}
            </div>
          </SelectContent>
        </Select>

        <div>
          <Input
            type="text"
            placeholder="Min Price"
            className="w-full sm:w-[150px] md:w-[130px] lg:w-[180px] mr-2"
            value={localMin}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*$/.test(val)) {
                setLocalMin(val);
                debounceMinPrice(val);
              }
            }}
          />

          <Input
            type="text"
            placeholder="Max Price"
            className="w-full sm:w-[150px] md:w-[130px] lg:w-[180px] mr-2"
            value={localMax}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*$/.test(val)) {
                setLocalMax(val); // input me turant update
                debounceMaxPrice(val); // filters update aur API call debounce ke through
              }
            }}
          />
        </div>
        <Button
          variant="outline"
          className="border-slate-300 text-slate-600 hover:bg-slate-100 w-full sm:w-auto"
          onClick={handleClearFilters}
        >
          Clear filters
        </Button>

        {/* Vendor Dropdown */}
        <Select
          value={state.filters.vendorId}
          onValueChange={(value) =>
            setState((prev) => ({
              ...prev,
              filters: { ...prev.filters, vendorId: value },
              currentPage: 1,
            }))
          }
        >
          <SelectTrigger className="w-full sm:w-[200px] md:w-[180px] lg:w-[220px]">
            <SelectValue
              placeholder={
                loadingVendors ? "Loading vendors..." : "Select Vendor"
              }
            />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            <SelectItem value="all">All Vendors</SelectItem>
            {vendors.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Mapping Status Filter */}
        <Select
          value={state.filters.mappingStatus}
          onValueChange={(value) =>
            setState((prev) => ({
              ...prev,
              filters: { ...prev.filters, mappingStatus: value },
              currentPage: 1,
            }))
          }
        >
          <SelectTrigger className="w-full sm:w-[180px] md:w-[160px] lg:w-[180px]">
            <SelectValue placeholder="Mapping Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="mapped">Mapped Only</SelectItem>
            <SelectItem value="unmapped">Not Mapped Only</SelectItem>
          </SelectContent>
        </Select>
        </div>
      </div>

      {/* Bulk action bar */}
      {bulkSelectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <span className="text-sm font-medium text-slate-700">
            {bulkSelectedIds.size} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
            onClick={() => runBulkAction("set_active")}
            disabled={bulkActionLoading}
          >
            Set active
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
            onClick={() => runBulkAction("set_inactive")}
            disabled={bulkActionLoading}
          >
            Set inactive
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => runBulkAction("delete")}
            disabled={bulkActionLoading}
          >
            Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600"
            onClick={clearBulkSelection}
            disabled={bulkActionLoading}
          >
            Clear selection
          </Button>
          {bulkActionLoading && (
            <span className="text-xs text-slate-500">Applying…</span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <Table className="table-auto w-full">
              <TableHeader className="bg-slate-100 border-b border-slate-200">
              <TableRow className="border-slate-200 hover:bg-slate-100/50">
                <TableHead className="w-10 pr-0">
                  <input
                    type="checkbox"
                    ref={selectAllCheckboxRef}
                    checked={filteredProducts.length > 0 && bulkSelectedIds.size === filteredProducts.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 accent-slate-700"
                    aria-label="Select all on page"
                  />
                </TableHead>
                <TableHead className="text-slate-600 font-semibold">Image</TableHead>
                <TableHead className="text-slate-600 font-semibold">Name</TableHead>
                <TableHead className="text-slate-600 font-semibold">Category</TableHead>
                <TableHead className="text-slate-600 font-semibold">Brand</TableHead>
                <TableHead className="text-slate-600 font-semibold">Gender</TableHead>
                <TableHead className="text-slate-600 font-semibold">Vendor</TableHead>
                <TableHead className="text-slate-600 font-semibold text-center">Price</TableHead>
                <TableHead className="text-slate-600 font-semibold text-center">Vendor price</TableHead>
                <TableHead className="text-slate-600 font-semibold text-center">Markup %</TableHead>
                <TableHead className="text-slate-600 font-semibold text-center">Last updated</TableHead>
                <TableHead className="text-slate-600 font-semibold text-center">Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* -------------- SHOW SKELETON WHILE LOADING -------------- */}
              {loading &&
                Array.from({ length: 8 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="w-10 pr-0">
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-44" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </TableCell>
                    {/* <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell> */}
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="mx-auto h-4 w-16" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="mx-auto h-4 w-16" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="mx-auto h-4 w-12" />
                    </TableCell>
                    {/* <TableCell className="text-center">
                      <Skeleton className="mx-auto h-4 w-12" />
                    </TableCell> */}
                    <TableCell className="text-center">
                      <Skeleton className="mx-auto h-4 w-20" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="mx-auto h-6 w-16 rounded-md" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="mx-auto h-6 w-16 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))}

              {/* -------------- SHOW PRODUCTS AFTER LOADING -------------- */}
              {!loading &&
                filteredProducts.map((product) => {
                  const categoryNames =
                    product.categories?.map((cat) => cat.name).join(", ") ||
                    "-";
                  const variant = product.variants?.[0] || {};

                  // Check if product is "new" (created within last 24 hours)
                  const createdAt = new Date(product.created_at);
                  const now = new Date();
                  const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
                  const isNew = hoursDiff < 24;

                  // Format updated_at
                  const updatedAt = product.updated_at
                    ? new Date(product.updated_at).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '-';

                  return (
                    <TableRow
                      key={product.id}
                      className={`cursor-pointer transition-colors ${bulkSelectedIds.has(product.id) ? "bg-slate-100" : "hover:bg-slate-50"}`}
                      onClick={() => {
                        setSelectedProductId(product.id);
                        setIsProductModalOpen(true);
                      }}
                    >
                      <TableCell className="w-10 pr-0" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={bulkSelectedIds.has(product.id)}
                          onChange={(e) => toggleBulkSelect(product.id, e)}
                          className="h-4 w-4 rounded border-slate-300 accent-slate-700"
                          aria-label={`Select ${product.name}`}
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {product.product_img ? (
                          <img
                            src={product.product_img} 
                            alt={product.name}
                            className="h-16 w-16 object-cover rounded-md"
                          />
                        ) : (
                          <div className="h-16 w-16 bg-slate-200 rounded-md flex items-center justify-center">
                            <span className="text-xs text-slate-500">No Image</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`https://www.aayeu.com/shop/product/${generateProductSlug(
                              product.name
                            )}/${product.id}?cat=${generateProductSlug(
                              product.categories?.[0]?.name
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                          >
                            <div className="font-medium hover:text-slate-900 hover:underline transition">
                              {product.name}
                            </div>
                          </Link>
                          {isNew && (
                            <Badge className="bg-slate-600 text-white text-xs px-2 py-0.5 border-0">
                              New
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          SKU: {product.product_sku || "-"}
                        </div>
                      </TableCell>

                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        {product.mapped_categories?.length ? (
                          product.mapped_categories.map((cat, i) => (
                            <Badge
                              key={i}
                              className="rounded-full bg-slate-700 text-xs text-white border-0"
                            >
                              {cat.path
                                .split("/")
                                .map(w => w.replace(/-/g, " "))
                                .join(" › ")}
                            </Badge>
                          ))
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-300 border-0">
                              Not Mapped
                            </Badge>
                            {showSuggestions ? (
                              aiLoadingByProduct[product.id] ? (
                                <div className="inline-flex items-center gap-2 px-2 py-1 bg-slate-100 border border-slate-300 rounded-full text-xs text-slate-600">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Suggesting...
                                </div>
                              ) : aiSuggestionsByProduct[product.id] ? (
                                <div className="inline-flex items-center gap-2 px-2 py-1 bg-slate-100 border border-slate-300 rounded-full text-xs">
                                  <input
                                    type="checkbox"
                                    className="h-3 w-3 accent-slate-600"
                                    checked={selectedSuggestionIds.has(product.id)}
                                    onChange={() => toggleSuggestionSelection(product.id)}
                                    aria-label="Select suggestion"
                                  />
                                  <span className="text-slate-800 font-medium">
                                    {aiSuggestionsByProduct[product.id].category_path || aiSuggestionsByProduct[product.id].category_name}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleAcceptSuggestion(
                                        product.id,
                                        aiSuggestionsByProduct[product.id].category_id
                                      )
                                    }
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-900 text-white rounded-full"
                                    title="Accept suggestion"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => fetchSuggestionForProduct(product.id)}
                                  className="text-xs text-slate-600 hover:text-slate-900 underline"
                                >
                                  Get suggestion
                                </button>
                              )
                            ) : (
                              <span className="text-xs text-slate-400">Suggestions off</span>
                            )}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>{product.brand_name || "-"}</TableCell>
                      <TableCell>{product.gender || "-"}</TableCell>
                      <TableCell>{product.vendor_name || "-"}</TableCell>

                      <TableCell className="text-center">
                        {variant.price ? `€${variant.price}` : "-"}
                      </TableCell>

                      <TableCell className="text-center">
                        {variant.vendorsaleprice || variant.vendor_sale_price
                          ? `€${variant.vendorsaleprice || variant.vendor_sale_price}`
                          : "-"}
                      </TableCell>

                      <TableCell className="text-center">
                        <span className="font-semibold text-slate-700">
                          {variant.price && variant.vendorsaleprice && variant.vendorsaleprice > 0
                            ? `${(((variant.price / variant.vendorsaleprice) - 1) * 100).toFixed(2)}%`
                            : "0.00%"}
                        </span>
                      </TableCell>

                      {/* <TableCell className="text-center">
                        {variant.stock || "-"}
                      </TableCell> */}

                      <TableCell className="text-center">
                        <div className="text-xs text-slate-700">
                          {updatedAt}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant={
                            product.is_active ? "default" : "secondary"
                          }
                          className={`mx-auto px-3 py-1 border-0 ${product.is_active ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-600"}`}
                        >
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages >= 0 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6 py-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-700"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              title="First page"
            >
              «
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-700"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Prev
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <span className="text-slate-300">|</span>
            <Input
              type="number"
              min="1"
              max={totalPages}
              placeholder="Go to"
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const page = parseInt(jumpToPage);
                  if (page >= 1 && page <= totalPages) {
                    setCurrentPage(page);
                    setJumpToPage("");
                  }
                }
              }}
              className="w-20 h-8 text-center border-slate-200"
            />
            <Button
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-700"
              onClick={() => {
                const page = parseInt(jumpToPage);
                if (page >= 1 && page <= totalPages) {
                  setCurrentPage(page);
                  setJumpToPage("");
                }
              }}
              disabled={!jumpToPage || parseInt(jumpToPage) < 1 || parseInt(jumpToPage) > totalPages}
            >
              Go
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-700"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-700"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Last page"
            >
              »
            </Button>
          </div>
        </div>
      )}

      {/* Product View Modal */}
      <ProductViewModal
        open={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProductId(null);
        }}
        productId={selectedProductId}
        onDeleteSuccess={fetchProducts}
      />
    </div>
  );
}
