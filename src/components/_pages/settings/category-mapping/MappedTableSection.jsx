"use client";

import React, { useState } from "react";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MappedTableSection = ({
  mappedCategories = [],
  mappedSearch,
  setMappedSearch,
  mappedPage,
  setMappedPage,
  categoriesPerPage = 20,
  loadingMapped,
  selectedVendorId,
  fetchMappedCategories,
}) => {
  const { request: unmapRequest, loading: unmapping } = useAxios();

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    ourCategoryName: null,
    vendorCatName: null,
    vendorCatId: null,
  });

  const filteredMapped = mappedCategories.filter((mapping) => {
    const s = mappedSearch.toLowerCase();
    return (
      mapping.our_category.name.toLowerCase().includes(s) ||
      (mapping.our_category.parent &&
        mapping.our_category.parent.toLowerCase().includes(s)) ||
      mapping.vendor_categories.some((vc) => vc.name.toLowerCase().includes(s))
    );
  });

  const totalFilteredMappedPages = Math.ceil(
    filteredMapped.length / categoriesPerPage
  );
  const currentMappedCategories = filteredMapped.slice(
    (mappedPage - 1) * categoriesPerPage,
    mappedPage * categoriesPerPage
  );

  const handleConfirmUnmap = (vendorCatId, ourCategoryName, vendorCatName) => {
    setConfirmDialog({
      open: true,
      vendorCatId,
      ourCategoryName,
      vendorCatName,
    });
  };

  const handleUnmap = async () => {
    const { vendorCatId, ourCategoryName, vendorCatName } = confirmDialog;
    if (!vendorCatId) return;

    const { error } = await unmapRequest({
      method: "POST",
      url: "/admin/unmap-vendor-category",
      payload: {
        vendor_category_id: vendorCatId,
      },
      authRequired: true,
    });

    if (error) {
      showToast("error", error?.message || error || "Failed to unmap category");
    } else {
      showToast("success", `Unmapped ${vendorCatName} from ${ourCategoryName}`);
      fetchMappedCategories(selectedVendorId);
    }
    setConfirmDialog({
      open: false,
      ourCategoryName: null,
      vendorCatName: null,
    });
  };

  return (
    <div className="mt-8 max-w-7xl mx-auto bg-white shadow-xl rounded-2xl p-6 transition-all">
      {/* Alert Dialog for Confirmation */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unmap Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unmap{" "}
              <strong>{confirmDialog.vendorCatName}</strong> from{" "}
              <strong>{confirmDialog.ourCategoryName}</strong>? <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                setConfirmDialog({
                  open: false,
                  ourCategoryName: null,
                  vendorCatName: null,
                })
              }
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnmap}
              disabled={unmapping}
              className="bg-red-600 hover:bg-red-700"
            >
              {unmapping ? "Unmapping..." : "Confirm Unmap"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Mapped Categories
        </h2>
        {loadingMapped && (
          <span className="text-sm text-gray-400 animate-pulse">
            Loading...
          </span>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search mapped categories..."
        value={mappedSearch}
        onChange={(e) => {
          setMappedSearch(e.target.value);
          setMappedPage(1);
        }}
        className="w-full mb-4 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
      />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-indigo-50">
              <th className="p-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                Our Category
              </th>
              <th className="p-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                Vendor Categories
              </th>
            </tr>
          </thead>
          <tbody>
            {currentMappedCategories.length > 0 ? (
              currentMappedCategories.map((mapping, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm text-gray-700 border-b border-gray-200">
                    {mapping.our_category.name}
                    {mapping.our_category.parent
                      ? ` (${mapping.our_category.parent})`
                      : ""}
                  </td>
                  <td className="p-4 text-sm text-gray-700 border-b border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      {mapping.vendor_categories.map((vendorCat, idx) => {
                        const name =
                          typeof vendorCat === "string"
                            ? vendorCat
                            : vendorCat.name;
                        const label = vendorCat.product_count
                          ? `${name} (${vendorCat.product_count})`
                          : name;
                        const vendorCatId =
                          typeof vendorCat === "string" ? null : vendorCat.id;

                        return (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-1 rounded-full"
                          >
                            {label}
                            <button
                              disabled={unmapping}
                              onClick={() =>
                                handleConfirmUnmap(
                                  vendorCatId,
                                  mapping.our_category.name,
                                  vendorCat.name
                                )
                              }
                              className="ml-1 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                              title="Unmap"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="2"
                  className="p-4 text-center text-sm text-gray-400"
                >
                  No mapped categories found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalFilteredMappedPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setMappedPage((prev) => Math.max(prev - 1, 1))}
            disabled={mappedPage === 1}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              mappedPage === 1
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            }`}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 font-medium">
            Page {mappedPage} of {totalFilteredMappedPages}
          </span>
          <button
            onClick={() =>
              setMappedPage((prev) =>
                Math.min(prev + 1, totalFilteredMappedPages)
              )
            }
            disabled={mappedPage === totalFilteredMappedPages}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              mappedPage === totalFilteredMappedPages
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

export default MappedTableSection;
