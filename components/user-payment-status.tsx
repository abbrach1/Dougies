"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DollarSign, AlertTriangle, CheckCircle, Clock, CreditCard } from "lucide-react"
import type { Order } from "@/lib/types"
import Image from "next/image"

export default function UserPaymentStatus() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const q = query(collection(db, "orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: Order[] = []
      snapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() } as Order)
      })
      setOrders(ordersData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  const unpaidOrders = orders.filter((order) => order.paymentStatus === "Unpaid")
  const totalUnpaid = unpaidOrders.reduce((sum, order) => sum + order.total, 0)
  const paidOrders = orders.filter((order) => order.paymentStatus === "Paid")

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Unpaid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalUnpaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {unpaidOrders.length} unpaid order{unpaidOrders.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">All time orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidOrders.length}</div>
            <p className="text-xs text-muted-foreground">Successfully paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Unpaid Orders Alert */}
      {totalUnpaid > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <div className="font-semibold text-red-800">You have ${totalUnpaid.toFixed(2)} in unpaid orders</div>
            <div className="text-sm text-red-700">
              Please send payment via Zelle to <strong>+1 (929) 283-1714</strong>. Include your order number(s) in the
              memo.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Orders List */}
      {orders.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Your Orders & Payment Status
            </CardTitle>
            <CardDescription>Track your order history and payment status</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full space-y-2">
              {orders.map((order) => (
                <AccordionItem key={order.id} value={order.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-col sm:flex-row justify-between w-full pr-4 items-start sm:items-center gap-2">
                      <div className="text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">#{order.id.substring(0, 8)}</p>
                          <Badge variant={order.status === "Placed" ? "default" : "secondary"}>{order.status}</Badge>
                          <Badge variant={order.paymentStatus === "Paid" ? "default" : "destructive"}>
                            {order.paymentStatus}
                            {order.paymentMethod && ` (${order.paymentMethod})`}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">${order.total.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.items.length} item{order.items.length > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="space-y-4">
                      {/* Order Items */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                          Order Items
                        </h4>
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Image
                                src={item.imageUrl || "/placeholder.svg?height=32&width=32&query=dougie"}
                                alt={item.name}
                                width={32}
                                height={32}
                                className="rounded-md"
                              />
                              <div>
                                <p className="font-medium text-sm">{item.name}</p>
                                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <p className="font-semibold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Payment Status Details */}
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">Payment Status</p>
                            {order.paymentStatus === "Paid" && order.paidAt && (
                              <p className="text-xs text-green-600">
                                Paid on {new Date(order.paidAt.seconds * 1000).toLocaleString()}
                              </p>
                            )}
                            {order.paymentNotes && (
                              <p className="text-xs text-muted-foreground mt-1">Note: {order.paymentNotes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={order.paymentStatus === "Paid" ? "default" : "destructive"}
                              className="mb-1"
                            >
                              {order.paymentStatus}
                            </Badge>
                            {order.paymentMethod && (
                              <p className="text-xs text-muted-foreground">via {order.paymentMethod}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Payment Instructions for Unpaid Orders */}
                      {order.paymentStatus === "Unpaid" && (
                        <Alert className="border-orange-200 bg-orange-50">
                          <DollarSign className="h-4 w-4" />
                          <AlertDescription>
                            <div className="font-semibold text-orange-800">Payment Required</div>
                            <div className="text-sm text-orange-700 mt-1">
                              Send <strong>${order.total.toFixed(2)}</strong> via Zelle to{" "}
                              <strong>+1 (929) 283-1714</strong>
                              <br />
                              Include order #{order.id.substring(0, 6)} in the memo
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No orders found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
