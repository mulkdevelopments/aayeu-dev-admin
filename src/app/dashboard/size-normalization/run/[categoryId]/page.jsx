"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Play, Eye, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";
import Link from "next/link";

export default function RunNormalizationPage() {
  const { categoryId } = useParams();
  const router = useRouter();
  const { request } = useAxios();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [catInfo, setCatInfo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [statusRes, fullRes] = await Promise.all([
        request({ method: "GET", url: `/admin/size-normalization/status/${categoryId}`, authRequired: true }),
        request({ method: "GET", url: "/admin/size-normalization/status", authRequired: true }),
      ]);

      if (statusRes.data) setStatus(statusRes.data.data);

      const tree = fullRes.data?.data?.tree || [];
      const node = tree.find((n) => n.id === categoryId);
      setCatInfo(node || null);
      setLoading(false);
    };
    load();
  }, [categoryId]);

  const handlePreview = async () => {
    if (!catInfo?.table_id) return showToast("error", "No conversion table assigned to this category. Go to Assignments first.");
    setPreviewing(true);
    setPreview(null);
    const { data: res, error } = await request({
      method: "POST",
      url: "/admin/size-normalization/dry-run",
      authRequired: true,
      payload: { category_id: categoryId, table_id: catInfo.table_id },
    });
    if (error) showToast("error", error);
    else setPreview(res.data);
    setPreviewing(false);
  };

  const handleExecute = async () => {
    setConfirmOpen(false);
    if (!catInfo?.table_id) return showToast("error", "No conversion table assigned");
    setExecuting(true);
    const { data: res, error } = await request({
      method: "POST",
      url: "/admin/size-normalization/execute",
      authRequired: true,
      payload: { category_id: categoryId, table_id: catInfo.table_id },
    });
    if (error) showToast("error", error);
    else {
      setResult(res.data);
      showToast("success", `Normalization complete! ${res.data.stats?.totalNewlyMapped || 0} variants mapped.`);
      const { data: refreshed } = await request({ method: "GET", url: `/admin/size-normalization/status/${categoryId}`, authRequired: true });
      if (refreshed?.data) setStatus(refreshed.data);
    }
    setExecuting(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="animate-spin h-6 w-6" /></div>;
  }

  const pct = status ? (status.total > 0 ? Math.round((status.mapped / status.total) * 10) / 10 : 0) : 0;

  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb />

      <div className="flex items-center gap-3">
        <Link href="/dashboard/size-normalization">
          <Button variant="outline" size="sm"><ArrowLeft size={14} className="mr-1" /> Dashboard</Button>
        </Link>
        <h1 className="text-xl font-semibold">Run Normalization: {catInfo?.name || categoryId}</h1>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Total Variants</p>
            <p className="text-2xl font-bold">{(status?.total || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Mapped</p>
            <p className="text-2xl font-bold text-green-700">{(status?.mapped || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Unmapped</p>
            <p className="text-2xl font-bold text-red-600">{(status?.unmapped || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Coverage</p>
            <p className="text-2xl font-bold">{pct}%</p>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${pct >= 90 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Assigned Table</p>
              <p className="font-medium">{catInfo?.table_name || <span className="text-red-500">Not assigned</span>}</p>
              {catInfo?.filter_type && (
                <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-gray-100 uppercase">{catInfo.filter_type}</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePreview} disabled={previewing || !catInfo?.table_id}>
                {previewing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Eye size={14} className="mr-2" />}
                Preview (Dry Run)
              </Button>
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={executing || !catInfo?.table_id}
                className="bg-black text-white hover:bg-gray-900"
              >
                {executing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Play size={14} className="mr-2" />}
                Execute Normalization
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Results */}
      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye size={18} /> Dry Run Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">Round 1 (Pattern Match)</p>
                <p className="text-xl font-bold text-blue-800">{preview.preview?.byPatternMatch?.total || 0}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600">Round 2 (Country Match)</p>
                <p className="text-xl font-bold text-purple-800">{preview.preview?.byCountryMatch?.total || 0}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">Estimated New Mappings</p>
                <p className="text-xl font-bold text-green-800">{preview.preview?.estimatedNewMapped || 0}</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Current: {preview.current?.mapped}/{preview.current?.total} mapped ({preview.current?.coverage}%).
              After execution, up to {(preview.current?.mapped || 0) + (preview.preview?.estimatedNewMapped || 0)} could be mapped.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Execution Result */}
      {result && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 size={18} /> Normalization Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-500">Round 1</p>
                <p className="text-lg font-bold">{result.stats?.round1 || 0}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-500">Round 2</p>
                <p className="text-lg font-bold">{result.stats?.round2 || 0}</p>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <p className="text-xs text-green-600">Total Newly Mapped</p>
                <p className="text-lg font-bold text-green-700">{result.stats?.totalNewlyMapped || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-xs text-blue-600">Post Coverage</p>
                <p className="text-lg font-bold text-blue-700">{result.stats?.post?.coverage || 0}%</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Backup: <code className="bg-gray-100 px-1 rounded">{result.backupName}</code> •{" "}
              Run ID: <code className="bg-gray-100 px-1 rounded">{result.runId}</code> •{" "}
              <Link href="/dashboard/size-normalization/history" className="text-blue-600 underline">View History</Link>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-yellow-500" /> Confirm Normalization
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            This will update <strong>normalized_size_final</strong> for variants under <strong>{catInfo?.name}</strong> using the
            assigned conversion table. A backup table will be created automatically for rollback.
          </p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleExecute} className="bg-black text-white">Execute</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
