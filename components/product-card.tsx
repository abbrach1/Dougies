"use client"

import { useState } from "react"
import Image from "next/image"
import type { Product } from "@/lib/types"
import { useCart, useAuth } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import AddToCartPopup from "./add-to-cart-popup"

interface ProductCardProps {
  product: Product
  isOrderingOpen?: boolean
}

export default function ProductCard({ product, isOrderingOpen = true }: ProductCardProps) {
  const { cart, addToCart, cartCount, cartTotal } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [showPopup, setShowPopup] = useState(false)
  const [addedItem, setAddedItem] = useState<Product | null>(null)

  const handleAddToCart = () => {
    if (!isOrderingOpen) {
      toast({
        title: "Ordering Closed",
        description: "Orders are currently closed. Please check the ordering hours.",
        variant: "destructive",
      })
      return
    }

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to add items to your cart.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    // Add to cart
    addToCart({ ...product, quantity: 1 })

    // Show popup
    setAddedItem(product)
    setShowPopup(true)
  }

  return (
    <>
      <Card
        className={`group hover:shadow-lg transition-all duration-300 border-0 shadow-md hover:shadow-xl hover:-translate-y-1 ${!isOrderingOpen ? "opacity-60" : ""}`}
      >
        <CardHeader className="p-0">
          <div className="relative w-full h-48 overflow-hidden rounded-t-xl">
            <Image
              src={product.imageUrl || "/placeholder.svg?height=192&width=300&query=delicious+food"}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-white/90 text-black">
                ${product.price.toFixed(2)}
              </Badge>
            </div>
            {!isOrderingOpen && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Ordering Closed
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-2">
          <CardTitle className="text-lg leading-tight">{product.name}</CardTitle>
          <CardDescription className="text-sm line-clamp-2">{product.description}</CardDescription>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button
            className="w-full group-hover:bg-primary/90 transition-colors"
            onClick={handleAddToCart}
            disabled={!isOrderingOpen}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isOrderingOpen ? "Add to Cart" : "Ordering Closed"}
          </Button>
        </CardFooter>
      </Card>

      {/* Add to Cart Popup */}
      <AddToCartPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        addedItem={addedItem}
        cartCount={cartCount}
        cartTotal={cartTotal}
      />
    </>
  )
}
