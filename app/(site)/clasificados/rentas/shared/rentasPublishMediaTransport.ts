/**
 * Transport rules for Rentas publish: same class of checks as Restaurantes
 * (`isRestaurantePublishableRemoteImageRef`) — no data:/blob: in payloads that leave the browser.
 */

export function isRentasPublishableRemoteImageRef(s: string | undefined | null): boolean {
  if (typeof s !== "string") return false;
  const t = s.trim();
  if (!t) return false;
  if (/^data:image\//i.test(t) || t.startsWith("blob:")) return false;
  if (/^https?:\/\//i.test(t)) return t.length <= 2048;
  return false;
}

/** True if this ref must be uploaded to Blob storage before Leonix publish. */
export function rentasDraftImageRequiresBlobUpload(s: string | undefined | null): boolean {
  const t = typeof s === "string" ? s.trim() : "";
  if (!t) return false;
  if (isRentasPublishableRemoteImageRef(t)) return false;
  if (/^data:image\//i.test(t) || t.startsWith("blob:")) return true;
  return false;
}
