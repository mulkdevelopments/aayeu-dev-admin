"use client";

import React, { useEffect, useState } from "react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import AddCategoryModel from "@/components/_dialogs/AddCategoryModel";
import CategorySkeleton from "@/components/skeleton/CategorySkeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import EditCategoryModal from "@/components/_dialogs/EditCategory";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

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

const CategoryManagement = () => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [editCategory, setEditCategory] = useState(null);
  const [openIds, setOpenIds] = useState([]);
  const { request } = useAxios();
  const [isOpen, setIsOpen] = useState(false);
  const [Refresh, setRefresh] = useState(false);

  const [filterType, setFilterType] = useState("our");
  const [vendorId, setVendorId] = useState("");

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    getCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Refresh]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, vendorId, allCategories]);

  const getCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/get-categories",
        authRequired: true,
      });
      if (error) throw new Error(error.message);

      const fetched = data?.data || [];
      setAllCategories(fetched);
      setCategories(fetched);

      const allIds = [];
      fetched.forEach((p) => {
        allIds.push(p.id);
        p.children?.forEach((c) => {
          allIds.push(c.id);
          c.children?.forEach((s) => allIds.push(s.id));
        });
      });
      setOpenIds(allIds);
    } catch (err) {
      showToast("error", err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allCategories];

    if (filterType === "our") {
      filtered = filtered.filter((cat) => cat.is_our_category === true);
    } else if (filterType === "vendor") {
      filtered = filtered.filter((cat) => {
        if (!cat.is_our_category && vendorId) {
          return cat.vendor_id === vendorId;
        }
        return !cat.is_our_category;
      });
    }

    setCategories(filtered);
  };

  const toggleRow = (id) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const triggerRefresh = () => setRefresh((prev) => !prev);

  const formatName = (name) =>
    name
      .split("-")
      .map((part) =>
        part
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ")
      )
      .join("-");

  // === DELETE ===
  const confirmDelete = (e, cat) => {
    e.stopPropagation();
    setPendingDelete(cat);
  };

  const performDelete = async () => {
    if (!pendingDelete?.id) return;
    const categoryId = pendingDelete.id;

    const payload = { category_id: categoryId };
    console.log("Deleting category payload =>", payload);

    try {
      setDeletingId(categoryId);

      // Send payload in multiple conventional keys to be safe with custom hooks
      const { data, error } = await request({
        method: "PUT",
        url: "/admin/delete-category",
        headers: { "Content-Type": "application/json" },
        data: payload,      // axios-style
        payload,            // custom hook style (sometimes used)
        body: payload,      // fetch-style fall-back
      });

      if (error) throw new Error(error.message);

      const msg = data?.message || "Category deleted successfully";
      showToast("success", msg);
      setPendingDelete(null);
      triggerRefresh();
    } catch (err) {
      showToast("error", err?.message || "Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  };

  const renderActions = (cat, onEditClick, rowClickable = true) => {
    const isOur = !!cat?.is_our_category;

    return (
      <div className="flex gap-2">
        <Button
          onClick={(e) => {
            if (rowClickable) e.stopPropagation();
            onEditClick(e);
          }}
          size="sm"
          variant="outline"
        >
          Edit
        </Button>

        {isOur && (
          <AlertDialog
            open={pendingDelete?.id === cat.id}
            onOpenChange={(open) => {
              if (!open) setPendingDelete(null);
            }}
          >
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => confirmDelete(e, cat)}
                disabled={deletingId === cat.id}
              >
                {deletingId === cat.id ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader className="space-y-2">
                <AlertDialogTitle>Delete this category?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The category{" "}
                  <span className="font-semibold">{pendingDelete?.name}</span> will be permanently
                  deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setPendingDelete(null)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={performDelete}
                  disabled={deletingId === cat.id}
                >
                  {deletingId === cat.id ? "Deleting..." : "Yes, delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <CustomBreadcrumb />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-3">
        <h1 className="lg:text-3xl md:text-2xl text-xl font-bold md:w-full w-full">
          Category Management
        </h1>

        <div className="flex gap-3 w-full justify-end">
          <div className="w-full lg:w-40 bg-amber-600 rounded-2xl">
            <Button className="w-full" onClick={triggerRefresh}>
              Refresh
            </Button>
          </div>
          <div className="w-full lg:w-40 bg-amber-600 rounded-2xl">
            <Button className="w-full" onClick={() => setIsOpen(true)}>
              Add Category
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mt-10">
        <div className="w-full sm:w-56">
          <Label className="mb-2">Filter By Type</Label>
          <Select
            value={filterType}
            onValueChange={(v) => {
              setFilterType(v);
              setVendorId("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="our">Our Categories</SelectItem>
              <SelectItem value="vendor">Vendor Categories</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* 
        {filterType === "our" && (
          <div className="w-full sm:w-56 flex items-end">
            <Button
              className="w-full"
              onClick={() => router.push("/dashboard/inventories/categorymanagement")}
            >
              Manage Category
            </Button>
          </div>
        )} */}

        {filterType === "vendor" && (
          <div className="w-full sm:w-56">
            <Label className="mb-2">Select Vendor</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="b34fd0f6-815a-469e-b7c2-73f9e8afb3ed">
                  Peppela
                </SelectItem>
                <SelectItem value="a6bdd96b-0e2c-4f3e-b644-4e088b1778e0">
                  Bdroppy
                </SelectItem>
                <SelectItem value="65053474-4e40-44ee-941c-ef5253ea9fc9">
                  Luxury Distribution
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="mt-4">
        {loading ? (
          <CategorySkeleton />
        ) : (
          <Table>
            <TableHeader className="bg-gray-200">
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {categories.map((parent) => (
                <React.Fragment key={parent.id}>
                  {/* Level 0 */}
                  <TableRow
                    className="font-bold bg-gray-50 cursor-pointer"
                    onClick={() => toggleRow(parent.id)}
                  >
                    <TableCell style={{ paddingLeft: "0px" }}>
                      <span className="inline-flex items-center">
                        <ChevronRight
                          size={16}
                          className={`mr-2 transition-transform duration-150 ${openIds.includes(parent.id) ? "rotate-90" : "rotate-0"
                            }`}
                        />
                        {parent.name}
                      </span>
                    </TableCell>
                    <TableCell>{parent.slug}</TableCell>
                    <TableCell>{parent.is_active ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      {renderActions(
                        parent,
                        (e) => {
                          e.stopPropagation();
                          setEditCategory(parent);
                        },
                        true
                      )}
                    </TableCell>
                  </TableRow>

                  {/* Level 1 */}
                  {openIds.includes(parent.id) &&
                    parent.children?.map((child) => (
                      <React.Fragment key={child.id}>
                        <TableRow
                          className="font-medium bg-gray-100 cursor-pointer"
                          onClick={() => toggleRow(child.id)}
                        >
                          <TableCell style={{ paddingLeft: "20px" }}>
                            <span className="inline-flex items-center">
                              <ChevronRight
                                size={16}
                                className={`mr-2 transition-transform duration-150 ${openIds.includes(child.id) ? "rotate-90" : "rotate-0"
                                  }`}
                              />
                              {child.name}
                            </span>
                          </TableCell>
                          <TableCell>{child.slug}</TableCell>
                          <TableCell>{child.is_active ? "Yes" : "No"}</TableCell>
                          <TableCell>
                            {renderActions(
                              child,
                              (e) => {
                                e.stopPropagation();
                                setEditCategory(child);
                              },
                              true
                            )}
                          </TableCell>
                        </TableRow>

                        {/* Level 2 */}
                        {openIds.includes(child.id) &&
                          child.children?.map((sub) => (
                            <TableRow key={sub.id} className="font-normal bg-white">
                              <TableCell style={{ paddingLeft: "40px" }}>
                                {formatName(sub.name)}
                              </TableCell>
                              <TableCell>{sub.slug}</TableCell>
                              <TableCell>{sub.is_active ? "Yes" : "No"}</TableCell>
                              <TableCell>
                                {renderActions(sub, () => setEditCategory(sub), false)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </React.Fragment>
                    ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <EditCategoryModal
        category={editCategory}
        open={!!editCategory}
        onClose={() => setEditCategory(null)}
        onSuccess={triggerRefresh}
      />

      <AddCategoryModel
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={triggerRefresh}
        categories={categories}
      />
    </div>
  );
};

export default CategoryManagement;
