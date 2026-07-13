import { NextResponse } from "next/server";
import { saveNewsletterSubscriber } from "@/app/lib/leonix/leadCaptureServer";
import { isValidLeadEmail, normalizeLeadEmail } from "@/app/lib/leonix/leadCaptureValidation";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

/**
 * Best-effort newsletter/contact capture from PAID checkout opt-in checkboxes.
 * Gate: CHECKOUT-NEWSLETTER-CHECKBOX-CAPTURE-01
 *
 * This route reuses the existing `saveNewsletterSubscriber` pattern (same table,
 * same schema). It NEVER creates promo codes, NEVER sends email, and NEVER
 * touches Stripe/checkout. It always returns HTTP 200 so a slow or failed save
 * can never surface as a checkout error to the customer.
 */
export const runtime = "nodejs";

const MAX_BODY_BYTES = 8_192;

/** Server allowlist — must match the client `CHECKOUT_NEWSLETTER_SOURCES`. */
const ALLOWED_SOURCES = new Set([
  "restaurantes_checkout",
  "rentas_checkout",
  "empleos_checkout",
  "autos_privado_checkout",
  "autos_dealer_checkout",
  "bienes_fsbo_checkout",
]);

/** Category/audience tags derived from source so admin/export is always clear. */
const SOURCE_TAGS: Record<string, string[]> = {
  restaurantes_checkout: ["category:restaurantes", "audience:business"],
  rentas_checkout: ["category:rentas", "audience:seller"],
  empleos_checkout: ["category:empleos", "audience:business"],
  autos_privado_checkout: ["category:autos", "seller:private", "audience:seller"],
  autos_dealer_checkout: ["category:autos", "seller:dealer", "audience:business"],
  bienes_fsbo_checkout: ["category:bienes-raices", "seller:fsbo", "audience:seller"],
};

const OPT_IN_TAG = "cta:checkout_newsletter_opt_in";

export async function POST(req: Request) {
  // Best-effort: any failure returns 200 + skipped so checkout is never affected.
  try {
    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: true, skipped: true, reason: "payload_too_large" });
    }

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({ ok: true, skipped: true, reason: "not_configured" });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: true, skipped: true, reason: "bad_json" });
    }
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: true, skipped: true, reason: "bad_body" });
    }

    const o = body as Record<string, unknown>;
    const source = String(o.source ?? "").trim();
    if (!ALLOWED_SOURCES.has(source)) {
      return NextResponse.json({ ok: true, skipped: true, reason: "source_not_eligible" });
    }

    const email = normalizeLeadEmail(String(o.email ?? ""));
    if (!isValidLeadEmail(email)) {
      return NextResponse.json({ ok: true, skipped: true, reason: "missing_email" });
    }

    const providedInterests = Array.isArray(o.interests)
      ? o.interests.map((x) => String(x)).filter(Boolean)
      : [];
    const interests = Array.from(
      new Set([OPT_IN_TAG, ...(SOURCE_TAGS[source] ?? []), ...providedInterests]),
    )
      .join("; ")
      .slice(0, 2000);

    // Business name folds into name only when no explicit name is provided.
    const name =
      (o.name != null && String(o.name).trim()) ||
      (o.businessName != null ? String(o.businessName).trim() : "") ||
      undefined;

    let supabase;
    try {
      supabase = getAdminSupabase();
    } catch {
      return NextResponse.json({ ok: true, skipped: true, reason: "not_configured" });
    }

    const result = await saveNewsletterSubscriber(supabase, {
      email,
      name,
      city: o.city != null ? String(o.city) : undefined,
      zipCode: o.zipCode != null ? String(o.zipCode) : undefined,
      preferredLanguage: o.preferredLanguage,
      interests,
      source,
      lang: o.lang,
      consentTimestamp: new Date().toISOString(),
    });

    if (!result.ok) {
      console.warn("[newsletter] checkout capture save failed", { source, error: result.error });
      return NextResponse.json({ ok: false, reason: result.error });
    }

    return NextResponse.json({ ok: true, saved: true, updated: result.updated });
  } catch (e) {
    console.warn("[newsletter] checkout capture threw", {
      message: e instanceof Error ? e.message : "unknown",
    });
    return NextResponse.json({ ok: false, reason: "exception" });
  }
}
