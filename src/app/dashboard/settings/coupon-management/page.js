"use client";

import React, { useEffect, useState } from "react";
import {
  Loader2,
  PlusCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Badge,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import useAxios from "@/hooks/useAxios";
import AddCoupon from "@/components/_dialogs/AddCoupon";
import { showToast } from "@/components/_ui/toast-utils";
import DeleteCouponDialog from "@/components/_dialogs/DeleteCouponDialog";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    coupon: null,
  });

  // ✅ Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    hasNext: false,
    hasPrev: false,
    total: 0,
  });

  const { request: ourCouponsRequest, request } = useAxios();

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "PAUSED":
        return "bg-yellow-100 text-yellow-700";
      case "EXPIRED":
        return "bg-gray-100 text-gray-700";
      case "ARCHIVED":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ✅ Fetch Coupons from API (with pagination, search, filter)
  const fetchCoupons = async (page = 1) => {
    setLoading(true);
    try {
      const query = search.trim();
      let url = `/admin/get-all-coupons?page=${page}&limit=10`;
      if (query) url += `&q=${encodeURIComponent(query)}`;
      if (statusFilter !== "ALL") url += `&status=${statusFilter}`;

      const res = await ourCouponsRequest({
        method: "GET",
        url,
        authRequired: true,
      });

      const data = res.data?.data;
      setCoupons(data?.items || []);
      setPagination(data?.pagination || {});
    } catch (err) {
      console.error("Error fetching coupons:", err);
      showToast("error", "Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  // Handle status change with optimistic update
  const handleStatusChange = async (couponId, newStatus) => {
    // Optimistically update the UI
    const originalCoupons = [...coupons];
    const updatedCoupons = coupons.map((c) =>
      c.id === couponId ? { ...c, status: newStatus } : c
    );
    setCoupons(updatedCoupons);
    setUpdatingId(couponId); // Show loading

    // API call using your useAxios hook
    const { data, error } = await request({
      method: "PATCH",
      url: "/admin/update-coupon-status",
      payload: { id: couponId, status: newStatus },
      authRequired: true, // Token will be added automatically
    });

    // Handle success or error
    if (error) {
      setCoupons(originalCoupons); // Rollback if failed
      showToast("error", error || "Failed to update status");
    } else {
      showToast("success", `Status changed to ${newStatus}`);
    }

    setUpdatingId(null); // Reset loading state
  };

  // ✅ Fetch when status or search changes
  useEffect(() => {
    fetchCoupons(1);
  }, [statusFilter]);

  // ✅ Debounce search (fetch after user stops typing for 500ms)
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchCoupons(1);
    }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  const handleNext = () => {
    if (pagination.hasNext) fetchCoupons(pagination.page + 1);
  };

  const handlePrev = () => {
    if (pagination.hasPrev) fetchCoupons(pagination.page - 1);
  };

  const confirmDeleteCoupon = (coupon) => {
    setDeleteDialog({ open: true, coupon });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-6 w-6 text-gray-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <CustomBreadcrumb />

      <Card className="border rounded-2xl shadow-md">
        {/* Header */}
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <CardTitle className="text-2xl font-semibold text-gray-800">
            Coupons
          </CardTitle>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* 🔍 Live Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search coupon code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val)}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAUSED">PAUSED</SelectItem>
                <SelectItem value="EXPIRED">EXPIRED</SelectItem>
                <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
              </SelectContent>
            </Select>

            {/* Add Coupon */}
            <Button onClick={() => setShowAddCoupon(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Coupon
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchCoupons(pagination.page)}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        {/* Table */}
        <CardContent>
          {coupons.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No coupons found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Max Discount</TableHead>
                    <TableHead>Usage Limit</TableHead>
                    <TableHead>Usage Count</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-semibold">
                        {coupon.code}
                      </TableCell>
                      <TableCell>{coupon.type}</TableCell>
                      <TableCell>
                        {coupon.type === "PERCENT"
                          ? `${coupon.value}%`
                          : `AED ${coupon.value}`}
                      </TableCell>
                      <TableCell>
                        {coupon.max_discount
                          ? `AED ${coupon.max_discount}`
                          : "-"}
                      </TableCell>

                      <TableCell>{coupon.usage_limit_total}</TableCell>
                      <TableCell>{coupon.usage_count}</TableCell>

                      {/* Status + Dropdown */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* <Badge className={getStatusBadgeVariant(coupon.status)}> */}
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusBadgeVariant(
                              coupon.status
                            )}`}
                          >
                            {coupon.status}
                          </span>
                          {/* </Badge> */}

                          {/* shadcn Dropdown Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {["ACTIVE", "PAUSED", "EXPIRED", "ARCHIVED"].map(
                                (status) => (
                                  <DropdownMenuItem
                                    key={status}
                                    onClick={() =>
                                      handleStatusChange(coupon.id, status)
                                    }
                                    className={
                                      coupon.status === status
                                        ? "font-bold bg-accent"
                                        : ""
                                    }
                                  >
                                    {status}
                                  </DropdownMenuItem>
                                )
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>

                      <TableCell>
                        {new Date(coupon.start_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(coupon.end_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          className="rounded-md"
                          size="sm"
                          onClick={() => confirmDeleteCoupon(coupon)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* ✅ Pagination Section */}
          {pagination.pages > 0 && (
            <div className="flex justify-center items-center mt-6 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={!pagination.hasPrev}
                className="flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>

              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages} • Total:{" "}
                {pagination.total}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={!pagination.hasNext}
                className="flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Coupon Modal */}
      <AddCoupon
        onSuccess={() => fetchCoupons(pagination.page)}
        open={showAddCoupon}
        onClose={() => setShowAddCoupon(false)}
      />
      <DeleteCouponDialog
        open={deleteDialog.open}
        coupon={deleteDialog.coupon}
        onClose={() =>
          setDeleteDialog({
            open: false,
            coupon: null,
          })
        }
        onDeleted={() => fetchCoupons(pagination.page)}
      />
    </div>
  );
}
