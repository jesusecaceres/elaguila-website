import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { REVENUE_CATEGORY_CHECKOUT_ROUTE } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import { RENTAS_LISTING_LIFECYCLE_CONFIG } from "./listingLifecycleConfig";
import {
  BIENES_FSBO_LIFECYCLE_CATEGORY,
  BIENES_FSBO_LIFECYCLE_PACKAGE_KEY,
} from "./bienesFsboLifecycle";

export type ListingRenewalCheckoutOperation = "renew_listing";

/**
 * The fixed-term lanes that have a real, server-verified renewal path today. Both are one-time
 * products with a persisted `listings.expires_at`, and both are gated server-side before a
 * Stripe session exists (`validateRentasRenewalCheckoutOwnership` /
 * `validateBienesFsboRenewalCheckoutOwnership`). Widening this union is not what authorizes a
 * renewal — the server gate is — but it keeps the client from silently offering renewal for a
 * lane with no gate behind it.
 *
 * Gate BIENES-PRIVADO-2 defect repair: Gate BIENES-PRIVADO-1 wired the owner dashboard's
 * `startFixedTermRenewal` to pass `"bienes-raices"` / `"br_fsbo_45d"` into this function while
 * these parameters were still typed as the Rentas literals. ESLint does not check assignability,
 * and full typecheck is deferred to the integration gate, so the mismatch survived that gate. It
 * was found here while proving the FSBO discovery circuit end to end.
 */
export type ListingRenewalCheckoutLane =
  | { category: "rentas"; packageKey: "rentas_30d" }
  | {
      category: typeof BIENES_FSBO_LIFECYCLE_CATEGORY;
      packageKey: typeof BIENES_FSBO_LIFECYCLE_PACKAGE_KEY;
    };

export type ListingRenewalCheckoutCategory = ListingRenewalCheckoutLane["category"];
export type ListingRenewalCheckoutPackageKey = ListingRenewalCheckoutLane["packageKey"];

export async function startListingRenewalCheckout(input: {
  category: ListingRenewalCheckoutCategory;
  packageKey: ListingRenewalCheckoutPackageKey;
  listingId: string;
  leonixAdId?: string | null;
  lang: "es" | "en";
  returnPath: string;
  promoCode?: string | null;
}): Promise<{ ok: true; checkoutUrl: string } | { ok: false; userMessage: string }> {
  const sb = createSupabaseBrowserClient();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    return {
      ok: false,
      userMessage: input.lang === "es" ? "Inicia sesión para renovar." : "Sign in to renew.",
    };
  }

  const res = await fetch(REVENUE_CATEGORY_CHECKOUT_ROUTE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      operation: "renew_listing",
      category: input.category,
      packageKey: input.packageKey,
      listingId: input.listingId,
      leonixAdId: input.leonixAdId ?? null,
      // Both fixed-term lanes live in the same `listings` table, so this stays one constant
      // rather than a per-lane branch. The server re-derives it for a renewal regardless
      // (`sourceTable: isFixedTermRenewal ? "listings" : body.sourceTable`), so this value is a
      // hint, never authority.
      sourceTable: RENTAS_LISTING_LIFECYCLE_CONFIG.sourceTable,
      returnContext: "owner_dashboard",
      returnPath: input.returnPath,
      locale: input.lang,
      ...(input.promoCode?.trim() ? { promoCode: input.promoCode.trim() } : {}),
    }),
  });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; checkoutUrl?: string; message?: string };
  if (res.ok && json.ok && typeof json.checkoutUrl === "string" && json.checkoutUrl.trim()) {
    return { ok: true, checkoutUrl: json.checkoutUrl.trim() };
  }
  return {
    ok: false,
    userMessage:
      json.message ??
      (input.lang === "es"
        ? "No pudimos iniciar la renovación segura."
        : "We could not start secure renewal."),
  };
}
