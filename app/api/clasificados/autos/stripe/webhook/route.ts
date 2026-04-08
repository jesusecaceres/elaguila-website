import { NextResponse } from "next/server";
import Stripe from "stripe";
import { tryActivateAutosListingAfterPayment } from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
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
    const listingId = session.metadata?.listing_id ?? session.client_reference_id ?? undefined;
    if (listingId && session.payment_status === "paid") {
      await tryActivateAutosListingAfterPayment(listingId);
    }
  }
  return NextResponse.json({ received: true });
}
