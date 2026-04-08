import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAutosSiteOrigin } from "@/app/lib/clasificados/autos/autosSiteOrigin";
import { getAutosPublishUserIdFromRequest } from "@/app/lib/clasificados/autos/autosListingBearerAuth";
import {
  assertAutosListingOwner,
  isAutosClassifiedsDbConfigured,
  setAutosListingPendingPayment,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import {
  getStripePriceIdForAutosLane,
  getStripeSecretKey,
  isStripeAutosConfigured,
} from "@/app/lib/clasificados/autos/stripeAutosConfig";
import type { AutosClassifiedsLang } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";

export const dynamic = "force-dynamic";

type Body = { listingId?: string; lang?: AutosClassifiedsLang };

export async function POST(request: Request) {
  if (!isAutosClassifiedsDbConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }
  if (!isStripeAutosConfigured()) {
    return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 503 });
  }
  const userId = await getAutosPublishUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const listingId = body.listingId?.trim();
  if (!listingId) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const row = await assertAutosListingOwner(listingId, userId);
  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (row.status !== "draft" && row.status !== "pending_payment") {
    return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 409 });
  }
  const lang: AutosClassifiedsLang = body.lang === "en" || row.lang === "en" ? "en" : "es";
  const priceId = getStripePriceIdForAutosLane(row.lane);
  if (!priceId) {
    return NextResponse.json({ ok: false, error: "stripe_price_missing", lane: row.lane }, { status: 503 });
  }
  const secret = getStripeSecretKey()!;
  const stripe = new Stripe(secret, { typescript: true });
  const origin = getAutosSiteOrigin();
  const qLang = lang === "en" ? "lang=en" : "lang=es";
  const laneQ = `lane=${encodeURIComponent(row.lane)}`;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/clasificados/autos/pago/exito?session_id={CHECKOUT_SESSION_ID}&${qLang}&${laneQ}`,
    cancel_url: `${origin}/clasificados/autos/pago/cancelado?listing_id=${encodeURIComponent(listingId)}&${qLang}&${laneQ}`,
    metadata: {
      listing_id: listingId,
      lane: row.lane,
      lang,
      owner_user_id: userId,
    },
    client_reference_id: listingId,
  });
  if (!session.url) {
    return NextResponse.json({ ok: false, error: "stripe_no_url" }, { status: 500 });
  }
  const ok = await setAutosListingPendingPayment(listingId, session.id);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "persist_session_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, url: session.url, sessionId: session.id });
}
