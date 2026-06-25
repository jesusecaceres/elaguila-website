/**
 * Gate REST-OFFERS1 — Fetch published Ofertas Locales explicitly linked to a Restaurante listing.
 * Returns [] when no rows carry `linkedRestaurantePublicListingId` in draft_snapshot (current production state).
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { isOfertaLocalExpired } from "@/app/lib/ofertas-locales/ofertasLocalesFormatting";
import { parseOfertaLocalDraftSnapshot } from "@/app/lib/ofertas-locales/ofertasLocalesDbSchema";

import {
  RESTAURANTE_OFFER_LINK_DRAFT_KEY,
  type RestauranteLinkedOfferPreview,
} from "./restaurantesLinkedOffersTypes";

const LINKED_OFFER_SELECT =
  "id, title, offer_title, description, coupon_text, valid_until, status, draft_snapshot";

const MAX_PREVIEW = 3;

function sanitizeText(raw: string | null | undefined, max: number): string {
  return String(raw ?? "")
    .replace(/\0/g, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, max);
}

export function readRestauranteOfferLinkFromDraftSnapshot(snapshot: unknown): string | null {
  const parsed = parseOfertaLocalDraftSnapshot(snapshot);
  const raw = parsed[RESTAURANTE_OFFER_LINK_DRAFT_KEY];
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function mapRowToPreview(
  row: {
    id: string;
    title: string | null;
    offer_title: string | null;
    description: string | null;
    coupon_text: string | null;
    valid_until: string | null;
    status: string;
    draft_snapshot: unknown;
  },
  lang: "es" | "en",
  now: Date,
): RestauranteLinkedOfferPreview | null {
  if (row.status !== "approved") return null;
  const validUntil = (row.valid_until ?? "").trim();
  if (!validUntil || isOfertaLocalExpired(validUntil, now)) return null;

  const title = sanitizeText(row.offer_title ?? row.title, 160);
  if (!title) return null;

  const description = sanitizeText(row.coupon_text ?? row.description, 240) || undefined;
  const q = `lang=${lang}`;

  return {
    id: row.id,
    title,
    description,
    expiresAt: row.valid_until,
    href: `/clasificados/ofertas-locales/${encodeURIComponent(row.id)}?${q}`,
  };
}

/**
 * Loads up to 3 non-expired approved offers whose draft_snapshot explicitly links to this restaurant UUID.
 * Does not match by owner, business name, or phone.
 */
export async function fetchRestauranteLinkedOffersForPublicPage(
  sb: SupabaseClient,
  restaurantPublicListingId: string,
  lang: "es" | "en" = "es",
): Promise<RestauranteLinkedOfferPreview[]> {
  const listingId = restaurantPublicListingId.trim();
  if (!listingId) return [];

  const { data, error } = await sb
    .from("ofertas_locales")
    .select(LINKED_OFFER_SELECT)
    .eq("status", "approved")
    .filter(`draft_snapshot->>${RESTAURANTE_OFFER_LINK_DRAFT_KEY}`, "eq", listingId)
    .order("valid_until", { ascending: true })
    .limit(12);

  if (error || !data?.length) return [];

  const now = new Date();
  const out: RestauranteLinkedOfferPreview[] = [];
  for (const row of data) {
    const preview = mapRowToPreview(row as Parameters<typeof mapRowToPreview>[0], lang, now);
    if (!preview) continue;
    out.push(preview);
    if (out.length >= MAX_PREVIEW) break;
  }
  return out;
}
