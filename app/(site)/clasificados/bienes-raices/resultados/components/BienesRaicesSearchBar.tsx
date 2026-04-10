"use client";

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
};

/** Exported for Rentas landing toolbar (slider steps align with results `precio`). */
export const RENTAS_PRICE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Cualquiera" },
  { value: "r0-15k", label: "Hasta $15,000 / mes" },
  { value: "r15-25k", label: "$15,000 – $25,000 / mes" },
  { value: "r25-40k", label: "$25,000 – $40,000 / mes" },
  { value: "r40-60k", label: "$40,000 – $60,000 / mes" },
  { value: "r60k+", label: "Más de $60,000 / mes" },
];

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
}: Props) {
  const isRentas = variant === "rentas";
  const placeholder = isRentas ? "Buscar en rentas…" : "Buscar en Bienes Raíces…";

  return (
    <div className="rounded-2xl border border-[#E8DFD0]/95 bg-[#FDFBF7] p-3 shadow-[0_12px_40px_-22px_rgba(42,36,22,0.2)] sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Buscar</span>
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/75">Búsqueda</span>
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
              Tipo
            </span>
            <select
              value={propertyType}
              onChange={(e) => onPropertyType(e.target.value)}
              className="w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5 text-sm text-[#1E1810] outline-none focus:border-[#C9B46A]/65"
            >
              <option value="">Tipo de propiedad</option>
              <option value="casa">Casa</option>
              <option value="depto">Departamento</option>
              <option value="terreno">Terreno</option>
              <option value="comercial">Comercial</option>
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/75">
              Precio
            </span>
            <select
              value={priceBand}
              onChange={(e) => onPriceBand(e.target.value)}
              className="w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5 text-sm text-[#1E1810] outline-none focus:border-[#C9B46A]/65"
            >
              {isRentas
                ? RENTAS_PRICE_OPTIONS.map((o) => (
                    <option key={o.value || "any"} value={o.value}>
                      {o.label}
                    </option>
                  ))
                : (
                    <>
                      <option value="">Cualquiera</option>
                      <option value="0-250k">Hasta $250,000</option>
                      <option value="250-500k">$250,000 – $500,000</option>
                      <option value="500k-1m">$500,000 – $1,000,000</option>
                      <option value="1m+">Más de $1,000,000</option>
                    </>
                  )}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/75">
              Recámaras
            </span>
            <select
              value={beds}
              onChange={(e) => onBeds(e.target.value)}
              className="w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5 text-sm text-[#1E1810] outline-none focus:border-[#C9B46A]/65"
            >
              <option value="">{isRentas ? "Cualquier número" : "Cualquiera"}</option>
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
          Buscar
        </button>
      </div>
    </div>
  );
}
