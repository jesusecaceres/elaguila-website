import type { CommunitySocialLinks } from "../types/communityQuickDraft";

export type CommunitySocialField = keyof CommunitySocialLinks;

function stripWww(host: string): string {
  let h = host.toLowerCase();
  while (h.startsWith("www.")) h = h.slice(4);
  return h;
}

/** True if hostname is `root` or a subdomain of `root` (e.g. m.facebook.com → facebook.com). */
function isHostUnderRoot(hostname: string, root: string): boolean {
  const h = stripWww(hostname);
  const r = root.toLowerCase();
  return h === r || h.endsWith("." + r);
}

function hostAllowedForField(host: string, field: CommunitySocialField): boolean {
  const h = host.toLowerCase();
  switch (field) {
    case "facebook":
      return isHostUnderRoot(h, "facebook.com") || isHostUnderRoot(h, "fb.com");
    case "instagram":
      return isHostUnderRoot(h, "instagram.com");
    case "tiktok":
      return isHostUnderRoot(h, "tiktok.com");
    case "youtube":
      return isHostUnderRoot(h, "youtube.com") || stripWww(h) === "youtu.be";
    case "xTwitter":
      return isHostUnderRoot(h, "x.com") || isHostUnderRoot(h, "twitter.com");
    case "linkedin":
      return isHostUnderRoot(h, "linkedin.com");
    case "snapchat":
      return isHostUnderRoot(h, "snapchat.com");
    case "pinterest":
      return isHostUnderRoot(h, "pinterest.com") || isHostUnderRoot(h, "pin.it");
    default:
      return false;
  }
}

/** Normalize user-entered website for safe https links (e.g. www.example.com → https://www.example.com). */
export function normalizeWebsiteForOpen(raw: string): string | null {
  const t = String(raw ?? "").trim();
  if (!t) return null;
  const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t.replace(/^\/\//, "")}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

/** True when non-empty string is a valid http(s) URL. */
export function isValidHttpUrlWhenNonEmpty(raw: string): boolean {
  const t = String(raw ?? "").trim();
  if (!t) return true;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Normalize a social profile URL for opening in a new tab.
 * - Prepends https:// when missing.
 * - Preserves valid absolute URLs.
 * - Rejects hosts that do not match the expected network for `field`.
 */
export function normalizeSocialUrlForOpen(raw: string, field: CommunitySocialField): string | null {
  const t = String(raw ?? "").trim();
  if (!t) return null;
  const candidate = /^https?:\/\//i.test(t) ? t : `https://${t.replace(/^\/+/, "")}`;
  try {
    const u = new URL(candidate);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!hostAllowedForField(u.hostname, field)) return null;
    return u.href;
  } catch {
    return null;
  }
}

export function isValidSocialUrlWhenNonEmpty(raw: string, field: CommunitySocialField): boolean {
  const t = String(raw ?? "").trim();
  if (!t) return true;
  return normalizeSocialUrlForOpen(t, field) !== null;
}
