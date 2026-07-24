"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { UserPlus, Shield, Trash2, Mail, Users, AlertCircle } from "lucide-react"

interface AdminUser {
  id: string
  email: string
  addedBy: string
  addedAt: {
    seconds: number
    nanoseconds: number
  }
}

export default function AdminUserManagement() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailError, setEmailError] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "adminUsers"), (snapshot) => {
      const adminsData: AdminUser[] = []
      snapshot.forEach((doc) => {
        adminsData.push({ id: doc.id, ...doc.data() } as AdminUser)
      })
      // Sort by most recently added
      adminsData.sort((a, b) => b.addedAt.seconds - a.addedAt.seconds)
      setAdminUsers(adminsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      return "Email address is required"
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return "Please enter a valid email address"
    }
    if (adminUsers.some((admin) => admin.email.toLowerCase() === email.toLowerCase())) {
      return "This email is already an admin user"
    }
    return ""
  }

  const handleAddAdmin = async () => {
    const error = validateEmail(newAdminEmail)
    if (error) {
      setEmailError(error)
      return
    }

    setIsSubmitting(true)
    try {
      // Use email as document ID for easy lookup
      const adminDocId = newAdminEmail.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_")

      await setDoc(doc(db, "adminUsers", adminDocId), {
        email: newAdminEmail.toLowerCase().trim(),
        addedBy: "current-admin", // In a real app, this would be the current user's email
        addedAt: new Date(),
      })

      toast({
        title: "Admin Added Successfully! 👑",
        description: `${newAdminEmail} has been added as an admin user.`,
      })

      setNewAdminEmail("")
      setEmailError("")
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Error adding admin:", error)
      toast({
        title: "Error",
        description: "Failed to add admin user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveAdmin = async (adminUser: AdminUser) => {
    try {
      await deleteDoc(doc(db, "adminUsers", adminUser.id))

      toast({
        title: "Admin Removed",
        description: `${adminUser.email} has been removed from admin users.`,
      })
    } catch (error) {
      console.error("Error removing admin:", error)
      toast({
        title: "Error",
        description: "Failed to remove admin user. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (value: string) => {
    setNewAdminEmail(value)
    if (emailError) {
      setEmailError("")
    }
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
          <Users className="h-5 w-5" />
          Admin User Management
        </CardTitle>
        <CardDescription>Manage admin users who can access the admin dashboard and manage orders.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Add Admin Button */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              {adminUsers.length} admin user{adminUsers.length !== 1 ? "s" : ""} currently active
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Admin User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Add New Admin User
                </DialogTitle>
                <DialogDescription>
                  Enter the email address of the user you want to grant admin access to.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={newAdminEmail}
                      onChange={(e) => handleInputChange(e.target.value)}
                      className={`pl-10 ${emailError ? "border-red-500" : ""}`}
                    />
                  </div>
                  {emailError && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {emailError}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> The user must create an account with this email address to access admin
                    features.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setNewAdminEmail("")
                    setEmailError("")
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddAdmin} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Admin
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Admin Users List */}
        {adminUsers.length > 0 ? (
          <div className="space-y-3">
            {adminUsers.map((adminUser) => (
              <div key={adminUser.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{adminUser.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Added {new Date(adminUser.addedAt.seconds * 1000).toLocaleDateString()}
                      {adminUser.addedBy && ` by ${adminUser.addedBy}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Badge>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Admin Access?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove admin access for <strong>{adminUser.email}</strong>? They will
                          no longer be able to access the admin dashboard or manage orders.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveAdmin(adminUser)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remove Admin
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No additional admin users added yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Add admin users to help manage the system.</p>
          </div>
        )}

        {/* Current System Admins Info */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
            System Administrators
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-green-600" />
              <span>abbrachfeld@gmail.com</span>
              <Badge variant="outline" className="text-xs">
                System Admin
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-green-600" />
              <span>dovi@campsimcha.com</span>
              <Badge variant="outline" className="text-xs">
                System Admin
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            System administrators have permanent access and cannot be removed.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
