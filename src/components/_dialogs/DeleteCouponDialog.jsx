"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import React, { useState } from "react";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";

const DeleteCouponDialog = ({ open, coupon, onClose, onDeleted }) => {
  const { request } = useAxios();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!open) return null;

  const handleCancel = () => {
    if (!isDeleting) onClose?.();
  };

  const handleDelete = async () => {
    if (!coupon?.id) return;
    try {
      setIsDeleting(true);
      const { data, error } = await request({
        method: "DELETE",
        url: `/admin/delete-coupon?coupon_id=${coupon.id}`,
        authRequired: true,
      });

      if (error || !data) {
        showToast("error", data?.message || error || "Failed to delete coupon");
      } else {
        showToast("success", data?.message || "Coupon deleted successfully");
        onDeleted?.();
        onClose?.();
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Unexpected error while deleting coupon");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={handleCancel}
    >
      <Card
        className="w-full max-w-md rounded-3xl border border-white/30 shadow-2xl shadow-red-500/10"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="space-y-3 pb-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="text-center space-y-1">
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Delete coupon?
            </CardTitle>
            <p className="text-sm text-gray-500">
              This action is permanent and cannot be undone.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
            You’re about to remove coupon{" "}
            <span className="font-semibold text-gray-900">
              {coupon?.code || "N/A"}
            </span>{" "}
            and its usage history from the system.
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isDeleting}
              className="sm:min-w-[120px]"
            >
              Keep coupon
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 sm:min-w-[120px]"
            >
              {isDeleting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </span>
              ) : (
                "Delete anyway"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeleteCouponDialog;

