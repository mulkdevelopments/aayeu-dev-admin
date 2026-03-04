"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw } from "lucide-react";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";

const SyncLuxuryDialog = ({ open, onClose, currencyOptions = [] }) => {
  const { request } = useAxios();
  const [currency, setCurrency] = useState("");
  const [conversionRate, setConversionRate] = useState("");
  const [incrementPercent, setIncrementPercent] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const normalizedCurrencyOptions = useMemo(
    () =>
      currencyOptions.length
        ? currencyOptions
        : [
            { label: "EUR → Euro", value: "EUR" },
            { label: "GBP → British Pound Sterling", value: "GBP" },
            { label: "USD → United States Dollar", value: "USD" },
          ],
    [currencyOptions]
  );

  useEffect(() => {
    if (!open) {
      setCurrency("");
      setConversionRate("");
      setIncrementPercent("");
      setIsSyncing(false);
    }
  }, [open]);

  if (!open) return null;

  const closeDialog = () => {
    if (!isSyncing) onClose?.();
  };

  const validate = () => {
    if (!currency) {
      showToast("error", "Currency is required.");
      return false;
    }
    if (!conversionRate) {
      showToast("error", "Conversion rate is required.");
      return false;
    }
    if (Number(conversionRate) <= 0) {
      showToast("error", "Conversion rate must be greater than zero.");
      return false;
    }
    if (!incrementPercent) {
      showToast("error", "Increment percent is required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSyncing(true);
      const { data, error } = await request({
        method: "POST",
        url: '/admin/get-products-from-luxury',
        payload: {
          currency,
          conversion_rate: conversionRate,
          increment_percent: incrementPercent,
        },
        authRequired: true,
      });

      if (error || !data?.success) {
        showToast("error", data?.message || error || "Failed to sync products");
        return;
      }

      showToast("success", data?.message || "Sync started successfully");
      closeDialog();
    } catch (err) {
      console.error(err);
      showToast("error", "Unexpected error while syncing products");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={closeDialog}
    >
      <Card
        className="w-full max-w-lg rounded-3xl border border-white/30 bg-white shadow-2xl shadow-gray-600/10"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-yellow-800 uppercase tracking-wide">
            <RefreshCw className="h-4 w-4" />
            Luxury-Distribution Import
          </div>
          <CardTitle className="text-2xl font-semibold text-gray-900">
            Sync Vendor Products
          </CardTitle>
          <p className="text-sm text-gray-500">
            Provide the currency, conversion rate, and markup percentage you
            want to apply before syncing products from Luxury-Distribution.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Currency
              </label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose currency" />
                </SelectTrigger>
                <SelectContent>
                  {normalizedCurrencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Conversion rate
              </label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.0001"
                placeholder="e.g. 4.27"
                value={conversionRate}
                onChange={(e) => setConversionRate(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Increment percent
              </label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="0.5"
                placeholder="e.g. 10"
                value={incrementPercent}
                onChange={(e) => setIncrementPercent(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                required
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isSyncing}
                className="sm:min-w-[130px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-yellow-700 text-white hover:bg-yellow-800 sm:min-w-[150px]"
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Syncing...
                  </span>
                ) : (
                  "Start Sync"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SyncLuxuryDialog;

