/**
 * BIENES RAICES NEGOCIO — STAFF-ASSISTED GALLERY (pure, server + browser safe).
 *
 * WHY THIS EXISTS
 * ---------------
 * The staff "Save for Client" bar used to send a `listingRow` with NO gallery, and the assisted
 * route's column allowlist had no `images`, so a staff-sold listing was saved and published with no
 * photos at all, and a Quick draft could never satisfy "one real photo of the property".
 *
 * The customer path persists the gallery as `listings.images`: a jsonb array of durable URL STRINGS.
 * This module is the one place the assisted path decides what may be written there and how the
 * declared photo roles travel with it. It reuses, and never redefines:
 *   - `isPersistableMediaUrl` / `buildProposedFinalMediaSet` (app/lib/media/listingMediaContract.ts):
 *     data:/blob:/relative refs are never persistable;
 *   - `extractSemanticMediaItems` (the canonical extractor) for the role-bearing entries.
 *
 * ROLES. `listings.images` holds bare URL strings, so a declared role ("property") cannot ride in
 * that column without changing the canonical shape every public renderer reads. The server therefore
 * writes the roles the request DECLARED (url -> role) into `listing_json.br_media_roles`, and the
 * cockpit readiness re-reads them from there. A photo with no declared role stays unroled and the
 * DECLARED-attribution Quick contract answers with its own correction code; nothing here upgrades a
 * missing role to `property`.
 */
import type { SemanticMediaItem } from "@/app/lib/quickBusiness/quickBusinessMediaSemantics";
import { buildProposedFinalMediaSet, isPersistableMediaUrl } from "@/app/lib/media/listingMediaContract";

/** Key inside `listing_json` that carries { [imageUrl]: declaredRole } for the stored gallery. */
export const BR_MEDIA_ROLES_JSON_KEY = "br_media_roles";

/** The Full Bienes Negocio gallery ceiling (buildPublishParamsFromBienesRaicesNegocioDraft: max 40). */
export const ASSISTED_BIENES_FULL_GALLERY_MAX = 40;

const MAX_URL_LENGTH = 2048;

export type AssistedBienesGalleryEntry = { url: string; role?: string };

export type AssistedBienesGallery = {
  /** The durable, deduped, ordered URLs the server writes to `listings.images`. */
  urls: string[];
  /** The same photos with their declared roles: the shape `extractSemanticMediaItems` reads. */
  entries: AssistedBienesGalleryEntry[];
  /** { url: role } for the photos that declared one. Empty when none did. */
  roles: Record<string, string>;
};

export type AssistedBienesGalleryError = "images_invalid" | "images_not_persistable" | "images_too_many";

export type AssistedBienesGalleryResult =
  | { ok: true; gallery: AssistedBienesGallery | null }
  | { ok: false; error: AssistedBienesGalleryError; rejected: number };

function entryUrlAndRole(entry: unknown): { url: string; role: string } | null {
  if (typeof entry === "string") return { url: entry.trim(), role: "" };
  if (!entry || typeof entry !== "object") return null;
  const o = entry as Record<string, unknown>;
  const rawUrl =
    typeof o.url === "string" ? o.url : typeof o.src === "string" ? o.src : typeof o.path === "string" ? o.path : "";
  const role = typeof o.role === "string" ? o.role.trim() : "";
  return { url: rawUrl.trim(), role };
}

/**
 * Validate the `images` a staff request carries.
 *
 * - absent / not-provided / empty  -> `gallery: null`: the stored gallery is left exactly as it is
 *   (this route never wipes a gallery);
 * - any entry that is not a persistable hosted URL (data:, blob:, relative, malformed, oversize)
 *   -> refusal, never a silent drop: a dropped photo would otherwise surface later as a confusing
 *   "no photo" refusal;
 * - more than the Full ceiling -> refusal. The Quick cap is a separate, product-gated rule.
 */
export function parseAssistedBienesGallery(raw: unknown): AssistedBienesGalleryResult {
  if (raw === undefined || raw === null) return { ok: true, gallery: null };
  if (!Array.isArray(raw)) return { ok: false, error: "images_invalid", rejected: 1 };
  if (raw.length === 0) return { ok: true, gallery: null };

  const parsed: { url: string; role: string }[] = [];
  let rejected = 0;
  for (const entry of raw) {
    const item = entryUrlAndRole(entry);
    if (!item || !item.url || item.url.length > MAX_URL_LENGTH || !isPersistableMediaUrl(item.url)) {
      rejected += 1;
      continue;
    }
    parsed.push(item);
  }
  if (rejected > 0) return { ok: false, error: "images_not_persistable", rejected };

  // The shared engine dedupes by URL (first occurrence wins) and keeps the order.
  const finalSet = buildProposedFinalMediaSet({ existing: parsed.map((p) => p.url) });
  if (finalSet.droppedUnpersistable.length > 0) {
    return { ok: false, error: "images_not_persistable", rejected: finalSet.droppedUnpersistable.length };
  }
  if (finalSet.images.length > ASSISTED_BIENES_FULL_GALLERY_MAX) {
    return { ok: false, error: "images_too_many", rejected: finalSet.images.length - ASSISTED_BIENES_FULL_GALLERY_MAX };
  }

  const roleByUrl = new Map<string, string>();
  for (const p of parsed) if (p.role && !roleByUrl.has(p.url)) roleByUrl.set(p.url, p.role);

  const urls = finalSet.images.map((i) => i.url);
  const entries: AssistedBienesGalleryEntry[] = urls.map((url) => {
    const role = roleByUrl.get(url);
    return role ? { url, role } : { url };
  });
  const roles: Record<string, string> = {};
  for (const e of entries) if (e.role) roles[e.url] = e.role;
  return { ok: true, gallery: { urls, entries, roles } };
}

/** The role map stored in a row's `listing_json`, or {} when there is none. */
export function readStoredBienesMediaRoles(listingJson: unknown): Record<string, string> {
  let json: unknown = listingJson;
  if (typeof json === "string") {
    try {
      json = JSON.parse(json);
    } catch {
      return {};
    }
  }
  if (!json || typeof json !== "object" || Array.isArray(json)) return {};
  const map = (json as Record<string, unknown>)[BR_MEDIA_ROLES_JSON_KEY];
  if (!map || typeof map !== "object" || Array.isArray(map)) return {};
  const out: Record<string, string> = {};
  for (const [url, role] of Object.entries(map as Record<string, unknown>)) {
    if (typeof role === "string" && role.trim()) out[url] = role.trim();
  }
  return out;
}

/**
 * `listing_json` with the declared roles merged in (or the stale map removed when this save
 * declares none). Never touches any other key.
 */
export function withStoredBienesMediaRoles(
  listingJson: unknown,
  roles: Readonly<Record<string, string>>,
): Record<string, unknown> {
  let base: unknown = listingJson;
  if (typeof base === "string") {
    try {
      base = JSON.parse(base);
    } catch {
      base = null;
    }
  }
  const out: Record<string, unknown> =
    base && typeof base === "object" && !Array.isArray(base) ? { ...(base as Record<string, unknown>) } : {};
  if (Object.keys(roles).length > 0) out[BR_MEDIA_ROLES_JSON_KEY] = { ...roles };
  else delete out[BR_MEDIA_ROLES_JSON_KEY];
  return out;
}

/**
 * The media set of a STORED Bienes row: `images` (URL strings, or {url, role} objects) plus the
 * declared-role map in `listing_json`. `photos` are the http(s) URLs only.
 */
export function storedBienesMediaFacts(row: { images?: unknown; listing_json?: unknown }): {
  items: SemanticMediaItem[];
  photos: string[];
} {
  const images = Array.isArray(row.images) ? (row.images as unknown[]) : [];
  const roles = readStoredBienesMediaRoles(row.listing_json);
  const items: SemanticMediaItem[] = [];
  const photos: string[] = [];
  for (const entry of images) {
    const parsed = entryUrlAndRole(entry);
    if (!parsed || !parsed.url) continue;
    const role = parsed.role || roles[parsed.url] || null;
    items.push({ role, mime: null });
    if (/^https?:\/\//i.test(parsed.url)) photos.push(parsed.url);
  }
  return { items, photos };
}
