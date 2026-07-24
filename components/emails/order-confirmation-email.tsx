import { Body, Container, Head, Heading, Html, Preview, Text, Row, Column, Hr } from "@react-email/components"

interface OrderConfirmationEmailProps {
  order: {
    items: { name: string; quantity: number; price: number }[]
    total: number
    userName: string
  }
  orderId: string
}

export const OrderConfirmationEmail = ({ order, orderId }: OrderConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Camp Simcha Dougies Order Confirmation</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Thanks for your order!</Heading>
        <Text style={paragraph}>
          Hi {order.userName}, we've received your Camp Simcha Dougies order and will let you know once it's ready. Your
          order ID is <strong>#{orderId.substring(0, 6)}</strong>.
        </Text>
        <Hr style={hr} />
        <Heading as="h2" style={subheading}>
          Order Summary
        </Heading>
        {order.items.map((item) => (
          <Row key={item.name}>
            <Column>
              <Text style={itemText}>
                {item.name} (x{item.quantity})
              </Text>
            </Column>
            <Column style={{ textAlign: "right" }}>
              <Text style={itemText}>${(item.price * item.quantity).toFixed(2)}</Text>
            </Column>
          </Row>
        ))}
        <Hr style={hr} />
        <Row>
          <Column>
            <Text style={totalText}>Total</Text>
          </Column>
          <Column style={{ textAlign: "right" }}>
            <Text style={totalText}>${order.total.toFixed(2)}</Text>
          </Column>
        </Row>
        <Hr style={hr} />
        <Text style={footer}>Camp Simcha Dougies Ordering</Text>
      </Container>
    </Body>
  </Html>
)

export default OrderConfirmationEmail

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
}

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#484848",
  padding: "0 20px",
}

const itemText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#5f5f5f",
  padding: "0 20px",
}

const totalText = {
  ...itemText,
  fontWeight: "bold",
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
