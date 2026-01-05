"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import useAxios from "@/hooks/useAxios";
import { Spinner } from "@/components/_ui/spinner";
import { showToast } from "@/components/_ui/toast-utils";
import { Globe, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const currencyDetails = {
  EUR: { name: "Euro", symbol: "€" },
  AED: { name: "UAE Dirham", symbol: "د.إ" },
  INR: { name: "Indian Rupee", symbol: "₹" },
  PKR: { name: "Pakistani Rupee", symbol: "₨" },
};

export default function CountriesPage() {
  const [rates, setRates] = useState({});
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const { request } = useAxios();

  const fetchCurrencyRates = async () => {
    setLoading(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/currency/rates",
        authRequired: false,
      });

      if (error) throw new Error(error?.message || error);

      const responseData = data?.data || {};
      setRates(responseData.rates || {});
      setUpdatedAt(responseData.updated_at || null);
    } catch (err) {
      console.error("Error fetching currency rates:", err);
      showToast("error", err.message || "Failed to fetch currency rates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencyRates();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Countries & Currency", href: "/dashboard/countries" },
  ];

  return (
    <div className="space-y-6">
      <CustomBreadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <Globe className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Currency Exchange Rates
            </h1>
            <p className="text-sm text-gray-600">
              Base Currency: Euro (EUR)
            </p>
          </div>
        </div>
        <Button
          onClick={fetchCurrencyRates}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Last Updated Info */}
      {updatedAt && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Last Updated:</strong> {formatDate(updatedAt)}
          </p>
        </div>
      )}

      {/* Currency Rates Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Currency Code</TableHead>
                <TableHead>Currency Name</TableHead>
                <TableHead className="w-[100px] text-center">Symbol</TableHead>
                <TableHead className="w-[200px] text-right">
                  Exchange Rate (from EUR)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.keys(rates).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    <p className="text-gray-500">No currency rates available</p>
                  </TableCell>
                </TableRow>
              ) : (
                Object.entries(rates).map(([code, rate]) => {
                  const details = currencyDetails[code] || {
                    name: code,
                    symbol: code,
                  };
                  return (
                    <TableRow key={code}>
                      <TableCell className="font-semibold">{code}</TableCell>
                      <TableCell>{details.name}</TableCell>
                      <TableCell className="text-center text-lg">
                        {details.symbol}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(rate).toFixed(4)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>


    </div>
  );
}
