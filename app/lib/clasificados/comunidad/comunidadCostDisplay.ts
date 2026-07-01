import type { ComunidadCostType } from "@/app/(site)/publicar/community/shared/types/communityQuickDraft";
import { comunidadCostLabel } from "@/app/(site)/publicar/community/shared/copy/communityPublishCopy";
import { formatAdmissionWithDollar } from "@/app/(site)/clasificados/community/CommunityQuickAnuncioDetail";

/** Public cost line: type label + optional formatted numeric note. */
export function formatComunidadCostSummary(
  eventCost: ComunidadCostType,
  admissionNote: string,
  lang: "es" | "en",
): string {
  const base = comunidadCostLabel(eventCost, lang);
  const note = admissionNote.trim();
  if (!note) return base;
  if (eventCost === "pagado" || eventCost === "donacion") {
    return `${base} · ${formatAdmissionWithDollar(note)}`;
  }
  return base;
}
