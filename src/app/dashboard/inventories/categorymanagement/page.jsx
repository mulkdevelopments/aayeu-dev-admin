"use client";

import React, { useEffect, useState, useMemo } from "react";
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

      // Start with all categories collapsed (empty array)
      setOpenIds([]);
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

  // Our-categories-only tree for "Move" parent selector in Edit modal
  const ourCategoriesTree = useMemo(() => {
    const filterOur = (nodes) => {
      if (!nodes?.length) return [];
      return nodes
        .filter((n) => n.is_our_category === true)
        .map((n) => ({ ...n, children: filterOur(n.children || []) }));
    };
    return filterOur(allCategories);
  }, [allCategories]);

  const toggleRow = (id) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const triggerRefresh = () => setRefresh((prev) => !prev);

  // Expand all or collapse all categories
  const toggleExpandAll = () => {
    if (openIds.length > 0) {
      // Collapse all
      setOpenIds([]);
    } else {
      // Expand all - collect all IDs recursively
      const collectAllIds = (categories) => {
        const ids = [];
        const traverse = (cat) => {
          if (cat?.id) ids.push(cat.id);
          if (cat?.children) {
            cat.children.forEach(traverse);
          }
        };
        categories.forEach(traverse);
        return ids;
      };
      setOpenIds(collectAllIds(categories));
    }
  };

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
        authRequired: true,
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

  // Recursive category renderer supporting unlimited depth (up to 5 levels displayed)
  const renderCategory = (category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isOpen = openIds.includes(category.id);
    const paddingLeft = `${level * 20}px`;

    // Background color based on level (alternating pattern)
    const bgColor = level === 0 ? "bg-gray-50" : level === 1 ? "bg-gray-100" : "bg-white";
    const fontWeight = level === 0 ? "font-bold" : level === 1 ? "font-medium" : "font-normal";

    return (
      <React.Fragment key={category.id}>
        <TableRow
          className={`${fontWeight} ${bgColor} ${hasChildren ? "cursor-pointer" : ""}`}
          onClick={() => hasChildren && toggleRow(category.id)}
        >
          <TableCell style={{ paddingLeft }}>
            <span className="inline-flex items-center">
              {hasChildren && (
                <ChevronRight
                  size={16}
                  className={`mr-2 transition-transform duration-150 ${
                    isOpen ? "rotate-90" : "rotate-0"
                  }`}
                />
              )}
              {!hasChildren && <span className="w-6 inline-block" />}
              {formatName(category.name)}
            </span>
          </TableCell>
          <TableCell>{category.slug}</TableCell>
          <TableCell>{category.is_active ? "Yes" : "No"}</TableCell>
          <TableCell>
            {renderActions(
              category,
              (e) => {
                if (hasChildren) e.stopPropagation();
                setEditCategory(category);
              },
              hasChildren
            )}
          </TableCell>
        </TableRow>

        {/* Recursively render children */}
        {hasChildren && isOpen && category.children.map((child) => renderCategory(child, level + 1))}
      </React.Fragment>
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
          <div className="w-full lg:w-44 bg-gray-200 rounded-2xl">
            <Button
              className="w-full bg-gray-600 hover:bg-gray-700"
              onClick={toggleExpandAll}
              variant="secondary"
            >
              {openIds.length > 0 ? "Collapse All" : "Expand All"}
            </Button>
          </div>
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
              {categories.map((category) => renderCategory(category))}
            </TableBody>
          </Table>
        )}
      </div>

      <EditCategoryModal
        category={editCategory}
        open={!!editCategory}
        onClose={() => setEditCategory(null)}
        onSuccess={triggerRefresh}
        ourCategoriesTree={ourCategoriesTree}
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
