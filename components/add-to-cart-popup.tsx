"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, ArrowRight, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { Product } from "@/lib/types"

interface AddToCartPopupProps {
  isOpen: boolean
  onClose: () => void
  addedItem: Product | null
  cartCount: number
  cartTotal: number
}

export default function AddToCartPopup({ isOpen, onClose, addedItem, cartCount, cartTotal }: AddToCartPopupProps) {
  const router = useRouter()
  const [isClosing, setIsClosing] = useState(false)

  // Auto-close after 5 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        handleClose()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 200)
  }

  const handleCheckout = () => {
    handleClose()
    router.push("/cart")
  }

  const handleContinueShopping = () => {
    handleClose()
  }

  if (!addedItem) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <ShoppingCart className="h-5 w-5" />
            Added to Cart!
          </DialogTitle>
          <DialogDescription>Item successfully added to your cart</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Added Item Display */}
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Image
              src={addedItem.imageUrl || "/placeholder.svg?height=60&width=60&query=dougie"}
              alt={addedItem.name}
              width={60}
              height={60}
              className="rounded-md object-cover"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{addedItem.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{addedItem.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  ${addedItem.price.toFixed(2)}
                </Badge>
                <span className="text-xs text-muted-foreground">Qty: 1</span>
              </div>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <div className="text-sm">
              <p className="font-medium">Cart Total</p>
              <p className="text-xs text-muted-foreground">
                {cartCount} item{cartCount > 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">${cartTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleContinueShopping} className="w-full sm:w-auto bg-transparent">
            <Plus className="mr-2 h-4 w-4" />
            Continue Shopping
          </Button>
          <Button onClick={handleCheckout} className="w-full sm:w-auto">
            <ArrowRight className="mr-2 h-4 w-4" />
            Checkout ({cartCount})
          </Button>
        </DialogFooter>

        {/* Auto-close indicator */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">This popup will close automatically in 5 seconds</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
