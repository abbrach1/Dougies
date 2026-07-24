"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/hooks"
import type { Menu, Product, MenuSettings } from "@/lib/types"
import type { AdminPermissions } from "@/lib/admin-permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
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
import { MenuIcon, Plus, Edit, Trash2, Check, Settings, Zap, Package } from "lucide-react"

interface MenuManagementProps {
  permissions: AdminPermissions
}

export default function MenuManagement({ permissions }: MenuManagementProps) {
  const [menus, setMenus] = useState<Menu[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [menuSettings, setMenuSettings] = useState<MenuSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [newMenuForm, setNewMenuForm] = useState({ name: "", description: "" })
  const [editMenuForm, setEditMenuForm] = useState({ name: "", description: "" })
  const { user } = useAuth()
  const { toast } = useToast()

  // Load menus
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "menus"), (snapshot) => {
      const menusData: Menu[] = []
      snapshot.forEach((doc) => {
        menusData.push({ id: doc.id, ...doc.data() } as Menu)
      })
      setMenus(menusData.sort((a, b) => a.name.localeCompare(b.name)))
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Load products
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsData: Product[] = []
      snapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() } as Product)
      })
      setProducts(productsData)
    })

    return () => unsubscribe()
  }, [])

  // Load menu settings
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "activeMenu"), (doc) => {
      if (doc.exists()) {
        setMenuSettings(doc.data() as MenuSettings)
      } else {
        setMenuSettings(null)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleSwitchMenu = async (menuId: string | null) => {
    if (!permissions.editProducts || !user) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to change the active menu.",
        variant: "destructive",
      })
      return
    }

    setSwitching(menuId)
    try {
      await setDoc(doc(db, "settings", "activeMenu"), {
        activeMenuId: menuId,
        lastUpdated: new Date(),
        updatedBy: user.email,
      })

      let menuName = "All Dougies"
      if (menuId === "unassigned") {
        menuName = "Unassigned Dougies"
      } else if (menuId) {
        menuName = menus.find((m) => m.id === menuId)?.name || "Menu"
      }

      toast({
        title: "🎉 Menu Changed!",
        description: `Customers now see: ${menuName}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change menu.",
        variant: "destructive",
      })
    } finally {
      setSwitching(null)
    }
  }

  const handleCreateMenu = async () => {
    if (!permissions.addProducts || !user) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to create menus.",
        variant: "destructive",
      })
      return
    }

    if (!newMenuForm.name.trim()) {
      toast({
        title: "Error",
        description: "Menu name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      await addDoc(collection(db, "menus"), {
        name: newMenuForm.name.trim(),
        description: newMenuForm.description.trim(),
        isActive: false,
        createdAt: new Date(),
        createdBy: user.email,
      })

      toast({
        title: "✅ Menu Created!",
        description: `${newMenuForm.name} has been created.`,
      })

      setNewMenuForm({ name: "", description: "" })
      setCreateDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create menu.",
        variant: "destructive",
      })
    }
  }

  const handleEditMenu = (menu: Menu) => {
    if (!permissions.editProducts) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to edit menus.",
        variant: "destructive",
      })
      return
    }

    setEditingMenu(menu)
    setEditMenuForm({
      name: menu.name,
      description: menu.description,
    })
  }

  const handleUpdateMenu = async () => {
    if (!editingMenu || !permissions.editProducts || !user) return

    try {
      const menuRef = doc(db, "menus", editingMenu.id)
      await updateDoc(menuRef, {
        name: editMenuForm.name.trim(),
        description: editMenuForm.description.trim(),
      })

      toast({
        title: "✅ Menu Updated!",
        description: `${editMenuForm.name} has been updated.`,
      })
      setEditingMenu(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update menu.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMenu = async (menuId: string) => {
    if (!permissions.deleteProducts || !user) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete menus.",
        variant: "destructive",
      })
      return
    }

    // Check if this menu is currently active
    if (menuSettings?.activeMenuId === menuId) {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete the currently active menu. Switch to another menu first.",
        variant: "destructive",
      })
      return
    }

    try {
      // Remove menu assignment from all products
      const productsInMenu = products.filter((p) => p.menuId === menuId)
      for (const product of productsInMenu) {
        const productRef = doc(db, "products", product.id)
        await updateDoc(productRef, {
          menuId: null,
        })
      }

      // Delete the menu
      await deleteDoc(doc(db, "menus", menuId))

      toast({
        title: "🗑️ Menu Deleted",
        description: "Menu has been deleted successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete menu.",
        variant: "destructive",
      })
    }
  }

  const getProductCountForMenu = (menuId: string) => {
    return products.filter((p) => p.menuId === menuId).length
  }

  const getUnassignedProductCount = () => {
    return products.filter((p) => !p.menuId).length
  }

  const getTotalProducts = () => {
    return products.length
  }

  const getCurrentMenuName = () => {
    if (!menuSettings?.activeMenuId) return "All Dougies"
    if (menuSettings.activeMenuId === "unassigned") return "Unassigned Dougies"
    return menus.find((m) => m.id === menuSettings.activeMenuId)?.name || "Unknown Menu"
  }

  const getVisibleProductCount = () => {
    if (!menuSettings?.activeMenuId) return products.length
    if (menuSettings.activeMenuId === "unassigned") return getUnassignedProductCount()
    return products.filter((p) => p.menuId === menuSettings.activeMenuId).length
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Simple Menu Switcher - Main Feature */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Zap className="h-5 w-5" />
            Switch Menu (What Customers See)
          </CardTitle>
          <CardDescription className="text-blue-700">
            Currently showing: <strong>{getCurrentMenuName()}</strong> ({getVisibleProductCount()} dougies visible)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Show All Dougies Option */}
            <Button
              onClick={() => handleSwitchMenu(null)}
              disabled={switching === null}
              variant={!menuSettings?.activeMenuId ? "default" : "outline"}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              {switching === null ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <MenuIcon className="h-5 w-5" />
              )}
              <div className="text-center">
                <div className="font-medium">All Dougies</div>
                <div className="text-xs opacity-75">{getTotalProducts()} total</div>
              </div>
              {!menuSettings?.activeMenuId && (
                <Badge className="bg-green-100 text-green-800 text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
            </Button>

            {/* Unassigned Dougies Option */}
            {getUnassignedProductCount() > 0 && (
              <Button
                onClick={() => handleSwitchMenu("unassigned")}
                disabled={switching === "unassigned"}
                variant={menuSettings?.activeMenuId === "unassigned" ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                {switching === "unassigned" ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <Package className="h-5 w-5" />
                )}
                <div className="text-center">
                  <div className="font-medium">Unassigned Dougies</div>
                  <div className="text-xs opacity-75">{getUnassignedProductCount()} dougies</div>
                </div>
                {menuSettings?.activeMenuId === "unassigned" && (
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
              </Button>
            )}

            {/* Individual Menu Options */}
            {menus.map((menu) => (
              <Button
                key={menu.id}
                onClick={() => handleSwitchMenu(menu.id)}
                disabled={switching === menu.id}
                variant={menuSettings?.activeMenuId === menu.id ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                {switching === menu.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <MenuIcon className="h-5 w-5" />
                )}
                <div className="text-center">
                  <div className="font-medium">{menu.name}</div>
                  <div className="text-xs opacity-75">{getProductCountForMenu(menu.id)} dougies</div>
                </div>
                {menuSettings?.activeMenuId === menu.id && (
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {menus.length === 0 && getUnassignedProductCount() === 0 && (
            <div className="text-center py-8 text-blue-600">
              <MenuIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No custom menus or unassigned dougies</p>
              <p className="text-sm">Create your first menu below to organize dougies</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Menu Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Manage Menus
              </CardTitle>
              <CardDescription>Create and organize your menu collections</CardDescription>
            </div>
            {permissions.addProducts && (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Menu
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Menu</DialogTitle>
                    <DialogDescription>Create a themed collection of dougies</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="menu-name">Menu Name *</Label>
                      <Input
                        id="menu-name"
                        value={newMenuForm.name}
                        onChange={(e) => setNewMenuForm({ ...newMenuForm, name: e.target.value })}
                        placeholder="e.g., Breakfast Special, Holiday Menu"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="menu-description">Description</Label>
                      <Textarea
                        id="menu-description"
                        value={newMenuForm.description}
                        onChange={(e) => setNewMenuForm({ ...newMenuForm, description: e.target.value })}
                        placeholder="Describe this menu..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateMenu}>Create Menu</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {menus.length > 0 ? (
            <div className="space-y-3">
              {menus.map((menu) => (
                <div key={menu.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{menu.name}</h3>
                      {menuSettings?.activeMenuId === menu.id && (
                        <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{menu.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getProductCountForMenu(menu.id)} dougies • Created{" "}
                      {new Date(menu.createdAt.seconds * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {permissions.editProducts && (
                      <Button variant="outline" size="sm" onClick={() => handleEditMenu(menu)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {permissions.deleteProducts && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" disabled={menuSettings?.activeMenuId === menu.id}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Menu</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{menu.name}"? This will unassign all dougies from this
                              menu. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteMenu(menu.id)}>Delete Menu</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MenuIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No menus created yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first menu to organize dougies into themed collections
              </p>
              <p className="text-sm text-muted-foreground">
                Examples: "Breakfast Menu", "Lunch Specials", "Holiday Treats"
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Menu Dialog */}
      <Dialog open={!!editingMenu} onOpenChange={() => setEditingMenu(null)}>
        {editingMenu && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Menu</DialogTitle>
              <DialogDescription>Update menu details for "{editingMenu.name}"</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-menu-name">Menu Name *</Label>
                <Input
                  id="edit-menu-name"
                  value={editMenuForm.name}
                  onChange={(e) => setEditMenuForm({ ...editMenuForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-menu-description">Description</Label>
                <Textarea
                  id="edit-menu-description"
                  value={editMenuForm.description}
                  onChange={(e) => setEditMenuForm({ ...editMenuForm, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMenu(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateMenu}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
