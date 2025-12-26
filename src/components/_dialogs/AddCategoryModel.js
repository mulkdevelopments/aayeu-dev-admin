"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";
import { ChevronRight, ChevronDown } from "lucide-react";

// ✅ Zod schema
const categorySchema = z.object({
  name: z.string().min(1, "Category Name is required"),
  slug: z.string().min(1, "Slug is required"),
  metadata: z.object({
    icon: z.string().min(1, "Metadata Icon is required"),
  }),
  priority: z
    .string()
    .min(1, "Priority is required")
    .refine((val) => !isNaN(Number(val)), "Priority must be a number"),
  selectedCategory: z.string().optional(),
});

const AddCategoryModel = ({ open, onClose, onSuccess, categories = [], preselectCategoryId = "" }) => {
  const { request } = useAxios();
  const [expandedIds, setExpandedIds] = React.useState([]);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = React.useRef(null);

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      metadata: { icon: "" },
      priority: "",
      selectedCategory: "",
    },
  });

  const nameValue = watch("name");
  const selectedCategoryId = watch("selectedCategory");

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // When modal opens or preselect changes, set selectedCategory
  React.useEffect(() => {
    if (open) {
      setValue("selectedCategory", preselectCategoryId || "");
    }
  }, [open, preselectCategoryId, setValue]);

  // ✅ Auto-generate slug
  React.useEffect(() => {
    const generatedSlug = nameValue
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
    setValue("slug", generatedSlug);
  }, [nameValue, setValue]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        name: data.name,
        slug: data.slug,
        metadata: data.metadata,
        priority: Number(data.priority),
        parent_id: data.selectedCategory || null,
      };

      const { data: response, error } = await request({
        method: "POST",
        url: "/admin/create-category",
        payload,
        authRequired: true,
      });

      if (error) throw new Error(error?.message || error);
      if (response.success) showToast("success", response.message);
      // showToast("success", response.message || "Category created successfully");
      onSuccess && onSuccess(response.data);
      reset();
      onClose();
    } catch (err) {
      showToast("error", err.message || "Failed to create category");
    }
  };

  // ✅ Name formatter for nested display
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

  // Toggle expand/collapse for a category
  const toggleExpand = (categoryId) => {
    setExpandedIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Get category name by ID (for display in trigger)
  const getSelectedCategoryName = (id) => {
    if (!id) return null;
    const findCategory = (cats) => {
      for (const cat of cats) {
        if (cat.id === id) return formatName(cat.name);
        if (cat.children) {
          const found = findCategory(cat.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findCategory(categories);
  };

  // ✅ Recursive function to render collapsible category tree
  const renderCategoryTree = (categoryList, level = 0) => {
    if (!categoryList || categoryList.length === 0) return null;

    return categoryList.map((cat) => {
      const hasChildren = cat.children && cat.children.length > 0;
      const isExpanded = expandedIds.includes(cat.id);
      const isSelected = selectedCategoryId === cat.id;

      return (
        <div key={cat.id} className="w-full">
          <div
            className={`flex items-center py-2 px-3 cursor-pointer hover:bg-gray-100 rounded ${
              isSelected ? 'bg-yellow-100 hover:bg-yellow-100' : ''
            }`}
            style={{ paddingLeft: `${(level * 20) + 12}px` }}
            onClick={(e) => {
              e.stopPropagation();
              setValue("selectedCategory", cat.id);
              setShowDropdown(false);
            }}
          >
            {hasChildren && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(cat.id);
                }}
                className="mr-2 p-0.5 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            {!hasChildren && <span className="w-6 mr-2" />}
            <span className={`text-sm ${level === 0 ? 'font-semibold' : level === 1 ? 'font-medium' : 'font-normal'}`}>
              {formatName(cat.name)}
            </span>
          </div>
          {hasChildren && isExpanded && renderCategoryTree(cat.children, level + 1)}
        </div>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="lg:text-2xl md:text-xl text-start font-bold">
            Add Category
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-2">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Select Existing Category */}
            <div className="mt-4 w-full">
              <label className="block mb-1 font-medium">
                Choose Existing Category
              </label>
              <p className="text-sm text-gray-500 mb-1">
                Select an existing category if you want to add data under it,
                otherwise leave it blank to create a new category.
              </p>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full border rounded px-3 py-2 text-left bg-white hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className={selectedCategoryId ? "text-black" : "text-gray-500"}>
                    {selectedCategoryId ? getSelectedCategoryName(selectedCategoryId) : "Select Category (optional)"}
                  </span>
                  <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-80 overflow-y-auto">
                    <div className="p-2">
                      <button
                        type="button"
                        onClick={() => {
                          setValue("selectedCategory", "");
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded mb-1"
                      >
                        None (Create root category)
                      </button>
                      {renderCategoryTree(categories)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Category Name */}
            <div className="mt-4">
              <label className="block mb-1 font-medium">Category Name</label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Category Name"
                    className="border p-2 rounded w-full"
                  />
                )}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Slug */}
            <div className="mt-4">
              <label className="block mb-1 font-medium">Slug (Auto)</label>
              <Controller
                name="slug"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Auto-generated"
                    className="border p-2 rounded w-full bg-gray-100"
                    readOnly
                  />
                )}
              />
            </div>

            {/* Priority */}
            <div className="mt-4">
              <label className="block mb-1 font-medium">Priority</label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter numeric priority (e.g., 1)"
                    className="border p-2 rounded w-full"
                    type="number"
                    min="0"
                  />
                )}
              />
              {errors.priority && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.priority.message}
                </p>
              )}
            </div>

            {/* Metadata Icon */}
            <div className="mt-4">
              <label className="block mb-1 font-medium">Metadata Icon</label>
              <Controller
                name="metadata.icon"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Metadata Icon (e.g., man)"
                    className="border p-2 rounded w-full"
                  />
                )}
              />
              {errors.metadata?.icon && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.metadata.icon.message}
                </p>
              )}
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit(onSubmit)}>Submit</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryModel;
