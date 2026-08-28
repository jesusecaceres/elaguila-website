import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { optionLabel } from "@/app/(site)/clasificados/community/shared/communityOptionLabel";
import {
  CLASES_CATEGORY_OPTIONS,
  CLASES_SKILL_LEVEL_OPTIONS,
  resolveClasesCategoryPublicLabel,
} from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";

/**
 * Clases-owned active-filter-chip labels for the results search drawer —
 * extracted from the `if (category === "clases")` branch of
 * CommunityResultsSearchPanel.tsx's drawerFilterChips(). Only decides
 * clases-specific chip text; the panel itself still owns the generic
 * audience/registration chips.
 */
export function pushClasesDrawerFilterChips(
  lang: Lang,
  drawer: Record<string, string>,
  push: (key: string, label: string) => void,
): void {
  const L = lang === "es";
  if (drawer.classType) {
    const classLabel = optionLabel(CLASES_CATEGORY_OPTIONS, drawer.classType, lang);
    push(
      "classType",
      `${L ? "Tipo" : "Type"}: ${classLabel || resolveClasesCategoryPublicLabel(drawer.classType, "", lang)}`,
    );
  }
  if (drawer.cost && drawer.cost !== "all") {
    const costLabel =
      drawer.cost === "gratis" ? (L ? "Gratis" : "Free") : drawer.cost === "pagada" ? (L ? "Pagada" : "Paid") : drawer.cost;
    push("cost", `${L ? "Costo" : "Cost"}: ${costLabel}`);
  }
  if (drawer.mode && drawer.mode !== "all") {
    const modeLabel =
      drawer.mode === "presencial"
        ? L
          ? "Presencial"
          : "In person"
        : drawer.mode === "enLinea"
          ? L
            ? "En línea"
            : "Online"
          : drawer.mode === "hibrida"
            ? L
              ? "Híbrida"
              : "Hybrid"
            : drawer.mode;
    push("mode", `${L ? "Modalidad" : "Mode"}: ${modeLabel}`);
  }
  if (drawer.level && drawer.level !== "all") {
    push("level", `${L ? "Nivel" : "Level"}: ${optionLabel(CLASES_SKILL_LEVEL_OPTIONS, drawer.level, lang)}`);
  }
}
