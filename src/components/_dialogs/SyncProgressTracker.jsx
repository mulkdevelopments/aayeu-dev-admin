"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  StopCircle
} from "lucide-react";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";

const LUXURY_VENDOR_ID = "65053474-4e40-44ee-941c-ef5253ea9fc9";
const POLL_INTERVAL = 3000; // Poll every 3 seconds

const SyncProgressTracker = ({ open, onClose, initialJobId = null, vendorName = "Luxury-Distribution" }) => {
  const { request } = useAxios();
  const [jobData, setJobData] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isCheckingActiveJob, setIsCheckingActiveJob] = useState(true);
  const hasInitialized = useRef(false);

  // Fetch job status
  const fetchJobStatus = useCallback(async (jobId) => {
    try {
      const { data, error } = await request({
        method: "GET",
        url: `/admin/vendor-sync-status/${jobId}`,
        authRequired: true,
      });

      console.log("Fetch job status response:", { data, error });

      if (error || !data?.success) {
        const errorMsg = data?.message || error || "Failed to fetch sync status";
        setError(errorMsg);
        console.error("Fetch job status error:", errorMsg);
        return null;
      }

      return data?.data;
    } catch (err) {
      console.error("Error fetching job status:", err);
      setError("Failed to fetch sync status");
      return null;
    }
  }, [request]);

  // Check for active job
  const checkActiveJob = useCallback(async () => {
    try {
      const { data, error } = await request({
        method: "GET",
        url: `/admin/vendor-sync-active/${LUXURY_VENDOR_ID}`,
        authRequired: true,
      });

      console.log("Check active job response:", { data, error });

      if (error || !data?.success) {
        console.error("Check active job error:", error || data?.message);
        return null;
      }

      return data?.data?.activeJob || null;
    } catch (err) {
      console.error("Error checking active job:", err);
      return null;
    }
  }, [request]);

  // Start new sync
  const startSync = useCallback(async () => {
    setIsStarting(true);
    setError(null);

    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/get-products-from-luxury",
        authRequired: true,
        payload: {}, // Send empty payload to satisfy backend
      });

      console.log("Start sync response:", { data, error });

      if (error || !data?.success) {
        const errorMsg = data?.message || error || "Failed to start sync";
        setError(errorMsg);
        showToast("error", errorMsg);
        return null;
      }

      showToast("success", "Sync started successfully");
      return data?.data;
    } catch (err) {
      console.error("Error starting sync:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to start sync";
      setError(errorMsg);
      showToast("error", errorMsg);
      return null;
    } finally {
      setIsStarting(false);
    }
  }, [request]);

  // Cancel sync
  const cancelSync = useCallback(async () => {
    if (!jobData?.id) return;

    setIsCancelling(true);

    try {
      const { data, error } = await request({
        method: "POST",
        url: `/admin/vendor-sync-cancel/${jobData.id}`,
        authRequired: true,
        payload: {}, // Empty payload
      });

      console.log("Cancel sync response:", { data, error });

      if (error || !data?.success) {
        const errorMsg = data?.message || error || "Failed to cancel sync";
        showToast("error", errorMsg);
        console.error("Cancel sync error:", errorMsg);
        return;
      }

      showToast("success", "Sync cancellation requested");
      // Update local job data to reflect cancelling status
      if (data?.data) {
        setJobData(prev => ({ ...prev, status: data.data.status }));
      }
    } catch (err) {
      console.error("Error cancelling sync:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to cancel sync";
      showToast("error", errorMsg);
    } finally {
      setIsCancelling(false);
    }
  }, [jobData, request]);

  // Handle user confirming to start sync
  const handleConfirmStart = async () => {
    setShowConfirmation(false);
    const newJob = await startSync();
    if (newJob) {
      setJobData(newJob);
    }
  };

  // Initialize: Check for existing job or show confirmation
  useEffect(() => {
    if (!open) {
      // Reset when dialog closes
      hasInitialized.current = false;
      setJobData(null);
      setError(null);
      setShowConfirmation(false);
      setIsCheckingActiveJob(true);
      return;
    }

    // Prevent multiple initializations
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initialize = async () => {
      setIsCheckingActiveJob(true);

      // If jobId provided, fetch that job
      if (initialJobId) {
        const job = await fetchJobStatus(initialJobId);
        if (job) {
          setJobData(job);
        }
        setIsCheckingActiveJob(false);
        return;
      }

      // Check for active job
      const activeJob = await checkActiveJob();

      if (activeJob) {
        // Active job exists, use it
        setJobData(activeJob);
        setIsCheckingActiveJob(false);
      } else {
        // No active job, show confirmation dialog instead of auto-starting
        setIsCheckingActiveJob(false);
        setShowConfirmation(true);
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialJobId]);

  // Polling: Refresh job status while running
  useEffect(() => {
    if (!open || !jobData?.id) return;

    const isActive = jobData.status === "running" || jobData.status === "cancelling";
    if (!isActive) return;

    const interval = setInterval(async () => {
      const updatedJob = await fetchJobStatus(jobData.id);
      if (updatedJob) {
        setJobData(updatedJob);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [open, jobData, fetchJobStatus]);

  // Close dialog
  const handleClose = () => {
    const isActive = jobData?.status === "running" || jobData?.status === "cancelling";
    if (isActive) {
      showToast("info", "Sync is still running in the background");
    }
    onClose?.();
  };

  if (!open) return null;

  // Status badge
  const getStatusBadge = () => {
    if (!jobData) return null;

    const statusConfig = {
      running: {
        icon: Loader2,
        text: "Running",
        className: "bg-blue-100 text-blue-800 border-blue-200",
        iconClassName: "animate-spin"
      },
      cancelling: {
        icon: StopCircle,
        text: "Cancelling",
        className: "bg-orange-100 text-orange-800 border-orange-200",
        iconClassName: ""
      },
      completed: {
        icon: CheckCircle2,
        text: "Completed",
        className: "bg-green-100 text-green-800 border-green-200",
        iconClassName: ""
      },
      failed: {
        icon: XCircle,
        text: "Failed",
        className: "bg-red-100 text-red-800 border-red-200",
        iconClassName: ""
      },
      cancelled: {
        icon: AlertCircle,
        text: "Cancelled",
        className: "bg-gray-100 text-gray-800 border-gray-200",
        iconClassName: ""
      },
    };

    const config = statusConfig[jobData.status] || statusConfig.running;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${config.className}`}>
        <Icon className={`h-4 w-4 ${config.iconClassName}`} />
        {config.text}
      </div>
    );
  };

  // Progress percentage
  const progressPercent = jobData?.progress?.percent || 0;
  const isActive = jobData?.status === "running" || jobData?.status === "cancelling";
  const isCompleted = jobData?.status === "completed";
  const isFailed = jobData?.status === "failed";
  const isCancelled = jobData?.status === "cancelled";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={handleClose}
    >
      <Card
        className="w-full max-w-2xl rounded-3xl border border-white/30 bg-white shadow-2xl shadow-gray-600/10"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-yellow-800 uppercase tracking-wide">
              <RefreshCw className="h-4 w-4" />
              {vendorName} Sync
            </div>
            {getStatusBadge()}
          </div>
          <CardTitle className="text-2xl font-semibold text-gray-900">
            {isCheckingActiveJob ? "Checking for active sync..." :
             showConfirmation ? "Start New Sync" :
             isStarting ? "Starting sync..." : "Product Sync Progress"}
          </CardTitle>
          {jobData && (
            <p className="text-sm text-gray-500">
              Job ID: <span className="font-mono text-xs">{jobData.id}</span>
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Checking Active Job State */}
          {isCheckingActiveJob && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-700" />
              <p className="text-sm text-gray-600">Checking for active sync job...</p>
            </div>
          )}

          {/* Confirmation Dialog - Show before starting new sync */}
          {showConfirmation && !isCheckingActiveJob && (
            <div className="space-y-6">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  This will start a new sync job for <strong>{vendorName}</strong>.
                  All products will be fetched from the vendor API and synced with your database.
                </p>
                <p className="text-sm text-yellow-700 mt-2">
                  Products not found in the sync will be marked as inactive.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="sm:min-w-[130px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmStart}
                  disabled={isStarting}
                  className="bg-yellow-700 text-white hover:bg-yellow-800 sm:min-w-[130px]"
                >
                  {isStarting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Starting...
                    </span>
                  ) : (
                    "Start Sync"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isStarting && !showConfirmation && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-700" />
            </div>
          )}

          {/* Progress Display */}
          {jobData && !isStarting && (
            <>
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">Overall Progress</span>
                  <span className="font-semibold text-gray-900">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-3" />
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {jobData.progress?.processed || 0} / {jobData.progress?.total || 0} products
                  </span>
                  <span>Page {jobData.progress?.currentPage || 1}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-2xl font-bold text-green-800">
                    {jobData.progress?.successful || 0}
                  </div>
                  <div className="text-sm text-green-600 font-medium">Successful</div>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-2xl font-bold text-red-800">
                    {jobData.progress?.failed || 0}
                  </div>
                  <div className="text-sm text-red-600 font-medium">Failed</div>
                </div>
              </div>

              {/* Timing Info */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Started at</span>
                  <span className="font-medium text-gray-900">
                    {new Date(jobData.timing?.startedAt).toLocaleString()}
                  </span>
                </div>
                {jobData.timing?.completedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Completed at</span>
                    <span className="font-medium text-gray-900">
                      {new Date(jobData.timing?.completedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Elapsed time</span>
                  <span className="font-medium text-gray-900">
                    {jobData.timing?.elapsedFormatted || "0s"}
                  </span>
                </div>
              </div>

              {/* Error Details (if failed) */}
              {isFailed && jobData.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-red-800">Error Message</div>
                      <div className="text-sm text-red-700 mt-1">{jobData.error.message}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Summary */}
              {isCompleted && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-800">
                    Sync completed successfully! Processed {jobData.progress?.total || 0} products
                    in {jobData.timing?.elapsedFormatted || "0s"}.
                  </div>
                </div>
              )}

              {/* Cancelled Summary */}
              {isCancelled && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-orange-800">
                    Sync was cancelled. Processed {jobData.progress?.processed || 0} out of{" "}
                    {jobData.progress?.total || 0} products before stopping.
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            {isActive && (
              <Button
                variant="destructive"
                onClick={cancelSync}
                disabled={isCancelling || jobData?.status === "cancelling"}
                className="sm:min-w-[130px]"
              >
                {isCancelling || jobData?.status === "cancelling" ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelling...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <StopCircle className="h-4 w-4" />
                    Cancel Sync
                  </span>
                )}
              </Button>
            )}
            <Button
              variant={isActive ? "outline" : "default"}
              onClick={handleClose}
              className={!isActive ? "bg-yellow-700 text-white hover:bg-yellow-800 sm:min-w-[130px]" : "sm:min-w-[130px]"}
            >
              {isActive ? "Close" : "Done"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SyncProgressTracker;
