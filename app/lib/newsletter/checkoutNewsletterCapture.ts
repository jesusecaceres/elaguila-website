/**
 * Checkout Newsletter Capture — shared client helper.
 * Gate: CHECKOUT-NEWSLETTER-CHECKBOX-CAPTURE-01
 *
 * Best-effort capture of a newsletter/contact subscriber from a PAID checkout
 * opt-in checkbox. This MUST NEVER block or fail checkout/payment.
 *
 * - Unchecked checkbox -> SKIPPED (no network), reason "unchecked".
 * - Missing/invalid email while checked -> FAILED (no network), reason "missing_email".
 *   (Newsletter Engine v2: this used to be a silent "ok:true, skipped" no-op that hid a real
 *   gap — a session-fetch race leaving `email` null at checkout time. Callers must now check the
 *   result and surface FAILED, even though checkout itself must still proceed.)
 * - On checked + valid email -> POST to the capture endpoint, which reuses the existing
 *   `saveNewsletterSubscriber` pattern server-side, and resolves to whatever discriminated
 *   status the server reports (SUCCESS / ALREADY_SUBSCRIBED / PENDING_VERIFICATION / FAILED).
 *
 * This helper does NOT create promo codes, does NOT send email, and does NOT
 * touch Stripe/checkout. Callers must AWAIT the returned promise and react to a FAILED result
 * with a non-blocking inline note (see PublishCheckoutCheckpoint's `newsletterCaptureNote`
 * prop) — never with `void` fire-and-forget, and never by blocking the paid transaction.
 */

/** Canonical checkout capture sources (must match server allowlist). */
export const CHECKOUT_NEWSLETTER_SOURCES = {
  restaurantes: "restaurantes_checkout",
  servicios: "servicios_checkout",
  comidaLocal: "comida_local_checkout",
  rentas: "rentas_checkout",
  empleos: "empleos_checkout",
  autosPrivado: "autos_privado_checkout",
  autosDealer: "autos_dealer_checkout",
  bienesFsbo: "bienes_fsbo_checkout",
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

/**
 * Truthful, discriminated capture outcome — never a bare boolean/void.
 *
 * SUCCESS / ALREADY_SUBSCRIBED / FAILED are live outcomes from the current write path.
 * PENDING_VERIFICATION is reserved for a future double-opt-in flow (see
 * app/lib/newsletter/newsletterVerificationState.ts) — no current server code returns it yet.
 * SKIPPED covers the two legitimate non-attempts (box unchecked; server capture not configured).
 */
export type CheckoutNewsletterCaptureResult =
  | { status: "SUCCESS"; updated?: boolean }
  | { status: "ALREADY_SUBSCRIBED" }
  | { status: "PENDING_VERIFICATION" }
  | { status: "FAILED"; reason: string }
  | { status: "SKIPPED"; reason: "unchecked" | "not_configured" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase().slice(0, 320);
}

/**
 * Best-effort capture. Resolves to a real discriminated result and NEVER throws — but it is no
 * longer a "fake success": a missing/invalid email while checked resolves to FAILED, not a
 * silent skip. Callers MUST await this and react to FAILED (console + non-blocking inline note);
 * they must never gate checkout/publish on the result.
 */
export async function captureCheckoutNewsletterSubscriber(
  input: CheckoutNewsletterCaptureInput,
): Promise<CheckoutNewsletterCaptureResult> {
  try {
    if (!input.checked) return { status: "SKIPPED", reason: "unchecked" };

    const email = normalizeEmail(String(input.email ?? ""));
    if (!email || !EMAIL_RE.test(email)) {
      // Newsletter Engine v2: previously reported as a fake "ok:true, skipped" success. A missing
      // email here is a real gap (e.g. a session-fetch race) that the caller should know about.
      return { status: "FAILED", reason: "missing_email" };
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

    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }

    if (!res.ok) return { status: "FAILED", reason: `http_${res.status}` };

    const responseBody = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const status = responseBody.status;
    const reason = responseBody.reason;

    if (status === "SUCCESS" || status === "ALREADY_SUBSCRIBED" || status === "PENDING_VERIFICATION") {
      return { status };
    }
    if (status === "SKIPPED") {
      return { status: "SKIPPED", reason: reason === "not_configured" ? "not_configured" : "unchecked" };
    }
    if (status === "FAILED") {
      return { status: "FAILED", reason: String(reason ?? "unknown") };
    }

    // Unrecognized/legacy response shape — treat as failed rather than a fake success.
    return { status: "FAILED", reason: "bad_response" };
  } catch {
    // Network/exception failure. Newsletter capture is best-effort — checkout must still proceed
    // — but the failure itself must be real and visible to the caller, never swallowed silently.
    return { status: "FAILED", reason: "network_error" };
  }
}
