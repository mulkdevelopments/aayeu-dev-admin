
export const ROUTE_PATH = {
  AUTH: {
    LOGIN: "/",
    LOGOUT: "/logout",
    SIGNUP: "/signup",
    FORGOT_PASSWORD: "/forgot-password",
    CHANGE_PASSWORD: "/change-password",
    PROFILE_PREVIEW: "/profile-preview",
    VERIFY: "/verify/:verifyToken",
    RESET_PASSWORD: "/reset-password/:resetToken",
  },
  DASHBOARD: {
    DASHBOARD: "/dashboard",
    CUSTOMERS: "/dashboard/customers",
    ADMIN_PROFILE: "/dashboard/adminprofile",
    VENDORS: "/dashboard/vendors",
    PLUGINS: "/dashboard/plugins",
    PLUGIN_DETAIL: "/dashboard/plugins/:id",
    ORDERS: "/dashboard/orders",
    INVENTORIES: "/dashboard/inventories",
    VIEW_PRODUCT: "/dashboard/inventories/viewproduct/:id",
    IMPORT_PRODUCT: "/dashboard/importproduct",
    CONTENT_AND_POLICIES: "/dashboard/policies",
    ADD_PRODUCT: "/dashboard/inventories/addproduct",
    CATEGORY_MANAGEMENT: "/dashboard/inventories/categorymanagement",
    REPORTS: "/dashboard/reports",
   USERS: "/dashboard/users",

    SETTINGS: "/dashboard/settings",
    COUNTRIES: "/dashboard/countries",

    SETTINGS_MENU_CONFIG: "/dashboard/settings/menu-config",
    SETTINGS_HOME_CONFIG: "/dashboard/settings/home-config",
    SETTINGS_HOME_CONFIG_MANAGE_TOP_BANNER: "/dashboard/settings/home-config/manage-top-banner",
    SETTINGS_HOME_CONFIG_CHANGE_BANNER: "/dashboard/settings/home-config/manage-top-banner",
    SETTINGS_HOME_CONFIG_MANAGE_PRODUCT_OVERLAY: "/dashboard/settings/home-config/manage-product-overlay",
    SETTINGS_HOME_CONFIG_MANAGE_SALES: "/dashboard/settings/home-config/manage-sales",
    SETTINGS_HOME_CONFIG_MANAGE_MIDDLE_BANNER: "/dashboard/settings/home-config/manage-middle-banner",
    SETTINGS_HOME_CONFIG_MANAGE_BOTTOM_BANNER: "/dashboard/settings/home-config/manage-bottom-banner",
    SETTINGS_HOME_CONFIG_MANAGE_BEST_SELLERS: "/dashboard/settings/home-config/manage-best-sellers",
    SETTINGS_HOME_CONFIG_MANAGE_FEATURED_BRANDS: "/dashboard/settings/home-config/manage-featured-brands",
    SETTINGS_HOME_CONFIG_MANAGE_FEATURED_BRANDS_ADD_NEW_BRANDS: "/dashboard/settings/home-config/manage-featured-brands/addnewbrands",
    SETTINGS_HOME_CONFIG_MANAGE_NEW_ARRIVALS: "/dashboard/settings/home-config/manage-new-arrivals",
    SETTINGS_HOME_ADD_BEST_SELLER: "/dashboard/settings/home-config/manage-best-sellers/addbestseller",
  },
};

export default ROUTE_PATH;
