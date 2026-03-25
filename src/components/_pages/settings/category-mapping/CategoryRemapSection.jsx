"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Loader2, RefreshCw, StopCircle } from "lucide-react";
import Link from "next/link";

/** Flat rows with breadcrumb path for search and display. */
function flattenOurCategories(nodes, depth = 0, ancestors = []) {
  const out = [];
  for (const n of nodes || []) {
    const id = n.id || n._id;
    if (!id) continue;
    const name = n.name || "Unnamed";
    const chain = [...ancestors, name];
    const displayPath = chain.join(" › ");
    const parentPathStr =
      ancestors.length > 0 ? ancestors.join(" › ") : "";
    out.push({ id, name, depth, displayPath, parentPathStr });
    if (n.children?.length) {
      out.push(...flattenOurCategories(n.children, depth + 1, chain));
    }
  }
  return out;
}

export default function CategoryRemapSection({ ourCategories = [] }) {
  const { request } = useAxios();
  const [rootId, setRootId] = useState("");
  const [job, setJob] = useState(null);
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingStop, setLoadingStop] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState("");
  const pollRef = useRef(null);

  const options = useMemo(
    () => flattenOurCategories(ourCategories),
    [ourCategories]
  );

  const filteredOptions = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.displayPath.toLowerCase().includes(q) ||
        o.name.toLowerCase().includes(q)
    );
  }, [options, categoryQuery]);

  const selectedOption = useMemo(
    () => options.find((o) => o.id === rootId),
    [options, rootId]
  );

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const refreshStatus = useCallback(
    async (jobId) => {
      if (!jobId) return;
      const { data, error } = await request({
        method: "GET",
        url: "/admin/category-remap/status",
        authRequired: true,
        params: { jobId },
      });
      if (error || !data?.success) return;
      const j = data?.data?.job;
      if (j) setJob(j);
    },
    [request]
  );

  const fetchActive = useCallback(async () => {
    const { data, error } = await request({
      method: "GET",
      url: "/admin/category-remap/active",
      authRequired: true,
    });
    if (error || !data?.success) return;
    const active = data?.data?.job;
    if (active?.id) {
      setJob(active);
      await refreshStatus(active.id);
    }
  }, [request, refreshStatus]);

  useEffect(() => {
    fetchActive();
    return () => stopPolling();
  }, [fetchActive, stopPolling]);

  useEffect(() => {
    stopPolling();
    const busy =
      job &&
      ["queued", "running", "stopping"].includes(job.status) &&
      job.id;
    if (!busy) return;
    pollRef.current = setInterval(() => refreshStatus(job.id), 2500);
    return () => stopPolling();
  }, [job?.id, job?.status, refreshStatus, stopPolling]);

  const handleStart = async () => {
    if (!rootId) {
      showToast("error", "Select an our category root first.");
      return;
    }
    setLoadingStart(true);
    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/category-remap/start",
        authRequired: true,
        payload: { rootOurCategoryId: rootId },
      });
      if (error || !data?.success) {
        showToast(
          "error",
          data?.message || error || "Could not start category remap"
        );
        return;
      }
      const j = data?.data?.job;
      if (j) setJob(j);
      showToast("success", data?.message || "Remap started");
      if (j?.id) await refreshStatus(j.id);
    } catch (e) {
      showToast("error", e.message || "Could not start category remap");
    } finally {
      setLoadingStart(false);
    }
  };

  const handleStop = async () => {
    if (!job?.id) return;
    setLoadingStop(true);
    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/category-remap/stop",
        authRequired: true,
        payload: { jobId: job.id },
      });
      if (error || !data?.success) {
        showToast("error", data?.message || error || "Could not stop job");
        return;
      }
      showToast("success", data?.message || "Stopping remap");
      await refreshStatus(job.id);
    } catch (e) {
      showToast("error", e.message || "Could not stop job");
    } finally {
      setLoadingStop(false);
    }
  };

  const isRunning =
    job && ["queued", "running", "stopping"].includes(job.status);

  const progressPct =
    job?.total > 0
      ? Math.min(100, Math.round((job.processed / job.total) * 100))
      : 0;

  return (
    <div className="max-w-7xl mx-auto mb-8 rounded-xl border border-amber-200/80 bg-amber-50/40 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            AI category remap
          </h2>
          <p className="text-sm text-gray-600 mt-1 max-w-3xl">
            After you add subcategories under an existing our category, pick that
            root here. The job loads every product mapped anywhere under that root
            (including the root), removes only those our-category links, then runs
            the same AI mapping as auto-map. Mappings outside this subtree are
            left unchanged. Stop auto-map before starting a remap, and vice versa.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Monitor runs on the{" "}
            <Link
              href="/dashboard/agents"
              className="text-amber-900 underline underline-offset-2"
            >
              Agents
            </Link>{" "}
            page.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3 flex-wrap">
        <div className="flex flex-col gap-1.5 min-w-[220px] flex-1 max-w-md">
          <label
            htmlFor="remap-root-category-trigger"
            className="text-xs font-medium text-gray-600 uppercase tracking-wide"
          >
            Root our category
          </label>
          <Popover
            open={pickerOpen}
            onOpenChange={(open) => {
              setPickerOpen(open);
              if (!open) setCategoryQuery("");
            }}
          >
            <PopoverTrigger asChild>
              <Button
                id="remap-root-category-trigger"
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={pickerOpen}
                disabled={isRunning || options.length === 0}
                className={cn(
                  "h-auto min-h-10 w-full justify-between rounded-md border-amber-200/80 bg-white px-3 py-2 text-left font-normal text-gray-900 shadow-sm hover:bg-amber-50/50",
                  !rootId && "text-muted-foreground"
                )}
              >
                <span className="line-clamp-2 pr-2 text-sm">
                  {selectedOption
                    ? selectedOption.displayPath
                    : options.length === 0
                      ? "No categories loaded"
                      : "Search or choose a category…"}
                </span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] min-w-[min(100vw-2rem,24rem)] max-w-md p-0"
              align="start"
            >
              <Command shouldFilter={false} className="rounded-md border-0">
                <CommandInput
                  placeholder="Search by name or path…"
                  value={categoryQuery}
                  onValueChange={setCategoryQuery}
                />
                <CommandList className="max-h-[min(60vh,320px)]">
                  <CommandEmpty className="py-6 text-sm text-muted-foreground">
                    No category matches your search.
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredOptions.map((o) => (
                      <CommandItem
                        key={o.id}
                        value={o.id}
                        onSelect={() => {
                          setRootId(o.id);
                          setPickerOpen(false);
                          setCategoryQuery("");
                        }}
                        className="cursor-pointer aria-selected:bg-amber-100/80"
                      >
                        <div
                          className="flex w-full min-w-0 items-start gap-2"
                          style={{
                            paddingLeft: Math.min(o.depth, 8) * 10,
                          }}
                        >
                          <div className="min-w-0 flex-1 py-0.5">
                            <div className="truncate text-sm font-medium text-gray-900">
                              {o.name}
                            </div>
                            {o.parentPathStr ? (
                              <div className="truncate text-xs text-muted-foreground">
                                {o.parentPathStr}
                              </div>
                            ) : null}
                          </div>
                          <Check
                            className={cn(
                              "mt-1 h-4 w-4 shrink-0 text-amber-900",
                              rootId === o.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex gap-2">
          {!isRunning ? (
            <Button
              type="button"
              className="bg-amber-900 hover:bg-amber-950 text-white"
              onClick={handleStart}
              disabled={loadingStart || !rootId}
            >
              {loadingStart ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Start remap
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="border-gray-400"
              onClick={handleStop}
              disabled={loadingStop || !job?.id}
            >
              {loadingStop ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <StopCircle className="h-4 w-4 mr-2" />
              )}
              Stop
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="border-gray-300"
            onClick={() => (job?.id ? refreshStatus(job.id) : fetchActive())}
            title="Refresh status"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {job && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white/80 p-4 text-sm">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-700">
            <span>
              Status: <strong className="text-gray-900">{job.status}</strong>
            </span>
            {job.rootCategoryName && (
              <span>
                Root:{" "}
                <strong className="text-gray-900">{job.rootCategoryName}</strong>
              </span>
            )}
            <span>
              {job.processed ?? 0} / {job.total ?? 0} processed
            </span>
            <span className="text-emerald-700">
              Success: {job.success ?? 0}
            </span>
            <span className="text-red-700">Failed: {job.failed ?? 0}</span>
          </div>
          {job.total > 0 && (
            <Progress value={progressPct} className="mt-2 h-2" />
          )}
          {job.stopReason && (
            <p className="mt-2 text-xs text-amber-900">{job.stopReason}</p>
          )}
        </div>
      )}
    </div>
  );
}
