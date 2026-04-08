/**
 * Preserve return context when opening offer detail from Viajes home vs results.
 */

const VIAJES_PREFIX = "/clasificados/viajes";

export function isSafeViajesInternalPath(path: string): boolean {
  if (!path.startsWith(VIAJES_PREFIX)) return false;
  if (path.includes("://")) return false;
  if (path.includes("//")) return false;
  return true;
}

/** Append `back` query for offer detail routes (`URLSearchParams` handles encoding). */
export function withViajesOfferBackParam(offerHref: string, backPath: string): string {
  if (!offerHref.includes("/clasificados/viajes/oferta/")) return offerHref;
  const [path, existingQs] = offerHref.split("?");
  const p = new URLSearchParams(existingQs ?? "");
  p.set("back", backPath);
  const qs = p.toString();
  return qs ? `${path}?${qs}` : path;
}

export function parseViajesOfferBackParam(raw: string | string[] | undefined): string | undefined {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v || typeof v !== "string") return undefined;
  try {
    const decoded = decodeURIComponent(v);
    return isSafeViajesInternalPath(decoded) ? decoded : undefined;
  } catch {
    return isSafeViajesInternalPath(v) ? v : undefined;
  }
}

export function resolveViajesOfferBack(
  rawBack: string | string[] | undefined,
  /** When `back` query is missing or unsafe (e.g. direct entry). */
  fallbackHref: string = "/clasificados/viajes"
): { href: string; label: string } {
  const parsed = parseViajesOfferBackParam(rawBack);
  const href = parsed ?? fallbackHref;
  const label = href.includes("/resultados") ? "Volver a resultados" : "Volver a Viajes";
  return { href, label };
}
