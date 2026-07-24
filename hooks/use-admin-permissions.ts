"use client"

import { useState, useEffect } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/hooks"
import type { AdminPermissions } from "@/lib/admin-permissions"
import { DEFAULT_ADMIN_PERMISSIONS, SUPER_ADMIN_PERMISSIONS } from "@/lib/admin-permissions"

export function useAdminPermissions() {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<AdminPermissions>(DEFAULT_ADMIN_PERMISSIONS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  const SYSTEM_ADMINS = ["abbrachfeld@gmail.com", "dovi@campsimcha.com"]

  useEffect(() => {
    if (!user?.email) {
      setPermissions(DEFAULT_ADMIN_PERMISSIONS)
      setIsSuperAdmin(false)
      setIsLoading(false)
      return
    }

    // Check if user is a system admin (super admin)
    if (SYSTEM_ADMINS.includes(user.email)) {
      setPermissions(SUPER_ADMIN_PERMISSIONS)
      setIsSuperAdmin(true)
      setIsLoading(false)
      return
    }

    // Check database for admin user permissions
    const adminDocId = user.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_")
    const unsubscribe = onSnapshot(
      doc(db, "adminUsers", adminDocId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          setPermissions(data.permissions || DEFAULT_ADMIN_PERMISSIONS)
          setIsSuperAdmin(false)
        } else {
          // User is not an admin
          setPermissions(DEFAULT_ADMIN_PERMISSIONS)
          setIsSuperAdmin(false)
        }
        setIsLoading(false)
      },
      (error) => {
        console.error("Error fetching admin permissions:", error)
        setPermissions(DEFAULT_ADMIN_PERMISSIONS)
        setIsSuperAdmin(false)
        setIsLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user?.email])

  return {
    permissions,
    isSuperAdmin,
    isLoading,
    hasPermission: (permission: keyof AdminPermissions) => permissions[permission],
  }
}
