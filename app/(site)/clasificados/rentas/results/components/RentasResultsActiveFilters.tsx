import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import type { RentasBrowseParamsParsed } from "@/app/clasificados/rentas/shared/rentasBrowseContract";

type Props = {
  parsed: RentasBrowseParamsParsed;
  copy: RentasLandingCopy;
  priceBandLabel: (value: string) => string | null;
};

/**
 * Read-only summary of URL-backed filters — makes the active browse state obvious after landing handoff.
 */
export function RentasResultsActiveFilters({ parsed, copy, priceBandLabel }: Props) {
  const qe = copy.quickExplore;
  const items: string[] = [];

  if (parsed.q.trim()) items.push(`“${parsed.q.trim()}”`);
  if (parsed.city) items.push(`${copy.results.cityLabel}: ${parsed.city}`);
  if (parsed.zip) items.push(`${copy.results.zipLabel}: ${parsed.zip}`);
  if (parsed.state) items.push(parsed.state);

  if (parsed.propiedad === "residencial") items.push(qe.chipResidencial);
  else if (parsed.propiedad === "comercial") items.push(qe.chipComercial);
  else if (parsed.propiedad === "terreno_lote") items.push(qe.chipTerreno);

  if (parsed.branch === "privado") items.push(qe.chipPrivado);
  if (parsed.branch === "negocio") items.push(qe.chipNegocio);

  if (parsed.precio) {
    const pl = priceBandLabel(parsed.precio);
    if (pl) items.push(pl);
  }
  if (parsed.recs) items.push(`${copy.search.recs}: ${parsed.recs}+`);

  if (parsed.rentMin != null) items.push(`${copy.results.rentMinLabel}: ${parsed.rentMin.toLocaleString()}`);
  if (parsed.rentMax != null) items.push(`${copy.results.rentMaxLabel}: ${parsed.rentMax.toLocaleString()}`);

  if (parsed.depositMin != null) items.push(`${copy.results.depositMinLabel}: ${parsed.depositMin.toLocaleString()}`);
  if (parsed.depositMax != null) items.push(`${copy.results.depositMaxLabel}: ${parsed.depositMax.toLocaleString()}`);
  if (parsed.lease) items.push(`${copy.results.leaseLabel}: ${parsed.lease}`);
  if (parsed.parkingMin != null) items.push(`${copy.results.parkingMinLabel}: ${parsed.parkingMin}+`);
  if (parsed.sqftMin != null) items.push(`${copy.results.sqftMinLabel}: ${parsed.sqftMin}+`);
  if (parsed.sqftMax != null) items.push(`${copy.results.sqftMaxLabel}: ≤${parsed.sqftMax}`);

  if (parsed.amueblado) items.push(copy.results.furnishedToggle);
  if (parsed.mascotas) items.push(copy.results.petsToggle);

  if (parsed.bathsMin != null) items.push(`${copy.results.bathsMinLabel}: ${parsed.bathsMin}+`);
  if (parsed.halfBathsMin != null) items.push(`${copy.results.halfBathsMinLabel}: ${parsed.halfBathsMin}+`);

  if (parsed.sort && parsed.sort !== "reciente") {
    const s =
      parsed.sort === "precio_asc"
        ? copy.results.sortPriceAsc
        : parsed.sort === "precio_desc"
          ? copy.results.sortPriceDesc
          : parsed.sort;
    items.push(`${copy.results.sortLabel}: ${s}`);
  }

  if (parsed.highlightsAll.length) {
    items.push(`${copy.results.highlightsChipLabel}: ${parsed.highlightsAll.join(", ")}`);
  }
  if (parsed.wantsPool) items.push(copy.results.poolToggle);
  if (parsed.subtype) items.push(`${copy.results.subtypeLabel}: ${parsed.subtype}`);
  if (parsed.kind) items.push(`${copy.results.kindLabel}: ${parsed.kind}`);

  if (!items.length) return null;

  return (
    <div
      className="flex flex-col gap-2 rounded-[1.15rem] border border-[#5B7C99]/16 bg-[#F5F8FB]/55 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2 sm:px-5"
      aria-label={copy.results.activeFiltersLabel}
    >
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">
        {copy.results.activeFiltersLabel}
      </span>
      <ul className="flex min-w-0 flex-wrap gap-2">
        {items.map((t, i) => (
          <li
            key={`${i}-${t}`}
            className="inline-flex max-w-full items-center rounded-full border border-[#C9D4E0]/75 bg-white/95 px-3 py-1 text-xs font-semibold text-[#2C3E4D] shadow-sm"
          >
            <span className="truncate">{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
