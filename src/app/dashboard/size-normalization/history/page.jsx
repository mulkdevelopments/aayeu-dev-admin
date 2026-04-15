"use client";

import React, { useEffect, useState } from "react";
import { Loader2, RotateCcw, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";

function statusBadge(status) {
  const map = {
    completed: "bg-green-100 text-green-700",
    running: "bg-blue-100 text-blue-700",
    pending: "bg-gray-100 text-gray-600",
    failed: "bg-red-100 text-red-700",
    rolled_back: "bg-yellow-100 text-yellow-700",
  };
  return map[status] || "bg-gray-100 text-gray-600";
}

export default function HistoryPage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rollbackId, setRollbackId] = useState(null);
  const [rolling, setRolling] = useState(false);
  const { request } = useAxios();

  const fetch = async () => {
    setLoading(true);
    const { data: res, error } = await request({
      method: "GET", url: "/admin/size-normalization/history", authRequired: true,
    });
    if (!error) setRuns(res.data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleRollback = async () => {
    setRolling(true);
    const { error } = await request({
      method: "POST",
      url: `/admin/size-normalization/rollback/${rollbackId}`,
      authRequired: true,
    });
    if (error) showToast("error", error);
    else { showToast("success", "Rollback completed"); fetch(); }
    setRolling(false);
    setRollbackId(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="animate-spin h-6 w-6" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Normalization History</CardTitle>
          <Button variant="outline" size="sm" onClick={fetch}><RefreshCw size={14} className="mr-1" /> Refresh</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">R1</TableHead>
                <TableHead className="text-right">R2</TableHead>
                <TableHead className="text-right">Total Mapped</TableHead>
                <TableHead className="text-right">Coverage After</TableHead>
                <TableHead>Backup</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => {
                const s = run.stats || {};
                return (
                  <TableRow key={run.id}>
                    <TableCell className="text-sm">
                      {new Date(run.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{run.category_name || "—"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 text-xs rounded font-medium ${statusBadge(run.status)}`}>
                        {run.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{s.round1 ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.round2 ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{s.totalNewlyMapped ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.post?.coverage != null ? `${s.post.coverage}%` : "—"}</TableCell>
                    <TableCell className="text-xs text-gray-500 font-mono">{run.backup_table_name || "—"}</TableCell>
                    <TableCell className="text-right">
                      {run.status === "completed" && (
                        <Button variant="outline" size="sm" onClick={() => setRollbackId(run.id)}>
                          <RotateCcw size={14} className="mr-1" /> Rollback
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {runs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">No normalization runs yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Rollback Confirm */}
      <Dialog open={!!rollbackId} onOpenChange={() => setRollbackId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Rollback</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">
            This will restore all variant sizes from the backup table to their state before this normalization run.
            This action cannot be undone.
          </p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleRollback} disabled={rolling}>
              {rolling && <Loader2 className="animate-spin mr-2 h-4 w-4" />} Rollback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
