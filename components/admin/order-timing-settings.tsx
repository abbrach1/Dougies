"use client"

import { useState, useEffect } from "react"
import { doc, onSnapshot, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Clock, Play, Square, Calendar } from "lucide-react"

interface DailyOrderingSettings {
  enabled: boolean
  startTime: string
  endTime: string
  date: string
}

export default function OrderTimingSettings() {
  const [settings, setSettings] = useState<DailyOrderingSettings>({
    enabled: false,
    startTime: "09:00",
    endTime: "17:00",
    date: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isCurrentlyOpen, setIsCurrentlyOpen] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const today = new Date().toISOString().split("T")[0]
  const now = new Date()
  const currentTime = now.toTimeString().slice(0, 5)

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "dailyOrdering"), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as DailyOrderingSettings
        setSettings(data)

        // Check if ordering is currently open
        if (data.date === today && data.enabled) {
          const [startHour, startMinute] = data.startTime.split(":").map(Number)
          const [endHour, endMinute] = data.endTime.split(":").map(Number)

          const startTime = new Date(now)
          startTime.setHours(startHour, startMinute, 0, 0)

          const endTime = new Date(now)
          endTime.setHours(endHour, endMinute, 0, 0)

          setIsCurrentlyOpen(now >= startTime && now <= endTime)
        } else {
          setIsCurrentlyOpen(false)
        }
      } else {
        // Initialize with today's date if no settings exist
        setSettings({
          enabled: false,
          startTime: "09:00",
          endTime: "17:00",
          date: today,
        })
        setIsCurrentlyOpen(false)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [today, now])

  const handleSaveSettings = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update settings.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      await setDoc(doc(db, "settings", "dailyOrdering"), {
        ...settings,
        date: today, // Always set to today
        lastUpdated: new Date(),
        updatedBy: user.email,
      })

      toast({
        title: "Success!",
        description: "Order timing settings updated successfully.",
      })
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleStartOrderingNow = async () => {
    if (!user) return

    setSaving(true)

    try {
      const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours from now
      const endTimeString = endTime.toTimeString().slice(0, 5)

      await setDoc(doc(db, "settings", "dailyOrdering"), {
        enabled: true,
        startTime: currentTime,
        endTime: endTimeString,
        date: today,
        lastUpdated: new Date(),
        updatedBy: user.email,
      })

      toast({
        title: "Success!",
        description: "Ordering is now open until " + endTimeString,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start ordering.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleStopOrdering = async () => {
    if (!user) return

    setSaving(true)

    try {
      await setDoc(doc(db, "settings", "dailyOrdering"), {
        ...settings,
        enabled: false,
        date: today,
        lastUpdated: new Date(),
        updatedBy: user.email,
      })

      toast({
        title: "Success!",
        description: "Ordering has been stopped.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop ordering.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
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
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Status
          </CardTitle>
          <CardDescription>Today's ordering status - {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">
                Ordering is currently{" "}
                <span className={isCurrentlyOpen ? "text-green-600" : "text-red-600"}>
                  {isCurrentlyOpen ? "OPEN" : "CLOSED"}
                </span>
              </p>
              {settings.date === today && settings.enabled && (
                <p className="text-sm text-muted-foreground">
                  Scheduled: {settings.startTime} - {settings.endTime}
                </p>
              )}
            </div>
            <Badge variant={isCurrentlyOpen ? "default" : "secondary"}>{isCurrentlyOpen ? "Active" : "Inactive"}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Start or stop ordering immediately</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleStartOrderingNow} disabled={saving || isCurrentlyOpen} className="flex-1">
            <Play className="h-4 w-4 mr-2" />
            Start Ordering Now
          </Button>
          <Button
            onClick={handleStopOrdering}
            disabled={saving || !isCurrentlyOpen}
            variant="destructive"
            className="flex-1"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop Ordering
          </Button>
        </CardContent>
      </Card>

      {/* Daily Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Schedule
          </CardTitle>
          <CardDescription>Set specific times for today's ordering window</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="enable-ordering"
              checked={settings.enabled && settings.date === today}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked, date: today })}
            />
            <Label htmlFor="enable-ordering">Enable scheduled ordering for today</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={settings.startTime}
                onChange={(e) => setSettings({ ...settings, startTime: e.target.value })}
                disabled={false}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={settings.endTime}
                onChange={(e) => setSettings({ ...settings, endTime: e.target.value })}
                disabled={false}
              />
            </div>
          </div>

          <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Schedule"}
          </Button>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Settings are specific to today's date</p>
            <p>• Tomorrow will start fresh with ordering disabled</p>
            <p>• Use "Start Ordering Now" for immediate activation</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
