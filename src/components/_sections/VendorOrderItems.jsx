"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Truck,
  AlertCircle,
  RefreshCw
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
export default function VendorOrderItems({
  items = [],
  orderId,
  onRetry,
  onSyncTracking
}) {
  const [selectedImageByItem, setSelectedImageByItem] = useState({});

  // Group items by vendor
  const itemsByVendor = items.reduce((acc, item) => {
    const vendorId = item.vendor?.id || 'unknown';
    const vendorName = item.vendor?.name || 'Unknown Vendor';

    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendorId,
        vendorName,
        items: [],
        // Aggregate vendor order info (items from same vendor share same vendor_order_id)
        vendorOrderId: item.vendor_order_id,
        vendorReference: item.vendor_reference_number,
        vendorOrderStatus: item.vendor_order_status || 'pending',
        trackingCodes: item.tracking_codes || []
      };
    }

    acc[vendorId].items.push(item);

    return acc;
  }, {});

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
                      </div>
                    )}
                  </div>

                  {/* Tracking Codes */}
                  {vendorGroup.trackingCodes && vendorGroup.trackingCodes.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <div className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        Tracking Information:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {vendorGroup.trackingCodes.map((tracking, idx) => (
                          <a
                            key={idx}
                            href={tracking.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-300 rounded-md text-xs hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-semibold text-gray-700">{tracking.carrier}:</span>
                            <span className="font-mono text-blue-600">{tracking.code}</span>
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
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

                  {vendorGroup.vendorOrderStatus === 'pending' && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Awaiting placement
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
                              {item.price ? `€${item.price}` : "N/A"}
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
