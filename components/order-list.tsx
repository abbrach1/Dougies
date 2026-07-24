"use client"

import { useEffect, useState } from "react"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ShoppingCart, Clock, DollarSign } from "lucide-react"
import type { Order } from "@/lib/types"

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: Order[] = []
      snapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() } as Order)
      })
      setOrders(ordersData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Recent Orders ({orders.length})
        </CardTitle>
        <CardDescription>Latest customer orders</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{order.customerName}</h4>
                    <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={order.status === "pending" ? "secondary" : "default"}>{order.status}</Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {new Date(order.createdAt.seconds * 1000).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold flex items-center">
                    <DollarSign className="h-4 w-4" />
                    {order.total.toFixed(2)}
                  </span>
                </div>
              </Card>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No orders yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
