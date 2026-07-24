"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Download, FileText, Calendar, DollarSign, Package, Clock } from "lucide-react"
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Daily Export
        </CardTitle>
        <CardDescription>
          Export daily order data including revenue summary and anonymized order details. Customer names and contact
          information are excluded for privacy.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Export Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="export-date">Select Date</Label>
            <Input
              id="export-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
            {availableDates.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Available dates: {availableDates.slice(0, 3).join(", ")}
                {availableDates.length > 3 && ` and ${availableDates.length - 3} more`}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="export-format">Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: "csv" | "json") => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Excel Compatible)</SelectItem>
                <SelectItem value="json">JSON (Raw Data)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preview for Selected Date */}
        <div className="space-y-4">
          <h3 className="font-semibold">Preview for {new Date(selectedDate).toLocaleDateString()}</h3>

          {selectedDateOrders.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-800">{selectedDateOrders.length}</p>
                    <p className="text-xs text-blue-600">Total Orders</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-800">${totalRevenue.toFixed(0)}</p>
                    <p className="text-xs text-green-600">Total Revenue</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-purple-800">{completedOrders}</p>
                    <p className="text-xs text-purple-600">Completed</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold text-orange-800">{paidOrders}</p>
                    <p className="text-xs text-orange-600">Paid Orders</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-muted/50 rounded-lg">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders found for this date</p>
              <p className="text-sm text-muted-foreground">Try selecting a different date</p>
            </div>
          )}
        </div>

        {/* Export Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Export Contents</h4>
          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Summary
              </Badge>
              <span>Revenue, order counts, payment statistics</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Items
              </Badge>
              <span>Product sales summary with quantities and revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Orders
              </Badge>
              <span>Anonymized order details (no customer names/emails)</span>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end">
          <Button onClick={handleExport} disabled={isGenerating || selectedDateOrders.length === 0} size="lg">
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Export...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {exportFormat.toUpperCase()} ({selectedDateOrders.length} orders)
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
