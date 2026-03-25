"use client";

import { useEffect, useState } from "react";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";

import MappedTableSection from "../../../../components/_pages/settings/category-mapping/MappedTableSection";
import CategoryRemapSection from "../../../../components/_pages/settings/category-mapping/CategoryRemapSection";

const CategoryManager = () => {
  const categoriesPerPage = 20;

  const [ourCategories, setOurCategories] = useState([]);
  const [mappedCategories, setMappedCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState(null);

  const [mappedSearch, setMappedSearch] = useState("");
  const [mappedPage, setMappedPage] = useState(1);

  const { request: ourCategoriesRequest, loading: loadingOur } = useAxios();
  const { request: mappedCategoriesRequest, loading: loadingMapped } =
    useAxios();
  const { request: vendorListRequest, loading: loadingVendors } = useAxios();

  const groupMapped = (mapped) => {
    const acc = mapped.reduce((a, c) => {
      const key = c?.our_category?.id;
      if (!key) return a;
      if (!a[key]) {
        a[key] = {
          our_category: {
            name: c.our_category.name,
            parent: c.our_category.parent ? c.our_category.parent.name : null,
          },
          vendor_categories: [],
        };
      }
      const count =
        c.vendor_category_product_count ??
        c.vendor_product_count ??
        c.product_count ??
        c.vendorCategoryProductCount ??
        null;
      a[key].vendor_categories.push({
        id: c.vendor_category_id,
        name: c.vendor_category_name,
        product_count: count,
      });
      return a;
    }, {});
    return Object.values(acc);
  };

  const fetchOurCategories = async () => {
    const { data, error } = await ourCategoriesRequest({
      method: "GET",
      url: "/admin/get-our-categories",
      authRequired: true,
    });
    if (error) return showToast("Failed to fetch our categories", "error");
    setOurCategories(data?.data || []);
  };

  const fetchMappedCategories = async (vendorId) => {
    if (!vendorId) return;
    const { data, error } = await mappedCategoriesRequest({
      method: "GET",
      url: `/admin/get-mapped-categories`,
      authRequired: true,
      params: { vendorId },
    });
    if (error) return showToast("Failed to fetch mapped categories", "error");
    setMappedCategories(data?.data?.data || []);
  };

  const fetchVendors = async () => {
    const { data, error } = await vendorListRequest({
      method: "GET",
      url: "/admin/get-vendor-list",
      authRequired: true,
    });
    if (error) return showToast("Failed to fetch vendors", "error");

    const wantedIds = new Set([
      "b34fd0f6-815a-469e-b7c2-73f9e8afb3ed",
      "a6bdd96b-0e2c-4f3e-b644-4e088b1778e0",
      "65053474-4e40-44ee-941c-ef5253ea9fc9",
    ]);
    const onlyThree = (data?.data?.vendors || [])
      .filter((v) => wantedIds.has(v.id))
      .slice(0, 3);

    setVendors(onlyThree);

    const peppela = onlyThree.find(
      (v) =>
        v.id === "b34fd0f6-815a-469e-b7c2-73f9e8afb3ed" || v.name === "Peppela"
    );
    if (peppela) setSelectedVendorId(peppela.id);
    else if (onlyThree[0]) setSelectedVendorId(onlyThree[0].id);
  };

  useEffect(() => {
    fetchOurCategories();
    fetchVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedVendorId) fetchMappedCategories(selectedVendorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVendorId]);

  const grouped = groupMapped(mappedCategories);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-8">
      <CustomBreadcrumb />

      <h1 className="text-3xl font-bold text-gray-800 mt-4 mb-8">
        Category Mapping Dashboard
      </h1>

      <CategoryRemapSection ourCategories={ourCategories} />

      {vendors.length > 0 && (
        <div className="max-w-7xl mx-auto mb-4 flex flex-wrap items-center gap-3">
          <label
            htmlFor="mapped-vendor-select"
            className="text-sm font-medium text-gray-700"
          >
            Vendor (mapped table)
          </label>
          <select
            id="mapped-vendor-select"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900 min-w-[200px]"
            value={selectedVendorId || ""}
            onChange={(e) => {
              setSelectedVendorId(e.target.value || null);
              setMappedPage(1);
            }}
          >
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <MappedTableSection
        mappedCategories={grouped}
        mappedSearch={mappedSearch}
        setMappedSearch={setMappedSearch}
        mappedPage={mappedPage}
        setMappedPage={setMappedPage}
        categoriesPerPage={categoriesPerPage}
        loadingMapped={loadingMapped || loadingVendors || loadingOur}
        selectedVendorId={selectedVendorId}
        fetchMappedCategories={fetchMappedCategories}
      />
    </div>
  );
};

export default CategoryManager;
