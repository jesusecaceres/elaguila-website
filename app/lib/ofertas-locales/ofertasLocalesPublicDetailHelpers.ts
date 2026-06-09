/**
 * Ofertas Locales public offer detail — safe projection (FINAL-4).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { parseOfertaLocalAdminMetadataFromInternalNotes } from "./ofertasLocalesAdminHelpers";
import { getSafeOfertaLocalSourceAssetHref } from "./ofertasLocalesClickableItemPreviewHelpers";
import { isOfertaLocalExpired } from "./ofertasLocalesFormatting";
import { buildOfertaLocalWhatsAppHref } from "./ofertasLocalesPreviewHelpers";
import {
  isOfertaLocalPublicOfferRowEligible,
  mapOfertaLocalPublicOfferRowToCard,
  type OfertaLocalPublicOfferRow,
} from "./ofertasLocalesPublicOfferHelpers";
import { parseOfertaLocalPublishedSocialLinksFromInternalNotes } from "./ofertasLocalesPublicSearchHelpers";
import type {
  OfertaLocalPublicDetailAsset,
  OfertaLocalPublicOfferDetail,
} from "./ofertasLocalesTypes";

/** Server-only select — internal_notes parsed server-side, never returned raw. */
export const OFERTAS_LOCALES_PUBLIC_DETAIL_SELECT = `
  id,
  status,
  offer_type,
  business_category,
  market_type,
  business_name,
  title,
  description,
  coupon_text,
  flyer_title,
  valid_from,
  valid_until,
  address,
  city,
  state,
  zip_code,
  phone,
  whatsapp,
  website_url,
  directions_url,
  membership_url,
  membership_cta_label,
  membership_note,
  requires_membership_for_deals,
  digital_coupon_url,
  digital_coupon_note,
  flyer_assets,
  coupon_assets,
  internal_notes,
  submitted_at,
  updated_at
`;

export type OfertaLocalPublicDetailRow = OfertaLocalPublicOfferRow & {
  coupon_text: string | null;
  flyer_title: string | null;
  membership_url: string | null;
  membership_cta_label: string | null;
  membership_note: string | null;
  requires_membership_for_deals: boolean;
  digital_coupon_url: string | null;
  digital_coupon_note: string | null;
  internal_notes: string | null;
};

function sanitizeText(raw: string | null | undefined, max: number): string {
  return String(raw ?? "")
    .replace(/\0/g, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, max);
}

function mapAssetList(assets: unknown, kind: "flyer" | "coupon"): OfertaLocalPublicDetailAsset[] {
  if (!Array.isArray(assets)) return [];
  const out: OfertaLocalPublicDetailAsset[] = [];
  for (const entry of assets) {
    if (!entry || typeof entry !== "object") continue;
    const o = entry as Record<string, unknown>;
    const id = sanitizeText(String(o.id ?? ""), 80);
    if (!id) continue;
    const url = String(o.url ?? "").trim();
    const href = getSafeOfertaLocalSourceAssetHref(url);
    const storagePath = String(o.storagePath ?? "").trim();
    const label =
      sanitizeText(String(o.fileName ?? o.title ?? ""), 120) ||
      (kind === "flyer" ? "Flyer" : "Coupon");
    out.push({
      id,
      label,
      kind,
      href,
      pending: !href && Boolean(storagePath),
    });
  }
  return out;
}

export function mapOfertaLocalPublicDetailRowToDetail(
  row: OfertaLocalPublicDetailRow,
  now: Date = new Date()
): OfertaLocalPublicOfferDetail | null {
  if (!isOfertaLocalPublicOfferRowEligible(row, now)) return null;

  const card = mapOfertaLocalPublicOfferRowToCard(row);
  const meta = parseOfertaLocalAdminMetadataFromInternalNotes(row.internal_notes);
  const socialLinks = parseOfertaLocalPublishedSocialLinksFromInternalNotes(row.internal_notes);
  const phone = sanitizeText(row.phone, 40);
  const whatsapp = sanitizeText(row.whatsapp, 40);
  const businessName = sanitizeText(row.business_name, 200);

  return {
    ...card,
    description: sanitizeText(row.description, 8000),
    couponText: sanitizeText(row.coupon_text, 2000),
    flyerTitle: sanitizeText(row.flyer_title, 160),
    whatsappHref: buildOfertaLocalWhatsAppHref(whatsapp || phone, businessName) || null,
    flyerAssets: mapAssetList(row.flyer_assets, "flyer"),
    couponAssets: mapAssetList(row.coupon_assets, "coupon"),
    membershipUrl: getSafeOfertaLocalSourceAssetHref(row.membership_url),
    membershipCtaLabel: sanitizeText(row.membership_cta_label, 80) || null,
    membershipNote: sanitizeText(row.membership_note, 500) || null,
    requiresMembershipForDeals: Boolean(row.requires_membership_for_deals),
    digitalCouponUrl: getSafeOfertaLocalSourceAssetHref(row.digital_coupon_url),
    digitalCouponNote: sanitizeText(row.digital_coupon_note, 500) || null,
    socialLinks,
    wantsAiSearchableSpecials: meta.wantsAiSearchableSpecials,
    isExpired: isOfertaLocalExpired(row.valid_until, now),
  };
}

export async function fetchPublicOfertaLocalDetailById(
  sb: SupabaseClient,
  id: string
): Promise<OfertaLocalPublicOfferDetail | null> {
  const offerId = id.trim();
  if (!offerId) return null;

  const { data, error } = await sb
    .from("ofertas_locales")
    .select(OFERTAS_LOCALES_PUBLIC_DETAIL_SELECT)
    .eq("id", offerId)
    .maybeSingle();

  if (error || !data) return null;
  return mapOfertaLocalPublicDetailRowToDetail(data as OfertaLocalPublicDetailRow);
}

export function ofertaLocalPublicDetailPath(id: string, lang: "es" | "en"): string {
  return `/clasificados/ofertas-locales/${encodeURIComponent(id)}?lang=${lang}`;
}
