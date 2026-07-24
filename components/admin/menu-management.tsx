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
import { MenuIcon, Plus, Edit, Trash2, Check } from "lucide-react"

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

  /**
   * One row per menu option, combining "make this live" with edit/delete.
   * Previously every menu was rendered twice — once as a switcher tile and
   * again as a management row — which doubled the page and the reading work.
   */
  const MenuRow = ({
    id,
    name,
    description,
    count,
    menu,
  }: {
    id: string | null
    name: string
    description?: string
    count: number
    menu?: Menu
  }) => {
    const isActive = (menuSettings?.activeMenuId ?? null) === id

    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 ${
          isActive ? "border-primary bg-primary/5" : ""
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{name}</h3>
            {isActive && (
              <Badge className="gap-1">
                <Check className="h-3 w-3" />
                Live
              </Badge>
            )}
          </div>
          {description && <p className="truncate text-sm text-muted-foreground">{description}</p>}
          <p className="mt-1 text-xs text-muted-foreground">{count} dougies</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!isActive && permissions.editProducts && (
            <Button size="sm" variant="outline" onClick={() => handleSwitchMenu(id)} disabled={switching === id}>
              {switching === id ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
              ) : (
                "Make Live"
              )}
            </Button>
          )}

          {menu && permissions.editProducts && (
            <Button variant="ghost" size="sm" onClick={() => handleEditMenu(menu)}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit {name}</span>
            </Button>
          )}

          {menu && permissions.deleteProducts && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isActive} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete {name}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this menu?</AlertDialogTitle>
                  <AlertDialogDescription>
                    &ldquo;{name}&rdquo; will be deleted and its dougies become unassigned. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteMenu(menu.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MenuIcon className="h-5 w-5" />
              What Customers See
            </CardTitle>
            <CardDescription>
              Showing <strong>{getCurrentMenuName()}</strong> &middot; {getVisibleProductCount()} dougies live
            </CardDescription>
          </div>

          {permissions.addProducts && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  New Menu
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a menu</DialogTitle>
                  <DialogDescription>Group dougies into a themed collection.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="menu-name">Name *</Label>
                    <Input
                      id="menu-name"
                      value={newMenuForm.name}
                      onChange={(e) => setNewMenuForm({ ...newMenuForm, name: e.target.value })}
                      placeholder="e.g., Breakfast Special"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="menu-description">Description</Label>
                    <Textarea
                      id="menu-description"
                      value={newMenuForm.description}
                      onChange={(e) => setNewMenuForm({ ...newMenuForm, description: e.target.value })}
                      rows={2}
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
        </CardHeader>

        <CardContent className="space-y-3">
          <MenuRow id={null} name="All Dougies" description="Every dougie, regardless of menu" count={getTotalProducts()} />

          {getUnassignedProductCount() > 0 && (
            <MenuRow
              id="unassigned"
              name="Unassigned Only"
              description="Dougies not in any menu"
              count={getUnassignedProductCount()}
            />
          )}

          {menus.map((menu) => (
            <MenuRow
              key={menu.id}
              id={menu.id}
              name={menu.name}
              description={menu.description}
              count={getProductCountForMenu(menu.id)}
              menu={menu}
            />
          ))}
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
