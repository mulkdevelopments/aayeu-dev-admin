import ROUTE_PATH from "@/libs/route-path";

import {
  BadgePercent,
  Gift,
  Image,
  Layers,
  Mail,
  Megaphone,
  RectangleHorizontal,
  ShieldCheck,
  Sparkles,
  Star,
  Tags,
} from "lucide-react";
import { Menu } from "lucide-react";
import { ChartBarStacked } from "lucide-react";
export const ALL_PERMISSIONS = [
  // "supply_management",
  "superadmin",
];

export const actions = [
  {
    id: 0,
    title: "Manage Hero Section",
    description: "Homepage hero carousel: title, description, image & CTA",
    icon: <Image className="w-6 h-6 text-violet-600" />,
    color: "bg-violet-50",
    href: ROUTE_PATH.DASHBOARD.SETTINGS_HOME_CONFIG_MANAGE_HERO_SECTION,
  },
  {
    id: 1,
    title: "Manage Top Banner",
    description: "Update hero visuals and CTAs",
    icon: <Megaphone className="w-6 h-6 text-blue-600" />,
    color: "bg-blue-50",
    href: ROUTE_PATH.DASHBOARD.SETTINGS_HOME_CONFIG_MANAGE_TOP_BANNER,
  },
  {
    id: 2,
    title: "Product Overlay (Below Top Banner)",
    description: "Configure the overlay cards under the hero",
    icon: <Layers className="w-6 h-6 text-indigo-600" />,
    color: "bg-indigo-50",
    href: ROUTE_PATH.DASHBOARD.SETTINGS_HOME_CONFIG_MANAGE_PRODUCT_OVERLAY,
  },
  {
    id: 3,
    title: "Manage Sale Section",
    description: "Control sale badges, timers & discounts",
    icon: <BadgePercent className="w-6 h-6 text-pink-600" />,
    color: "bg-pink-50",
    href: ROUTE_PATH.DASHBOARD.SETTINGS_HOME_CONFIG_MANAGE_SALES,
  },
  {
    id: 4,
    title: "Manage Middle Banner",
    description: "Swap and schedule mid-page banners",
    icon: <RectangleHorizontal className="w-6 h-6 text-green-600" />,
    color: "bg-green-50",
    href: ROUTE_PATH.DASHBOARD.SETTINGS_HOME_CONFIG_MANAGE_MIDDLE_BANNER,
  },
  {
    id: 5,
    title: "Manage Best Sellers",
    description: "Prioritize top-performing products",
    icon: <Star className="w-6 h-6 text-amber-500" />,
    color: "bg-amber-50",
    href: ROUTE_PATH.DASHBOARD.SETTINGS_HOME_CONFIG_MANAGE_BEST_SELLERS,
  },
  {
    id:6,
    title: "Manage New Arrivals",
    description: "Highlight the freshest inventory",
    icon: <Sparkles className="w-6 h-6 text-purple-600" />,
    color: "bg-purple-50",
    href: ROUTE_PATH.DASHBOARD.SETTINGS_HOME_CONFIG_MANAGE_NEW_ARRIVALS,
  },

  {
    id: 7,
    title: "Manage Bottom Banner",
    description:
      "Bottom strip plus homepage club (left) and newsletter headline (right) panels",
    icon: <Image className="w-6 h-6 text-cyan-600" />,
    color: "bg-cyan-50",
    href: ROUTE_PATH.DASHBOARD.SETTINGS_HOME_CONFIG_MANAGE_BOTTOM_BANNER,
  },
  {
    id: 8,
    title: "Manage Brand Groups",
    description: "Create groups and assign brands",
    icon: <Tags className="w-6 h-6 text-slate-600" />,
    color: "bg-slate-50",
    href: ROUTE_PATH.DASHBOARD.SETTINGS_HOME_CONFIG_MANAGE_FEATURED_BRANDS,
  },
  {
    id: 9,
    title: "Club & newsletter panels",
    description:
      "Headlines, backgrounds, and optional CTA for the dual homepage panels",
    icon: <Mail className="w-6 h-6 text-teal-600" />,
    color: "bg-teal-50",
    href: `${ROUTE_PATH.DASHBOARD.SETTINGS_HOME_CONFIG_MANAGE_BOTTOM_BANNER}?tab=bottomRight`,
  },
];

export const settingsCards = [
  // {
  //   id: 1,
  //   title: "Menu Config",
  //   description: "Manage the menu settings of your site",
  //   icon: <Menu size={28} />,
  //   href: "/dashboard/settings/menu-config",
  //   bgColor: "bg-[#C38E1E]",
  //   textColor: "text-black",
  //   iconBg: "bg-white",
  // },
  {
    id: 3,
    title: "Content & Policies",
    description: "Manage About Us and policy pages",
    icon: <ShieldCheck className="w-6 h-6 text-amber-600" />,
    color: "bg-amber-50",
    href: "/dashboard/policies",
    bgColor: "bg-black",
    textColor: "text-white",
    iconBg: "bg-white",
  },
  {
    id: 4,
    title: "Category Mapping",
    description: "Map Products",
    icon: <ChartBarStacked size={28} />,
    href: "/dashboard/settings/category-mapping",
    bgColor: "bg-black",
    textColor: "text-white",
    iconBg: "bg-white",
  },
  {
    id: 5,
    title: "Coupon Management",
    description: "Create and manage discount coupons",
    icon: <Gift size={28} />,
    href: "/dashboard/settings/coupon-management",
    bgColor: "bg-[#C38E1E]",
    textColor: "text-black",
    iconBg: "bg-white",
  },
  // aur cards add karne ho to yaha add kar dena...
];
