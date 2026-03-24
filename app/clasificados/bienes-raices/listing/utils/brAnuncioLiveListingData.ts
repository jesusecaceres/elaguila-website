/** Minimal types + stubs so `/clasificados/anuncio/[id]` compiles without the full BR live data pipeline. */

export type BienesRaicesLiveListingRow = Record<string, unknown>;

export type BienesRaicesNegocioLiveListingData = {
  businessRail?: unknown;
};

export function buildBienesRaicesPrivadoLiveListingData(_args: {
  listing: BienesRaicesLiveListingRow;
  lang: "es" | "en";
  postedAgoLabel: string;
  isPro: boolean;
  proVideoInfos: unknown[];
}): Record<string, unknown> | null {
  return null;
}

export function buildBienesRaicesNegocioLiveListingData(_args: {
  listing: BienesRaicesLiveListingRow;
  lang: "es" | "en";
  postedAgoLabel: string;
  isPro: boolean;
  proVideoInfos: unknown[];
}): BienesRaicesNegocioLiveListingData | null {
  return null;
}
