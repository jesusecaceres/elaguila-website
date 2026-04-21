/**
 * Read BR/Rentas listing facets from `detail_pairs` + Leonix contract slice.
 * Keep label matching tolerant (Spanish UI labels from preview VMs).
 */

import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  parseLeonixListingContract,
  type LeonixClasificadosBranch,
} from "@/app/clasificados/lib/leonixRealEstateListingContract";

export type BrFacetSlice = {
  branch: LeonixClasificadosBranch | null;
  operation: "venta" | "renta" | null;
  categoriaPropiedad: BrNegocioCategoriaPropiedad | null;
  beds: string;
  baths: string;
  metaHints: string[];
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

/** Heuristic: pull beds/baths from human detail_pairs lines. */
export function extractBrFacetsFromDetailPairs(detailPairs: unknown): BrFacetSlice {
  const rows = pairRows(detailPairs);
  const lx = parseLeonixListingContract(detailPairs);
  const op: "venta" | "renta" | null =
    lx.operation === "rent" ? "renta" : lx.operation === "sale" ? "venta" : null;

  let beds = firstMatchingValue(rows, /recám|recamar|bedroom|habitaci/i);
  if (!beds) beds = firstMatchingValue(rows, /^camas?$/i);
  beds = beds ? digitsOrDash(beds) : "—";

  let baths = firstMatchingValue(rows, /baño|bath/i);
  if (!baths) baths = firstMatchingValue(rows, /medios?\s*baños?/i);
  baths = baths ? digitsOrDash(baths) : "—";

  const metaHints: string[] = [];
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
    metaHints: metaHints.slice(0, 6),
  };
}
