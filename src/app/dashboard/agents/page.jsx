"use client";

import React, { useEffect, useState, useCallback } from "react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Button } from "@/components/ui/button";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";
import { Loader2, Play, StopCircle, Bot, RefreshCw, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import ROUTE_PATH from "@/libs/route-path";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgentsPage() {
  const { request } = useAxios();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState(null);
  const [stoppingId, setStoppingId] = useState(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/agents",
        authRequired: true,
      });
      if (error || !data?.success) {
        showToast("error", data?.message || error || "Failed to load agents");
        return;
      }
      setAgents(data?.data?.agents || []);
    } catch (err) {
      showToast("error", err.message || "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    fetchAgents();
    // Run only once on mount; Refresh button and Start/Stop call fetchAgents() when needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parseStartPath = (endpointStr) => {
    if (!endpointStr || typeof endpointStr !== "string") return null;
    const parts = endpointStr.trim().split(/\s+/);
    return parts.length >= 2 ? parts[1] : null;
  };
  const parseStopPath = (endpointStr) => {
    if (!endpointStr || typeof endpointStr !== "string") return null;
    const parts = endpointStr.trim().split(/\s+/);
    return parts.length >= 2 ? parts[1] : null;
  };

  const handleStart = async (agent) => {
    const path = parseStartPath(agent.endpoints?.start);
    if (!path) return;
    setStartingId(agent.id);
    try {
      const { data, error } = await request({
        method: "POST",
        url: path,
        authRequired: true,
        payload: {},
      });
      if (error || !data?.success) {
        showToast("error", data?.message || error || "Failed to start");
        return;
      }
      showToast("success", `${agent.name} started`);
      await fetchAgents();
    } catch (err) {
      showToast("error", err.message || "Failed to start");
    } finally {
      setStartingId(null);
    }
  };

  const handleStop = async (agent, jobId) => {
    if (!jobId) return;
    const path = parseStopPath(agent.endpoints?.stop);
    if (!path) return;
    setStoppingId(agent.id);
    try {
      const { data, error } = await request({
        method: "POST",
        url: path,
        authRequired: true,
        payload: { jobId },
      });
      if (error || !data?.success) {
        showToast("error", data?.message || error || "Failed to stop");
        return;
      }
      showToast("success", `${agent.name} stopping`);
      await fetchAgents();
    } catch (err) {
      showToast("error", err.message || "Failed to stop");
    } finally {
      setStoppingId(null);
    }
  };

  const formatTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString();
  };

  if (loading && agents.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <CustomBreadcrumb />
        <div className="mt-6 space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <CustomBreadcrumb />
      <div className="mb-6 mt-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agents</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor and control background agents. Start or stop jobs and view status.
        </p>
      </div>

      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="border-slate-300 text-slate-700"
          onClick={() => fetchAgents()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="space-y-6">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-slate-100 p-2">
                  <Bot className="h-6 w-6 text-slate-700" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{agent.name}</h2>
                  <p className="text-sm text-slate-500 mt-1 max-w-2xl">{agent.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        agent.status === "running"
                          ? "bg-slate-800 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {agent.status === "running" ? "Running" : "Idle"}
                    </span>
                    {agent.id === "auto_mapping" && (
                      <Link
                        href={ROUTE_PATH.DASHBOARD.INVENTORIES}
                        className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                      >
                        Open Inventory <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                    {agent.id === "description_rewrite" && (
                      <Link
                        href={ROUTE_PATH.DASHBOARD.INVENTORIES}
                        className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                      >
                        Open Inventory <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {agent.endpoints?.start && (
                  <>
                    {agent.status !== "running" ? (
                      <Button
                        size="sm"
                        className="bg-slate-900 hover:bg-slate-800 text-white"
                        onClick={() => handleStart(agent)}
                        disabled={!!startingId}
                      >
                        {startingId === agent.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-300 text-slate-700 hover:bg-slate-100"
                        onClick={() => handleStop(agent, agent.activeJob?.id)}
                        disabled={!!stoppingId || !agent.activeJob?.id}
                      >
                        {stoppingId === agent.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <StopCircle className="h-4 w-4 mr-2" />
                        )}
                        Stop
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {agent.activeJob && agent.status === "running" && (
              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Current job
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="text-slate-700">
                    {agent.activeJob.processed ?? 0} / {agent.activeJob.total ?? 0} processed
                  </span>
                  <span className="text-slate-600">
                    Success: <strong className="text-slate-800">{agent.activeJob.success ?? 0}</strong>
                  </span>
                  <span className="text-slate-600">
                    Failed: <strong className="text-slate-800">{agent.activeJob.failed ?? 0}</strong>
                  </span>
                  <span className="text-slate-500 text-xs">
                    Started {formatTime(agent.activeJob.startedAt)}
                  </span>
                </div>
                <Progress
                  value={
                    agent.activeJob.total
                      ? Math.min(100, Math.round((agent.activeJob.processed / agent.activeJob.total) * 100))
                      : 0
                  }
                  className="mt-2 h-2"
                />
              </div>
            )}

            {agent.recentJobs && agent.recentJobs.length > 0 && (
              <div className="mt-6">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Recent runs
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="text-left py-2 px-3 text-slate-600 font-semibold">Status</th>
                        <th className="text-right py-2 px-3 text-slate-600 font-semibold">Processed</th>
                        <th className="text-right py-2 px-3 text-slate-600 font-semibold">Success</th>
                        <th className="text-right py-2 px-3 text-slate-600 font-semibold">Failed</th>
                        <th className="text-left py-2 px-3 text-slate-600 font-semibold">Started</th>
                        <th className="text-left py-2 px-3 text-slate-600 font-semibold">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {agent.recentJobs.slice(0, 5).map((job) => (
                        <tr key={job.id} className="bg-white">
                          <td className="py-2 px-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                job.status === "completed"
                                  ? "bg-slate-200 text-slate-700"
                                  : job.status === "failed"
                                    ? "bg-slate-200 text-slate-600"
                                    : job.status === "stopped"
                                      ? "bg-slate-100 text-slate-600"
                                      : "bg-slate-800 text-white"
                              }`}
                            >
                              {job.status}
                            </span>
                          </td>
                          <td className="text-right py-2 px-3 text-slate-700">{job.processed ?? 0}</td>
                          <td className="text-right py-2 px-3 text-slate-700">{job.success ?? 0}</td>
                          <td className="text-right py-2 px-3 text-slate-700">{job.failed ?? 0}</td>
                          <td className="py-2 px-3 text-slate-500 text-xs">{formatTime(job.startedAt)}</td>
                          <td className="py-2 px-3 text-slate-600 text-xs max-w-[200px] truncate" title={job.stopReason || ""}>
                            {job.stopReason || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {agents.length === 0 && !loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No agents configured.
        </div>
      )}
    </div>
  );
}
