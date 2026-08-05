import { NextResponse } from "next/server";
import Stripe from "stripe";
import { recordAutosClassifiedsListingEvent } from "@/app/lib/clasificados/autos/autosClassifiedsAnalyticsService";
import { AUTOS_CLASSIFIEDS_EVENT } from "@/app/lib/clasificados/autos/autosClassifiedsEventTypes";
import { getAutosClassifiedsListingById, tryActivateAutosListingAfterPayment } from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import { getStripeSecretKey, getStripeWebhookSecret, isStripeAutosConfigured } from "@/app/lib/clasificados/autos/stripeAutosConfig";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isStripeAutosConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  const whSecret = getStripeWebhookSecret();
  if (!whSecret) {
    return NextResponse.json({ ok: false, error: "webhook_secret_missing" }, { status: 503 });
  }
  const raw = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const stripe = new Stripe(getStripeSecretKey()!, { typescript: true });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, whSecret);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    // Package C Build 1 — explicit source guard (all webhook endpoints share one signing
    // secret, so every event reaches every registered endpoint). This LEGACY handler may only
    // process legacy autos sessions: canonical Revenue OS sessions carry the leonix_* metadata
    // namespace and are fulfilled exclusively by /api/revenue-os/webhook. Without this guard,
    // the client_reference_id fallback below would fire on every canonical payment.
    const metadataKeys = Object.keys(session.metadata ?? {});
    const isCanonicalRevenueOsSession = metadataKeys.some((k) => k.startsWith("leonix_"));
    if (isCanonicalRevenueOsSession) {
      return NextResponse.json({ received: true, ignored: true, reason: "canonical_revenue_os_session" });
    }
    const listingId = session.metadata?.listing_id ?? session.client_reference_id ?? undefined;
    if (listingId && session.payment_status === "paid") {
      const pi = session.payment_intent;
      const piId = typeof pi === "string" ? pi : pi?.id ?? null;
      const result = await tryActivateAutosListingAfterPayment(listingId, { stripePaymentIntentId: piId });
      if (result.ok && result.transitioned) {
        const row = await getAutosClassifiedsListingById(listingId);
        if (row) {
          void recordAutosClassifiedsListingEvent({
            listingId,
            eventType: AUTOS_CLASSIFIEDS_EVENT.paymentConversion,
            lane: row.lane,
            metadata: { source: "stripe_webhook" },
          });
        }
      }
    }
  }
  return NextResponse.json({ received: true });
}
