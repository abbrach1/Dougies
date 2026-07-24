"use client"

import { useCart, useAuth } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { placeOrder } from "@/app/actions"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import Image from "next/image"
import { collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react"
import CheckoutForm, { type OrderInfo } from "@/components/checkout-form"

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart()
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePlaceOrder = async (orderInfo: OrderInfo) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to place an order.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    setIsSubmitting(true)
    try {
      const orderData = {
        userId: user.uid,
        userEmail: orderInfo.customerEmail,
        userName: orderInfo.customerName,
        userPhone: orderInfo.customerPhone,
        specialInstructions: orderInfo.specialInstructions || "",
        items: cart,
        total: cartTotal,
        status: "Placed",
        paymentStatus: "Unpaid", // Always start as unpaid
        createdAt: new Date(),
      }

      await addDoc(collection(db, "orders"), orderData)
      await placeOrder({
        userId: user.uid,
        userEmail: orderInfo.customerEmail,
        userName: orderInfo.customerName,
        userPhone: orderInfo.customerPhone,
        specialInstructions: orderInfo.specialInstructions || "",
        items: cart,
        total: cartTotal,
        paymentStatus: "Unpaid",
      })

      toast({
        title: "Order Placed! 🎉",
        description:
          "Your order has been successfully placed. Please send payment via Zelle and check your email for confirmation.",
      })
      clearCart()
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">
            {cart.length} item{cart.length > 1 ? "s" : ""} in your cart
          </p>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="text-center space-y-6 py-12">
          <ShoppingBag className="h-24 w-24 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Your Cart is Empty</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Looks like you haven't added anything to your cart yet. Browse our delicious menu to get started!
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Start Shopping
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Order</CardTitle>
                <CardDescription>Review your items before checkout</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <Image
                      src={item.imageUrl || "/placeholder.svg?height=60&width=60&query=dougie"}
                      alt={item.name}
                      width={60}
                      height={60}
                      className="rounded-lg object-cover"
                    />

                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-1">
            <CheckoutForm
              cart={cart}
              cartTotal={cartTotal}
              onSubmitOrder={handlePlaceOrder}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  )
}
