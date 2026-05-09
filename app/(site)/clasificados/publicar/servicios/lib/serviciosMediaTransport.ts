import { SV_IDB_PREFIX } from "./clasificadosServiciosDraftMedia";

/** Safe for `POST .../servicios/publish` (HTTPS only, length-capped). */
export function isServiciosPublishableRemoteMediaUrl(s: string | undefined | null): boolean {
  if (typeof s !== "string") return false;
  const t = s.trim();
  if (!t) return false;
  if (t.startsWith(SV_IDB_PREFIX)) return false;
  if (/^data:/i.test(t) || t.startsWith("blob:")) return false;
  if (/^https?:\/\//i.test(t)) return t.length <= 2048;
  return false;
}

export function isServiciosLocalOrTransportBlockedRef(s: string | undefined | null): boolean {
  if (typeof s !== "string") return false;
  const t = s.trim();
  if (!t) return false;
  if (t.startsWith(SV_IDB_PREFIX)) return true;
  if (/^data:image\//i.test(t) || /^data:video\//i.test(t) || /^data:application\/pdf/i.test(t)) return true;
  if (t.startsWith("blob:")) return true;
  return false;
}

/**
 * Coerce unknown media-shaped values to a string URL (Restaurants-style).
 */
export function coerceServiciosMediaRefToString(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const k of ["url", "src", "image", "publicUrl", "signedUrl", "href"] as const) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }
  return "";
}
