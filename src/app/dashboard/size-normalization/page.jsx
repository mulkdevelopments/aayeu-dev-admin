"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Loader2, RefreshCw, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";
import Link from "next/link";

function coverageColor(pct) {
  if (pct >= 90) return "text-green-700 bg-green-50";
  if (pct >= 50) return "text-yellow-700 bg-yellow-50";
  if (pct > 0) return "text-red-700 bg-red-50";
  return "text-gray-500 bg-gray-50";
}

function progressColor(pct) {
  if (pct >= 90) return "bg-green-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

function buildTree(flatNodes) {
  const map = {};
  const roots = [];
  for (const n of flatNodes) {
    map[n.id] = { ...n, children: [] };
  }
  for (const n of flatNodes) {
    if (n.parent_id && map[n.parent_id]) {
      map[n.parent_id].children.push(map[n.id]);
    } else {
      roots.push(map[n.id]);
    }
  }
  return roots;
}

function TreeNode({ node, stats, depth = 0, expanded, onToggle }) {
  const s = stats[node.id] || { total: 0, mapped: 0, unmapped: 0, coverage: 0 };
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <td className="py-2.5 px-3">
          <div className="flex items-center" style={{ paddingLeft: depth * 20 }}>
            {hasChildren ? (
              <button
                onClick={() => onToggle(node.id)}
                className="mr-2 p-0.5 rounded hover:bg-gray-200 transition-colors"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="mr-2 w-[18px]" />
            )}
            <span className="text-sm font-medium text-gray-900">{node.name}</span>
            {node.filter_type && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-600 uppercase tracking-wide">
                {node.filter_type}
              </span>
            )}
            {node.table_name && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-blue-50 text-blue-600 truncate max-w-[160px]">
                {node.table_name}
              </span>
            )}
          </div>
        </td>
        <td className="py-2.5 px-3 text-right text-sm tabular-nums">{s.total.toLocaleString()}</td>
        <td className="py-2.5 px-3 text-right text-sm tabular-nums text-green-700">{s.mapped.toLocaleString()}</td>
        <td className="py-2.5 px-3 text-right text-sm tabular-nums text-red-600">{s.unmapped.toLocaleString()}</td>
        <td className="py-2.5 px-3 w-40">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progressColor(s.coverage)}`}
                style={{ width: `${Math.min(s.coverage, 100)}%` }}
              />
            </div>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${coverageColor(s.coverage)}`}>
              {s.coverage}%
            </span>
          </div>
        </td>
        <td className="py-2.5 px-3 text-center">
          {depth >= 2 && s.total > 0 && (
            <Link href={`/dashboard/size-normalization/run/${node.id}`}>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                Run <ArrowRight size={12} className="ml-1" />
              </Button>
            </Link>
          )}
        </td>
      </tr>
      {isExpanded &&
        node.children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            stats={stats}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
          />
        ))}
    </>
  );
}

export default function SizeNormalizationDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const { request } = useAxios();

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await request({
        method: "GET",
        url: "/admin/size-normalization/status",
        authRequired: true,
      });
      if (error) throw new Error(error);
      setData(res.data);
      const rootIds = (res.data.tree || []).filter((n) => !n.parent_id).map((n) => n.id);
      const l2Ids = (res.data.tree || []).filter((n) => n.depth === 1).map((n) => n.id);
      setExpanded(new Set([...rootIds, ...l2Ids]));
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const tree = useMemo(() => (data ? buildTree(data.tree) : []), [data]);

  const totals = useMemo(() => {
    if (!data?.stats) return { total: 0, mapped: 0, unmapped: 0 };
    return Object.values(data.stats).reduce(
      (acc, s) => ({
        total: acc.total + s.total,
        mapped: acc.mapped + s.mapped,
        unmapped: acc.unmapped + s.unmapped,
      }),
      { total: 0, mapped: 0, unmapped: 0 }
    );
  }, [data]);

  const overallPct = totals.total > 0 ? Math.round((totals.mapped / totals.total) * 10) / 10 : 0;

  function toggleNode(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Total Variants</p>
            <p className="text-2xl font-bold">{totals.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Mapped</p>
            <p className="text-2xl font-bold text-green-700">{totals.mapped.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Unmapped</p>
            <p className="text-2xl font-bold text-red-600">{totals.unmapped.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Overall Coverage</p>
            <p className="text-2xl font-bold">{overallPct}%</p>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${progressColor(overallPct)}`} style={{ width: `${overallPct}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="flex gap-3">
        <Link href="/dashboard/size-normalization/tables">
          <Button variant="outline">Conversion Tables</Button>
        </Link>
        <Link href="/dashboard/size-normalization/assignments">
          <Button variant="outline">Category Assignments</Button>
        </Link>
        <Link href="/dashboard/size-normalization/history">
          <Button variant="outline">History & Rollback</Button>
        </Link>
        <Button variant="outline" onClick={fetchStatus}>
          <RefreshCw size={14} className="mr-2" /> Refresh
        </Button>
      </div>

      {/* Category Tree */}
      <Card>
        <CardHeader>
          <CardTitle>Category Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th className="text-left py-2 px-3">Category</th>
                  <th className="text-right py-2 px-3">Total</th>
                  <th className="text-right py-2 px-3">Mapped</th>
                  <th className="text-right py-2 px-3">Unmapped</th>
                  <th className="text-left py-2 px-3">Coverage</th>
                  <th className="text-center py-2 px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {tree.map((root) => (
                  <TreeNode
                    key={root.id}
                    node={root}
                    stats={data?.stats || {}}
                    depth={0}
                    expanded={expanded}
                    onToggle={toggleNode}
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
