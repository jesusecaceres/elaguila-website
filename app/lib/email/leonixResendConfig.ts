/**
 * Shared Resend configuration for Leonix contact + transactional email.
 *
 * Required in production (Vercel):
 * - RESEND_API_KEY — from Resend dashboard or Vercel Resend integration
 *
 * Recommended (override default From):
 * - LEONIX_EMAIL_FROM or LEONIX_RESEND_FROM or TIENDA_ORDER_EMAIL_FROM
 *   e.g. Leonix Media <notifications@leonixmedia.com>
 *
 * Notification recipient (To):
 * - LEONIX_NOTIFICATION_EMAIL (defaults to info@leonixmedia.com)
 */

export const LEONIX_RESEND_DEFAULT_FROM = "Leonix Media <noreply@leonixmedia.com>";

export type LeonixResendMissing = "RESEND_API_KEY" | "FROM_ADDRESS";

export type LeonixResendConfig =
  | { ok: true; apiKey: string; from: string }
  | { ok: false; code: "NOT_CONFIGURED"; missing: LeonixResendMissing[]; message: string };

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const v of values) {
    const t = v?.trim();
    if (t) return t;
  }
  return "";
}

export function resolveLeonixResendConfig(): LeonixResendConfig {
  const apiKey = firstNonEmpty(process.env.RESEND_API_KEY);
  const fromExplicit = firstNonEmpty(
    process.env.LEONIX_EMAIL_FROM,
    process.env.LEONIX_RESEND_FROM,
    process.env.TIENDA_ORDER_EMAIL_FROM,
    process.env.CONTACT_FROM_EMAIL,
    process.env.RESEND_FROM,
  );
  const from = fromExplicit || (apiKey ? LEONIX_RESEND_DEFAULT_FROM : "");

  const missing: LeonixResendMissing[] = [];
  if (!apiKey) missing.push("RESEND_API_KEY");
  if (!from) missing.push("FROM_ADDRESS");

  if (missing.length > 0) {
    const message =
      missing.includes("RESEND_API_KEY") && missing.includes("FROM_ADDRESS")
        ? "RESEND_API_KEY and FROM address are not configured"
        : missing.includes("RESEND_API_KEY")
          ? "RESEND_API_KEY is not configured"
          : "FROM address is not configured (set LEONIX_EMAIL_FROM or LEONIX_RESEND_FROM)";
    return { ok: false, code: "NOT_CONFIGURED", missing, message };
  }

  if (!fromExplicit && apiKey) {
    console.warn(
      "[leonix-email] using default FROM noreply@leonixmedia.com — set LEONIX_EMAIL_FROM or LEONIX_RESEND_FROM to a Resend-verified sender if delivery fails",
    );
  }

  return { ok: true, apiKey, from };
}

export function logLeonixResendConfigMissing(scope: string, config: Extract<LeonixResendConfig, { ok: false }>): void {
  console.error(`[leonix-email] scope=${scope} reason=not_configured missing=${config.missing.join(",")}`);
}
