export interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  menuId?: string // Optional menu assignment
}

export interface CartItem extends Product {
  quantity: number
}

// Update the Order interface to include new fields and payment tracking
export interface Order {
  id: string
  userId: string
  userEmail: string
  userName: string
  userPhone: string
  specialInstructions?: string
  items: CartItem[]
  total: number
  status: "Placed" | "Arrived"
  // Add payment tracking fields
  paymentStatus: "Unpaid" | "Paid"
  paymentMethod?: "Zelle" | "Cash" | "Venmo" | "Other"
  paymentNotes?: string
  paidAt?: {
    seconds: number
    nanoseconds: number
  }
  createdAt: {
    seconds: number
    nanoseconds: number
  }
  arrivedAt?: {
    seconds: number
    nanoseconds: number
  }
}

// Update the OrderData interface to include new fields and payment fields
export interface OrderData {
  userId: string
  userEmail: string
  userName: string
  userPhone: string
  specialInstructions?: string
  items: CartItem[]
  total: number
  paymentStatus: "Unpaid" // Always start as unpaid
}

// New Menu interface
export interface Menu {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: {
    seconds: number
    nanoseconds: number
  }
  createdBy: string
}

// Menu settings interface
export interface MenuSettings {
  activeMenuId: string | null
  lastUpdated: {
    seconds: number
    nanoseconds: number
  }
  updatedBy: string
}
