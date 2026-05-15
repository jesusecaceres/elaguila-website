/**
 * Leonix Gate 12C — category-agnostic URL/handle normalization for public CTAs.
 * Returns null when value is empty, unsafe, or cannot be normalized confidently.
 */

const DANGEROUS_SCHEME = /^(javascript|data|blob|file):/i;

function hasDangerousScheme(s: string): boolean {
  const t = s.trim();
  if (!t) return true;
  if (DANGEROUS_SCHEME.test(t)) return true;
  try {
    const u = new URL(t);
    return DANGEROUS_SCHEME.test(u.protocol);
  } catch {
    return false;
  }
}

function stripAt(raw: string): string {
  return raw.trim().replace(/^@+/, "").trim();
}

/** Accept only http(s) host URLs for open-in-new-tab CTAs. */
export function normalizeLeonixHttpsUrl(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  let candidate = s;
  if (/^\/\//.test(candidate)) candidate = `https:${candidate}`;
  else if (/^www\./i.test(candidate)) candidate = `https://${candidate}`;
  else if (!/^https?:\/\//i.test(candidate)) {
    if (/^[a-z0-9][a-z0-9-]*\.[a-z]{2,}(\/|$)/i.test(candidate)) candidate = `https://${candidate}`;
    else return null;
  }
  if (hasDangerousScheme(candidate)) return null;
  try {
    const u = new URL(candidate);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (u.protocol === "http:") {
      u.protocol = "https:";
    }
    return u.toString();
  } catch {
    return null;
  }
}

export function normalizeLeonixWebsiteUrl(raw: string | null | undefined): string | null {
  return normalizeLeonixHttpsUrl(raw);
}

export function normalizeLeonixInstagramUrl(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (hasDangerousScheme(s)) return null;
  if (/^https?:\/\//i.test(s)) {
    const u = normalizeLeonixHttpsUrl(s);
    if (!u) return null;
    try {
      const h = new URL(u).hostname.replace(/^www\./, "").toLowerCase();
      if (h === "instagram.com" || h.endsWith(".instagram.com")) return u;
    } catch {
      return null;
    }
    return null;
  }
  const handle = stripAt(s).replace(/[^\w.]/g, "");
  if (!handle || handle.length > 64) return null;
  return `https://www.instagram.com/${handle.replace(/^\.+|\.+$/g, "")}/`;
}

export function normalizeLeonixTiktokUrl(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (hasDangerousScheme(s)) return null;
  if (/^https?:\/\//i.test(s)) {
    const u = normalizeLeonixHttpsUrl(s);
    if (!u) return null;
    try {
      const h = new URL(u).hostname.replace(/^www\./, "").toLowerCase();
      if (h === "tiktok.com" || h.endsWith(".tiktok.com")) return u;
    } catch {
      return null;
    }
    return null;
  }
  let handle = stripAt(s);
  handle = handle.replace(/^@+/, "").replace(/[^\w._-]/g, "");
  if (!handle || handle.length > 64) return null;
  return `https://www.tiktok.com/@${handle}`;
}

export function normalizeLeonixFacebookUrl(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (hasDangerousScheme(s)) return null;
  if (/^https?:\/\//i.test(s)) {
    const u = normalizeLeonixHttpsUrl(s);
    if (!u) return null;
    try {
      const h = new URL(u).hostname.replace(/^www\./, "").toLowerCase();
      if (h === "facebook.com" || h === "fb.com" || h.endsWith(".facebook.com")) return u;
    } catch {
      return null;
    }
    return null;
  }
  const slug = stripAt(s).replace(/[^\w.-]/g, "");
  if (!slug || slug.length > 120) return null;
  return `https://www.facebook.com/${slug}`;
}

export function normalizeLeonixYoutubeUrl(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (hasDangerousScheme(s)) return null;
  if (/^https?:\/\//i.test(s)) {
    const u = normalizeLeonixHttpsUrl(s);
    if (!u) return null;
    try {
      const h = new URL(u).hostname.replace(/^www\./, "").toLowerCase();
      if (h === "youtube.com" || h === "youtu.be" || h === "m.youtube.com") return u;
    } catch {
      return null;
    }
    return null;
  }
  let h = stripAt(s);
  if (h.startsWith("channel/") || h.startsWith("c/") || h.startsWith("user/")) {
    return `https://www.youtube.com/${h}`;
  }
  if (!/^[\w.-]+$/.test(h) || h.length > 128) return null;
  if (h.startsWith("UC") && h.length >= 10) {
    return `https://www.youtube.com/channel/${h}`;
  }
  return `https://www.youtube.com/@${h}`;
}
