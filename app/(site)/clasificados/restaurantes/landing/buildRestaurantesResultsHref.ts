/**
 * Builds `/clasificados/restaurantes/resultados` URLs for the landing blueprint.
 * Params mirror `RestauranteResultsClient` (`q`, `city`, `zip`, `cuisine`, `svc`, `family`, `price`, …).
 * Reserved keys (`open`, `near`, `top`) are included for future filtering; the results page may ignore them until wired.
 */
const BASE = "/clasificados/restaurantes/resultados";

export function buildRestaurantesResultsHref(
  lang: "es" | "en",
  params: Record<string, string | undefined | null>,
): string {
  const sp = new URLSearchParams();
  sp.set("lang", lang);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, v);
  }
  return `${BASE}?${sp.toString()}`;
}

/** Single "Ciudad o Código Postal" field → `city` or `zip` for results. */
export function splitLocationInput(raw: string): { city?: string; zip?: string } {
  const t = raw.trim();
  if (/^\d{5}$/.test(t)) return { zip: t };
  if (t) return { city: t };
  return {};
}
