"use client"

import { useState, useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { collection, addDoc, onSnapshot, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Minus, Trash2, ShoppingCart, AlertCircle } from "lucide-react"
import Image from "next/image"
import type { Product, CartItem } from "@/lib/types"

type FormValues = {
  customerName: string
  customerEmail: string
  customerPhone: string
  specialInstructions: string
  paymentStatus: "Paid" | "Unpaid"
  paymentMethod?: "Zelle" | "Cash" | "Venmo" | "Other"
  paymentNotes?: string
}

interface ManualOrderFormProps {
  /** Called after the order is created, so a hosting dialog can close. */
  onSuccess?: () => void
}

export default function ManualOrderForm({ onSuccess }: ManualOrderFormProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [orderItems, setOrderItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      paymentStatus: "Unpaid",
    },
  })

  const paymentStatus = watch("paymentStatus")

  // Load products - only show available products
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsData: Product[] = []
      snapshot.forEach((doc) => {
        const product = { id: doc.id, ...doc.data() } as Product
        // Only include available products
        if (product.available !== false) {
          productsData.push(product)
        }
      })
      setProducts(productsData.sort((a, b) => a.name.localeCompare(b.name)))
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const addItemToOrder = (product: Product) => {
    setOrderItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id)
      if (existingItem) {
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeItemFromOrder(productId)
      return
    }
    setOrderItems((prev) => prev.map((item) => (item.id === productId ? { ...item, quantity } : item)))
  }

  const removeItemFromOrder = (productId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== productId))
  }

  const orderTotal = orderItems.reduce((total, item) => total + item.price * item.quantity, 0)

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (orderItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please add at least one item to the order.",
        variant: "destructive",
      })
      return
    }

    try {
      // Create order data with proper structure
      const orderData = {
        userId: "admin-manual-order",
        userEmail: data.customerEmail.toLowerCase().trim(),
        userName: data.customerName.trim(),
        userPhone: data.customerPhone.trim(),
        specialInstructions: data.specialInstructions?.trim() || "",
        items: orderItems,
        total: orderTotal,
        status: "Placed",
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentStatus === "Paid" ? data.paymentMethod : null,
        paymentNotes: data.paymentStatus === "Paid" ? data.paymentNotes?.trim() || null : null,
        paidAt: data.paymentStatus === "Paid" ? Timestamp.now() : null,
        createdAt: Timestamp.now(),
        isManualOrder: true, // Flag to identify manual orders
      }

      // Add to Firestore
      const docRef = await addDoc(collection(db, "orders"), orderData)

      // Send confirmation emails using the server action
      try {
        const { placeOrder } = await import("@/app/actions")
        await placeOrder({
          userId: "admin-manual-order",
          userEmail: data.customerEmail.toLowerCase().trim(),
          userName: data.customerName.trim(),
          userPhone: data.customerPhone.trim(),
          specialInstructions: data.specialInstructions?.trim() || "",
          items: orderItems,
          total: orderTotal,
          paymentStatus: data.paymentStatus,
        })
      } catch (emailError) {
        console.error("Error sending confirmation emails:", emailError)
        // Don't fail the order creation if emails fail
        toast({
          title: "Order Created! ⚠️",
          description: `Manual order for ${data.customerName} has been created, but confirmation emails may not have been sent.`,
        })
      }

      toast({
        title: "Order Created Successfully! 🎉",
        description: `Manual order for ${data.customerName} has been created and confirmation emails sent.`,
      })

      // Reset form
      reset()
      setOrderItems([])
      onSuccess?.()
    } catch (error) {
      console.error("Error creating manual order:", error)
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">
                    Customer Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    placeholder="Enter customer's full name"
                    {...register("customerName", { required: "Customer name is required" })}
                  />
                  {errors.customerName && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.customerName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="customer@example.com"
                    {...register("customerEmail", {
                      required: "Email is required",
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: "Please enter a valid email address",
                      },
                    })}
                  />
                  {errors.customerEmail && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.customerEmail.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    {...register("customerPhone", { required: "Phone number is required" })}
                  />
                  {errors.customerPhone && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.customerPhone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialInstructions">Special Instructions</Label>
                  <Textarea
                    id="specialInstructions"
                    placeholder="Any special requests..."
                    className="min-h-[80px]"
                    {...register("specialInstructions")}
                  />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select
                    value={paymentStatus}
                    onValueChange={(value: "Paid" | "Unpaid") => setValue("paymentStatus", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentStatus === "Paid" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select onValueChange={(value) => setValue("paymentMethod", value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Zelle">Zelle</SelectItem>
                          <SelectItem value="Venmo">Venmo</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentNotes">Payment Notes</Label>
                      <Input id="paymentNotes" placeholder="Payment reference, etc." {...register("paymentNotes")} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Order Items</h3>
                {orderItems.length > 0 && (
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    Total: ${orderTotal.toFixed(2)}
                  </Badge>
                )}
              </div>

              {/* Current Order Items */}
              {orderItems.length > 0 && (
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium">Current Order:</h4>
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-background rounded">
                      <div className="flex items-center gap-3">
                        <Image
                          src={item.imageUrl || "/placeholder.svg?height=32&width=32&query=dougie"}
                          alt={item.name}
                          width={32}
                          height={32}
                          className="rounded"
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <span className="w-16 text-right">${(item.price * item.quantity).toFixed(2)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItemFromOrder(item.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Available Products */}
              <div className="space-y-2">
                <h4 className="font-medium">Add Items:</h4>
                {products.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No products available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {products.map((product) => (
                      <div key={product.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Image
                            src={product.imageUrl || "/placeholder.svg?height=40&width=40&query=dougie"}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">${product.price.toFixed(2)}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addItemToOrder(product)}
                          className="w-full"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

      {/* Submit Button */}
      <div className="border-t pt-4">
        <Button type="submit" disabled={isSubmitting || orderItems.length === 0} size="lg" className="w-full">
          {isSubmitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              Creating Order...
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Create Order (${orderTotal.toFixed(2)})
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
