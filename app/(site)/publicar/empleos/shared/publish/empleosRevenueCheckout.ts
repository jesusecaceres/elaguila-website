/**
 * Empleos paid job post → save draft then Revenue OS Checkout (not job fair).
 */

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type { EmpleosPublishEnvelope } from "./empleosPublishSnapshots";
import {
  redirectToRevenueCategoryCheckout,
  startRevenueCategoryCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { EMPLEOS_PAID_JOB_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import {
  clearEmpleosPendingCheckoutListingId,
  readEmpleosPendingCheckoutListingId,
  rememberEmpleosPendingCheckoutListingId,
} from "./empleosPendingCheckoutIdentity";

export async function saveEmpleosDraftAndStartPaidJobCheckout(input: {
  envelope: EmpleosPublishEnvelope;
  accessToken: string;
  lang: Lang;
  leonixAdId?: string | null;
  promoCode?: string | null;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const lang = input.lang === "en" ? "en" : "es";
  const storage = typeof window !== "undefined" ? window.sessionStorage : null;
  const identityKey = { lane: String(input.envelope.lane), title: input.envelope.payload.data.title };
  const rememberedId = input.envelope.listingId ? null : readEmpleosPendingCheckoutListingId(storage, identityKey);

  type SaveJson = { ok?: boolean; error?: string; id?: string; leonix_ad_id?: string | null };
  const save = async (listingId: string | null): Promise<{ res: Response; json: SaveJson }> => {
    const res = await fetch("/api/clasificados/empleos/listings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.accessToken}`,
      },
      body: JSON.stringify({ envelope: listingId ? { ...input.envelope, listingId } : input.envelope, mode: "draft" }),
    });
    return { res, json: (await res.json()) as SaveJson };
  };

  // Reuse the row this application already created; if the server rejects the remembered id
  // (stale / other owner / other lane), forget it and save once as a fresh application.
  let saved = await save(rememberedId);
  if (rememberedId && !saved.res.ok && [400, 403, 404].includes(saved.res.status)) {
    clearEmpleosPendingCheckoutListingId(storage);
    saved = await save(null);
  }
  const { res, json } = saved;
  if (res.ok && json.ok && json.id) {
    rememberEmpleosPendingCheckoutListingId(storage, { ...identityKey, listingId: json.id });
  }
  if (!res.ok || !json.ok || !json.id) {
    return {
      ok: false,
      message:
        json.error ??
        (lang === "es" ? "No pudimos guardar el anuncio antes del pago." : "We could not save the listing before payment."),
    };
  }

  let leonixAdId = input.leonixAdId?.trim() || json.leonix_ad_id?.trim() || null;
  if (!leonixAdId) {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: adRow } = await supabase
        .from("empleos_public_listings")
        .select("leonix_ad_id")
        .eq("id", json.id)
        .maybeSingle();
      leonixAdId = (adRow as { leonix_ad_id?: string | null } | null)?.leonix_ad_id?.trim() || null;
    } catch {
      /* optional metadata */
    }
  }

  const checkout = await startRevenueCategoryCheckout({
    ...EMPLEOS_PAID_JOB_CHECKOUT,
    listingId: json.id,
    leonixAdId,
    locale: lang,
    promoCode: input.promoCode ?? null,
  });
  if (!checkout.ok) {
    return { ok: false, message: checkout.userMessage };
  }

  redirectToRevenueCategoryCheckout(checkout.checkoutUrl);
  return { ok: true };
}
