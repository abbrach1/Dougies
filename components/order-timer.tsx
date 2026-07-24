"use client"

import { useState, useEffect } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar } from "lucide-react"

interface DailyOrderingSettings {
  enabled: boolean
  startTime: string
  endTime: string
  date: string
}

export default function OrderTimer() {
  const [settings, setSettings] = useState<DailyOrderingSettings | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [status, setStatus] = useState<"closed" | "open" | "ending-soon">("closed")

  const today = new Date().toISOString().split("T")[0]

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Listen to ordering settings
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "dailyOrdering"), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as DailyOrderingSettings
        setSettings(data)
      } else {
        setSettings(null)
      }
    })

    return () => unsubscribe()
  }, [])

  // Calculate status and time remaining
  useEffect(() => {
    if (!settings || settings.date !== today || !settings.enabled) {
      setStatus("closed")
      setTimeRemaining("")
      return
    }

    const now = currentTime
    const [startHour, startMinute] = settings.startTime.split(":").map(Number)
    const [endHour, endMinute] = settings.endTime.split(":").map(Number)

    const startTime = new Date(now)
    startTime.setHours(startHour, startMinute, 0, 0)

    const endTime = new Date(now)
    endTime.setHours(endHour, endMinute, 0, 0)

    if (now < startTime) {
      // Before opening
      setStatus("closed")
      const diff = startTime.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeRemaining(`Opens in ${hours}h ${minutes}m ${seconds}s`)
    } else if (now >= startTime && now <= endTime) {
      // Currently open
      const diff = endTime.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      // Show "ending soon" if less than 15 minutes remaining
      if (diff <= 15 * 60 * 1000) {
        setStatus("ending-soon")
      } else {
        setStatus("open")
      }

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s remaining`)
    } else {
      // After closing
      setStatus("closed")
      setTimeRemaining("Ordering closed for today")
    }
  }, [settings, currentTime, today])

  const getStatusColor = () => {
    switch (status) {
      case "open":
        return "border-green-200 bg-green-50"
      case "ending-soon":
        return "border-orange-200 bg-orange-50"
      case "closed":
      default:
        return "border-red-200 bg-red-50"
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Open</Badge>
      case "ending-soon":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Ending Soon</Badge>
      case "closed":
      default:
        return <Badge variant="secondary">Closed</Badge>
    }
  }

  return (
    <Card className={`w-full max-w-3xl mx-auto ${getStatusColor()}`}>
      
    </Card>
  )
}
