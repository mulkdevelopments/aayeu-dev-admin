"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/_ui/spinner";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";
export default function ViewVendorModal({ isOpen, setIsOpen, vendorId }) {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(false);
  const { request } = useAxios();

  useEffect(() => {
    if (!vendorId || !isOpen) return;

    const fetchVendor = async () => {
      setLoading(true);
      try {
        const { data, error } = await request({
          method: "GET",
          url: `/admin/get-vendor-by-id?vendorId=${vendorId}`,
          authRequired: true,
        });
        if (error) throw new Error(error?.message || error);
          if(data.success) showToast("success", data.message );
        setVendor(data?.data);
      } catch (err) {
        console.error(" Error fetching vendor:", err.message);
        showToast("error", err.message || "Failed to fetch vendor details");
      } finally {
        setLoading(false);
      }
    };

    fetchVendor();
  }, [vendorId, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl rounded-2xl p-6 max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            Vendor Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-40 text-gray-600">
            <Spinner className="w-6 h-6 mr-2" /> Loading vendor details...
          </div>
        ) : vendor ? (
          <div className="space-y-6">
            {/* 🧾 Vendor Info Card */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-800">
                  <p>
                    <span className="font-bold">Vendor Name:</span> {vendor.name || "N/A"}
                  </p>
                  <p>
                    <span className="font-bold">Email:</span> {vendor.contact_email || "N/A"}
                  </p>
                  <p>
                    <span className="font-bold">Slug:</span> {vendor.slug || "—"}
                  </p>
                  <p>
                    <span className="font-bold">Status:</span>{" "}
                    <Badge
                      className={
                        vendor.status === "active"
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-red-600 hover:bg-red-700"
                      }
                    >
                      {vendor.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </p>
                  <p>
                    <span className="font-medium">Created At:</span>{" "}
                    {new Date(vendor.created_at).toLocaleDateString("en-GB")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* 🏠 Address Info Card */}
            {vendor.addresses && vendor.addresses.length > 0 && (
              <Card className="shadow-sm border border-gray-200">
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Address Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">Label:</span>{" "}
                      {vendor.addresses[0].label || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Street:</span>{" "}
                      {vendor.addresses[0].street || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">City:</span>{" "}
                      {vendor.addresses[0].city || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">State:</span>{" "}
                      {vendor.addresses[0].state || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Country:</span>{" "}
                      {vendor.addresses[0].country || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Postal Code:</span>{" "}
                      {vendor.addresses[0].postal_code || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Mobile:</span>{" "}
                      {vendor.addresses[0].mobile || "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-500">No vendor data found.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
