import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAutosSiteOrigin } from "@/app/lib/clasificados/autos/autosSiteOrigin";
import { getAutosPublishUserIdFromRequest } from "@/app/lib/clasificados/autos/autosListingBearerAuth";
import {
  activateAutosClassifiedsListing,
  assertAutosListingOwner,
  getAutosClassifiedsListingById,
  getAutosDealerInventorySummaryForOwner,
  isAutosClassifiedsDbConfigured,
  setAutosListingPendingPayment,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import {
  getStripePriceIdForAutosLane,
  getStripeSecretKey,
  isStripeAutosConfigured,
} from "@/app/lib/clasificados/autos/stripeAutosConfig";
import { isAutosInternalPublishPaymentBypassEnabled } from "@/app/lib/clasificados/autos/autosInternalPublishConfig";
import { isAutosAllowTestPublishBypassEnabled } from "@/app/lib/clasificados/autos/autosTestPublishBypass";
import { autosLiveVehiclePath } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import type { AutosClassifiedsLang } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import { autosDealerInventoryLimitMessage } from "@/app/lib/clasificados/autos/autosDealerInventoryCopy";

export const dynamic = "force-dynamic";

type Body = { listingId?: string; lang?: AutosClassifiedsLang; returnToListingId?: string };

function dealerLimitMessage(lang: AutosClassifiedsLang): string {
  return autosDealerInventoryLimitMessage(lang);
}

export async function POST(request: Request) {
  if (!isAutosClassifiedsDbConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }
  const internalBypass = isAutosInternalPublishPaymentBypassEnabled();
  const testPublishBypass = isAutosAllowTestPublishBypassEnabled();
  if (!internalBypass && !testPublishBypass && !isStripeAutosConfigured()) {
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
  if (row.status !== "draft" && row.status !== "pending_payment" && row.status !== "payment_failed") {
    return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 409 });
  }
  const lang: AutosClassifiedsLang = body.lang === "en" || row.lang === "en" ? "en" : "es";
  const returnTo = body.returnToListingId?.trim();
  const returnQ = returnTo ? `&return_to=${encodeURIComponent(returnTo)}` : "";
  if (row.lane === "negocios") {
    const dealerInventory = await getAutosDealerInventorySummaryForOwner(row.owner_user_id, { excludeListingId: row.id });
    if (!dealerInventory.canAddActiveVehicle) {
      return NextResponse.json(
        {
          ok: false,
          error: "dealer_active_limit_reached",
          message: dealerLimitMessage(lang),
          dealerInventory,
        },
        { status: 409 },
      );
    }
  }

  if (internalBypass) {
    const okAct = await activateAutosClassifiedsListing(listingId);
    if (!okAct) {
      if (row.lane === "negocios") {
        return NextResponse.json(
          { ok: false, error: "dealer_active_limit_reached", message: dealerLimitMessage(lang) },
          { status: 409 },
        );
      }
      return NextResponse.json({ ok: false, error: "activate_failed" }, { status: 500 });
    }
    const live = await getAutosClassifiedsListingById(listingId);
    if (!live || live.status !== "active" || !live.published_at?.trim()) {
      return NextResponse.json({ ok: false, error: "activate_verify_failed" }, { status: 500 });
    }
    const origin = getAutosSiteOrigin();
    const qLang = lang === "en" ? "lang=en" : "lang=es";
    const laneQ = `lane=${encodeURIComponent(row.lane)}`;
    const livePath = `${autosLiveVehiclePath(listingId)}?${qLang}`;
    const successUrl = `${origin}/clasificados/autos/pago/exito?internal=1&listing_id=${encodeURIComponent(listingId)}&${qLang}&${laneQ}${returnQ}`;
    return NextResponse.json({
      ok: true,
      internalBypass: true as const,
      liveUrl: `${origin}${livePath}`,
      successUrl,
    });
  }

  /** Autos Phase 2: dev/staging test publish without Stripe (gated env; never production). */
  if (testPublishBypass) {
    const okAct = await activateAutosClassifiedsListing(listingId);
    if (!okAct) {
      if (row.lane === "negocios") {
        return NextResponse.json(
          { ok: false, error: "dealer_active_limit_reached", message: dealerLimitMessage(lang) },
          { status: 409 },
        );
      }
      return NextResponse.json({ ok: false, error: "activate_failed" }, { status: 500 });
    }
    const live = await getAutosClassifiedsListingById(listingId);
    if (!live || live.status !== "active" || !live.published_at?.trim()) {
      return NextResponse.json({ ok: false, error: "activate_verify_failed" }, { status: 500 });
    }
    const origin = getAutosSiteOrigin();
    const qLang = lang === "en" ? "lang=en" : "lang=es";
    const laneQ = `lane=${encodeURIComponent(row.lane)}`;
    const livePath = `${autosLiveVehiclePath(listingId)}?${qLang}`;
    const successUrl = `${origin}/clasificados/autos/pago/exito?internal=1&test_publish=1&listing_id=${encodeURIComponent(listingId)}&${qLang}&${laneQ}${returnQ}`;
    return NextResponse.json({
      ok: true,
      testPublishBypass: true as const,
      liveUrl: `${origin}${livePath}`,
      successUrl,
    });
  }

  const priceId = getStripePriceIdForAutosLane(row.lane);
  if (!priceId) {
    return NextResponse.json({ ok: false, error: "stripe_price_missing", lane: row.lane }, { status: 503 });
  }
  const secret = getStripeSecretKey()!;
  const stripe = new Stripe(secret, { typescript: true });
  const origin = getAutosSiteOrigin();
  const qLang = lang === "en" ? "lang=en" : "lang=es";
  const laneQ = `lane=${encodeURIComponent(row.lane)}`;

  if (row.status === "pending_payment" && row.stripe_checkout_session_id?.trim()) {
    try {
      const existing = await stripe.checkout.sessions.retrieve(row.stripe_checkout_session_id.trim());
      if (existing.status === "open" && existing.url) {
        return NextResponse.json({ ok: true, url: existing.url, sessionId: existing.id, reusedSession: true as const });
      }
    } catch {
      /* expired or invalid session — create a new one below */
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/clasificados/autos/pago/exito?session_id={CHECKOUT_SESSION_ID}&${qLang}&${laneQ}${returnQ}`,
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
