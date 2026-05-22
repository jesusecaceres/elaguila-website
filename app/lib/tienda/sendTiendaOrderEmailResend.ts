import { logLeonixEmailFailure } from "@/app/lib/email/logLeonixEmailFailure";
import { TIENDA_ORDER_INBOX } from "./orderEmailConstants";

type ResendErrorBody = { message?: string };

/**
 * Sends transactional email via Resend HTTP API (no extra npm dependency).
 * Set RESEND_API_KEY in the server environment.
 * Set TIENDA_ORDER_EMAIL_FROM to a verified sender, e.g. "Leonix Tienda <noreply@yourdomain.com>".
 */
export async function sendTiendaOrderEmailResend(input: {
  subject: string;
  text: string;
  html: string;
  /** Defaults to Tienda order inbox (tienda@leonixmedia.com). */
  to?: string | string[];
  replyTo?: string;
}): Promise<{ ok: true } | { ok: false; message: string; code: "NOT_CONFIGURED" | "RESEND_ERROR" }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.TIENDA_ORDER_EMAIL_FROM?.trim() ||
    process.env.LEONIX_RESEND_FROM?.trim() ||
    null;
  if (!apiKey) {
    const message = "RESEND_API_KEY is not configured";
    logLeonixEmailFailure("tienda-resend", message);
    return { ok: false, message, code: "NOT_CONFIGURED" };
  }
  if (!from) {
    const message = "TIENDA_ORDER_EMAIL_FROM or LEONIX_RESEND_FROM is not configured";
    logLeonixEmailFailure("tienda-resend", message);
    return { ok: false, message, code: "NOT_CONFIGURED" };
  }

  const to = Array.isArray(input.to) ? input.to : [input.to ?? TIENDA_ORDER_INBOX];

  const payload: Record<string, unknown> = {
    from,
    to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  };
  const replyTo = input.replyTo?.trim();
  if (replyTo) {
    payload.reply_to = replyTo;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = `Resend HTTP ${res.status}`;
    try {
      const j = (await res.json()) as ResendErrorBody;
      if (j?.message) msg = `${msg}: ${j.message}`;
    } catch {
      /* ignore */
    }
    logLeonixEmailFailure("tienda-resend", msg);
    return { ok: false, message: msg, code: "RESEND_ERROR" };
  }

  return { ok: true };
}
