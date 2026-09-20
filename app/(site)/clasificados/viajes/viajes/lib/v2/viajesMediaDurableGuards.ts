/** Viajes-local durable URL / media guards — never stage blob/data/object/IDB refs. */

const DURABLE_HOST_HINT = /^(https:\/\/)/i;

export function isViajesDurableHttpsUrl(raw: string | null | undefined): boolean {
  const t = String(raw ?? "").trim();
  if (!t) return false;
  if (!DURABLE_HOST_HINT.test(t)) return false;
  try {
    const u = new URL(t);
    if (u.protocol !== "https:") return false;
    if (!u.hostname) return false;
    return true;
  } catch {
    return false;
  }
}

export function isViajesNonDurableMediaRef(raw: string | null | undefined): boolean {
  const t = String(raw ?? "").trim();
  if (!t) return false;
  if (t.startsWith("blob:")) return true;
  if (t.startsWith("data:")) return true;
  if (t.startsWith("filesystem:")) return true;
  if (/^idb:|^indexeddb:/i.test(t)) return true;
  if (t.startsWith("http://")) return true; // require https for public/staged
  return false;
}

export function stripViajesDraftOnlyMediaFields<T extends Record<string, unknown>>(asset: T): T {
  const next = { ...asset };
  delete next.localPreviewObjectUrl;
  delete next.localIdbKey;
  delete next.localFileName;
  delete next.uploadErrorCode;
  delete next.uploadProgressPct;
  return next;
}
