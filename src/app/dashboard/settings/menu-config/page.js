import React from "react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Home, Users, Box, BarChart2 } from "lucide-react";

const PageMenuConfig = () => {
  const menuItems = [
    {
      id: 1,
      name: "Dashboard",
      route: "/dashboard",
      icon: <Home size={18} />,
      roles: ["Admin", "SuperAdmin"],
      status: "Active",
      createdAt: "2025-10-20",
      submenus: ["Overview", "Stats", "Widgets"],
    },
    {
      id: 2,
      name: "Users",
      route: "/dashboard/users",
      icon: <Users size={18} />,
      roles: ["Admin"],
      status: "Active",
      createdAt: "2025-10-18",
      submenus: ["Customers", "Vendors"],
    },
    {
      id: 3,
      name: "Orders",
      route: "/dashboard/orders",
      icon: <Box size={18} />,
      roles: ["Admin", "Manager"],
      status: "Inactive",
      createdAt: "2025-10-15",
      submenus: ["Pending", "Processing", "Delivered"],
    },
    {
      id: 4,
      name: "Reports",
      route: "/dashboard/reports",
      icon: <BarChart2 size={18} />,
      roles: ["Admin", "SuperAdmin", "Manager"],
      status: "Active",
      createdAt: "2025-10-10",
      submenus: ["Sales Report", "User Report", "Inventory"],
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb />
      <h2 className="text-2xl font-bold">Menu Configuration</h2>

      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Icon</th>
              <th className="px-4 py-2">Menu Name</th>
              <th className="px-4 py-2">Route</th>
              <th className="px-4 py-2">Roles</th>
              <th className="px-4 py-2">Submenus</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Created At</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map((item, i) => (
              <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-4 py-2">{i + 1}</td>
                <td className="px-4 py-2">{item.icon}</td>
                <td className="px-4 py-2 font-medium">{item.name}</td>
                <td className="px-4 py-2 text-blue-600">{item.route}</td>
                <td className="px-4 py-2">{item.roles.join(", ")}</td>
                <td className="px-4 py-2">
                  {item.submenus.map((sub, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded mr-1 mb-1"
                    >
                      {sub}
                    </span>
                  ))}
                </td>
                <td
                  className={`px-4 py-2 font-medium ${
                    item.status === "Active" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {item.status}
                </td>
                <td className="px-4 py-2">{item.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PageMenuConfig;
