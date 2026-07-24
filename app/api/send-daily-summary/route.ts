import { type NextRequest, NextResponse } from "next/server"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getResendClient, FROM_EMAIL, ADMIN_EMAILS } from "@/lib/email-config"
import DailySummaryEmail from "@/components/emails/daily-summary-email"
import type { Order } from "@/lib/types"

/**
 * Sends the end-of-day order summary to all admins.
 *
 * This endpoint is protected: it requires `Authorization: Bearer <CRON_SECRET>`.
 * Vercel Cron sends this header automatically when a `CRON_SECRET` environment
 * variable is configured (see vercel.json). Without a matching secret the
 * request is rejected so the endpoint cannot be used to spam admins.
 */
function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error("[daily-summary] CRON_SECRET is not set. Refusing to run. Configure it to enable the daily summary.")
    return false
  }
  const authHeader = request.headers.get("authorization")
  return authHeader === `Bearer ${cronSecret}`
}

async function sendDailySummary(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const resend = getResendClient()
  if (!resend) {
    return NextResponse.json({ error: "Email is not configured (missing RESEND_API_KEY)." }, { status: 503 })
  }

  try {
    // Today's date range.
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const ordersQuery = query(
      collection(db, "orders"),
      where("createdAt", ">=", Timestamp.fromDate(startOfDay)),
      where("createdAt", "<", Timestamp.fromDate(endOfDay)),
    )

    const ordersSnapshot = await getDocs(ordersQuery)
    const orders: Order[] = []
    ordersSnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() } as Order)
    })

    // Summary statistics.
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
    const arrivedOrders = orders.filter((order) => order.status === "Arrived").length
    const pendingOrders = totalOrders - arrivedOrders

    // Aggregate quantity and revenue per item across all orders.
    const itemSummary: Record<string, { quantity: number; revenue: number }> = {}
    for (const order of orders) {
      for (const item of order.items || []) {
        const entry = itemSummary[item.name] || { quantity: 0, revenue: 0 }
        entry.quantity += item.quantity
        entry.revenue += item.price * item.quantity
        itemSummary[item.name] = entry
      }
    }

    // Per-customer breakdown for the email body.
    const customerOrders = orders.map((order) => ({
      name: order.userName || "Customer",
      email: order.userEmail,
      total: order.total || 0,
      status: order.status,
      items: (order.items || []).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    }))

    const dateLabel = today.toLocaleDateString()

    await Promise.all(
      ADMIN_EMAILS.map((adminEmail) =>
        resend.emails.send({
          from: FROM_EMAIL,
          to: adminEmail,
          subject: `Daily Order Summary - ${dateLabel}`,
          react: DailySummaryEmail({
            date: dateLabel,
            totalOrders,
            totalRevenue,
            arrivedOrders,
            pendingOrders,
            itemSummary,
            customerOrders,
          }),
        }),
      ),
    )

    return NextResponse.json({
      success: true,
      summary: { date: dateLabel, totalOrders, totalRevenue, arrivedOrders, pendingOrders },
    })
  } catch (error) {
    console.error("[daily-summary] Error sending daily summary:", error)
    return NextResponse.json({ error: "Failed to send daily summary" }, { status: 500 })
  }
}

// Vercel Cron triggers via GET; POST is available for manual/authorized runs.
export async function GET(request: NextRequest) {
  return sendDailySummary(request)
}

export async function POST(request: NextRequest) {
  return sendDailySummary(request)
}
