"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";
import { useRouter } from "next/navigation";
import AddCategoryModel from "@/components/_dialogs/AddCategoryModel";
import { Button } from "@/components/ui/button";

const CategoryManager = () => {
  const [ourCategories, setOurCategories] = useState([]);
  const [checkedOurCategories, setCheckedOurCategories] = useState([]);
  const [vendorCategories, setVendorCategories] = useState([]);
  const [checkedVendorCategories, setCheckedVendorCategories] = useState([]);
  const [finalCategoryData, setFinalCategoryData] = useState({});
  const [ourSearch, setOurSearch] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [mappedSearch, setMappedSearch] = useState("");
  const [vendorPage, setVendorPage] = useState(1);
  const [mappedPage, setMappedPage] = useState(1);
  const [expandedParents, setExpandedParents] = useState({});
  const [mappedCategories, setMappedCategories] = useState([]);
  const [totalMappedPages, setTotalMappedPages] = useState(1);
  const [vendors, setVendors] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [preselectCategoryId, setPreselectCategoryId] = useState("");
  const categoriesPerPage = 20;
  const router = useRouter();

  const { request: ourCategoriesRequest, loading: loadingLeft } = useAxios();
  const { request: vendorCategoriesRequest, loading: loadingMiddle } = useAxios();
  const { request: mappedCategoriesRequest, loading: loadingMapped } = useAxios();
  const { request: vendorListRequest, loading: loadingVendors } = useAxios();

  // Fetch APIs
  const fetchOurCategories = async () => {
    const { data, error } = await ourCategoriesRequest({
      method: "GET",
      url: "/admin/get-our-categories",
    });
    if (error) return showToast("Failed to fetch our categories", "error");
    setOurCategories(data?.data || []);
  };

  const fetchVendorCategories = async () => {
    const { data, error } = await vendorCategoriesRequest({
      method: "GET",
      url: "/admin/get-category-for-mappings",
      params: { vendorId: selectedVendorId },
    });
    if (error) return showToast("Failed to fetch vendor categories", "error");

    // Normalize counts to `product_count` and ensure children normalized too
    const normalize = (cats = []) =>
      cats.map((c) => ({
        ...c,
        product_count: c.product_count ?? c.productCount ?? c.count ?? null,
        children: c.children ? normalize(c.children) : [],
      }));

    setVendorCategories(normalize(data?.data || []));
  };

  const fetchMappedCategories = async () => {
    const { data, error } = await mappedCategoriesRequest({
      method: "GET",
      url: `/admin/get-mapped-categories`,
      params: { vendorId: selectedVendorId },
    });
    if (error) return showToast("Failed to fetch mapped categories", "error");
    setMappedCategories(data?.data?.data || []);
    setTotalMappedPages(data?.data?.totalPages || 1);
  };

  // -- UPDATED FUNCTION --
  const fetchVendors = async () => {
    const { data, error } = await vendorListRequest({
      method: "GET",
      url: "/admin/get-vendor-list",
    });
    if (error) return showToast("Failed to fetch vendors", "error");
    const wantedIds = new Set([
      "b34fd0f6-815a-469e-b7c2-73f9e8afb3ed",
      "a6bdd96b-0e2c-4f3e-b644-4e088b1778e0",
      "65053474-4e40-44ee-941c-ef5253ea9fc9", // Luxury-Distribution
    ]);
    const onlyTwo = (data?.data?.vendors || [])
      .filter((v) => wantedIds.has(v.id))
      .slice(0, 3)
      .map(v =>
        v.id === "65053474-4e40-44ee-941c-ef5253ea9fc9"
          ? { ...v, name: v.name || "Luxury-Distribution" }
          : v
      );
    setVendors(onlyTwo);
    // Default to Peppela or Luxury-Distribution
    if (!selectedVendorId) {
      const defaultVendor = onlyTwo.find(
        (v) =>
          v.id === "b34fd0f6-815a-469e-b7c2-73f9e8afb3ed" ||
          v.name === "Peppela" ||
          v.id === "65053474-4e40-44ee-941c-ef5253ea9fc9" ||
          v.name === "Luxury-Distribution"
      );
      if (defaultVendor) setSelectedVendorId(defaultVendor.id);
    }
  };
  // -- END FUNCTION --

  useEffect(() => {
    fetchOurCategories();
    fetchMappedCategories();
    fetchVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedVendorId) return;
    fetchVendorCategories();
    fetchMappedCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVendorId]);

  useEffect(() => {
    const finalData = {};
    if (checkedOurCategories.length > 0) {
      finalData["Our Categories"] = checkedOurCategories.map((cat) => ({
        name: cat.name,
        parent: cat.parent || null,
      }));
    }
    if (checkedVendorCategories.length > 0) {
      finalData["Vendor Categories"] = checkedVendorCategories.map((cat) => ({
        name: cat.name,
        parent: cat.parent || null,
        // count is vendor-only (optional to show in preview)
        product_count: cat.product_count ?? null,
      }));
    }
    setFinalCategoryData(finalData);
  }, [checkedOurCategories, checkedVendorCategories]);

  // Recursive search at any depth
  const searchCategories = (categories, searchTerm) => {
    const results = [];
    const lowerSearch = searchTerm.toLowerCase();

    const traverse = (category, parentPath = []) => {
      if (category.name.toLowerCase().includes(lowerSearch)) {
        results.push({
          ...category,
          parentPath: [...parentPath],
        });
      }
      if (category.children?.length > 0) {
        category.children.forEach((child) => {
          traverse(child, [...parentPath, category]);
        });
      }
    };

    categories.forEach((category) => traverse(category));
    return results;
  };

  // Recursive render — show count ONLY for vendor categories
  const renderCategories = (
    categories,
    checkedCategories,
    handleCheckboxChange,
    type
  ) => {
    return categories.map((cat) => {
      const isChecked = checkedCategories.some(
        (s) => (s?.id || s?._id) === (cat?.id || cat?._id)
      );
      const isExpanded = expandedParents[cat.id || cat._id] || false;
      const displayName =
        type === "vendor"
          ? `${cat.name}${
              cat.product_count ?? null ? ` (${cat.product_count})` : ""
            }`
          : cat.name;

      return (
        <div key={cat.id || cat._id} className="mb-1">
          <div className="flex items-center p-2 rounded-md transition hover:bg-indigo-50 text-gray-700">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => handleCheckboxChange(cat)}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span
              onClick={() => {
                if (cat.children?.length > 0) {
                  setExpandedParents((prev) => ({
                    ...prev,
                    [cat.id || cat._id]: !prev[cat.id || cat._id],
                  }));
                }
              }}
              className="cursor-pointer flex-1"
            >
              {displayName}
            </span>
            {type === "our" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreselectCategoryId(cat.id || cat._id);
                  setIsAddCategoryOpen(true);
                }}
                className="ml-2 px-2 py-1 text-xs rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                Add Category
              </button>
            )}
            {cat.children?.length > 0 && (
              <button
                type="button"
                aria-label={isExpanded ? "Collapse" : "Expand"}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedParents((prev) => ({
                    ...prev,
                    [cat.id || cat._id]: !prev[cat.id || cat._id],
                  }));
                }}
                className="ml-2 p-1 rounded hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <svg
                  className={`w-4 h-4 transform transition-transform ${
                    isExpanded ? "rotate-180" : ""
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
              </button>
            )}
          </div>
          {isExpanded && cat.children?.length > 0 && (
            <div className="ml-4 mt-1 border-l border-gray-200 pl-3">
              {renderCategories(
                cat.children,
                checkedCategories,
                handleCheckboxChange,
                type
              )}
            </div>
          )}
        </div>
      );
    });
  };

  const handleOurCategoryCheckbox = (cat) => {
    const isChecked = checkedOurCategories.some(
      (s) => (s.id || s._id) === (cat.id || cat._id)
    );
    if (isChecked) {
      setCheckedOurCategories(
        checkedOurCategories.filter(
          (s) => (s.id || s._id) !== (cat.id || cat._id)
        )
      );
    } else {
      setCheckedOurCategories([...checkedOurCategories, { ...cat }]);
    }
  };

  const handleVendorCategoryCheckbox = (cat) => {
    const isChecked = checkedVendorCategories.some(
      (s) => (s.id || s._id) === (cat.id || cat._id)
    );
    if (isChecked) {
      setCheckedVendorCategories(
        checkedVendorCategories.filter(
          (s) => (s.id || s._id) !== (cat.id || cat._id)
        )
      );
    } else {
      setCheckedVendorCategories([...checkedVendorCategories, { ...cat }]);
    }
  };

  // Find category id at any depth (small bugfix to avoid undefined var)
  const getCategoryId = (category, categoriesList) => {
    if (!category) return null;

    const targetId = category.id || category._id;

    const findInChildren = (children, tid) => {
      for (let child of children) {
        const childId = child.id || child._id;
        if (childId === tid) return childId;
        if (child.children?.length > 0) {
          const nested = findInChildren(child.children, tid);
          if (nested) return nested;
        }
      }
      return null;
    };

    // No parent: try top-level
    if (!category.parent_id) {
      const top = categoriesList.find(
        (cat) => (cat.id || cat._id) === targetId
      );
      if (top) return top.id || top._id;
    }

    // Has parent: look under parent
    const parent = categoriesList.find(
      (cat) => (cat.id || cat._id) === category.parent_id
    );
    if (parent && parent.children) {
      return findInChildren(parent.children, targetId);
    }

    // Fallback: search entire tree
    return findInChildren(categoriesList, targetId);
  };

  const handleSubmit = async () => {
    const ourCategoryId =
      checkedOurCategories.length > 0
        ? getCategoryId(checkedOurCategories[0], ourCategories)
        : null;

    const payload = {
      vendor_category_id: [
        ...new Set(checkedVendorCategories.map((c) => c.id || c._id)),
      ],
      our_category_id: ourCategoryId,
    };

    if (!payload.our_category_id)
      return showToast("Please select at least one Our Category", "error");
    if (payload.vendor_category_id.length === 0)
      return showToast("Please select at least one Vendor Category", "error");

    const { error } = await ourCategoriesRequest({
      method: "POST",
      url: "/admin/map-vendor-category",
      payload,
    });
    if (error)
      return showToast(
        `Failed to save mappings: ${error.message || "Unknown error"}`,
        "error"
      );

    showToast("Category mappings saved successfully",        "success");
    setFinalCategoryData({});
    setCheckedOurCategories([]);
    setCheckedVendorCategories([]);
    fetchMappedCategories();
  };

  // Group mapped categories by our_category.id
  const groupedMappedCategories = mappedCategories.reduce((acc, curr) => {
    const key = curr?.our_category?.id;
    if (!key) return acc;

    if (!acc[key]) {
      acc[key] = {
        our_category: {
          name: curr.our_category.name,
          parent: curr.our_category.parent
            ? curr.our_category.parent.name
            : null,
        },
        vendor_categories: [],
      };
    }

    // Try multiple possible fields for vendor product count provided by API
    const count =
      curr.vendor_category_product_count ??
      curr.vendor_product_count ??
      curr.product_count ??
      curr.vendorCategoryProductCount ??
      null;

    acc[key].vendor_categories.push({
      name: curr.vendor_category_name,
      product_count: count,
    });

    return acc;
  }, {});

  // Filter grouped categories based on mappedSearch
  const filteredMappedCategories = Object.values(
    groupedMappedCategories
  ).filter(
    (mapping) =>
      mapping.our_category.name
        .toLowerCase()
        .includes(mappedSearch.toLowerCase()) ||
      (mapping.our_category.parent &&
        mapping.our_category.parent
          .toLowerCase()
          .includes(mappedSearch.toLowerCase())) ||
      mapping.vendor_categories.some((vendorCat) =>
        vendorCat.name.toLowerCase().includes(mappedSearch.toLowerCase())
      )
  );

  const totalFilteredMappedPages = Math.ceil(
    filteredMappedCategories.length / categoriesPerPage
  );
  const currentMappedCategories = filteredMappedCategories.slice(
    (mappedPage - 1) * categoriesPerPage,
    mappedPage * categoriesPerPage
  );

  // Filter categories with recursive search
  const filteredOurCategories = ourSearch
    ? searchCategories(ourCategories, ourSearch)
    : ourCategories;
  const filteredVendorCategories = vendorSearch
    ? searchCategories(vendorCategories, vendorSearch)
    : vendorCategories;

  const totalVendorPages = Math.ceil(
    filteredVendorCategories.length / categoriesPerPage
  );
  const currentVendorCategories = filteredVendorCategories.slice(
    (vendorPage - 1) * categoriesPerPage,
    vendorPage * categoriesPerPage
  );

  const isSubmitDisabled =
    checkedOurCategories.length === 0 || checkedVendorCategories.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Category Mapping Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* Our Categories */}
        <div className="bg-white shadow-lg rounded-2xl p-5 transition-all hover:shadow-xl">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-800">
              Our Categories
            </h2>
            <div className="flex items-center gap-2">
              <Button
                className="w-full"
                onClick={() =>
                  router.push("/dashboard/inventories/categorymanagement")
                }
              >
                Manage Category
              </Button>
              {loadingLeft && (
                <span className="text-sm text-gray-400 animate-pulse">
                  Loading...
                </span>
              )}
            </div>
          </div>
          <input
            type="text"
            placeholder="Search our categories..."
            value={ourSearch}
            onChange={(e) => setOurSearch(e.target.value)}
            className="w-full mb-3 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
          />
          <div className="max-h-[55vh] overflow-y-auto custom-scrollbar">
            {filteredOurCategories.length > 0 ? (
              renderCategories(
                filteredOurCategories,
                checkedOurCategories,
                handleOurCategoryCheckbox,
                "our"
              )
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                No categories found
              </p>
            )}
          </div>
        </div>

        {/* Vendor Categories */}
        <div className="bg-white shadow-lg rounded-2xl p-5 transition-all hover:shadow-xl">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-800">
              Vendor Categories
            </h2>
            <div className="flex items-center gap-2">
              <Select
                value={selectedVendorId}
                onValueChange={setSelectedVendorId}
              >
                <SelectTrigger className="w-48">
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
              {(loadingMiddle || loadingVendors) && (
                <span className="text-sm text-gray-400 animate-pulse">
                  Loading...
                </span>
              )}
            </div>
          </div>
          <input
            type="text"
            placeholder="Search vendor categories..."
            value={vendorSearch}
            onChange={(e) => setVendorSearch(e.target.value)}
            className="w-full mb-3 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm transition-colors"
          />
          <div className="max-h-[55vh] overflow-y-auto custom-scrollbar">
            {currentVendorCategories.length > 0 ? (
              renderCategories(
                currentVendorCategories,
                checkedVendorCategories,
                handleVendorCategoryCheckbox,
                "vendor"
              )
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                No categories found
              </p>
            )}
          </div>
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

        {/* Final Mappings (preview) */}
        <div className="bg-white shadow-lg rounded-2xl p-5 transition-all hover:shadow-xl">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Final Mappings
          </h2>
          <div className="max-h-[55vh] overflow-y-auto custom-scrollbar">
            {Object.keys(finalCategoryData).length ? (
              Object.entries(finalCategoryData).map(([cat, items]) => (
                <div key={cat} className="mb-3">
                  <h3 className="font-semibold text-indigo-600 text-sm mb-1">
                    {cat}
                  </h3>
                  <ul className="text-gray-700 text-sm list-disc list-inside space-y-1">
                    {items.map((i, idx) => (
                      <li key={idx}>
                        {i.name}
                        {i.parent ? ` (under ${i.parent})` : ""}
                        {cat === "Vendor Categories" && i.product_count
                          ? ` — ${i.product_count}`
                          : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                No mappings yet
              </p>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`w-full py-2 mt-4 rounded-md text-white font-medium transition
              ${
                isSubmitDisabled
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-indigo-500 hover:bg-indigo-600 shadow-md"
              }`}
          >
            Submit Mappings
          </button>
        </div>
      </div>

      {/* Add Category Modal */}
      <AddCategoryModel
        open={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onSuccess={() => {
          fetchOurCategories();
          setIsAddCategoryOpen(false);
        }}
        categories={ourCategories}
        preselectCategoryId={preselectCategoryId}
      />

      {/* Mapped Categories Table */}
      <div className="mt-8 max-w-7xl mx-auto bg-white shadow-xl rounded-2xl p-6 transition-all">
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
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4 text-sm text-gray-700 border-b border-gray-200">
                      {mapping.our_category.name}
                      {mapping.our_category.parent
                        ? ` (${mapping.our_category.parent})`
                        : ""}
                    </td>
                    <td className="p-4 text-sm text-gray-700 border-b border-gray-200">
                      <div className="flex flex-wrap gap-2">
                        {mapping.vendor_categories.map((vendorCat, idx) => {
                          const label =
                            typeof vendorCat === "string"
                              ? vendorCat
                              : `${vendorCat.name}${
                                  vendorCat.product_count
                                    ? ` (${vendorCat.product_count})`
                                    : ""
                                }`;
                          return (
                            <span
                              key={idx}
                              className="inline-block bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-1 rounded-full"
                            >
                              {label}
                            </span>
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
    </div>
  );
};

export default CategoryManager;
