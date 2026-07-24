export interface AdminPermissions {
  // Order Management
  viewOrders: boolean
  markOrdersArrived: boolean
  deleteOrders: boolean
  createManualOrders: boolean
  updatePaymentStatus: boolean
  exportOrderData: boolean // Add this new permission

  // Product Management
  viewProducts: boolean
  addProducts: boolean
  editProducts: boolean
  deleteProducts: boolean

  // System Settings
  manageOrderTiming: boolean
  manageAdminUsers: boolean
  viewAnalytics: boolean

  // Super Admin Only
  managePermissions: boolean
}

export const DEFAULT_ADMIN_PERMISSIONS: AdminPermissions = {
  // Order Management - Most admins can handle orders
  viewOrders: true,
  markOrdersArrived: true,
  deleteOrders: false, // Restricted by default
  createManualOrders: true,
  updatePaymentStatus: true,
  exportOrderData: true, // Allow by default

  // Product Management - Limited by default
  viewProducts: true,
  addProducts: false,
  editProducts: false,
  deleteProducts: false,

  // System Settings - Restricted by default
  manageOrderTiming: false,
  manageAdminUsers: false,
  viewAnalytics: true,

  // Super Admin Only
  managePermissions: false,
}

export const SUPER_ADMIN_PERMISSIONS: AdminPermissions = {
  viewOrders: true,
  markOrdersArrived: true,
  deleteOrders: true,
  createManualOrders: true,
  updatePaymentStatus: true,
  exportOrderData: true, // Add this
  viewProducts: true,
  addProducts: true,
  editProducts: true,
  deleteProducts: true,
  manageOrderTiming: true,
  manageAdminUsers: true,
  viewAnalytics: true,
  managePermissions: true,
}

export const PERMISSION_DESCRIPTIONS: Record<keyof AdminPermissions, string> = {
  viewOrders: "View customer orders and order details",
  markOrdersArrived: "Mark orders as arrived and notify customers",
  deleteOrders: "Delete orders from the system",
  createManualOrders: "Create orders on behalf of customers",
  updatePaymentStatus: "Update payment status and methods",
  exportOrderData: "Export daily order data and revenue reports", // Add this
  viewProducts: "View product catalog and details",
  addProducts: "Add new products to the catalog",
  editProducts: "Edit existing product information",
  deleteProducts: "Delete products from the catalog",
  manageOrderTiming: "Configure daily ordering time windows",
  manageAdminUsers: "Add and remove admin users",
  viewAnalytics: "Access business analytics and reports",
  managePermissions: "Configure admin user permissions",
}
