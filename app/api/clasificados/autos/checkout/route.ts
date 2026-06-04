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
import {
  normalizeAdditionalInventoryVehicles,
  countApplicationInventoryVehicles,
} from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import {
  promoteNegociosMainInventoryListing,
  publishNegociosBundleAdditionalVehicles,
} from "@/app/lib/clasificados/autos/autosNegociosBundlePublish";
import { STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT } from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";

export const dynamic = "force-dynamic";

type Body = {
  listingId?: string;
  lang?: AutosClassifiedsLang;
  returnToListingId?: string;
  /** Negocios QA bundle: additional inventory drafts to publish after main activates (bypass only). */
  additionalInventoryVehicles?: unknown[];
};

function dealerLimitMessage(lang: AutosClassifiedsLang): string {
  return autosDealerInventoryLimitMessage(lang);
}

async function finishAutosBypassCheckout(opts: {
  listingId: string;
  row: NonNullable<Awaited<ReturnType<typeof assertAutosListingOwner>>>;
  userId: string;
  lang: AutosClassifiedsLang;
  returnQ: string;
  testPublish: boolean;
  additionalInventoryVehicles: unknown[] | undefined;
}) {
  const { listingId, row, userId, lang, returnQ, testPublish } = opts;
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

  let bundlePublish:
    | Awaited<ReturnType<typeof publishNegociosBundleAdditionalVehicles>>
    | undefined;

  if (row.lane === "negocios") {
    await promoteNegociosMainInventoryListing(listingId);
    const additional = normalizeAdditionalInventoryVehicles(opts.additionalInventoryVehicles ?? []);
    if (additional.length > 0) {
      bundlePublish = await publishNegociosBundleAdditionalVehicles({
        ownerUserId: userId,
        mainListingId: listingId,
        additionalVehicles: additional,
        lang,
      });
    }
  }

  const origin = getAutosSiteOrigin();
  const qLang = lang === "en" ? "lang=en" : "lang=es";
  const laneQ = `lane=${encodeURIComponent(row.lane)}`;
  const livePath = `${autosLiveVehiclePath(listingId)}?${qLang}`;
  const bundleQ = bundlePublish && bundlePublish.published.length > 1 ? "&bundle=1" : "";
  const testQ = testPublish ? "&test_publish=1" : "";
  const successUrl = `${origin}/clasificados/autos/pago/exito?internal=1${testQ}&listing_id=${encodeURIComponent(listingId)}&${qLang}&${laneQ}${returnQ}${bundleQ}`;

  return NextResponse.json({
    ok: true,
    ...(testPublish ? { testPublishBypass: true as const } : { internalBypass: true as const }),
    liveUrl: `${origin}${livePath}`,
    successUrl,
    ...(bundlePublish
      ? {
          bundlePublish: {
            mainListingId: bundlePublish.mainListingId,
            published: bundlePublish.published,
            additionalSkipped: bundlePublish.additionalSkipped,
            totalPublished: bundlePublish.published.length,
            inventoryIncluded: countApplicationInventoryVehicles(
              Math.max(0, bundlePublish.published.length - 1),
            ),
            inventoryLimit: STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT,
          },
        }
      : {}),
  });
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
  const additionalDrafts =
    row.lane === "negocios" ? normalizeAdditionalInventoryVehicles(body.additionalInventoryVehicles ?? []) : [];
  if (row.lane === "negocios") {
    const dealerInventory = await getAutosDealerInventorySummaryForOwner(row.owner_user_id, { excludeListingId: row.id });
    const slotsNeeded = countApplicationInventoryVehicles(additionalDrafts.length);
    if (dealerInventory.activeCount + slotsNeeded > STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT) {
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
    return finishAutosBypassCheckout({
      listingId,
      row,
      userId,
      lang,
      returnQ,
      testPublish: false,
      additionalInventoryVehicles: body.additionalInventoryVehicles,
    });
  }

  /** Autos Phase 2: dev/staging test publish without Stripe (gated env; never production). */
  if (testPublishBypass) {
    return finishAutosBypassCheckout({
      listingId,
      row,
      userId,
      lang,
      returnQ,
      testPublish: true,
      additionalInventoryVehicles: body.additionalInventoryVehicles,
    });
  }

  if (row.lane === "negocios" && additionalDrafts.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "bundle_requires_qa_bypass",
        message:
          lang === "es"
            ? "La publicación en lote del inventario requiere modo QA (bypass de pago). Publica el anuncio principal con Stripe y agrega vehículos desde el inventario del dealer."
            : "Bundle inventory publish requires QA mode (payment bypass). Publish the main listing with Stripe and add vehicles from dealer inventory.",
      },
      { status: 409 },
    );
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
