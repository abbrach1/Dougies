"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { collection, addDoc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/hooks"
import type { Menu } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Plus, Upload, MenuIcon } from "lucide-react"
import Image from "next/image"

export default function AddProductForm() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [imagePreview, setImagePreview] = useState<string>("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    menuId: "unassigned",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    })

    return () => unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add dougies.",
        variant: "destructive",
      })
      return
    }

    if (!formData.name || !formData.description || !formData.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const price = Number.parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await addDoc(collection(db, "products"), {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: price,
        imageUrl: formData.imageUrl.trim() || "",
        menuId: formData.menuId === "unassigned" ? null : formData.menuId,
        createdAt: new Date(),
        createdBy: user.email,
      })

      toast({
        title: "Success!",
        description: "Dougie added successfully.",
      })

      // Reset form
      setFormData({
        name: "",
        description: "",
        price: "",
        imageUrl: "",
        menuId: "unassigned",
      })
      setImagePreview("")
    } catch (error) {
      console.error("Error adding dougie:", error)
      toast({
        title: "Error",
        description: "Failed to add dougie. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUrlChange = (url: string) => {
    setFormData({ ...formData, imageUrl: url })
    setImagePreview(url)
  }

  const getSelectedMenuName = () => {
    if (formData.menuId === "unassigned") return "Unassigned"
    const menu = menus.find((m) => m.id === formData.menuId)
    return menu ? menu.name : "Unknown Menu"
  }

  return (
    <div className="space-y-6">
      {/* Menu Selection Info */}
      {menus.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <MenuIcon className="h-5 w-5" />
              Menu Assignment
            </CardTitle>
            <CardDescription className="text-blue-700">
              You have {menus.length} menu{menus.length !== 1 ? "s" : ""} available. Choose where this dougie should
              appear.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {menus.map((menu) => (
                <Badge key={menu.id} variant="outline" className="text-blue-700 border-blue-300">
                  {menu.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Product Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Dougie
          </CardTitle>
          <CardDescription>Add a new dougie to your Camp Simcha menu</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Dougie Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Classic Camp Simcha Dougie"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your delicious dougie..."
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    placeholder="https://example.com/dougie-image.jpg"
                  />
                  <p className="text-xs text-muted-foreground">Optional: Add an image URL to showcase your dougie</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="menu">Menu Assignment</Label>
                  <Select
                    value={formData.menuId}
                    onValueChange={(value) => setFormData({ ...formData, menuId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a menu (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                          Unassigned (Show in all menus)
                        </div>
                      </SelectItem>
                      {menus.map((menu) => (
                        <SelectItem key={menu.id} value={menu.id}>
                          <div className="flex items-center gap-2">
                            <MenuIcon className="h-3 w-3" />
                            {menu.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Selected:</span>
                    <Badge variant={formData.menuId === "unassigned" ? "secondary" : "default"} className="text-xs">
                      {getSelectedMenuName()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formData.menuId === "unassigned"
                      ? "This dougie will appear in all menus and when no specific menu is active"
                      : "This dougie will only appear when this specific menu is active"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Image Preview</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <Image
                        src={imagePreview || "/placeholder.svg"}
                        alt="Dougie preview"
                        width={200}
                        height={200}
                        className="mx-auto rounded-lg object-cover"
                        onError={() => setImagePreview("")}
                      />
                      <p className="text-sm text-muted-foreground">Dougie preview</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="text-sm text-muted-foreground">No image URL provided</p>
                        <p className="text-xs text-muted-foreground">Add an image URL above to see preview</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Menu Assignment Preview */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-medium mb-2">Menu Assignment Preview</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Will appear in:</span>
                      <Badge variant={formData.menuId === "unassigned" ? "secondary" : "default"}>
                        {getSelectedMenuName()}
                      </Badge>
                    </div>
                    {formData.menuId === "unassigned" ? (
                      <p className="text-xs text-muted-foreground">
                        ✓ Visible in all menus
                        <br />✓ Visible when no specific menu is active
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        ✓ Only visible when "{getSelectedMenuName()}" is the active menu
                        <br />✗ Hidden when other menus are active
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding Dougie...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Dougie
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
