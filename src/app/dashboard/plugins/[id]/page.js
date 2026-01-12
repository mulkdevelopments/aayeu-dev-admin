"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/_ui/spinner";
import { Switch } from "@/components/ui/switch";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { request } = useAxios();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const vendorId = params.id;

  useEffect(() => {
    if (vendorId) {
      fetchVendorDetails();
    }
  }, [vendorId]);

  const fetchVendorDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: `/admin/get-vendor-list`,
        authRequired: true,
        params: { limit: 100, status: "all" },
      });

      if (error) throw new Error(error?.message || error);

      const vendorList = data?.data?.vendors || [];
      const foundVendor = vendorList.find((v) => v.id === vendorId);

      if (!foundVendor) {
        showToast("error", "Vendor not found");
        router.push("/dashboard/vendors");
        return;
      }

      setVendor(foundVendor);
    } catch (err) {
      console.error("Error fetching vendor details:", err.message);
      showToast("error", err.message || "Failed to fetch vendor details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (newStatus) => {
    setUpdating(true);
    try {
      const { data, error } = await request({
        method: "PATCH",
        url: "/admin/update-vendor-status",
        authRequired: true,
        payload: {
          id: vendorId,
          status: newStatus,
        },
      });

      if (error) throw new Error(error?.message || error);

      if (data.success) {
        showToast("success", data.message || "Vendor status updated successfully");
        // Update local state
        setVendor((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("Error updating vendor status:", err.message);
      showToast("error", err.message || "Failed to update vendor status");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === "active") return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getIntegrationTypeIcon = (type) => {
    if (type === "api") return "🛜";
    if (type === "csv") return "📄";
    return "❓";
  };

  const renderCapabilityBadge = (enabled) => {
    return enabled ? (
      <Badge className="bg-green-600 hover:bg-green-700">Enabled</Badge>
    ) : (
      <Badge className="bg-gray-400 hover:bg-gray-500">NA</Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <CustomBreadcrumb />
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner className="h-12 w-12" />
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-6 space-y-6">
        <CustomBreadcrumb />
        <div className="text-center py-10">
          <p className="text-gray-500">Vendor not found</p>
          <Button onClick={() => router.push("/dashboard/vendors")} className="mt-4">
            Back to Vendors
          </Button>
        </div>
      </div>
    );
  }

  const capabilities = vendor.capabilities || {};
  const isActive = vendor.status === "active";

  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb />


      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Vendor Name</label>
                  <p className="text-lg font-semibold text-gray-900">{vendor.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Integration Type</label>
                  <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {getIntegrationTypeIcon(vendor.integration_type)}{" "}
                    {vendor.integration_type?.toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Contact Email</label>
                  <p className="text-gray-900">{vendor.contact_email || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Created At</label>
                  <p className="text-gray-900">
                    {vendor.created_at
                      ? new Date(vendor.created_at).toLocaleDateString("en-GB", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
              {vendor.slug && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Slug</label>
                  <p className="text-gray-900">{vendor.slug}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle>Capabilities</CardTitle>
              <CardDescription>
                Features and functionalities enabled for this vendor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Stock Management */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Stock Management</p>
                    <p className="text-sm text-gray-500">
                      {capabilities.stock_management || "Not configured"}
                    </p>
                  </div>
                  {renderCapabilityBadge(capabilities.stock_management)}
                </div>

                {/* Stock Check API */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Stock Check API</p>
                    <p className="text-sm text-gray-500">Real-time stock verification</p>
                  </div>
                  {renderCapabilityBadge(capabilities.has_stock_check_api)}
                </div>

                {/* Stock Check API */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Individual Syncing</p>
                    <p className="text-sm text-gray-500">individual inventory syncing</p>
                  </div>
                  {renderCapabilityBadge(capabilities.has_individual_syncing)}
                </div>

                {/* Order Placement API */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Order Placement API</p>
                    <p className="text-sm text-gray-500">
                      Type: {capabilities.order_placement_type || "N/A"}
                    </p>
                  </div>
                  {renderCapabilityBadge(capabilities.has_order_placement_api)}
                </div>

                {/* Order Tracking API */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Order Tracking API</p>
                    <p className="text-sm text-gray-500">Track shipment status</p>
                  </div>
                  {renderCapabilityBadge(capabilities.has_order_tracking_api)}
                </div>

                {/* Order Cancellation API */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Order Cancellation API</p>
                    <p className="text-sm text-gray-500">Cancel placed orders</p>
                  </div>
                  {renderCapabilityBadge(capabilities.has_order_cancellation_api)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          {vendor.metadata && Object.keys(vendor.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Metadata</CardTitle>
                <CardDescription>Custom configuration data</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(vendor.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Status Control */}
        <div className="space-y-6">
          {/* Status Control Card */}
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle>Plugin Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(vendor.status)}
                  <span className="font-medium text-gray-900">
                    {isActive ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => {
                    handleStatusToggle(checked ? "active" : "inactive");
                  }}
                  disabled={updating}
                />
              </div>

              {updating && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Spinner className="h-4 w-4" />
                  <span>Updating status...</span>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  {isActive
                    ? "This plugin is currently active and processing orders."
                    : "This plugin is currently disabled and will not process any orders."}
                </p>
              </div>

            
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Integration Type</span>
                <Badge variant="outline">{vendor.integration_type?.toUpperCase()}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className={isActive ? "bg-green-600" : "bg-red-600"}>
                  {isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Order Placement</span>
                {renderCapabilityBadge(capabilities.has_order_placement_api)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Order Tracking</span>
                {renderCapabilityBadge(capabilities.has_order_tracking_api)}
              </div>
            </CardContent>
          </Card>

       
        </div>
      </div>
    </div>
  );
}
