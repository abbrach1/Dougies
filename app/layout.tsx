import type { ReactNode } from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import "./globals.css"
import { AuthProvider } from "@/context/auth-context"
import { CartProvider } from "@/context/cart-context"
import { Toaster } from "@/components/ui/toaster"
import Header from "@/components/header"
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Camp Simcha Dougies",
  description: "Order your favorite Camp Simcha Dougies online!",
  generator: 'v0.app',
}

// Mobile-first viewport. `maximumScale: 5` keeps pinch-zoom available for
// accessibility instead of disabling it.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffffff",
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <div className="flex flex-col min-h-screen">
              <Suspense fallback={<div>Loading...</div>}>
                <Header />
              </Suspense>
              <main className="flex-grow container mx-auto px-4 py-8">
                <Suspense fallback={<div>Loading...</div>}>
                  {children}
                </Suspense>
              </main>
              <footer className="bg-gray-100 dark:bg-gray-800 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                © 2025 Camp Simcha Dougies. All Rights Reserved.
              </footer>
            </div>
            <Toaster />
            <Analytics />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
