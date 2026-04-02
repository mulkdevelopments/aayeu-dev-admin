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
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";

export default function NewsletterSubscribersPage() {
  const { request } = useAxios();
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/get-newsletter-subscribers",
        authRequired: true,
      });
      if (error) {
        showToast("error", data?.message || error || "Failed to load subscribers");
        setSubscribers([]);
        return;
      }
      setSubscribers(data?.data || []);
    } catch (err) {
      console.error(err);
      showToast("error", err.message || "Failed to load subscribers");
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this subscriber from the list?")) return;
    setDeletingId(id);
    try {
      const { data, error } = await request({
        method: "DELETE",
        url: `/admin/delete-newsletter-subscriber?id=${encodeURIComponent(id)}`,
        authRequired: true,
      });
      if (error) {
        showToast("error", data?.message || error || "Failed to delete");
        return;
      }
      showToast("success", data?.message || "Subscriber removed");
      fetchSubscribers();
    } catch (err) {
      console.error(err);
      showToast("error", err.message || "Failed to delete");
    } finally {
      setDeletingId(null);
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
      <CustomBreadcrumb tail="Newsletter subscribers" />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Newsletter subscribers</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchSubscribers} disabled={loading}>
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
          ) : subscribers.length === 0 ? (
            <p className="text-center py-12 text-gray-500">No subscribers yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscribed</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.email}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          row.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {row.is_active ? "Active" : "Unsubscribed"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(row.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(row.updated_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={deletingId === row.id}
                        onClick={() => handleDelete(row.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        {deletingId === row.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span className="ml-1">Remove</span>
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
