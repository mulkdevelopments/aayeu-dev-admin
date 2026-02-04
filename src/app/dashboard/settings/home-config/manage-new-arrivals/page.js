"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import useAxios from "@/hooks/useAxios";
// import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { debounce } from "lodash";
import { showToast } from "@/components/_ui/toast-utils";
import SectionToggle from "@/components/_ui/sectiontoggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

export default function NewArrivals() {
  const { request } = useAxios();

  const [searchValue, setSearchValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newArrivals, setNewArrivals] = useState([]);
  const [showTable, setShowTable] = useState(true);
  const [isEdit, setIsEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [errors, setErrors] = useState({ startAt: "", endAt: "" });
  const [sectionActive, setSectionActive] = useState(false);
  const [sectionData, setSectionData] = useState({})
  const [formFields, setFormFields] = useState({
    startAt: "",
    endAt: "",
    badge: "New",
    promoText: "",
    rank: 1,
  });

  // Fetch new arrivals
  useEffect(() => {
    fetchNewArrivals();
    fetchStatus()
  }, []);

  const fetchStatus = async () => {
    try {
      const endpoint = "/admin/section-by-key?key=new_arrivals";
      // request() returns { data, error } in this codebase — use consistent names
      const { data, error } = await request({
        method: "GET",
        url: endpoint,
        authRequired: true,
      });

      if (error) {
        console.log("error", error);
        return;
      }

      console.log("fetchStatus response:", data);

      // Guard before accessing nested props — data may be null/undefined
      if (data && data.success) {
        setSectionActive(!!data.data?.active);
        setSectionData(data);
      } else {
        console.warn("Unexpected fetchStatus response:", data);
      }
    } catch (err) {
      console.error(err);
      showToast("error", err?.message || "Failed to fetch section status");
    } finally {
      setLoading(false);
    }
  };
  // handleToggle
  const handleToggle = async () => {
    const payload = { ...sectionData, key: "new_arrivals", active: !sectionActive, }
    const { error } = await request({ method: "PUT", url: "/admin/update-section", payload });
    if (!error) setSectionActive(!sectionActive);
  };
  const fetchNewArrivals = async () => {
    try {
      setLoading(true);
      const { data, error } = await request({
        method: "GET",
        url: "/admin/list-new-arrivals",
        authRequired: true,
      });
      if (error) {
        showToast("error", "Failed to fetch new arrivals");
        return;
      }

      const items = data?.data?.items || [];

      // Merge product details
      const mergedItems = await Promise.all(
        items.map(async (item) => {
          if (!item.product_name || !item.product_img || !item.product_sku) {
            const { data: pdData } = await request({
              method: "GET",
              url: `/admin/get-product-by-id?productId=${item.product_id}`,
              authRequired: true,
            });
            return {
              ...item,
              product_name: pdData?.data?.name,
              product_img: pdData?.data?.product_img,
              product_sku: pdData?.data?.product_sku,
            };
          }
          return item;
        })
      );

      setNewArrivals(mergedItems);
    } catch (err) {
      console.error(err);
      showToast("error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  const debounceSearch = useCallback(
    debounce((val) => setSearchQuery(val), 500),
    []
  );

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    debounceSearch(val);
    if (!val) setProducts([]);
  };

  // Fetch products by search
  useEffect(() => {
    if (!searchQuery) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await request({
          method: "GET",
          url: `/admin/get-products?page=1&q=${searchQuery}`,
          authRequired: true,
        });
        if (error) {
          showToast("error", "Failed to fetch products");
          return;
        }
        setProducts(data?.data?.products || []);
      } catch (err) {
        showToast("error", "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery]);

  // Select product
  const handleSelectProduct = async (productId) => {
    try {
      setLoading(true);
      const { data, error } = await request({
        method: "GET",
        url: `/admin/get-product-by-id?productId=${productId}`,
        authRequired: true,
      });
      if (error) {
        showToast("error", "Failed to fetch product details");
        return;
      }
      setSelectedProduct(data?.data);
      setProducts([]);
      setSearchValue("");
      setFormFields({
        startAt: "",
        endAt: "",
        badge: "New",
        promoText: "",
        rank: 1,
      });
    } catch (err) {
      showToast("error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeField = (field, value) => {
    setFormFields((prev) => ({ ...prev, [field]: value }));
  };

  const handleRemove = async (id) => {
    try {
      const { data, error } = await request({
        method: "PUT",
        url: `/admin/remove-new-arrival?id=${id}`,
        payload: {},
        authRequired: true,
      });
      if (error) {
        showToast("error", "Failed to Remove New Arrival");
        return;
      }
      showToast("success", "New Arrival Removed successfully!");
      setNewArrivals((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      showToast("error", "Something went wrong while removing");
    }
  };

  const handleEdit = (item) => {
    setIsEdit(true);
    setShowTable(false);
    setSelectedProduct(item);
    setFormFields({
      id: item.id || "",
      name: item.product_name || "-",
      startAt: item.start_at?.split("T")[0] || "",
      endAt: item.end_at?.split("T")[0] || "",
      badge: item.meta?.badge || "New",
      promoText: item.meta?.promo_text || "",
      rank: item.rank || 1,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ startAt: "", endAt: "" });

    let hasError = false;
    const newErrors = { startAt: "", endAt: "" };
    if (!formFields.startAt) {
      newErrors.startAt = "Start date is required";
      hasError = true;
    }
    if (!formFields.endAt) {
      newErrors.endAt = "End date is required";
      hasError = true;
    }
    if (hasError) {
      setErrors(newErrors);
      return;
    }

    try {
      const isEditExisting =
        !!selectedProduct.id &&
        newArrivals.some((na) => na.id === selectedProduct.id);

      const payload = {
        id: isEditExisting ? selectedProduct.id : undefined,
        product_id: selectedProduct.id,
        rank: Number(formFields.rank),
        meta: { badge: formFields.badge, promo_text: formFields.promoText },
        start_at: new Date(formFields.startAt).toISOString(),
        end_at: new Date(formFields.endAt).toISOString(),
        active: true,
      };

      const endpoint = isEditExisting
        ? "/admin/update-new-arrival"
        : "/admin/add-new-arrival";
      const method = isEditExisting ? "PUT" : "POST";

      const { data, error } = await request({ method, url: endpoint, payload, authRequired: true });

      if (error) {
        showToast("error", "Failed to add/update new arrival");
        return;
      }

      showToast(
        "success",
        `New Arrival ${isEditExisting ? "updated" : "added"} successfully!`
      );

      setSelectedProduct(null);
      setSearchQuery("");
      setShowTable(true);
      setIsEdit(false);
      await fetchNewArrivals();
    } catch (err) {
      showToast("error", "Something went wrong");
    }
  };

  // Table filter
  const filteredNewArrivals = newArrivals.filter((item) => {
    const matchesSearch =
      item.product_name?.toLowerCase().includes(tableSearch.toLowerCase()) ||
      item.product_sku?.toLowerCase().includes(tableSearch.toLowerCase()) ||
      item.meta?.promo_text?.toLowerCase().includes(tableSearch.toLowerCase());

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
          ? item.active === true
          : item.active === false;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <CustomBreadcrumb/>
      <h1 className="text-2xl font-bold mb-4">
        {isEdit ? "Edit New Arrival" : "Add New Arrival"}
      </h1>

      {/* Add New Arrival Button */}
      {!selectedProduct && (
        <>
          <div className="flex items-center justify-between">
            <Button
              variant="default"
              className="mb-4"
              onClick={() => setIsModalOpen(true)}
            >
              + Add New Arrival
            </Button>
            <div className="flex items-center gap-3">
              <SectionToggle sectionActive={sectionActive} handleToggle={handleToggle} />
              <span>{sectionActive ? "Section Active" : "Section Inactive"}</span>
            </div>
          </div>

          {/* Modal */}
          <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <AlertDialogContent className="max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Search Product</AlertDialogTitle>
                <AlertDialogDescription>
                  Search and select a product to add as New Arrival
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="mt-2 max-h-80 overflow-y-auto">
                <Input
                  type="text"
                  value={searchValue}
                  placeholder="Search product..."
                  className="mb-4"
                  onChange={handleSearchChange}
                />

                {loading && <p>Loading...</p>}
                {!loading && searchQuery && products.length === 0 && (
                  <p>No products found</p>
                )}

                <ul>
                  {products.map((product) => {
                    const alreadyAdded = newArrivals.some(
                      (na) => na.product_id === product.id
                    );
                    return (
                      <li
                        key={product.id}
                        className="border p-2 mb-2 flex justify-between items-center hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          {product.product_img && (
                            <img
                              className="w-10 h-10 object-cover rounded border"
                              src={product.product_img || "/placeholder.png"}
                              alt={product.name}
                            />
                          )}
                          <span className="font-medium">{product.name}</span>
                        </div>
                        {alreadyAdded ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-gray-200 text-gray-500 cursor-not-allowed"
                            disabled
                          >
                            Already Added
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              handleSelectProduct(product.id);
                              setIsModalOpen(false);
                            }}
                          >
                            Select
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setIsModalOpen(false); setSearchValue(""); setShowTable(true); setSearchQuery("") }}>
                  Close
                </AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {/* Table */}
      {showTable && !searchQuery && (
        <div className="mt-6">
          <div className="flex justify-end mb-3 gap-2 flex-col sm:flex-row">
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val)}
            >
              <SelectTrigger className="">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="text"
              placeholder="Search in new arrivals..."
              className="w-[250px]"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto border rounded-xl shadow-sm mt-4">
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Promo Text</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {newArrivals.length > 0 ? (
                  filteredNewArrivals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        No matching results
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredNewArrivals.map((item, index) => (
                      <TableRow key={item.id || index} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {item.product_name || item.product?.name}
                        </TableCell>
                        <TableCell>{item.product_sku || item.product?.product_sku}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {item.meta?.promo_text}
                        </TableCell>
                        <TableCell>
                          {item.product_img || item.product?.product_img ? (
                            <img
                              src={item.product_img || item.product?.product_img}
                              alt={item.product_name || item.product?.name || "product"}
                              className="h-14 w-14 object-cover rounded-md border"
                            />
                          ) : (
                            <p className="text-center">--</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.active ? (
                            <Badge variant="success" className="bg-green-600">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-500">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            Edit
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove New Arrival?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove this item?
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemove(item.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      No New Arrivals Found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Selected product form */}
      {selectedProduct && (
        <form onSubmit={handleSubmit} className="border p-4 rounded-md mt-4">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6 border-b pb-4">
            <img
              src={selectedProduct.product_img}
              alt={selectedProduct.name || "Selected Product"}
              className="w-28 h-28 object-cover rounded-md border"
            />
            <div className="flex flex-col gap-1 w-full">
              <h2 className="text-lg font-semibold">{selectedProduct.name}</h2>
              <p className="text-sm text-gray-600">
                SKU: {selectedProduct.product_sku || "-"}
              </p>
              <p className="text-sm text-gray-600">
                Brand: {selectedProduct.brand_name || "-"}
              </p>
              <p className="text-sm text-gray-600">
                Price: ₹{selectedProduct.price || "0"}
              </p>
              <p className="text-sm text-gray-600">
                Category: {selectedProduct.category_name || "-"}
              </p>
            </div>
          </div>

          <div className="mb-2 mt-4 flex flex-col md:flex-row gap-8">
            <div>
              <label className="font-medium">Start Date:</label>
              <Input
                type="date"
                value={formFields.startAt}
                onChange={(e) => handleChangeField("startAt", e.target.value)}
              />
              {errors.startAt && (
                <p className="text-red-500 text-sm mt-1">{errors.startAt}</p>
              )}
            </div>

            <div>
              <label className="font-medium">End Date:</label>
              <Input
                type="date"
                value={formFields.endAt}
                onChange={(e) => handleChangeField("endAt", e.target.value)}
              />
              {errors.endAt && (
                <p className="text-red-500 text-sm mt-1">{errors.endAt}</p>
              )}
            </div>
          </div>

          <div className="mb-2 mt-4 flex flex-col md:flex-row gap-8">
            <div>
              <label className="inline font-medium">Badge:</label>
              <Input
                value={formFields.badge}
                onChange={(e) => handleChangeField("badge", e.target.value)}
              />
            </div>

            <div>
              <label className="inline font-medium">Promo Text:</label>
              <Input
                value={formFields.promoText}
                onChange={(e) =>
                  handleChangeField("promoText", e.target.value)
                }
              />
            </div>

            <div>
              <label className="inline font-medium">Rank:</label>
              <Input
                type="number"
                value={formFields.rank}
                onChange={(e) => handleChangeField("rank", e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button type="submit" variant="default">
              {isEdit ? "Update" : "Add"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedProduct(null);
                setShowTable(true);
                setIsEdit(false);
                setSearchQuery("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
