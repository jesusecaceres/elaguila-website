import { pickTranslatableAdFields } from "@/app/lib/translation/helpers";
import type { Locale, TranslatableAdFields } from "@/app/lib/translation/types";
import type { AgenteIndividualResidencialFormState } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState";

/** Property listing prose only — price, contact, city, type codes, and media stay out. */
export function buildBienesNegocioTranslatableContent(
  data: AgenteIndividualResidencialFormState,
): TranslatableAdFields {
  return {
    title: data.titulo?.trim() || undefined,
    description: data.descripcionPrincipal?.trim() || undefined,
    locationNote: data.areaCiudad?.trim() || undefined,
  };
}

export function hasBienesNegocioTranslatableProse(content: unknown): boolean {
  return Object.keys(pickTranslatableAdFields(content)).length > 0;
}

export function shouldOfferBienesNegocioTranslateAd(
  siteLocale: Locale,
  translatableContent: unknown,
): boolean {
  if (!hasBienesNegocioTranslatableProse(translatableContent)) return false;
  return siteLocale === "es" || siteLocale === "en";
}

export function applyBienesNegocioTranslation(
  data: AgenteIndividualResidencialFormState,
  translated: Partial<TranslatableAdFields>,
): AgenteIndividualResidencialFormState {
  let next = data;
  if (translated.title?.trim()) {
    next = { ...next, titulo: translated.title.trim() };
  }
  if (translated.description?.trim()) {
    next = { ...next, descripcionPrincipal: translated.description.trim() };
  }
  if (translated.locationNote?.trim()) {
    next = { ...next, areaCiudad: translated.locationNote.trim() };
  }
  return next;
}
