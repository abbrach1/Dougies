"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { DollarSign, CreditCard, Smartphone, Banknote, HelpCircle } from "lucide-react"
import type { Order } from "@/lib/types"

interface PaymentStatusDialogProps {
  order: Order
  trigger?: React.ReactNode
}

export default function PaymentStatusDialog({ order, trigger }: PaymentStatusDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>(order.paymentMethod || "")
  const [paymentNotes, setPaymentNotes] = useState(order.paymentNotes || "")
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const handleMarkAsPaid = async () => {
    if (!paymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select how the customer paid.",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)
    try {
      const orderRef = doc(db, "orders", order.id)
      await updateDoc(orderRef, {
        paymentStatus: "Paid",
        paymentMethod,
        paymentNotes: paymentNotes.trim() || null,
        paidAt: new Date(),
      })

      toast({
        title: "Payment Recorded! 💰",
        description: `Order #${order.id.substring(0, 6)} marked as paid via ${paymentMethod}.`,
      })
      setIsOpen(false)
    } catch (error) {
      console.error("Error updating payment status:", error)
      toast({
        title: "Error",
        description: "Failed to update payment status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleMarkAsUnpaid = async () => {
    setIsUpdating(true)
    try {
      const orderRef = doc(db, "orders", order.id)
      await updateDoc(orderRef, {
        paymentStatus: "Unpaid",
        paymentMethod: null,
        paymentNotes: null,
        paidAt: null,
      })

      toast({
        title: "Payment Status Updated",
        description: `Order #${order.id.substring(0, 6)} marked as unpaid.`,
      })
      setIsOpen(false)
    } catch (error) {
      console.error("Error updating payment status:", error)
      toast({
        title: "Error",
        description: "Failed to update payment status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "Zelle":
        return <Smartphone className="h-4 w-4" />
      case "Cash":
        return <Banknote className="h-4 w-4" />
      case "Venmo":
        return <CreditCard className="h-4 w-4" />
      default:
        return <HelpCircle className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
            <DollarSign className="h-3 w-3" />
            <Badge variant={order.paymentStatus === "Paid" ? "default" : "destructive"}>{order.paymentStatus}</Badge>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Status - Order #{order.id.substring(0, 6)}
          </DialogTitle>
          <DialogDescription>
            Update the payment status and method for this ${order.total.toFixed(2)} order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="font-medium">Current Status:</span>
            <Badge
              variant={order.paymentStatus === "Paid" ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              {order.paymentStatus === "Paid" && order.paymentMethod && getPaymentIcon(order.paymentMethod)}
              {order.paymentStatus}
              {order.paymentMethod && ` (${order.paymentMethod})`}
            </Badge>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Zelle">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Zelle
                  </div>
                </SelectItem>
                <SelectItem value="Cash">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Cash
                  </div>
                </SelectItem>
                <SelectItem value="Venmo">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Venmo
                  </div>
                </SelectItem>
                <SelectItem value="Other">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Other
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Notes */}
          <div className="space-y-2">
            <Label htmlFor="payment-notes">Payment Notes (Optional)</Label>
            <Textarea
              id="payment-notes"
              placeholder="Add any notes about the payment..."
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              className="min-h-[60px] resize-none"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">{paymentNotes.length}/200 characters</p>
          </div>

          {/* Payment History */}
          {order.paymentStatus === "Paid" && order.paidAt && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">Payment Received</p>
              <p className="text-xs text-green-600">Paid on {new Date(order.paidAt.seconds * 1000).toLocaleString()}</p>
              {order.paymentNotes && <p className="text-xs text-green-600 mt-1">Note: {order.paymentNotes}</p>}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {order.paymentStatus === "Paid" ? (
            <Button
              variant="outline"
              onClick={handleMarkAsUnpaid}
              disabled={isUpdating}
              className="w-full sm:w-auto bg-transparent"
            >
              {isUpdating ? "Updating..." : "Mark as Unpaid"}
            </Button>
          ) : (
            <Button onClick={handleMarkAsPaid} disabled={isUpdating || !paymentMethod} className="w-full sm:w-auto">
              {isUpdating ? "Recording..." : "Mark as Paid"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
