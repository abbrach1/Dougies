"use client"

import { useState, useEffect } from "react"
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Shield, UserPlus, Trash2, SlidersHorizontal } from "lucide-react"
import type { AdminPermissions } from "@/lib/admin-permissions"
import {
  DEFAULT_ADMIN_PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
  PERMISSION_GROUPS,
  SYSTEM_ADMINS,
} from "@/lib/admin-permissions"

interface AdminUser {
  id: string
  email: string
  addedAt?: { seconds: number; nanoseconds: number }
  permissions?: AdminPermissions
}

interface AdminTeamProps {
  /** Only super admins may edit another admin's permissions. */
  canManagePermissions: boolean
}

const TOTAL_PERMISSIONS = Object.keys(DEFAULT_ADMIN_PERMISSIONS).length

/**
 * Unified admin team screen.
 *
 * Replaces the previous pair of components (admin-user-management and
 * admin-permissions-management), which both subscribed to the same
 * `adminUsers` collection, both rendered an overlapping list of admins, and
 * both hardcoded an identical "System Administrators" block.
 */
export default function AdminTeam({ canManagePermissions }: AdminTeamProps) {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [draftPermissions, setDraftPermissions] = useState<AdminPermissions>(DEFAULT_ADMIN_PERMISSIONS)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "adminUsers"), (snapshot) => {
      const data: AdminUser[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AdminUser)
      setAdmins(data.sort((a, b) => a.email.localeCompare(b.email)))
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleAdd = async () => {
    const email = newEmail.trim().toLowerCase()

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast({ title: "Invalid email", description: "Enter a valid email address.", variant: "destructive" })
      return
    }
    if (SYSTEM_ADMINS.includes(email) || admins.some((a) => a.email.toLowerCase() === email)) {
      toast({ title: "Already an admin", description: `${email} already has admin access.`, variant: "destructive" })
      return
    }

    try {
      await addDoc(collection(db, "adminUsers"), {
        email,
        addedBy: user?.email ?? "unknown",
        addedAt: new Date(),
        permissions: DEFAULT_ADMIN_PERMISSIONS,
      })
      toast({ title: "Admin added", description: `${email} can now access the admin portal.` })
      setNewEmail("")
      setAddOpen(false)
    } catch (error) {
      console.error("Error adding admin:", error)
      toast({ title: "Error", description: "Could not add this admin.", variant: "destructive" })
    }
  }

  const handleRemove = async (admin: AdminUser) => {
    try {
      await deleteDoc(doc(db, "adminUsers", admin.id))
      toast({ title: "Admin removed", description: `${admin.email} no longer has admin access.` })
    } catch (error) {
      console.error("Error removing admin:", error)
      toast({ title: "Error", description: "Could not remove this admin.", variant: "destructive" })
    }
  }

  const openPermissions = (admin: AdminUser) => {
    setEditing(admin)
    setDraftPermissions({ ...DEFAULT_ADMIN_PERMISSIONS, ...(admin.permissions || {}) })
  }

  const handleSavePermissions = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await updateDoc(doc(db, "adminUsers", editing.id), { permissions: draftPermissions })
      toast({ title: "Permissions saved", description: `Updated access for ${editing.email}.` })
      setEditing(null)
    } catch (error) {
      console.error("Error saving permissions:", error)
      toast({ title: "Error", description: "Could not save permissions.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const grantedCount = (admin: AdminUser) =>
    Object.values({ ...DEFAULT_ADMIN_PERMISSIONS, ...(admin.permissions || {}) }).filter(Boolean).length

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Team
          </CardTitle>
          <CardDescription>Who can access the admin portal, and what they can do.</CardDescription>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Add an admin</DialogTitle>
              <DialogDescription>
                They&apos;ll get access next time they log in with this email address.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="new-admin-email">Email address</Label>
              <Input
                id="new-admin-email"
                type="email"
                placeholder="name@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd}>Add Admin</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Permanent system admins — always full access, cannot be removed. */}
        {SYSTEM_ADMINS.map((email) => (
          <div key={email} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-4">
            <div className="min-w-0">
              <p className="truncate font-medium">{email}</p>
              <p className="text-sm text-muted-foreground">Owner &middot; full access</p>
            </div>
            <Badge variant="secondary" className="shrink-0">
              Owner
            </Badge>
          </div>
        ))}

        {admins.map((admin) => (
          <div key={admin.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
            <div className="min-w-0">
              <p className="truncate font-medium">{admin.email}</p>
              <p className="text-sm text-muted-foreground">
                {grantedCount(admin)} of {TOTAL_PERMISSIONS} permissions
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {canManagePermissions && (
                <Button variant="outline" size="sm" onClick={() => openPermissions(admin)}>
                  <SlidersHorizontal className="mr-1 h-4 w-4" />
                  Permissions
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove {admin.email}</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove this admin?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {admin.email} will immediately lose access to the admin portal. You can add them back later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleRemove(admin)}>Remove</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}

        {admins.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No additional admins yet. Use &ldquo;Add Admin&rdquo; to give someone access.
          </p>
        )}
      </CardContent>

      {/* Permission editor — a single dialog driven by the selected admin. */}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Permissions</DialogTitle>
            <DialogDescription>{editing?.email}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.label} className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</h4>
                {group.keys.map((key) => (
                  <div key={key} className="flex items-start justify-between gap-4">
                    <Label htmlFor={`perm-${key}`} className="cursor-pointer text-sm font-normal leading-snug">
                      {PERMISSION_DESCRIPTIONS[key]}
                    </Label>
                    <Switch
                      id={`perm-${key}`}
                      checked={draftPermissions[key]}
                      onCheckedChange={(checked) => setDraftPermissions((prev) => ({ ...prev, [key]: checked }))}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleSavePermissions} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
