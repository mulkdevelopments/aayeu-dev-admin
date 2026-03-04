"use client";

import React, { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const VendorSection = ({
  vendors = [],
  selectedVendorId,
  setSelectedVendorId,
  vendorCategories = [],
  checked = [],
  onToggle,
  vendorSearch,
  setVendorSearch,
  vendorPage,
  totalVendorPages,
  setVendorPage,
  loading,
}) => {
  const [expanded, setExpanded] = useState(new Set());

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ✅ Define static vendor product stats
const vendorProductStats = useMemo(
  () => ({
      Peppela: { total: 40388, nonImage: 26800, filtered: 13588 },
      Bdroppy: { total: 7234, nonImage: 5343, filtered: 1891 },
      "Luxury-Distribution": { total: 11247, nonImage: 191, filtered: 11056 },
  }),
  []
);


  // ✅ Find selected vendor + stats (computed efficiently)
  const selectedVendor = useMemo(
    () => vendors.find((v) => v.id === selectedVendorId) || null,
    [selectedVendorId, vendors]
  );

  const vendorStats = useMemo(() => {
    if (!selectedVendor) return null;
    // Match name exactly (case-insensitive)
    const entry = Object.entries(vendorProductStats).find(
      ([name]) => name.toLowerCase() === selectedVendor.name?.toLowerCase()
    );
    return entry ? entry[1] : null;
  }, [selectedVendor, vendorProductStats]);

  const renderCategories = (cats, level = 0) =>
    cats.map((cat) => {
      const id = cat.id || cat._id;
      const isChecked = checked.some((s) => (s.id || s._id) === id);
      const hasChildren =
        Array.isArray(cat.children) && cat.children.length > 0;
      const isOpen = expanded.has(id);

      return (
        <div key={id} className="mb-1">
          <div className="flex items-center p-2 rounded-md hover:bg-indigo-50 transition text-gray-700">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => onToggle(cat)}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span
              className="cursor-pointer flex-1"
              onClick={() => hasChildren && toggleExpand(id)}
            >
              {cat.name}
              {cat.product_count ? ` (${cat.product_count})` : ""}
            </span>
            {hasChildren && (
              <span
                onClick={() => toggleExpand(id)}
                className="ml-2 p-1 text-xs text-gray-500 cursor-pointer select-none"
              >
                <svg
                  className={`w-4 h-4 transform transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            )}
          </div>

          {hasChildren && isOpen && (
            <div className="ml-4 mt-1 border-l border-gray-200 pl-3">
              {renderCategories(cat.children, level + 1)}
            </div>
          )}
        </div>
      );
    });

  console.log(vendors, "vendors");

  return (
    <div className="bg-white shadow-lg rounded-2xl p-5 transition-all hover:shadow-xl">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-800">
          Vendor Categories
        </h2>
      </div>

      {/* ✅ Vendor Selector */}
      <div className="flex justify-end items-center gap-2 my-4">
        <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
          <SelectTrigger className="w-48 rounded-none">
            <SelectValue placeholder="Select vendor" />
          </SelectTrigger>
          <SelectContent>
            {vendors.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ✅ Vendor Product Info (clean, structured, minimal) */}
      {vendorStats && (
        <div className="bg-gray-50 border border-gray-200 p-4 mb-4 text-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-base font-semibold text-gray-800">
              {selectedVendor.name}
            </p>
            <span className="text-xs text-gray-500">Product Overview</span>
          </div>

          <div className="divide-y divide-gray-200">
            <div className="flex justify-between py-1.5">
              <span className="text-gray-600">CSV Total</span>
              <span className="font-medium text-gray-900">
                {vendorStats.total}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-600">Error & Without Image</span>
              <span className="font-medium text-gray-900">
                {vendorStats.nonImage}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-600">Filtered Products</span>
              <span className="font-semibold text-green-700">
                {vendorStats.filtered}
              </span>
            </div>
          </div>

          {/* ✅ Optional small summary line */}
          <div className="mt-2 text-xs text-gray-500">
            {((vendorStats.filtered / vendorStats.total) * 100).toFixed(1)}%
            valid products
          </div>
        </div>
      )}

      {/* ✅ Search Bar */}
      <input
        type="text"
        placeholder="Search vendor categories..."
        value={vendorSearch}
        onChange={(e) => setVendorSearch(e.target.value)}
        className="w-full mb-3 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm transition-colors"
      />

      {/* ✅ Category Tree */}
      <div className="max-h-[55vh] overflow-y-auto custom-scrollbar">
        {vendorCategories.length > 0 ? (
          renderCategories(vendorCategories)
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            No categories found
          </p>
        )}
      </div>

      {/* ✅ Pagination */}
      {totalVendorPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setVendorPage((prev) => Math.max(prev - 1, 1))}
            disabled={vendorPage === 1}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              vendorPage === 1
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            }`}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 font-medium">
            Page {vendorPage} of {totalVendorPages}
          </span>
          <button
            onClick={() =>
              setVendorPage((prev) => Math.min(prev + 1, totalVendorPages))
            }
            disabled={vendorPage === totalVendorPages}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              vendorPage === totalVendorPages
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default VendorSection;
