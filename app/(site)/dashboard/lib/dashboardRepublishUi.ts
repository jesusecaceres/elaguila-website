import {
  canRepublishListing,
  republishActionLabel,
} from "@/app/admin/_lib/classifiedsRepublishCapability";

/** Mirrors Admin: removed listings are never republish targets from the dashboard. */
export function dashboardCanRepublishListingsRow(row: Record<string, unknown>, category: string): boolean {
  if (String(row.status ?? "").toLowerCase() === "removed") return false;
  return canRepublishListing(row, category);
}

/**
 * Primary owner action kind aligned with Admin `republishActionLabel` (Move to top vs Republish).
 * Returns null when ineligible or when Admin rules cannot determine eligibility.
 */
export function dashboardRepublishPrimaryKind(
  row: Record<string, unknown>,
  category: string,
): "move_to_top" | "republish" | null {
  const r = republishActionLabel(row, category);
  if (r.disabled) return null;
  if (r.label === "Move to top") return "move_to_top";
  if (r.label === "Republish") return "republish";
  return null;
}

export function dashboardRepublishPrimaryLabel(lang: "es" | "en", kind: "move_to_top" | "republish"): string {
  if (kind === "move_to_top") return lang === "es" ? "Subir al inicio" : "Move to top";
  return lang === "es" ? "Republicar" : "Republish";
}
