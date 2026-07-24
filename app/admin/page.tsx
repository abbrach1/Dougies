"use client"

import { useAuth } from "@/lib/hooks"
import { useAdminPermissions } from "@/hooks/use-admin-permissions"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import AddProductForm from "@/components/admin/add-product-form"
import OrderList from "@/components/admin/order-list"
import ProductManagement from "@/components/admin/product-management"
import MenuManagement from "@/components/admin/menu-management"
import AdminStats from "@/components/admin/admin-stats"
import OrderTimingSettings from "@/components/admin/order-timing-settings"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Order } from "@/lib/types"
import { Package, ShoppingBag, TrendingUp, Users, Clock, UserPlus, Settings, Shield, MenuIcon } from "lucide-react"
import AdminUserManagement from "@/components/admin/admin-user-management"
import ManualOrderForm from "@/components/admin/manual-order-form"
import AdminPermissionsManagement from "@/components/admin/admin-permissions-management"
import DailyExport from "@/components/admin/daily-export"

export default function AdminPage() {
  const { user, loading } = useAuth()
  const { permissions, isSuperAdmin, isLoading: permissionsLoading, hasPermission } = useAdminPermissions()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminLoading, setAdminLoading] = useState(true)

  // System admins (permanent)
  const SYSTEM_ADMINS = ["abbrachfeld@gmail.com", "dovi@campsimcha.com"]

  // Check if user is admin
  useEffect(() => {
    if (!user?.email) {
      setIsAdmin(false)
      setAdminLoading(false)
      return
    }

    // Check if user is a system admin first
    if (SYSTEM_ADMINS.includes(user.email)) {
      setIsAdmin(true)
      setAdminLoading(false)
      return
    }

    // Check database for additional admin users
    const unsubscribe = onSnapshot(collection(db, "adminUsers"), (snapshot) => {
      const adminEmails = new Set<string>()
      snapshot.forEach((doc) => {
        const data = doc.data()
        if (data.email) {
          adminEmails.add(data.email.toLowerCase())
        }
      })

      setIsAdmin(adminEmails.has(user.email!.toLowerCase()))
      setAdminLoading(false)
    })

    return () => unsubscribe()
  }, [user?.email])

  // Redirect if not admin
  useEffect(() => {
    if (!loading && !adminLoading && (!user || !isAdmin)) {
      router.push("/")
    }
  }, [user, loading, isAdmin, adminLoading, router])

  // Load orders if user is admin and has permission
  useEffect(() => {
    if (user && isAdmin && !adminLoading && !permissionsLoading && hasPermission("viewOrders")) {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"))
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ordersData: Order[] = []
        let newOrders = 0
        snapshot.forEach((doc) => {
          const order = { id: doc.id, ...doc.data() } as Order
          ordersData.push(order)
          if (order.status === "Placed") newOrders++
        })
        setOrders(ordersData)
        setNewOrdersCount(newOrders)
      })

      return () => unsubscribe()
    }
  }, [user, isAdmin, adminLoading, permissionsLoading, hasPermission])

  // Show loading while checking admin status and permissions
  if (loading || adminLoading || permissionsLoading || !user || !isAdmin) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Get available tabs based on permissions
  const getAvailableTabs = () => {
    const tabs = []

    if (hasPermission("viewOrders")) {
      tabs.push({
        value: "orders",
        label: "Orders",
        icon: ShoppingBag,
        component: <OrderList orders={orders} permissions={permissions} />,
      })
    }

    if (hasPermission("createManualOrders")) {
      tabs.push({
        value: "manual-order",
        label: "Manual Order",
        icon: UserPlus,
        component: <ManualOrderForm />,
      })
    }

    if (hasPermission("viewProducts")) {
      tabs.push({
        value: "products",
        label: "Manage Dougies",
        icon: Package,
        component: <ProductManagement permissions={permissions} />,
      })
    }

    if (hasPermission("addProducts")) {
      tabs.push({
        value: "add-product",
        label: "Add Dougies",
        icon: TrendingUp,
        component: <AddProductForm />,
      })
    }

    if (hasPermission("editProducts")) {
      tabs.push({
        value: "menus",
        label: "Menu Control",
        icon: MenuIcon,
        component: <MenuManagement permissions={permissions} />,
      })
    }

    if (hasPermission("manageOrderTiming")) {
      tabs.push({
        value: "timing",
        label: "Timing",
        icon: Clock,
        component: <OrderTimingSettings />,
      })
    }

    if (hasPermission("manageAdminUsers")) {
      tabs.push({
        value: "admins",
        label: "Admins",
        icon: Users,
        component: <AdminUserManagement />,
      })
    }

    if (isSuperAdmin) {
      tabs.push({
        value: "permissions",
        label: "Permissions",
        icon: Settings,
        component: <AdminPermissionsManagement />,
      })
    }

    if (hasPermission("viewAnalytics")) {
      tabs.push({
        value: "analytics",
        label: "Analytics",
        icon: Users,
        component: (
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Detailed business insights coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Advanced analytics and reporting features will be available here.</p>
            </CardContent>
          </Card>
        ),
      })
    }

    if (hasPermission("exportOrderData")) {
      tabs.push({
        value: "export",
        label: "Export",
        icon: TrendingUp,
        component: <DailyExport orders={orders} />,
      })
    }

    return tabs
  }

  const availableTabs = getAvailableTabs()

  if (availableTabs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your Camp Simcha Dougies business</p>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access any admin features. Please contact a super administrator to grant you
            the necessary permissions.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Camp Simcha Dougies Admin
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">Manage your dougie ordering system</p>
            {isSuperAdmin && (
              <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                Super Admin
              </Badge>
            )}
          </div>
        </div>
        {newOrdersCount > 0 && hasPermission("viewOrders") && (
          <Badge variant="destructive" className="text-sm">
            {newOrdersCount} New Order{newOrdersCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {hasPermission("viewOrders") && <AdminStats orders={orders} />}

      <Tabs defaultValue={availableTabs[0]?.value} className="space-y-6">
        {/* Scrollable on mobile/tablet so tabs aren't crushed; full-width grid on large screens. */}
        <TabsList
          className="flex lg:grid h-auto w-full justify-start gap-1 overflow-x-auto"
          style={{ gridTemplateColumns: `repeat(${availableTabs.length}, minmax(0, 1fr))` }}
        >
          {availableTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap text-xs sm:text-sm lg:flex-shrink"
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {availableTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-6">
            {tab.component}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
