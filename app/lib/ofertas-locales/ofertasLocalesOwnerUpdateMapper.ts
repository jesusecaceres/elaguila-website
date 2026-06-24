/**
 * Owner-safe partial update → pending_review resubmit (FINAL-3).
 */

import type { OfertaLocalAdminRow } from "./ofertasLocalesAdminHelpers";
import {
  filterToOfertasLocalesProductionColumns,
  mergeOfertaLocalDraftSnapshot,
  parseOfertaLocalDraftSnapshot,
  readDraftSnapshotMembershipFields,
} from "./ofertasLocalesDbSchema";
import {
  normalizeOfertaLocalPhoneInput,
  normalizeOfertaLocalUrlInput,
  normalizeOfertaLocalZipInput,
} from "./ofertasLocalesFormatting";
import type { OfertaLocalFeaturedPlacementScope } from "./ofertasLocalesTypes";

const INTERNAL_METADATA_PREFIX = "[ofertas_locales_metadata]";
const MAX_TEXT = 8000;
const MAX_TITLE = 200;
const MAX_SHORT = 500;

export type OfertaLocalOwnerUpdateInput = {
  title?: string;
  description?: string;
  couponText?: string;
  flyerTitle?: string;
  validFrom?: string;
  validUntil?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  whatsapp?: string;
  websiteUrl?: string;
  directionsUrl?: string;
  membershipUrl?: string;
  membershipCtaLabel?: string;
  membershipNote?: string;
  requiresMembershipForDeals?: boolean;
  digitalCouponUrl?: string;
  digitalCouponNote?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  googleBusinessUrl?: string;
  googleReviewUrl?: string;
  yelpUrl?: string;
  wantsAiSearchableSpecials?: boolean;
  wantsFeaturedPlacement?: boolean;
  featuredPlacementScope?: OfertaLocalFeaturedPlacementScope | string;
};

function sanitizeText(raw: string | undefined, max = MAX_TEXT): string | null {
  const t = String(raw ?? "")
    .replace(/\0/g, "")
    .trim()
    .slice(0, max);
  return t || null;
}

function sanitizeRequiredText(raw: string | undefined, max = MAX_TITLE): string {
  return String(raw ?? "")
    .replace(/\0/g, "")
    .trim()
    .slice(0, max);
}

function sanitizeOptionalUrl(raw: string | undefined): string | null {
  const t = String(raw ?? "").trim();
  if (!t) return null;
  return normalizeOfertaLocalUrlInput(t) || null;
}

function sanitizeOptionalPhone(raw: string | undefined): string | null {
  const d = normalizeOfertaLocalPhoneInput(String(raw ?? ""));
  return d.length >= 10 ? d : d || null;
}

function extractPreservedInternalNotesBlocks(existing: string | null | undefined): {
  userNote: string | null;
  metadataJson: string | null;
  adminBlocks: string[];
} {
  const text = String(existing ?? "");
  const metaIdx = text.indexOf(INTERNAL_METADATA_PREFIX);
  const userNote = metaIdx > 0 ? text.slice(0, metaIdx).trim() || null : metaIdx < 0 ? text.trim() || null : null;

  let metadataJson: string | null = null;
  if (metaIdx >= 0) {
    const afterMeta = text.slice(metaIdx + INTERNAL_METADATA_PREFIX.length);
    const adminIdx = afterMeta.indexOf("[admin_review]");
    metadataJson = (adminIdx >= 0 ? afterMeta.slice(0, adminIdx) : afterMeta).trim() || null;
  }

  const adminBlocks: string[] = [];
  let searchFrom = 0;
  while (true) {
    const idx = text.indexOf("[admin_review]", searchFrom);
    if (idx < 0) break;
    const rest = text.slice(idx);
    const nextBreak = rest.indexOf("\n\n[", 1);
    adminBlocks.push(nextBreak >= 0 ? rest.slice(0, nextBreak).trim() : rest.trim());
    searchFrom = idx + 14;
  }

  return { userNote, metadataJson, adminBlocks };
}

function buildInternalNotesForOwnerUpdate(
  existingNotes: string | null | undefined,
  input: OfertaLocalOwnerUpdateInput
): string | null {
  const preserved = extractPreservedInternalNotesBlocks(existingNotes);

  const socialLinks: Record<string, string> = {};
  const fb = sanitizeOptionalUrl(input.facebookUrl);
  if (fb) socialLinks.facebookUrl = fb;
  const ig = sanitizeOptionalUrl(input.instagramUrl);
  if (ig) socialLinks.instagramUrl = ig;
  const tt = sanitizeOptionalUrl(input.tiktokUrl);
  if (tt) socialLinks.tiktokUrl = tt;
  const yt = sanitizeOptionalUrl(input.youtubeUrl);
  if (yt) socialLinks.youtubeUrl = yt;
  const gb = sanitizeOptionalUrl(input.googleBusinessUrl);
  if (gb) socialLinks.googleBusinessUrl = gb;
  const gr = sanitizeOptionalUrl(input.googleReviewUrl);
  if (gr) socialLinks.googleReviewUrl = gr;
  const yelp = sanitizeOptionalUrl(input.yelpUrl);
  if (yelp) socialLinks.yelpUrl = yelp;

  const metadata: Record<string, unknown> = {};
  if (Object.keys(socialLinks).length) metadata.socialLinks = socialLinks;
  if (input.wantsFeaturedPlacement && input.featuredPlacementScope && input.featuredPlacementScope !== "none") {
    metadata.featuredPlacementScope = input.featuredPlacementScope;
  }
  if (input.wantsAiSearchableSpecials) metadata.wantsAiSearchableSpecials = true;

  const chunks: string[] = [];
  if (preserved.userNote) chunks.push(preserved.userNote);
  if (Object.keys(metadata).length) {
    chunks.push(`${INTERNAL_METADATA_PREFIX}${JSON.stringify(metadata)}`);
  }
  for (const block of preserved.adminBlocks) {
    if (block) chunks.push(block);
  }

  if (!chunks.length) return null;
  return chunks.join("\n\n").slice(0, MAX_SHORT);
}

export function buildOfertaLocalOwnerUpdatePayload(
  row: OfertaLocalAdminRow,
  input: OfertaLocalOwnerUpdateInput
): Record<string, unknown> {
  const metadata = extractPreservedInternalNotesBlocks(row.internal_notes);
  let parsedMeta: Record<string, unknown> = {};
  if (metadata.metadataJson) {
    try {
      parsedMeta = JSON.parse(metadata.metadataJson) as Record<string, unknown>;
    } catch {
      parsedMeta = {};
    }
  }
  const existingSocial = (parsedMeta.socialLinks ?? {}) as Record<string, string>;
  const snapshotFields = readDraftSnapshotMembershipFields(parseOfertaLocalDraftSnapshot(row.draft_snapshot));

  const wantsFeatured =
    input.wantsFeaturedPlacement !== undefined
      ? Boolean(input.wantsFeaturedPlacement)
      : row.is_featured_requested;
  const featuredScope =
    input.featuredPlacementScope !== undefined
      ? String(input.featuredPlacementScope)
      : String(row.featured_placement_scope ?? parsedMeta.featuredPlacementScope ?? "none");
  const wantsAi =
    input.wantsAiSearchableSpecials !== undefined
      ? Boolean(input.wantsAiSearchableSpecials)
      : Boolean(row.wants_ai_searchable_specials ?? parsedMeta.wantsAiSearchableSpecials);

  const internalInput: OfertaLocalOwnerUpdateInput = {
    facebookUrl: input.facebookUrl ?? existingSocial.facebookUrl ?? row.facebook_url ?? "",
    instagramUrl: input.instagramUrl ?? existingSocial.instagramUrl ?? row.instagram_url ?? "",
    tiktokUrl: input.tiktokUrl ?? existingSocial.tiktokUrl ?? row.tiktok_url ?? "",
    youtubeUrl: input.youtubeUrl ?? existingSocial.youtubeUrl ?? row.youtube_url ?? "",
    googleBusinessUrl: input.googleBusinessUrl ?? existingSocial.googleBusinessUrl ?? row.google_business_url ?? "",
    googleReviewUrl: input.googleReviewUrl ?? existingSocial.googleReviewUrl ?? row.google_review_url ?? "",
    yelpUrl: input.yelpUrl ?? existingSocial.yelpUrl ?? row.yelp_url ?? "",
    wantsAiSearchableSpecials: wantsAi,
    wantsFeaturedPlacement: wantsFeatured,
    featuredPlacementScope: featuredScope,
  };

  const now = new Date().toISOString();
  const draftSnapshot = mergeOfertaLocalDraftSnapshot(row.draft_snapshot, {
    membershipCtaLabel:
      input.membershipCtaLabel !== undefined
        ? sanitizeText(input.membershipCtaLabel, 80)
        : snapshotFields.membershipCtaLabel,
    requiresMembershipForDeals:
      input.requiresMembershipForDeals !== undefined
        ? Boolean(input.requiresMembershipForDeals)
        : snapshotFields.requiresMembershipForDeals,
  });

  const payload: Record<string, unknown> = {
    title: input.title !== undefined ? sanitizeRequiredText(input.title) : row.title,
    description: input.description !== undefined ? sanitizeText(input.description) : row.description,
    coupon_text: input.couponText !== undefined ? sanitizeText(input.couponText) : row.coupon_text,
    flyer_title: input.flyerTitle !== undefined ? sanitizeText(input.flyerTitle, 160) : row.flyer_title,
    valid_from: input.validFrom !== undefined ? sanitizeRequiredText(input.validFrom, 32) : row.valid_from,
    valid_until: input.validUntil !== undefined ? sanitizeRequiredText(input.validUntil, 32) : row.valid_until,
    address: input.address !== undefined ? sanitizeText(input.address, 300) : row.address,
    city: input.city !== undefined ? sanitizeRequiredText(input.city, 120) : row.city,
    state: input.state !== undefined ? sanitizeText(input.state, 40) : row.state,
    zip_code:
      input.zipCode !== undefined ? normalizeOfertaLocalZipInput(input.zipCode) : row.zip_code,
    phone: input.phone !== undefined ? sanitizeOptionalPhone(input.phone) : row.phone,
    whatsapp: input.whatsapp !== undefined ? sanitizeOptionalPhone(input.whatsapp) : row.whatsapp,
    website_url: input.websiteUrl !== undefined ? sanitizeOptionalUrl(input.websiteUrl) : row.website_url,
    directions_url:
      input.directionsUrl !== undefined ? sanitizeOptionalUrl(input.directionsUrl) : row.directions_url,
    membership_url:
      input.membershipUrl !== undefined ? sanitizeOptionalUrl(input.membershipUrl) : row.membership_url,
    membership_note:
      input.membershipNote !== undefined ? sanitizeText(input.membershipNote) : row.membership_note,
    digital_coupon_url:
      input.digitalCouponUrl !== undefined
        ? sanitizeOptionalUrl(input.digitalCouponUrl)
        : row.digital_coupon_url,
    digital_coupon_note:
      input.digitalCouponNote !== undefined
        ? sanitizeText(input.digitalCouponNote)
        : row.digital_coupon_note,
    facebook_url: sanitizeOptionalUrl(internalInput.facebookUrl),
    instagram_url: sanitizeOptionalUrl(internalInput.instagramUrl),
    tiktok_url: sanitizeOptionalUrl(internalInput.tiktokUrl),
    youtube_url: sanitizeOptionalUrl(internalInput.youtubeUrl),
    google_business_url: sanitizeOptionalUrl(internalInput.googleBusinessUrl),
    google_review_url: sanitizeOptionalUrl(internalInput.googleReviewUrl),
    yelp_url: sanitizeOptionalUrl(internalInput.yelpUrl),
    wants_ai_searchable_specials: wantsAi,
    wants_featured_placement: wantsFeatured,
    featured_placement_scope: featuredScope !== "none" ? featuredScope : null,
    is_featured_requested: wantsFeatured,
    draft_snapshot: draftSnapshot,
    internal_notes: buildInternalNotesForOwnerUpdate(row.internal_notes, internalInput),
    status: "pending_review",
    updated_at: now,
    submitted_at: now,
  };

  return filterToOfertasLocalesProductionColumns(payload);
}

export function validateOfertaLocalOwnerUpdateInput(
  row: OfertaLocalAdminRow,
  input: OfertaLocalOwnerUpdateInput
): string | null {
  const title = input.title !== undefined ? sanitizeRequiredText(input.title) : row.title;
  const city = input.city !== undefined ? sanitizeRequiredText(input.city, 120) : row.city;
  const zip =
    input.zipCode !== undefined ? normalizeOfertaLocalZipInput(input.zipCode) : row.zip_code;
  const validFrom = input.validFrom !== undefined ? input.validFrom.trim() : row.valid_from;
  const validUntil = input.validUntil !== undefined ? input.validUntil.trim() : row.valid_until;

  if (!title) return "title_required";
  if (!city) return "city_required";
  if (zip.length !== 5) return "zip_invalid";
  if (!validFrom || !validUntil) return "dates_required";
  if (validUntil < validFrom) return "dates_invalid";
  return null;
}

export function stripForbiddenOwnerUpdateFields(body: Record<string, unknown>): OfertaLocalOwnerUpdateInput {
  const allowed = [
    "title",
    "description",
    "couponText",
    "flyerTitle",
    "validFrom",
    "validUntil",
    "address",
    "city",
    "state",
    "zipCode",
    "phone",
    "whatsapp",
    "websiteUrl",
    "directionsUrl",
    "membershipUrl",
    "membershipCtaLabel",
    "membershipNote",
    "requiresMembershipForDeals",
    "digitalCouponUrl",
    "digitalCouponNote",
    "facebookUrl",
    "instagramUrl",
    "tiktokUrl",
    "youtubeUrl",
    "googleBusinessUrl",
    "googleReviewUrl",
    "yelpUrl",
    "wantsAiSearchableSpecials",
    "wantsFeaturedPlacement",
    "featuredPlacementScope",
  ] as const;

  const out: OfertaLocalOwnerUpdateInput = {};
  for (const key of allowed) {
    if (key in body) (out as Record<string, unknown>)[key] = body[key];
  }
  return out;
}
