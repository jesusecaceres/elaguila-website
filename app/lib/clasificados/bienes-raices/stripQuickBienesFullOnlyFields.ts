/**
 * QUICK BIENES NEGOCIO — the ONE pure boundary that keeps Full-only content out of a Quick listing.
 *
 * Product lock (Bienes Raíces Negocio):
 *   QUICK  = category-aware photo cap (3), no video, ONE active property, no inventory pack, ONE primary
 *            website (`agenteSitioWeb` -> `negocioSitioWeb`), NO social links, NO extra website URLs
 *            (marca / segundo agente / broker), NO Google Reviews / Google Business / Yelp, NO extra
 *            business links.
 *   FULL   = everything the category supports today, unchanged.
 *
 * Quick and Full share one application, one listing row and one public presentation
 * (`AgenteIndividualResidencialPreviewPage`). This module is only the entitlement difference for FIELDS:
 *
 *  - SERVER: `stripQuickBienesFullOnlyFields` restores (stored value) or empties (no stored value) every
 *    Full-only key on `business_meta`, `profile_json.businessMeta`, `contact_json.channels` and the
 *    `Leonix:contact_channels_v1` detail pair. It never DELETES stored history and never lets the incoming
 *    (browser-supplied) value win. It must only be called for a PROVEN Quick product
 *    (`quickFullOnlyBoundaryApplies`), never for `unverified`: an unverified first save may be a Full customer.
 *  - CLIENT: `blankQuickBienesFullOnlyFormFields` blanks the same fields (plus video and inventory drafts) on
 *    the form state that feeds the preview and the outgoing payload, so what the customer previews is what is
 *    published. Stored values are restored by the server, not by the browser.
 *
 * Pure: no IO, no React, no server-only imports; safe for routes, the client application and verifiers.
 */
import {
  applyQuickFullOnlyBoundary,
  quickFullOnlyBoundaryApplies,
} from "@/app/lib/quickBusiness/quickFullOnlyBoundary";
import { quickImageMaxForBusinessCategory } from "@/app/lib/quickBusiness/quickBusinessMediaSemantics";
import type { QuickBusinessProductDecision } from "@/app/lib/listingPlans/quickBusinessProductIdentity";

type Json = Record<string, unknown>;

export { quickFullOnlyBoundaryApplies };

/** `business_meta` keys (see leonixNegocioBusinessMetaFromFormState.ts) that only Full may carry. */
export const QUICK_BIENES_FULL_ONLY_META_KEYS = [
  "negocioRedes",
  "negocioInstagram",
  "negocioFacebook",
  "negocioYoutube",
  "negocioTiktok",
  "negocioExternalVideoUrls",
  "negocioBusinessExtraUrls",
  "negocioGoogleBusinessUrl",
  "negocioGoogleReviewsUrl",
  "negocioYelpReviewsUrl",
] as const;

/** Social channel keys of `contact_json.channels` and the contact-channels detail pair (website stays: primary). */
export const QUICK_BIENES_FULL_ONLY_CHANNEL_KEYS = ["instagram", "facebook", "youtube", "tiktok"] as const;

/** Same literal as LEONIX_DP_CONTACT_CHANNELS_V1 (asserted equal in the verifier). */
export const QUICK_BIENES_CONTACT_CHANNELS_PAIR_LABEL = "Leonix:contact_channels_v1";

/** The form-state fields blanked for a Quick session (the primary `agenteSitioWeb` is deliberately absent). */
export const QUICK_BIENES_FULL_ONLY_FORM_FIELDS = {
  extraWebsites: ["marcaSitioWeb", "agente2SitioWeb", "brokerSitioWeb"],
  social: [
    "socialInstagram",
    "socialFacebook",
    "socialYoutube",
    "socialTiktok",
    "socialX",
    "socialLinkedin",
    "socialSnapchat",
    "socialOtro",
    "agente2SocialInstagram",
    "agente2SocialFacebook",
    "agente2SocialYoutube",
    "agente2SocialTiktok",
    "agente2SocialX",
    "agente2SocialOtro",
    "brokerInstagram",
    "brokerFacebook",
    "brokerYoutube",
    "brokerTiktok",
    "brokerX",
    "brokerOtro",
  ],
  reviews: ["googleBusinessUrl", "googleReviewsUrl", "yelpReviewsUrl"],
  video: ["videoUrl", "videoDataUrl", "videoArchivoNombre"],
} as const;

function isPlainObject(value: unknown): value is Json {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasContent(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (isPlainObject(value)) return Object.keys(value).length > 0;
  return true;
}

/** Parse a JSON-object column that may arrive as a string (the publish core writes a string) or an object. */
function readJsonObject(raw: unknown): { obj: Json; wasString: boolean } | null {
  if (isPlainObject(raw)) return { obj: raw, wasString: false };
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (isPlainObject(parsed)) return { obj: parsed, wasString: true };
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Apply the boundary to ONE flat object over `keys`. A key absent from `incoming` is treated as empty
 * BEFORE the boundary runs: the meta builders omit empty keys, so an absent key is exactly how a Quick
 * client "clears" a field, and a wholesale-replace write would otherwise destroy the stored value.
 */
function boundaryOnFlatObject(input: {
  incoming: Json;
  existing: Json | null;
  keys: readonly string[];
  label: string;
  emptyAs: "delete" | "null";
}): { obj: Json; changed: string[] } {
  const view: Json = {};
  for (const key of input.keys) {
    const v = input.incoming[key];
    view[key] = v === undefined || v === null ? "" : v;
  }
  const result = applyQuickFullOnlyBoundary({ incoming: view, existing: input.existing, paths: input.keys });
  const out: Json = { ...input.incoming };
  for (const key of input.keys) {
    const next = result.value[key];
    if (hasContent(next)) out[key] = next;
    else if (input.emptyAs === "null") {
      if (key in input.incoming || hasContent(input.existing?.[key])) out[key] = null;
    } else delete out[key];
  }
  return { obj: out, changed: result.changedPaths.map((p) => `${input.label}.${p}`) };
}

function readChannelsPair(detailPairs: unknown): { index: number; obj: Json } | null {
  if (!Array.isArray(detailPairs)) return null;
  for (let i = 0; i < detailPairs.length; i += 1) {
    const item = detailPairs[i];
    if (!isPlainObject(item)) continue;
    if (String(item.label ?? "").trim() !== QUICK_BIENES_CONTACT_CHANNELS_PAIR_LABEL) continue;
    const parsed = readJsonObject(item.value);
    if (parsed) return { index: i, obj: parsed.obj };
  }
  return null;
}

export type StripQuickBienesResult<T extends Json> = {
  /** A copy of `row` with every Full-only key restored from `existingRow` or emptied. */
  row: T;
  /** Surface-qualified paths whose incoming value was changed (audit line). Empty when nothing was Full-only. */
  changedPaths: string[];
};

/**
 * Restore/empty every Full-only key on a listings-row payload. `existingRow` is the stored row (the
 * columns business_meta / profile_json / contact_json / detail_pairs), or null for a first insert.
 * Only call this for a PROVEN Quick product; see `quickFullOnlyBoundaryApplies`.
 */
export function stripQuickBienesFullOnlyFields<T extends Json>(input: {
  row: T;
  existingRow?: Json | null;
}): StripQuickBienesResult<T> {
  const row: Json = { ...input.row };
  const existing = input.existingRow ?? null;
  const changed: string[] = [];

  // 1. business_meta — JSON string (publish core / listing-edit) or object.
  if ("business_meta" in row) {
    const incomingMeta = readJsonObject(row.business_meta);
    const existingMeta = readJsonObject(existing?.business_meta)?.obj ?? null;
    if (incomingMeta || existingMeta) {
      const res = boundaryOnFlatObject({
        incoming: incomingMeta?.obj ?? {},
        existing: existingMeta,
        keys: QUICK_BIENES_FULL_ONLY_META_KEYS,
        label: "business_meta",
        emptyAs: "delete",
      });
      if (res.changed.length) {
        changed.push(...res.changed);
        if (!Object.keys(res.obj).length) row.business_meta = row.business_meta === undefined ? undefined : null;
        else row.business_meta = incomingMeta?.wasString === false ? res.obj : JSON.stringify(res.obj);
      }
    }
  }

  // 2. profile_json.businessMeta — a copy of the same meta inside the profile.
  if ("profile_json" in row && isPlainObject(row.profile_json)) {
    const profile = row.profile_json;
    const incomingMeta = isPlainObject(profile.businessMeta) ? profile.businessMeta : null;
    const existingProfile = readJsonObject(existing?.profile_json)?.obj ?? null;
    const existingMeta = existingProfile && isPlainObject(existingProfile.businessMeta) ? existingProfile.businessMeta : null;
    if (incomingMeta || existingMeta) {
      const res = boundaryOnFlatObject({
        incoming: incomingMeta ?? {},
        existing: existingMeta,
        keys: QUICK_BIENES_FULL_ONLY_META_KEYS,
        label: "profile_json.businessMeta",
        emptyAs: "delete",
      });
      if (res.changed.length) {
        changed.push(...res.changed);
        row.profile_json = { ...profile, businessMeta: res.obj };
      }
    }
  }

  // 3. contact_json.channels — social icons.
  if ("contact_json" in row && isPlainObject(row.contact_json)) {
    const contact = row.contact_json;
    const incomingChannels = isPlainObject(contact.channels) ? contact.channels : null;
    const existingContact = readJsonObject(existing?.contact_json)?.obj ?? null;
    const existingChannels =
      existingContact && isPlainObject(existingContact.channels) ? existingContact.channels : null;
    if (incomingChannels || existingChannels) {
      const res = boundaryOnFlatObject({
        incoming: incomingChannels ?? {},
        existing: existingChannels,
        keys: QUICK_BIENES_FULL_ONLY_CHANNEL_KEYS,
        label: "contact_json.channels",
        emptyAs: "null",
      });
      if (res.changed.length) {
        changed.push(...res.changed);
        row.contact_json = { ...contact, channels: res.obj };
      }
    }
  }

  // 4. detail_pairs — the machine "Leonix:contact_channels_v1" row carries the social URLs too.
  if ("detail_pairs" in row && Array.isArray(row.detail_pairs)) {
    const incomingPair = readChannelsPair(row.detail_pairs);
    const existingPair = readChannelsPair(existing?.detail_pairs);
    if (incomingPair || existingPair) {
      const res = boundaryOnFlatObject({
        incoming: incomingPair?.obj ?? {},
        existing: existingPair?.obj ?? null,
        keys: QUICK_BIENES_FULL_ONLY_CHANNEL_KEYS,
        label: "detail_pairs.contact_channels",
        emptyAs: "null",
      });
      if (res.changed.length) {
        changed.push(...res.changed);
        const pairs = [...(row.detail_pairs as unknown[])];
        if (incomingPair) {
          const original = pairs[incomingPair.index] as Json;
          pairs[incomingPair.index] = { ...original, value: JSON.stringify(res.obj) };
        } else {
          // No channels pair in the incoming row: re-attach ONLY the restored stored social values, as a
          // valid v1 payload (the parser requires `v: 1`), never a copy of the stored contact preferences.
          pairs.push({ label: QUICK_BIENES_CONTACT_CHANNELS_PAIR_LABEL, value: JSON.stringify({ v: 1, ...res.obj }) });
        }
        row.detail_pairs = pairs;
      }
    }
  }

  return { row: row as T, changedPaths: changed };
}

/** Count of external video links in a row's `business_meta` (JSON array under `negocioExternalVideoUrls`). */
export function countBienesRowExternalVideos(row: Json | null | undefined): number {
  const meta = readJsonObject(row?.business_meta)?.obj;
  if (!meta) return 0;
  const raw = meta.negocioExternalVideoUrls;
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === "string" && raw.trim()
      ? (() => {
          try {
            const parsed = JSON.parse(raw) as unknown;
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];
  return list.filter((u) => typeof u === "string" && /^https?:\/\/\S+/i.test(u.trim())).length;
}

/**
 * Video links a write would ADD beyond what is already stored. After the boundary this is 0 by
 * construction; it is the `externalVideoCount` handed to `enforceQuickBusinessPublishMedia` as
 * defence in depth, so "Quick includes no video" is checked on the row actually about to be written
 * and a stored Full video never blocks a Quick save (restored history is not an addition).
 */
export function quickBienesNetNewExternalVideoCount(input: {
  row: Json;
  existingRow?: Json | null;
}): number {
  return Math.max(0, countBienesRowExternalVideos(input.row) - countBienesRowExternalVideos(input.existingRow ?? null));
}

/** The photo cap for a Bienes Negocio Quick listing, from the ONE per-category table (= 3). */
export function quickBienesImageCap(): number {
  return quickImageMaxForBusinessCategory("bienes-negocio") ?? 3;
}

/**
 * A Quick edit may not GROW the gallery beyond the cap, and may not exceed what is already stored
 * (a downgraded owner with stored Full photos keeps them; nothing new can be added past the cap).
 */
export function quickBienesGalleryGrowthAllowed(input: { incomingCount: number; existingCount: number }): boolean {
  const allowed = Math.max(quickBienesImageCap(), Math.max(0, input.existingCount));
  return input.incomingCount <= allowed;
}

/**
 * Staff/assisted insert: ONE active property, no inventory. A proven Quick row is always `main`,
 * carries no group/parent link from the request (the route self-groups a main row after insert).
 */
export function forceQuickBienesMainInventoryRow<T extends Json>(row: T): T {
  const out: Json = { ...row, inventory_role: "main" };
  delete out.br_inventory_group_id;
  delete out.br_inventory_parent_listing_id;
  return out as T;
}

export type QuickBienesAddonRefusal = { status: number; code: string; message: string };

/**
 * Should the Bienes inventory add-on (+3 properties) be refused for this parent listing's product?
 * Refused ONLY for a PROVEN Quick product (server entitlement/ledger/assisted record). Full and
 * `unverified` are unchanged, so no Full customer is ever blocked on a guess.
 */
export function quickBienesInventoryAddonRefusal(
  decision: Pick<QuickBusinessProductDecision, "product" | "source"> | null | undefined,
): QuickBienesAddonRefusal | null {
  if (!quickFullOnlyBoundaryApplies(decision)) return null;
  return {
    status: 422,
    code: "quick_inventory_addon_not_available",
    message:
      "The property inventory add-on is not available on the Quick package. Upgrade to the full package to add properties.",
  };
}

// ─────────────────────────────── CLIENT (form-state) side ───────────────────────────────

/**
 * Blank every Full-only field on the agente-individual form state for a Quick session. The primary
 * website (`agenteSitioWeb`) is kept. Returns a shallow copy; the caller's state is untouched.
 */
export function blankQuickBienesFullOnlyFormFields<T extends object>(state: T): T {
  const out = { ...(state as Record<string, unknown>) };
  const groups = QUICK_BIENES_FULL_ONLY_FORM_FIELDS;
  for (const key of [...groups.extraWebsites, ...groups.social, ...groups.reviews, ...groups.video]) {
    if (key in out) out[key] = "";
  }
  if ("videoUrls" in out) out.videoUrls = [];
  if ("businessExtraUrls" in out) out.businessExtraUrls = [];
  if ("additionalInventoryProperties" in out) out.additionalInventoryProperties = [];
  if ("inventoryPackAccepted" in out) out.inventoryPackAccepted = false;
  if ("confirmInventoryPackPricing" in out) out.confirmInventoryPackPricing = false;
  return out as T;
}

/**
 * The Quick application's photo step has no per-photo role picker (the Quick INTAKE does). The gallery of
 * this application is, by construction, PROPERTY photos (headshot and logo live in separate identity
 * fields), and the customer declares "these photos represent the property" in the final confirmation
 * (`confirmPhotosRepresentItem`). Only when that declaration is true are the still-unroled gallery photos
 * marked `property`, so the server's semantic contract sees an explicit customer declaration instead of
 * refusing a listing whose photos it can only call "unspecified". Never overwrites a role already set.
 */
export function declareQuickBienesPropertyRoles<
  T extends { fotosDataUrls?: unknown; fotoMediaRoles?: Record<string, string>; confirmPhotosRepresentItem?: unknown },
>(state: T): T {
  if (state.confirmPhotosRepresentItem !== true) return state;
  const photos = Array.isArray(state.fotosDataUrls)
    ? state.fotosDataUrls.filter((u): u is string => typeof u === "string" && u.trim().length > 0)
    : [];
  if (!photos.length) return state;
  const roles: Record<string, string> = { ...(state.fotoMediaRoles ?? {}) };
  for (const url of photos) {
    if (!roles[url]) roles[url] = "property";
  }
  return { ...state, fotoMediaRoles: roles };
}
