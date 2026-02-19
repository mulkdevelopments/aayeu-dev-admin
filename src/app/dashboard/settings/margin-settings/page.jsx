"use client";

import React, { useState, useEffect, useCallback } from "react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";
import { Loader2, RefreshCw } from "lucide-react";

const defaultForm = {
  high_threshold: 1000,
  mid_threshold: 501,
  margin_high_percent: 28,
  margin_mid_percent: 37,
  margin_low_percent: 45,
};

export default function MarginSettingsPage() {
  const { request } = useAxios();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState(null); // null = Default
  const [form, setForm] = useState(defaultForm);

  const fetchVendors = useCallback(async () => {
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/get-vendor-list",
        authRequired: true,
      });
      if (error) throw new Error(error?.message || error);
      if (data?.success && data?.data?.vendors) {
        setVendors(data.data.vendors);
      } else if (data?.success && Array.isArray(data?.data)) {
        setVendors(data.data);
      }
    } catch (err) {
      console.warn("Failed to load vendors:", err);
    }
  }, []);

  const fetchSettings = useCallback(async (vendorId) => {
    setLoading(true);
    try {
      const url = vendorId
        ? `/admin/margin-settings?vendor_id=${encodeURIComponent(vendorId)}`
        : "/admin/margin-settings";
      const { data, error } = await request({
        method: "GET",
        url,
        authRequired: true,
      });
      if (error) throw new Error(error?.message || error);
      if (data?.success && data?.data) {
        setForm({
          high_threshold: data.data.high_threshold ?? defaultForm.high_threshold,
          mid_threshold: data.data.mid_threshold ?? defaultForm.mid_threshold,
          margin_high_percent: data.data.margin_high_percent ?? defaultForm.margin_high_percent,
          margin_mid_percent: data.data.margin_mid_percent ?? defaultForm.margin_mid_percent,
          margin_low_percent: data.data.margin_low_percent ?? defaultForm.margin_low_percent,
        });
      } else {
        setForm(defaultForm);
      }
    } catch (err) {
      console.error(err);
      showToast("error", err.message || "Failed to load margin settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  useEffect(() => {
    fetchSettings(selectedVendorId);
  }, [selectedVendorId, fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        vendor_id: selectedVendorId || undefined,
      };
      const { data, error } = await request({
        method: "PUT",
        url: "/admin/margin-settings",
        payload,
        authRequired: true,
      });
      if (error) throw new Error(error?.message || error);
      showToast("success", data?.message || "Margin settings saved");
    } catch (err) {
      console.error(err);
      showToast("error", err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNow = async () => {
    setApplying(true);
    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/margin-settings/apply-now",
        payload: { vendor_id: selectedVendorId || undefined },
        authRequired: true,
      });
      if (error) throw new Error(error?.message || error);
      showToast(
        "success",
        data?.data?.updated != null
          ? `Updated ${data.data.updated} variant price(s)`
          : (data?.message || "Prices updated")
      );
    } catch (err) {
      console.error(err);
      showToast("error", err.message || "Failed to update prices");
    } finally {
      setApplying(false);
    }
  };

  const update = (key, value) => {
    const n = Number(value);
    setForm((prev) => ({ ...prev, [key]: Number.isNaN(n) ? value : n }));
  };

  return (
    <div className="p-4 sm:p-6">
      <CustomBreadcrumb
        items={[
          { label: "Dashboard", path: "/dashboard" },
          { label: "Settings", path: "/dashboard/settings" },
          { label: "Margin settings", path: "/dashboard/settings/margin-settings" },
        ]}
      />
      <h1 className="text-2xl font-bold mt-4 mb-6">Margin settings</h1>
      <p className="text-sm text-gray-600 mb-6">
        Tiered margin applied to vendor sale price during sync. Settings can be per vendor or use Default for all. &quot;Update now&quot; recalculates price and MRP for existing variants using the current margin for that vendor.
      </p>

      <Card className="max-w-lg mb-6">
        <CardHeader>
          <CardTitle>Vendor</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedVendorId ?? "default"}
            onValueChange={(v) => setSelectedVendorId(v === "default" ? null : v)}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default (all vendors)</SelectItem>
              {vendors.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name || v.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading…
        </div>
      ) : (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Tiered margin {selectedVendorId ? "(this vendor)" : "(default)"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>High threshold (vendor price &gt; this)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.high_threshold}
                  onChange={(e) => update("high_threshold", e.target.value)}
                  placeholder="1000"
                />
                <p className="text-xs text-muted-foreground">e.g. 1000 (€)</p>
              </div>
              <div className="space-y-2">
                <Label>Margin high (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.margin_high_percent}
                  onChange={(e) => update("margin_high_percent", e.target.value)}
                  placeholder="28"
                />
              </div>
              <div className="space-y-2">
                <Label>Mid threshold (vendor price ≥ this)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.mid_threshold}
                  onChange={(e) => update("mid_threshold", e.target.value)}
                  placeholder="501"
                />
                <p className="text-xs text-muted-foreground">e.g. 501 (€)</p>
              </div>
              <div className="space-y-2">
                <Label>Margin mid (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.margin_mid_percent}
                  onChange={(e) => update("margin_mid_percent", e.target.value)}
                  placeholder="37"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Margin low (%) — below mid threshold</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.margin_low_percent}
                  onChange={(e) => update("margin_low_percent", e.target.value)}
                  placeholder="45"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save margin settings
              </Button>
              <Button variant="outline" onClick={handleUpdateNow} disabled={applying}>
                {applying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Update now
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              &quot;Update now&quot; recalculates price and MRP for existing product variants using the current margin (for the selected vendor or all vendors if Default).
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
