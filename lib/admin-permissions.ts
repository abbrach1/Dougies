/**
 * Permanent system administrators. These accounts always have every
 * permission and cannot be removed from the admin team.
 *
 * Single source of truth — previously this list was copy-pasted into four
 * separate files, which meant adding an admin required four edits.
 */
export const SYSTEM_ADMINS = ["abbrachfeld@gmail.com", "dovi@campsimcha.com"]

/** True when the given email is a permanent system administrator. */
export function isSystemAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return SYSTEM_ADMINS.includes(email.toLowerCase())
}

export interface AdminPermissions {
  // Order Management
  viewOrders: boolean
  markOrdersArrived: boolean
  deleteOrders: boolean
  createManualOrders: boolean
  updatePaymentStatus: boolean
  exportOrderData: boolean

  // Product Management
  viewProducts: boolean
  addProducts: boolean
  editProducts: boolean
  deleteProducts: boolean

  // System Settings
  manageOrderTiming: boolean
  manageAdminUsers: boolean

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
  exportOrderData: true,

  // Product Management - Limited by default
  viewProducts: true,
  addProducts: false,
  editProducts: false,
  deleteProducts: false,

  // System Settings - Restricted by default
  manageOrderTiming: false,
  manageAdminUsers: false,

  // Super Admin Only
  managePermissions: false,
}

export const SUPER_ADMIN_PERMISSIONS: AdminPermissions = {
  viewOrders: true,
  markOrdersArrived: true,
  deleteOrders: true,
  createManualOrders: true,
  updatePaymentStatus: true,
  exportOrderData: true,
  viewProducts: true,
  addProducts: true,
  editProducts: true,
  deleteProducts: true,
  manageOrderTiming: true,
  manageAdminUsers: true,
  managePermissions: true,
}

export const PERMISSION_DESCRIPTIONS: Record<keyof AdminPermissions, string> = {
  viewOrders: "View customer orders and order details",
  markOrdersArrived: "Mark orders as arrived and notify customers",
  deleteOrders: "Delete orders from the system",
  createManualOrders: "Create orders on behalf of customers",
  updatePaymentStatus: "Update payment status and methods",
  exportOrderData: "Export daily order data and revenue reports",
  viewProducts: "View product catalog and details",
  addProducts: "Add new products to the catalog",
  editProducts: "Edit existing product information",
  deleteProducts: "Delete products from the catalog",
  manageOrderTiming: "Configure daily ordering time windows",
  manageAdminUsers: "Add and remove admin users",
  managePermissions: "Configure admin user permissions",
}

/** Permission groups used to render the permission editor. */
export const PERMISSION_GROUPS: { label: string; keys: (keyof AdminPermissions)[] }[] = [
  {
    label: "Orders",
    keys: ["viewOrders", "markOrdersArrived", "updatePaymentStatus", "createManualOrders", "exportOrderData", "deleteOrders"],
  },
  {
    label: "Menu",
    keys: ["viewProducts", "addProducts", "editProducts", "deleteProducts"],
  },
  {
    label: "Settings",
    keys: ["manageOrderTiming", "manageAdminUsers"],
  },
]
