import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import type { RentasBrowseParamsParsed } from "@/app/clasificados/rentas/shared/rentasBrowseContract";
import { RENTAS_DRAWER_SPACE_TYPES } from "@/app/clasificados/rentas/landing/rentasLandingGateway";
import {
  RENTAS_ACTIVE_FILTER_CHIP,
  RENTAS_ACTIVE_FILTERS_PANEL,
} from "@/app/clasificados/rentas/shared/rentasLeonixPublicUi";

type Props = {
  parsed: RentasBrowseParamsParsed;
  copy: RentasLandingCopy;
  priceBandLabel: (value: string) => string | null;
  lang?: "es" | "en";
};

export function RentasResultsActiveFilters({ parsed, copy, priceBandLabel, lang = "es" }: Props) {
  const qe = copy.quickExplore;
  const items: string[] = [];

  if (parsed.q.trim()) items.push(`"${parsed.q.trim()}"`);
  if (parsed.city) items.push(`${copy.results.cityLabel}: ${parsed.city}`);
  if (parsed.zip) items.push(`${copy.results.zipLabel}: ${parsed.zip}`);
  if (parsed.state) items.push(`${copy.results.stateLabel}: ${parsed.state}`);
  if (parsed.country) items.push(`${copy.results.countryLabel}: ${parsed.country}`);

  if (parsed.subtype) {
    const st = RENTAS_DRAWER_SPACE_TYPES.find((s) => s.value === parsed.subtype);
    items.push(st ? (lang === "es" ? st.labelEs : st.labelEn) : parsed.subtype);
  }

  if (parsed.branch === "privado") items.push(qe.chipPrivado);
  if (parsed.branch === "negocio") items.push(qe.chipNegocio);

  if (parsed.roomBath === "privado") items.push(lang === "es" ? "Baño privado" : "Private bath");
  if (parsed.roomBath === "compartido") items.push(lang === "es" ? "Baño compartido" : "Shared bath");
  if (parsed.roomKitchen === "privada") items.push(lang === "es" ? "Cocina privada" : "Private kitchen");
  if (parsed.roomKitchen === "compartida") items.push(lang === "es" ? "Cocina compartida" : "Shared kitchen");

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
  if (parsed.estado) items.push(`Estado: ${parsed.estado}`);
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
  if (parsed.kind) items.push(`${copy.results.kindLabel}: ${parsed.kind}`);

  if (!items.length) return null;

  return (
    <div className={RENTAS_ACTIVE_FILTERS_PANEL} aria-label={copy.results.activeFiltersLabel}>
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[#556B3E]">
        {copy.results.activeFiltersLabel}
      </span>
      <ul className="flex min-w-0 flex-wrap gap-2">
        {items.map((t, i) => (
          <li key={`${i}-${t}`} className={RENTAS_ACTIVE_FILTER_CHIP}>
            <span className="truncate">{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
