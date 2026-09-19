/**
 * CLOSEOUT 2 (2026-09) — Restaurantes "resume payment" for a hidden `pending_payment` listing.
 *
 * The Restaurantes base plan is a monthly SUBSCRIPTION: Revenue OS hard-requires the recurring-billing
 * consent that only the shared checkout checkpoint collects, so the dashboard must NOT start that checkout
 * on its own. Instead this loads the saved listing into the owner's local draft (same hydration
 * `dashboard/restaurantes` "Editar" already performs) and returns the draft-preview URL, where the
 * existing checkpoint saves the edit and starts `RESTAURANTES_BASE_CHECKOUT` with consent. The preview is
 * deliberately opened WITHOUT `source=dashboard&listingId` (that listing-bound mode suppresses checkout).
 */
import { mergeRestauranteDraft } from "@/app/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import { saveRestauranteDraftToStorageResolved } from "@/app/clasificados/restaurantes/application/restauranteDraftStorage";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { isRestauranteAwaitingPayment, restauranteResumePaymentPreviewHref } from "./dashboardPendingPayment";

export type RestauranteResumePaymentResult = { ok: true; href: string } | { ok: false; userMessage: string };

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
    const merged = mergeRestauranteDraft(data.listing_json);
    const stableDraftId =
      typeof data.draft_listing_id === "string" && data.draft_listing_id.trim()
        ? data.draft_listing_id.trim()
        : merged.draftListingId;
    merged.draftListingId = stableDraftId;
    const saved = await saveRestauranteDraftToStorageResolved(merged);
    if (!saved) return fail();
    return { ok: true, href: restauranteResumePaymentPreviewHref(lang, input.target) };
  } catch {
    return fail();
  }
}
