"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useAxios from "@/hooks/useAxios";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/components/_ui/toast-utils";
import { User } from "lucide-react";
export default function ViewCustomerModal({ isOpen, onClose, customerId }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const { request } = useAxios();

  useEffect(() => {
    if (isOpen && customerId) {
      getCustomerDetails();
    }
  }, [isOpen, customerId]);

  const getCustomerDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: `/admin/get-customer-by-id?customerId=${customerId}`,
        authRequired: true,
      });

     if (error) throw new Error(error?.message || error);
     if(data.success) showToast("success", data.message );
      setCustomer(data?.data);
    } catch (err) {
      console.error("Error fetching customer:", err);
      showToast("error", err.message || "Failed to fetch customer details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* <DialogContent className="max-w-2xl rounded-2xl p-6 max-h-screen overflow-y-auto"> */}
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-none border border-gray-200 bg-white p-6 shadow-lg">

        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-black">
            Customer Details
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Complete information about the selected customer.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 mt-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 bg-gray-200" />
                  <Skeleton className="h-3 w-48 bg-gray-200" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Skeleton className="h-3 w-full bg-gray-200" />
                <Skeleton className="h-3 w-full bg-gray-200" />
                <Skeleton className="h-3 w-full bg-gray-200" />
                <Skeleton className="h-3 w-full bg-gray-200" />
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <Skeleton className="h-4 w-28 bg-gray-200 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full bg-gray-200" />
                <Skeleton className="h-3 w-5/6 bg-gray-200" />
                <Skeleton className="h-3 w-4/6 bg-gray-200" />
              </div>
            </div>
          </div>
        ) : customer ? (
          <div className="space-y-6 mt-4">
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-black text-white flex items-center justify-center">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-black truncate">
                        {customer.full_name || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {customer.email || "N/A"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={`${
                      customer.is_active
                        ? "bg-black text-white hover:bg-gray-900"
                        : "bg-gray-200 text-black hover:bg-gray-300"
                    }`}
                  >
                    {customer.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span>{customer.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Joined</span>
                    <span>
                      {new Date(customer.created_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 🏠 Address Section */}
            {customer.addresses?.length > 0 && (
              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold text-black mb-3">
                    Addresses
                  </h3>
                  <div className="space-y-3">
                    {customer.addresses.map((addr) => (
                      <Card
                        key={addr.id}
                        className="border border-gray-200 hover:shadow-md transition-all duration-200 bg-white"
                      >
                        <CardContent className="p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="font-medium text-black">
                              {addr.label || "Address"}
                            </p>
                            {addr.is_default && (
                              <Badge className="bg-black text-white">
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-700 leading-relaxed">
                            <p>{addr.street || "N/A"}</p>
                            <p>
                              {addr.city}, {addr.state}, {addr.country} -{" "}
                              {addr.postal_code}
                            </p>
                            <p>
                              <span className="text-gray-600">Mobile:</span>{" "}
                              {addr.mobile || "N/A"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-10">
            No customer details found.
          </p>
        )}

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-black text-black hover:bg-black hover:text-white"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
