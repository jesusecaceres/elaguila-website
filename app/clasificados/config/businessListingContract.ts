/**
 * Shared business listing contract for Clasificados.
 *
 * PRODUCT ARCHITECTURE:
 * - RENTAS = rentals only. Business/agents posting here post rentals (renta mensual, depósito, etc.).
 * - EN VENTA = professional real-estate SALES lane (homes, condos, multifamily, land, commercial,
 *   industrial, business real-estate presence). Business branch and this contract will be reused there.
 *
 * This module is the single source of truth for business identity meta keys and parsing.
 * Used by: Rentas negocio (business posting rentals), and future En Venta real-estate sales.
 */

/** Keys stored in listing.business_meta JSON. Same shape for rentas (business rentals) and en-venta (business sales). */
export const BUSINESS_META_KEYS = [
  "negocioAgente",
  /** Mirrors `listings.business_name` when saved from publish (redundant but ensures meta merge has a name). */
  "negocioNombre",
  "negocioCargo",
  /** Real estate / professional license number or ID (optional). */
  "negocioLicencia",
  "negocioTelOficina",
  /** Office phone extension (digits or short label), optional. */
  "negocioTelExtension",
  "negocioSitioWeb",
  /** Business / agent contact email for listings and public agent profile. */
  "negocioEmail",
  "negocioRedes",
  "negocioLogoUrl",
  "negocioFotoAgenteUrl",
  "negocioIdiomas",
  /** Comma- or newline-separated cities/areas the business serves (BR negocio). */
  "negocioZonasServicio",
  "negocioHorario",
  "negocioRecorridoVirtual",
  "negocioPlusMasAnuncios",
  "negocioDescripcion",
  "negocioDisponibilidadPrecios",
] as const;

export type BusinessMetaKey = (typeof BUSINESS_META_KEYS)[number];

/**
 * Parse listing.business_meta string into a record. Safe for any category (rentas, en-venta).
 */
export function parseBusinessMeta(raw: string | null | undefined): Record<string, string> | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return null;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v == null) continue;
      if (typeof v === "string") {
        out[k] = v;
      } else if (typeof v === "number" || typeof v === "boolean") {
        out[k] = String(v);
      }
    }
    return out;
  } catch {
    return null;
  }
}
