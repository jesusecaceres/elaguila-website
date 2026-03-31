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
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.TIENDA_ORDER_EMAIL_FROM?.trim();
  if (!apiKey) {
    return { ok: false, message: "RESEND_API_KEY is not configured" };
  }
  if (!from) {
    return { ok: false, message: "TIENDA_ORDER_EMAIL_FROM is not configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [TIENDA_ORDER_INBOX],
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });

  if (!res.ok) {
    let msg = `Resend HTTP ${res.status}`;
    try {
      const j = (await res.json()) as ResendErrorBody;
      if (j?.message) msg = `${msg}: ${j.message}`;
    } catch {
      /* ignore */
    }
    return { ok: false, message: msg };
  }

  return { ok: true };
}
