# Admin Dashboard - Vendor Order Integration Guide

## 🎯 **New Features to Add**

Your backend now supports **multi-vendor order placement** with automatic order placement to vendors like Luxury Distribution. Here's what you need to update in the admin dashboard:

---

## 📊 **1. Orders Page Enhancements**

**File:** `src/app/dashboard/orders/page.js`

### **A. Add Vendor Order Status Column**

Add a new column to show vendor placement status for each order item:

```jsx
// In the order details table, add:
<TableCell>
  <VendorOrderStatus
    status={item.vendor_order_status}
    vendorOrderId={item.vendor_order_id}
    vendorReference={item.vendor_reference_number}
  />
</TableCell>
```

**Component to create:**

```jsx
// src/components/_ui/VendorOrderStatus.jsx
const VendorOrderStatus = ({ status, vendorOrderId, vendorReference }) => {
  const statusConfig = {
    placed: {
      label: 'Placed with Vendor',
      color: 'bg-green-100 text-green-800',
      icon: '✅'
    },
    pending: {
      label: 'Pending Placement',
      color: 'bg-yellow-100 text-yellow-800',
      icon: '⏳'
    },
    failed: {
      label: 'Placement Failed',
      color: 'bg-red-100 text-red-800',
      icon: '❌'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <div className="space-y-1">
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        {config.icon} {config.label}
      </span>
      {vendorOrderId && (
        <div className="text-xs text-gray-500">
          Vendor Order: {vendorOrderId}
        </div>
      )}
      {vendorReference && (
        <div className="text-xs text-gray-400">
          Ref: {vendorReference}
        </div>
      )}
    </div>
  );
};
```

### **B. Add Tracking Codes Display**

Show tracking information when available:

```jsx
// src/components/_ui/TrackingCodes.jsx
const TrackingCodes = ({ trackingCodes }) => {
  if (!trackingCodes || trackingCodes.length === 0) {
    return <span className="text-gray-400 text-sm">No tracking yet</span>;
  }

  return (
    <div className="space-y-2">
      {trackingCodes.map((tracking, idx) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          <span className="font-medium">{tracking.carrier}:</span>
          <a
            href={tracking.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {tracking.code}
          </a>
        </div>
      ))}
    </div>
  );
};
```

### **C. Add Retry Button for Failed Orders**

```jsx
// Add retry button for failed vendor orders
const RetryVendorOrder = ({ orderId, onSuccess }) => {
  const { request, loading } = useAxios();

  const handleRetry = async () => {
    const { data, error } = await request({
      method: 'POST',
      url: `/admin/vendor-orders/${orderId}/retry`,
      authRequired: true
    });

    if (error) {
      showToast('error', 'Retry failed: ' + error.message);
    } else {
      showToast('success', 'Vendor order retry initiated');
      onSuccess?.();
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleRetry}
      disabled={loading}
    >
      {loading ? <Loader2 className="animate-spin" /> : 'Retry Vendor Order'}
    </Button>
  );
};
```

### **D. Sync Tracking Button**

```jsx
const SyncTrackingButton = ({ orderId, onSuccess }) => {
  const { request, loading } = useAxios();

  const handleSync = async () => {
    const { data, error } = await request({
      method: 'POST',
      url: `/admin/vendor-orders/${orderId}/sync-tracking`,
      authRequired: true
    });

    if (error) {
      showToast('error', 'Tracking sync failed');
    } else {
      showToast('success', `Updated tracking for ${data.result.trackingResults.length} shipments`);
      onSuccess?.();
    }
  };

  return (
    <Button
      size="sm"
      onClick={handleSync}
      disabled={loading}
    >
      {loading ? <Loader2 className="animate-spin" /> : '🔄 Sync Tracking'}
    </Button>
  );
};
```

---

## 📋 **2. New Page: Vendor Orders Management**

**Create:** `src/app/dashboard/vendor-orders/page.jsx`

This page shows all vendor orders with their placement status:

```jsx
"use client";

import React, { useEffect, useState } from "react";
import useAxios from "@/hooks/useAxios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const VendorOrdersPage = () => {
  const { request, loading } = useAxios();
  const [failedOrders, setFailedOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);

  useEffect(() => {
    fetchFailedOrders();
    fetchPendingOrders();
  }, []);

  const fetchFailedOrders = async () => {
    const { data } = await request({
      method: 'GET',
      url: '/admin/vendor-orders/failed',
      authRequired: true
    });
    setFailedOrders(data?.failedOrders || []);
  };

  const fetchPendingOrders = async () => {
    const { data } = await request({
      method: 'GET',
      url: '/admin/vendor-orders/pending',
      authRequired: true
    });
    setPendingOrders(data?.pendingOrders || []);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Vendor Order Management</h1>

      <Tabs defaultValue="failed">
        <TabsList>
          <TabsTrigger value="failed">
            Failed Orders ({failedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending Orders ({pendingOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="failed">
          <Card>
            <CardHeader>
              <CardTitle>Failed Vendor Orders - Needs Attention</CardTitle>
            </CardHeader>
            <CardContent>
              {failedOrders.map(order => (
                <div key={order.order_id} className="border-b pb-4 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{order.order_no}</h3>
                      <p className="text-sm text-gray-600">
                        Vendor: {order.vendor_name} | Customer: {order.customer_email}
                      </p>
                      <p className="text-sm">
                        {order.failed_items} failed items
                      </p>
                    </div>
                    <RetryVendorOrder
                      orderId={order.order_id}
                      onSuccess={fetchFailedOrders}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Vendor Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingOrders.map(order => (
                <div key={order.order_id} className="border-b pb-4 mb-4">
                  <h3 className="font-semibold">{order.order_no}</h3>
                  <p className="text-sm text-gray-600">
                    Vendor: {order.vendor_name} ({order.integration_type})
                  </p>
                  <p className="text-sm">
                    {order.pending_items} items waiting
                  </p>
                  {order.has_api === 'true' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleManualPlace(order.order_id)}
                    >
                      Place Order Manually
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorOrdersPage;
```

---

## 🏪 **3. Vendors Page Enhancements**

**File:** `src/app/dashboard/vendors/page.jsx` (or create if doesn't exist)

Show vendor integration capabilities:

```jsx
const VendorCard = ({ vendor }) => {
  const capabilities = vendor.capabilities || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between">
          {vendor.name}
          <Badge variant={vendor.status === 'active' ? 'success' : 'secondary'}>
            {vendor.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Integration:</span>
            <Badge variant="outline">{vendor.integration_type || 'manual'}</Badge>
          </div>

          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              {capabilities.has_order_placement_api ? '✅' : '❌'}
              Order Placement API
            </div>
            <div className="flex items-center gap-2">
              {capabilities.has_order_tracking_api ? '✅' : '❌'}
              Tracking API
            </div>
            <div className="flex items-center gap-2">
              {capabilities.order_placement_type === 'atomic' ? '⚛️' : '📦'}
              {capabilities.order_placement_type || 'manual'} placement
            </div>
          </div>

          {capabilities.stock_management && (
            <p className="text-xs text-gray-500 mt-2">
              Stock: {capabilities.stock_management}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## 🔧 **4. API Endpoints to Use**

### **Vendor Orders:**
- `GET /admin/vendor-orders/summary` - All orders summary
- `GET /admin/vendor-orders/failed` - Failed orders
- `GET /admin/vendor-orders/pending` - Pending orders
- `GET /admin/vendor-orders/:orderId/details` - Order details
- `POST /admin/vendor-orders/:orderId/retry` - Retry failed order
- `POST /admin/vendor-orders/:orderId/sync-tracking` - Sync tracking
- `POST /admin/vendor-orders/:orderId/place` - Manual placement

### **Updated Order Response:**
```json
{
  "order_items": [
    {
      "id": "uuid",
      "product_name": "Gucci Bag",
      "qty": 1,
      "vendor_order_status": "placed",  // ← NEW
      "vendor_order_id": "1203",        // ← NEW
      "vendor_reference_number": "16000124545",  // ← NEW
      "tracking_codes": [  // ← NEW
        {
          "code": "DHL123456789",
          "carrier": "DHL",
          "url": "https://dhl.com/track?id=..."
        }
      ]
    }
  ]
}
```

---

## 🎨 **5. Dashboard Widgets**

Add to main dashboard (`src/app/dashboard/page.js`):

```jsx
// Add to stats cards
const VendorOrderStats = () => {
  const [stats, setStats] = useState({
    failedOrders: 0,
    pendingOrders: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [failed, pending] = await Promise.all([
      request({ url: '/admin/vendor-orders/failed', authRequired: true }),
      request({ url: '/admin/vendor-orders/pending', authRequired: true })
    ]);

    setStats({
      failedOrders: failed.data?.count || 0,
      pendingOrders: pending.data?.count || 0
    });
  };

  return (
    <>
      {stats.failedOrders > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">
              ⚠️ Failed Vendor Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {stats.failedOrders}
            </p>
            <Link href="/dashboard/vendor-orders">
              <Button variant="link" className="text-red-600 p-0">
                View & Retry →
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {stats.pendingOrders > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">
              ⏳ Pending Vendor Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.pendingOrders}
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
};
```

---

## 📱 **6. Navigation Updates**

Add to sidebar navigation:

```jsx
// In your sidebar component
{
  title: "Vendor Orders",
  href: "/dashboard/vendor-orders",
  icon: <Truck className="w-4 h-4" />,
  badge: failedOrdersCount > 0 ? failedOrdersCount : null
}
```

---

## ✅ **Implementation Checklist**

- [ ] Update Orders page to show vendor order status
- [ ] Add vendor order status badges component
- [ ] Add tracking codes display component
- [ ] Add retry button for failed orders
- [ ] Add sync tracking button
- [ ] Create Vendor Orders management page
- [ ] Update Vendors page to show capabilities
- [ ] Add dashboard widgets for failed/pending orders
- [ ] Update navigation to include Vendor Orders
- [ ] Test all API endpoints
- [ ] Add loading states and error handling

---

## 🎯 **Priority Order**

1. **High Priority:**
   - Add vendor order status to existing Orders page
   - Add retry button for failed orders
   - Create Vendor Orders management page

2. **Medium Priority:**
   - Add tracking display and sync button
   - Update Vendors page with capabilities
   - Add dashboard widgets

3. **Low Priority:**
   - Advanced filtering by vendor order status
   - Bulk retry operations
   - Analytics for vendor performance

---

## 📞 **Need Help?**

All backend APIs are ready and documented. Check:
- Backend docs: `aayeu-backend/docs/VENDOR_ORDER_PLACEMENT_COMPLETE.md`
- Quick reference: `aayeu-backend/docs/QUICK_START_VENDOR_ORDERS.md`

**Test the APIs first** using curl/Postman before building the UI!
