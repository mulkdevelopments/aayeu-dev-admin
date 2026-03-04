"use client";
import React from "react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";

const UserPage = () => {
  const users = [
    {
      id: 1,
      name: "admin",
      email: "admin@gmail.com",
      role: "Admin",
      status: "Active",
      lastLogin: "23 Feb 2026, 10:45 AM",
      phone: "7012975494",
    },
    {
      id: 2,
      name: "Neha Sharma",
      email: "neha@freshmart.in",
      role: "Vendor",
      status: "Active",
      lastLogin: "21 Oct 2025, 5:30 PM",
      phone: "+91 90909 12121",
    },
    {
      id: 3,
      name: "Rahul Mehta",
      email: "rahul@gmail.com",
      role: "Customer",
      status: "Inactive",
      lastLogin: "15 Oct 2025, 1:20 PM",
      phone: "+91 87654 55544",
    },
    {
      id: 4,
      name: "Riya Verma",
      email: "riya@support.com",
      role: "Support",
      status: "Active",
      lastLogin: "22 Oct 2025, 9:00 AM",
      phone: "+91 70123 99887",
    },
  ];

  return (
    <div className="p-6">
      <CustomBreadcrumb />
      <h2 className="text-2xl font-semibold text-gray-800 mb-5 mt-3 flex items-center gap-2">
        👨‍💼 User Management
      </h2>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border">
        <table className="min-w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-100 text-gray-800 uppercase text-sm">
            <tr>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Last Login</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b hover:bg-gray-50 transition-all duration-200"
              >
                <td className="py-3 px-4 font-semibold text-gray-900">
                  {user.name}
                </td>
                <td className="py-3 px-4">{user.email}</td>
                <td className="py-3 px-4">{user.phone}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-md text-white text-xs font-medium ${
                      user.role === "Admin"
                        ? "bg-purple-600"
                        : user.role === "Vendor"
                        ? "bg-blue-600"
                        : user.role === "Support"
                        ? "bg-indigo-600"
                        : "bg-green-600"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4">{user.lastLogin}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-md text-white text-xs font-medium ${
                      user.status === "Active"
                        ? "bg-green-600"
                        : "bg-red-600"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserPage;
