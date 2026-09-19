"use client";

import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { prepareAutosListingForApiTransport } from "@/app/(site)/publicar/autos/shared/lib/autosMuxPublishPrepare";
import { resolveAutosNegociosDraftNamespace } from "@/app/clasificados/autos/negocios/lib/autosNegociosDraftNamespace";
import {
  autosCanonicalSaveMessage,
  getBrowserAutosIdentityStorages,
  saveAutosListingToCanonicalRow,
} from "@/app/lib/clasificados/autos/autosCanonicalListingIdentity";

export type AutosNegociosDraftListingForBoostResult =
  | { ok: true; listingId: string; leonixAdId: string | null }
  | { ok: false; userMessage: string };

/**
 * Persist the Autos Negocios (dealer PARENT) application as its ONE canonical server row before Inventory
 * Boost checkout.
 *
 * Final identity closeout (gate 1): this used to honour only the legacy session key
 * (`lx-autos-publish-listing-negocios`); every failure branch (failed GET, non-editable status, failed PATCH,
 * a brand-new tab) erased it and fell through to `POST`, which ALWAYS inserts - a second dealer parent row
 * with a second Leonix Ad ID (and a second base charge). It now goes through the SAME draft-bound canonical
 * identity helper as the Autos confirm flow and the Negocios preview:
 *  - a declared identity (explicit parent id, or the draft-bound identity in session + local storage, with the
 *    legacy key honoured as a fallback) can only end in PATCH-the-same-row or a FAIL-CLOSED error - never POST;
 *  - only a genuinely new application (no declared identity, or one confirmed absent for this owner) POSTs;
 *  - lane is always `negocios` and the identity scope is the plain lane scope: an inventory child id
 *    (`negocios:inv:<parent>`) is never read, written or mixed with the parent id here, and no parent is
 *    ever created when an explicit parent id is supplied.
 */
export async function ensureAutosNegociosDraftListingForBoost(args: {
  listing: AutoDealerListing;
  lang: AutosNegociosLang;
  /** Dealer parent row when it already exists (explicit identity; PATCH-only, never POST). */
  parentListingId?: string | null;
}): Promise<AutosNegociosDraftListingForBoostResult> {
  const lang = args.lang === "en" ? "en" : "es";
  const sb = createSupabaseBrowserClient();
  const { data: auth } = await sb.auth.getSession();
  const token = auth.session?.access_token;
  if (!token?.trim()) {
    return {
      ok: false,
      userMessage:
        lang === "es"
          ? "Inicia sesión para activar Inventory Boost."
          : "Sign in to activate Inventory Boost.",
    };
  }

  let namespace: string | null = null;
  try {
    namespace = await resolveAutosNegociosDraftNamespace();
  } catch {
    namespace = null;
  }

  const saved = await saveAutosListingToCanonicalRow({
    lane: "negocios",
    lang,
    token,
    listingPayload: prepareAutosListingForApiTransport(args.listing),
    explicitListingId: args.parentListingId?.trim() || null,
    namespace,
    fetchFn: (input, init) => fetch(input, init),
    storages: getBrowserAutosIdentityStorages(),
  });
  if (!saved.ok) {
    const helperDefault = autosCanonicalSaveMessage("create_failed", lang);
    return {
      ok: false,
      userMessage:
        saved.code === "create_failed" && saved.message === helperDefault
          ? lang === "es"
            ? "No pudimos guardar tu solicitud antes de Inventory Boost."
            : "We could not save your application before Inventory Boost."
          : saved.message,
    };
  }
  return { ok: true, listingId: saved.listingId, leonixAdId: saved.leonixAdId };
}
