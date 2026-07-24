import "server-only"
import { Resend } from "resend"

/**
 * Centralized email configuration.
 *
 * All values come from environment variables so that secrets are never
 * committed to the repository. See `.env.example` for the full list.
 *
 * Required:
 *   RESEND_API_KEY  – API key from https://resend.com/api-keys
 *
 * Optional (sensible defaults below):
 *   EMAIL_FROM      – verified "from" address for all outgoing mail
 *   ADMIN_EMAILS    – comma-separated list of admin notification recipients
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY

/** Verified sender address. Must belong to a domain verified in Resend. */
export const FROM_EMAIL = process.env.EMAIL_FROM ?? "dougies@abbrachfeld.com"

/** Admin recipients for new-order and daily-summary notifications. */
export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "abbrachfeld@gmail.com,kobygryfe@gmail.com")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean)

/** True when a Resend API key is present, so callers can degrade gracefully. */
export const isEmailConfigured = Boolean(RESEND_API_KEY)

let cachedClient: Resend | null = null

/**
 * Returns a lazily-instantiated Resend client, or `null` when the API key is
 * not configured. Returning `null` (instead of throwing) lets order placement
 * succeed even if email delivery is temporarily unavailable.
 */
export function getResendClient(): Resend | null {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is not set — skipping email send. Add it to your environment to enable email.")
    return null
  }
  if (!cachedClient) {
    cachedClient = new Resend(RESEND_API_KEY)
  }
  return cachedClient
}
