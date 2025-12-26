"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MoreHorizontal } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";
import ViewVendorModel from "@/components/_dialogs/ViewVendorModel";

const PAGE_SIZE = 10;

export default function VendorPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const { request } = useAxios();
   const [isOpen, setIsOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // 🔹 Fetch all vendors from API
  const fetchVendors = async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = {
        page: targetPage,
        limit: PAGE_SIZE,
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const { data, error } = await request({
        method: "GET",
        url: "/admin/get-vendor-list",
        authRequired: true,
        params,
      });
      if (error) throw new Error(error?.message || error);
      // if (data.success) showToast("success", data.message);

      const vendorList = data?.data?.vendors || [];
      setVendors(vendorList);

      const pagination = data?.data?.pagination || data?.data?.meta || {};

      const totalItems =
        pagination.total ??
        pagination.totalItems ??
        pagination.total_items ??
        pagination.totalCount ??
        pagination.count ??
        data?.data?.total ??
        data?.data?.totalCount ??
        data?.data?.total_items ??
        vendorList.length ??
        0;
      setTotalCount(totalItems);

      const responseLimit =
        pagination.limit ??
        pagination.perPage ??
        pagination.per_page ??
        pagination.pageSize ??
        pagination.page_size ??
        PAGE_SIZE;

      setPageSize(responseLimit || PAGE_SIZE);

      const calculatedTotalPages =
        totalItems > 0 ? Math.ceil(totalItems / responseLimit) : 1;
      setTotalPages(calculatedTotalPages || 1);

      const currentPageFromApi =
        pagination.page ?? pagination.currentPage ?? pagination.current_page;

      if (
        currentPageFromApi &&
        currentPageFromApi > 0 &&
        currentPageFromApi !== page
      ) {
        setPage(currentPageFromApi);
      }
    } catch (err) {
      console.error("Error fetching vendors:", err.message);
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors(page);
  }, [debouncedSearch, statusFilter, page]);

  const showingRange = useMemo(() => {
    if (totalCount === 0) return null;
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(start + vendors.length - 1, totalCount);
    return { start, end };
  }, [page, vendors.length, totalCount, pageSize]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
  };

  const handleRefresh = () => {
    fetchVendors(page);
  };

  // 🔄 Update vendor status
  const updateVendorStatus = async (vendorId, newStatus) => {
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
        // Refresh the vendor list
        fetchVendors(page);
      }
    } catch (err) {
      console.error("Error updating vendor status:", err.message);
      showToast("error", err.message || "Failed to update vendor status");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            🏬 Vendor Management
          </h1>
          {showingRange && (
            <p className="text-sm text-muted-foreground mt-1">
              Showing {showingRange.start}-{showingRange.end} of {totalCount} vendors
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full sm:w-[220px] md:w-[260px]"
          />
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh}>Refresh</Button>
        </div>
      </div>

      {loading ? (
        <div className="overflow-x-auto border text-center rounded-xl bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="text-center w-[220px]">Vendor Name</TableHead>
                <TableHead className="text-center w-[220px]">Email</TableHead>
                <TableHead className="text-center w-[220px]">Created At</TableHead>
                <TableHead className="text-center w-[220px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(PAGE_SIZE)].map((_, idx) => (
                <TableRow key={idx} className="hover:bg-gray-50 transition-all">
                  <TableCell>
                    <Skeleton className="mx-auto h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="mx-auto h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="mx-auto h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Skeleton className="h-6 w-16 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : vendors.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No vendors found</p>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border text-center rounded-xl bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="text-center w-[220px]">Vendor Name</TableHead>
                  <TableHead className="text-center w-[220px]">Email</TableHead>
                  {/* <TableHead>Slug</TableHead> */}
                  <TableHead className="text-center w-[220px]">Created At</TableHead>
                  <TableHead className="text-center w-[220px]">Status</TableHead>
                  {/* <TableHead className="w-[120px] text-right">Actions</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => {
                  const status =
                    vendor.status === "active" ? "Active" : "Inactive";
                  return (
                    <TableRow key={vendor.id} className="hover:bg-gray-50 transition-all">
                      <TableCell className="font-medium text-center text-gray-900">
                        {vendor.name}
                      </TableCell>
                      <TableCell>{vendor.contact_email || "N/A"}</TableCell>
                      {/* <TableCell>{vendor.slug || "—"}</TableCell> */}
                      <TableCell>
                        {vendor.created_at
                          ? new Date(vendor.created_at).toLocaleDateString("en-GB")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Badge
                            className={
                              status === "Active"
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-red-600 hover:bg-red-700"
                            }
                          >
                            {status}
                          </Badge>

                          {/* 3-dot Dropdown Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  if (status !== "Active") {
                                    updateVendorStatus(vendor.id, "active");
                                  }
                                }}
                                className={
                                  status === "Active"
                                    ? "font-bold bg-accent"
                                    : ""
                                }
                              >
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-green-600"></span>
                                  Active
                                </span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (status !== "Inactive") {
                                    updateVendorStatus(vendor.id, "inactive");
                                  }
                                }}
                                className={
                                  status === "Inactive"
                                    ? "font-bold bg-accent"
                                    : ""
                                }
                              >
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                                  Inactive
                                </span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                      {/* <TableCell className="text-right">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsOpen(true);
                            setSelectedVendor(vendor.id);
                          }}
                        >
                          View
                        </Button>
                      </TableCell> */}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {totalPages > 0 && (
            <div className="flex justify-center gap-2 pt-2 cursor-pointer">
              <Button
                className="cursor-pointer"
                variant="outline"
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Prev
              </Button>
              <span className="px-3 py-2">
                Page {page} of {totalPages}
              </span>
              <Button
                className="cursor-pointer"
                variant="outline"
                disabled={page === totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

   <ViewVendorModel
    isOpen={isOpen} 
    setIsOpen={setIsOpen} 
    vendorId={selectedVendor}
    />

    </div>
  );
}
