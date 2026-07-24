import { Body, Container, Head, Heading, Html, Preview, Text, Row, Column, Hr, Section } from "@react-email/components"
import type { Order } from "@/lib/types"

interface BulkOrderArrivedEmailProps {
  orders: Order[]
  totalOrders: number
  timestamp: string
}

export const BulkOrderArrivedEmail = ({ orders, totalOrders, timestamp }: BulkOrderArrivedEmailProps) => (
  <Html>
    <Head />
    <Preview>Bulk Order Arrival Notifications Sent - Camp Simcha Dougies</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Bulk Order Arrival Notifications Sent</Heading>
        <Text style={paragraph}>
          <strong>Timestamp:</strong> {timestamp}
        </Text>

        <Section style={summarySection}>
          <Text style={summaryText}>
            📦 <strong>{totalOrders} orders</strong> have been marked as arrived and customers have been notified via
            email.
          </Text>
        </Section>

        <Hr style={hr} />

        <Heading as="h2" style={subheading}>
          Orders Processed
        </Heading>

        {orders.map((order) => (
          <Section key={order.id} style={orderSection}>
            <Row>
              <Column>
                <Text style={orderHeader}>
                  <strong>#{order.id.substring(0, 8)}</strong> - {order.userName}
                </Text>
                <Text style={orderDetails}>
                  {order.userEmail} • ${order.total.toFixed(2)} • {order.items.length} item
                  {order.items.length > 1 ? "s" : ""}
                </Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={itemsList}>
                  Items: {order.items.map((item) => `${item.name} (${item.quantity})`).join(", ")}
                </Text>
              </Column>
            </Row>
          </Section>
        ))}

        <Hr style={hr} />

        <Text style={footer}>
          Camp Simcha Dougies - Bulk Order Management
          <br />
          All customers have been notified that their orders are ready for pickup.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default BulkOrderArrivedEmail

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  border: "1px solid #f0f0f0",
  borderRadius: "4px",
}

const heading = {
  fontSize: "28px",
  fontWeight: "bold",
  textAlign: "center" as const,
  color: "#484848",
}

const subheading = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#484848",
  padding: "0 20px",
  marginTop: "20px",
}

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#484848",
  padding: "0 20px",
}

const summarySection = {
  backgroundColor: "#f0f9ff",
  border: "2px solid #3b82f6",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px",
  textAlign: "center" as const,
}

const summaryText = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#1e40af",
  margin: "0",
}

const orderSection = {
  padding: "15px 20px",
  backgroundColor: "#f8f9fa",
  margin: "10px 20px",
  borderRadius: "6px",
  borderLeft: "4px solid #22c55e",
}

const orderHeader = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#374151",
  margin: "0 0 5px 0",
}

const orderDetails = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0 0 10px 0",
}

const itemsList = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "0",
  fontStyle: "italic",
}

const hr = {
  borderColor: "#f0f0f0",
  margin: "20px 0",
}

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  margin: "20px 0 0 0",
}
