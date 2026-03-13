"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw, ExternalLink, Truck } from "lucide-react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/_ui/spinner";
import { Switch } from "@/components/ui/switch";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";
import SyncProgressTracker from "@/components/_dialogs/SyncProgressTracker";

const LUXURY_VENDOR_ID = "65053474-4e40-44ee-941c-ef5253ea9fc9";
const PEPPELA_VENDOR_ID = "b34fd0f6-815a-469e-b7c2-73f9e8afb3ed";
const BRANDSGATEWAY_VENDOR_ID = "51bd4bcf-1c4d-4972-b10d-f21c2af93a9c";
const BDROPPY_VENDOR_ID = "a6bdd96b-0e2c-4f3e-b644-4e088b1778e0";

const ACTIVE_COUNTRIES = [
  { code: "AED", name: "UAE Dirham" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "QAR", name: "Qatari Riyal" },
  { code: "KWD", name: "Kuwaiti Dinar" },
  { code: "OMR", name: "Omani Rial" },
  { code: "BHD", name: "Bahraini Dinar" },
  { code: "INR", name: "Indian Rupee" },
  { code: "PKR", name: "Pakistani Rupee" },
];

const SHIPPING_PER_ITEM_DEFAULTS = {
  "CLOTHING": 2,
  "SHOES": 4,
  "ACCESSORIES": 2,
  "BAGS & WALLETS": 4,
  "JEWELERY": 2,
  "FRAMES": 2,
  "SUNGLASSES": 2,
  "WATCHES": 2,
};

/** DHL Express default shipping rates by country (Luxury-Distribution). Key * = default for unlisted countries. */
const LUXURY_DHL_COUNTRY_RATES = {
  "*": 100,
  AL: 18, AD: 18, AE: 36, AR: 40, AU: 75, AT: 18, BE: 12, BG: 12, BH: 35, BA: 18, BY: 40, BR: 40, CA: 35, CH: 18, CL: 40, CN: 35, CO: 40, CR: 40, CU: 40, CY: 15, CZ: 15, DE: 12, DK: 20, DZ: 50, EG: 40, ES: 15, EE: 15, FI: 15, FR: 12, GB: 14, GE: 50, GH: 50, GR: 15, HK: 40, HR: 12, HU: 15, ID: 27, IN: 35, IE: 15, IS: 18, IT: 10, JM: 50, JP: 30, KZ: 50, KH: 45, KR: 30, KW: 45, LI: 18, LT: 15, LU: 12, LV: 15, MO: 45, MA: 40, MC: 15, MD: 20, MX: 35, MK: 18, MT: 15, ME: 18, MY: 50, NG: 50, NL: 12, NO: 18, NP: 50, NZ: 40, OM: 50, PH: 28, PL: 15, PT: 15, QA: 40, RO: 15, SA: 40, SG: 35, SM: 10, RS: 18, SK: 15, SI: 12, SE: 15, TH: 35, TN: 40, TR: 35, TW: 35, UY: 50, US: 30, VN: 40, YE: 40, ZA: 50, LY: 100,
};

const LUXURY_ITEM_TIERS_DEFAULT = [
  { min: 3, max: 4, multiplier: 2 },
  { min: 5, max: 6, multiplier: 3 },
  { min: 7, max: 8, multiplier: 4 },
  { min: 9, max: 10, multiplier: 5 },
  { min: 11, max: 12, multiplier: 6 },
];

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { request } = useAxios();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [savingMerchantDash, setSavingMerchantDash] = useState(false);
  const [merchantDashUrl, setMerchantDashUrl] = useState("");
  const [shippingCountryCosts, setShippingCountryCosts] = useState({});
  const [shippingPerItem, setShippingPerItem] = useState({ ...SHIPPING_PER_ITEM_DEFAULTS });
  const [savingShipping, setSavingShipping] = useState(false);
  const [shippingDefaultRate, setShippingDefaultRate] = useState(100);
  const [shippingCountryRates, setShippingCountryRates] = useState({ ...LUXURY_DHL_COUNTRY_RATES });
  const [shippingItemTiers, setShippingItemTiers] = useState([...LUXURY_ITEM_TIERS_DEFAULT]);
  const [shippingLowValueThreshold, setShippingLowValueThreshold] = useState(200);
  const [shippingLowValueSupplement, setShippingLowValueSupplement] = useState(20);
  const [savingLdShipping, setSavingLdShipping] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [productStats, setProductStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const vendorId = params.id;

  useEffect(() => {
    if (vendorId) {
      fetchVendorDetails();
      fetchProductStats();
    }
  }, [vendorId]);

  const fetchProductStats = async () => {
    setStatsLoading(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: `/admin/vendor-product-stats/${vendorId}`,
        authRequired: true,
      });

      if (error) throw new Error(error?.message || error);

      if (data?.success) {
        setProductStats(data.data);
      }
    } catch (err) {
      console.error("Error fetching product stats:", err.message);
    } finally {
      setStatsLoading(false);
    }
  };

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
      setMerchantDashUrl(foundVendor.merchant_dashboard_url || "");
      const meta = foundVendor.metadata || {};
      setShippingCountryCosts(meta.shipping_country_costs || {});
      setShippingPerItem({ ...SHIPPING_PER_ITEM_DEFAULTS, ...(meta.shipping_per_item || {}) });
      setShippingDefaultRate(Number(meta.shipping_default_rate) || 100);
      setShippingCountryRates({ ...LUXURY_DHL_COUNTRY_RATES, ...(meta.shipping_country_rates || {}) });
      setShippingItemTiers(Array.isArray(meta.shipping_item_tiers) && meta.shipping_item_tiers.length > 0 ? meta.shipping_item_tiers : [...LUXURY_ITEM_TIERS_DEFAULT]);
      setShippingLowValueThreshold(Number(meta.shipping_low_value_threshold) ?? 200);
      setShippingLowValueSupplement(Number(meta.shipping_low_value_supplement) ?? 20);
    } catch (err) {
      console.error("Error fetching vendor details:", err.message);
      showToast("error", err.message || "Failed to fetch vendor details");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveShippingCosts = async () => {
    if (!vendor?.id) return;
    setSavingShipping(true);
    try {
      const { data, error } = await request({
        method: "PATCH",
        url: "/admin/update-vendor",
        authRequired: true,
        payload: {
          id: vendor.id,
          shipping_country_costs: shippingCountryCosts,
          shipping_per_item: shippingPerItem,
        },
      });
      if (error) throw new Error(error?.message || error);
      if (data?.success && data?.data) {
        setVendor((prev) => ({ ...prev, metadata: data.data.metadata || prev.metadata }));
        showToast("success", "Shipping costs saved");
      }
    } catch (err) {
      showToast("error", err.message || "Failed to save");
    } finally {
      setSavingShipping(false);
    }
  };

  const handleSaveLdShippingCosts = async () => {
    if (!vendor?.id) return;
    setSavingLdShipping(true);
    try {
      const defaultRate = Number(shippingDefaultRate);
      const ratesWithDefault = { ...shippingCountryRates, "*": Number.isFinite(defaultRate) && defaultRate >= 0 ? defaultRate : 100 };
      const { data, error } = await request({
        method: "PATCH",
        url: "/admin/update-vendor",
        authRequired: true,
        payload: {
          id: vendor.id,
          shipping_default_rate: defaultRate,
          shipping_country_rates: ratesWithDefault,
          shipping_item_tiers: shippingItemTiers,
          shipping_low_value_threshold: shippingLowValueThreshold,
          shipping_low_value_supplement: shippingLowValueSupplement,
        },
      });
      if (error) throw new Error(error?.message || error);
      if (data?.success && data?.data) {
        setVendor((prev) => ({ ...prev, metadata: data.data.metadata || prev.metadata }));
        showToast("success", "Luxury-Distribution shipping costs saved");
      }
    } catch (err) {
      showToast("error", err.message || "Failed to save");
    } finally {
      setSavingLdShipping(false);
    }
  };

  const handleSaveMerchantDash = async () => {
    if (!vendor?.id) return;
    setSavingMerchantDash(true);
    try {
      const { data, error } = await request({
        method: "PATCH",
        url: "/admin/update-vendor",
        authRequired: true,
        payload: {
          id: vendor.id,
          merchant_dashboard_url: merchantDashUrl.trim() || null,
        },
      });
      if (error) throw new Error(error?.message || error);
      if (data?.success && data?.data) {
        setVendor((prev) => ({ ...prev, merchant_dashboard_url: data.data.merchant_dashboard_url }));
        showToast("success", "Merchant dashboard URL saved");
      }
    } catch (err) {
      showToast("error", err.message || "Failed to save");
    } finally {
      setSavingMerchantDash(false);
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

  const canSyncProducts =
    vendor.integration_type === "api" && capabilities.has_individual_syncing;
  const syncConfig =
    vendor.id === LUXURY_VENDOR_ID
      ? { url: "/admin/get-products-from-luxury", vendorId: LUXURY_VENDOR_ID }
      : vendor.id === PEPPELA_VENDOR_ID
      ? { url: "/admin/get-products-from-peppela", vendorId: PEPPELA_VENDOR_ID }
      : vendor.id === BRANDSGATEWAY_VENDOR_ID
      ? { url: "/admin/get-products-from-brandsgateway", vendorId: BRANDSGATEWAY_VENDOR_ID }
      : vendor.id === BDROPPY_VENDOR_ID
      ? { url: "/admin/get-products-from-bdroppy", vendorId: BDROPPY_VENDOR_ID }
      : null;

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
              <div className="col-span-2 space-y-2">
                <Label className="text-sm font-medium text-gray-700">Merchant dashboard</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={merchantDashUrl}
                    onChange={(e) => setMerchantDashUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSaveMerchantDash}
                    disabled={savingMerchantDash}
                  >
                    {savingMerchantDash ? <Spinner className="h-4 w-4" /> : "Save"}
                  </Button>
                </div>
                {vendor.merchant_dashboard_url && (
                  <a
                    href={vendor.merchant_dashboard_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open merchant dashboard
                  </a>
                )}
              </div>
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

          {/* Shipping cost (Brandsgateway only) */}
          {vendor.id === BRANDSGATEWAY_VENDOR_ID && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Shipping cost
                </CardTitle>
                <CardDescription>
                  Base shipping by country (€) and per-item shipping by category. Used for Brandsgateway orders.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Base shipping by country (€)</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {ACTIVE_COUNTRIES.map(({ code, name }) => (
                      <div key={code} className="flex flex-col gap-1">
                        <Label className="text-xs text-gray-600">{code} – {name}</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          value={shippingCountryCosts[code] ?? ""}
                          onChange={(e) =>
                            setShippingCountryCosts((prev) => ({
                              ...prev,
                              [code]: e.target.value === "" ? "" : Number(e.target.value),
                            }))
                          }
                          className="h-8"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Per item shipping (€)</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(SHIPPING_PER_ITEM_DEFAULTS).map(([key]) => (
                      <div key={key} className="flex flex-col gap-1">
                        <Label className="text-xs text-gray-600">{key}</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={shippingPerItem[key] ?? ""}
                          onChange={(e) =>
                            setShippingPerItem((prev) => ({
                              ...prev,
                              [key]: e.target.value === "" ? "" : Number(e.target.value),
                            }))
                          }
                          className="h-8"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveShippingCosts}
                  disabled={savingShipping}
                >
                  {savingShipping ? <Spinner className="h-4 w-4" /> : "Save shipping costs"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Shipping cost (Luxury-Distribution – DHL Express) */}
          {vendor.id === LUXURY_VENDOR_ID && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Shipping cost (DHL Express)
                </CardTitle>
                <CardDescription>
                  Country-based standard rates (€), item-based multipliers, and low-value order supplement. Default rate applies when country is not listed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Default shipping rate (€)</h4>
                  <p className="text-xs text-gray-500 mb-2">Applied when destination country is not in the list below.</p>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-gray-600 shrink-0">* (default)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-24 h-8"
                      value={shippingDefaultRate === "" ? "" : shippingDefaultRate}
                      onChange={(e) => setShippingDefaultRate(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                    <span className="text-sm text-gray-500">€</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Shipping by country (€)</h4>
                  <p className="text-xs text-gray-500 mb-2">Country code → price. Rates may vary by supplier; refer to this page for updates.</p>
                  <div className="border rounded-lg p-3 max-h-64 overflow-y-auto bg-gray-50/50">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {Object.keys(shippingCountryRates)
                        .filter((code) => code !== "*")
                        .sort((a, b) => (a === "*" ? -1 : b === "*" ? 1 : a.localeCompare(b)))
                        .map((code) => (
                          <div key={code} className="flex items-center gap-1">
                            <Label className="text-xs text-gray-600 w-8 shrink-0">{code}</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              className="h-8 flex-1"
                              value={shippingCountryRates[code] ?? ""}
                              onChange={(e) =>
                                setShippingCountryRates((prev) => ({
                                  ...prev,
                                  [code]: e.target.value === "" ? "" : Number(e.target.value),
                                }))
                              }
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Item-based shipping multipliers</h4>
                  <p className="text-xs text-gray-500 mb-2">Standard rate × multiplier by item count. For 13+ items: multiplier = 6 + ceil((items − 12) / 2).</p>
                  <div className="border rounded-lg p-3 bg-gray-50/50">
                    <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-600 mb-2">
                      <span>Min items</span>
                      <span>Max items</span>
                      <span>Multiplier</span>
                    </div>
                    {shippingItemTiers.map((tier, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-2 mb-2">
                        <Input
                          type="number"
                          min={0}
                          className="h-8"
                          value={tier.min}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setShippingItemTiers((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], min: Number.isFinite(v) ? v : 0 };
                              return next;
                            });
                          }}
                        />
                        <Input
                          type="number"
                          min={0}
                          className="h-8"
                          value={tier.max}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setShippingItemTiers((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], max: Number.isFinite(v) ? v : 0 };
                              return next;
                            });
                          }}
                        />
                        <Input
                          type="number"
                          min={1}
                          className="h-8"
                          value={tier.multiplier}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setShippingItemTiers((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], multiplier: Number.isFinite(v) && v >= 1 ? v : 1 };
                              return next;
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Low-value order supplement</h4>
                  <p className="text-xs text-gray-500 mb-2">For orders from each supplier totaling less than the threshold, add the supplement (€).</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600">Threshold (€)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        className="w-24 h-8"
                        value={shippingLowValueThreshold}
                        onChange={(e) => setShippingLowValueThreshold(Number(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600">Supplement (€)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-24 h-8"
                        value={shippingLowValueSupplement}
                        onChange={(e) => setShippingLowValueSupplement(Number(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveLdShippingCosts}
                  disabled={savingLdShipping}
                >
                  {savingLdShipping ? <Spinner className="h-4 w-4" /> : "Save shipping costs"}
                </Button>
              </CardContent>
            </Card>
          )}

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

              {/* Sync Button for API vendors (full sync: LD, Peppela, BG, BDroppy) */}
              {syncConfig && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => setSyncDialogOpen(true)}
                    className="w-full bg-yellow-700 text-white hover:bg-yellow-800"
                    disabled={!isActive}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Products
                  </Button>
                  {!isActive && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Enable the plugin to sync products
                    </p>
                  )}
                </div>
              )}
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

          {/* Product Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Product Statistics</CardTitle>
              <CardDescription>Products from this vendor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {statsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : productStats ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Products</span>
                    <span className="font-semibold text-gray-900">{productStats.totalProducts || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Products</span>
                    <Badge className="bg-green-600">{productStats.activeProducts || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Inactive Products</span>
                    <Badge className="bg-gray-500">{productStats.inactiveProducts || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Variants</span>
                    <span className="font-semibold text-gray-900">{productStats.totalVariants || 0}</span>
                  </div>
                  {productStats.lastSync && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500">
                        Last Sync: {new Date(productStats.lastSync.completedAt).toLocaleString("en-GB", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No product data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sync Progress Tracker Modal */}
      <SyncProgressTracker
        open={syncDialogOpen}
        onClose={() => setSyncDialogOpen(false)}
        vendorName={vendor?.name || "Vendor"}
        vendorId={syncConfig?.vendorId || vendor?.id}
        startSyncUrl={syncConfig?.url}
      />
    </div>
  );
}
