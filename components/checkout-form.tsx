"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { User, Mail, Phone, MessageSquare, AlertCircle, CreditCard, Smartphone } from "lucide-react"
import type { CartItem } from "@/lib/types"

interface CheckoutFormProps {
  cart: CartItem[]
  cartTotal: number
  onSubmitOrder: (orderInfo: OrderInfo) => Promise<void>
  isSubmitting: boolean
}

export interface OrderInfo {
  customerName: string
  customerEmail: string
  customerPhone: string
  specialInstructions?: string
}

export default function CheckoutForm({ cart, cartTotal, onSubmitOrder, isSubmitting }: CheckoutFormProps) {
  const [formData, setFormData] = useState<OrderInfo>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    specialInstructions: "",
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const { toast } = useToast()

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    // Name validation
    if (!formData.customerName.trim()) {
      newErrors.customerName = "Full name is required"
    } else if (formData.customerName.trim().length < 2) {
      newErrors.customerName = "Name must be at least 2 characters"
    }

    // Email validation
    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = "Email address is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      newErrors.customerEmail = "Please enter a valid email address"
    }

    // Phone validation
    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = "Phone number is required"
    } else if (!/^[+]?[1-9][\d]{0,15}$/.test(formData.customerPhone.replace(/[\s\-$$$$]/g, ""))) {
      newErrors.customerPhone = "Please enter a valid phone number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Please fix the errors",
        description: "Check the form fields and try again.",
        variant: "destructive",
      })
      return
    }

    try {
      await onSubmitOrder({
        ...formData,
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerPhone: formData.customerPhone.trim(),
      })
    } catch (error) {
      console.error("Checkout error:", error)
    }
  }

  const handleInputChange = (field: keyof OrderInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Payment Instructions */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Smartphone className="h-5 w-5" />
            Payment Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <div className="font-semibold">Send Payment to Kobe ASAP</div>
              <div className="font-semibold">Zelle: +1 (929) 283-1714</div>
              <div className="text-sm">
                Please send <span className="font-semibold">${cartTotal.toFixed(2)}</span> via Zelle after placing your
                order.
              </div>
            </AlertDescription>
          </Alert>
          <div className="text-xs text-muted-foreground">
            Your order will be confirmed once payment is received. Please include your order number in the Zelle memo.
          </div>
        </CardContent>
      </Card>

      {/* Customer Information Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Information
          </CardTitle>
          <CardDescription>Please provide your contact details for order confirmation and pickup.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="customerName">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="customerName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange("customerName", e.target.value)}
                    className={`pl-10 ${errors.customerName ? "border-red-500" : ""}`}
                    required
                  />
                </div>
                {errors.customerName && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.customerName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="customerEmail">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.customerEmail}
                    onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                    className={`pl-10 ${errors.customerEmail ? "border-red-500" : ""}`}
                    required
                  />
                </div>
                {errors.customerEmail && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.customerEmail}
                  </p>
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="customerPhone">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customerPhone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.customerPhone}
                  onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                  className={`pl-10 ${errors.customerPhone ? "border-red-500" : ""}`}
                  required
                />
              </div>
              {errors.customerPhone && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.customerPhone}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                We'll use this number to contact you about your order status and pickup.
              </p>
            </div>

            {/* Special Instructions */}
            <div className="space-y-2">
              <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="specialInstructions"
                  placeholder="Any special requests or dietary restrictions..."
                  value={formData.specialInstructions}
                  onChange={(e) => handleInputChange("specialInstructions", e.target.value)}
                  className="pl-10 min-h-[80px] resize-none"
                  maxLength={500}
                />
              </div>
              <p className="text-xs text-muted-foreground">{formData.specialInstructions.length}/500 characters</p>
            </div>

            {/* Order Summary */}
            <div className="border-t pt-4 space-y-2">
              <h3 className="font-semibold">Order Summary</h3>
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between items-center font-semibold text-lg">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Placing Order...
                </>
              ) : (
                "Place Order"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
