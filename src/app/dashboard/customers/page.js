"use client";

import React, { useEffect, useMemo, useState } from "react";
import ViewCustomerModal from "@/components/_dialogs/ViewCustomer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import useAxios from "@/hooks/useAxios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/_ui/toast-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "lucide-react";

const PAGE_SIZE = 10;

export default function CustomerPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { request } = useAxios();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // 🔹 Fetch customers
  const getCustomers = async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = {
        page: targetPage,
        limit: PAGE_SIZE,
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const { data, error } = await request({
        method: "GET",
        url: "/admin/get-all-customers",
        authRequired: true,
        params,
      });
      if (error) throw new Error(error?.message || error);
      // if (data.success) showToast("success", data.message);

      const customerList = data?.data?.customers || [];
      setCustomers(customerList);

      // Use backend pagination response
      const pagination = data?.data?.pagination || {};

      setTotalCount(pagination.total || 0);
      setTotalPages(pagination.pages || 1);
      setHasNext(pagination.hasNext || false);
      setHasPrev(pagination.hasPrev || false);

      // Update current page from backend response
      if (pagination.page && pagination.page !== page) {
        setPage(pagination.page);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCustomers(page);
  }, [debouncedSearch, page]);

  const showingRange = useMemo(() => {
    if (totalCount === 0) return null;
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(start + customers.length - 1, totalCount);
    return { start, end };
  }, [page, customers.length, totalCount]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
  };

  const handleRefresh = () => {
    getCustomers(page);
  };

  const CustomerSkeletonCard = () => (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center">
          <User className="h-5 w-5 text-gray-400" />
        </div>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32 bg-gray-200" />
          <Skeleton className="h-3 w-48 bg-gray-200" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Skeleton className="h-3 w-full bg-gray-200" />
        <Skeleton className="h-3 w-full bg-gray-200" />
        <Skeleton className="h-3 w-full bg-gray-200" />
        <Skeleton className="h-3 w-full bg-gray-200" />
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-white text-black">
      <CustomBreadcrumb />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black">Customers</h1>
          {showingRange && (
            <p className="text-sm text-gray-600 mt-1">
              Showing {showingRange.start}-{showingRange.end} of {totalCount} customers
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full sm:w-[220px] md:w-[260px] border-gray-300 focus-visible:ring-black"
          />
          <Button
            onClick={handleRefresh}
            className="bg-black text-white hover:bg-gray-900"
          >
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <CustomerSkeletonCard key={index} />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No customers found</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map((cust) => (
              <div
                key={cust.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-black truncate">
                      {cust.full_name || "N/A"}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {cust.email || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span>{cust.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Joined</span>
                    <span>
                      {cust.created_at
                        ? new Date(cust.created_at).toLocaleDateString("en-GB")
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <Badge
                    className={
                      cust.is_active
                        ? "bg-black text-white hover:bg-gray-900"
                        : "bg-gray-200 text-black hover:bg-gray-300"
                    }
                  >
                    {cust.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    variant="outline"
                    className="border-black text-black hover:bg-black hover:text-white"
                    onClick={() => {
                      setSelectedCustomerId(cust.id);
                      setIsOpen(true);
                    }}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 0 && (
            <div className="flex justify-center gap-2 pt-2">
              <Button
                className="cursor-pointer border-black text-black hover:bg-black hover:text-white"
                variant="outline"
                disabled={!hasPrev}
                onClick={() => handlePageChange(page - 1)}
              >
                Prev
              </Button>
              <span className="px-3 py-2">
                Page {page} of {totalPages}
              </span>
              <Button
                className="cursor-pointer border-black text-black hover:bg-black hover:text-white"
                variant="outline"
                disabled={!hasNext}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      <ViewCustomerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        customerId={selectedCustomerId}
      />
    </div>
  );
}
