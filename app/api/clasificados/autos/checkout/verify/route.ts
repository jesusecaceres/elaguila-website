import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAutosSiteOrigin } from "@/app/lib/clasificados/autos/autosSiteOrigin";
import {
  getAutosClassifiedsListingById,
  tryActivateAutosListingAfterPayment,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import { getStripeSecretKey, isStripeAutosConfigured } from "@/app/lib/clasificados/autos/stripeAutosConfig";
import { autosLiveVehiclePath } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import type { AutosClassifiedsLang } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";

export const dynamic = "force-dynamic";

function dealerLimitMessage(lang: AutosClassifiedsLang): string {
  return lang === "en"
    ? "You have reached the 10 active vehicle limit for your Negocio Autos package. Deactivate a current vehicle to publish another."
    : "Has llegado al límite de 10 vehículos activos para tu paquete Negocio Autos. Desactiva un vehículo actual para publicar otro.";
}

export async function GET(request: Request) {
  if (!isStripeAutosConfigured()) {
    return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 503 });
  }
  const u = new URL(request.url);
  const sessionId = u.searchParams.get("session_id")?.trim();
  const lang: AutosClassifiedsLang = u.searchParams.get("lang") === "en" ? "en" : "es";
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
  const activation = await tryActivateAutosListingAfterPayment(listingId, { stripePaymentIntentId: piId });
  if (!activation.ok) {
    if (activation.error === "dealer_active_limit_reached") {
      return NextResponse.json(
        {
          ok: false,
          error: activation.error,
          message: dealerLimitMessage(lang),
          dealerInventory: activation.dealerInventory,
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: false, error: "activation_failed" }, { status: 409 });
  }
  const row = await getAutosClassifiedsListingById(listingId);
  const lane = row?.lane === "negocios" ? "negocios" : "privado";
  const q = lang === "en" ? "lang=en" : "lang=es";
  const livePath = `${getAutosSiteOrigin()}${autosLiveVehiclePath(listingId)}?${q}`;
  const leonixAdId = row?.leonix_ad_id?.trim() || null;
  return NextResponse.json({ ok: true, listingId, liveUrl: livePath, lang, lane, leonixAdId });
}
