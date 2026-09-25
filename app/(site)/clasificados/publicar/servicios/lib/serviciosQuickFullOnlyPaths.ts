import { applyQuickFullOnlyBoundary } from "@/app/lib/quickBusiness/quickFullOnlyBoundary";

/**
 * SERVICIOS QUICK / FULL FIELD BOUNDARY — the wire-profile paths that only a FULL Servicios listing carries.
 *
 * Product lock: a Quick (SIMPLE) Servicios listing has ONE primary website and NO social links, NO extra
 * website URLs, NO Google Business / Google Reviews link, NO Yelp link, NO additional business/resource
 * links (video and coupons/offers are gated separately by media contract and offers entitlement).
 *
 * These are dotted paths into the persisted `ServiciosBusinessProfile` wire (`profile_json`). They are
 * deliberately per-key rather than `contact.socialLinks` as a whole: `socialLinks.whatsappUrl` is the
 * primary WhatsApp CONTACT number (a call-to-action Quick keeps), and the primary website
 * (`contact.websiteHref`) is never listed here.
 *
 * Consumed by `applyQuickFullOnlyBoundary` (app/lib/quickBusiness/quickFullOnlyBoundary.ts): the publish
 * route applies it for a PROVEN Quick product only, restoring the stored value when the row already has one
 * (a Full listing that temporarily resolves Quick keeps its data) and emptying it otherwise.
 */
export const SERVICIOS_QUICK_FULL_ONLY_WIRE_PATHS = [
  "contact.socialLinks.instagramUrl",
  "contact.socialLinks.facebookUrl",
  "contact.socialLinks.youtubeUrl",
  "contact.socialLinks.tiktokUrl",
  "contact.socialLinks.linkedinUrl",
  "contact.socialLinks.xUrl",
  "contact.socialLinks.snapchatUrl",
  "contact.socialLinks.googleBusinessUrl",
  // WhatsApp Business channel/profile link: rendered as a social row, so it is a social link (the primary
  // WhatsApp number, `socialLinks.whatsappUrl`, stays).
  "contact.socialLinks.whatsappProfileUrl",
  "contact.externalReviewLinks",
  "contact.extraLinks",
] as const;

type Json = Record<string, unknown>;

function isObj(v: unknown): v is Json {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function getAt(obj: unknown, parts: readonly string[]): unknown {
  let cur: unknown = obj;
  for (const p of parts) {
    if (!isObj(cur)) return undefined;
    cur = cur[p];
  }
  return cur;
}

function hasContent(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (isObj(v)) return Object.keys(v).length > 0;
  return true;
}

function isEmptyValue(v: unknown): boolean {
  return v === "" || (Array.isArray(v) && v.length === 0) || (isObj(v) && Object.keys(v).length === 0);
}

/**
 * Apply the Quick boundary to a Servicios wire profile.
 *
 * The shared `applyQuickFullOnlyBoundary` never invents structure, and a Quick application has no inputs for
 * these fields, so an incoming wire simply LACKS them. To honour "restore, don't delete" for a Full listing
 * that temporarily resolves Quick, the stored value is first seeded into the incoming wire as an empty
 * placeholder of the same shape, which the shared boundary then restores from `existing`. When nothing is
 * stored the placeholder is never created and any incoming (browser-supplied) value is emptied. Emptied keys
 * are removed so a Quick row carries no hollow `socialLinks: {}` / `extraLinks: []` shells.
 *
 * Callers gate this with `quickFullOnlyBoundaryApplies(decision)` (proven Quick only).
 */
export function applyServiciosQuickFullOnlyBoundary<T extends object>(input: {
  incoming: T;
  existing?: object | null;
}): { value: T; changedPaths: string[] } {
  const existing = (input.existing ?? null) as Json | null;
  const seeded = structuredClone(input.incoming) as unknown as Json;
  for (const path of SERVICIOS_QUICK_FULL_ONLY_WIRE_PATHS) {
    const parts = path.split(".");
    const stored = existing ? getAt(existing, parts) : undefined;
    if (!hasContent(stored) || getAt(seeded, parts) !== undefined) continue;
    let cur = seeded;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const next = cur[parts[i]!];
      if (isObj(next)) cur = next;
      else {
        const created: Json = {};
        cur[parts[i]!] = created;
        cur = created;
      }
    }
    const last = parts[parts.length - 1]!;
    cur[last] = typeof stored === "string" ? "" : Array.isArray(stored) ? [] : {};
  }
  const result = applyQuickFullOnlyBoundary({
    incoming: seeded,
    existing,
    paths: SERVICIOS_QUICK_FULL_ONLY_WIRE_PATHS,
  });
  const value = result.value as Json;
  for (const path of SERVICIOS_QUICK_FULL_ONLY_WIRE_PATHS) {
    const parts = path.split(".");
    const parent = getAt(value, parts.slice(0, -1));
    const last = parts[parts.length - 1]!;
    if (isObj(parent) && isEmptyValue(parent[last])) delete parent[last];
  }
  const contact = value.contact;
  if (isObj(contact) && isObj(contact.socialLinks) && Object.keys(contact.socialLinks).length === 0) {
    delete contact.socialLinks;
  }
  return { value: value as unknown as T, changedPaths: result.changedPaths };
}
