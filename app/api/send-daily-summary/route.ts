import { type NextRequest, NextResponse } from "next/server"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Resend } from "resend"
import DailySummaryEmail from "@/components/emails/daily-summary-email"
import type { Order } from "@/lib/types"

const resend = new Resend("re_5MpFR8fG_9MfChisSYX9J4r8v7de49p3S")
const FROM_EMAIL = "dougies@abbrachfeld.com"
const ADMIN_EMAILS = ["abbrachfeld@gmail.com", "kobygryfe@gmail.com"]

export async function POST(request: NextRequest) {
  try {
    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // Query orders from today
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

    // Calculate summary statistics
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
    const paidOrders = orders.filter((order) => order.paymentStatus === "Paid").length
    const unpaidOrders = totalOrders - paidOrders

    // Send summary email to all admins
    const emailPromises = ADMIN_EMAILS.map((adminEmail) =>
      resend.emails.send({
        from: FROM_EMAIL,
        to: adminEmail,
        subject: `Daily Order Summary - ${today.toLocaleDateString()}`,
        react: DailySummaryEmail({
          date: today.toLocaleDateString(),
          totalOrders,
          totalRevenue,
          paidOrders,
          unpaidOrders,
          orders,
        }),
      }),
    )

    await Promise.all(emailPromises)

    return NextResponse.json({
      success: true,
      summary: {
        date: today.toLocaleDateString(),
        totalOrders,
        totalRevenue,
        paidOrders,
        unpaidOrders,
      },
    })
  } catch (error) {
    console.error("Error sending daily summary:", error)
    return NextResponse.json({ error: "Failed to send daily summary" }, { status: 500 })
  }
}
