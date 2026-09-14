/**
 * Leonix bilingual discovery foundation — ⚠️38A (2026-09-14).
 *
 * Languages-served matcher: canonical ids of the languages a business can serve customers in versus
 * the ids a shopper asked for. Every wanted id must be served (the facets are AND-combined, as today).
 * There is deliberately no notion of source / authoring language here.
 */
export function matchesLanguagesServed(
  servedIds: readonly string[],
  wantedIds: readonly string[],
): boolean {
  if (wantedIds.length === 0) return true;
  const served = new Set(servedIds.map((id) => id.trim()).filter(Boolean));
  return wantedIds.every((id) => served.has(id.trim()));
}
