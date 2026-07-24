"use server"

import { Resend } from "resend"
import type { OrderData, Order } from "@/lib/types"
import OrderConfirmationEmail from "@/components/emails/order-confirmation-email"
import NewOrderAdminEmail from "@/components/emails/new-order-admin-email"
import OrderArrivedEmail from "@/components/emails/order-arrived-email"

const resend = new Resend("re_5MpFR8fG_9MfChisSYX9J4r8v7de49p3S")
const FROM_EMAIL = "dougies@abbrachfeld.com"
const ADMIN_EMAILS = ["abbrachfeld@gmail.com", "kobygryfe@gmail.com"]

export async function placeOrder(orderData: OrderData) {
  try {
    const orderWithTimestamp = {
      ...orderData,
      status: "Placed",
      createdAt: new Date(),
    }

    // Generate a simple order ID
    const orderId = Date.now().toString()

    // Send confirmation email to customer
    await resend.emails.send({
      from: FROM_EMAIL,
      to: orderData.userEmail,
      subject: `Your Camp Simcha Dougies Order Confirmation #${orderId.substring(0, 6)}`,
      react: OrderConfirmationEmail({ order: orderWithTimestamp, orderId }),
    })

    // Send notification email to all admins
    const adminEmailPromises = ADMIN_EMAILS.map((adminEmail) =>
      resend.emails.send({
        from: FROM_EMAIL,
        to: adminEmail,
        subject: `New Camp Simcha Dougies Order #${orderId.substring(0, 6)}`,
        react: NewOrderAdminEmail({ order: orderWithTimestamp, orderId }),
      }),
    )

    await Promise.all(adminEmailPromises)

    return { success: true, orderId }
  } catch (error) {
    console.error("Error placing order:", error)
    throw new Error("Could not place order.")
  }
}

export async function markOrderAsArrived(orderId: string, customerEmail: string, customerName?: string) {
  try {
    // Send "arrived" notification to customer only
    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Your Camp Simcha Dougies Order #${orderId.substring(0, 6)} has arrived! 📦`,
      react: OrderArrivedEmail({
        orderId,
        customerName: customerName || "Customer",
      }),
    })

    return { success: true }
  } catch (error) {
    console.error("Error sending arrival notification:", error)
    throw new Error("Could not send arrival notification.")
  }
}

export async function bulkMarkOrdersAsArrived(orders: Order[]) {
  try {
    // Send individual emails to each customer only
    const emailPromises = orders.map((order) =>
      resend.emails.send({
        from: FROM_EMAIL,
        to: order.userEmail,
        subject: `Your Camp Simcha Dougies Order #${order.id.substring(0, 6)} has arrived! 📦`,
        react: OrderArrivedEmail({
          orderId: order.id,
          customerName: order.userName || "Customer",
        }),
      }),
    )

    await Promise.all(emailPromises)

    // No admin email sent here - only when time frame closes
    return { success: true, count: orders.length }
  } catch (error) {
    console.error("Error sending bulk arrival notifications:", error)
    throw new Error("Could not send bulk arrival notifications.")
  }
}
