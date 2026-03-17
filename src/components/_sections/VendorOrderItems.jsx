"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import useAxios from "@/hooks/useAxios";
import {
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Truck,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Loader2,
  MapPin,
  Route,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/**
 * VendorOrderItems Component
 *
 * Displays order items grouped by vendor with:
 * - Vendor badges with different colors
 * - Vendor order placement status
 * - Tracking information
 * - Retry functionality for failed orders
 */
const TWO_MINUTES_MS = 2 * 60 * 1000;

function parseTrackingCodes(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

function getTrackingCode(t) {
  return t?.trackingCode ?? t?.code ?? t?.number ?? null;
}

function getTrackingCarrier(t) {
  return t?.carrier ?? t?.company ?? "";
}

function getTrackingUrl(t) {
  return t?.trackingUrl ?? t?.url ?? null;
}

function carrierPublicTrackUrl(carrier, number) {
  const c = String(carrier || "").toLowerCase();
  const n = encodeURIComponent(number);
  if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${n}`;
  if (c.includes("dhl")) return `https://www.dhl.com/en/express/tracking.html?AWB=${n}`;
  if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${n}`;
  if (c.includes("usps")) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`;
  return null;
}

function humanizeTrackingStatus(latestStatus) {
  if (!latestStatus) return null;
  const s = String(latestStatus.sub_status || latestStatus.status || "").trim();
  const map = {
    Delivered: "Delivered",
    Delivered_Other: "Delivered",
    InTransit: "In transit",
    InTransit_PickedUp: "In transit",
    OutForDelivery: "Out for delivery",
    InfoReceived: "Label created",
    Exception: "Delivery exception",
    Pending: "Pending",
    Expired: "Tracking expired",
    NotFound: "Not found",
  };
  if (map[s]) return map[s];
  if (!s) return null;
  return s.replace(/_/g, " ");
}

function formatArrivalSummary(shipmentSummary) {
  if (!shipmentSummary) return null;
  const { estimatedFrom, estimatedTo } = shipmentSummary;
  if (!estimatedFrom && !estimatedTo) return null;
  const fmt = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return {
      dateStr: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    };
  };
  if (estimatedFrom && estimatedTo && String(estimatedFrom) !== String(estimatedTo)) {
    const a = fmt(estimatedFrom);
    const b = fmt(estimatedTo);
    if (a && b) return `Estimated delivery ${a.dateStr} – ${b.dateStr}`;
  }
  const target = estimatedTo || estimatedFrom;
  const x = fmt(target);
  if (!x) return null;
  return `Arriving on ${x.dateStr} (${x.weekday})`;
}

/** Summary + collapsible scan timeline (17TRACK). */
function CarrierShipmentTimeline({ trackingNumber, carrierName }) {
  const { request } = useAxios();
  const requestRef = useRef(request);
  requestRef.current = request;
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    if (!trackingNumber) return;
    let cancelled = false;
    setState({ status: "loading" });
    (async () => {
      try {
        const { data, error } = await requestRef.current({
          method: "GET",
          url: `/admin/tracking-timeline?number=${encodeURIComponent(trackingNumber)}&carrier=${encodeURIComponent(carrierName || "")}`,
          authRequired: true,
        });
        if (cancelled) return;
        if (error) {
          setState({ status: "error", message: "Could not load carrier data." });
          return;
        }
        const payload = data?.data ?? data;
        setState({ status: "done", ...payload });
      } catch {
        if (!cancelled) setState({ status: "error", message: "Could not load carrier data." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trackingNumber, carrierName, tick]);

  const publicUrl = carrierPublicTrackUrl(carrierName, trackingNumber);
  const events = Array.isArray(state.events) ? state.events : [];
  const configured = state.configured !== false;
  const summary = state.shipmentSummary || null;
  const statusLabel = humanizeTrackingStatus(state.latestStatus);
  const arrivalLine = formatArrivalSummary(summary);
  const serviceLine = [summary?.serviceType, summary?.weight].filter(Boolean).join(" · ");
  const routeLine =
    summary?.origin || summary?.destination
      ? [summary.origin && `From ${summary.origin}`, summary.destination && `To ${summary.destination}`]
          .filter(Boolean)
          .join(" → ")
      : null;

  if (state.status === "loading") {
    return (
      <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-600 shrink-0" />
        <div className="text-sm text-gray-600">Loading shipment status from carrier…</div>
      </div>
    );
  }

  const detailsInner = () => {
    if (state.status === "error") {
      return (
        <div className="text-xs text-amber-800 space-y-2">
          <p>{state.message}</p>
          {publicUrl && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-blue-700 underline"
            >
              Track on carrier site <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      );
    }
    if (!configured) {
      return (
        <div className="text-xs text-gray-600 space-y-2">
          <p>
            {state.message ||
              "Add SEVENTEEN_TRACK_API_KEY on the server for full scan history. Carrier link below."}
          </p>
          {publicUrl && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
            >
              Open carrier tracking <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      );
    }
    if (state.error) {
      return (
        <div className="flex flex-wrap items-center gap-2 text-xs text-red-600">
          {state.error}
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setTick((t) => t + 1)}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </div>
      );
    }
    if (events.length === 0) {
      return (
        <div className="space-y-3 text-xs text-gray-600">
          <p>{state.message || "No scan events in feed yet."}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setTick((t) => t + 1)}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Refresh from carrier
            </Button>
            {publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-300 bg-white px-3 text-xs font-medium hover:bg-gray-50"
              >
                Carrier site <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      );
    }
    return (
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
            <Route className="w-3.5 h-3.5 text-emerald-600" />
            Full scan history
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" className="h-7 text-[11px] px-2" onClick={() => setTick((t) => t + 1)}>
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
            {publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-0.5 px-2"
              >
                Carrier <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
        <ul className="border-l-2 border-emerald-200 ml-2 pl-4 space-y-3 pb-1 max-h-[min(420px,55vh)] overflow-y-auto">
          {events.map((ev, i) => (
            <li key={`${ev.timeUtc}-${i}`} className="relative">
              <span
                className="absolute -left-[calc(1rem+3px)] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white border border-emerald-600/30"
                aria-hidden
              />
              <div className="text-[11px] text-gray-500 font-mono tabular-nums">
                {ev.timeUtc
                  ? new Date(ev.timeUtc).toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </div>
              <div className="text-sm text-gray-900 leading-snug">{ev.description}</div>
              {ev.location ? (
                <div className="text-xs text-gray-500 flex items-start gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>{ev.location}</span>
                </div>
              ) : null}
              {ev.provider && ev.provider !== "Milestone" ? (
                <div className="text-[10px] text-gray-400 mt-0.5">{ev.provider}</div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="mt-3 rounded-xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 shadow-sm overflow-hidden">
      <div className="p-3 sm:p-4">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Truck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-semibold text-gray-900">{carrierName || "Carrier"}</span>
              <span className="text-xs text-gray-400 hidden sm:inline">·</span>
              <span className="font-mono text-xs text-gray-700 break-all">{trackingNumber}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {statusLabel ? (
                <Badge className="bg-emerald-700 hover:bg-emerald-700 text-white border-0 text-[11px] font-medium px-2 py-0.5">
                  {statusLabel}
                </Badge>
              ) : configured ? (
                <Badge variant="outline" className="text-[11px] border-slate-300 text-slate-700">
                  Shipment active
                </Badge>
              ) : null}
              {summary?.estimatedSource && arrivalLine ? (
                <span className="text-[10px] text-gray-500">({summary.estimatedSource} estimate)</span>
              ) : null}
            </div>
            {arrivalLine ? (
              <p className="mt-2 text-sm font-semibold text-emerald-900 tracking-tight">{arrivalLine}</p>
            ) : null}
            {summary?.lastScanDescription ? (
              <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">
                <span className="font-medium text-gray-700">Last update:</span> {summary.lastScanDescription}
                {summary.lastScanTimeUtc ? (
                  <span className="text-gray-500">
                    {" "}
                    ·{" "}
                    {new Date(summary.lastScanTimeUtc).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ) : null}
                {summary.lastScanLocation ? <span className="text-gray-500"> · {summary.lastScanLocation}</span> : null}
              </p>
            ) : null}
            {serviceLine ? <p className="mt-1 text-[11px] text-gray-500">{serviceLine}</p> : null}
            {routeLine ? <p className="mt-1 text-[11px] text-gray-500">{routeLine}</p> : null}
            {!arrivalLine && !summary?.lastScanDescription && configured && (
              <p className="mt-2 text-xs text-gray-500">Open details for scan history or refresh to load ETA when available.</p>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="mt-3 w-full justify-between h-10 text-sm font-medium text-emerald-800 hover:text-emerald-900 hover:bg-emerald-50/80 border border-emerald-100 rounded-lg"
          onClick={() => setOpen((v) => !v)}
        >
          <span>{open ? "Hide shipment details" : "See shipment details"}</span>
          {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
        </Button>
      </div>
      {open ? (
        <div className="border-t border-slate-200 bg-white px-3 py-4 sm:px-4 sm:py-5">{detailsInner()}</div>
      ) : null}
    </div>
  );
}

export default function VendorOrderItems({
  items = [],
  orderId,
  onRetry,
  onSyncTracking,
  onMarkVendorPaid,
  onUnmarkVendorPaid,
  orderCurrency,
  orderExchangeRate,
  orderCurrencySymbol,
  customDuties = {},
  paymentStatus,
  orderCreatedAt,
}) {
  const [selectedImageByItem, setSelectedImageByItem] = useState({});

  const formatItemPrice = (eurPrice) => {
    if (eurPrice == null) return "€—";
    const rate = Number(orderExchangeRate) ?? 1;
    const code = orderCurrency || "AED";
    const duty = Number(customDuties[code]) || 0;
    let display = Number(eurPrice) * rate;
    if (duty > 0) display = display * (1 + duty / 100);
    const sym = orderCurrencySymbol || orderCurrency || "€";
    return `${sym}${display.toFixed(2)}`;
  };

  // Group items by vendor
  const itemsByVendor = items.reduce((acc, item) => {
    const vendorId = item.vendor?.id || 'unknown';
    const vendorName = item.vendor?.name || 'Unknown Vendor';

    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendorId,
        vendorName,
        items: [],
        merchantDashboardUrl: item.vendor?.merchant_dashboard_url || null,
        vendorOrderId: item.vendor_order_id,
        vendorReference: item.vendor_reference_number,
        vendorOrderStatus: item.vendor_order_status || 'pending',
        trackingCodes: item.tracking_codes || [],
        vendorPaidAt: null,
        allItemsPaidWithVendor: false,
      };
    }

    acc[vendorId].items.push(item);

    return acc;
  }, {});

  // Merge tracking from all line items (same vendor_order_id may duplicate rows)
  Object.keys(itemsByVendor).forEach((vid) => {
    const group = itemsByVendor[vid];
    const seen = new Set();
    const merged = [];
    for (const it of group.items) {
      for (const t of parseTrackingCodes(it.tracking_codes)) {
        const key = String(getTrackingCode(t) || "");
        if (key && !seen.has(key)) {
          seen.add(key);
          merged.push(t);
        }
      }
    }
    if (merged.length) group.trackingCodes = merged;
  });

  // Compute paid-with-vendor per group (all items in group must have vendor_paid_at)
  Object.keys(itemsByVendor).forEach((vid) => {
    const group = itemsByVendor[vid];
    const paidDates = group.items.map((i) => i.vendor_paid_at).filter(Boolean);
    group.allItemsPaidWithVendor = paidDates.length === group.items.length && group.items.length > 0;
    group.vendorPaidAt = paidDates.length > 0 ? paidDates.sort().pop() : null;
  });

  // Vendor color palette (consistent colors per vendor)
  const vendorColors = [
    { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
    { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
    { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
    { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' },
  ];

  // Get consistent color for vendor
  const getVendorColor = (vendorId) => {
    const hash = vendorId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return vendorColors[hash % vendorColors.length];
  };

  // Vendor order status configuration
  const statusConfig = {
    placed: {
      label: 'Placed with Vendor',
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'bg-green-100 text-green-800 border-green-300'
    },
    pending: {
      label: 'Pending Placement',
      icon: <Clock className="w-4 h-4" />,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    },
    failed: {
      label: 'Placement Failed',
      icon: <XCircle className="w-4 h-4" />,
      color: 'bg-red-100 text-red-800 border-red-300'
    }
  };

  return (
    <div className="space-y-6">
      {Object.values(itemsByVendor).map((vendorGroup, vendorIndex) => {
        const vendorColor = getVendorColor(vendorGroup.vendorId);
        const statusInfo = statusConfig[vendorGroup.vendorOrderStatus] || statusConfig.pending;

        return (
          <Card key={vendorGroup.vendorId} className={`border-2 ${vendorColor.border}`}>
            <CardHeader className={`border-b ${vendorColor.border}`}>
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    <Package className={`w-5 h-5 ${vendorColor.text}`} />
                    <span className={vendorColor.text}>{vendorGroup.vendorName}</span>
                    <Badge variant="outline" className={`${vendorColor.bg} ${vendorColor.text} border-current`}>
                      {vendorGroup.items.length} {vendorGroup.items.length === 1 ? 'item' : 'items'}
                    </Badge>
                  </CardTitle>

                  {/* Vendor Order Status */}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Badge className={`${statusInfo.color} border flex items-center gap-1.5 px-3 py-1`}>
                      {statusInfo.icon}
                      {statusInfo.label}
                    </Badge>

                    {/* Paid with vendor (for reference) */}
                    {vendorGroup.allItemsPaidWithVendor && vendorGroup.vendorPaidAt && (
                      <span className="inline-flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 border flex items-center gap-1.5 px-3 py-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Paid with vendor
                          <span className="text-xs opacity-90">
                            {new Date(vendorGroup.vendorPaidAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </Badge>
                        {onUnmarkVendorPaid && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                            onClick={() => onUnmarkVendorPaid(orderId, vendorGroup.vendorId)}
                          >
                            Undo
                          </Button>
                        )}
                      </span>
                    )}

                    {/* Vendor Order IDs */}
                    {vendorGroup.vendorOrderId && (
                      <div className="text-xs space-y-0.5">
                        <div className={`${vendorColor.text} font-medium`}>
                          Vendor Order ID: <span className="font-mono">{vendorGroup.vendorOrderId}</span>
                        </div>
                        {vendorGroup.vendorReference && (
                          <div className="text-gray-600">
                            Reference: <span className="font-mono">{vendorGroup.vendorReference}</span>
                          </div>
                        )}
                        {vendorGroup.trackingCodes?.length > 0 &&
                          vendorGroup.trackingCodes.map((t, tIdx) => {
                            const code = getTrackingCode(t);
                            if (!code) return null;
                            const carrier = getTrackingCarrier(t);
                            return (
                              <div key={tIdx} className="text-gray-600">
                                Tracking ID{carrier ? ` (${carrier})` : ""}:{" "}
                                <span className="font-mono font-medium text-gray-800">{code}</span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Tracking + carrier timelines */}
                  {vendorGroup.trackingCodes && vendorGroup.trackingCodes.length > 0 && (
                    <div className="mt-3 space-y-3">
                      <div className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        Tracking &amp; shipment timeline
                      </div>
                      {vendorGroup.trackingCodes.map((tracking, idx) => {
                        const code = getTrackingCode(tracking);
                        if (!code) return null;
                        const carrier = getTrackingCarrier(tracking) || "";
                        const url = getTrackingUrl(tracking);
                        const inner = (
                          <>
                            <span className="font-semibold text-gray-700">
                              {carrier || "Tracking"}:
                            </span>
                            <span className="font-mono text-blue-600">{code}</span>
                            {url ? <ExternalLink className="w-3 h-3 text-gray-400" /> : null}
                          </>
                        );
                        return (
                          <div
                            key={`${code}-${idx}`}
                            className="rounded-lg border border-gray-200 bg-white/80 p-3 shadow-sm"
                          >
                            <div className="flex flex-wrap gap-2">
                              {url ? (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs hover:bg-gray-100 transition-colors"
                                >
                                  {inner}
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs">
                                  {inner}
                                </span>
                              )}
                            </div>
                            <CarrierShipmentTimeline trackingNumber={code} carrierName={carrier} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  {vendorGroup.merchantDashboardUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="border-gray-400 text-gray-700 hover:bg-gray-50"
                    >
                      <a
                        href={vendorGroup.merchantDashboardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Merchant dashboard
                      </a>
                    </Button>
                  )}
                  {vendorGroup.vendorOrderStatus === 'failed' && onRetry && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRetry(orderId, vendorGroup.vendorId)}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Retry Order
                    </Button>
                  )}

                  {vendorGroup.vendorOrderStatus === 'placed' && onSyncTracking && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSyncTracking(orderId)}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Truck className="w-3.5 h-3.5 mr-1.5" />
                      Sync Tracking
                    </Button>
                  )}

                  {!vendorGroup.allItemsPaidWithVendor && onMarkVendorPaid && (vendorGroup.vendorOrderStatus === 'placed' || vendorGroup.vendorOrderId) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMarkVendorPaid(orderId, vendorGroup.vendorId)}
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                      Mark as paid
                    </Button>
                  )}

                  {vendorGroup.vendorOrderStatus === 'pending' && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Awaiting placement
                      </div>
                      {paymentStatus === "paid" &&
                        orderCreatedAt &&
                        Date.now() - new Date(orderCreatedAt).getTime() > TWO_MINUTES_MS &&
                        onRetry && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onRetry(orderId, vendorGroup.vendorId)}
                            className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                          >
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                            Retry
                          </Button>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              {/* Items Grid */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {vendorGroup.items.map((item, i) => (
                  <Link
                    key={item.id || i}
                    href={`https://www.aayeu.com${item.product_link || ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="p-4 border border-gray-200 rounded-xl bg-white hover:shadow-lg transition-all flex flex-col gap-4 h-full">
                      {/* Product Images */}
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative h-48 w-48 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-200 overflow-hidden">
                          <Image
                            src={
                              selectedImageByItem[item.id] ||
                              item.product?.product_img ||
                              "/placeholder-product.png"
                            }
                            alt={item.product?.name || "Product"}
                            fill
                            className="object-contain"
                          />
                        </div>

                        {/* Variant images */}
                        {item.variant?.images && item.variant.images.length > 0 && (
                          <div className="flex gap-2 w-full overflow-x-auto justify-center">
                            {item.variant.images.map((picture, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedImageByItem((prev) => ({
                                    ...prev,
                                    [item.id]: picture,
                                  }));
                                }}
                                className={`rounded-lg border-2 flex-shrink-0 ${
                                  (selectedImageByItem[item.id] ||
                                    item.product?.product_img) === picture
                                    ? `border-amber-500`
                                    : "border-transparent"
                                }`}
                              >
                                <div className="h-12 w-12 flex items-center justify-center bg-white rounded-lg border border-gray-200 overflow-hidden">
                                  <Image
                                    src={picture}
                                    alt={item.product?.name || "Variant"}
                                    width={48}
                                    height={48}
                                    className="object-contain"
                                  />
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="space-y-2 text-sm flex-1">
                        <h4 className="font-bold text-base text-gray-900 text-center line-clamp-2">
                          {item.product?.name || "N/A"}
                        </h4>

                        <div className="grid gap-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="font-semibold">{item.qty || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">SKU:</span>
                            <span className="font-mono text-xs">{item.variant?.sku || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Stock:</span>
                            <span className={item.variant?.stock > 0 ? 'text-green-600 font-medium' : 'text-red-600'}>
                              {item.variant?.stock ?? "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-1.5">
                            <span className="text-gray-600">Price:</span>
                            <span className="font-bold text-gray-900">
                              {item.price != null ? formatItemPrice(item.price) : "N/A"}
                            </span>
                          </div>
                          {item.variant?.vendorsaleprice && (
                            <div className="flex justify-between text-gray-500">
                              <span>Vendor Price:</span>
                              <span>€{item.variant.vendorsaleprice}</span>
                            </div>
                          )}
                        </div>

                        {/* Item-specific vendor order status (if different from group) */}
                        {item.vendor_order_status && item.vendor_order_status !== vendorGroup.vendorOrderStatus && (
                          <div className="mt-2 pt-2 border-t">
                            <Badge className={`${statusConfig[item.vendor_order_status]?.color || 'bg-gray-100 text-gray-800'} text-xs`}>
                              Item: {statusConfig[item.vendor_order_status]?.label || item.vendor_order_status}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
