"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";
import { Loader2, RefreshCw, RotateCcw, Trash2, Plus, Sparkles, ShieldCheck } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import ProductViewModal from "@/components/_dialogs/ProductViewModal";

export default function DeletedSuspiciousProductsPage() {
  const { request } = useAxios();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all"); // all | deleted | suspicious
  const [recoveringId, setRecoveringId] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [jumpToPage, setJumpToPage] = useState("");
  const [bulkSelectedIds, setBulkSelectedIds] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const selectAllCheckboxRef = useRef(null);

  const [blacklist, setBlacklist] = useState([]);
  const [blacklistLoading, setBlacklistLoading] = useState(false);
  const [newCompetitorName, setNewCompetitorName] = useState("");
  const [addingBlacklist, setAddingBlacklist] = useState(false);
  const [deletingBlacklistId, setDeletingBlacklistId] = useState(null);

  const [qaDryRun, setQaDryRun] = useState(true);
  const [qaIncludeCategorySoft, setQaIncludeCategorySoft] = useState(false);
  const [qaRunning, setQaRunning] = useState(false);
  const [qaResult, setQaResult] = useState(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: `/admin/deleted-suspicious-products?page=${currentPage}&limit=20&filter=${filter}`,
        authRequired: true,
      });
      if (error) throw new Error(error?.message || error);
      if (data?.success && data?.data) {
        setProducts(data.data.products || []);
        setTotal(data.data.total ?? 0);
        setTotalPages(data.data.totalPages ?? 1);
      }
    } catch (err) {
      console.error(err);
      showToast("error", err.message || "Failed to load list");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter]); // omit request to avoid re-run when hook identity changes

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    setBulkSelectedIds(new Set());
  }, [currentPage, filter]);

  const fetchBlacklist = useCallback(async () => {
    setBlacklistLoading(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/competitor-blacklist",
        authRequired: true,
      });
      if (error) throw new Error(error?.message || error);
      if (data?.success && data?.data?.list) setBlacklist(data.data.list);
    } catch (err) {
      showToast("error", err.message || "Failed to load blacklist");
    } finally {
      setBlacklistLoading(false);
    }
  }, []); // run once on mount only

  useEffect(() => {
    fetchBlacklist();
  }, [fetchBlacklist]);

  const handleAddBlacklist = async () => {
    const name = newCompetitorName.trim();
    if (!name) return;
    setAddingBlacklist(true);
    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/competitor-blacklist",
        payload: { name },
        authRequired: true,
      });
      if (error) throw new Error(error?.message || error);
      showToast("success", data?.message || "Added");
      setNewCompetitorName("");
      await fetchBlacklist();
    } catch (err) {
      showToast("error", err.message || "Failed to add");
    } finally {
      setAddingBlacklist(false);
    }
  };

  const handleRemoveBlacklist = async (id) => {
    setDeletingBlacklistId(id);
    try {
      const { data, error } = await request({
        method: "DELETE",
        url: `/admin/competitor-blacklist/${id}`,
        authRequired: true,
      });
      if (error) throw new Error(error?.message || error);
      showToast("success", data?.message || "Removed");
      await fetchBlacklist();
    } catch (err) {
      showToast("error", err.message || "Failed to remove");
    } finally {
      setDeletingBlacklistId(null);
    }
  };

  const handleRecover = async (productId) => {
    if (!productId) return;
    setRecoveringId(productId);
    try {
      const { data, error } = await request({
        method: "PUT",
        url: "/admin/recover-product",
        payload: { product_id: productId },
        authRequired: true,
      });
      if (error) throw new Error(error?.message || error);
      showToast("success", data?.message || "Product recovered");
      await fetchList();
    } catch (err) {
      console.error(err);
      showToast("error", err.message || "Failed to recover");
    } finally {
      setRecoveringId(null);
    }
  };

  const toggleBulkSelect = (productId, e) => {
    e?.stopPropagation?.();
    setBulkSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const toggleSelectAll = (e) => {
    e?.stopPropagation?.();
    if (bulkSelectedIds.size >= products.length) {
      setBulkSelectedIds(new Set());
    } else {
      setBulkSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  const clearBulkSelection = () => setBulkSelectedIds(new Set());

  useEffect(() => {
    const el = selectAllCheckboxRef.current;
    if (el && products.length > 0) {
      el.indeterminate = bulkSelectedIds.size > 0 && bulkSelectedIds.size < products.length;
    }
  }, [bulkSelectedIds.size, products.length]);

  const runQuarantineQa = async () => {
    setQaRunning(true);
    setQaResult(null);
    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/quarantine-qa-run",
        authRequired: true,
        payload: {
          dry_run: qaDryRun,
          include_category_soft_failures: qaIncludeCategorySoft,
        },
      });
      if (error) throw new Error(data?.message || error);
      setQaResult(data?.data ?? null);
      const msg = data?.message || "QA run finished";
      showToast("success", msg);
      if (!qaDryRun) await fetchList();
    } catch (err) {
      showToast("error", err?.message || "QA run failed");
    } finally {
      setQaRunning(false);
    }
  };

  const runBulkRecover = async () => {
    if (bulkActionLoading || bulkSelectedIds.size === 0) return;
    setBulkActionLoading(true);
    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/bulk-recover-products",
        authRequired: true,
        payload: { product_ids: Array.from(bulkSelectedIds) },
      });
      if (error) throw new Error(data?.message || error);
      showToast("success", data?.message || "Recovered");
      clearBulkSelection();
      await fetchList();
    } catch (err) {
      showToast("error", err?.message || "Recover failed");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return dt.toLocaleDateString() + " " + dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <CustomBreadcrumb
        items={[
          { label: "Dashboard", path: "/dashboard" },
          { label: "Inventory", path: "/dashboard/inventories" },
          { label: "Quarantine", path: "/dashboard/inventories/deleted-suspicious" },
        ]}
      />
      <div className="mb-6 mt-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quarantine</h1>
        <p className="text-sm text-slate-500 mt-1">
          Products here are soft-deleted and inactive. Recover to make them active again.
        </p>
      </div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px] border-slate-200 bg-white">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="deleted">Deleted only</SelectItem>
              <SelectItem value="suspicious">Suspicious only</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="border-slate-300 text-slate-700" onClick={fetchList} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="mb-6 border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-900">Competitor blacklist</CardTitle>
          <p className="text-sm text-slate-500 font-normal">
            Names listed here are detected in product name/description during sync. Matching products are marked suspicious, deleted, and inactive.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Input
              placeholder="Competitor name to blacklist"
              value={newCompetitorName}
              onChange={(e) => setNewCompetitorName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddBlacklist()}
              className="max-w-xs border-slate-200"
            />
            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white" onClick={handleAddBlacklist} disabled={addingBlacklist || !newCompetitorName.trim()}>
              {addingBlacklist ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add
            </Button>
          </div>
          {blacklistLoading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {blacklist.length === 0 ? (
                <span className="text-sm text-slate-500">No names in blacklist. Add competitor names above.</span>
              ) : (
                blacklist.map((item) => (
                  <Badge key={item.id} className="flex items-center gap-1 bg-slate-100 text-slate-700 border-0 py-1.5">
                    {item.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveBlacklist(item.id)}
                      disabled={deletingBlacklistId === item.id}
                      className="ml-1 rounded hover:bg-slate-200 p-0.5 text-slate-600"
                      aria-label="Remove"
                    >
                      {deletingBlacklistId === item.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </Badge>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6 border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/40 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" aria-hidden />
            <CardTitle className="text-base text-slate-900">Quarantine QA agent</CardTitle>
          </div>
          <p className="text-sm text-slate-500 font-normal">
            Scans up to 500 suspicious products (most recent first).{" "}
            <strong className="font-medium text-slate-700">Competitor rule:</strong> re-checks name, title, and description against the{" "}
            <em>current</em> blacklist — if nothing matches anymore (e.g. term removed or false positive), those rows are recovered automatically.{" "}
            <strong className="font-medium text-slate-700">Optional:</strong> also recover products quarantined only for taxonomy / “no matching category” messages when the text is still clean for competitors.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:items-center">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                checked={qaDryRun}
                onChange={(e) => setQaDryRun(e.target.checked)}
              />
              <span>Dry run (preview only, no recoveries)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                checked={qaIncludeCategorySoft}
                onChange={(e) => setQaIncludeCategorySoft(e.target.checked)}
              />
              <span>Include category-mapping quarantines (no taxonomy match)</span>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={runQuarantineQa}
              disabled={qaRunning}
            >
              {qaRunning ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {qaRunning ? "Running…" : qaDryRun ? "Run dry scan" : "Run & recover"}
            </Button>
            <span className="text-xs text-slate-500">
              Name/description mismatch and other AI flags stay manual unless they match the category rules above.
            </span>
          </div>
          {qaResult && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm space-y-2">
              <p className="font-semibold text-slate-800">Last run</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-slate-600">
                <li>Scanned: {qaResult.scanned ?? "—"}</li>
                <li>
                  {qaResult.dry_run ? "Would recover" : "Recovered"}:{" "}
                  {qaResult.dry_run ? qaResult.recover_count ?? 0 : qaResult.recovered ?? 0}
                </li>
                <li>Competitor-cleared: {qaResult.summary?.recover_competitor_cleared ?? 0}</li>
                <li>Category-soft: {qaResult.summary?.recover_category_soft ?? 0}</li>
                <li>Skipped (competitor still in text): {qaResult.summary?.skip_competitor_still ?? 0}</li>
                <li>Skipped (manual review): {qaResult.summary?.skip_manual ?? 0}</li>
              </ul>
              {qaResult.details_truncated && (
                <p className="text-xs text-amber-700">
                  Detail list truncated in response ({qaResult.details_total} rows); re-run or use logs if needed.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk action bar */}
      {bulkSelectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <span className="text-sm font-medium text-slate-700">{bulkSelectedIds.size} selected</span>
          <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white" onClick={runBulkRecover} disabled={bulkActionLoading}>
            {bulkActionLoading ? "Recovering…" : "Recover selected"}
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-600" onClick={clearBulkSelection} disabled={bulkActionLoading}>
            Clear selection
          </Button>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 hover:bg-slate-100/50">
                  <TableHead className="w-10 pr-0">
                    <input
                      type="checkbox"
                      ref={selectAllCheckboxRef}
                      checked={products.length > 0 && bulkSelectedIds.size === products.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 accent-slate-700"
                      aria-label="Select all on page"
                    />
                  </TableHead>
                  <TableHead className="w-[60px] text-slate-600 font-semibold">Image</TableHead>
                  <TableHead className="text-slate-600 font-semibold">Name</TableHead>
                  <TableHead className="text-slate-600 font-semibold">Brand</TableHead>
                  <TableHead className="text-slate-600 font-semibold">Vendor</TableHead>
                  <TableHead className="text-slate-600 font-semibold">Status</TableHead>
                  <TableHead className="text-slate-600 font-semibold">Deleted at</TableHead>
                  <TableHead className="text-slate-600 font-semibold">Suspicious</TableHead>
                  <TableHead className="text-right text-slate-600 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-slate-50/30">
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-slate-500 py-8">
                      No deleted or suspicious products
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => (
                    <TableRow
                      key={p.id}
                      className={`cursor-pointer transition-colors ${bulkSelectedIds.has(p.id) ? "bg-slate-100" : "hover:bg-slate-50"}`}
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setIsProductModalOpen(true);
                      }}
                    >
                      <TableCell className="w-10 pr-0" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={bulkSelectedIds.has(p.id)}
                          onChange={(e) => toggleBulkSelect(p.id, e)}
                          className="h-4 w-4 rounded border-slate-300 accent-slate-700"
                          aria-label={`Select ${p.name || p.id}`}
                        />
                      </TableCell>
                      <TableCell className="w-[60px] p-2">
                      {p.product_img ? (
                        <div className="relative w-12 h-12 rounded overflow-hidden bg-muted shrink-0">
                          <Image
                            src={p.product_img}
                            alt={p.name || ""}
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded bg-slate-200 text-xs text-slate-500 shrink-0">
                          No img
                        </div>
                      )}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate text-slate-900" title={p.name}>
                        {p.name || "—"}
                      </TableCell>
                      <TableCell className="text-slate-700">{p.brand_name || "—"}</TableCell>
                      <TableCell className="text-slate-700">{p.vendor_name || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge className={`text-xs border-0 ${p.deleted_at ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-700"}`}>
                            {p.deleted_at ? "Deleted" : "Active"}
                          </Badge>
                          <Badge className={`text-xs border-0 ${p.is_active ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-600"}`}>
                            {p.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{formatDate(p.deleted_at)}</TableCell>
                      <TableCell>
                        {p.suspicious_at ? (
                          <Badge className="whitespace-nowrap bg-slate-700 text-white border-0">
                            {p.suspicious_reason || "Yes"}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-300 text-slate-700 hover:bg-slate-100"
                          onClick={() => handleRecover(p.id)}
                          disabled={recoveringId === p.id}
                        >
                          {recoveringId === p.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Recover
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {(totalPages >= 1 || total > 0) && (
        <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4 py-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-700"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(1)}
              title="First page"
            >
              «
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-700"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">
              Page {currentPage} of {totalPages} ({total} total)
            </span>
            <span className="text-slate-300">|</span>
            <Input
              type="number"
              min={1}
              max={totalPages}
              placeholder="Go to"
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const page = parseInt(jumpToPage, 10);
                  if (page >= 1 && page <= totalPages) {
                    setCurrentPage(page);
                    setJumpToPage("");
                  }
                }
              }}
              className="w-20 h-8 text-center border-slate-200"
            />
            <Button
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-700"
              onClick={() => {
                const page = parseInt(jumpToPage, 10);
                if (page >= 1 && page <= totalPages) {
                  setCurrentPage(page);
                  setJumpToPage("");
                }
              }}
              disabled={!jumpToPage || parseInt(jumpToPage, 10) < 1 || parseInt(jumpToPage, 10) > totalPages}
            >
              Go
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-700"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-700"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Last page"
            >
              »
            </Button>
          </div>
        </div>
      )}

      <ProductViewModal
        open={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProductId(null);
        }}
        productId={selectedProductId}
        onDeleteSuccess={fetchList}
        includeDeleted
      />
    </div>
  );
}
