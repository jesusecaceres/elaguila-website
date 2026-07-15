/**
 * BR-INV-D — unified owner-only inventory card model (application preview only).
 */

import type { BienesRaicesNegocioFormState } from "./schema/bienesRaicesNegocioFormState";
import type { AgenteIndividualResidencialFormState } from "../agente-individual/schema/agenteIndividualResidencialFormState";
import { formatTipoPropiedadLine, trim } from "../agente-individual/lib/agenteResidencialPreviewFormat";
import type { BrNegocioPrePublishInventoryLang } from "./brNegocioPrePublishInventoryShellCopy";
import type { BrNegocioAdditionalInventoryPropertyDraft } from "./brNegocioAdditionalInventoryDraft";
import {
  brInventoryDraftLocationLine,
  brInventoryDraftPriceDisplay,
  brInventoryPropertySubtypeLabel,
  brInventoryPropertyTypeLabel,
  syncChildInventoryDraftMedia,
} from "./brNegocioAdditionalInventoryDraft";
import {
  channelLabelForInventoryCard,
  resolveChildDraftCategoria,
} from "./brNegocioInventoryChildContext";
import {
  brChildMediaGalleryDisplayUrls,
  brChildMediaPrimaryDisplayUrl,
  expandBrChildMediaSourceFields,
  hydrateBrChildMediaCanonical,
  isBrChildMediaDisplayableUrl,
  normalizeBrChildMediaImages,
  type BrChildMediaImage,
} from "./brNegocioChildMediaCanonical";
import {
  formatDetailCountDisplay,
  formatSqftDisplay,
  formatUsdWhole,
} from "@/app/(site)/clasificados/bienes-raices/shared/realEstateAddressPriceFormat";
import { formatBrCityStatePostalLine } from "@/app/lib/clasificados/bienes-raices/brLocationHelpers";

export type BrNegocioInventoryCardKind = "main" | "additional";

/** Six results-card gallery slots (images 2–7; image 1 is portraitPhotoUrl). */
export const BR_INVENTORY_GALLERY_SLOT_COUNT = 6;

export type BrNegocioInventoryCardModel = {
  kind: BrNegocioInventoryCardKind;
  /** Local draft id — additional only. */
  id?: string;
  title: string;
  priceDisplay: string;
  propertyTypeLine: string;
  cityState: string;
  bedrooms: string;
  bathrooms: string;
  interiorSqft: string;
  lotSqft: string;
  /** Image 1 — main portrait / cover. */
  photoUrl: string;
  /** Images 2–7 for results-card gallery preview slots. */
  gallerySlotUrls: string[];
  photoCount: number;
  statusLabel: string;
  roleLabel: string;
  leonixDraftNote: string;
};

function titleFallback(lang: BrNegocioPrePublishInventoryLang): string {
  return lang === "es" ? "Sin título" : "Untitled";
}

function mainPriceDisplay(price: string, lang: BrNegocioPrePublishInventoryLang): string {
  const formatted = formatUsdWhole(price);
  return formatted || (lang === "es" ? "Precio pendiente" : "Price pending");
}

/** Ready for <img src> without further resolve (IDB tokens are durable only). */
export function isDisplayableInventoryPhotoUrl(raw: string | undefined): boolean {
  return isBrChildMediaDisplayableUrl(raw ?? "");
}

function safePhotoUrl(raw: string | undefined): string {
  const u = trim(raw ?? "");
  return isBrChildMediaDisplayableUrl(u) ? u : "";
}

function inventoryGallerySlotUrls(photos: string[], primaryIndex: number): string[] {
  const cleaned = photos.map((u) => trim(String(u))).filter(Boolean);
  const primary = Math.min(Math.max(0, primaryIndex), Math.max(0, cleaned.length - 1));
  const gallery = cleaned.filter((_, index) => index !== primary);
  const slots: string[] = [];
  for (let i = 0; i < BR_INVENTORY_GALLERY_SLOT_COUNT; i++) {
    slots.push(safePhotoUrl(gallery[i]) || "");
  }
  return slots;
}

function childDraftMediaAliasInput(normalized: BrNegocioAdditionalInventoryPropertyDraft) {
  return {
    childId: normalized.id,
    fotosDataUrls: normalized.propertyForm?.fotosDataUrls ?? null,
    fotoPortadaIndex: normalized.propertyForm?.fotoPortadaIndex ?? normalized.primaryPhotoIndex,
    photoUrls: normalized.photoUrls,
    mainPhotoUrl: normalized.mainPhotoUrl,
    primaryPhotoIndex: normalized.primaryPhotoIndex,
  };
}

function cardFieldsFromCanonicalMedia(
  normalized: BrNegocioAdditionalInventoryPropertyDraft,
  images: BrChildMediaImage[],
  lang: BrNegocioPrePublishInventoryLang,
): BrNegocioInventoryCardModel {
  const channel = resolveChildDraftCategoria(normalized);
  const channelLabel = channelLabelForInventoryCard(channel, lang);
  const typeLabel = brInventoryPropertyTypeLabel(normalized.propertyType, lang);
  const subLabel = brInventoryPropertySubtypeLabel(normalized.propertyType, normalized.propertySubtype, lang);
  const typeLine = subLabel ? `${channelLabel} · ${typeLabel} · ${subLabel}` : `${channelLabel} · ${typeLabel}`;
  const copy = lang === "es"
    ? { role: "Propiedad adicional", status: "Borrador", leonix: "ID Leonix se generará al publicar" }
    : { role: "Additional property", status: "Draft", leonix: "Leonix ID generated on publish" };
  const sourceCount = expandBrChildMediaSourceFields(childDraftMediaAliasInput(normalized)).urls.length;

  return {
    kind: "additional",
    id: normalized.id,
    title: trim(normalized.title) || titleFallback(lang),
    priceDisplay: brInventoryDraftPriceDisplay(normalized.price, lang),
    propertyTypeLine: typeLine,
    cityState: brInventoryDraftLocationLine(normalized),
    bedrooms: trim(normalized.bedrooms),
    bathrooms: trim(normalized.bathrooms),
    interiorSqft: trim(normalized.interiorSqft),
    lotSqft: trim(normalized.lotSqft),
    photoUrl: brChildMediaPrimaryDisplayUrl(images),
    gallerySlotUrls: brChildMediaGalleryDisplayUrls(images, BR_INVENTORY_GALLERY_SLOT_COUNT),
    photoCount: Math.max(sourceCount, images.length),
    statusLabel: copy.status,
    roleLabel: copy.role,
    leonixDraftNote: copy.leonix,
  };
}

function negocioTypeLine(state: BienesRaicesNegocioFormState): string {
  const type = trim(state.tipoPropiedad);
  const sub = trim(state.propertySubtype);
  if (type && sub) return `${type} · ${sub}`;
  return type || sub || "—";
}

export function mapNegocioFormToMainInventoryCard(
  state: BienesRaicesNegocioFormState,
  lang: BrNegocioPrePublishInventoryLang,
): BrNegocioInventoryCardModel {
  const photos = state.media.photoUrls.filter((u) => trim(u));
  const idx = Math.min(Math.max(0, state.media.primaryImageIndex), Math.max(0, photos.length - 1));
  const copy = lang === "es"
    ? { role: "Propiedad principal", status: "Borrador", leonix: "ID Leonix se generará al publicar" }
    : { role: "Main property", status: "Draft", leonix: "Leonix ID generated on publish" };

  return {
    kind: "main",
    title: trim(state.titulo) || titleFallback(lang),
    priceDisplay: mainPriceDisplay(state.precio, lang),
    propertyTypeLine: negocioTypeLine(state),
    cityState: formatBrCityStatePostalLine(state.ciudad, state.estado, "", "United States"),
    bedrooms: trim(state.recamaras),
    bathrooms: trim(state.banosCompletos),
    interiorSqft: trim(state.piesCuadrados),
    lotSqft: trim(state.tamanoLote),
    photoUrl: safePhotoUrl(photos[idx]),
    gallerySlotUrls: inventoryGallerySlotUrls(photos, idx),
    photoCount: photos.length,
    statusLabel: copy.status,
    roleLabel: copy.role,
    leonixDraftNote: copy.leonix,
  };
}

export function mapAgenteFormToMainInventoryCard(
  state: AgenteIndividualResidencialFormState,
  lang: BrNegocioPrePublishInventoryLang,
): BrNegocioInventoryCardModel {
  const photos = (Array.isArray(state.fotosDataUrls) ? state.fotosDataUrls : [])
    .map((u) => trim(String(u)))
    .filter(Boolean);
  const idx = Math.min(Math.max(0, state.fotoPortadaIndex), Math.max(0, photos.length - 1));
  const locale = lang === "en" ? "en" : "es";
  const copy = lang === "es"
    ? { role: "Propiedad principal", status: "Borrador", leonix: "ID Leonix se generará al publicar" }
    : { role: "Main property", status: "Draft", leonix: "Leonix ID generated on publish" };

  return {
    kind: "main",
    title: trim(state.titulo) || titleFallback(lang),
    priceDisplay: mainPriceDisplay(state.precio, lang),
    propertyTypeLine: formatTipoPropiedadLine(state, locale),
    cityState: formatBrCityStatePostalLine(
      state.ciudad,
      state.direccionEstado,
      state.direccionCodigoPostal,
      state.direccionPais,
    ),
    bedrooms: trim(state.recamaras),
    bathrooms: trim(state.banos),
    interiorSqft: trim(state.tamanoInteriorSqft),
    lotSqft: trim(state.tamanoLoteSqft),
    photoUrl: safePhotoUrl(photos[idx]),
    gallerySlotUrls: inventoryGallerySlotUrls(photos, idx),
    photoCount: photos.length,
    statusLabel: copy.status,
    roleLabel: copy.role,
    leonixDraftNote: copy.leonix,
  };
}

export function mapAdditionalDraftToInventoryCard(
  draft: BrNegocioAdditionalInventoryPropertyDraft,
  lang: BrNegocioPrePublishInventoryLang,
): BrNegocioInventoryCardModel {
  const normalized = syncChildInventoryDraftMedia(draft);
  const images = normalizeBrChildMediaImages(childDraftMediaAliasInput(normalized));
  return cardFieldsFromCanonicalMedia(normalized, images, lang);
}

/** Async card map — resolves IDB tokens before cover/gallery projection (Autos hydrate-before-card). */
export async function mapAdditionalDraftToInventoryCardResolved(
  draft: BrNegocioAdditionalInventoryPropertyDraft,
  lang: BrNegocioPrePublishInventoryLang,
): Promise<BrNegocioInventoryCardModel> {
  const normalized = syncChildInventoryDraftMedia(draft);
  const images = await hydrateBrChildMediaCanonical(childDraftMediaAliasInput(normalized));
  return cardFieldsFromCanonicalMedia(normalized, images, lang);
}

/** Step 10 safety net — never show "No photo" when live editor state has displayable photos. */
export function applyLiveEditorPhotosToInventoryCard(
  card: BrNegocioInventoryCardModel,
  liveState: AgenteIndividualResidencialFormState,
): BrNegocioInventoryCardModel {
  if (isDisplayableInventoryPhotoUrl(card.photoUrl)) return card;
  const images = normalizeBrChildMediaImages({
    childId: card.id ?? "live-child",
    fotosDataUrls: liveState.fotosDataUrls,
    fotoPortadaIndex: liveState.fotoPortadaIndex,
  });
  const photoUrl = brChildMediaPrimaryDisplayUrl(images);
  if (!photoUrl && !images.length) return card;
  return {
    ...card,
    photoUrl: photoUrl || card.photoUrl,
    gallerySlotUrls: brChildMediaGalleryDisplayUrls(images, BR_INVENTORY_GALLERY_SLOT_COUNT),
    photoCount: Math.max(card.photoCount, images.length),
  };
}

/** Beds / baths / sqft line for card facet row. */
export function brInventoryCardSpecsLine(card: BrNegocioInventoryCardModel, lang: BrNegocioPrePublishInventoryLang): string {
  const parts: string[] = [];
  const beds = formatDetailCountDisplay(card.bedrooms);
  const baths = formatDetailCountDisplay(card.bathrooms);
  const interior = formatSqftDisplay(card.interiorSqft);
  const lot = formatSqftDisplay(card.lotSqft);

  if (beds) parts.push(lang === "es" ? `${beds} rec` : `${beds} bd`);
  if (baths) parts.push(lang === "es" ? `${baths} ba` : `${baths} ba`);
  if (interior) parts.push(interior);
  else if (lot) parts.push(lang === "es" ? `Lote ${lot}` : `Lot ${lot}`);
  return parts.join(" · ");
}
