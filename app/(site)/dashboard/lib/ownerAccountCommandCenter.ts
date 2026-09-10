import type { OwnerAttentionItem, OwnerAttentionSeverity } from "./ownerAttentionModel";
import { sortOwnerAttentionItems } from "./ownerAttentionModel";
import type { DashboardStatusTone } from "./dashboardLeonixTheme";

/** Owner Attention Truth Gate — Account Command Center renders the canonical
 * OwnerAttentionItem[] (built by ownerAttentionModel.buildAccountAttentionItems from the
 * existing derived feed) — no second advisor engine, no second interpretation of the feed. */
export function accountAttentionItems(items: OwnerAttentionItem[]): OwnerAttentionItem[] {
  return sortOwnerAttentionItems(items).slice(0, 8);
}

export function ownerAttentionSeverityTone(severity: OwnerAttentionSeverity): DashboardStatusTone {
  if (severity === "critical") return "danger";
  if (severity === "warning") return "warn";
  return "neutral";
}
