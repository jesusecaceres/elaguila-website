import { EN_VENTA_RESULTS_PATH } from "../../shared/constants/enVentaResultsRoutes";
import { EV_LISTING_PARAM } from "../contracts/enVentaResultsUrlParams";

/**
 * Build listing detail URL from the En Venta results page so "back" can restore filters (`evReturn`).
 */
export function buildEnVentaListingDetailHrefFromResults(
  listingId: string,
  lang: "es" | "en",
  resultsParams: URLSearchParams | string
): string {
  const merged =
    typeof resultsParams === "string" ? new URLSearchParams(resultsParams) : new URLSearchParams(resultsParams.toString());
  if (!merged.get("lang")) merged.set("lang", lang);
  const returnPath = `${EN_VENTA_RESULTS_PATH}?${merged.toString()}`;
  const out = new URLSearchParams();
  out.set("lang", lang);
  out.set(EV_LISTING_PARAM.evReturn, returnPath);
  return `/clasificados/anuncio/${listingId}?${out.toString()}`;
}

/** Resolve `evReturn` from listing detail query; safe fallback strips open redirects. */
export function parseEnVentaResultsReturnUrl(raw: string | null | undefined, lang: "es" | "en"): string {
  const fallback = `${EN_VENTA_RESULTS_PATH}?lang=${lang}`;
  if (raw == null || raw === "") return fallback;
  let path: string;
  try {
    path = decodeURIComponent(raw);
  } catch {
    return fallback;
  }
  const trimmed = path.trim();
  if (!trimmed.startsWith(EN_VENTA_RESULTS_PATH)) return fallback;
  if (trimmed.includes("://")) return fallback;
  if (trimmed.length > 4000) return fallback;
  return trimmed;
}
