import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { REVENUE_CATEGORY_CHECKOUT_ROUTE } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import { RENTAS_LISTING_LIFECYCLE_CONFIG } from "./listingLifecycleConfig";

export type ListingRenewalCheckoutOperation = "renew_listing";

export async function startListingRenewalCheckout(input: {
  category: "rentas";
  packageKey: "rentas_30d";
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
