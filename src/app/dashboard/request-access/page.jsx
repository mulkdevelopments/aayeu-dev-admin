"use client";

import React, { useEffect, useState } from "react";
import useAxios from "@/hooks/useAxios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { showToast } from "@/components/_ui/toast-utils";
import { Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";

function isApprovedStatus(status) {
  return status === "approved" || status === "link_sent";
}

export default function RequestAccessPage() {
  const { request } = useAxios();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/get-access-requests",
        authRequired: true,
      });
      if (error) {
        showToast("error", data?.message || error || "Failed to fetch requests");
        setRequests([]);
        return;
      }
      setRequests(data?.data || []);
    } catch (err) {
      console.error(err);
      showToast("error", err.message || "Failed to fetch requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    setActingId(id);
    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/approve-access-request",
        payload: { id },
        authRequired: true,
      });
      if (error) {
        showToast("error", data?.message || error || "Failed to approve request");
        return;
      }
      showToast(
        "success",
        data?.message || "Approved — the user was emailed and can sign in with email + code."
      );
      fetchRequests();
    } catch (err) {
      console.error(err);
      showToast("error", err.message || "Failed to approve request");
    } finally {
      setActingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString() +
      " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <div className="space-y-6">
      <CustomBreadcrumb tail="Request Access" />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Access Requests</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRequests}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-center py-12 text-gray-500">No access requests yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => {
                  const approved = isApprovedStatus(r.status);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.full_name || "—"}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            approved
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {approved ? "Approved" : "Pending"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(r.created_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {r.magic_link_sent_at ? formatDate(r.magic_link_sent_at) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={approved ? "outline" : "default"}
                          disabled={actingId === r.id}
                          onClick={() => handleApprove(r.id)}
                        >
                          {actingId === r.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          <span className="ml-1">
                            {approved ? "Resend approval email" : "Approve"}
                          </span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
