// hooks/useCategoryData.ts
import { useEffect, useState } from "react";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";

export const useCategoryData = (selectedVendorId) => {
  const [ourCategories, setOurCategories] = useState([]);
  const [vendorCategories, setVendorCategories] = useState([]);
  const [mappedCategories, setMappedCategories] = useState([]);
  const [vendors, setVendors] = useState([]);

  const { request: api } = useAxios();

  useEffect(() => {
    fetchVendors();
    fetchOurCategories();
  }, []);
  useEffect(() => {
    if (selectedVendorId) fetchVendorAndMapped();
  }, [selectedVendorId]);

  const fetchOurCategories = async () => {
    const { data, error } = await api({
      method: "GET",
      url: "/admin/get-our-categories",
      authRequired: true,
    });
    if (error) return showToast("Failed to fetch our categories", "error");
    setOurCategories(data?.data || []);
  };

  const fetchVendorAndMapped = async () => {
    const { data: vData, error: vErr } = await api({
      method: "GET",
      url: "/admin/get-category-for-mappings",
      authRequired: true,
      params: { vendorId: selectedVendorId },
    });
    if (vErr) return showToast("Failed to fetch vendor categories", "error");

    const normalize = (cats = []) =>
      cats.map((c) => ({
        ...c,
        product_count: c.product_count ?? c.productCount ?? c.count ?? null,
        children: c.children ? normalize(c.children) : [],
      }));

    setVendorCategories(normalize(vData?.data || []));
    await fetchMappedCategories();
  };

  const fetchMappedCategories = async () => {
    const { data, error } = await api({
      method: "GET",
      url: "/admin/get-mapped-categories",
      authRequired: true,
      params: { vendorId: selectedVendorId },
    });
    if (error) return showToast("Failed to fetch mapped categories", "error");
    setMappedCategories(data?.data?.data || []);
  };

  const fetchVendors = async () => {
    const { data, error } = await api({
      method: "GET",
      url: "/admin/get-vendor-list",
      authRequired: true,
    });
    if (error) return showToast("Failed to fetch vendors", "error");
    const ids = [
      "b34fd0f6-815a-469e-b7c2-73f9e8afb3ed",
      "a6bdd96b-0e2c-4f3e-b644-4e088b1778e0",
      "65053474-4e40-44ee-941c-ef5253ea9fc9",
    ];
    const filtered = (data?.data?.vendors || []).filter((v) => ids.includes(v.id));
    setVendors(filtered);
  };

  return {
    ourCategories,
    vendorCategories,
    mappedCategories,
    vendors,
    fetchMappedCategories,
  };
};
