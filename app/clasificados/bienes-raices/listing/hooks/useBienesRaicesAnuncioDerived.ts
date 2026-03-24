/**
 * Stub implementation — restores bundle resolution when the full BR listing module
 * is not present. Returns safe defaults so `/clasificados/anuncio/[id]` can compile.
 */
export type BienesRaicesAnuncioNegocioDisplayStub = {
  plusMoreListings?: boolean;
  officePhone?: string | null;
  website?: string | null;
  name?: string;
};

export function useBienesRaicesAnuncioDerived(_args: {
  listing: unknown;
  lang: "es" | "en";
  isLiveDbListing: boolean;
  sampleListings: unknown[];
}) {
  return {
    brNegocioDisplay: null as BienesRaicesAnuncioNegocioDisplayStub | null,
    bienesRaicesSameCompanyListings: [] as unknown[],
    isBienesRaicesNegocio: false,
    isBienesRaicesPrivado: false,
  };
}
