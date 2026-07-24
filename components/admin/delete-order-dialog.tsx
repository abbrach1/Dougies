"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { doc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Trash2, AlertTriangle, DollarSign } from "lucide-react"
import type { Order } from "@/lib/types"

interface DeleteOrderDialogProps {
  order: Order
  trigger?: React.ReactNode
}

function DeleteOrderDialog({ order, trigger }: DeleteOrderDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDeleteOrder = async () => {
    setIsDeleting(true)
    try {
      await deleteDoc(doc(db, "orders", order.id))

      toast({
        title: "Order Deleted Successfully",
        description: `Order #${order.id.substring(0, 6)} has been permanently deleted.`,
      })
    } catch (error) {
      console.error("Error deleting order:", error)
      toast({
        title: "Error",
        description: "Failed to delete order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive bg-transparent">
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Order #{order.id.substring(0, 6)}?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div>Are you sure you want to permanently delete this order? This action cannot be undone.</div>

            {/* Order Summary */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Customer:</span>
                <span>{order.userName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Email:</span>
                <span className="text-sm">{order.userEmail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Total:</span>
                <span className="font-semibold">${order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Status:</span>
                <div className="flex gap-1">
                  <Badge variant={order.status === "Placed" ? "default" : "secondary"}>{order.status}</Badge>
                  <Badge variant={order.paymentStatus === "Paid" ? "default" : "destructive"}>
                    <DollarSign className="h-3 w-3 mr-1" />
                    {order.paymentStatus}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Items:</span>
                <span>
                  {order.items.length} item{order.items.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Warning for paid orders */}
            {order.paymentStatus === "Paid" && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-semibold">Warning: This order has been paid</span>
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  Deleting a paid order will remove all payment records. Consider keeping the order for accounting
                  purposes.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteOrder}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Order
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteOrderDialog
