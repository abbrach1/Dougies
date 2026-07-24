import { Body, Container, Head, Heading, Html, Preview, Text, Button, Section } from "@react-email/components"

interface OrderArrivedEmailProps {
  orderId: string
  customerName?: string
}

export const OrderArrivedEmail = ({ orderId, customerName = "Customer" }: OrderArrivedEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Camp Simcha Dougies Order Has Arrived! 📦</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Text style={emoji}>📦</Text>
          <Heading style={heading}>Your Order Has Arrived!</Heading>
        </Section>

        <Text style={paragraph}>Hi {customerName}!</Text>

        <Text style={paragraph}>
          Great news! Your Camp Simcha Dougies order <strong>#{orderId.substring(0, 6)}</strong> has arrived and is
          ready for pickup.
        </Text>

        <Section style={highlightBox}>
          <Text style={highlightText}>🎉 Your delicious Camp Simcha Dougies are ready!</Text>
        </Section>

        <Text style={paragraph}>
          Please come by to pick up your order at your earliest convenience. Thank you for choosing Camp Simcha Dougies!
        </Text>

        <Text style={paragraph}>We hope you enjoy your meal! 😊</Text>

        <Button style={button} href="https://dougies-7356f.web.app">
          Order Again from Camp Simcha Dougies
        </Button>

        <Text style={footer}>
          Camp Simcha Dougies
          <br />
          Thank you for your order!
        </Text>
      </Container>
    </Body>
  </Html>
)

export default OrderArrivedEmail

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
  textAlign: "center" as const,
}

const headerSection = {
  padding: "20px 0",
}

const emoji = {
  fontSize: "48px",
  margin: "0 0 20px 0",
}

const heading = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#484848",
  margin: "0 0 20px 0",
}

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#484848",
  padding: "0 20px",
  margin: "16px 0",
}

const highlightBox = {
  backgroundColor: "#f0f9ff",
  border: "2px solid #3b82f6",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 20px",
}

const highlightText = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#1e40af",
  margin: "0",
}

const button = {
  backgroundColor: "#5E5DF0",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "15px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 20px",
  margin: "20px 0",
}

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  margin: "40px 0 0 0",
}
