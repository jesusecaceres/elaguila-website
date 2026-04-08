export type ViajesResultsQuery = {
  destination?: string;
  departure?: string;
  tripType?: string;
  budget?: string;
  audience?: string;
  lang?: "es" | "en";
};

const DEFAULT_BASE = "/clasificados/viajes/resultados";

/**
 * Build results URL with stable query keys (`dest`, `from`, `t`, `budget`, `audience`, `lang`).
 */
export function buildViajesResultsUrl(query: ViajesResultsQuery, basePath: string = DEFAULT_BASE): string {
  const q = new URLSearchParams();
  if (query.lang) q.set("lang", query.lang);
  const dest = query.destination?.trim();
  if (dest) q.set("dest", dest);
  const from = query.departure?.trim();
  if (from) q.set("from", from);
  const t = query.tripType?.trim();
  if (t) q.set("t", t);
  const budget = query.budget?.trim();
  if (budget) q.set("budget", budget);
  const audience = query.audience?.trim();
  if (audience) q.set("audience", audience);
  const qs = q.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
