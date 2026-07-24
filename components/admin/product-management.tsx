"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Product, Menu } from "@/lib/types"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Trash2, Package, Search, Filter } from "lucide-react"
import Image from "next/image"

interface ProductManagementProps {
  permissions: AdminPermissions
}

export default function ProductManagement({ permissions }: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMenuFilter, setSelectedMenuFilter] = useState<string>("all")
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editForm, setEditForm] = useState({ name: "", description: "", price: 0, imageUrl: "", menuId: "unassigned" })
  const { toast } = useToast()

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsData: Product[] = []
      snapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() } as Product)
      })
      setProducts(productsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Load menus
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "menus"), (snapshot) => {
      const menusData: Menu[] = []
      snapshot.forEach((doc) => {
        menusData.push({ id: doc.id, ...doc.data() } as Menu)
      })
      setMenus(menusData)
    })

    return () => unsubscribe()
  }, [])

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesMenu =
      selectedMenuFilter === "all" ||
      (selectedMenuFilter === "unassigned" && !product.menuId) ||
      product.menuId === selectedMenuFilter

    return matchesSearch && matchesMenu
  })

  const handleEdit = (product: Product) => {
    if (!permissions.editProducts) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to edit dougies.",
        variant: "destructive",
      })
      return
    }

    setEditingProduct(product)
    setEditForm({
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      menuId: product.menuId || "unassigned",
    })
  }

  const handleUpdate = async () => {
    if (!editingProduct || !permissions.editProducts) return

    try {
      const productRef = doc(db, "products", editingProduct.id)
      await updateDoc(productRef, {
        name: editForm.name,
        description: editForm.description,
        price: Number(editForm.price),
        imageUrl: editForm.imageUrl,
        menuId: editForm.menuId === "unassigned" ? null : editForm.menuId,
      })

      toast({
        title: "Success!",
        description: "Dougie updated successfully.",
      })
      setEditingProduct(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update dougie.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (productId: string) => {
    if (!permissions.deleteProducts) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete dougies.",
        variant: "destructive",
      })
      return
    }

    try {
      await deleteDoc(doc(db, "products", productId))
      toast({
        title: "Success!",
        description: "Dougie deleted successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete dougie.",
        variant: "destructive",
      })
    }
  }

  const getMenuName = (menuId: string | undefined) => {
    if (!menuId) return "Unassigned"
    const menu = menus.find((m) => m.id === menuId)
    return menu ? menu.name : "Unknown Menu"
  }

  const ProductCard = ({ product }: { product: Product }) => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
      <Image
        src={product.imageUrl || "/placeholder.svg?height=80&width=80&query=dougie"}
        alt={product.name}
        width={80}
        height={80}
        className="rounded-md object-cover"
      />

      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-lg">{product.name}</h3>
          <Badge variant={product.menuId ? "default" : "secondary"} className="ml-2">
            {getMenuName(product.menuId)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        <p className="font-semibold text-xl text-green-600">${product.price.toFixed(2)}</p>
      </div>

      <div className="flex gap-2 w-full sm:w-auto">
        {permissions.editProducts && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Dougie</DialogTitle>
                <DialogDescription>Make changes to your dougie here.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Dougie Name *</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description *</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-price">Price *</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-menu">Menu Assignment</Label>
                    <Select
                      value={editForm.menuId}
                      onValueChange={(value) => setEditForm({ ...editForm, menuId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a menu" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {menus.map((menu) => (
                          <SelectItem key={menu.id} value={menu.id}>
                            {menu.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-image">Image URL</Label>
                  <Input
                    id="edit-image"
                    value={editForm.imageUrl}
                    onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingProduct(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {permissions.deleteProducts && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the dougie "{product.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(product.id)}>Delete Dougie</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {!permissions.editProducts && !permissions.deleteProducts && (
          <div className="text-sm text-muted-foreground px-3 py-2">View Only</div>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Dougie Management
        </CardTitle>
        <CardDescription>Edit and manage your dougies and their menu assignments</CardDescription>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dougies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedMenuFilter} onValueChange={setSelectedMenuFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by menu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dougies</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {menus.map((menu) => (
                  <SelectItem key={menu.id} value={menu.id}>
                    {menu.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredProducts.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredProducts.length} of {products.length} dougies
            </p>
            <div className="grid gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              {searchTerm || selectedMenuFilter !== "all" ? "No dougies match your filters" : "No dougies yet"}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedMenuFilter !== "all"
                ? "Try adjusting your search or filter."
                : "Use “Add Dougie” to create your first one."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
