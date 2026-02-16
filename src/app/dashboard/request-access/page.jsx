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
import { Loader2, RefreshCw, Send } from "lucide-react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";

export default function RequestAccessPage() {
  const { request } = useAxios();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);

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

  const handleSendMagicLink = async (id) => {
    setSendingId(id);
    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/send-magic-link-to-request",
        payload: { id },
        authRequired: true,
      });
      if (error) {
        showToast("error", data?.message || error || "Failed to send magic link");
        return;
      }
      showToast("success", data?.message || "Magic link sent.");
      fetchRequests();
    } catch (err) {
      console.error(err);
      showToast("error", err.message || "Failed to send magic link");
    } finally {
      setSendingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
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
                  <TableHead>Link sent</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.full_name || "—"}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          r.status === "link_sent"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {r.status === "link_sent" ? "Link sent" : "Pending"}
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
                        variant={r.status === "link_sent" ? "outline" : "default"}
                        disabled={sendingId === r.id}
                        onClick={() => handleSendMagicLink(r.id)}
                      >
                        {sendingId === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span className="ml-1">
                          {r.status === "link_sent" ? "Resend link" : "Send magic link"}
                        </span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
