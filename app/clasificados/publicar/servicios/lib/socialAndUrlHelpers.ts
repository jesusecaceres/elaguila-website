/** Light validation for advertiser-facing URLs — Step 3 maps to safe hrefs */
export function normalizeHttpUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  if (/^\/[^/]/.test(t)) return t;
  return `https://${t.replace(/^\/+/, "")}`;
}

export function isProbablyValidWebUrl(raw: string): boolean {
  const t = raw.trim();
  if (!t) return true;
  try {
    const n = normalizeHttpUrl(t);
    if (n.startsWith("/")) return true;
    const u = new URL(n);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function newGalleryId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `gal_${crypto.randomUUID()}`;
  }
  return `gal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function newTestimonialId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `tst_${crypto.randomUUID()}`;
  }
  return `tst_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
