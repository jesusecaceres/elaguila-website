import { NextResponse } from "next/server";
import Stripe from "stripe";
import { tryActivateBrListingAfterPayment } from "@/app/lib/clasificados/bienes-raices/brListingPaymentService";
import {
  getBrSiteOrigin,
  getStripeSecretKey,
  isStripeBrConfigured,
} from "@/app/lib/clasificados/bienes-raices/stripeBrConfig";
import { leonixLiveAnuncioPath } from "@/app/clasificados/lib/leonixRealEstateListingContract";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isStripeBrConfigured()) {
    return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 503 });
  }
  const u = new URL(request.url);
  const sessionId = u.searchParams.get("session_id")?.trim();
  const lang = u.searchParams.get("lang") === "en" ? "en" : "es";
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "missing_session_id" }, { status: 400 });
  }
  const stripe = new Stripe(getStripeSecretKey()!, { typescript: true });
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return NextResponse.json({ ok: false, error: "not_paid" }, { status: 402 });
  }
  const listingId = session.metadata?.listing_id ?? session.client_reference_id;
  if (!listingId) {
    return NextResponse.json({ ok: false, error: "missing_listing" }, { status: 400 });
  }
  const pi = session.payment_intent;
  const piId = typeof pi === "string" ? pi : pi?.id ?? null;
  const activation = await tryActivateBrListingAfterPayment(listingId, { stripePaymentIntentId: piId });
  if (!activation.ok) {
    return NextResponse.json({ ok: false, error: "activation_failed" }, { status: 409 });
  }
  const q = lang === "en" ? "lang=en" : "lang=es";
  const livePath = `${getBrSiteOrigin()}${leonixLiveAnuncioPath(listingId)}?${q}`;
  return NextResponse.json({ ok: true, listingId, liveUrl: livePath, lang });
}
