/**
 * Gate QB-BILLING-01 — server-created Stripe Billing Portal session.
 *
 * POST {category: string, listingId?: string, returnPath?: string}
 *
 * Replaces the static NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL env var. Resolves
 * the Stripe customer ID from the server-side payment ledger for the authenticated
 * user. Never accepts a browser-supplied Stripe customer ID. Return URL is
 * allowlisted to /publicar/negocio-rapido/* and /dashboard/* patterns.
 */
import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_RETURN_PATH_PREFIXES = [
  "/publicar/negocio-rapido",
  "/dashboard",
  "/clasificados",
] as const;

function isAllowedReturnPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  for (const prefix of ALLOWED_RETURN_PATH_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`)) return true;
  }
  return false;
}

function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { typescript: true });
}

function getBaseUrl(): string {
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? LEONIX_SITE_ORIGIN;
}

async function resolveStripeCustomerIdForUser(
  ownerUserId: string,
  category: string,
  listingId: string | null,
): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const db = getAdminSupabase();
  // Find the most recent paid subscription for this user+category that has a Stripe customer ID.
  let query = db
    .from("leonix_payment_records")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("owner_user_id", ownerUserId)
    .eq("category", category)
    // Canonical Revenue OS rows use monthly_subscription; keep subscription for legacy compatibility.
    .in("billing_mode", ["monthly_subscription", "subscription"])
    .in("payment_status", ["paid", "succeeded"])
    .not("stripe_customer_id", "is", null)
    .not("stripe_subscription_id", "is", null);

  // Dashboard callers always send the exact canonical listing id. This prevents an owner with
  // multiple subscriptions in one category from opening the wrong customer's/listing's portal.
  if (listingId) query = query.eq("listing_id", listingId);

  const { data } = await query
    .order("paid_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const customerId = typeof data?.stripe_customer_id === "string" ? data.stripe_customer_id.trim() : null;
  return customerId || null;
}

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 503 });
  }

  const ownerUserId = await getBearerUserId(request);
  if (!ownerUserId) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  let body: { category?: unknown; listingId?: unknown; returnPath?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const category = typeof body.category === "string" ? body.category.trim() : "";
  if (!category) {
    return NextResponse.json({ ok: false, error: "category_required" }, { status: 400 });
  }

  // Map doorway category key to payment-record category
  const categoryMap: Record<string, string> = {
    "servicios": "servicios",
    "restaurantes": "restaurantes",
    "autos-dealer": "autos",
    "bienes-negocio": "bienes-raices",
  };
  const paymentCategory = categoryMap[category];
  if (!paymentCategory) {
    return NextResponse.json({ ok: false, error: "unsupported_category" }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) {
    return NextResponse.json({ ok: false, error: "listing_id_required" }, { status: 400 });
  }

  const stripeCustomerId = await resolveStripeCustomerIdForUser(
    ownerUserId,
    paymentCategory,
    listingId,
  );
  if (!stripeCustomerId) {
    return NextResponse.json({ ok: false, error: "no_subscription_found" }, { status: 404 });
  }

  const rawReturnPath = typeof body.returnPath === "string" ? body.returnPath.trim() : "";
  const returnPath = rawReturnPath && isAllowedReturnPath(rawReturnPath)
    ? rawReturnPath
    : "/publicar/negocio-rapido/mi-negocio";
  const baseUrl = getBaseUrl();
  const returnUrl = `${baseUrl}${returnPath}`;

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });
    return NextResponse.json({ ok: true, url: portalSession.url });
  } catch (e) {
    const message = e instanceof Error ? e.message.slice(0, 200) : "stripe_error";
    return NextResponse.json({ ok: false, error: "portal_session_failed", message }, { status: 502 });
  }
}
