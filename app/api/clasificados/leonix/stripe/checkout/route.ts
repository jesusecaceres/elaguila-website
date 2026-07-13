import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  assertBrListingOwner,
  brListingAwaitingPayment,
  setBrListingPendingPayment,
  tryActivateBrListingAfterPayment,
} from "@/app/lib/clasificados/bienes-raices/brListingPaymentService";
import {
  brPublishPaymentBlockedMessage,
  brPublishBlockedMissingStripe,
  brPublishPaymentRequired,
} from "@/app/lib/clasificados/bienes-raices/brPublishPaymentPolicy";
import {
  getBrSiteOrigin,
  getStripePriceIdForBrLane,
  getStripeSecretKey,
  isBrAllowTestPublishBypassEnabled,
  isBrInternalPublishPaymentBypassEnabled,
  type BrStripeLane,
} from "@/app/lib/clasificados/bienes-raices/stripeBrConfig";
import { leonixLiveAnuncioPath } from "@/app/clasificados/lib/leonixRealEstateListingContract";

export const dynamic = "force-dynamic";

type Body = {
  listingId?: string;
  lang?: "es" | "en";
  lane?: BrStripeLane;
  returnToListingId?: string;
};

async function getUserFromBearer(request: Request) {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const sb = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function finishBrBypassCheckout(opts: {
  listingId: string;
  lang: "es" | "en";
  returnQ: string;
  testPublish: boolean;
}) {
  const activation = await tryActivateBrListingAfterPayment(opts.listingId);
  if (!activation.ok) {
    return NextResponse.json({ ok: false, error: "activate_failed" }, { status: 500 });
  }
  const origin = getBrSiteOrigin();
  const qLang = opts.lang === "en" ? "lang=en" : "lang=es";
  const livePath = `${leonixLiveAnuncioPath(opts.listingId)}?${qLang}`;
  const testQ = opts.testPublish ? "&test_publish=1" : "";
  const successUrl = `${origin}/clasificados/bienes-raices/pago/exito?internal=1${testQ}&listing_id=${encodeURIComponent(opts.listingId)}&${qLang}${opts.returnQ}`;
  return NextResponse.json({
    ok: true,
    ...(opts.testPublish ? { testPublishBypass: true as const } : { internalBypass: true as const }),
    listingId: opts.listingId,
    liveUrl: `${origin}${livePath}`,
    successUrl,
  });
}

export async function POST(request: Request) {
  const user = await getUserFromBearer(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const lang: "es" | "en" = body.lang === "en" ? "en" : "es";

  const listingId = body.listingId?.trim();
  if (!listingId) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const lane: BrStripeLane = body.lane === "privado" ? "privado" : "negocio";
  const rowLang = body.lang === "en" ? "en" : "es";
  const returnTo = body.returnToListingId?.trim();
  const returnQ = returnTo ? `&return_to=${encodeURIComponent(returnTo)}` : "";

  const row = await assertBrListingOwner(listingId, user.id);
  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (row.category !== "bienes-raices") {
    return NextResponse.json({ ok: false, error: "invalid_category" }, { status: 409 });
  }
  if (!brListingAwaitingPayment(row) && row.status !== "pending") {
    if (row.status === "active" && row.is_published) {
      return NextResponse.json({ ok: false, error: "already_live" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 409 });
  }

  const internalBypass = isBrInternalPublishPaymentBypassEnabled();
  const testPublishBypass = isBrAllowTestPublishBypassEnabled();

  if (internalBypass || testPublishBypass) {
    return finishBrBypassCheckout({ listingId, lang: rowLang, returnQ, testPublish: testPublishBypass });
  }

  if (brPublishBlockedMissingStripe(lane)) {
    return NextResponse.json(
      {
        ok: false,
        error: "stripe_not_configured",
        message: brPublishPaymentBlockedMessage(rowLang),
      },
      { status: 503 },
    );
  }

  if (!brPublishPaymentRequired(lane)) {
    return finishBrBypassCheckout({ listingId, lang: rowLang, returnQ, testPublish: false });
  }

  const priceId = getStripePriceIdForBrLane(lane);
  if (!priceId) {
    return NextResponse.json({ ok: false, error: "stripe_price_missing", lane }, { status: 503 });
  }

  const stripe = new Stripe(getStripeSecretKey()!, { typescript: true });
  const origin = getBrSiteOrigin();
  const qLang = rowLang === "en" ? "lang=en" : "lang=es";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/clasificados/bienes-raices/pago/exito?session_id={CHECKOUT_SESSION_ID}&${qLang}&lane=${lane}${returnQ}`,
    cancel_url: `${origin}/clasificados/bienes-raices/pago/cancelado?listing_id=${encodeURIComponent(listingId)}&${qLang}&lane=${lane}`,
    metadata: {
      listing_id: listingId,
      category: "bienes-raices",
      lane,
      lang: rowLang,
      owner_user_id: user.id,
    },
    client_reference_id: listingId,
  });

  if (!session.url) {
    return NextResponse.json({ ok: false, error: "stripe_no_url" }, { status: 500 });
  }

  const ok = await setBrListingPendingPayment(listingId, session.id, lane);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "persist_session_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: session.url, sessionId: session.id });
}
