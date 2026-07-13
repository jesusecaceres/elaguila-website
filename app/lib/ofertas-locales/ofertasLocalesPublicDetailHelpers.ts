/**
 * Ofertas Locales public offer detail — safe projection (FINAL-4).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { parseOfertaLocalAdminMetadataFromInternalNotes } from "./ofertasLocalesAdminHelpers";
import { getSafeOfertaLocalSourceAssetHref } from "./ofertasLocalesClickableItemPreviewHelpers";
import {
  OFERTAS_LOCALES_PUBLIC_DETAIL_SELECT,
  OFERTAS_LOCALES_PUBLIC_SEARCH_JOIN_SELECT,
  parseOfertaLocalDraftSnapshot,
  readDraftSnapshotMembershipFields,
  type OfertaLocalDraftSnapshot,
} from "./ofertasLocalesDbSchema";
import { isOfertaLocalExpired } from "./ofertasLocalesFormatting";
import { buildOfertaLocalWhatsAppHref } from "./ofertasLocalesPreviewHelpers";
import {
  isOfertaLocalPublicOfferRowEligible,
  mapOfertaLocalPublicOfferRowToCard,
  type OfertaLocalPublicOfferRow,
} from "./ofertasLocalesPublicOfferHelpers";
import {
  isOfertaLocalPublicSearchRowEligible,
  mapOfertaLocalPublicDetailHubItemFromRow,
  parseOfertaLocalPublishedSocialLinksFromInternalNotes,
  type OfertaLocalPublicSearchJoinedRow,
} from "./ofertasLocalesPublicSearchHelpers";
import type {
  OfertaLocalPublicDetailAsset,
  OfertaLocalPublicDetailHubItem,
  OfertaLocalPublicOfferDetail,
} from "./ofertasLocalesTypes";

export { OFERTAS_LOCALES_PUBLIC_DETAIL_SELECT } from "./ofertasLocalesDbSchema";

export type OfertaLocalPublicDetailRow = OfertaLocalPublicOfferRow & {
  coupon_text: string | null;
  flyer_title: string | null;
  membership_url: string | null;
  membership_note: string | null;
  digital_coupon_url: string | null;
  digital_coupon_note: string | null;
  draft_snapshot: unknown;
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

function resolvePublicBusinessLogoFromSnapshot(snapshot: OfertaLocalDraftSnapshot): string | null {
  const uploaded = getSafeOfertaLocalSourceAssetHref(String(snapshot.businessLogoUploadedUrl ?? ""));
  if (uploaded) return uploaded;
  return getSafeOfertaLocalSourceAssetHref(String(snapshot.businessLogoUrl ?? ""));
}

export function mapOfertaLocalPublicDetailRowToDetail(
  row: OfertaLocalPublicDetailRow,
  now: Date = new Date()
): OfertaLocalPublicOfferDetail | null {
  if (!isOfertaLocalPublicOfferRowEligible(row, now)) return null;

  const card = mapOfertaLocalPublicOfferRowToCard(row);
  const meta = parseOfertaLocalAdminMetadataFromInternalNotes(row.internal_notes);
  const socialLinks = parseOfertaLocalPublishedSocialLinksFromInternalNotes(row.internal_notes);
  const snapshotFields = readDraftSnapshotMembershipFields(parseOfertaLocalDraftSnapshot(row.draft_snapshot));
  const phone = sanitizeText(row.phone, 40);
  const whatsapp = sanitizeText(row.whatsapp, 40);
  const businessName = sanitizeText(row.business_name, 200);
  const draft = parseOfertaLocalDraftSnapshot(row.draft_snapshot);
  const businessLogoHref = resolvePublicBusinessLogoFromSnapshot(draft);

  return {
    ...card,
    description: sanitizeText(row.description, 8000),
    couponText: sanitizeText(row.coupon_text, 2000),
    flyerTitle: sanitizeText(row.flyer_title, 160),
    whatsappHref: buildOfertaLocalWhatsAppHref(whatsapp || phone, businessName) || null,
    flyerAssets: mapAssetList(row.flyer_assets, "flyer"),
    couponAssets: mapAssetList(row.coupon_assets, "coupon"),
    membershipUrl: getSafeOfertaLocalSourceAssetHref(row.membership_url),
    membershipCtaLabel: snapshotFields.membershipCtaLabel,
    membershipNote: sanitizeText(row.membership_note, 500) || null,
    requiresMembershipForDeals: snapshotFields.requiresMembershipForDeals,
    digitalCouponUrl: getSafeOfertaLocalSourceAssetHref(row.digital_coupon_url),
    digitalCouponNote: sanitizeText(row.digital_coupon_note, 500) || null,
    socialLinks,
    wantsAiSearchableSpecials: meta.wantsAiSearchableSpecials,
    isExpired: isOfertaLocalExpired(row.valid_until, now),
    businessLogoHref,
    phoneDisplay: phone,
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

export async function fetchPublicOfertaLocalItemsForOfferId(
  sb: SupabaseClient,
  offerId: string,
  lang: "es" | "en" = "es"
): Promise<OfertaLocalPublicDetailHubItem[]> {
  const id = offerId.trim();
  if (!id) return [];

  const { data, error } = await sb
    .from("oferta_local_items")
    .select(OFERTAS_LOCALES_PUBLIC_SEARCH_JOIN_SELECT)
    .eq("oferta_local_id", id)
    .eq("review_status", "approved")
    .eq("is_active", true)
    .eq("ofertas_locales.status", "approved")
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  return (data as OfertaLocalPublicSearchJoinedRow[])
    .filter((row) => isOfertaLocalPublicSearchRowEligible(row))
    .map((row) => mapOfertaLocalPublicDetailHubItemFromRow(row, lang));
}

export function ofertaLocalPublicDetailPath(id: string, lang: "es" | "en"): string {
  return `/clasificados/ofertas-locales/${encodeURIComponent(id)}?lang=${lang}`;
}
