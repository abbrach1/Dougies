"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { collection, addDoc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/hooks"
import type { Menu } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Plus } from "lucide-react"
import Image from "next/image"

interface AddProductFormProps {
  /** Called after a dougie is created, so a hosting dialog can close. */
  onSuccess?: () => void
}

export default function AddProductForm({ onSuccess }: AddProductFormProps) {
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
      onSuccess?.()
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
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
          className="min-h-[80px]"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <Label htmlFor="menu">Menu</Label>
          <Select value={formData.menuId} onValueChange={(value) => setFormData({ ...formData, menuId: value })}>
            <SelectTrigger id="menu">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned (shows in all menus)</SelectItem>
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
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          type="url"
          value={formData.imageUrl}
          onChange={(e) => handleImageUrlChange(e.target.value)}
          placeholder="https://example.com/dougie-image.jpg"
        />
        {imagePreview && (
          <Image
            src={imagePreview || "/placeholder.svg"}
            alt="Preview"
            width={96}
            height={96}
            className="mt-2 h-24 w-24 rounded-lg object-cover"
            onError={() => setImagePreview("")}
          />
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
            Adding...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Add Dougie
          </>
        )}
      </Button>
    </form>
  )
}
