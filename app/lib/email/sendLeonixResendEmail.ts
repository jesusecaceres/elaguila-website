import { logLeonixEmailFailure } from "./logLeonixEmailFailure";
import {
  logLeonixResendConfigMissing,
  resolveLeonixResendConfig,
  type LeonixResendConfig,
} from "./leonixResendConfig";

/**
 * Shared Resend HTTP sender (same pattern as `sendTiendaOrderEmailResend`).
 * Requires RESEND_API_KEY and a verified From address.
 */
type ResendErrorBody = { message?: string };

export type LeonixResendSendResult =
  | { ok: true }
  | { ok: false; message: string; code: "NOT_CONFIGURED" | "RESEND_ERROR" };

async function postResendEmail(
  scope: string,
  config: Extract<LeonixResendConfig, { ok: true }>,
  input: {
    to: string[];
    subject: string;
    text: string;
    html: string;
    replyTo?: string;
  },
): Promise<LeonixResendSendResult> {
  const payload: Record<string, unknown> = {
    from: config.from,
    to: input.to,
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
      Authorization: `Bearer ${config.apiKey}`,
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
    logLeonixEmailFailure(scope, msg);
    return { ok: false, message: msg, code: "RESEND_ERROR" };
  }

  console.info(`[leonix-email] scope=${scope} reason=accepted_by_provider`);
  return { ok: true };
}

export async function sendLeonixResendEmail(input: {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}): Promise<LeonixResendSendResult> {
  const config = resolveLeonixResendConfig();
  if (!config.ok) {
    logLeonixResendConfigMissing("leonix-resend", config);
    return { ok: false, message: config.message, code: "NOT_CONFIGURED" };
  }

  const to = Array.isArray(input.to) ? input.to : [input.to];
  return postResendEmail("leonix-resend", config, { ...input, to });
}

export async function sendLeonixResendEmailWithConfig(
  scope: string,
  input: {
    to: string | string[];
    subject: string;
    text: string;
    html: string;
    replyTo?: string;
  },
): Promise<LeonixResendSendResult> {
  const config = resolveLeonixResendConfig();
  if (!config.ok) {
    logLeonixResendConfigMissing(scope, config);
    return { ok: false, message: config.message, code: "NOT_CONFIGURED" };
  }

  const to = Array.isArray(input.to) ? input.to : [input.to];
  return postResendEmail(scope, config, { ...input, to });
}
