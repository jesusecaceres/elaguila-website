/**
 * Checkout Newsletter Capture — shared client helper.
 * Gate: CHECKOUT-NEWSLETTER-CHECKBOX-CAPTURE-01
 *
 * Best-effort capture of a newsletter/contact subscriber from a PAID checkout
 * opt-in checkbox. This MUST NEVER block or fail checkout/payment.
 *
 * - Unchecked checkbox → skip (no network).
 * - Missing/invalid email → skip safely.
 * - On checked + valid email → POST to the best-effort capture endpoint, which
 *   reuses the existing `saveNewsletterSubscriber` pattern server-side.
 *
 * This helper does NOT create promo codes, does NOT send email, and does NOT
 * touch Stripe/checkout. It is intentionally fire-and-forget friendly.
 */

/** Canonical checkout capture sources (must match server allowlist). */
export const CHECKOUT_NEWSLETTER_SOURCES = {
  restaurantes: "restaurantes_checkout",
  rentas: "rentas_checkout",
  empleos: "empleos_checkout",
  autosPrivado: "autos_privado_checkout",
} as const;

export type CheckoutNewsletterSource =
  (typeof CHECKOUT_NEWSLETTER_SOURCES)[keyof typeof CHECKOUT_NEWSLETTER_SOURCES];

export const CHECKOUT_NEWSLETTER_OPT_IN_TAG = "cta:checkout_newsletter_opt_in";

export type CheckoutNewsletterCaptureInput = {
  email?: string | null;
  name?: string | null;
  businessName?: string | null;
  city?: string | null;
  zipCode?: string | null;
  preferredLanguage?: "es" | "en" | "both" | string | null;
  lang?: "es" | "en" | string | null;
  source: CheckoutNewsletterSource;
  interests?: string[];
  consentText?: string | null;
  checked: boolean;
};

export type CheckoutNewsletterCaptureResult =
  | { ok: true; skipped?: boolean; reason?: string }
  | { ok: false; skipped?: false; reason?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase().slice(0, 320);
}

/**
 * Fire-and-forget safe capture. Resolves to a result but NEVER throws.
 * Callers should not await this in a way that blocks the checkout redirect.
 */
export async function captureCheckoutNewsletterSubscriber(
  input: CheckoutNewsletterCaptureInput,
): Promise<CheckoutNewsletterCaptureResult> {
  try {
    if (!input.checked) return { ok: true, skipped: true, reason: "unchecked" };

    const email = normalizeEmail(String(input.email ?? ""));
    if (!email || !EMAIL_RE.test(email)) {
      return { ok: true, skipped: true, reason: "missing_email" };
    }

    const interests = Array.from(
      new Set([CHECKOUT_NEWSLETTER_OPT_IN_TAG, ...(input.interests ?? [])].filter(Boolean)),
    );

    const res = await fetch("/api/newsletter/checkout-capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // keepalive lets the request survive the checkout redirect/navigation.
      keepalive: true,
      body: JSON.stringify({
        email,
        name: input.name ?? undefined,
        businessName: input.businessName ?? undefined,
        city: input.city ?? undefined,
        zipCode: input.zipCode ?? undefined,
        preferredLanguage: input.preferredLanguage ?? undefined,
        lang: input.lang ?? undefined,
        source: input.source,
        interests,
        consentText: input.consentText ?? undefined,
      }),
    });

    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    return { ok: true };
  } catch {
    // Newsletter capture is best-effort only. Swallow all errors.
    return { ok: false, reason: "network_error" };
  }
}
