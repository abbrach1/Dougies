"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Download } from "lucide-react"
import type { Order } from "@/lib/types"
import { generateDailyExportData, generateCSV, generateJSON, downloadFile } from "@/lib/export-utils"

interface DailyExportProps {
  orders: Order[]
}

export default function DailyExport({ orders }: DailyExportProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv")
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  // Get orders for the selected date
  const getOrdersForDate = (dateStr: string) => {
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt.seconds * 1000)
      return orderDate.toISOString().split("T")[0] === dateStr
    })
  }

  const selectedDateOrders = getOrdersForDate(selectedDate)
  const totalRevenue = selectedDateOrders.reduce((sum, order) => sum + order.total, 0)
  const completedOrders = selectedDateOrders.filter((order) => order.status === "Arrived").length
  const paidOrders = selectedDateOrders.filter((order) => order.paymentStatus === "Paid").length

  const handleExport = async () => {
    if (selectedDateOrders.length === 0) {
      toast({
        title: "No Data to Export",
        description: "No orders found for the selected date.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const exportData = generateDailyExportData(orders, new Date(selectedDate))

      let content: string
      let filename: string
      let contentType: string

      if (exportFormat === "csv") {
        content = generateCSV(exportData)
        filename = `camp-simcha-dougies-${selectedDate}.csv`
        contentType = "text/csv;charset=utf-8;"
      } else {
        content = generateJSON(exportData)
        filename = `camp-simcha-dougies-${selectedDate}.json`
        contentType = "application/json;charset=utf-8;"
      }

      downloadFile(content, filename, contentType)

      toast({
        title: "Export Successful! 📊",
        description: `Daily report for ${new Date(selectedDate).toLocaleDateString()} has been downloaded.`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "Failed to generate export file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Get available dates (dates with orders)
  const getAvailableDates = () => {
    const dates = new Set<string>()
    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt.seconds * 1000)
      dates.add(orderDate.toISOString().split("T")[0])
    })
    return Array.from(dates).sort().reverse() // Most recent first
  }

  const availableDates = getAvailableDates()

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="export-date">Date</Label>
          <Input
            id="export-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="export-format">Format</Label>
          <Select value={exportFormat} onValueChange={(value: "csv" | "json") => setExportFormat(value)}>
            <SelectTrigger id="export-format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV (Excel)</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* One compact summary line replaces four hand-rolled stat tiles. */}
      <div className="rounded-lg border bg-muted/40 p-4 text-sm">
        {selectedDateOrders.length > 0 ? (
          <p>
            <span className="font-semibold">{selectedDateOrders.length}</span> orders &middot;{" "}
            <span className="font-semibold">${totalRevenue.toFixed(2)}</span> revenue &middot; {completedOrders} arrived
            &middot; {paidOrders} paid
          </p>
        ) : (
          <p className="text-muted-foreground">
            No orders on this date.
            {availableDates.length > 0 && ` Most recent with orders: ${availableDates[0]}.`}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Customer names and contact details are excluded from exports for privacy.
      </p>

      <Button
        onClick={handleExport}
        disabled={isGenerating || selectedDateOrders.length === 0}
        className="w-full"
        size="lg"
      >
        {isGenerating ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
            Generating...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Download {exportFormat.toUpperCase()}
          </>
        )}
      </Button>
    </div>
  )
}
