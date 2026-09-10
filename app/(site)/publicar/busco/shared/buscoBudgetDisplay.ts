import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { BuscoBudgetMode } from "./buscoQuickTypes";
import { labelBuscoBudgetMode } from "./buscoTaxonomy";
import { formatBuscoBudget } from "./buscoFormatBudget";

/**
 * Section E/F/AB — resolves a single public-facing budget display string from either the new
 * structured mode/amount (current submissions) or the old free-text budget (legacy rows written
 * before Gate 4). Shared by the view model (canvas) and the card model (discovery/result card) so
 * both surfaces render budget identically without duplicating the legacy-fallback logic.
 */
export function resolveBuscoBudgetDisplay(
  input: { budgetMode?: string; budgetAmount?: string; legacyBudgetText?: string },
  lang: Lang,
): string | null {
  const mode = (input.budgetMode ?? "").trim() as BuscoBudgetMode | "";
  if (mode === "tiene") {
    const amount = (input.budgetAmount ?? "").trim();
    return amount ? `$${amount}` : null;
  }
  if (mode === "gratis" || mode === "intercambio" || mode === "convenir") {
    return labelBuscoBudgetMode(mode, lang);
  }
  if (mode === "no_aplica" || mode === "") {
    const legacy = (input.legacyBudgetText ?? "").trim();
    return legacy ? formatBuscoBudget(legacy) : null;
  }
  return null;
}
