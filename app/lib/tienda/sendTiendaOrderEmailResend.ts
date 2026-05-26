import { LEONIX_TIENDA_EMAIL } from "@/app/tienda/data/leonixContact";
import { sendLeonixResendEmailWithConfig } from "@/app/lib/email/sendLeonixResendEmail";
import { TIENDA_ORDER_INBOX } from "./orderEmailConstants";

/**
 * Sends transactional email via Resend HTTP API (no extra npm dependency).
 * Set RESEND_API_KEY in the server environment.
 * Optional: LEONIX_RESEND_FROM or TIENDA_ORDER_EMAIL_FROM (falls back to noreply@leonixmedia.com).
 */
export async function sendTiendaOrderEmailResend(input: {
  subject: string;
  text: string;
  html: string;
  /** Defaults to Tienda order inbox (info@leonixmedia.com). */
  to?: string | string[];
  replyTo?: string;
}) {
  const to = input.to ?? TIENDA_ORDER_INBOX;
  return sendLeonixResendEmailWithConfig("tienda-resend", {
    to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
  });
}

/** Tienda / print contact form — delivers to info@leonixmedia.com via Resend. */
export async function sendTiendaContactEmail(input: {
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}) {
  return sendLeonixResendEmailWithConfig("tienda-contact", {
    to: LEONIX_TIENDA_EMAIL,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
  });
}
