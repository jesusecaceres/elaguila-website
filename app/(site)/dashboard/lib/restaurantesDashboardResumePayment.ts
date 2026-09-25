/**
 * CLOSEOUT 2 (2026-09, golden-survivor port) — Restaurantes "resume payment" for a hidden `pending_payment` listing.
 *
 * The Restaurantes base plans are monthly SUBSCRIPTIONS: Revenue OS hard-requires the recurring-billing
 * consent that only the shared checkout checkpoint collects, so the dashboard must NOT start that checkout
 * on its own. Instead this loads the saved listing into the owner's local draft (same hydration
 * `dashboard/restaurantes` "Editar" already performs, same stable `draftListingId` so the preview's
 * pre-checkout save updates THIS row) and returns where to go next:
 *
 *   - plan proven (ledger `resume` offer) -> the draft preview's checkout checkpoint, carrying `plan=quick`
 *     for a Quick ($249) row and nothing for a Full ($399) row — golden's preview reads exactly that marker;
 *   - plan unknown -> golden's Restaurantes Quick/Full checkpoint selector, so the owner re-confirms it.
 *
 * The preview is deliberately opened WITHOUT `source=dashboard&listingId` (that listing-bound mode
 * suppresses checkout).
 */
import { mergeRestauranteDraft } from "@/app/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import { saveRestauranteDraftToStorageResolved } from "@/app/clasificados/restaurantes/application/restauranteDraftStorage";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { BUSINESS_BASE_PLAN_OFFER_ROUTE } from "@/app/lib/listingPlans/businessBasePlanOfferClient";
import {
  isRestauranteAwaitingPayment,
  restauranteResumePaymentHref,
  restauranteResumePlanFromOffer,
} from "./dashboardPendingPayment";

export type RestauranteResumePaymentResult = { ok: true; href: string } | { ok: false; userMessage: string };

async function readRestauranteResumeOffer(
  listingId: string,
  accessToken: string | null,
): Promise<{ mode?: string | null; sellPackageKey?: string | null } | null> {
  if (!accessToken) return null;
  try {
    const res = await fetch(
      `${BUSINESS_BASE_PLAN_OFFER_ROUTE}?category=restaurantes&listingId=${encodeURIComponent(listingId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { ok?: boolean; offer?: { mode?: string | null; sellPackageKey?: string | null } };
    return json.ok && json.offer ? json.offer : null;
  } catch {
    return null;
  }
}

export async function prepareRestauranteResumePayment(input: {
  listingId: string;
  lang: "es" | "en";
  /** "preview" opens the draft preview; "checkout" scrolls straight to the checkout checkpoint. */
  target: "preview" | "checkout";
}): Promise<RestauranteResumePaymentResult> {
  const lang = input.lang;
  const fail = (): RestauranteResumePaymentResult => ({
    ok: false,
    userMessage:
      lang === "es"
        ? "No pudimos abrir tu restaurante para completar el pago. Intenta de nuevo o contacta a Leonix."
        : "We could not open your restaurant to complete payment. Please try again or contact Leonix.",
  });
  const listingId = input.listingId.trim();
  if (!listingId) return fail();
  try {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return {
        ok: false,
        userMessage: lang === "es" ? "Inicia sesión para continuar al pago." : "Sign in to continue to payment.",
      };
    }
    const { data, error } = await supabase
      .from("restaurantes_public_listings")
      .select("listing_json, draft_listing_id, status")
      .eq("id", listingId)
      .eq("owner_user_id", user.id)
      .maybeSingle();
    if (error || !data?.listing_json) return fail();
    if (!isRestauranteAwaitingPayment((data as { status?: string | null }).status)) {
      return {
        ok: false,
        userMessage:
          lang === "es"
            ? "Este restaurante ya no está pendiente de pago. Actualiza la página."
            : "This restaurant is no longer awaiting payment. Refresh the page.",
      };
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const offer = await readRestauranteResumeOffer(listingId, sessionData.session?.access_token ?? null);
    const plan = restauranteResumePlanFromOffer(offer);

    const merged = mergeRestauranteDraft(data.listing_json);
    const stableDraftId =
      typeof data.draft_listing_id === "string" && data.draft_listing_id.trim()
        ? data.draft_listing_id.trim()
        : merged.draftListingId;
    merged.draftListingId = stableDraftId;
    const saved = await saveRestauranteDraftToStorageResolved(merged);
    if (!saved) return fail();
    return { ok: true, href: restauranteResumePaymentHref(lang, input.target, plan) };
  } catch {
    return fail();
  }
}
