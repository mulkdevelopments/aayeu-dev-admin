"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";
import AddCategoryModel from "@/components/_dialogs/AddCategoryModel";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";

import CategorySection from "../../../../components/_pages/settings/category-mapping/CategorySection";
import VendorSection from "../../../../components/_pages/settings/category-mapping/VendorSection";
import FinalSection from "../../../../components/_pages/settings/category-mapping/FinalSection";
import MappedTableSection from "../../../../components/_pages/settings/category-mapping/MappedTableSection";

/**
 * Parent container that wires the three sections together
 * Keeps the original API endpoints, default vendor selection logic,
 * and mapping submit flow the same.
 */

const CategoryManager = () => {
  const router = useRouter();
  const categoriesPerPage = 20;

  // central data states (fetched)
  const [ourCategories, setOurCategories] = useState([]);
  const [vendorCategories, setVendorCategories] = useState([]);
  const [mappedCategories, setMappedCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [totalMappedPages, setTotalMappedPages] = useState(1);

  // UI/interaction states
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [preselectCategoryId, setPreselectCategoryId] = useState("");
  const [expandedParents, setExpandedParents] = useState({});

  // selection states
  const [checkedOurCategories, setCheckedOurCategories] = useState([]);
  const [checkedVendorCategories, setCheckedVendorCategories] = useState([]);

  // search & paging UI states
  const [ourSearch, setOurSearch] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [mappedSearch, setMappedSearch] = useState("");
  const [vendorPage, setVendorPage] = useState(1);
  const [mappedPage, setMappedPage] = useState(1);

  // axios hooks (keeps same request usage as original)
  const { request: ourCategoriesRequest, loading: loadingLeft } = useAxios();
  const { request: vendorCategoriesRequest, loading: loadingMiddle } =
    useAxios();
  const { request: mappedCategoriesRequest, loading: loadingMapped } =
    useAxios();
  const { request: vendorListRequest, loading: loadingVendors } = useAxios();

  /* -------------------- Helper utilities (kept pure) -------------------- */

  const normalizeVendorCats = (cats = []) =>
    cats.map((c) => ({
      ...c,
      product_count: c.product_count ?? c.productCount ?? c.count ?? null,
      children: c.children ? normalizeVendorCats(c.children) : [],
    }));

  const searchCategories = (categories, searchTerm) => {
    if (!searchTerm) return categories;
    const lower = searchTerm.toLowerCase();
    const results = [];
    const traverse = (cat, parentPath = []) => {
      if (cat.name?.toLowerCase().includes(lower)) {
        results.push({ ...cat, parentPath });
      }
      (cat.children || []).forEach((ch) => traverse(ch, [...parentPath, cat]));
    };
    categories.forEach((c) => traverse(c, []));
    return results;
  };

  const paginate = (items = [], page = 1, per = categoriesPerPage) => {
    const total = Math.max(1, Math.ceil(items.length / per));
    const current = items.slice((page - 1) * per, page * per);
    return { total, current };
  };

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

  // find category id anywhere in tree (keeps original behavior)
  const getCategoryId = (category, categoriesList) => {
    if (!category) return null;
    const tid = category.id || category._id;
    const findInChildren = (children, t) => {
      for (let child of children) {
        const cid = child.id || child._id;
        if (cid === t) return cid;
        if (child.children?.length) {
          const nested = findInChildren(child.children, t);
          if (nested) return nested;
        }
      }
      return null;
    };

    if (!category.parent_id) {
      const top = categoriesList.find((cat) => (cat.id || cat._id) === tid);
      if (top) return top.id || top._id;
    }

    const parent = categoriesList.find(
      (cat) => (cat.id || cat._id) === category.parent_id
    );
    if (parent && parent.children) return findInChildren(parent.children, tid);
    return findInChildren(categoriesList, tid);
  };

  /* -------------------- Fetching functions (preserve endpoints) -------------------- */

  const fetchOurCategories = async () => {
    const { data, error } = await ourCategoriesRequest({
      method: "GET",
      url: "/admin/get-our-categories",
      authRequired: true,
    });
    if (error) return showToast("Failed to fetch our categories", "error");
    setOurCategories(data?.data || []);
  };

  const fetchVendorCategories = async (vendorId) => {
    const { data, error } = await vendorCategoriesRequest({
      method: "GET",
      url: "/admin/get-category-for-mappings",
      authRequired: true,
      params: { vendorId },
    });
    if (error) return showToast("Failed to fetch vendor categories", "error");
    setVendorCategories(normalizeVendorCats(data?.data || []));
  };

  const fetchMappedCategories = async (vendorId) => {
    const { data, error } = await mappedCategoriesRequest({
      method: "GET",
      url: `/admin/get-mapped-categories`,
      authRequired: true,
      params: { vendorId },
    });
    if (error) return showToast("Failed to fetch mapped categories", "error");
    setMappedCategories(data?.data?.data || []);
    setTotalMappedPages(data?.data?.totalPages || 1);
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

    // default to Peppela if available (keeps same logic)
    if (!selectedVendorId) {
      const peppela = onlyThree.find(
        (v) =>
          v.id === "b34fd0f6-815a-469e-b7c2-73f9e8afb3ed" ||
          v.name === "Peppela"
      );
      if (peppela) setSelectedVendorId(peppela.id);
    }
  };

  /* -------------------- Effects -------------------- */
  useEffect(() => {
    fetchOurCategories();
    fetchMappedCategories(selectedVendorId);
    fetchVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedVendorId) return;
    fetchVendorCategories(selectedVendorId);
    fetchMappedCategories(selectedVendorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVendorId]);

  /* -------------------- Selection handlers (DRY) -------------------- */

  const toggleChecked = (list, setList, cat) => {
    const id = cat.id || cat._id;
    const exists = list.some((s) => (s.id || s._id) === id);
    if (exists) {
      setList(list.filter((s) => (s.id || s._id) !== id));
    } else {
      setList([...list, { ...cat }]);
    }
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

    const { data, error } = await ourCategoriesRequest({
      method: "POST",
      url: "/admin/map-vendor-category",
      authRequired: true,
      payload,
    });
    if (error)
      return showToast(
        `Failed to save mappings: ${error.message || "Unknown error"}`,
        "error"
      );

    if (data.success) showToast("success", data.message);

    setCheckedOurCategories([]);
    setCheckedVendorCategories([]);
    fetchMappedCategories(selectedVendorId);
  };

  /* -------------------- Derived / paginated data -------------------- */

  const filteredOurCategories = ourSearch
    ? searchCategories(ourCategories, ourSearch)
    : ourCategories;
  const filteredVendorCategories = vendorSearch
    ? searchCategories(vendorCategories, vendorSearch)
    : vendorCategories;

  const { total: totalVendorPages, current: currentVendorCategories } =
    paginate(filteredVendorCategories, vendorPage);

  const grouped = groupMapped(mappedCategories);
  const filteredMapped = grouped.filter((mapping) => {
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

  const finalCategoryData = useMemo(() => {
    const out = {};
    if (checkedOurCategories.length)
      out["Our Categories"] = checkedOurCategories.map((cat) => ({
        name: cat.name,
        parent: cat.parent || null,
      }));
    if (checkedVendorCategories.length)
      out["Vendor Categories"] = checkedVendorCategories.map((cat) => ({
        name: cat.name,
        parent: cat.parent || null,
        product_count: cat.product_count ?? null,
      }));
    return out;
  }, [checkedOurCategories, checkedVendorCategories]);

  const isSubmitDisabled =
    checkedOurCategories.length === 0 || checkedVendorCategories.length === 0;

  /* -------------------- Render -------------------- */

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-8">
      <CustomBreadcrumb />

      <h1 className="text-3xl font-bold text-gray-800 mt-4 mb-8">
        Category Mapping Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        <CategorySection
          categories={filteredOurCategories}
          checked={checkedOurCategories}
          onToggle={(c) =>
            toggleChecked(checkedOurCategories, setCheckedOurCategories, c)
          }
          expandedParents={expandedParents}
          setExpandedParents={setExpandedParents}
          ourSearch={ourSearch}
          setOurSearch={setOurSearch}
          loading={loadingLeft}
          onAdd={(id) => {
            setPreselectCategoryId(id);
            setIsAddCategoryOpen(true);
          }}
          router={router}
        />

        <VendorSection
          vendors={vendors}
          selectedVendorId={selectedVendorId}
          setSelectedVendorId={(id) => {
            setSelectedVendorId(id);
            setVendorPage(1);
          }}
          vendorCategories={currentVendorCategories}
          checked={checkedVendorCategories}
          onToggle={(c) =>
            toggleChecked(
              checkedVendorCategories,
              setCheckedVendorCategories,
              c
            )
          }
          vendorSearch={vendorSearch}
          setVendorSearch={(s) => {
            setVendorSearch(s);
            setVendorPage(1);
          }}
          vendorPage={vendorPage}
          totalVendorPages={totalVendorPages}
          setVendorPage={setVendorPage}
          loading={loadingMiddle || loadingVendors}
        />

        <FinalSection
          finalCategoryData={finalCategoryData}
          onSubmit={handleSubmit}
          isSubmitDisabled={isSubmitDisabled}
        />
      </div>

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

      {/* Mapped Categories Table (keeps same UI & pagination behavior) */}
      <MappedTableSection
        mappedCategories={grouped}
        mappedSearch={mappedSearch}
        setMappedSearch={setMappedSearch}
        mappedPage={mappedPage}
        setMappedPage={setMappedPage}
        categoriesPerPage={categoriesPerPage}
        loadingMapped={loadingMapped}
        selectedVendorId={selectedVendorId}
        fetchMappedCategories={fetchMappedCategories}
      />
    </div>
  );
};

export default CategoryManager;
