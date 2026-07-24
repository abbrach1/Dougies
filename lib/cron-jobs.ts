"use client"

import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface DailyOrderingSettings {
  enabled: boolean
  startTime: string
  endTime: string
  date: string
}

// This would typically run on a server, but for demo purposes, we'll simulate it client-side
export function setupDailySummaryTrigger() {
  const checkAndSendSummary = () => {
    const unsubscribe = onSnapshot(doc(db, "settings", "dailyOrdering"), (doc) => {
      if (!doc.exists()) return

      const settings = doc.data() as DailyOrderingSettings
      const now = new Date()
      const today = now.toISOString().split("T")[0]

      // Only process if settings are for today and enabled
      if (settings.date !== today || !settings.enabled) return

      const [endHour, endMinute] = settings.endTime.split(":").map(Number)
      const endTime = new Date(now)
      endTime.setHours(endHour, endMinute, 0, 0)

      // Check if we just passed the end time (within 1 minute)
      const timeDiff = now.getTime() - endTime.getTime()
      if (timeDiff >= 0 && timeDiff <= 60000) {
        // Send daily summary
        fetch("/api/send-daily-summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: today,
          }),
        }).catch(console.error)
      }
    })

    return unsubscribe
  }

  // Check every minute
  const interval = setInterval(checkAndSendSummary, 60000)

  return () => {
    clearInterval(interval)
  }
}
