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
import { Loader2, RefreshCw, Trash2, CheckCircle, XCircle } from "lucide-react";
import { showToast } from "@/components/_ui/toast-utils";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";

const STATUS_OPTIONS = ["pending", "notified", "closed"];

export default function StockNotifyPage() {
  const { request } = useAxios();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/stock-notify",
        authRequired: true,
        params: {
          status: status || undefined,
          q: search || undefined,
        },
      });
      if (error) {
        showToast("error", data?.message || error || "Failed to fetch requests");
        setItems([]);
        return;
      }
      setItems(data?.data?.items || []);
    } catch (err) {
      showToast("error", err?.message || "Failed to fetch requests");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id, nextStatus) => {
    setActionId(id);
    try {
      const { data, error } = await request({
        method: "PUT",
        url: `/admin/stock-notify/${id}`,
        payload: { status: nextStatus },
        authRequired: true,
      });
      if (error) {
        showToast("error", data?.message || error || "Failed to update status");
        return;
      }
      showToast("success", "Status updated");
      fetchRequests();
    } catch (err) {
      showToast("error", err?.message || "Failed to update status");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    setActionId(id);
    try {
      const { data, error } = await request({
        method: "DELETE",
        url: `/admin/stock-notify/${id}`,
        authRequired: true,
      });
      if (error) {
        showToast("error", data?.message || error || "Failed to delete request");
        return;
      }
      showToast("success", "Request deleted");
      fetchRequests();
    } catch (err) {
      showToast("error", err?.message || "Failed to delete request");
    } finally {
      setActionId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      <CustomBreadcrumb tail="Stock Notifications" />
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Stock Notify Requests</CardTitle>
          <div className="flex flex-wrap gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email, brand, product..."
              className="h-9 px-3 border border-gray-300 rounded-md text-sm"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 px-3 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center py-12 text-gray-500">No requests found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Marketing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name || "Product"}
                            className="w-12 h-12 object-contain border border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 border border-gray-200" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.product_name || "—"}
                          </div>
                          <div className="text-xs text-gray-500">{item.brand_name || "—"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{item.requested_size || "—"}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>{item.wants_marketing ? "Yes" : "No"}</TableCell>
                    <TableCell className="capitalize">{item.status}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(item.created_at)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionId === item.id}
                        onClick={() => handleUpdateStatus(item.id, "notified")}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionId === item.id}
                        onClick={() => handleUpdateStatus(item.id, "closed")}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={actionId === item.id}
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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
