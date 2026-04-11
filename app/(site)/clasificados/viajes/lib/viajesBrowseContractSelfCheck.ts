/**
 * Development-only sanity checks for browse URL round-trips.
 * Does not run in production bundles (tree-shaken when unused).
 */

import { defaultViajesBrowseState, parseViajesBrowseFromSearchParams, serializeViajesBrowseToSearchParams } from "./viajesBrowseContract";

export function runViajesBrowseContractSanityCheck(): void {
  if (process.env.NODE_ENV !== "development") return;

  const base = defaultViajesBrowseState("es");
  const variants = [
    { ...base, dest: "cancun", from: "san-jose", t: "tours", sort: "newest" as const },
    { ...base, q: "playa", budget: "moderado", audience: "familias" },
    { ...base, lang: "en" as const, page: 2, originByGeo: "1" as const },
  ];

  for (const v of variants) {
    const qs = serializeViajesBrowseToSearchParams(v).toString();
    const round = parseViajesBrowseFromSearchParams(new URLSearchParams(qs), "es");
    if (round.dest !== v.dest || round.q !== v.q || round.from !== v.from || round.t !== v.t || round.sort !== v.sort) {
      console.error("[Viajes] Browse round-trip mismatch", { v, round, qs });
    }
  }
}
