"use client";

import React, { useEffect, useState } from "react";
import useAxios from "@/hooks/useAxios";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showToast } from "@/components/_ui/toast-utils";
import {
  Loader2,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Spinner } from "@/components/_ui/spinner";
import OrdersSkeleton from "@/components/skeleton/OrderSkeleton";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import CancelOrderDialog from "@/components/_dialogs/CancelOrder";
import Link from "next/link";
import VendorOrderItems from "@/components/_sections/VendorOrderItems";
// import InvoicePdfModal from "@/components/comman/InvoicePdfModel";

const OrdersPage = () => {
  const { request, loading } = useAxios();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [status, setStatus] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [selectedImageByItem, setSelectedImageByItem] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  // Filter States
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [orderStatus, setOrderStatus] = useState("all");
  const [vendorId, setVendorId] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle filter changes
  const handleFilterChange = (type, value) => {
    switch (type) {
      case "payment":
        setPaymentStatus(value);
        break;
      case "order":
        setOrderStatus(value);
        break;
      case "vendor":
        setVendorId(value);
        break;
      case "fromDate":
        setFromDate(value);
        break;
      case "toDate":
        setToDate(value);
        break;
    }
    setOrders([]); // Clear current orders
    // fetchOrders(); // Fetch with new filters
  };
  const [vendors, setVendors] = useState([]);

  // Fetch Vendors
  const fetchVendors = async () => {
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/get-vendor-list",
        authRequired: true,
      });
      if (error) throw new Error(error?.message || error);
      const list = data?.data?.vendors || [];
      const allowed = new Set([
        "a6bdd96b-0e2c-4f3e-b644-4e088b1778e0",
        "b34fd0f6-815a-469e-b7c2-73f9e8afb3ed",
        "65053474-4e40-44ee-941c-ef5253ea9fc9",
      ]);
      const onlyTwo = list.filter((v) => allowed.has(v.id));
      setVendors(onlyTwo);
    } catch (err) {
      console.error(err);
      showToast("error", err.message || "Failed to fetch vendors");
    }
  };
  const router = useRouter();
  const searchParams = useSearchParams();

  // 🧾 Fetch All Orders
  const fetchOrders = async (pageNumber = 1) => {
    try {
      // Construct query parameters
      const queryParams = new URLSearchParams();
      if (paymentStatus && paymentStatus !== "all")
        queryParams.append("payment_status", paymentStatus);
      if (orderStatus && orderStatus !== "all")
        queryParams.append("order_status", orderStatus);
      if (vendorId && vendorId !== "all")
        queryParams.append("vendor_id", vendorId);
      if (fromDate) queryParams.append("from_date", fromDate);
      if (toDate) queryParams.append("to_date", toDate);
      if (debouncedSearchQuery) queryParams.append("q", debouncedSearchQuery);

      queryParams.append("page", pageNumber);
      queryParams.append("limit", 10);

      const { data, error } = await request({
        method: "GET",
        url: `/admin/orders?${queryParams.toString()}`,
        authRequired: true,
      });
      // if (error) throw new Error(error?.message || error);
      if (error) showToast("error", data?.message);
      // if (data?.success) showToast("success", data?.message);
      setOrders(data?.data?.orders || []);
      setPage(data?.data?.page || 1);
      setTotalPages(data?.data?.total_pages || 1);
    } catch (err) {
      console.error(err);
      showToast("error", err.message || "Failed to fetch orders");
    }
  };

  // 📦 Fetch Order Details
  const fetchOrderDetails = async (orderId) => {
    const { data, error } = await request({
      method: "GET",
      url: `/admin/order-details-by-id?orderId=${orderId}`,
      authRequired: true,
    });
    if (error) showToast("error", data?.message);
    // if (data?.success) showToast("success", data?.message);
    setOrderDetails(data?.data);
  };

  // 🔄 Update Order Status
  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    if (orderDetails?.order_status === "cancelled") {
      showToast("error", "Cancelled orders cannot be updated");
      return;
    }

    const { data, error } = await request({
      method: "PUT",
      url: "/admin/update-order-status",
      payload: {
        orderId: selectedOrder,
        order_status: status,
        note: `Order ${status}`,
      },
      authRequired: true,
    });
    if (data.success) showToast("success", data.message);
    if (error) showToast("error", data?.message);

    //  if(data.success) showToast("success", data.message);
    // if (error) return showToast("error", error);
    setOrderDetails(null);
    setSelectedOrder(null);
    fetchOrders();
  };

  const handleCancelSuccess = () => {
    fetchOrders();
    if (selectedOrder) {
      fetchOrderDetails(selectedOrder);
    }
  };

  // 🔄 Retry Vendor Order
  const handleRetryVendorOrder = async (orderId, vendorId) => {
    const { data, error } = await request({
      method: "POST",
      url: `/admin/vendor-orders/${orderId}/retry`,
      payload: vendorId ? { vendorId } : {},
      authRequired: true,
    });

    if (error) {
      showToast("error", `Retry failed: ${error.message || "Unknown error"}`);
    } else {
      showToast("success", "Vendor order retry initiated");
      if (selectedOrder) {
        fetchOrderDetails(selectedOrder);
      }
    }
  };

  // 📦 Sync Tracking
  const handleSyncTracking = async (orderId) => {
    const { data, error } = await request({
      method: "POST",
      url: `/admin/vendor-orders/${orderId}/sync-tracking`,
      authRequired: true,
    });

    if (error) {
      showToast("error", "Tracking sync failed");
    } else {
      const count = data?.result?.trackingResults?.length || 0;
      showToast("success", `Updated tracking for ${count} shipment${count !== 1 ? 's' : ''}`);
      if (selectedOrder) {
        fetchOrderDetails(selectedOrder);
      }
    }
  };

  useEffect(() => {
    setStatus("");
  }, [selectedOrder]);

  function refreshhandler() {
    // 🧹 Reset all filters
    setPaymentStatus("all");
    setOrderStatus("all");
    setVendorId("all");
    setFromDate("");
    setToDate("");
    setSearchQuery("");
    setDebouncedSearchQuery("");

    // 🧾 Clear current orders and trigger refresh
    setOrders([]);
    setRefresh((prev) => prev + 1);
  }

  useEffect(() => {
    // fetchOrders();
    fetchVendors();
    fetchOrders(page);
  }, [refresh, page]);

  // Auto-apply filters whenever any filter value changes
  useEffect(() => {
    setPage(1);
    setOrders([]);
    fetchOrders(1); // Always fetch page 1 when filters change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    paymentStatus,
    orderStatus,
    vendorId,
    fromDate,
    toDate,
    debouncedSearchQuery,
  ]);

  // Fetch orders when page changes (pagination)
  // useEffect(() => {
  //   if (page > 0) {
  //     fetchOrders(page);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [page]);

  // Debounce search query
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 400);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // If URL contains orderId query param, open that order details
  // If orderId is removed from URL, close the details view
  useEffect(() => {
    try {
      const orderId = searchParams?.get("orderId");
      if (orderId) {
        setSelectedOrder(orderId);
        fetchOrderDetails(orderId);
      } else {
        // No orderId in URL means we should close the details
        setSelectedOrder(null);
        setOrderDetails(null);
      }
    } catch (err) {
      // ignore
    }
  }, [searchParams]);

  const isCancelledOrder = orderDetails?.order_status === "cancelled";
  const pdfUrl = `${process.env.NEXT_PUBLIC_BASE_URL}${orderDetails?.invoice_pdf_path}`;

  return (
    <>
      <div className="p-6 space-y-6">
        <CustomBreadcrumb
          tail={orderDetails ? `${orderDetails.order_no}` : undefined}
          onOrdersClick={
            orderDetails
              ? () => {
                  setOrderDetails(null);
                  setSelectedOrder(null);
                  router.push("/dashboard/orders");
                }
              : undefined
          }
        />
        <div className="flex justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">
            {!orderDetails ? "Orders" : "Order Details"}
          </h1>
          {!orderDetails && (
            <Button onClick={refreshhandler}>Refresh Orders</Button>
          )}
        </div>

        {/* 🧾 Orders Table */}
        {!orderDetails && (
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters Section */}
              {/* <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4"> */}
              {/* Search */}
              <div className="space-y-3">
                {/* 🔍 Search Bar */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex h-10 w-100 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Search Order Number..."
                />

                {/* 🧾 Filters in One Row */}
                <div className="flex flex-wrap gap-3 items-center">
                  {/* Payment Status */}
                  <Select
                    value={paymentStatus}
                    onValueChange={setPaymentStatus}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Payment Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payment Status</SelectItem>
                      <SelectItem value="pending">Abandoned</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Order Status */}
                  <Select value={orderStatus} onValueChange={setOrderStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Order Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Order Status</SelectItem>
                      {/* <SelectItem value="pending">Abandoned</SelectItem> */}
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      {/* <SelectItem value="cancelled">Cancelled</SelectItem> */}
                    </SelectContent>
                  </Select>

                  {/* Vendor Filter */}
                  <Select value={vendorId} onValueChange={setVendorId}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Vendors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vendors</SelectItem>
                      {vendors.map((vendor) => (
                        <SelectItem
                          key={vendor.id}
                          value={vendor.id.toString()}
                        >
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* From Date */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      From
                    </span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[160px] justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {fromDate
                            ? new Date(
                                fromDate + "T00:00:00"
                              ).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            fromDate
                              ? new Date(fromDate + "T00:00:00")
                              : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              const iso = new Date(
                                Date.UTC(
                                  date.getFullYear(),
                                  date.getMonth(),
                                  date.getDate()
                                )
                              )
                                .toISOString()
                                .slice(0, 10);
                              setFromDate(iso);
                            } else setFromDate("");
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* To Date */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      To
                    </span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[160px] justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {toDate
                            ? new Date(toDate + "T00:00:00").toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            toDate ? new Date(toDate + "T00:00:00") : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              const iso = new Date(
                                Date.UTC(
                                  date.getFullYear(),
                                  date.getMonth(),
                                  date.getDate()
                                )
                              )
                                .toISOString()
                                .slice(0, 10);
                              setToDate(iso);
                            } else setToDate("");
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* </div> */}

              {loading && !orders.length ? (
                <div>
                  <OrdersSkeleton />
                </div>
              ) : loading && orders.length ? (
                <div className="flex justify-center items-center">
                  <Spinner />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Amount (EUR)</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Order Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length > 0 ? (
                      orders.map((order, i) => (
                        <TableRow key={order.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{order.order_no}</TableCell>
                          <TableCell>
                            {order?.created_at
                              ? new Date(order.created_at).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                  }
                                )
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {order?.shipping_address?.city ||
                              order?.billing_address?.city ||
                              "-"}
                          </TableCell>
                          <TableCell>€{order.total_amount || 0}</TableCell>
                          <TableCell>
                            {order.currency_symbol || order.currency || "€"}
                            {order.exchange_rate && order.exchange_rate !== 1
                              ? (order.total_amount * order.exchange_rate).toFixed(2)
                              : order.total_amount || 0}
                            {order.currency && order.currency !== "EUR" && (
                              <span className="text-xs text-gray-500 ml-1">
                                ({order.currency})
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="capitalize">
                            <span
                              className={`px-3 py-1 rounded-md text-gray-100 font-bold ${
                                order?.payment_status === "pending"
                                  ? "bg-red-700"
                                  : "bg-green-700"
                              }`}
                            >
                              {order.payment_status === "pending"
                                ? "abandoned"
                                : order.payment_status === "paid"
                                ? "paid"
                                : order.payment_status || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell className="capitalize">
                            <span
                              className={`text-white font-medium px-2 mx-auto py-1 rounded-md ${
                                order?.order_status === "processing"
                                  ? "bg-blue-700"
                                  : order?.order_status === "shipped"
                                  ? "bg-purple-700"
                                  : order?.order_status === "delivered"
                                  ? "bg-green-700"
                                  : order?.order_status === "cancelled"
                                  ? "bg-red-700"
                                  : "bg-gray-700"
                              }`}
                            >
                              {order?.order_status || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // navigate with query param so URL reflects opened order
                                router.push(
                                  `/dashboard/orders?orderId=${order.id}`
                                );
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-6">
                          No orders found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}

              {/* ✅ Pagination Controls */}
              {totalPages > 0 && (
                <div className="flex justify-center items-center gap-3 mt-6">
                  {/* Prev button */}
                  <Button
                    className="cursor-pointer"
                    variant="outline"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                  >
                    Prev
                  </Button>

                  <span className="px-3 py-2">
                    Page {page} of {totalPages}
                  </span>

                  {/* Next button */}
                  <Button
                    className="cursor-pointer"
                    variant="outline"
                    onClick={() =>
                      setPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 📦 Order Details */}
        {orderDetails && (
          <Card className="p-8 space-y-8 my-6 shadow-md rounded-2xl border border-gray-200 bg-white">
            {/* <div className="flex justify-end">
              <Button
                className="w-50"
                variant="destructive"
                disabled={orderDetails.order_status === "cancelled"}
                onClick={() => setIsCancelDialogOpen(true)}
              >
                Cancel Order
              </Button>
            </div> */}

            <div className="grid gap-6">
              {/* 👤 User Details */}
              <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-6 shadow-sm space-y-4">
                <header className="flex justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👤</span>
                    <h3 className="text-lg font-semibold text-gray-800">
                      User Details
                    </h3>
                  </div>
                  {orderDetails.payment_status === "paid" && (
                    <div>
                      <Button
                        variant="default"
                        onClick={() =>
                          window.open(
                            `${process.env.NEXT_PUBLIC_BASE_URL}${orderDetails.invoice_pdf_path}`,
                            "_blank"
                          ) ||
                          window.open(orderDetails.invoice_pdf_path, "_blank")
                        }
                      >
                        View Invoice
                      </Button>
                    </div>
                  )}
                </header>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-900 text-sm">
                  <div>
                    <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                      Name
                    </dt>
                    <dd className="mt-1 text-base">
                      {orderDetails?.user?.name || "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                      Email
                    </dt>
                    <dd className="mt-1 text-base">
                      {orderDetails?.user?.email || "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                      Mobile
                    </dt>
                    <dd className="mt-1 text-base">
                      {orderDetails?.user?.mobile || "N/A"}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Summary cards */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* 🧾 Order Details */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                  <header className="flex items-center gap-2">
                    <span className="text-xl">🧾</span>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Order Details
                    </h3>
                  </header>
                  <dl className="grid grid-cols-1 gap-4 text-gray-900 text-sm">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                          Order Number
                        </dt>
                        <dd className="mt-1 text-base">
                          {orderDetails.order_no}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                          Order Date
                        </dt>
                        <dd className="mt-1 text-base">
                          {new Date(orderDetails.created_at).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </dd>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* <div>
                        <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                          Total Amount
                        </dt>
                        <dd className="mt-1 text-xl font-semibold text-gray-900">
                          €{orderDetails?.total_amount ?? 0}
                        </dd>
                        <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                          Discount
                        </dt>
                        <dd className="mt-1 text-xl font-semibold text-gray-900">
                          €{orderDetails?.discount ?? 0}
                        </dd>
                        <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                          payable Amount
                        </dt>
                        <dd className="mt-1 text-xl font-semibold text-gray-900">
                          €{orderDetails?.total_amount - orderDetails?.discount ?? 0}
                        </dd>
                        {orderDetails?.currency && orderDetails?.currency !== "EUR" && (
                          <dd className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Customer Paid in: </span>
                            {orderDetails.currency_symbol || orderDetails.currency}
                            {orderDetails.exchange_rate
                              ? (orderDetails.total_amount * orderDetails.exchange_rate - orderDetails.discount * orderDetails.exchange_rate).toFixed(2)
                              : orderDetails.total_amount}
                            <span className="ml-1 text-xs">
                              ({orderDetails.currency} @ rate {orderDetails.exchange_rate})
                            </span>
                          </dd>
                        )}
                      </div> */}
                      <div className="flex items-center gap-3">
                        <div>
                          <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                            Payment Status
                          </dt>
                          <dd className="mt-1">
                            <span
                              className={`inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-full ${
                                orderDetails.payment_status === "pending"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {orderDetails.payment_status === "pending"
                                ? "abandoned"
                                : orderDetails.payment_status || "N/A"}
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                            Order Status
                          </dt>
                          <dd className="mt-1">
                            <span
                              className={`inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-full
                                ${
                                  orderDetails.order_status === "created"
                                    ? "bg-gray-100 text-gray-700"
                                    : ""
                                }
                                ${
                                  orderDetails.order_status === "processing"
                                    ? "bg-blue-100 text-blue-700"
                                    : ""
                                }
                                ${
                                  orderDetails.order_status === "shipped"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : ""
                                }
                                ${
                                  orderDetails.order_status === "delivered"
                                    ? "bg-green-100 text-green-700"
                                    : ""
                                }
                                ${
                                  orderDetails.order_status === "cancelled"
                                    ? "bg-red-100 text-red-700"
                                    : ""
                                }
                              `}
                            >
                              {orderDetails.order_status}
                            </span>
                          </dd>
                        </div>
                      </div>
                    </div>
                  </dl>
                </section>

                {/* 💳 Payment Details */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                  <header className="flex items-center gap-2">
                    <span className="text-xl">💳</span>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Payment Details
                    </h3>
                  </header>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-900 text-sm">
                    <div>
                      <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                        Amount
                      </dt>
                      <dd className="mt-1 text-base">
                        {console.log("oderdetails:",orderDetails)}
                        {orderDetails.payment?.amount
                          ? `${orderDetails.currency} ${orderDetails.payment?.amount}`
                          : "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                        Method
                      </dt>
                      <dd className="mt-1 text-base">
                        {orderDetails.payment?.method ?? "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                        Reference No
                      </dt>
                      <dd className="mt-1 text-base">
                        {orderDetails.payment?.refrence_no ?? "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                        Transaction ID
                      </dt>
                      <dd className="mt-1 text-base text-sm">
                        {orderDetails.payment?.transaction_id ?? "N/A"}
                      </dd>
                    </div>

                    <div>
                      <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                        Status
                      </dt>
                      <dd className="mt-1 text-base">
                        {orderDetails.payment?.status ?? "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                        Created At
                      </dt>
                      <dd className="mt-1 text-base">
                        {orderDetails.payment?.created_at
                          ? new Date(
                              orderDetails.payment.created_at
                            ).toLocaleString("en-GB")
                          : "N/A"}
                      </dd>
                    </div>
                    {/* {orderDetails.payment?.provider_response && (
                      <div className="sm:col-span-2">
                        <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">Provider Response</dt>
                        <dd className="mt-1 text-xs sm:text-sm break-words bg-gray-100 px-3 py-2 rounded-lg">
                          {orderDetails.payment.provider_response}
                        </dd>
                      </div>
                    )} */}
                  </dl>
                </section>
              </div>
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Price Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-900">
                   <p>
                  <b>Total Amount:</b>{" "}
                  <span className="font-semibold text-green-700">
                    €{orderDetails.total_amount}
                  </span>
                </p>
                <p>
                  <b>Shipping Charges:</b> €{orderDetails?.shipping_charge || 0}
                </p>
                <p>
                  <b>Coupon Discount:</b> €
                  {orderDetails?.coupon_code
                    ? (orderDetails?.discount || 0)
                    : 0}
                  {orderDetails?.coupon_code && (
                    <span className="ml-2 text-xs text-green-600 font-medium">
                      ({orderDetails.coupon_code})
                    </span>
                  )}
                </p>
             <p>
                  <b>payable :</b > 
                  <span className="font-semibold text-green-700"> € {orderDetails?.total_amount - orderDetails?.discount ?? 0}
                  </span>
                </p>
                {orderDetails?.currency && orderDetails?.currency !== "EUR" && (
                  <p className="col-span-2 mt-2 p-3 bg-blue-50 rounded-md">
                    <b>Customer payed in :</b>{" "}
                    <span className="font-semibold text-blue-700">
                      {orderDetails.currency_symbol || orderDetails.currency}
                      {orderDetails.exchange_rate
                        ? (orderDetails.total_amount * orderDetails.exchange_rate - orderDetails.discount * orderDetails.exchange_rate).toFixed(2)
                        : orderDetails.total_amount}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      ({orderDetails.currency} @ rate {orderDetails.exchange_rate})
                    </span>
                  </p>
                )}
                
              </div>
            </div>

              {/* Address blocks */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* 📦 Shipping Address */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                  <header className="flex items-center gap-2">
                    <span className="text-xl">📦</span>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Shipping Address
                    </h3>
                  </header>
                  <dl className="grid grid-cols-1 gap-3 text-gray-900 text-sm">
                    <div>
                      <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                        Label
                      </dt>
                      <dd className="mt-1 text-base">
                        {orderDetails.shipping_address?.label || "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                        Mobile
                      </dt>
                      <dd className="mt-1 text-base">
                        {orderDetails.shipping_address?.mobile || "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                        Street
                      </dt>
                      <dd className="mt-1 text-base">
                        {orderDetails.shipping_address?.street || "N/A"}
                      </dd>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                          City
                        </dt>
                        <dd className="mt-1 text-base">
                          {orderDetails.shipping_address?.city || "N/A"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                          State
                        </dt>
                        <dd className="mt-1 text-base">
                          {orderDetails.shipping_address?.state || "N/A"}
                        </dd>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                          Country
                        </dt>
                        <dd className="mt-1 text-base">
                          {orderDetails.shipping_address?.country || "N/A"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                          Postal Code
                        </dt>
                        <dd className="mt-1 text-base">
                          {orderDetails.shipping_address?.postal_code || "N/A"}
                        </dd>
                      </div>
                    </div>
                    {/* <div>
                      <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">Coordinates</dt>
                      <dd className="mt-1 text-base">
                        {orderDetails.shipping_address?.lat ?? "N/A"},{" "}
                        {orderDetails.shipping_address?.lon ?? "N/A"}
                      </dd>
                    </div> */}
                  </dl>
                </section>

                {/* 🧾 Billing Address */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                  <header className="flex items-center gap-2">
                    <span className="text-xl">🏷️</span>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Billing Address
                    </h3>
                  </header>
                  <dl className="grid grid-cols-1 gap-3 text-gray-900 text-sm">
                    <div>
                      <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                        Label
                      </dt>
                      <dd className="mt-1 text-base">
                        {orderDetails.billing_address?.label || "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                        Mobile
                      </dt>
                      <dd className="mt-1 text-base">
                        {orderDetails.billing_address?.mobile || "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                        Street
                      </dt>
                      <dd className="mt-1 text-base">
                        {orderDetails.billing_address?.street || "N/A"}
                      </dd>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                          City
                        </dt>
                        <dd className="mt-1 text-base">
                          {orderDetails.billing_address?.city || "N/A"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                          State
                        </dt>
                        <dd className="mt-1 text-base">
                          {orderDetails.billing_address?.state || "N/A"}
                        </dd>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                          Country
                        </dt>
                        <dd className="mt-1 text-base">
                          {orderDetails.billing_address?.country || "N/A"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">
                          Postal Code
                        </dt>
                        <dd className="mt-1 text-base">
                          {orderDetails.billing_address?.postal_code || "N/A"}
                        </dd>
                      </div>
                    </div>
                    {/* <div>
                      <dt className="font-semibold text-gray-600 uppercase tracking-wider text-xs">Coordinates</dt>
                      <dd className="mt-1 text-base">
                        {orderDetails.billing_address?.lat ?? "N/A"},{" "}
                        {orderDetails.billing_address?.lon ?? "N/A"}
                      </dd>
                    </div> */}
                  </dl>
                </section>
              </div>
            </div>
            {/* 🏬 Vendor Info */}
            {/* <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              🏬 Vendor Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-900">
              <p>
                <b>Vendor Name:</b> {orderDetails?.vendor?.name || "N/A"}
              </p>
             </div>
          </div> */}


            {/* 🛍️ Ordered Items */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                🛍️ Ordered Items
              </h3>
              <VendorOrderItems
                items={orderDetails.items}
                orderId={orderDetails.id}
                onRetry={handleRetryVendorOrder}
                onSyncTracking={handleSyncTracking}
              />
            </div>

            {/* 🔄 Update & Back Buttons */}
            <div className="mt-8 border-t pt-5 flex flex-wrap items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <Select
                  value={status}
                  onValueChange={setStatus}
                  disabled={isCancelledOrder}
                >
                  <SelectTrigger
                    className="w-[150px]"
                    disabled={isCancelledOrder}
                  >
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* <SelectItem value="pending">Pending</SelectItem> */}
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleUpdateStatus}
                  disabled={!status || loading || isCancelledOrder}
                >
                  {loading ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    "Update"
                  )}
                </Button>
              </div>

              {isCancelledOrder && (
                <p className="text-lg font-bold text-muted-foreground">
                  This order is already cancelled. Further updates are disabled.
                </p>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  setOrderDetails(null);
                  setSelectedOrder(null);
                  router.push("/dashboard/orders");
                }}
              >
                Back
              </Button>
            </div>
          </Card>
        )}
      </div>
      <CancelOrderDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        orderId={selectedOrder}
        orderNumber={orderDetails?.order_no}
        onSuccess={handleCancelSuccess}
      />
      {/* <InvoicePdfModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pdfUrl={pdfUrl}
        title={`Invoice ${orderDetails?.order_no || "N/A"}`}
      /> */}
    </>
  );
};

export default OrdersPage;
