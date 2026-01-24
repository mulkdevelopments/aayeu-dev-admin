"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Play, StopCircle } from "lucide-react";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";

const POLL_INTERVAL = 2000;

const AutoMapDialog = ({ open, onClose }) => {
  const { request } = useAxios();
  const [job, setJob] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const pollingRef = useRef(null);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const fetchStatus = useCallback(async (jobId) => {
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/auto-map/status",
        authRequired: true,
        params: { jobId },
      });
      if (error || !data?.success) {
        setError(data?.message || error || "Failed to fetch status");
        return null;
      }
      return data?.data?.job || null;
    } catch (err) {
      setError(err.message || "Failed to fetch status");
      return null;
    }
  }, [request]);

  const fetchActiveJob = useCallback(async () => {
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/auto-map/active",
        authRequired: true,
      });
      if (error || !data?.success) return null;
      return data?.data?.job || null;
    } catch (err) {
      return null;
    }
  }, [request]);

  const startJob = useCallback(async () => {
    setIsStarting(true);
    setError(null);
    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/auto-map/start",
        authRequired: true,
        payload: {},
      });
      if (error || !data?.success) {
        const msg = data?.message || error || "Failed to start job";
        setError(msg);
        showToast("error", msg);
        return null;
      }
      showToast("success", "Auto-map job started");
      return data?.data?.job || null;
    } catch (err) {
      const msg = err.message || "Failed to start job";
      setError(msg);
      showToast("error", msg);
      return null;
    } finally {
      setIsStarting(false);
    }
  }, [request]);

  const stopJob = useCallback(async () => {
    if (!job?.id) return;
    setIsStopping(true);
    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/auto-map/stop",
        authRequired: true,
        payload: { jobId: job.id },
      });
      if (error || !data?.success) {
        showToast("error", data?.message || error || "Failed to stop job");
        return;
      }
      showToast("success", "Stopping auto-map job");
      setJob(data?.data?.job || job);
    } catch (err) {
      showToast("error", err.message || "Failed to stop job");
    } finally {
      setIsStopping(false);
    }
  }, [job, request]);

  useEffect(() => {
    if (!open) {
      setJob(null);
      setError(null);
      setShowConfirmation(false);
      stopPolling();
      return;
    }

    const init = async () => {
      const active = await fetchActiveJob();
      if (active) {
        setJob(active);
        setShowConfirmation(false);
      } else {
        setShowConfirmation(true);
      }
    };

    init();
  }, [open, fetchActiveJob]);

  useEffect(() => {
    if (!job?.id) return;
    stopPolling();
    pollingRef.current = setInterval(async () => {
      const latest = await fetchStatus(job.id);
      if (latest) {
        setJob(latest);
        if (["completed", "failed", "stopped"].includes(latest.status)) {
          stopPolling();
        }
      }
    }, POLL_INTERVAL);
    return stopPolling;
  }, [job?.id, fetchStatus]);

  const handleConfirmStart = async () => {
    setShowConfirmation(false);
    const newJob = await startJob();
    if (newJob) {
      setJob(newJob);
    }
  };

  const progressValue = job?.total
    ? Math.min(100, Math.round((job.processed / job.total) * 100))
    : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Auto Mapping</DialogTitle>
        </DialogHeader>

        {showConfirmation ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              This will auto-map all unmapped products in batches of 100 using AI
              suggestions. Start the job?
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleConfirmStart}
                disabled={isStarting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}
            <div className="flex items-center justify-between text-sm">
              <div>
                Status: <span className="font-semibold">{job?.status}</span>
              </div>
              <div>
                {job?.processed || 0}/{job?.total || 0} processed
              </div>
            </div>
            <Progress value={progressValue} />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={stopJob}
                disabled={isStopping || ["completed", "failed", "stopped"].includes(job?.status)}
              >
                {isStopping ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Stopping...
                  </>
                ) : (
                  <>
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop
                  </>
                )}
              </Button>
            </div>
            <div className="bg-black text-green-400 text-xs font-mono rounded-md p-3 max-h-64 overflow-y-auto">
              {(job?.logs || []).length === 0 && (
                <div className="text-gray-400">Waiting for logs...</div>
              )}
              {(job?.logs || []).map((log, idx) => (
                <div key={`${log.time}-${idx}`} className="mb-1">
                  <span className="text-gray-500">[{log.time}]</span>{" "}
                  <span className={log.status === "success" ? "text-green-400" : "text-red-400"}>
                    {log.status?.toUpperCase()}
                  </span>{" "}
                  <span>{log.product_name || "N/A"}</span>{" "}
                  {log.category_path && (
                    <span className="text-yellow-300">→ {log.category_path}</span>
                  )}{" "}
                  {log.message && <span className="text-gray-300">({log.message})</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AutoMapDialog;
