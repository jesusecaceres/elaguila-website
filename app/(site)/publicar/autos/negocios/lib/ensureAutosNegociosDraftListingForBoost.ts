"use client";

import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { prepareAutosListingForApiTransport } from "@/app/(site)/publicar/autos/shared/lib/autosMuxPublishPrepare";

const NEGOCIOS_PUBLISH_LISTING_SESSION_KEY = "lx-autos-publish-listing-negocios";

export type AutosNegociosDraftListingForBoostResult =
  | { ok: true; listingId: string; leonixAdId: string | null }
  | { ok: false; userMessage: string };

async function syncDraftListing(
  listingId: string,
  listing: AutoDealerListing,
  lang: AutosNegociosLang,
  token: string,
): Promise<AutosNegociosDraftListingForBoostResult> {
  const res = await fetch(`/api/clasificados/autos/listings/${listingId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      listing: prepareAutosListingForApiTransport(listing),
      lang,
    }),
  });
  const j = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
  if (!res.ok) {
    return {
      ok: false,
      userMessage:
        j.message?.trim() ||
        (lang === "es"
          ? "No pudimos guardar tu solicitud antes de Inventory Boost."
          : "We could not save your application before Inventory Boost."),
    };
  }
  return { ok: true, listingId, leonixAdId: null };
}

/**
 * Persist Autos Negocios draft as a server listing row before Inventory Boost checkout.
 * Reuses the same session key as publish confirm so draft data survives return.
 */
export async function ensureAutosNegociosDraftListingForBoost(args: {
  listing: AutoDealerListing;
  lang: AutosNegociosLang;
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

  const cached =
    typeof window !== "undefined" ? window.sessionStorage.getItem(NEGOCIOS_PUBLISH_LISTING_SESSION_KEY) : null;

  if (cached?.trim()) {
    const getRes = await fetch(`/api/clasificados/autos/listings/${cached.trim()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (getRes.ok) {
      const row = (await getRes.json()) as { status?: string; leonixAdId?: string | null };
      const status = String(row.status ?? "").trim().toLowerCase();
      if (status === "draft" || status === "pending_payment" || status === "payment_failed") {
        const synced = await syncDraftListing(cached.trim(), args.listing, lang, token);
        if (!synced.ok) return synced;
        return {
          ok: true,
          listingId: cached.trim(),
          leonixAdId: row.leonixAdId?.trim() || null,
        };
      }
    }
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(NEGOCIOS_PUBLISH_LISTING_SESSION_KEY);
    }
  }

  try {
    const res = await fetch("/api/clasificados/autos/listings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        listing: prepareAutosListingForApiTransport(args.listing),
        lane: "negocios",
        lang,
      }),
    });
    const j = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      id?: string;
      leonixAdId?: string | null;
      message?: string;
    };
    if (!res.ok || !j.id?.trim()) {
      return {
        ok: false,
        userMessage:
          j.message?.trim() ||
          (lang === "es"
            ? "No pudimos guardar tu solicitud antes de Inventory Boost."
            : "We could not save your application before Inventory Boost."),
      };
    }
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(NEGOCIOS_PUBLISH_LISTING_SESSION_KEY, j.id.trim());
    }
    return { ok: true, listingId: j.id.trim(), leonixAdId: j.leonixAdId?.trim() || null };
  } catch {
    return {
      ok: false,
      userMessage:
        lang === "es"
          ? "No pudimos guardar tu solicitud antes de Inventory Boost."
          : "We could not save your application before Inventory Boost.",
    };
  }
}
