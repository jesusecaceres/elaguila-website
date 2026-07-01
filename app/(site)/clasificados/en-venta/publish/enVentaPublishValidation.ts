import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { evaluateEnVentaFamilySafetyFromState } from "@/app/clasificados/en-venta/moderation/enVentaFamilySafety";
import { validateEnVentaLocation } from "@/app/clasificados/en-venta/shared/utils/validateEnVentaLocation";
import {
  enVentaCanonicalMainDescription,
  EN_VENTA_PUBLISH_DESCRIPTION_TOO_SHORT_EN,
  EN_VENTA_PUBLISH_DESCRIPTION_TOO_SHORT_ES,
  prepareEnVentaStateForPublish,
} from "@/app/lib/clasificados/en-venta/enVentaPublishDescription";
import {
  LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS,
  prepareLeonixListingDescriptionForPublish,
} from "@/app/clasificados/lib/leonixPublishPublicDescription";

const COPY = {
  es: {
    blockerTitle: "Agrega un título para tu artículo.",
    blockerTaxonomy: "Completa categoría, tipo de artículo y condición.",
    blockerPrice: "Agrega el precio del artículo.",
    blockerPriceOrFree: "Agrega el precio del artículo o marca Gratis.",
    blockerAccurate: "Confirma que la información del anuncio es correcta.",
    blockerPhotos: "Confirma que las fotos muestran el artículo real.",
    blockerRules: "Confirma que cumples las reglas de Varios.",
  },
  en: {
    blockerTitle: "Add a title for your item.",
    blockerTaxonomy: "Complete department, item type, and condition.",
    blockerPrice: "Add the item price.",
    blockerPriceOrFree: "Add the item price or mark it as Free.",
    blockerAccurate: "Confirm the listing information is accurate.",
    blockerPhotos: "Confirm the photos show the actual item.",
    blockerRules: "Confirm you follow Varios rules.",
  },
} as const;

/** Blocks publish when main description is present but below DB minimum after sanitize. */
export function collectEnVentaPublishDescriptionBlockers(
  lang: "es" | "en",
  state: EnVentaFreeApplicationState,
): string[] {
  const normalized = prepareEnVentaStateForPublish(state);
  const raw = enVentaCanonicalMainDescription(normalized);
  if (!raw) return [];
  if (raw.length < LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS) {
    return [lang === "es" ? EN_VENTA_PUBLISH_DESCRIPTION_TOO_SHORT_ES : EN_VENTA_PUBLISH_DESCRIPTION_TOO_SHORT_EN];
  }
  const prep = prepareLeonixListingDescriptionForPublish(raw, lang);
  if (!prep.ok) return [prep.error];
  return [];
}

/** Core fields required for preview and publish (excludes confirmation checkboxes). */
export function collectEnVentaCoreBlockers(
  lang: "es" | "en",
  state: EnVentaFreeApplicationState
): string[] {
  const t = COPY[lang];
  const reasons: string[] = [];

  if (!state.title.trim()) reasons.push(t.blockerTitle);

  const rama = state.rama.trim();
  const itemType = state.itemType.trim();
  const condition = state.condition.trim();
  if (!rama || !itemType || !condition) reasons.push(t.blockerTaxonomy);

  if (!state.priceIsFree && !String(state.price).trim()) {
    reasons.push(t.blockerPrice);
  }

  const loc = validateEnVentaLocation(state.city, state.zip, state.state, state.country);
  if (!loc.ok) reasons.push(lang === "es" ? loc.messageEs : loc.messageEn);

  const safety = evaluateEnVentaFamilySafetyFromState(state, lang);
  if (safety.status !== "safe") {
    reasons.push(safety.userMessage);
  }

  reasons.push(...collectEnVentaPublishDescriptionBlockers(lang, state));

  return reasons;
}

/** Full publish gates including the three confirmation checkboxes. */
export function collectEnVentaPublishBlockers(
  lang: "es" | "en",
  state: EnVentaFreeApplicationState
): string[] {
  const t = COPY[lang];
  const reasons = collectEnVentaCoreBlockers(lang, state);

  if (!state.confirmListingAccurate) reasons.push(t.blockerAccurate);
  if (!state.confirmPhotosRepresentItem) reasons.push(t.blockerPhotos);
  if (!state.confirmCommunityRules) reasons.push(t.blockerRules);

  return reasons;
}
