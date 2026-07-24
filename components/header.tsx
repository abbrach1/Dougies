"use client"

import Link from "next/link"
import { useAuth, useCart } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ShoppingCart, User, LogOut, Shield, Menu, Home, Receipt } from "lucide-react"
import { useState, useEffect } from "react"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Remove the static ADMIN_EMAILS constant
// const ADMIN_EMAILS = ["abbrachfeld@gmail.com", "dovi@campsimcha.com"]

export default function Header() {
  const { user, loading, logout } = useAuth()
  const { cartCount } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminLoading, setAdminLoading] = useState(true)

  // System admins (permanent)
  const SYSTEM_ADMINS = ["abbrachfeld@gmail.com", "dovi@campsimcha.com"]

  // Check if user is admin (system admin or database admin)
  useEffect(() => {
    if (!user?.email) {
      setIsAdmin(false)
      setAdminLoading(false)
      return
    }

    // Check if user is a system admin first
    if (SYSTEM_ADMINS.includes(user.email)) {
      setIsAdmin(true)
      setAdminLoading(false)
      return
    }

    // Check database for additional admin users
    const unsubscribe = onSnapshot(collection(db, "adminUsers"), (snapshot) => {
      const adminEmails = new Set<string>()
      snapshot.forEach((doc) => {
        const data = doc.data()
        if (data.email) {
          adminEmails.add(data.email.toLowerCase())
        }
      })

      setIsAdmin(adminEmails.has(user.email!.toLowerCase()))
      setAdminLoading(false)
    })

    return () => unsubscribe()
  }, [user?.email])

  const NavItems = () => (
    <>
      <Button variant="ghost" size="sm" asChild onClick={() => setIsOpen(false)}>
        <Link href="/" className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          <span className="sm:hidden">Home</span>
        </Link>
      </Button>

      <Button variant="ghost" size="sm" asChild onClick={() => setIsOpen(false)}>
        <Link href="/cart" className="flex items-center gap-2 relative">
          <ShoppingCart className="h-4 w-4" />
          <span className="sm:hidden">Cart</span>
          {cartCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {cartCount}
            </Badge>
          )}
        </Link>
      </Button>

      {!loading && !adminLoading && (
        <>
          {user ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              {/* Add My Orders link for logged-in users */}
              <Button variant="ghost" size="sm" asChild onClick={() => setIsOpen(false)}>
                <Link href="/my-orders" className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  <span className="sm:hidden">My Orders</span>
                </Link>
              </Button>

              {isAdmin && (
                <Button variant="ghost" size="sm" asChild onClick={() => setIsOpen(false)}>
                  <Link href="/admin" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin
                  </Link>
                </Button>
              )}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="text-sm font-medium hidden lg:inline">{user.displayName || user.email}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logout()
                    setIsOpen(false)
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <Button asChild onClick={() => setIsOpen(false)}>
              <Link href="/login" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </>
      )}
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
        >
          Camp Simcha <span className="text-primary">Dougies</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          <NavItems />
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Menu className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs"
                  >
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-4 mt-8">
                <div className="text-lg font-semibold mb-4">Navigation</div>
                <NavItems />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
