"use client";
import { X, User, Key, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import ROUTE_PATH from "@/libs/route-path";
import { useLogout } from "@/hooks/useLogout";
import useAxios from "@/hooks/useAxios";
import {
  Home,
  Users,
  ShoppingCart,
  Boxes,
  BarChart3,
  Settings,
  FolderTree,
  ChevronDown,
  ChevronRight,
  Globe,
  Plug,
} from "lucide-react";

const sidebarRoutes = [
  {
    label: "Dashboard",
    path: ROUTE_PATH.DASHBOARD.DASHBOARD,
    icon: <Home size={18} />,
  },
  {
    label: "Customers",
    path: ROUTE_PATH.DASHBOARD.CUSTOMERS,
    icon: <Users size={18} />,
  },
  {
    label: "Plugins",
    icon: <Plug size={18} />,
    isPluginMenu: true, // Dynamic submenu for vendors
  },
  {
    label: "Orders",
    path: ROUTE_PATH.DASHBOARD.ORDERS,

    icon: <ShoppingCart size={18} />,
  },
  {
    label: "Inventory",
    path: ROUTE_PATH.DASHBOARD.INVENTORIES,
    icon: <Boxes size={18} />,
  },
  {
    label: "Category Management",
    path: ROUTE_PATH.DASHBOARD.CATEGORY_MANAGEMENT,
    icon: <FolderTree size={18} />,
  },
  // {
  //   label: "Reports",
  //   path: ROUTE_PATH.DASHBOARD.REPORTS,
  //   icon: <BarChart3 size={18} />,
  // },
  // {
  //   label: "Users",
  //   path: ROUTE_PATH.DASHBOARD.USERS,
  //   icon: <Users size={18} />,
  // },
  {
    label: "Settings",
    path: ROUTE_PATH.DASHBOARD.SETTINGS,
    icon: <Settings size={18} />,
  },
  {
    label: "Countries",
    path: ROUTE_PATH.DASHBOARD.COUNTRIES,
    icon: <Globe size={18} />,
  },
  {
    label: "Import Product",
    path: ROUTE_PATH.DASHBOARD.IMPORT_PRODUCT,
    icon: <Boxes size={18} />,
  },
  {
    label: "Content & Policies",
    path: ROUTE_PATH.DASHBOARD.CONTENT_AND_POLICIES,
    icon: <ShieldCheck size={18} />,
  }
];

const user = { name: "Praveen Patel", email: "praveen@example.com" };

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalRef = useRef(null);
  const [activeRoute, setActiveRoute] = useState(pathname);
  const [expandedItems, setExpandedItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const { handleLogout } = useLogout();
  const { request } = useAxios();

  const toggleExpand = (label) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  // Fetch vendors for Plugins submenu
  useEffect(() => {
    const fetchVendors = async () => {
      setVendorsLoading(true);
      try {
        const { data, error } = await request({
          method: "GET",
          url: "/admin/get-vendor-list",
          authRequired: true,
          params: { limit: 100, status: "all" }, // Get all vendors
        });

        if (!error && data?.data?.vendors) {
          setVendors(data.data.vendors);
        }
      } catch (err) {
        console.error("Error fetching vendors:", err);
      } finally {
        setVendorsLoading(false);
      }
    };

    fetchVendors();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keep sidebar highlight in sync with URL changes (e.g., via breadcrumb or programmatic navigation)
  useEffect(() => {
    setActiveRoute(pathname);
  }, [pathname]);

  const handleUserAction = (action, route) => {
    toast.success(`${action} clicked`);
    setIsModalOpen(false);
    router.push(route);
  };




  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-transparent z-40 sm:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`border-gray-200 bg-white shadow-2xl text-black transition-all duration-300 min-h-screen flex flex-col justify-between z-50
          ${isOpen ? "fixed inset-y-0 left-0 w-64" : "hidden sm:flex sm:w-64"
          } sm:relative`}
      >
        {/* Top Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-300">
          <h1 className="font-bold text-lg text-gray-900">Admin</h1>
          <Button
            className="sm:hidden text-slate-200 bg-red-700 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 space-y-2 space-x-6 px-2 flex-1">
          {sidebarRoutes.map((item) => (
            <div key={item.path || item.label}>
              {item.isPluginMenu ? (
                // Plugins menu with dynamic vendor submenu
                <div>
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className="flex items-center justify-between w-full px-4 py-2 rounded-md text-sm font-medium transition-colors text-black hover:bg-gray-300"
                  >
                    <div className="flex items-center">
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </div>
                    {expandedItems.includes(item.label) ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>
                  {expandedItems.includes(item.label) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {vendorsLoading ? (
                        <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
                      ) : vendors.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500">No plugins available</div>
                      ) : (
                        vendors.map((vendor) => {
                          const vendorPath = `/dashboard/plugins/${vendor.id}`;
                          return (
                            <Link
                              key={vendor.id}
                              href={vendorPath}
                              onClick={(e) => {
                                e.preventDefault();
                                setActiveRoute(vendorPath);
                                onClose?.();
                                router.push(vendorPath);
                              }}
                              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeRoute === vendorPath
                                  ? "bg-yellow-600 text-white"
                                  : "text-black hover:bg-gray-300"
                              }`}
                            >
                              {vendor.name}
                            </Link>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              ) : item.subItems ? (
                // Item with sub-items (collapsible)
                <div>
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className="flex items-center justify-between w-full px-4 py-2 rounded-md text-sm font-medium transition-colors text-black hover:bg-gray-300"
                  >
                    <div className="flex items-center">
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </div>
                    {expandedItems.includes(item.label) ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>
                  {expandedItems.includes(item.label) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.path}
                          href={subItem.path}
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveRoute(subItem.path);
                            onClose?.();
                            router.push(subItem.path);
                          }}
                          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeRoute === subItem.path
                              ? "bg-yellow-600 text-white"
                              : "text-black hover:bg-gray-300"
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Regular item without sub-items
                <Link
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveRoute(item.path);
                    onClose?.();
                    router.push(item.path);
                  }}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeRoute === item.path
                      ? "bg-yellow-600 text-white"
                      : "text-black hover:bg-gray-300"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>


        {/* Mobile User Info & Actions */}
        <div className="px-4 py-4 border-t border-gray-300 relative sm:hidden">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => setIsModalOpen(!isModalOpen)}
          >
            <div className="w-8 h-8 bg-yellow-600 text-white flex items-center justify-center rounded-full mr-3">
              {user.name[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-gray-600">{user.email}</p>
            </div>
          </div>

          {isModalOpen && (
            <div
              ref={modalRef}
              className="absolute  bottom-full mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 flex flex-col gap-2"
            >
              <Button
                className="w-full justify-start bg-yellow-500 text-black hover:bg-yellow-600"
                onClick={() =>
                  handleUserAction(
                    "Profile",
                    ROUTE_PATH.DASHBOARD.ADMIN_PROFILE
                  )
                }
              >
                <User /> Profile
              </Button>

              <Button
                className="w-full justify-start bg-yellow-700 text-white hover:bg-yellow-800"
                onClick={() =>
                  handleUserAction(
                    "Reset Password",
                    ROUTE_PATH.AUTH.RESET_PASSWORD
                  )
                }
              >
                <Key size={16} className="mr-2" />
                Reset Password
              </Button>

              <Button
                className="w-full justify-start bg-yellow-900 text-white hover:bg-yellow-950"
                onClick={() =>
                  handleUserAction(
                    "Change Password",
                    ROUTE_PATH.AUTH.CHANGE_PASSWORD
                  )
                }
              >
                <Key size={16} className="mr-2" />
                Change Password
              </Button>

              <Button
                className="w-full justify-start bg-yellow-300 text-black hover:bg-yellow-400"
                onClick={() =>
                  handleUserAction(
                    "Forget Password",
                    ROUTE_PATH.AUTH.FORGOT_PASSWORD
                  )
                }
              >
                Forget Password
              </Button>

              <Button
                className="w-full justify-start bg-red-600 text-white hover:bg-red-800"
                onClick={() => {
                  toast.success("Logged out successfully");
                  handleLogout(); // clears auth + localStorage and redirects
                  setIsModalOpen(false);
                }}
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </div>
          )}


        </div>
      </div>
    </>
  );
}
