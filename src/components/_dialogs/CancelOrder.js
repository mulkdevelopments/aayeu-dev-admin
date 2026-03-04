import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";
import { Loader2 } from "lucide-react";

const CancelOrderDialog = ({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  onSuccess,
}) => {
  const { request, loading } = useAxios();
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) {
      setReason("");
    }
  }, [open]);

  const handleCancelOrder = async () => {
    const trimmedReason = reason.trim();
    if (!orderId) {
      showToast("error", "No order selected");
      return;
    }
    if (!trimmedReason) {
      showToast("error", "Please provide a cancellation reason");
      return;
    }

    const { data, error } = await request({
      method: "PUT",
      url: "/admin/cancel-order-by-admin",
      payload: {
        order_id: orderId,
        reason: trimmedReason,
      },
      authRequired: true,
    });

    if (error) {
      showToast("error", data?.message || "Failed to cancel order");
      return;
    }

    showToast(
      "success",
      data?.message || "Order has been cancelled successfully"
    );
    onSuccess?.();
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Order</DialogTitle>
          <DialogDescription>
            Provide a reason for cancelling{" "}
            {orderNumber ? `order ${orderNumber}` : "the selected order"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label
            htmlFor="cancel-reason"
            className="text-sm font-medium text-muted-foreground"
          >
            Reason
          </label>
          <Textarea
            id="cancel-reason"
            placeholder="Enter the cancellation reason..."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={loading}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            disabled={loading}
          >
            Close
          </Button>
          <Button onClick={handleCancelOrder} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelOrderDialog;
