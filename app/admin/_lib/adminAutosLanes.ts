/**
 * Autos Admin lane filter — one engine, one table (`autos_classifieds_listings`), two operational
 * lanes. The lane values are the canonical `row.lane` values (`AutosClassifiedsLane` in
 * `autosClassifiedsTypes.ts`, enforced by the table's `lane in ('negocios','privado')` check) —
 * never a display-only alias. Client-safe: type import only, no server code.
 */
import type { AutosClassifiedsLane } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";

export type AdminAutosLaneFilter = AutosClassifiedsLane | "all";

export const ADMIN_AUTOS_WORKSPACE_PATH = "/admin/workspace/clasificados/autos";

export const ADMIN_AUTOS_LANE_OPTIONS: ReadonlyArray<{ value: AdminAutosLaneFilter; label: string; hint: string }> = [
  { value: "all", label: "All Autos", hint: "Dealers and private sellers together" },
  { value: "negocios", label: "Dealers de Autos", hint: "Business / dealer lane, including dealer inventory" },
  { value: "privado", label: "Autos Privados", hint: "Private-seller lane" },
];

/** Unknown / missing values fall back to `all` — a bad URL never hides rows. */
export function parseAdminAutosLane(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): AdminAutosLaneFilter {
  const v = searchParams?.lane;
  const raw = (typeof v === "string" ? v : Array.isArray(v) ? v[0] : "")?.trim().toLowerCase();
  return raw === "negocios" || raw === "privado" ? raw : "all";
}

/** Deep link into the single canonical Autos workspace for one lane (`all` = no lane param). */
export function adminAutosLaneHref(lane: AdminAutosLaneFilter): string {
  return lane === "all" ? ADMIN_AUTOS_WORKSPACE_PATH : `${ADMIN_AUTOS_WORKSPACE_PATH}?lane=${lane}`;
}
