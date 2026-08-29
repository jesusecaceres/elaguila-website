"use client";

import {
  LEONIX_DP_BR_LISTING_STATUS,
  parseLeonixListingContract,
  parseLeonixMachineFacetRead,
  readLeonixDetailPairValue,
  type BrResultsPropertyKind,
  type LeonixClasificadosBranch,
} from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { isBrBienesRaicesSaleListing } from "@/app/clasificados/lib/leonixBrGate12d";
import { brLuxuryCardClass } from "@/app/clasificados/bienes-raices/shared/brResultsTheme";
import { LeonixListingFactsGrid, type LeonixFactRow } from "@/app/clasificados/lib/LeonixListingFactsGrid";

/** Item 15 — shared theme values matching this surface's existing gold/cream palette, so
 * adopting LeonixListingFactsGrid here doesn't change the visual language BR already uses. */
const BR_LIVE_FACTS_GRID_THEME = {
  borderColor: "rgba(232,223,208,0.9)",
  cardBackground: "rgba(255,252,247,0.95)",
  labelColor: "#8A6F3A",
  valueColor: "#2A2620",
};

function branchLaneLabel(branch: LeonixClasificadosBranch, lang: "es" | "en"): string {
  const es: Record<LeonixClasificadosBranch, string> = {
    bienes_raices_privado: "Particular · Bienes raíces",
    bienes_raices_negocio: "Negocio · Bienes raíces",
    rentas_privado: "Particular · Rentas",
    rentas_negocio: "Negocio · Rentas",
  };
  const en: Record<LeonixClasificadosBranch, string> = {
    bienes_raices_privado: "Private · Real estate",
    bienes_raices_negocio: "Business · Real estate",
    rentas_privado: "Private · Rentals",
    rentas_negocio: "Business · Rentals",
  };
  return lang === "es" ? es[branch] : en[branch];
}

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

function listingStatusLabel(raw: string | null, lang: "es" | "en"): string {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return "";
  const es: Record<string, string> = {
    disponible: "Disponible",
    pendiente: "Pendiente",
    bajo_contrato: "Bajo contrato",
    vendido: "Vendido",
    en_venta: "En venta",
    en_renta: "En renta",
    disponible_pronto: "Disponible pronto",
    preconstruccion: "Preconstrucción",
  };
  const en: Record<string, string> = {
    disponible: "Available",
    pendiente: "Pending",
    bajo_contrato: "Under contract",
    vendido: "Sold",
    en_venta: "For sale",
    en_renta: "For rent",
    disponible_pronto: "Available soon",
    preconstruccion: "Pre-construction",
  };
  return lang === "es" ? es[v] ?? raw ?? "" : en[v] ?? raw ?? "";
}

/** Compact BR facts from persisted `detail_pairs` (machine + Leonix branch/operation). */
export function BrLiveFactsStrip({ detailPairs, lang }: { detailPairs: unknown; lang: "es" | "en" }) {
  const lx = parseLeonixListingContract(detailPairs);
  const m = parseLeonixMachineFacetRead(detailPairs);
  const hideGenericPets = isBrBienesRaicesSaleListing(detailPairs);
  const hasMachine =
    m.bedroomsCount != null ||
    m.bathroomsCount != null ||
    m.postalCode ||
    m.pool != null ||
    (!hideGenericPets && m.petsAllowed != null) ||
    m.furnished != null ||
    m.resultsPropertyKind;

  if (!lx.operation && !lx.branch && !hasMachine) return null;

  // Item 15 — category adapter: BR's own facts, in BR's own order, converted into the shared
  // LeonixFactRow shape instead of a bespoke chip list. LeonixListingFactsGrid itself drops any
  // row whose value is empty, so this stays sparse by construction.
  const rows: LeonixFactRow[] = [];
  const push = (label: string, value: string) => {
    const v = value.trim();
    if (v) rows.push({ label, value: v });
  };
  push(lang === "es" ? "Estado" : "Status", listingStatusLabel(readLeonixDetailPairValue(detailPairs, LEONIX_DP_BR_LISTING_STATUS), lang));
  push(lang === "es" ? "Operación" : "Operation", opLabel(lx.operation, lang));
  push(lang === "es" ? "Tipo" : "Type", kindLabel(m.resultsPropertyKind, lang));
  if (m.bedroomsCount != null && m.bedroomsCount >= 0) {
    push(lang === "es" ? "Recámaras" : "Bedrooms", String(m.bedroomsCount));
  }
  if (m.bathroomsCount != null && m.bathroomsCount > 0) {
    push(lang === "es" ? "Baños" : "Bathrooms", String(m.bathroomsCount));
  }
  if (m.parkingSpots != null && m.parkingSpots > 0) {
    push(lang === "es" ? "Estacionamiento" : "Parking", String(m.parkingSpots));
  }
  push("ZIP", m.postalCode ?? "");
  if (m.pool != null) push(lang === "es" ? "Alberca" : "Pool", m.pool ? (lang === "es" ? "Sí" : "Yes") : lang === "es" ? "No" : "No");
  if (!hideGenericPets && m.petsAllowed != null) {
    push(lang === "es" ? "Mascotas" : "Pets", m.petsAllowed ? (lang === "es" ? "Permitidas" : "Allowed") : lang === "es" ? "No permitidas" : "Not allowed");
  }
  if (m.furnished != null) {
    push(lang === "es" ? "Amueblado" : "Furnished", m.furnished ? (lang === "es" ? "Sí" : "Yes") : lang === "es" ? "No" : "No");
  }
  push(lang === "es" ? "Perfil" : "Lane", lx.branch ? branchLaneLabel(lx.branch, lang) : "");

  if (rows.length === 0) return null;

  return (
    <section
      className={`mb-6 ${brLuxuryCardClass} p-5 ring-1 ring-[#C9B46A]/10`}
      aria-label={lang === "es" ? "Resumen del inmueble" : "Property summary"}
    >
      <LeonixListingFactsGrid
        title={lang === "es" ? "Datos publicados" : "Published facts"}
        rows={rows}
        theme={BR_LIVE_FACTS_GRID_THEME}
        columns={3}
        className="border-0 p-0 shadow-none"
      />
    </section>
  );
}
