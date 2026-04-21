/**
 * Read BR/Rentas listing facets from `detail_pairs` + Leonix contract slice.
 * Keep label matching tolerant (Spanish UI labels from preview VMs).
 */

import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  parseLeonixListingContract,
  parseLeonixMachineFacetRead,
  type LeonixClasificadosBranch,
} from "@/app/clasificados/lib/leonixRealEstateListingContract";

export type BrFacetSlice = {
  branch: LeonixClasificadosBranch | null;
  operation: "venta" | "renta" | null;
  categoriaPropiedad: BrNegocioCategoriaPropiedad | null;
  beds: string;
  baths: string;
  metaHints: string[];
  /** From `Leonix:*` machine rows when present. */
  machine?: ReturnType<typeof parseLeonixMachineFacetRead>;
};

function pairRows(detailPairs: unknown): Array<{ label: string; value: string }> {
  if (!Array.isArray(detailPairs)) return [];
  const out: Array<{ label: string; value: string }> = [];
  for (const p of detailPairs) {
    if (!p || typeof p !== "object") continue;
    const o = p as { label?: string; value?: string };
    const l = String(o.label ?? "").trim();
    const v = String(o.value ?? "").trim();
    if (l && v) out.push({ label: l, value: v });
  }
  return out;
}

function firstMatchingValue(rows: Array<{ label: string; value: string }>, re: RegExp): string {
  for (const r of rows) {
    if (re.test(r.label)) return r.value;
  }
  return "";
}

function digitsOrDash(raw: string): string {
  const t = raw.trim();
  if (!t) return "—";
  const n = Number(String(t).replace(/[^0-9.]/g, ""));
  if (Number.isFinite(n)) return String(Math.floor(n));
  return t.length > 12 ? `${t.slice(0, 12)}…` : t;
}

function formatCountForCard(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  return String(n);
}

/** Prefer `Leonix:bedrooms_count` / `Leonix:bathrooms_count`; fall back to Spanish human rows. */
export function extractBrFacetsFromDetailPairs(detailPairs: unknown): BrFacetSlice {
  const rows = pairRows(detailPairs);
  const lx = parseLeonixListingContract(detailPairs);
  const machine = parseLeonixMachineFacetRead(detailPairs);
  const op: "venta" | "renta" | null =
    lx.operation === "rent" ? "renta" : lx.operation === "sale" ? "venta" : null;

  let beds =
    machine.bedroomsCount != null && machine.bedroomsCount >= 0 ? formatCountForCard(machine.bedroomsCount) : "";
  if (!beds) {
    let b = firstMatchingValue(rows, /recám|recamar|bedroom|habitaci/i);
    if (!b) b = firstMatchingValue(rows, /^camas?$/i);
    beds = b ? digitsOrDash(b) : "—";
  }

  let baths =
    machine.bathroomsCount != null && machine.bathroomsCount > 0 ? formatCountForCard(machine.bathroomsCount) : "";
  if (!baths) {
    let b = firstMatchingValue(rows, /baño|bath/i);
    if (!b) b = firstMatchingValue(rows, /medios?\s*baños?/i);
    baths = b ? digitsOrDash(b) : "—";
  }

  const metaHints: string[] = [];
  if (machine.petsAllowed === true) metaHints.push("Mascotas");
  if (machine.pool === true) metaHints.push("Alberca / piscina");
  if (machine.furnished === true) metaHints.push("Amueblado");
  for (const r of rows) {
    const blob = `${r.label} ${r.value}`.toLowerCase();
    if (/mascota|pet|acepta\s+mascota/i.test(blob)) metaHints.push(r.value);
    if (/piscina|alberca|pool/i.test(blob)) metaHints.push(r.value);
    if (/amuebl|furnish/i.test(blob)) metaHints.push(r.value);
  }

  return {
    branch: lx.branch,
    operation: op,
    categoriaPropiedad: lx.categoriaPropiedad,
    beds,
    baths,
    metaHints: [...new Set(metaHints)].slice(0, 6),
    machine,
  };
}
