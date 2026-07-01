/** Public Autos marketplace split: private sellers vs dealer/business inventory. */

export type AutosPublicMarket = "private" | "dealer";

export const AUTOS_PRIVATE_LANDING_PATH = "/clasificados/autos";
export const AUTOS_PRIVATE_RESULTS_PATH = "/clasificados/autos/results";
export const AUTOS_DEALERS_LANDING_PATH = "/clasificados/dealers-de-autos";
export const AUTOS_DEALERS_RESULTS_PATH = "/clasificados/dealers-de-autos/results";

export function autosMarketLandingPath(market: AutosPublicMarket): string {
  return market === "dealer" ? AUTOS_DEALERS_LANDING_PATH : AUTOS_PRIVATE_LANDING_PATH;
}

export function autosMarketResultsPath(market: AutosPublicMarket): string {
  return market === "dealer" ? AUTOS_DEALERS_RESULTS_PATH : AUTOS_PRIVATE_RESULTS_PATH;
}

export function autosMarketDefaultSellerType(market: AutosPublicMarket): "private" | "dealer" {
  return market === "dealer" ? "dealer" : "private";
}

export function autosMarketPublishPath(market: AutosPublicMarket): string {
  return market === "dealer" ? "/publicar/autos/negocios" : "/publicar/autos/privado";
}

export function autosMarketPeerLandingPath(market: AutosPublicMarket): string {
  return market === "dealer" ? AUTOS_PRIVATE_LANDING_PATH : AUTOS_DEALERS_LANDING_PATH;
}

export function autosMarketPeerResultsPath(market: AutosPublicMarket): string {
  return market === "dealer" ? AUTOS_PRIVATE_RESULTS_PATH : AUTOS_DEALERS_RESULTS_PATH;
}

export function autosMarketPeerDefaultSellerType(market: AutosPublicMarket): "private" | "dealer" {
  return market === "dealer" ? "private" : "dealer";
}
