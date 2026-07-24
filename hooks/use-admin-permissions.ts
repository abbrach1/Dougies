"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/hooks"
import type { AdminPermissions } from "@/lib/admin-permissions"
import { DEFAULT_ADMIN_PERMISSIONS, SUPER_ADMIN_PERMISSIONS, isSystemAdmin } from "@/lib/admin-permissions"

/**
 * Single source of truth for "is this user an admin, and what may they do?".
 *
 * Previously the admin check was duplicated in the header and the admin page
 * (each with its own Firestore subscription), and permissions were looked up
 * by a slugified document ID that never matched the auto-generated IDs used
 * when admins are created — so saved permissions were silently ignored.
 * This hook matches admin records by email, the same way they are written.
 */
export function useAdminPermissions() {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<AdminPermissions>(DEFAULT_ADMIN_PERMISSIONS)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.email) {
      setPermissions(DEFAULT_ADMIN_PERMISSIONS)
      setIsAdmin(false)
      setIsSuperAdmin(false)
      setIsLoading(false)
      return
    }

    // System admins always get full access without a database lookup.
    if (isSystemAdmin(user.email)) {
      setPermissions(SUPER_ADMIN_PERMISSIONS)
      setIsAdmin(true)
      setIsSuperAdmin(true)
      setIsLoading(false)
      return
    }

    const email = user.email.toLowerCase()
    const unsubscribe = onSnapshot(
      collection(db, "adminUsers"),
      (snapshot) => {
        const record = snapshot.docs.find((doc) => (doc.data().email || "").toLowerCase() === email)

        setIsAdmin(Boolean(record))
        setIsSuperAdmin(false)
        setPermissions(record ? { ...DEFAULT_ADMIN_PERMISSIONS, ...(record.data().permissions || {}) } : DEFAULT_ADMIN_PERMISSIONS)
        setIsLoading(false)
      },
      (error) => {
        console.error("Error fetching admin permissions:", error)
        setPermissions(DEFAULT_ADMIN_PERMISSIONS)
        setIsAdmin(false)
        setIsSuperAdmin(false)
        setIsLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user?.email])

  return {
    permissions,
    isAdmin,
    isSuperAdmin,
    isLoading,
    hasPermission: (permission: keyof AdminPermissions) => permissions[permission],
  }
}
