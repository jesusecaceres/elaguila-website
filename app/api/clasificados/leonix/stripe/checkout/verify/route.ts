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
  // Gate RENTAS-NEGOCIO-1 — this LEGACY endpoint previously accepted ANY paid Stripe session
  // and activated whatever `listing_id` its metadata named, through the generic branch of
  // `tryActivateBrListingAfterPayment`. Its sibling webhook
  // (`/api/clasificados/leonix/stripe/webhook`) has carried both guards below since Package C
  // Build 1; this route never received them, which made it a reachable activation bypass for
  // every other category on the shared `listings` table — Rentas included.
  //
  // Both guards are copied verbatim in intent from that webhook, so the two halves of the
  // legacy lane now agree. There is exactly ONE proven runtime consumer of this route
  // (`BrPagoExitoClient`, the Bienes Raíces success page), and it only ever presents genuine
  // legacy Bienes Raíces sessions — so scoping to that consumer removes the bypass without
  // removing anything live.
  //
  // Guard 1 — never re-process a canonical Revenue OS session. Those are fulfilled
  // exclusively by /api/revenue-os/webhook, which is the single paid-activation authority for
  // every current checkout. A canonical session IS `paid`, so without this a live Rentas
  // checkout's own session id would have been accepted here.
  const metadataKeys = Object.keys(session.metadata ?? {});
  if (metadataKeys.some((k) => k.startsWith("leonix_"))) {
    return NextResponse.json(
      { ok: false, error: "canonical_revenue_os_session" },
      { status: 409 },
    );
  }

  // Guard 2 — legacy Bienes Raíces sessions only. Anything else fails CLOSED.
  if (session.metadata?.category !== "bienes-raices") {
    return NextResponse.json({ ok: false, error: "unsupported_category" }, { status: 409 });
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
