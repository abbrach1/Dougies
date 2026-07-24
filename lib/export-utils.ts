import type { Order } from "@/lib/types"

export interface DailyExportData {
  date: string
  summary: {
    totalOrders: number
    totalRevenue: number
    averageOrderValue: number
    completedOrders: number
    pendingOrders: number
    paidOrders: number
    unpaidOrders: number
    totalPaidAmount: number
    totalUnpaidAmount: number
  }
  itemsSummary: Array<{
    itemName: string
    quantityOrdered: number
    totalRevenue: number
    averagePrice: number
  }>
  anonymizedOrders: Array<{
    orderNumber: string
    items: Array<{
      name: string
      quantity: number
      price: number
    }>
    total: number
    status: string
    paymentStatus: string
    orderTime: string
  }>
}

export function generateDailyExportData(orders: Order[], date: Date): DailyExportData {
  const dateStr = date.toISOString().split("T")[0]

  // Filter orders for the specific date
  const dayOrders = orders.filter((order) => {
    const orderDate = new Date(order.createdAt.seconds * 1000)
    return orderDate.toISOString().split("T")[0] === dateStr
  })

  // Calculate summary statistics
  const totalOrders = dayOrders.length
  const totalRevenue = dayOrders.reduce((sum, order) => sum + order.total, 0)
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const completedOrders = dayOrders.filter((order) => order.status === "Arrived").length
  const pendingOrders = dayOrders.filter((order) => order.status === "Placed").length
  const paidOrders = dayOrders.filter((order) => order.paymentStatus === "Paid").length
  const unpaidOrders = dayOrders.filter((order) => order.paymentStatus === "Unpaid").length
  const totalPaidAmount = dayOrders
    .filter((order) => order.paymentStatus === "Paid")
    .reduce((sum, order) => sum + order.total, 0)
  const totalUnpaidAmount = dayOrders
    .filter((order) => order.paymentStatus === "Unpaid")
    .reduce((sum, order) => sum + order.total, 0)

  // Generate items summary
  const itemsMap = new Map<string, { quantity: number; revenue: number; prices: number[] }>()

  dayOrders.forEach((order) => {
    order.items.forEach((item) => {
      const existing = itemsMap.get(item.name) || { quantity: 0, revenue: 0, prices: [] }
      existing.quantity += item.quantity
      existing.revenue += item.price * item.quantity
      existing.prices.push(item.price)
      itemsMap.set(item.name, existing)
    })
  })

  const itemsSummary = Array.from(itemsMap.entries())
    .map(([itemName, data]) => ({
      itemName,
      quantityOrdered: data.quantity,
      totalRevenue: data.revenue,
      averagePrice: data.prices.reduce((sum, price) => sum + price, 0) / data.prices.length,
    }))
    .sort((a, b) => b.quantityOrdered - a.quantityOrdered)

  // Generate anonymized orders (no customer names/emails)
  const anonymizedOrders = dayOrders.map((order, index) => ({
    orderNumber: `#${(index + 1).toString().padStart(3, "0")}`,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
    total: order.total,
    status: order.status,
    paymentStatus: order.paymentStatus,
    orderTime: new Date(order.createdAt.seconds * 1000).toLocaleTimeString(),
  }))

  return {
    date: dateStr,
    summary: {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      completedOrders,
      pendingOrders,
      paidOrders,
      unpaidOrders,
      totalPaidAmount,
      totalUnpaidAmount,
    },
    itemsSummary,
    anonymizedOrders,
  }
}

export function generateCSV(data: DailyExportData): string {
  let csv = `Daily Orders Export - ${data.date}\n\n`

  // Summary Section
  csv += "SUMMARY\n"
  csv += "Metric,Value\n"
  csv += `Total Orders,${data.summary.totalOrders}\n`
  csv += `Total Revenue,$${data.summary.totalRevenue.toFixed(2)}\n`
  csv += `Average Order Value,$${data.summary.averageOrderValue.toFixed(2)}\n`
  csv += `Completed Orders,${data.summary.completedOrders}\n`
  csv += `Pending Orders,${data.summary.pendingOrders}\n`
  csv += `Paid Orders,${data.summary.paidOrders}\n`
  csv += `Unpaid Orders,${data.summary.unpaidOrders}\n`
  csv += `Total Paid Amount,$${data.summary.totalPaidAmount.toFixed(2)}\n`
  csv += `Total Unpaid Amount,$${data.summary.totalUnpaidAmount.toFixed(2)}\n\n`

  // Items Summary Section
  csv += "ITEMS SUMMARY\n"
  csv += "Item Name,Quantity Ordered,Total Revenue,Average Price\n"
  data.itemsSummary.forEach((item) => {
    csv += `"${item.itemName}",${item.quantityOrdered},$${item.totalRevenue.toFixed(2)},$${item.averagePrice.toFixed(2)}\n`
  })
  csv += "\n"

  // Anonymized Orders Section
  csv += "ANONYMIZED ORDERS\n"
  csv += "Order Number,Items,Total,Status,Payment Status,Order Time\n"
  data.anonymizedOrders.forEach((order) => {
    const itemsStr = order.items.map((item) => `${item.name} x${item.quantity}`).join("; ")
    csv += `${order.orderNumber},"${itemsStr}",$${order.total.toFixed(2)},${order.status},${order.paymentStatus},${order.orderTime}\n`
  })

  return csv
}

export function generateJSON(data: DailyExportData): string {
  return JSON.stringify(data, null, 2)
}

export function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
