import { Body, Container, Head, Heading, Html, Preview, Text, Row, Column, Hr, Section } from "@react-email/components"

interface DailySummaryEmailProps {
  date: string
  totalOrders: number
  totalRevenue: number
  arrivedOrders: number
  pendingOrders: number
  itemSummary: Record<string, { quantity: number; revenue: number }>
  customerOrders: Array<{
    name: string
    email: string
    total: number
    status: string
    items: Array<{ name: string; quantity: number; price: number }>
  }>
}

export const DailySummaryEmail = ({
  date,
  totalOrders,
  totalRevenue,
  arrivedOrders,
  pendingOrders,
  itemSummary,
  customerOrders,
}: DailySummaryEmailProps) => (
  <Html>
    <Head />
    <Preview>Daily Order Summary for Camp Simcha Dougies - {date}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>📊 Daily Order Summary</Heading>
        <Text style={paragraph}>
          <strong>Date:</strong> {date}
        </Text>

        <Section style={summarySection}>
          <Row>
            <Column style={summaryBox}>
              <Text style={summaryNumber}>{totalOrders}</Text>
              <Text style={summaryLabel}>Total Orders</Text>
            </Column>
            <Column style={summaryBox}>
              <Text style={summaryNumber}>${totalRevenue.toFixed(2)}</Text>
              <Text style={summaryLabel}>Total Revenue</Text>
            </Column>
          </Row>
          <Row>
            <Column style={summaryBox}>
              <Text style={summaryNumberGreen}>{arrivedOrders}</Text>
              <Text style={summaryLabel}>Completed Orders</Text>
            </Column>
            <Column style={summaryBox}>
              <Text style={summaryNumberOrange}>{pendingOrders}</Text>
              <Text style={summaryLabel}>Pending Orders</Text>
            </Column>
          </Row>
        </Section>

        <Hr style={hr} />

        <Heading as="h2" style={subheading}>
          🍽️ Item Summary
        </Heading>
        {Object.entries(itemSummary).map(([itemName, data]) => (
          <Row key={itemName} style={itemRow}>
            <Column>
              <Text style={itemText}>{itemName}</Text>
            </Column>
            <Column style={{ textAlign: "center" }}>
              <Text style={itemText}>{data.quantity} sold</Text>
            </Column>
            <Column style={{ textAlign: "right" }}>
              <Text style={itemText}>${data.revenue.toFixed(2)}</Text>
            </Column>
          </Row>
        ))}

        <Hr style={hr} />

        <Heading as="h2" style={subheading}>
          👥 Customer Orders
        </Heading>
        {customerOrders.map((customer, index) => (
          <Section key={index} style={customerSection}>
            <Text style={customerHeader}>
              <strong>{customer.name}</strong> ({customer.email}) - ${customer.total.toFixed(2)}
              <span style={customer.status === "Arrived" ? statusCompleted : statusPending}>
                {customer.status === "Arrived" ? " ✅ COMPLETED" : " ⏳ PENDING"}
              </span>
            </Text>
            {customer.items.map((item, itemIndex) => (
              <Text key={itemIndex} style={customerItem}>
                • {item.name} x{item.quantity} - ${(item.price * item.quantity).toFixed(2)}
              </Text>
            ))}
          </Section>
        ))}

        <Hr style={hr} />

        {pendingOrders > 0 && (
          <Section style={reminderSection}>
            <Text style={reminderText}>
              📋 <strong>Reminder:</strong> You have {pendingOrders} pending order{pendingOrders > 1 ? "s" : ""} that
              still need to be marked as arrived.
            </Text>
          </Section>
        )}

        <Text style={footer}>
          Camp Simcha Dougies - End of Day Summary
          <br />
          This summary is automatically sent when your daily ordering window closes.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default DailySummaryEmail

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
  padding: "20px",
  backgroundColor: "#f8f9fa",
  margin: "20px",
  borderRadius: "8px",
}

const summaryBox = {
  textAlign: "center" as const,
  padding: "10px",
}

const summaryNumber = {
  fontSize: "32px",
  fontWeight: "bold",
  color: "#2563eb",
  margin: "0",
}

const summaryNumberGreen = {
  fontSize: "32px",
  fontWeight: "bold",
  color: "#16a34a",
  margin: "0",
}

const summaryNumberOrange = {
  fontSize: "32px",
  fontWeight: "bold",
  color: "#ea580c",
  margin: "0",
}

const summaryLabel = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "5px 0 0 0",
}

const itemRow = {
  padding: "8px 20px",
  borderBottom: "1px solid #f0f0f0",
}

const itemText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#5f5f5f",
  margin: "0",
}

const customerSection = {
  padding: "15px 20px",
  backgroundColor: "#f8f9fa",
  margin: "10px 20px",
  borderRadius: "6px",
}

const customerHeader = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#374151",
  margin: "0 0 10px 0",
}

const customerItem = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "5px 0",
  paddingLeft: "10px",
}

const statusCompleted = {
  color: "#16a34a",
  fontSize: "12px",
  fontWeight: "bold",
}

const statusPending = {
  color: "#ea580c",
  fontSize: "12px",
  fontWeight: "bold",
}

const reminderSection = {
  backgroundColor: "#fef3c7",
  border: "2px solid #f59e0b",
  borderRadius: "8px",
  padding: "15px",
  margin: "20px",
}

const reminderText = {
  fontSize: "16px",
  color: "#92400e",
  margin: "0",
  textAlign: "center" as const,
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
}
