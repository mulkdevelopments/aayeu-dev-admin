"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";

const POLL_INTERVAL = 10000;

export default function BackfillSizeDialog({ open, onClose }) {
  const { request } = useAxios();
  const [status, setStatus] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const pollRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    const { data, error } = await request({
      method: "GET",
      url: "/admin/backfill-size/status",
      authRequired: true,
    });
    if (error) return null;
    return data?.data ?? null;
  }, [request]);

  useEffect(() => {
    if (!open) return;
    fetchStatus().then(setStatus);
  }, [open, fetchStatus]);

  useEffect(() => {
    if (!open || !status?.running) return;
    pollRef.current = setInterval(() => {
      fetchStatus().then((s) => s && setStatus(s));
    }, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open, status?.running, fetchStatus]);

  const handleStart = async () => {
    setIsStarting(true);
    const { data, error } = await request({
      method: "POST",
      url: "/admin/backfill-size",
      payload: {},
      authRequired: true,
    });
    setIsStarting(false);
    if (error) {
      showToast("error", error || "Failed to start backfill");
      return;
    }
    const started = data?.data?.started;
    if (started) {
      showToast("success", "Backfill started.");
      fetchStatus().then(setStatus);
    } else {
      showToast("info", data?.data?.message || "Backfill already running.");
      fetchStatus().then(setStatus);
    }
  };

  const running = status?.running === true;
  const completed = status?.completedAt && !running;
  const failed = !!status?.error;
  const progressPercent =
    status?.total > 0 ? Math.min(100, (status?.processed / status?.total) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent showCloseButton={!running} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Backfill size</DialogTitle>
          <DialogDescription>
            Recompute normalized_size and size_country for all product variants from
            variant_size. This may take several minutes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {running && (
            <>
              <p className="text-sm text-muted-foreground">
                Running… {status?.processed ?? 0} / {status?.total ?? 0} processed (
                {status?.updated ?? 0} updated)
              </p>
              <Progress value={progressPercent} className="h-2" />
            </>
          )}

          {completed && !failed && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p className="text-sm">
                Success. Processed {status?.processed ?? 0}, updated {status?.updated ?? 0}.
              </p>
            </div>
          )}

          {completed && failed && (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">Failed: {status?.error ?? "Unknown error"}</p>
            </div>
          )}

          {!status && !isStarting && (
            <p className="text-sm text-muted-foreground">Click Start to run the backfill.</p>
          )}
        </div>

        <DialogFooter>
          {!running && (
            <Button
              onClick={handleStart}
              disabled={isStarting}
            >
              {isStarting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting…
                </>
              ) : (
                "Start backfill"
              )}
            </Button>
          )}
          {!running && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
