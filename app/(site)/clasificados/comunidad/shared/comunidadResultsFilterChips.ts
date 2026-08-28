import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { optionLabel } from "@/app/(site)/clasificados/community/shared/communityOptionLabel";
import {
  COMUNIDAD_ACCESSIBILITY_OPTIONS,
  COMUNIDAD_CATEGORY_OPTIONS,
  resolveComunidadEventTypePublicLabel,
} from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";

/**
 * Comunidad-owned active-filter-chip labels for the results search drawer —
 * extracted from the `else` branch of CommunityResultsSearchPanel.tsx's
 * drawerFilterChips(). Only decides comunidad-specific chip text; the panel
 * itself still owns the generic audience/registration chips.
 */
export function pushComunidadDrawerFilterChips(
  lang: Lang,
  drawer: Record<string, string>,
  push: (key: string, label: string) => void,
): void {
  const L = lang === "es";
  if (drawer.eventType) {
    const eventLabel = optionLabel(COMUNIDAD_CATEGORY_OPTIONS, drawer.eventType, lang);
    push(
      "eventType",
      `${L ? "Tipo" : "Type"}: ${eventLabel || resolveComunidadEventTypePublicLabel(drawer.eventType, "", lang)}`,
    );
  }
  if (drawer.eventCost && drawer.eventCost !== "all") {
    const costLabel =
      drawer.eventCost === "gratis"
        ? L
          ? "Gratis"
          : "Free"
        : drawer.eventCost === "pagado"
          ? L
            ? "Pagado"
            : "Paid"
          : drawer.eventCost === "donacion"
            ? L
              ? "Donación"
              : "Donation"
            : drawer.eventCost === "noConfirmado"
              ? L
                ? "Por confirmar"
                : "TBD"
              : drawer.eventCost;
    push("eventCost", `${L ? "Costo" : "Cost"}: ${costLabel}`);
  }
  if (drawer.dateFrom) push("dateFrom", `${L ? "Desde" : "From"}: ${drawer.dateFrom}`);
  if (drawer.dateTo) push("dateTo", `${L ? "Hasta" : "To"}: ${drawer.dateTo}`);
  if (drawer.accessibility && drawer.accessibility !== "all") {
    push(
      "accessibility",
      `${L ? "Acceso" : "Access"}: ${optionLabel(COMUNIDAD_ACCESSIBILITY_OPTIONS, drawer.accessibility, lang)}`,
    );
  }
}
