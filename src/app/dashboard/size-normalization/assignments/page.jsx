"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Loader2, Save, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";

const FILTER_TYPES = ["alpha", "alpha+numeric", "shoe", "numeric", "us", "none"];

function buildTree(flatNodes) {
  const map = {};
  const roots = [];
  for (const n of flatNodes) map[n.id] = { ...n, children: [] };
  for (const n of flatNodes) {
    if (n.parent_id && map[n.parent_id]) map[n.parent_id].children.push(map[n.id]);
    else roots.push(map[n.id]);
  }
  return roots;
}

function AssignRow({ node, depth, tables, assignments, onSave, expanded, onToggle, saving }) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const current = assignments[node.id] || {};
  const [tableId, setTableId] = useState(current.table_id || "none");
  const [filterType, setFilterType] = useState(current.filter_type || "alpha");
  const isDirty = tableId !== (current.table_id || "none") || filterType !== (current.filter_type || "alpha");

  return (
    <>
      <tr className="border-b border-gray-50 hover:bg-gray-50">
        <td className="py-2 px-3">
          <div className="flex items-center" style={{ paddingLeft: depth * 20 }}>
            {hasChildren ? (
              <button onClick={() => onToggle(node.id)} className="mr-2 p-0.5 rounded hover:bg-gray-200">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : <span className="mr-2 w-[18px]" />}
            <span className="text-sm">{node.name}</span>
          </div>
        </td>
        <td className="py-2 px-3 w-64">
          <Select value={tableId} onValueChange={setTableId}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— No Table —</SelectItem>
              {tables.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </td>
        <td className="py-2 px-3 w-44">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FILTER_TYPES.map((ft) => <SelectItem key={ft} value={ft}>{ft}</SelectItem>)}
            </SelectContent>
          </Select>
        </td>
        <td className="py-2 px-3 w-24 text-right">
          {isDirty && (
            <Button
              size="sm" variant="default" className="h-7 px-2 text-xs"
              disabled={saving === node.id}
              onClick={() => onSave(node.id, tableId === "none" ? null : tableId, filterType)}
            >
              {saving === node.id ? <Loader2 className="animate-spin h-3 w-3" /> : <Save size={12} className="mr-1" />}
              Save
            </Button>
          )}
        </td>
      </tr>
      {isExpanded && node.children.map((child) => (
        <AssignRow
          key={child.id} node={child} depth={depth + 1}
          tables={tables} assignments={assignments}
          onSave={onSave} expanded={expanded} onToggle={onToggle} saving={saving}
        />
      ))}
    </>
  );
}

export default function AssignmentsPage() {
  const [tree, setTree] = useState([]);
  const [tables, setTables] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const [saving, setSaving] = useState(null);
  const { request } = useAxios();

  useEffect(() => {
    const load = async () => {
      const [statusRes, tablesRes, assignRes] = await Promise.all([
        request({ method: "GET", url: "/admin/size-normalization/status", authRequired: true }),
        request({ method: "GET", url: "/admin/size-normalization/tables", authRequired: true }),
        request({ method: "GET", url: "/admin/size-normalization/assignments", authRequired: true }),
      ]);

      if (statusRes.data?.data?.tree) {
        const flat = statusRes.data.data.tree;
        setTree(buildTree(flat));
        const rootIds = flat.filter((n) => !n.parent_id).map((n) => n.id);
        const l2Ids = flat.filter((n) => n.depth === 1).map((n) => n.id);
        setExpanded(new Set([...rootIds, ...l2Ids]));
      }

      setTables(tablesRes.data?.data || []);

      const aMap = {};
      for (const a of (assignRes.data?.data || [])) {
        aMap[a.category_id] = a;
      }
      setAssignments(aMap);
      setLoading(false);
    };
    load();
  }, []);

  const toggleNode = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSave = async (categoryId, tableId, filterType) => {
    setSaving(categoryId);
    const { error } = await request({
      method: "POST",
      url: "/admin/size-normalization/assignments",
      authRequired: true,
      payload: { category_id: categoryId, table_id: tableId, filter_type: filterType },
    });
    if (error) showToast("error", error);
    else {
      showToast("success", "Assignment saved");
      setAssignments((prev) => ({
        ...prev,
        [categoryId]: { ...prev[categoryId], table_id: tableId, filter_type: filterType },
      }));
    }
    setSaving(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="animate-spin h-6 w-6" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb />

      <Card>
        <CardHeader>
          <CardTitle>Category Assignments</CardTitle>
          <p className="text-sm text-gray-500 mt-1">Assign a conversion table and filter type to each category</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th className="text-left py-2 px-3">Category</th>
                  <th className="text-left py-2 px-3">Conversion Table</th>
                  <th className="text-left py-2 px-3">Filter Type</th>
                  <th className="text-right py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {tree.map((root) => (
                  <AssignRow
                    key={root.id} node={root} depth={0}
                    tables={tables} assignments={assignments}
                    onSave={handleSave} expanded={expanded} onToggle={toggleNode}
                    saving={saving}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
