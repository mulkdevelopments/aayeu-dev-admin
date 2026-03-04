"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useAxios from "@/hooks/useAxios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showToast } from "@/components/_ui/toast-utils";
import { useAuthUser } from "@/contexts/AuthContext";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Tag,
  Settings,
  Calendar as CalendarIcon,
  Shield,
  Sparkles,
  Percent,
  DollarSign,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

const toNumber = (options = {}) =>
  z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) {
        return options.optional ? undefined : val;
      }
      if (typeof val === "number") {
        return Number.isNaN(val) ? undefined : val;
      }
      const parsed = Number(val);
      return Number.isNaN(parsed) ? undefined : parsed;
    },
    options.optional ? z.number().optional() : z.number()
  );

const couponSchema = z.object({
  code: z.string().min(3, "Code is required"),
  type: z.enum(["PERCENT", "FLAT"]),
  value: toNumber().refine((val) => val > 0, {
    message: "Value must be greater than 0",
  }),
  max_discount: toNumber({ optional: true }),
  min_subtotal: toNumber({ optional: true }),
  first_order_only: z.boolean().default(false),
  start_date: z.date({ required_error: "Start date is required" }),
  start_time: z.string().optional(),
  end_date: z.date({ required_error: "End date is required" }),
  end_time: z.string().optional(),
  usage_limit_total: toNumber({ optional: true }),
  usage_limit_per_user: toNumber({ optional: true }),
  stack_group: z.string().optional(),
  priority: toNumber({ optional: true }),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  currency: z.string().optional(),
});

// Helper function to convert datetime-local to ISO format with Z
const formatDateToISO = (dateTimeLocal) => {
  if (!dateTimeLocal) return null;
  // datetime-local format: "2025-11-01T00:00"
  // Convert to ISO: "2025-11-01T00:00:00Z"
  const date = new Date(dateTimeLocal);
  return date.toISOString();
};

export default function AddCoupon({
  onSuccess,
  currency = "AED",
  open,
  onClose,
}) {
  const { request, loading } = useAxios();
  const { authUser } = useAuthUser();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      type: "PERCENT",
      status: "ACTIVE",
      first_order_only: false,
      currency: currency,
      channels: ["WEB"],
      start_date: undefined,
      start_time: "",
      end_date: undefined,
      end_time: "",
    },
  });

  const firstOrderOnly = watch("first_order_only");
  const type = watch("type");
  const status = watch("status");
  const startDate = watch("start_date");
  const endDate = watch("end_date");
  const startTime = watch("start_time");
  const endTime = watch("end_time");

  useEffect(() => {
    register("start_date", { required: "Start date is required" });
    register("end_date", { required: "End date is required" });
    register("start_time");
    register("end_time");
  }, [register]);

  useEffect(() => {
    if (!startTime) {
      setValue("start_time", "00:00");
    }
    if (!endTime) {
      setValue("end_time", "23:59");
    }
  }, [startTime, endTime, setValue]);

  const onInvalid = (formErrors) => {
    const first = Object.values(formErrors || {})?.[0];
    const message =
      (first && (first.message || first?.type)) ||
      "Please fill all required fields";
    showToast("error", message);
  };

  const onSubmit = async (formData) => {
    // Format dates to ISO format
    // Combine date and time for start_at
    let formattedStartAt = null;
    if (formData.start_date) {
      const dateStr =
        formData.start_date instanceof Date
          ? format(formData.start_date, "yyyy-MM-dd")
          : formData.start_date;
      const timeStr = formData.start_time || "00:00";
      formattedStartAt = formatDateToISO(`${dateStr}T${timeStr}`);
    }

    // Combine date and time for end_at
    let formattedEndAt = null;
    if (formData.end_date) {
      const dateStr =
        formData.end_date instanceof Date
          ? format(formData.end_date, "yyyy-MM-dd")
          : formData.end_date;
      const timeStr = formData.end_time || "23:59";
      formattedEndAt = formatDateToISO(`${dateStr}T${timeStr}`);
    }

    // Build the payload dynamically from form data
    const payload = {
      code: formData.code,
      type: formData.type,
      value: formData.value,
      currency: "AED",
      scope_type: "GLOBAL",
      scope_ids: null,
      allowed_user_ids: null,
      excluded_product_ids: null,
      min_subtotal: formData.min_subtotal ?? null,
      first_order_only: formData.first_order_only || false,
      start_at: formattedStartAt,
      end_at: formattedEndAt,
      channels: ["WEB"],
      usage_limit_total: formData.usage_limit_total ?? null,
      usage_limit_per_user: formData.usage_limit_per_user ?? null,
      stack_group: formData.stack_group || "WELCOME",
      priority: 1,
      status: "ACTIVE",
      created_by: "dde697db-2f01-4909-bdd5-60709de6dc98",
      // Only include max_discount if it has a value
      ...(formData.max_discount && { max_discount: formData.max_discount }),
    };

    // Make API request using useAxios hook
    const { data: responseData, error: responseError } = await request({
      method: "POST",
      url: "/admin/create-coupon",
      payload: payload,
      authRequired: true,
    });

    // Handle response
    if (responseError) {
      showToast("error", responseError || "Something went wrong!");
      return;
    }

    if (responseData) {
      showToast("success", `Coupon ${formData.code} created successfully 🎉`);
      reset();
      onClose(); // Call the onSuccess callback if provided (to refresh
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <DialogTitle className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create New Coupon
            </DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Fill in the details below to create a new discount coupon
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
          <div className="space-y-6 px-6 py-6">
            {/* Section 1 - Basic Info */}
            <div className="space-y-4 p-5 rounded-xl bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-blue-950/10 dark:to-indigo-950/10 border border-blue-100/50 dark:border-blue-900/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                  <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  Basic Information
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="code"
                    className="text-sm font-medium text-foreground/80"
                  >
                    Coupon Code
                  </Label>
                  <Input
                    id="code"
                    placeholder="e.g., WELCOME10"
                    className="bg-background/50 border-border/50 focus:border-blue-400 focus:ring-blue-400/20"
                    {...register("code")}
                  />
                  {errors.code && (
                    <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                      <span>•</span> {errors.code.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="type"
                    className="text-sm font-medium text-foreground/80"
                  >
                    Discount Type
                  </Label>
                  <Select
                    value={type}
                    onValueChange={(value) => setValue("type", value)}
                  >
                    <SelectTrigger
                      id="type"
                      className="w-full bg-background/50 border-border/50 focus:border-blue-400 focus:ring-blue-400/20"
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENT">
                        <div className="flex items-center gap-2">
                          <Percent className="h-3.5 w-3.5" />
                          <span>Percentage</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="FLAT">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>Flat Amount</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                      <span>•</span> {errors.type.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="value"
                    className="text-sm font-medium text-foreground/80"
                  >
                    Discount Value
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    placeholder="10"
                    onWheel={(e) => e.currentTarget.blur()}
                    className="bg-background/50 border-border/50 focus:border-blue-400 focus:ring-blue-400/20"
                    {...register("value")}
                  />
                  {errors.value && (
                    <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                      <span>•</span> {errors.value.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="max_discount"
                    className="text-sm font-medium text-foreground/80"
                  >
                    Max Discount (AED)
                  </Label>
                  <Input
                    id="max_discount"
                    type="number"
                    placeholder="100"
                    onWheel={(e) => e.currentTarget.blur()}
                    className="bg-background/50 border-border/50 focus:border-blue-400 focus:ring-blue-400/20"
                    {...register("max_discount")}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label
                    htmlFor="min_subtotal"
                    className="text-sm font-medium text-foreground/80"
                  >
                    Minimum Subtotal (Optional)
                  </Label>
                  <Input
                    id="min_subtotal"
                    type="number"
                    placeholder="500"
                    onWheel={(e) => e.currentTarget.blur()}
                    className="bg-background/50 border-border/50 focus:border-blue-400 focus:ring-blue-400/20"
                    {...register("min_subtotal")}
                  />
                </div>
              </div>
            </div>

            {/* Section 2 - Restrictions */}
            <div className="space-y-4 p-5 rounded-xl bg-gradient-to-br from-amber-50/30 to-orange-50/30 dark:from-amber-950/10 dark:to-orange-950/10 border border-amber-100/50 dark:border-amber-900/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/30">
                  <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  Restrictions & Limits
                </h3>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/40 border border-border/30">
                {/* <Switch
                                    className="cursor-pointer"
                                    checked={firstOrderOnly}
                                    onCheckedChange={(checked) =>
                                        setValue("first_order_only", checked)
                                    }
                                /> */}
                {/* <div className="flex-1">
                                    <Label htmlFor="first_order_only" className="text-sm font-medium cursor-pointer">
                                        First Order Only
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Restrict this coupon to first-time customers only
                                    </p>
                                </div> */}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="usage_limit_total"
                    className="text-sm font-medium text-foreground/80"
                  >
                    Total Usage Limit (Optional)
                  </Label>
                  <Input
                    id="usage_limit_total"
                    type="number"
                    placeholder="1000"
                    onWheel={(e) => e.currentTarget.blur()}
                    className="bg-background/50 border-border/50 focus:border-amber-400 focus:ring-amber-400/20"
                    {...register("usage_limit_total")}
                  />
                </div>

                {/* {!firstOrderOnly && (
                                    <div className="space-y-2">
                                        <Label htmlFor="usage_limit_per_user" className="text-sm font-medium text-foreground/80">
                                            Usage Per User (Optional)
                                        </Label>
                                        <Input
                                            id="usage_limit_per_user"
                                            type="number"
                                            placeholder="1"
                                            onWheel = {(e) => e.currentTarget.blur()}
                                            className="bg-background/50 border-border/50 focus:border-amber-400 focus:ring-amber-400/20"
                                        {...register("usage_limit_per_user")}
                                        />
                                    </div>
                                )} */}
              </div>
            </div>

            {/* Section 3 - Validity */}
            <div className="space-y-4 p-5 rounded-xl bg-gradient-to-br from-green-50/30 to-emerald-50/30 dark:from-green-950/10 dark:to-emerald-950/10 border border-green-100/50 dark:border-green-900/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/30">
                  <CalendarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  Validity Period
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground/80">
                    Start Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-background/50 border-border/50 hover:bg-background/70",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                        {startDate ? (
                          format(startDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={(date) =>
                          setValue("start_date", date, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.start_date && (
                    <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                      <span>•</span> {errors.start_date.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground/80">
                    End Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-background/50 border-border/50 hover:bg-background/70",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                        {endDate ? (
                          format(endDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={(date) =>
                          setValue("end_date", date, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.end_date && (
                    <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                      <span>•</span> {errors.end_date.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4 - Advanced Settings */}
            {/* <div className="space-y-4 p-5 rounded-xl bg-gradient-to-br from-purple-50/30 to-pink-50/30 dark:from-purple-950/10 dark:to-pink-950/10 border border-purple-100/50 dark:border-purple-900/20">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30">
                                    <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-base font-semibold text-foreground">
                                    Advanced Settings
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="priority" className="text-sm font-medium text-foreground/80">
                                        Priority (Optional)
                                    </Label>
                                    <Input
                                        id="priority"
                                        type="number"
                                        placeholder="1"
                                        className="bg-background/50 border-border/50 focus:border-purple-400 focus:ring-purple-400/20"
                                        {...register("priority")}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Higher priority coupons are applied first
                                    </p>
                                </div>
                            </div>

                           
                        </div> */}
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/30 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onClose();
              }}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Create Coupon
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
