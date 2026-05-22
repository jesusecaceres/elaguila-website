import { LEONIX_TIENDA_EMAIL } from "@/app/tienda/data/leonixContact";
import { sendTiendaOrderEmailResend } from "./sendTiendaOrderEmailResend";

/** Tienda / print contact form — delivers to tienda@leonixmedia.com via Resend. */
export async function sendTiendaContactEmail(input: {
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}) {
  return sendTiendaOrderEmailResend({
    to: LEONIX_TIENDA_EMAIL,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
  });
}
