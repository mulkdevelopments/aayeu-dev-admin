"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";

// Flatten tree to [{ id, name, path }] for "get path by id"
function flattenWithPath(nodes, parentPath = "", out = []) {
  if (!nodes || !nodes.length) return out;
  for (const n of nodes) {
    const path = parentPath ? `${parentPath} › ${n.name}` : n.name;
    out.push({ id: n.id, name: n.name, path });
    flattenWithPath(n.children || [], path, out);
  }
  return out;
}

// Collect id and all descendant ids for a node in the tree
function getDescendantIds(nodeId, nodes) {
  const ids = new Set([nodeId]);
  const find = (list) => {
    for (const n of list || []) {
      if (n.id === nodeId) {
        const collect = (c) => {
          if (!c) return;
          ids.add(c.id);
          (c.children || []).forEach(collect);
        };
        (n.children || []).forEach(collect);
        return true;
      }
      if (find(n.children)) return true;
    }
    return false;
  };
  find(nodes);
  return ids;
}

// Filter tree: remove node and its descendants (for "move under" options)
function filterTreeExcluding(nodes, excludeIds) {
  if (!nodes?.length) return [];
  return nodes
    .filter((n) => !excludeIds.has(n.id))
    .map((n) => ({ ...n, children: filterTreeExcluding(n.children, excludeIds) }));
}

function TreeNode({ node, level, expandedIds, setExpandedIds, selectedId, onSelect }) {
  const hasChildren = node.children?.length > 0;
  const isExpanded = expandedIds.has(node.id);
  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-1 w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100 cursor-pointer rounded-sm",
          selectedId === node.id && "bg-slate-100 font-medium"
        )}
        style={{ paddingLeft: 12 + level * 16 }}
      >
        <button
          type="button"
          aria-label={isExpanded ? "Collapse" : "Expand"}
          className="p-0.5 rounded hover:bg-slate-200"
          onClick={(e) => {
            e.stopPropagation();
            setExpandedIds((prev) => {
              const next = new Set(prev);
              if (next.has(node.id)) next.delete(node.id);
              else next.add(node.id);
              return next;
            });
          }}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />
          ) : (
            <span className="w-4 inline-block" />
          )}
        </button>
        <span
          className="flex-1 truncate"
          onClick={() => onSelect(node.id)}
          onKeyDown={(e) => e.key === "Enter" && onSelect(node.id)}
          role="button"
          tabIndex={0}
        >
          {node.name}
        </span>
      </div>
      {hasChildren && isExpanded &&
        node.children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            level={level + 1}
            expandedIds={expandedIds}
            setExpandedIds={setExpandedIds}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

const EditCategoryModal = ({ category, open, onClose, onSuccess, ourCategoriesTree = [] }) => {
  const { request } = useAxios();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    is_active: true,
    priority: 0,
    parent_id: null,
  });
  const [loading, setLoading] = useState(false);

  const excludeIds = useMemo(
    () => (category && ourCategoriesTree.length ? getDescendantIds(category.id, ourCategoriesTree) : new Set()),
    [category, ourCategoriesTree]
  );
  const parentOptionsFlat = useMemo(() => {
    if (!category || !ourCategoriesTree.length) return [];
    const flat = flattenWithPath(ourCategoriesTree);
    return flat.filter((o) => !excludeIds.has(o.id));
  }, [category, ourCategoriesTree, excludeIds]);
  const parentTreeFiltered = useMemo(
    () => filterTreeExcluding(ourCategoriesTree, excludeIds),
    [ourCategoriesTree, excludeIds]
  );

  const [parentPopoverOpen, setParentPopoverOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const selectedParentLabel =
    form.parent_id == null ? "— Top level (no parent)" : parentOptionsFlat.find((o) => o.id === form.parent_id)?.path ?? "Select parent";

  // ✅ Load initial data
  useEffect(() => {
    if (category) {
      setForm({
        name: category.name || "",
        slug: category.slug || "",
        is_active: category.is_active ?? true,
        priority: Number(category.priority) || 0,
        parent_id: category.parent_id || null,
      });
    }
  }, [category]);

  // ✅ Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "priority"
          ? Number(value) || 0
          : value,
    }));
  };

  // ✅ Auto-generate slug from name
  useEffect(() => {
    const generatedSlug = form.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
    setForm((prev) => ({ ...prev, slug: generatedSlug }));
  }, [form.name]);

  // ✅ Submit
  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!form.name.trim()) throw new Error("Category name is required");
      if (!form.slug.trim()) throw new Error("Slug is required");

      const payload = {
        category_id: category.id,
        name: form.name,
        slug: form.slug,
        is_active: form.is_active,
        priority: form.priority,
        parent_id: form.parent_id || null,
        metadata: category.metadata || null,
      };

      console.log("➡️ Payload being sent:", payload);

    const { data, error } = await request({
      method: "PUT",
      url: "/admin/update-category",  // ✅ backend URL
      payload: payload,
      authRequired: true,
    });

  if (error) throw new Error(error?.message || error);
 if(data.success) showToast("success", data.message );
    onSuccess && onSuccess(data.data); // backend ka data
    onClose();
  } catch (err) {
    showToast("error", err.message || "Update failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block mb-1 font-medium">Category Name</label>
            <Input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Category Name"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block mb-1 font-medium">
              Slug (Auto-Generated)
            </label>
            <Input
              name="slug"
              value={form.slug}
              readOnly
              className="bg-gray-100"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block mb-1 font-medium">Priority</label>
            <Input
              name="priority"
              type="number"
              min="0"
              value={form.priority}
              onChange={handleChange}
              placeholder="Enter numeric priority"
            />
          </div>

          {/* Parent (move category) - collapsible tree */}
          {category?.is_our_category && parentOptionsFlat.length > 0 && (
            <div>
              <label className="block mb-1 font-medium">Move under</label>
              <p className="text-xs text-slate-500 mb-2">
                Choose the new parent. Categories are shown collapsed; expand to see children.
              </p>
              <Popover open={parentPopoverOpen} onOpenChange={setParentPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={parentPopoverOpen}
                    className="w-full justify-between font-normal h-auto min-h-10 text-left"
                  >
                    <span className="truncate">{selectedParentLabel}</span>
                    <ChevronRight className={cn("h-4 w-4 shrink-0 opacity-50", parentPopoverOpen && "rotate-90")} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0" align="start">
                  <div className="max-h-[min(60vh,320px)] overflow-y-auto py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, parent_id: null }));
                        setParentPopoverOpen(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm font-medium hover:bg-slate-100 flex items-center",
                        form.parent_id == null && "bg-slate-100"
                      )}
                    >
                      — Top level (no parent)
                    </button>
                    {parentTreeFiltered.map((node) => (
                      <TreeNode
                        key={node.id}
                        node={node}
                        level={0}
                        expandedIds={expandedIds}
                        setExpandedIds={setExpandedIds}
                        selectedId={form.parent_id}
                        onSelect={(id) => {
                          setForm((f) => ({ ...f, parent_id: id }));
                          setParentPopoverOpen(false);
                        }}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Active */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              id="is_active"
            />
            <label htmlFor="is_active">Active</label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryModal;
