"use client"

import { useEffect, useState } from "react"
import { collection, onSnapshot, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import ProductCard from "@/components/product-card"
import OrderTimer from "@/components/order-timer"
import type { Product, MenuSettings, Menu } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, ShoppingBag, Info, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/lib/hooks"

interface DailyOrderingSettings {
  enabled: boolean
  startTime: string
  endTime: string
  date: string
}

export default function HomePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [displayProducts, setDisplayProducts] = useState<Product[]>([])
  const [menuSettings, setMenuSettings] = useState<MenuSettings | null>(null)
  const [activeMenu, setActiveMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isOrderingOpen, setIsOrderingOpen] = useState(false)
  const { user } = useAuth()

  const today = new Date().toISOString().split("T")[0]

  // Load all products
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsData: Product[] = []
      snapshot.forEach((doc) => {
        const product = { id: doc.id, ...doc.data() } as Product
        // Only show available products
        if (product.available !== false) {
          productsData.push(product)
        }
      })
      setAllProducts(productsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Load menu settings
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "activeMenu"), (doc) => {
      if (doc.exists()) {
        setMenuSettings(doc.data() as MenuSettings)
      } else {
        setMenuSettings(null)
      }
    })

    return () => unsubscribe()
  }, [])

  // Load active menu details
  useEffect(() => {
    if (menuSettings?.activeMenuId && menuSettings.activeMenuId !== "unassigned") {
      const unsubscribe = onSnapshot(doc(db, "menus", menuSettings.activeMenuId), (doc) => {
        if (doc.exists()) {
          setActiveMenu({ id: doc.id, ...doc.data() } as Menu)
        } else {
          setActiveMenu(null)
        }
      })

      return () => unsubscribe()
    } else {
      setActiveMenu(null)
    }
  }, [menuSettings?.activeMenuId])

  // Filter products based on active menu
  useEffect(() => {
    if (menuSettings?.activeMenuId === "unassigned") {
      // Show only unassigned products
      const unassignedProducts = allProducts.filter((product) => !product.menuId)
      setDisplayProducts(unassignedProducts)
    } else if (menuSettings?.activeMenuId) {
      // Show only products assigned to the specific menu
      const filteredProducts = allProducts.filter((product) => product.menuId === menuSettings.activeMenuId)
      setDisplayProducts(filteredProducts)
    } else {
      // Show all products when no specific menu is active
      setDisplayProducts(allProducts)
    }
  }, [allProducts, menuSettings])

  // Check if ordering is currently open
  useEffect(() => {
    const checkOrderingStatus = () => {
      const unsubscribe = onSnapshot(doc(db, "settings", "dailyOrdering"), (doc) => {
        if (doc.exists()) {
          const settings = doc.data() as DailyOrderingSettings

          // Only check if settings are for today
          if (settings.date !== today || !settings.enabled) {
            setIsOrderingOpen(false)
            return
          }

          const now = new Date()
          const [startHour, startMinute] = settings.startTime.split(":").map(Number)
          const [endHour, endMinute] = settings.endTime.split(":").map(Number)

          const startTime = new Date(now)
          startTime.setHours(startHour, startMinute, 0, 0)

          const endTime = new Date(now)
          endTime.setHours(endHour, endMinute, 0, 0)

          setIsOrderingOpen(now >= startTime && now <= endTime)
        } else {
          setIsOrderingOpen(false)
        }
      })

      return unsubscribe
    }

    const unsubscribe = checkOrderingStatus()
    const interval = setInterval(() => {
      // Re-check every minute
      checkOrderingStatus()
    }, 60000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [today])

  const filteredProducts = displayProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getMenuDisplayName = () => {
    if (!menuSettings?.activeMenuId) return "All Dougies"
    if (menuSettings.activeMenuId === "unassigned") return "Unassigned Dougies"
    return activeMenu?.name || "Unknown Menu"
  }

  const getMenuDescription = () => {
    if (!menuSettings?.activeMenuId) return "Browse our complete selection of delicious dougies"
    if (menuSettings.activeMenuId === "unassigned") return "Dougies not assigned to any specific menu"
    return activeMenu?.description || ""
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-64 mx-auto animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border rounded-xl p-4 shadow-sm animate-pulse">
              <div className="w-full h-48 bg-gray-200 rounded-lg mb-4" />
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-10 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Welcome to Camp Simcha Dougies
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {isOrderingOpen
            ? "Order from our delicious selection while ordering is open!"
            : user
              ? "Browse our delicious selection. Place your order when ordering opens!"
              : "Browse our delicious selection. Log in when ordering opens to place your order."}
        </p>

        {/* Quick Stats */}
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          {menuSettings?.activeMenuId && (
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
              <ShoppingBag className="h-4 w-4" />
              {getMenuDisplayName()}
            </Badge>
          )}
        </div>

        {/* Login Prompt for Non-Users */}
        {!user && (
          <div className="pt-4">
            <Link href="/login">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Users className="mr-2 h-4 w-4" />
                Log In to Order
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Order Timer */}
      <OrderTimer />

      {/* Search Bar */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search our dougies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      {/* Products Grid */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <ShoppingBag className="h-6 w-6" />
          <h2 className="text-2xl font-semibold">
            {searchTerm ? `Search Results (${filteredProducts.length})` : getMenuDisplayName()}
          </h2>
          {!isOrderingOpen && (
            <span className="text-sm text-muted-foreground ml-2">(Preview Only - Ordering Closed)</span>
          )}
        </div>

        {/* Menu context info */}
        {!menuSettings?.activeMenuId && !searchTerm && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
            <Info className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Showing all dougies ({displayProducts.length} total) - No specific menu is currently active
            </p>
          </div>
        )}

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} isOrderingOpen={isOrderingOpen} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm
                ? "No dougies found"
                : menuSettings?.activeMenuId === "unassigned"
                  ? "No unassigned dougies"
                  : menuSettings?.activeMenuId
                    ? `No dougies in ${getMenuDisplayName()}`
                    : "No dougies available"}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "Try searching for something else or browse all dougies."
                : menuSettings?.activeMenuId === "unassigned"
                  ? "All dougies have been assigned to specific menus."
                  : menuSettings?.activeMenuId
                    ? "This menu doesn't have any dougies assigned yet."
                    : "Check back later for delicious new items!"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
