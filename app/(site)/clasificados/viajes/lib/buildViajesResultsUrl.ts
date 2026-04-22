import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import {
  buildViajesResultsUrlCompat,
  type ViajesBrowseState,
  VIAJES_PUBLIC_RESULTS_PATH,
} from "./viajesBrowseContract";

const DEFAULT_BASE = VIAJES_PUBLIC_RESULTS_PATH;

/** @deprecated Use `ViajesBrowseState` from `viajesBrowseContract` */
export type ViajesResultsQuery = {
  destination?: string;
  destinationQuery?: string;
  departure?: string;
  tripType?: string;
  budget?: string;
  audience?: string;
  lang?: Lang;
  sort?: ViajesBrowseState["sort"];
  originByGeo?: boolean;
};

/**
 * Build results URL with stable query keys (`dest`, `q`, `from`, `t`, `budget`, `audience`, `lang`, …).
 * Delegates to the shared Viajes browse contract.
 */
export function buildViajesResultsUrl(query: ViajesResultsQuery, basePath: string = DEFAULT_BASE): string {
  return buildViajesResultsUrlCompat(
    {
      destination: query.destination,
      destinationQuery: query.destinationQuery,
      departure: query.departure,
      tripType: query.tripType,
      budget: query.budget,
      audience: query.audience,
      lang: query.lang,
      sort: query.sort,
      originByGeo: query.originByGeo,
    },
    basePath
  );
}

export {
  buildViajesBrowseUrl,
  defaultViajesBrowseState,
  legacyQueryToBrowseState,
  viajesMergeBrowseState,
  viajesResultsBrowseUrl,
  VIAJES_PUBLIC_RESULTS_PATH,
} from "./viajesBrowseContract";
export type { ViajesBrowseState, ViajesResultsLinkPatch } from "./viajesBrowseContract";
