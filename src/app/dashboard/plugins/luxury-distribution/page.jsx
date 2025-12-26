"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, Package, AlertCircle, CheckCircle } from "lucide-react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/_ui/spinner";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";

const PAGE_SIZE = 20;

export default function LuxuryDistributionPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const { request } = useAxios();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Sync configuration
  const [currency, setCurrency] = useState("EUR");
  const [conversionRate, setConversionRate] = useState("4.05");
  const [incrementPercent, setIncrementPercent] = useState("20");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Fetch Luxury Distribution products
  const fetchProducts = async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = {
        page: targetPage,
        limit: PAGE_SIZE,
        vendor_id: "65053474-4e40-44ee-941c-ef5253ea9fc9", // Luxury Distribution vendor ID
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const { data, error } = await request({
        method: "GET",
        url: "/admin/get-products",
        authRequired: true,
        params,
      });

      if (error) throw new Error(error?.message || error);

      const productList = data?.data?.products || [];
      setProducts(productList);

      const pagination = data?.data?.pagination || {};
      const totalItems = pagination.total ?? productList.length ?? 0;
      setTotalCount(totalItems);

      const responseLimit = pagination.limit ?? PAGE_SIZE;
      const calculatedPages = Math.max(1, Math.ceil(totalItems / responseLimit));
      setTotalPages(calculatedPages);
    } catch (err) {
      showToast("error", err.message || "Failed to fetch products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(page);
  }, [page, debouncedSearch]);

  // Handle sync
  const handleSync = async () => {
    if (!currency || !conversionRate || !incrementPercent) {
      showToast("error", "Please fill in all sync configuration fields");
      return;
    }

    setSyncing(true);
    setSyncDialogOpen(false);

    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/fetch-all-luxury-products",
        authRequired: true,
        payload: {
          currency: currency.toUpperCase(),
          conversion_rate: parseFloat(conversionRate),
          increment_percent: parseFloat(incrementPercent),
        },
      });

      if (error) throw new Error(error?.message || error);

      showToast("success", data.message || "Sync started in background. Check console logs for progress.");

      // Refresh product list after a delay
      setTimeout(() => {
        fetchProducts(page);
      }, 3000);
    } catch (err) {
      showToast("error", err.message || "Failed to start sync");
    } finally {
      setSyncing(false);
    }
  };

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Plugins", href: "#" },
    { label: "Luxury Distribution", href: "/dashboard/plugins/luxury-distribution" },
  ];

  return (
    <div className="p-6">
      <CustomBreadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="flex justify-between items-center mt-6 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Luxury Distribution</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and sync products from Luxury Distribution vendor
          </p>
        </div>
        <Button
          onClick={() => setSyncDialogOpen(true)}
          disabled={syncing}
          className="bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          {syncing ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Products
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            </div>
            <Package className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Vendor</p>
              <p className="text-lg font-semibold text-gray-900">Luxury Distribution</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">API Status</p>
              <p className="text-lg font-semibold text-green-600">Connected</p>
            </div>
            <AlertCircle className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border shadow-sm mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-12 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No products found. Click "Sync Products" to import from Luxury Distribution.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <img
                      src={product.product_img || "/placeholder.png"}
                      alt={product.name}
                      className="h-12 w-12 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-sm text-gray-500">{product.product_sku}</TableCell>
                  <TableCell className="text-sm">{product.brand_name || "-"}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {product.category_name || "Uncategorized"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "success" : "secondary"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {!loading && products.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} products
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sync Configuration Dialog */}
      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync Luxury Distribution Products</DialogTitle>
            <DialogDescription>
              Configure the sync settings for importing products from Luxury Distribution.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="EUR"
              />
              <p className="text-xs text-gray-500">Vendor's currency (e.g., EUR, USD)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversionRate">Conversion Rate to AED</Label>
              <Input
                id="conversionRate"
                type="number"
                step="0.01"
                value={conversionRate}
                onChange={(e) => setConversionRate(e.target.value)}
                placeholder="4.05"
              />
              <p className="text-xs text-gray-500">Exchange rate from {currency} to AED</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="incrementPercent">Markup Percentage</Label>
              <Input
                id="incrementPercent"
                type="number"
                step="0.1"
                value={incrementPercent}
                onChange={(e) => setIncrementPercent(e.target.value)}
                placeholder="20"
              />
              <p className="text-xs text-gray-500">Percentage markup to add to prices</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> The sync process will run in the background.
                Check the server console logs for detailed progress.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSyncDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSync}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Start Sync
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
