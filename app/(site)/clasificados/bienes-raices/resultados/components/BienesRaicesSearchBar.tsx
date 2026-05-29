"use client";

type Lang = "es" | "en";

type Props = {
  query: string;
  onQuery: (v: string) => void;
  propertyType: string;
  onPropertyType: (v: string) => void;
  priceBand: string;
  onPriceBand: (v: string) => void;
  beds: string;
  onBeds: (v: string) => void;
  /** Landing: navigate to results with current field values. */
  onSearch?: () => void;
  /** Rentas hub uses monthly bands + rentas-first placeholder; BR keeps venta-oriented bands. */
  variant?: "bienesRaices" | "rentas";
  lang?: Lang;
};

/** Exported for Rentas landing toolbar (slider steps align with results `precio`). */
export function getRentasPriceOptions(lang: Lang = "es"): { value: string; label: string }[] {
  if (lang === "en") {
    return [
      { value: "", label: "Any" },
      { value: "r0-15k", label: "Up to $15,000 / mo" },
      { value: "r15-25k", label: "$15,000 – $25,000 / mo" },
      { value: "r25-40k", label: "$25,000 – $40,000 / mo" },
      { value: "r40-60k", label: "$40,000 – $60,000 / mo" },
      { value: "r60k+", label: "Over $60,000 / mo" },
    ];
  }
  return [
    { value: "", label: "Cualquiera" },
    { value: "r0-15k", label: "Hasta $15,000 / mes" },
    { value: "r15-25k", label: "$15,000 – $25,000 / mes" },
    { value: "r25-40k", label: "$25,000 – $40,000 / mes" },
    { value: "r40-60k", label: "$40,000 – $60,000 / mes" },
    { value: "r60k+", label: "Más de $60,000 / mes" },
  ];
}

/** @deprecated Prefer {@link getRentasPriceOptions} with `lang` for bilingual labels. */
export const RENTAS_PRICE_OPTIONS = getRentasPriceOptions("es");

const COPY = {
  es: {
    srSearch: "Buscar",
    searchLabel: "Búsqueda",
    placeholderBr: "Buscar en Bienes Raíces…",
    placeholderRentas: "Buscar en rentas…",
    typeLabel: "Tipo",
    typePlaceholder: "Tipo de propiedad",
    casa: "Casa",
    depto: "Departamento",
    terreno: "Terreno",
    comercial: "Comercial",
    priceLabel: "Precio",
    any: "Cualquiera",
    upTo250: "Hasta $250,000",
    r250to500: "$250,000 – $500,000",
    r500to1m: "$500,000 – $1,000,000",
    over1m: "Más de $1,000,000",
    bedsLabel: "Recámaras",
    bedsAny: "Cualquiera",
    bedsAnyRentas: "Cualquier número",
    searchBtn: "Buscar",
  },
  en: {
    srSearch: "Search",
    searchLabel: "Search",
    placeholderBr: "Search real estate…",
    placeholderRentas: "Search rentals…",
    typeLabel: "Type",
    typePlaceholder: "Property type",
    casa: "House",
    depto: "Apartment",
    terreno: "Land",
    comercial: "Commercial",
    priceLabel: "Price",
    any: "Any",
    upTo250: "Up to $250,000",
    r250to500: "$250,000 – $500,000",
    r500to1m: "$500,000 – $1,000,000",
    over1m: "Over $1,000,000",
    bedsLabel: "Bedrooms",
    bedsAny: "Any",
    bedsAnyRentas: "Any number",
    searchBtn: "Search",
  },
} as const;

export function BienesRaicesSearchBar({
  query,
  onQuery,
  propertyType,
  onPropertyType,
  priceBand,
  onPriceBand,
  beds,
  onBeds,
  onSearch,
  variant = "bienesRaices",
  lang = "es",
}: Props) {
  const isRentas = variant === "rentas";
  const t = COPY[lang];
  const placeholder = isRentas ? t.placeholderRentas : t.placeholderBr;

  return (
    <div className="rounded-2xl border border-[#E8DFD0]/95 bg-[#FDFBF7] p-3 shadow-[0_12px_40px_-22px_rgba(42,36,22,0.2)] sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="min-w-0 flex-1">
          <span className="sr-only">{t.srSearch}</span>
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/75">{t.searchLabel}</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#B8954A]" aria-hidden>
              ⌕
            </span>
            <input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-xl border border-[#E8DFD0] bg-white py-2.5 pl-9 pr-3 text-sm text-[#1E1810] outline-none ring-0 placeholder:text-[#5C5346]/45 focus:border-[#C9B46A]/65"
            />
          </div>
        </label>
        <div className="grid flex-1 gap-3 sm:grid-cols-3 lg:max-w-xl lg:shrink-0">
          <label>
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/75">
              {t.typeLabel}
            </span>
            <select
              value={propertyType}
              onChange={(e) => onPropertyType(e.target.value)}
              className="w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5 text-sm text-[#1E1810] outline-none focus:border-[#C9B46A]/65"
            >
              <option value="">{t.typePlaceholder}</option>
              <option value="casa">{t.casa}</option>
              <option value="depto">{t.depto}</option>
              <option value="terreno">{t.terreno}</option>
              <option value="comercial">{t.comercial}</option>
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/75">
              {t.priceLabel}
            </span>
            <select
              value={priceBand}
              onChange={(e) => onPriceBand(e.target.value)}
              className="w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5 text-sm text-[#1E1810] outline-none focus:border-[#C9B46A]/65"
            >
              {isRentas
                ? getRentasPriceOptions(lang).map((o) => (
                    <option key={o.value || "any"} value={o.value}>
                      {o.label}
                    </option>
                  ))
                : (
                    <>
                      <option value="">{t.any}</option>
                      <option value="0-250k">{t.upTo250}</option>
                      <option value="250-500k">{t.r250to500}</option>
                      <option value="500k-1m">{t.r500to1m}</option>
                      <option value="1m+">{t.over1m}</option>
                    </>
                  )}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/75">
              {t.bedsLabel}
            </span>
            <select
              value={beds}
              onChange={(e) => onBeds(e.target.value)}
              className="w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5 text-sm text-[#1E1810] outline-none focus:border-[#C9B46A]/65"
            >
              <option value="">{isRentas ? t.bedsAnyRentas : t.bedsAny}</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={() => onSearch?.()}
          className={
            "rounded-xl px-6 py-2.5 text-sm font-bold shadow-md lg:shrink-0 " +
            (isRentas
              ? "bg-[#4A7C59] text-[#FAF7F2] hover:bg-[#3d6a4b]"
              : "bg-[#2A2620] text-[#FAF7F2] hover:bg-[#1E1810]")
          }
        >
          {t.searchBtn}
        </button>
      </div>
    </div>
  );
}
