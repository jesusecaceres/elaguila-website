/**
 * OWNER LOCK (Quick must use the exact same real presentation as Full/public).
 *
 * The four BUSINESS families render the REAL public category components inside the private
 * prospect preview, from the stored row. The other four staff families (rentas, empleos,
 * autos-privado, comida-local) keep the generic prospect shell and are deliberately out of scope.
 *
 * Pure and dependency-free so a verifier can execute it and so both the page and the reader agree
 * on the exact same set.
 */
export const PROSPECT_REAL_COMPONENT_CATEGORIES = ["servicios", "restaurantes", "autos", "bienes-raices"] as const;

export type ProspectRealComponentCategory = (typeof PROSPECT_REAL_COMPONENT_CATEGORIES)[number];

export function isProspectRealComponentCategory(value: unknown): value is ProspectRealComponentCategory {
  return typeof value === "string" && (PROSPECT_REAL_COMPONENT_CATEGORIES as readonly string[]).includes(value);
}
