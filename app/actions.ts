"use server"

import type { OrderData, Order } from "@/lib/types"
import { getResendClient, FROM_EMAIL, ADMIN_EMAILS } from "@/lib/email-config"
import OrderConfirmationEmail from "@/components/emails/order-confirmation-email"
import NewOrderAdminEmail from "@/components/emails/new-order-admin-email"
import OrderArrivedEmail from "@/components/emails/order-arrived-email"

export async function placeOrder(orderData: OrderData) {
  const orderWithTimestamp = {
    ...orderData,
    status: "Placed",
    createdAt: new Date(),
  }

  // Generate a simple order ID
  const orderId = Date.now().toString()

  const resend = getResendClient()

  // Email is best-effort: the order has already been saved to the database by
  // the caller, so a delivery failure must not fail the whole order.
  if (!resend) {
    return { success: true, orderId, emailSent: false }
  }

  try {
    // Send confirmation email to the customer.
    await resend.emails.send({
      from: FROM_EMAIL,
      to: orderData.userEmail,
      subject: `Your Camp Simcha Dougies Order Confirmation #${orderId.substring(0, 6)}`,
      react: OrderConfirmationEmail({ order: orderWithTimestamp, orderId }),
    })

    // Notify every admin.
    await Promise.all(
      ADMIN_EMAILS.map((adminEmail) =>
        resend.emails.send({
          from: FROM_EMAIL,
          to: adminEmail,
          subject: `New Camp Simcha Dougies Order #${orderId.substring(0, 6)}`,
          react: NewOrderAdminEmail({ order: orderWithTimestamp, orderId }),
        }),
      ),
    )

    return { success: true, orderId, emailSent: true }
  } catch (error) {
    console.error("[email] Error sending order confirmation:", error)
    // Order is already persisted; report success but flag the email failure.
    return { success: true, orderId, emailSent: false }
  }
}

export async function markOrderAsArrived(orderId: string, customerEmail: string, customerName?: string) {
  const resend = getResendClient()
  if (!resend) {
    return { success: true, emailSent: false }
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Your Camp Simcha Dougies Order #${orderId.substring(0, 6)} has arrived! 📦`,
      react: OrderArrivedEmail({
        orderId,
        customerName: customerName || "Customer",
      }),
    })

    return { success: true, emailSent: true }
  } catch (error) {
    console.error("[email] Error sending arrival notification:", error)
    return { success: false, emailSent: false }
  }
}

export async function bulkMarkOrdersAsArrived(orders: Order[]) {
  const resend = getResendClient()
  if (!resend) {
    return { success: true, count: orders.length, emailSent: false }
  }

  try {
    // Send an individual arrival email to each customer.
    const results = await Promise.allSettled(
      orders.map((order) =>
        resend.emails.send({
          from: FROM_EMAIL,
          to: order.userEmail,
          subject: `Your Camp Simcha Dougies Order #${order.id.substring(0, 6)} has arrived! 📦`,
          react: OrderArrivedEmail({
            orderId: order.id,
            customerName: order.userName || "Customer",
          }),
        }),
      ),
    )

    const sent = results.filter((r) => r.status === "fulfilled").length
    const failed = results.length - sent
    if (failed > 0) {
      console.error(`[email] ${failed} of ${results.length} bulk arrival notifications failed to send.`)
    }

    // No admin email sent here - only when the time frame closes.
    return { success: true, count: sent, emailSent: sent > 0 }
  } catch (error) {
    console.error("[email] Error sending bulk arrival notifications:", error)
    return { success: false, count: 0, emailSent: false }
  }
}
