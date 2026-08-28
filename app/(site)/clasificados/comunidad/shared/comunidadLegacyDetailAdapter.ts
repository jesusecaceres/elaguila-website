import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  comunidadEventCostLabel,
  parseAccessibilityKeysCsv,
  type CommunityListingPairMap,
} from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";
import {
  COMUNIDAD_ACCESSIBILITY_UNCERTAIN_VALUE,
  labelComunidadAccessibilityKey,
  resolveComunidadEventTypePublicLabel,
} from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
import type { CommunityLegacyDetailAdapter } from "@/app/(site)/clasificados/community/shared/communityLegacyDetailAdapterTypes";

/**
 * Comunidad-owned legacy compatibility adapter — extracted from the
 * `else` branch of CommunityQuickAnuncioDetail.tsx (the pre-WYSIWYG detail
 * renderer, still used for old un-migrated listings). Builds the same
 * key-facts rows, section title, and category chip label the legacy
 * component used to build inline.
 *
 * `formatAdmission` is injected by the caller (CommunityQuickAnuncioDetail.tsx
 * already owns `formatAdmissionWithDollar`, which is also imported by
 * ComunidadQuickAdCanvas.tsx and comunidadCostDisplay.ts — passing it in here
 * avoids relocating a helper with dependents outside this gate's scope).
 */
export function buildComunidadLegacyDetail(
  pairs: CommunityListingPairMap,
  lang: Lang,
  formatAdmission: (raw: string) => string,
): CommunityLegacyDetailAdapter {
  const L = lang === "es";
  const rows: { label: string; value: string }[] = [];

  const catSlug = pairs["Leonix:eventCategory"] ?? "";
  const catCustom = pairs["Leonix:eventCategoryCustom"] ?? "";
  rows.push({
    label: L ? "Tipo de evento" : "Event type",
    value: resolveComunidadEventTypePublicLabel(catSlug, catCustom, lang),
  });
  rows.push({
    label: L ? "Costo del evento" : "Event cost",
    value: comunidadEventCostLabel(pairs["Leonix:eventCost"] ?? "", lang),
  });
  const d0 = pairs["Leonix:eventDate"] ?? "";
  const d1 = pairs["Leonix:eventEndDate"] ?? "";
  if (d0 || d1) {
    rows.push({
      label: L ? "Fechas" : "Dates",
      value: d1 && d1 !== d0 ? `${d0} → ${d1}` : d0 || d1,
    });
  }
  const adm = pairs["Leonix:admissionNote"] ?? "";
  if (adm.trim()) rows.push({ label: L ? "Admisión" : "Admission", value: formatAdmission(adm) });
  const accRaw = pairs["Leonix:accessibility"] ?? "";
  // "No estoy seguro" is an uncertainty state, not a real feature — never render it
  // as if it were a concrete positive accessibility attribute (Gate 1 fix).
  const accKeys = parseAccessibilityKeysCsv(accRaw).filter((k) => k !== COMUNIDAD_ACCESSIBILITY_UNCERTAIN_VALUE);
  if (accKeys.length) {
    rows.push({
      label: L ? "Acceso" : "Access",
      value: accKeys.map((k) => labelComunidadAccessibilityKey(k, lang)).join(", "),
    });
  }

  return {
    sectionTitle: L ? "Detalle del evento" : "Event details",
    categoryChipLabel: L ? "Comunidad y Eventos" : "Community & Events",
    rows,
  };
}
