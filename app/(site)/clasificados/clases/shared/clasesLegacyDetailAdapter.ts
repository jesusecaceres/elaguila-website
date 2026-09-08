import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  clasesCostTypeLabel,
  clasesModeLabel,
  clasesPriceFrequencyLabel,
  type CommunityListingPairMap,
} from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";
import { labelClasesSkillLevel, resolveClasesCategoryPublicLabel } from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
import type { CommunityLegacyDetailAdapter } from "@/app/(site)/clasificados/community/shared/communityLegacyDetailAdapterTypes";

/**
 * Clases-owned legacy compatibility adapter — extracted from the
 * `if (category === "clases")` branch of CommunityQuickAnuncioDetail.tsx
 * (the pre-WYSIWYG detail renderer, still used for old un-migrated
 * listings). Builds the same key-facts rows, section title, and category
 * chip label the legacy component used to build inline.
 */
export function buildClasesLegacyDetail(pairs: CommunityListingPairMap, lang: Lang): CommunityLegacyDetailAdapter {
  const L = lang === "es";
  const rows: { label: string; value: string }[] = [];

  const catSlug = pairs["Leonix:classCategory"] ?? "";
  const catCustom = pairs["Leonix:classCategoryCustom"] ?? "";
  rows.push({
    label: L ? "Tipo de clase" : "Class type",
    value: resolveClasesCategoryPublicLabel(catSlug, catCustom, lang),
  });
  rows.push({ label: L ? "Modalidad" : "Mode", value: clasesModeLabel(pairs["Leonix:mode"] ?? "", lang) });
  rows.push({
    label: L ? "Costo" : "Cost",
    value: clasesCostTypeLabel(pairs["Leonix:classCostType"] ?? "", lang),
  });
  if (pairs["Leonix:classCostType"] === "pagada") {
    const amt = pairs["Leonix:priceAmount"] ?? "";
    const fq = pairs["Leonix:priceFrequency"] ?? "";
    const fqL = fq ? clasesPriceFrequencyLabel(fq, lang) : "";
    rows.push({
      label: L ? "Precio" : "Price",
      value: amt ? `${amt} (${fqL})`.trim() : "—",
    });
    const note = pairs["Leonix:priceNote"];
    if (note?.trim()) rows.push({ label: L ? "Nota de precio" : "Price note", value: note });
  }
  const lvl = pairs["Leonix:skillLevel"] ?? "";
  if (lvl.trim()) rows.push({ label: L ? "Nivel" : "Level", value: labelClasesSkillLevel(lvl, lang) });

  return {
    sectionTitle: L ? "Detalle de la clase" : "Class details",
    categoryChipLabel: L ? "Clases" : "Classes",
    rows,
  };
}
