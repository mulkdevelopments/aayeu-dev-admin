"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiChevronRight } from "react-icons/fi";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Human-readable route name mappings
const routeNames = {
  dashboard: "Dashboard",
  customers: "Customers",
  users: "Users",
  orders: "Orders",
  "request-access": "Request Access",
  inventories: "Inventories",
  viewproduct: "Product Details",
  addproduct: "Add Product",
  categorymanagement: "Category Management",
  vendors: "Vendors",
  reports: "Reports",
  settings: "Editorials",
  "home-config": "Home Configuration",
  adminprofile: "Admin Profile",
  "manage-top-banner": "Manage Top Banner",
  "manage-product-overlay": "Product Overlay",
  "manage-sales": "Sale Section",
  "manage-middle-banner": "Middle Banner",
  "manage-bottom-banner": "Bottom Banner",
  "manage-best-sellers": "Best Sellers",
  "manage-new-arrivals": "New Arrivals",
};

function isIdLikeSegment(segment) {
  // Hide Mongo-like ObjectId or long encrypted ids
  const objectIdRegex = /^[a-f0-9]{24}$/i;
  if (objectIdRegex.test(segment)) return true;
  // Generic long token/id heuristic: not a known route name and quite long
  if (!routeNames[segment] && segment.length >= 18) return true;
  return false;
}

export default function CustomBreadcrumb({ tail, onOrdersClick }) {
  const pathname = usePathname();
  const rawSegments = pathname.split("/").filter(Boolean);

  // Build filtered segments excluding id-like parts and removed routes
  const filteredSegments = rawSegments.filter(
    (seg) =>
      !isIdLikeSegment(seg) &&
      seg !== "home-config" &&
      seg !== "settings"
  );

  const segments = filteredSegments.map((segment, index) => {
    const isLast = index === filteredSegments.length - 1;
    const href = `/${filteredSegments.slice(0, index + 1).join("/")}`;
    const name =
      routeNames[segment] ||
      segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    return {
      name,
      href,
      isLast,
    };
  });

  const trail = segments.slice(1);

  return (
    <Breadcrumb className="flex items-center text-gray-500 dark:text-gray-400 font-medium">
      {/* Static Dashboard Link */}
      <BreadcrumbItem>
          <Link
          href="/dashboard"
          className="hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1 rounded-md transition-colors duration-200 cursor-pointer"
        >
          Dashboard
        </Link>
      </BreadcrumbItem>

      {trail.map(({ name, href }, idx) => {
        const lastInTrail = idx === trail.length - 1 && !tail; // if tail exists, previous segments stay clickable
        return (
        <span key={href} className="flex items-center">
          <BreadcrumbSeparator className="inline-flex items-center mx-1.5">
            <FiChevronRight className="text-gray-400 text-sm" />
          </BreadcrumbSeparator>

          <BreadcrumbItem>
            {!lastInTrail ? (
              name?.toLowerCase() === "orders" && typeof onOrdersClick === "function" ? (
                <button
                  type="button"
                  onClick={(e) => { e.currentTarget.blur(); onOrdersClick(); }}
                  className="px-2 py-1 rounded-md transition-colors duration-200 capitalize cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
                >
                  {name}
                </button>
              ) : (
                <Link
                  href={href}
                  className="hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1 rounded-md transition-colors duration-200 capitalize cursor-pointer"
                >
                  {name}
                </Link>
              )
            ) : (
              <span className="text-gray-600 dark:text-gray-300 capitalize">
                {name}
              </span>
            )}
          </BreadcrumbItem>
        </span>
      )})}

      {tail && (
        <span className="flex items-center">
          <BreadcrumbSeparator className="inline-flex items-center mx-1.5">
            <FiChevronRight className="text-gray-400 text-sm" />
          </BreadcrumbSeparator>

          <BreadcrumbItem>
            <span className="text-gray-600 dark:text-gray-300 capitalize">
              {tail}
            </span>
          </BreadcrumbItem>
        </span>
      )}
    </Breadcrumb>
  );
}
