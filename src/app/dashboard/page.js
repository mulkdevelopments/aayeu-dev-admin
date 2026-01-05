"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, ShoppingBag, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardSkeleton from "@/components/skeleton/DashboardSkeleton";
import useAxios from "@/hooks/useAxios";
import ROUTE_PATH from "@/libs/route-path";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { showToast } from "@/components/_ui/toast-utils";
import Link from "next/link";
import dayjs from "dayjs";
import { DirhamSymbol } from "dirham-symbol";

/** 🧩 Compact Reusable Stats Card Component */
const StatCard = ({ title, value, icon: Icon, bg }) => (
  <Card
    className={`${bg} transition-all duration-200 rounded-none hover:shadow-lg`}
  >
    <div className="flex items-center justify-between px-4 py-2">
      <div className="flex flex-col space-y-1">
        <span className="text-sm text-gray-600 font-medium">{title}</span>
        <span className="text-xl font-semibold">{value ?? "—"}</span>
      </div>
      {Icon && (
        <div className="flex items-center justify-center p-2">
          <Icon className="h-5 w-5 text-gray-700" />
        </div>
      )}
    </div>
  </Card>
);

/** 🧩 Order Status Badge */
const StatusBadge = ({ status = "pending" }) => {
  const statusStyles = {
    created: "bg-gray-200 text-gray-800",
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
        statusStyles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {label}
    </span>
  );
};

/** 🧾 Payment Status Badge */
const PaymentBadge = ({ status = "pending" }) => {
  const paymentStyles = {
    paid: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
  };

  const label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
        paymentStyles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {label}
    </span>
  );
};

export default function DashboardPage() {
  const { request } = useAxios();
  const router = useRouter();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  /** 🔄 Fetch dashboard data */
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/get-dashboard-data",
        authRequired: true,
      });

      if (error) throw new Error(error?.message || "Failed to load dashboard");

      setDashboard(data?.data || {});
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  /** 🧾 Extract data safely */
  const {
    totalCustomers,
    totalOrders,
    totalVendors,
    totalRevenue,
    recentOrders = [],
  } = dashboard || {};

  /** 📊 Dynamic Stat Cards */
  const statCards = useMemo(
    () => [
      {
        title: "Total Customers",
        value: totalCustomers,
        icon: Users,
        bg: "bg-yellow-50",
        path: ROUTE_PATH.DASHBOARD.CUSTOMERS,
      },
      {
        title: "Total Orders",
        value: totalOrders,
        icon: ShoppingBag,
        bg: "bg-green-50",
        path: ROUTE_PATH.DASHBOARD.ORDERS,
      },
      {
        title: "Total Vendors",
        value: 3,
        icon: Store,
        bg: "bg-blue-50",
        path: ROUTE_PATH.DASHBOARD.VENDORS,
      },
      {
        title: "Total Revenue ",
        value: totalRevenue ? `€ ${totalRevenue}` : "€ 0",
        icon: DirhamSymbol,
        bg: "bg-purple-50",
        path: "#",
      },
    ],
    [totalCustomers, totalOrders, totalVendors, totalRevenue]
  );

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 p-6">
      <CustomBreadcrumb />

      {/* --- Stats Section --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Link href={card.path} key={i}>
            <StatCard {...card} />
          </Link>
        ))}
      </div>

      {/* --- Recent Orders Section --- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-bold lg:text-3xl md:text-2xl text-xl">
            Recent Orders
          </CardTitle>
          <Button
            variant="outline"
            onClick={() => router.push(ROUTE_PATH.DASHBOARD.ORDERS)}
          >
            View All
          </Button>
        </CardHeader>

        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              No recent orders found.
            </p>
          ) : (
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead>Order No</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {recentOrders.slice(0, 3).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium hover:underline cursor-pointer">
                      <Link
                        href={`${ROUTE_PATH.DASHBOARD.ORDERS}?orderId=${order.id}`}
                      >
                        {order.order_no || "—"}
                      </Link>
                    </TableCell>
                    <TableCell>{order.shipping_address?.city || "—"}</TableCell>
                   <TableCell>
                      {order.currency_symbol || order.currency}{" "}
                      {(((order.total_amount ?? 0) - (order.discount ?? 0)) * (order.exchange_rate ?? 1)).toFixed(2)}
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={order.order_status} />
                    </TableCell>
                    <TableCell>
                      <PaymentBadge status={order.payment_status} />
                    </TableCell>
                    <TableCell>
                      {order.created_at
                        ? dayjs(order.created_at).format("DD MMM YYYY")
                        : "—"}
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
