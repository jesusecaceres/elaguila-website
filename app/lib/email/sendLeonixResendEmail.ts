/**
 * Shared Resend HTTP sender (same pattern as `sendTiendaOrderEmailResend`).
 * Requires RESEND_API_KEY and a verified From address.
 */
type ResendErrorBody = { message?: string };

function resolveFrom(): string | null {
  return (
    process.env.LEONIX_RESEND_FROM?.trim() ||
    process.env.TIENDA_ORDER_EMAIL_FROM?.trim() ||
    null
  );
}

export async function sendLeonixResendEmail(input: {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  /** When set, staff can hit “Reply” in the inbox to reach the submitter. */
  replyTo?: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = resolveFrom();
  if (!apiKey) {
    return { ok: false, message: "RESEND_API_KEY is not configured" };
  }
  if (!from) {
    return {
      ok: false,
      message: "LEONIX_RESEND_FROM or TIENDA_ORDER_EMAIL_FROM is not configured",
    };
  }

  const to = Array.isArray(input.to) ? input.to : [input.to];

  const payload: Record<string, unknown> = {
    from,
    to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  };
  const rt = input.replyTo?.trim();
  if (rt) {
    payload.reply_to = rt;
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
    return { ok: false, message: msg };
  }

  return { ok: true };
}
