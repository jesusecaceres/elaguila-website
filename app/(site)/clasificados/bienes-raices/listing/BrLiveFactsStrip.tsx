"use client";

import {
  parseLeonixListingContract,
  parseLeonixMachineFacetRead,
  type BrResultsPropertyKind,
} from "@/app/clasificados/lib/leonixRealEstateListingContract";

function kindLabel(kind: BrResultsPropertyKind | null, lang: "es" | "en"): string {
  if (!kind) return "";
  const es: Record<BrResultsPropertyKind, string> = {
    casa: "Casa",
    departamento: "Departamento",
    terreno: "Terreno / lote",
    comercial: "Comercial",
  };
  const en: Record<BrResultsPropertyKind, string> = {
    casa: "House",
    departamento: "Condo / apartment",
    terreno: "Land / lot",
    comercial: "Commercial",
  };
  return lang === "es" ? es[kind] : en[kind];
}

function opLabel(op: "sale" | "rent" | null, lang: "es" | "en"): string {
  if (op === "rent") return lang === "es" ? "Renta" : "For rent";
  if (op === "sale") return lang === "es" ? "Venta" : "For sale";
  return "";
}

/** Compact BR facts from persisted `detail_pairs` (machine + Leonix branch/operation). */
export function BrLiveFactsStrip({ detailPairs, lang }: { detailPairs: unknown; lang: "es" | "en" }) {
  const lx = parseLeonixListingContract(detailPairs);
  const m = parseLeonixMachineFacetRead(detailPairs);
  const hasMachine =
    m.bedroomsCount != null ||
    m.bathroomsCount != null ||
    m.postalCode ||
    m.pool != null ||
    m.petsAllowed != null ||
    m.furnished != null ||
    m.resultsPropertyKind;

  if (!lx.operation && !lx.branch && !hasMachine) return null;

  const chips: string[] = [];
  const op = opLabel(lx.operation, lang);
  if (op) chips.push(op);
  const rk = kindLabel(m.resultsPropertyKind, lang);
  if (rk) chips.push(rk);
  if (m.bedroomsCount != null && m.bedroomsCount >= 0) {
    chips.push(lang === "es" ? `${m.bedroomsCount} rec.` : `${m.bedroomsCount} bd`);
  }
  if (m.bathroomsCount != null && m.bathroomsCount > 0) {
    chips.push(lang === "es" ? `${m.bathroomsCount} baños` : `${m.bathroomsCount} bath`);
  }
  if (m.parkingSpots != null && m.parkingSpots > 0) {
    chips.push(lang === "es" ? `${m.parkingSpots} estac.` : `${m.parkingSpots} parking`);
  }
  if (m.postalCode) chips.push(`ZIP ${m.postalCode}`);
  if (m.pool === true) chips.push(lang === "es" ? "Alberca" : "Pool");
  if (m.pool === false) chips.push(lang === "es" ? "Sin alberca" : "No pool");
  if (m.petsAllowed === true) chips.push(lang === "es" ? "Mascotas permitidas" : "Pets allowed");
  if (m.petsAllowed === false) chips.push(lang === "es" ? "Sin mascotas" : "No pets");
  if (m.furnished === true) chips.push(lang === "es" ? "Amueblado" : "Furnished");
  if (m.furnished === false) chips.push(lang === "es" ? "Sin amueblar" : "Unfurnished");

  if (chips.length === 0 && !lx.branch) return null;

  return (
    <section
      className="mb-6 rounded-2xl border border-emerald-900/15 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-950"
      aria-label={lang === "es" ? "Resumen del inmueble" : "Property summary"}
    >
      <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-900/60">
        {lang === "es" ? "Bienes raíces · datos publicados" : "Real estate · published facts"}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {chips.map((c) => (
          <span
            key={c}
            className="inline-flex rounded-full border border-emerald-800/20 bg-white/90 px-2.5 py-1 text-xs font-semibold text-emerald-950"
          >
            {c}
          </span>
        ))}
      </div>
      {lx.branch ? (
        <p className="mt-2 font-mono text-[10px] text-emerald-900/55">
          {lang === "es" ? "Rama Leonix: " : "Leonix branch: "}
          {lx.branch}
        </p>
      ) : null}
    </section>
  );
}
