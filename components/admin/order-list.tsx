"use client"

import { useState } from "react"
import type { Order } from "@/lib/types"
import type { AdminPermissions } from "@/lib/admin-permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { markOrderAsArrived, bulkMarkOrdersAsArrived } from "@/app/actions"
import { doc, updateDoc, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  Search,
  Clock,
  CheckCircle,
  Mail,
  Package,
  Send,
  User,
  Phone,
  MessageSquare,
  DollarSign,
  Trash2,
} from "lucide-react"
import Image from "next/image"
import PaymentStatusDialog from "@/components/payment-status-dialog"
import DeleteOrderDialog from "@/components/admin/delete-order-dialog"

interface OrderListProps {
  orders: Order[]
  permissions: AdminPermissions
}

export default function OrderList({ orders, permissions }: OrderListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const { toast } = useToast()

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter
    const matchesPayment = paymentFilter === "all" || order.paymentStatus.toLowerCase() === paymentFilter

    return matchesSearch && matchesStatus && matchesPayment
  })

  const pendingOrders = filteredOrders.filter((order) => order.status === "Placed")
  const selectedPendingOrders = pendingOrders.filter((order) => selectedOrders.has(order.id))
  const unpaidOrders = filteredOrders.filter((order) => order.paymentStatus === "Unpaid")
  const totalUnpaid = unpaidOrders.reduce((sum, order) => sum + order.total, 0)

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedOrders)
    if (checked) {
      newSelected.add(orderId)
    } else {
      newSelected.delete(orderId)
    }
    setSelectedOrders(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allPendingIds = pendingOrders.map((order) => order.id)
      setSelectedOrders(new Set(allPendingIds))
    } else {
      setSelectedOrders(new Set())
    }
  }

  const handleMarkAsArrived = async (order: Order) => {
    if (!permissions.markOrdersArrived) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to mark orders as arrived.",
        variant: "destructive",
      })
      return
    }

    setUpdatingOrderId(order.id)
    try {
      const orderRef = doc(db, "orders", order.id)
      await updateDoc(orderRef, {
        status: "Arrived",
        arrivedAt: new Date(),
      })

      await markOrderAsArrived(order.id, order.userEmail, order.userName)

      toast({
        title: "Order Marked as Arrived! 📦",
        description: `Order #${order.id.substring(0, 6)} marked as arrived and ${order.userName} has been notified.`,
      })
    } catch (error) {
      console.error("Error updating order:", error)
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleBulkMarkAsArrived = async () => {
    if (!permissions.markOrdersArrived) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to mark orders as arrived.",
        variant: "destructive",
      })
      return
    }

    if (selectedPendingOrders.length === 0) {
      toast({
        title: "No Orders Selected",
        description: "Please select at least one pending order to mark as arrived.",
        variant: "destructive",
      })
      return
    }

    setIsBulkUpdating(true)
    try {
      const batch = writeBatch(db)
      const now = new Date()

      selectedPendingOrders.forEach((order) => {
        const orderRef = doc(db, "orders", order.id)
        batch.update(orderRef, {
          status: "Arrived",
          arrivedAt: now,
        })
      })

      await batch.commit()
      await bulkMarkOrdersAsArrived(selectedPendingOrders)

      toast({
        title: "Orders Marked as Arrived! 📦",
        description: `${selectedPendingOrders.length} orders marked as arrived and customers have been notified.`,
      })

      setSelectedOrders(new Set())
    } catch (error) {
      console.error("Error bulk updating orders:", error)
      toast({
        title: "Error",
        description: "Failed to update orders. Some orders may have been updated successfully.",
        variant: "destructive",
      })
    } finally {
      setIsBulkUpdating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Customer Orders
        </CardTitle>
        <CardDescription>
          View and manage all incoming orders. Track payment status and mark orders as arrived.
        </CardDescription>

        {/* Payment Summary */}
        {totalUnpaid > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">${totalUnpaid.toFixed(2)} in unpaid orders</p>
                <p className="text-sm text-red-600">
                  {unpaidOrders.length} order{unpaidOrders.length > 1 ? "s" : ""} awaiting payment
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders, customers, or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="placed">Pending Orders</SelectItem>
              <SelectItem value="arrived">Completed Orders</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {pendingOrders.length > 0 && permissions.markOrdersArrived && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedOrders.size === pendingOrders.length && pendingOrders.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Select All Pending ({pendingOrders.length})
              </label>
            </div>

            {selectedOrders.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedOrders.size} selected</Badge>
                <Button
                  onClick={handleBulkMarkAsArrived}
                  disabled={isBulkUpdating}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  {isBulkUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                      Notifying {selectedOrders.size} customers...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-3 w-3" />
                      Mark {selectedOrders.size} as Arrived
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {filteredOrders.length > 0 ? (
          <Accordion type="single" collapsible className="w-full space-y-2">
            {filteredOrders.map((order) => (
              <AccordionItem key={order.id} value={order.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-col sm:flex-row justify-between w-full pr-4 items-start sm:items-center gap-2">
                    <div className="flex items-center gap-3">
                      {order.status === "Placed" && permissions.markOrdersArrived && (
                        <Checkbox
                          checked={selectedOrders.has(order.id)}
                          onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      <div className="text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">#{order.id.substring(0, 8)}</p>
                          <Badge variant={order.status === "Placed" ? "default" : "secondary"}>
                            {order.status === "Placed" ? (
                              <>
                                <Clock className="h-3 w-3 mr-1" /> Pending
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" /> Arrived
                              </>
                            )}
                          </Badge>
                          <Badge variant={order.paymentStatus === "Paid" ? "default" : "destructive"}>
                            <DollarSign className="h-3 w-3 mr-1" />
                            {order.paymentStatus}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{order.userName}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{order.userEmail}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${order.total.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground hidden sm:block">{order.userEmail}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="space-y-4">
                    {/* Customer Information */}
                    <div className="grid gap-3">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        Customer Information
                      </h4>
                      <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{order.userName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{order.userEmail}</span>
                        </div>
                        {order.userPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{order.userPhone}</span>
                          </div>
                        )}
                        {order.specialInstructions && (
                          <div className="flex items-start gap-2 pt-2 border-t">
                            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Special Instructions
                              </p>
                              <p className="text-sm">{order.specialInstructions}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="grid gap-3">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        Order Items
                      </h4>
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Image
                              src={item.imageUrl || "/placeholder.svg?height=40&width=40&query=dougie"}
                              alt={item.name}
                              width={40}
                              height={40}
                              className="rounded-md"
                            />
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>

                    {/* Order Summary */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="text-sm text-muted-foreground">
                        <p>Ordered: {new Date(order.createdAt.seconds * 1000).toLocaleString()}</p>
                        {order.status === "Arrived" && order.arrivedAt && (
                          <p className="text-green-600">
                            Arrived: {new Date(order.arrivedAt.seconds * 1000).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="font-bold text-lg">Total: ${order.total.toFixed(2)}</div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t gap-2">
                      <div className="flex items-center gap-2">
                        {/* Payment Status Button */}
                        {permissions.updatePaymentStatus && <PaymentStatusDialog order={order} />}

                        {/* Delete Order Button */}
                        {permissions.deleteOrders && (
                          <DeleteOrderDialog
                            order={order}
                            trigger={
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive bg-transparent"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            }
                          />
                        )}

                        <div className="text-sm text-muted-foreground">
                          {order.status === "Placed" ? (
                            <p className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Waiting for order to arrive
                            </p>
                          ) : (
                            <p className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Customer has been notified
                            </p>
                          )}
                        </div>
                      </div>

                      {order.status === "Placed" && permissions.markOrdersArrived && (
                        <Button
                          onClick={() => handleMarkAsArrived(order)}
                          disabled={updatingOrderId === order.id}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          {updatingOrderId === order.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                              Updating...
                            </>
                          ) : (
                            <>
                              <Package className="mr-2 h-3 w-3" />
                              Order Arrived
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" || paymentFilter !== "all"
                ? "No orders match your filters."
                : "No orders have been placed yet."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
