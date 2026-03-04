"use client";
import React from "react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";

const ReportPage = () => {
  const reports = [
    {
      id: 1,
      title: "Monthly Sales",
      period: "September 2025",
      totalOrders: 1340,
      totalRevenue: "₹12,45,600",
      topProduct: "Organic Apples",
      growth: "+8.6%",
    },
    {
      id: 2,
      title: "Customer Growth",
      period: "Q3 2025",
      totalCustomers: 820,
      newCustomers: 230,
      churnRate: "3.2%",
      growth: "+12.4%",
    },
    {
      id: 3,
      title: "Vendor Performance",
      period: "September 2025",
      activeVendors: 28,
      inactiveVendors: 5,
      totalProducts: 4500,
      averageRating: "4.6 / 5",
    },
  ];

  return (
    <div className="p-6">
      <CustomBreadcrumb />
      <h2 className="text-2xl font-semibold text-gray-800 mb-5 mt-3 flex items-center gap-2">
        📈 Reports & Analytics
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div
            key={report.id}
            className="p-5 bg-white rounded-xl shadow border hover:shadow-md transition-all"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {report.title}
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Period: {report.period}
            </p>

            {report.totalRevenue && (
              <p className="text-sm mb-1">
                <b>Total Revenue:</b> {report.totalRevenue}
              </p>
            )}
            {report.totalOrders && (
              <p className="text-sm mb-1">
                <b>Total Orders:</b> {report.totalOrders}
              </p>
            )}
            {report.totalCustomers && (
              <p className="text-sm mb-1">
                <b>Total Customers:</b> {report.totalCustomers}
              </p>
            )}
            {report.newCustomers && (
              <p className="text-sm mb-1">
                <b>New Customers:</b> {report.newCustomers}
              </p>
            )}
            {report.activeVendors && (
              <p className="text-sm mb-1">
                <b>Active Vendors:</b> {report.activeVendors}
              </p>
            )}
            {report.inactiveVendors && (
              <p className="text-sm mb-1">
                <b>Inactive Vendors:</b> {report.inactiveVendors}
              </p>
            )}
            {report.totalProducts && (
              <p className="text-sm mb-1">
                <b>Total Products:</b> {report.totalProducts}
              </p>
            )}
            {report.topProduct && (
              <p className="text-sm mb-1">
                <b>Top Product:</b> {report.topProduct}
              </p>
            )}
            {report.averageRating && (
              <p className="text-sm mb-1">
                <b>Avg Rating:</b> {report.averageRating}
              </p>
            )}
            {report.growth && (
              <p className="text-sm text-green-700 mt-2">
                📊 Growth: {report.growth}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportPage;
