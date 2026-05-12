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

/** Normalize social profile URL: require scheme or prepend https:// */
export function normalizeSocialUrlForOpen(raw: string): string | null {
  const t = String(raw ?? "").trim();
  if (!t) return null;
  const candidate = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(candidate);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

export function isValidSocialUrlWhenNonEmpty(raw: string): boolean {
  const t = String(raw ?? "").trim();
  if (!t) return true;
  return normalizeSocialUrlForOpen(t) !== null;
}
