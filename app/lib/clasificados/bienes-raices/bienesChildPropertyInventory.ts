/**
 * BR-JULY1-INVENTORY-ANALYTICS-OS-01 — canonical child property inventory helpers.
 * Facade over negocio/application child inventory modules (stable IDs, media aliases, preview/publish maps).
 */

import type { AgenteIndividualResidencialFormState } from "@/app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState";
import type { BienesRaicesNegocioFormState } from "@/app/(site)/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState";
import type { BrNegocioAdditionalInventoryPropertyDraft } from "@/app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioAdditionalInventoryDraft";
import {
  createEmptyBrNegocioAdditionalInventoryPropertyDraft,
  mergeAdditionalInventoryProperties,
  newBrLocalPropertyDraftId,
  normalizeChildInventoryDraft,
  sanitizeBrNegocioAdditionalInventoryPropertyDraft,
} from "@/app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioAdditionalInventoryDraft";
import {
  buildChildInventoryEditorState,
  childInventoryDraftFromEditorState,
  pickChildPropertySlice,
  type AgenteChildPropertyFormSlice,
} from "@/app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioChildInventoryFormMapping";
import {
  mapAdditionalDraftToInventoryCard,
  mapAgenteFormToMainInventoryCard,
  type BrNegocioInventoryCardModel,
} from "@/app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryCardModel";

export type BienesChildPropertyDraft = BrNegocioAdditionalInventoryPropertyDraft;
export type BienesChildPropertyMode = "add" | "edit";

export type BienesChildPropertyPreviewModel = {
  main: BrNegocioInventoryCardModel;
  children: BrNegocioInventoryCardModel[];
};

export type BienesChildPropertyPublishBundle = {
  parentDraft: AgenteIndividualResidencialFormState | BienesRaicesNegocioFormState;
  childDrafts: BienesChildPropertyDraft[];
};

/** Stable local child ID — reused on edit; new on add. */
export function createStableChildPropertyId(): string {
  return newBrLocalPropertyDraftId();
}

function coercePhotoUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((u) => String(u ?? "").trim()).filter(Boolean);
}

function firstStringFromArray(raw: unknown): string {
  if (!Array.isArray(raw)) return "";
  return String(raw[0] ?? "").trim();
}

function mergeMediaAliases(input: Record<string, unknown>): Partial<BienesChildPropertyDraft> {
  const photos = [
    ...coercePhotoUrls(input.photos),
    ...coercePhotoUrls(input.mediaImages),
    ...coercePhotoUrls(input.galleryImages),
    ...coercePhotoUrls(input.imageUrls),
    ...coercePhotoUrls(input.images),
    ...coercePhotoUrls(input.photoUrls),
  ];
  const videoUrl =
    String(input.videoUrl ?? firstStringFromArray(input.videoLinks) ?? "").trim() ||
    firstStringFromArray(input.videoUrls);
  const tourUrl =
    String(input.tourUrl ?? input.virtualTourUrl ?? "").trim() ||
    firstStringFromArray(input.virtualTourUrls) ||
    firstStringFromArray(input.tourLinks);
  const floorPlanUrls = [
    ...coercePhotoUrls(input.floorPlans),
    ...coercePhotoUrls(input.floorPlanImages),
    ...coercePhotoUrls(input.floorPlanUrls),
  ];
  const brochureUrl = String(input.brochureUrl ?? floorPlanUrls[0] ?? "").trim();

  return {
    photoUrls: photos.length ? photos : undefined,
    videoUrl: videoUrl || undefined,
    tourUrl: tourUrl || undefined,
    brochureUrl: brochureUrl || undefined,
    title: String(input.title ?? input.titulo ?? "").trim() || undefined,
    propertyType: String(input.propertyType ?? input.tipoPropiedadCodigo ?? "").trim() || undefined,
    propertySubtype: String(input.propertySubtype ?? input.subtipoPropiedad ?? "").trim() || undefined,
    price: String(input.price ?? input.precio ?? "").trim() || undefined,
    bedrooms: String(input.bedrooms ?? input.recamaras ?? "").trim() || undefined,
    bathrooms: String(input.bathrooms ?? input.banos ?? "").trim() || undefined,
    interiorSqft: String(input.interiorSqft ?? input.sqft ?? input.tamanoInteriorSqft ?? "").trim() || undefined,
    lotSqft: String(input.lotSqft ?? input.lotSize ?? input.tamanoLoteSqft ?? "").trim() || undefined,
    streetLine1: String(input.streetLine1 ?? input.addressLine1 ?? input.address ?? input.direccionLinea1 ?? "").trim() || undefined,
    streetLine2: String(input.streetLine2 ?? input.direccionLinea2 ?? "").trim() || undefined,
    city: String(input.city ?? input.ciudad ?? "").trim() || undefined,
    state: String(input.state ?? input.direccionEstado ?? "").trim() || undefined,
    zip: String(input.zip ?? input.direccionCodigoPostal ?? "").trim() || undefined,
    description: String(input.description ?? input.descripcionPrincipal ?? "").trim() || undefined,
  };
}

/** Normalize raw child input; preserves propertyForm slice and media aliases. */
export function normalizeBienesChildProperty(
  input: unknown,
): BienesChildPropertyDraft | null {
  const sanitized = sanitizeBrNegocioAdditionalInventoryPropertyDraft(input);
  if (!sanitized && input && typeof input === "object") {
    const o = input as Record<string, unknown>;
    const id = String(o.id ?? o.childId ?? o.tempId ?? "").trim() || createStableChildPropertyId();
    const base = createEmptyBrNegocioAdditionalInventoryPropertyDraft(id);
    const aliases = mergeMediaAliases(o);
    const propertyForm = o.propertyForm ?? pickChildPropertySlice(o as AgenteIndividualResidencialFormState);
    return normalizeChildInventoryDraft({
      ...base,
      ...aliases,
      propertyForm: propertyForm as Partial<AgenteIndividualResidencialFormState> | null,
    });
  }
  return sanitized ? normalizeChildInventoryDraft(sanitized) : null;
}

/** Hydrate full Agente editor state from saved child + parent hub. */
export function hydrateBienesChildPropertyForm(
  savedChild: BienesChildPropertyDraft,
  parentHub: AgenteIndividualResidencialFormState,
  lang: "es" | "en" = "es",
): AgenteIndividualResidencialFormState {
  return buildChildInventoryEditorState(parentHub, normalizeChildInventoryDraft(savedChild), lang);
}

/** Persist editor state → child draft (stable id on edit). */
export function prepareBienesChildPropertyForSave(
  parentHub: AgenteIndividualResidencialFormState,
  editorState: AgenteIndividualResidencialFormState,
  existingChild: BienesChildPropertyDraft | null,
  lang: "es" | "en" = "es",
): BienesChildPropertyDraft {
  return childInventoryDraftFromEditorState(parentHub, editorState, existingChild, lang);
}

/** Merge incoming child onto existing by id — never wipes sibling-unrelated fields. */
export function mergeBienesChildProperty(
  existingChild: BienesChildPropertyDraft,
  incomingChild: Partial<BienesChildPropertyDraft>,
): BienesChildPropertyDraft {
  const merged = normalizeChildInventoryDraft({
    ...existingChild,
    ...incomingChild,
    id: existingChild.id,
    createdAt: existingChild.createdAt,
    photoUrls: incomingChild.photoUrls?.length ? incomingChild.photoUrls : existingChild.photoUrls,
    propertyForm: incomingChild.propertyForm ?? existingChild.propertyForm,
  });
  return merged;
}

/** Remove one child by stable id; siblings preserved. */
export function removeBienesChildProperty(
  children: BienesChildPropertyDraft[],
  childId: string,
): BienesChildPropertyDraft[] {
  return children.filter((c) => c.id !== childId);
}

/** Read-only preview card for one child. */
export function mapBienesChildPropertyToPreview(
  child: BienesChildPropertyDraft,
  _parentDraft: AgenteIndividualResidencialFormState,
  lang: "es" | "en" = "es",
): BrNegocioInventoryCardModel {
  return mapAdditionalDraftToInventoryCard(normalizeChildInventoryDraft(child), lang);
}

/** Read-only preview model: main + additional cards. */
export function mapBienesParentAndChildrenToPreview(
  parentDraft: AgenteIndividualResidencialFormState,
  children: BienesChildPropertyDraft[],
  lang: "es" | "en" = "es",
): BienesChildPropertyPreviewModel {
  const normalizedChildren = mergeAdditionalInventoryProperties(children);
  return {
    main: mapAgenteFormToMainInventoryCard(parentDraft, lang),
    children: normalizedChildren.map((c) => mapAdditionalDraftToInventoryCard(c, lang)),
  };
}

/** Normalized publish bundle — child rows published separately via inventory queue (BR-INV-E). */
export function mapBienesParentAndChildrenToPublish(
  parentDraft: AgenteIndividualResidencialFormState | BienesRaicesNegocioFormState,
  children: BienesChildPropertyDraft[],
): BienesChildPropertyPublishBundle {
  return {
    parentDraft,
    childDrafts: mergeAdditionalInventoryProperties(children).map((c) => normalizeChildInventoryDraft(c)),
  };
}

export {
  mergeAdditionalInventoryProperties,
  normalizeChildInventoryDraft,
  type BrNegocioAdditionalInventoryPropertyDraft,
  type AgenteChildPropertyFormSlice,
};
