"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/hooks"
import { useAdminPermissions } from "@/hooks/use-admin-permissions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import AdminStats from "@/components/admin/admin-stats"
import OrderList from "@/components/admin/order-list"
import ManualOrderForm from "@/components/admin/manual-order-form"
import DailyExport from "@/components/admin/daily-export"
import AddProductForm from "@/components/admin/add-product-form"
import ProductManagement from "@/components/admin/product-management"
import MenuManagement from "@/components/admin/menu-management"
import OrderTimingSettings from "@/components/admin/order-timing-settings"
import AdminTeam from "@/components/admin/admin-team"
import type { Order } from "@/lib/types"
import { ShoppingBag, UtensilsCrossed, Clock, Users, UserPlus, Download, Plus, Shield } from "lucide-react"

export default function AdminPage() {
  const { user, loading } = useAuth()
  const { permissions, isAdmin, isSuperAdmin, isLoading: permissionsLoading, hasPermission } = useAdminPermissions()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [manualOrderOpen, setManualOrderOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [addProductOpen, setAddProductOpen] = useState(false)

  const checkingAccess = loading || permissionsLoading

  // Redirect anyone who isn't an admin.
  useEffect(() => {
    if (!checkingAccess && (!user || !isAdmin)) {
      router.push("/")
    }
  }, [user, isAdmin, checkingAccess, router])

  // Live order feed (only when the admin may see orders).
  const canViewOrders = hasPermission("viewOrders")
  useEffect(() => {
    if (checkingAccess || !isAdmin || !canViewOrders) return

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order))
    })
    return () => unsubscribe()
  }, [checkingAccess, isAdmin, canViewOrders])

  const newOrdersCount = useMemo(() => orders.filter((order) => order.status === "Placed").length, [orders])

  /**
   * Four tabs, each with one clear job. Anything an admin does occasionally
   * (create a manual order, export, add a dougie) is a button inside the tab
   * it belongs to rather than a tab of its own.
   */
  const tabs = [
    canViewOrders && { value: "orders", label: "Orders", icon: ShoppingBag },
    hasPermission("viewProducts") && { value: "menu", label: "Menu", icon: UtensilsCrossed },
    hasPermission("manageOrderTiming") && { value: "schedule", label: "Schedule", icon: Clock },
    hasPermission("manageAdminUsers") && { value: "team", label: "Team", icon: Users },
  ].filter(Boolean) as { value: string; label: string; icon: typeof ShoppingBag }[]

  if (checkingAccess || !user || !isAdmin) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  if (tabs.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin</h1>
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don&apos;t have permission to access any admin features yet. Ask an owner to grant you access.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-3xl font-bold text-transparent">
            Admin
          </h1>
          <p className="text-muted-foreground">Camp Simcha Dougies</p>
        </div>
        <div className="flex items-center gap-2">
          {newOrdersCount > 0 && canViewOrders && (
            <Badge variant="destructive">
              {newOrdersCount} pending order{newOrdersCount > 1 ? "s" : ""}
            </Badge>
          )}
          {isSuperAdmin && <Badge variant="secondary">Owner</Badge>}
        </div>
      </div>

      {canViewOrders && <AdminStats orders={orders} />}

      <Tabs defaultValue={tabs[0].value} className="space-y-6">
        {/* Scrollable on mobile so tabs are never crushed. */}
        <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto sm:grid sm:grid-cols-4">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap sm:flex-shrink"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Orders ─────────────────────────────────────────────────────── */}
        {canViewOrders && (
          <TabsContent value="orders" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {hasPermission("createManualOrders") && (
                <Dialog open={manualOrderOpen} onOpenChange={setManualOrderOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <UserPlus className="mr-2 h-4 w-4" />
                      New Order
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create an order</DialogTitle>
                      <DialogDescription>
                        Place an order for a customer. Manual orders ignore the ordering window.
                      </DialogDescription>
                    </DialogHeader>
                    <ManualOrderForm onSuccess={() => setManualOrderOpen(false)} />
                  </DialogContent>
                </Dialog>
              )}

              {hasPermission("exportOrderData") && (
                <Dialog open={exportOpen} onOpenChange={setExportOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Export orders</DialogTitle>
                      <DialogDescription>Download a day&apos;s orders as a spreadsheet or JSON.</DialogDescription>
                    </DialogHeader>
                    <DailyExport orders={orders} />
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <OrderList orders={orders} permissions={permissions} />
          </TabsContent>
        )}

        {/* ── Menu (dougies + which menu is live) ────────────────────────── */}
        {hasPermission("viewProducts") && (
          <TabsContent value="menu" className="space-y-6">
            {hasPermission("addProducts") && (
              <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Dougie
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add a dougie</DialogTitle>
                    <DialogDescription>It appears on the storefront as soon as you save.</DialogDescription>
                  </DialogHeader>
                  <AddProductForm onSuccess={() => setAddProductOpen(false)} />
                </DialogContent>
              </Dialog>
            )}

            <MenuManagement permissions={permissions} />
            <ProductManagement permissions={permissions} />
          </TabsContent>
        )}

        {/* ── Schedule ───────────────────────────────────────────────────── */}
        {hasPermission("manageOrderTiming") && (
          <TabsContent value="schedule">
            <OrderTimingSettings />
          </TabsContent>
        )}

        {/* ── Team ───────────────────────────────────────────────────────── */}
        {hasPermission("manageAdminUsers") && (
          <TabsContent value="team">
            <AdminTeam canManagePermissions={isSuperAdmin} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
