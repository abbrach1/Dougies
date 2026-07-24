"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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
import { Separator } from "@/components/ui/separator"
import { Settings, Shield, Users, Save, Edit } from "lucide-react"
import type { AdminPermissions } from "@/lib/admin-permissions"
import { DEFAULT_ADMIN_PERMISSIONS, PERMISSION_DESCRIPTIONS } from "@/lib/admin-permissions"

interface AdminUser {
  id: string
  email: string
  addedBy: string
  addedAt: {
    seconds: number
    nanoseconds: number
  }
  permissions?: AdminPermissions
}

export default function AdminPermissionsManagement() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editPermissions, setEditPermissions] = useState<AdminPermissions>(DEFAULT_ADMIN_PERMISSIONS)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "adminUsers"), (snapshot) => {
      const adminsData: AdminUser[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        adminsData.push({
          id: doc.id,
          ...data,
          permissions: data.permissions || DEFAULT_ADMIN_PERMISSIONS,
        } as AdminUser)
      })
      // Sort by most recently added
      adminsData.sort((a, b) => b.addedAt.seconds - a.addedAt.seconds)
      setAdminUsers(adminsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleEditPermissions = (user: AdminUser) => {
    setEditingUser(user)
    setEditPermissions(user.permissions || DEFAULT_ADMIN_PERMISSIONS)
  }

  const handleUpdatePermissions = async () => {
    if (!editingUser) return

    setIsUpdating(true)
    try {
      const userRef = doc(db, "adminUsers", editingUser.id)
      await updateDoc(userRef, {
        permissions: editPermissions,
        lastUpdated: new Date(),
      })

      toast({
        title: "Permissions Updated! ✅",
        description: `Permissions for ${editingUser.email} have been updated successfully.`,
      })

      setEditingUser(null)
    } catch (error) {
      console.error("Error updating permissions:", error)
      toast({
        title: "Error",
        description: "Failed to update permissions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const updatePermission = (key: keyof AdminPermissions, value: boolean) => {
    setEditPermissions((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const getPermissionCount = (permissions: AdminPermissions) => {
    return Object.values(permissions).filter(Boolean).length
  }

  const getTotalPermissions = () => {
    return Object.keys(DEFAULT_ADMIN_PERMISSIONS).length
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Admin Permissions Management
        </CardTitle>
        <CardDescription>
          Configure what each admin user can access and modify. Only super admins can change permissions.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* System Admins Info */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            System Administrators (Full Access)
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="font-medium">abbrachfeld@gmail.com</span>
                <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                  Super Admin
                </Badge>
              </div>
              <Badge variant="secondary" className="text-xs">
                All Permissions ({getTotalPermissions()}/{getTotalPermissions()})
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="font-medium">dovi@campsimcha.com</span>
                <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                  Super Admin
                </Badge>
              </div>
              <Badge variant="secondary" className="text-xs">
                All Permissions ({getTotalPermissions()}/{getTotalPermissions()})
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Regular Admin Users */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Admin Users ({adminUsers.length})
          </h4>

          {adminUsers.length > 0 ? (
            <div className="space-y-3">
              {adminUsers.map((adminUser) => {
                const permissions = adminUser.permissions || DEFAULT_ADMIN_PERMISSIONS
                const permissionCount = getPermissionCount(permissions)
                const totalPermissions = getTotalPermissions()

                return (
                  <div key={adminUser.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{adminUser.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Added {new Date(adminUser.addedAt.seconds * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge
                          variant={permissionCount === totalPermissions ? "default" : "secondary"}
                          className="mb-1"
                        >
                          {permissionCount}/{totalPermissions} Permissions
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {permissionCount === totalPermissions
                            ? "Full Access"
                            : permissionCount > totalPermissions / 2
                              ? "Most Access"
                              : "Limited Access"}
                        </p>
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPermissions(adminUser)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-3 w-3" />
                            Edit Permissions
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Settings className="h-5 w-5" />
                              Edit Permissions - {editingUser?.email}
                            </DialogTitle>
                            <DialogDescription>
                              Configure what this admin user can access and modify in the system.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-6 py-4">
                            {/* Order Management */}
                            <div className="space-y-4">
                              <h3 className="font-semibold text-lg">Order Management</h3>
                              <div className="grid gap-4">
                                {(
                                  [
                                    "viewOrders",
                                    "markOrdersArrived",
                                    "deleteOrders",
                                    "createManualOrders",
                                    "updatePaymentStatus",
                                  ] as const
                                ).map((permission) => (
                                  <div key={permission} className="flex items-center justify-between">
                                    <div className="space-y-1">
                                      <Label htmlFor={permission} className="font-medium">
                                        {PERMISSION_DESCRIPTIONS[permission]}
                                      </Label>
                                    </div>
                                    <Switch
                                      id={permission}
                                      checked={editPermissions[permission]}
                                      onCheckedChange={(checked) => updatePermission(permission, checked)}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            <Separator />

                            {/* Product Management */}
                            <div className="space-y-4">
                              <h3 className="font-semibold text-lg">Product Management</h3>
                              <div className="grid gap-4">
                                {(["viewProducts", "addProducts", "editProducts", "deleteProducts"] as const).map(
                                  (permission) => (
                                    <div key={permission} className="flex items-center justify-between">
                                      <div className="space-y-1">
                                        <Label htmlFor={permission} className="font-medium">
                                          {PERMISSION_DESCRIPTIONS[permission]}
                                        </Label>
                                      </div>
                                      <Switch
                                        id={permission}
                                        checked={editPermissions[permission]}
                                        onCheckedChange={(checked) => updatePermission(permission, checked)}
                                      />
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>

                            <Separator />

                            {/* System Settings */}
                            <div className="space-y-4">
                              <h3 className="font-semibold text-lg">System Settings</h3>
                              <div className="grid gap-4">
                                {(["manageOrderTiming", "manageAdminUsers", "viewAnalytics"] as const).map(
                                  (permission) => (
                                    <div key={permission} className="flex items-center justify-between">
                                      <div className="space-y-1">
                                        <Label htmlFor={permission} className="font-medium">
                                          {PERMISSION_DESCRIPTIONS[permission]}
                                        </Label>
                                      </div>
                                      <Switch
                                        id={permission}
                                        checked={editPermissions[permission]}
                                        onCheckedChange={(checked) => updatePermission(permission, checked)}
                                      />
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>

                            {/* Note about super admin permissions */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-sm text-blue-800">
                                <strong>Note:</strong> Permission management is reserved for super administrators only.
                                Regular admins cannot modify permissions.
                              </p>
                            </div>
                          </div>

                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingUser(null)}>
                              Cancel
                            </Button>
                            <Button onClick={handleUpdatePermissions} disabled={isUpdating}>
                              {isUpdating ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  Save Permissions
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No additional admin users to configure.</p>
              <p className="text-sm text-muted-foreground mt-1">Add admin users to configure their permissions.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
