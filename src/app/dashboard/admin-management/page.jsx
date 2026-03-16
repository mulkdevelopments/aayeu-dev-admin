"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/contexts/AuthContext";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { showToast } from "@/components/_ui/toast-utils";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Loader2, RefreshCw, Shield, ChevronDown } from "lucide-react";
import ROUTE_PATH from "@/libs/route-path";

// Routes that can be assigned to non-superadmin admins (path → label)
const ROUTE_OPTIONS = [
  { path: ROUTE_PATH.DASHBOARD.DASHBOARD, label: "Dashboard" },
  { path: ROUTE_PATH.DASHBOARD.CUSTOMERS, label: "Customers" },
  { path: ROUTE_PATH.DASHBOARD.ORDERS, label: "Orders" },
  { path: ROUTE_PATH.DASHBOARD.STOCK_NOTIFY, label: "Stock Notifications" },
  { path: ROUTE_PATH.DASHBOARD.REQUEST_ACCESS, label: "Request Access" },
  { path: ROUTE_PATH.DASHBOARD.INVENTORIES, label: "Inventory" },
  { path: ROUTE_PATH.DASHBOARD.DELETED_SUSPICIOUS_PRODUCTS, label: "Quarantine" },
  { path: ROUTE_PATH.DASHBOARD.CATEGORY_MANAGEMENT, label: "Categories" },
  { path: ROUTE_PATH.DASHBOARD.AGENTS, label: "Agents" },
  { path: ROUTE_PATH.DASHBOARD.MARGIN_SETTINGS, label: "Margin settings" },
  { path: ROUTE_PATH.DASHBOARD.CONTENT_AND_POLICIES, label: "Content & Policies" },
  { path: "/dashboard/settings/coupon-management", label: "Coupon Management" },
  { path: ROUTE_PATH.DASHBOARD.SETTINGS_HOME_CONFIG_MANAGE_HERO_SECTION, label: "Manage Hero Section" },
  { path: ROUTE_PATH.DASHBOARD.SETTINGS_HOME_CONFIG_MANAGE_TOP_BANNER, label: "Manage Top Banner" },
  { path: ROUTE_PATH.DASHBOARD.SETTINGS_HOME_CONFIG_MANAGE_SALES, label: "Manage Sale Section" },
  { path: ROUTE_PATH.DASHBOARD.SETTINGS_HOME_CONFIG_MANAGE_BEST_SELLERS, label: "Manage Best Sellers" },
  { path: ROUTE_PATH.DASHBOARD.SETTINGS_HOME_CONFIG_MANAGE_NEW_ARRIVALS, label: "Manage New Arrivals" },
  { path: ROUTE_PATH.DASHBOARD.SETTINGS_HOME_CONFIG_MANAGE_FEATURED_BRANDS, label: "Manage Brand Groups" },
  { path: ROUTE_PATH.DASHBOARD.COUNTRIES, label: "Countries" },
  { path: "/dashboard/plugins", label: "Plugins (Vendors)" },
];

export default function AdminManagementPage() {
  const router = useRouter();
  const { authUser } = useAuthUser();
  const { request } = useAxios();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const isSuperadmin = authUser?.user?.role === "superadmin";

  useEffect(() => {
    if (!authUser?.token) return;
    if (!isSuperadmin) {
      router.replace(ROUTE_PATH.DASHBOARD.DASHBOARD);
      return;
    }
    fetchAdmins();
  }, [authUser?.token, isSuperadmin]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/admins",
        authRequired: true,
      });
      if (error || !data?.data) {
        showToast("error", data?.message || error || "Failed to fetch admins");
        setAdmins([]);
        return;
      }
      setAdmins(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error(err);
      showToast("error", err.message || "Failed to fetch admins");
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const updateAdmin = async (id, payload) => {
    setUpdatingId(id);
    try {
      const { data, error } = await request({
        method: "PATCH",
        url: `/admin/admins/${id}`,
        payload,
        authRequired: true,
      });
      if (error || data?.status !== 200) {
        showToast("error", data?.message || error || "Update failed");
        return;
      }
      showToast("success", "Updated");
      setAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, ...data.data } : a)));
    } catch (err) {
      console.error(err);
      showToast("error", err.message || "Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggle = (admin, field, value) => {
    if (admin.role === "superadmin" && field === "is_active") {
      showToast("error", "Cannot deactivate a superadmin from here.");
      return;
    }
    updateAdmin(admin.id, { [field]: value });
  };

  const handleRoleChange = (admin, role) => {
    if (admin.email === authUser?.user?.email && role !== "superadmin") {
      showToast("error", "You cannot change your own role away from superadmin.");
      return;
    }
    updateAdmin(admin.id, { role });
  };

  const handleAllowedRoutesChange = (admin, path, checked) => {
    const current = Array.isArray(admin.allowed_routes) ? admin.allowed_routes : [];
    const next = checked ? [...current, path] : current.filter((p) => p !== path);
    updateAdmin(admin.id, { allowed_routes: next });
  };

  if (!authUser?.token) return null;
  if (!isSuperadmin) return null;

  return (
    <div className="space-y-6">
      <CustomBreadcrumb tail="Admin Management" />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin & role management
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchAdmins} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Refresh</span>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Only superadmins see this page. Toggle order notifications, roles, and page access for other admins.
          </p>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : admins.length === 0 ? (
            <p className="text-sm text-gray-500 py-8">No admins found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Order notifications</TableHead>
                    <TableHead className="min-w-[200px]">Allowed pages</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.email}</TableCell>
                      <TableCell>{admin.name || "—"}</TableCell>
                      <TableCell>
                        <Select
                          value={admin.role || "admin"}
                          onValueChange={(v) => handleRoleChange(admin, v)}
                          disabled={updatingId === admin.id}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="superadmin">Superadmin</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={admin.is_active !== false}
                          onCheckedChange={(v) => handleToggle(admin, "is_active", v)}
                          disabled={updatingId === admin.id || (admin.role === "superadmin" && admin.email === authUser?.user?.email)}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={!!admin.receive_order_notifications}
                          onCheckedChange={(v) => handleToggle(admin, "receive_order_notifications", v)}
                          disabled={updatingId === admin.id}
                        />
                      </TableCell>
                      <TableCell>
                        {admin.role === "superadmin" ? (
                          <span className="text-xs text-gray-500">All pages</span>
                        ) : (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="text-xs" disabled={updatingId === admin.id}>
                                {(Array.isArray(admin.allowed_routes) ? admin.allowed_routes.length : 0)} pages
                                <ChevronDown className="ml-1 h-3 w-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 max-h-[320px] overflow-y-auto" align="start">
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-gray-700">Allowed dashboard pages</p>
                                {ROUTE_OPTIONS.map((opt) => {
                                  const allowed = Array.isArray(admin.allowed_routes) && admin.allowed_routes.includes(opt.path);
                                  return (
                                    <label key={opt.path} className="flex items-center gap-2 text-sm cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={allowed}
                                        onChange={(e) => handleAllowedRoutesChange(admin, opt.path, e.target.checked)}
                                        disabled={updatingId === admin.id}
                                        className="rounded border-gray-300"
                                      />
                                      <span>{opt.label}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
