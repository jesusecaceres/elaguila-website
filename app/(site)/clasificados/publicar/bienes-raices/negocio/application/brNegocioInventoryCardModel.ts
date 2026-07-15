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
  childInventoryCoverPhotoUrl,
  syncChildInventoryDraftMedia,
} from "./brNegocioAdditionalInventoryDraft";
import {
  channelLabelForInventoryCard,
  resolveChildDraftCategoria,
} from "./brNegocioInventoryChildContext";
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
function isDisplayableInventoryPhotoUrl(raw: string | undefined): boolean {
  const u = trim(raw ?? "");
  return Boolean(u && (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("data:image/")));
}

function safePhotoUrl(raw: string | undefined): string {
  const u = trim(raw ?? "");
  if (!u) return "";
  // Keep IDB tokens for the card layer to resolve; never invent bogus URLs.
  if (isDisplayableInventoryPhotoUrl(u) || u.startsWith("__LX_BR_AGENTE_IDB__")) return u;
  return "";
}

export { isDisplayableInventoryPhotoUrl };

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

function resolveAdditionalDraftCardPhotoUrl(
  normalized: BrNegocioAdditionalInventoryPropertyDraft,
): string {
  const photos = normalized.photoUrls.map((u) => trim(String(u))).filter(Boolean);
  const fromCover = safePhotoUrl(childInventoryCoverPhotoUrl(normalized));
  if (fromCover) return fromCover;
  const idx = Math.min(
    Math.max(0, normalized.primaryPhotoIndex),
    Math.max(0, photos.length - 1),
  );
  for (const candidate of [photos[idx], photos[0], ...photos, normalized.mainPhotoUrl]) {
    const safe = safePhotoUrl(candidate);
    if (safe) return safe;
  }
  return "";
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
  const channel = resolveChildDraftCategoria(normalized);
  const channelLabel = channelLabelForInventoryCard(channel, lang);
  const typeLabel = brInventoryPropertyTypeLabel(normalized.propertyType, lang);
  const subLabel = brInventoryPropertySubtypeLabel(normalized.propertyType, normalized.propertySubtype, lang);
  const typeLine = subLabel ? `${channelLabel} · ${typeLabel} · ${subLabel}` : `${channelLabel} · ${typeLabel}`;
  const copy = lang === "es"
    ? { role: "Propiedad adicional", status: "Borrador", leonix: "ID Leonix se generará al publicar" }
    : { role: "Additional property", status: "Draft", leonix: "Leonix ID generated on publish" };
  const photos = normalized.photoUrls.filter((u) => trim(String(u)));
  const primary = Math.min(Math.max(0, normalized.primaryPhotoIndex), Math.max(0, photos.length - 1));

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
    photoUrl: resolveAdditionalDraftCardPhotoUrl(normalized),
    gallerySlotUrls: inventoryGallerySlotUrls(photos, primary),
    photoCount: photos.length,
    statusLabel: copy.status,
    roleLabel: copy.role,
    leonixDraftNote: copy.leonix,
  };
}

/** Step 10 safety net — never show "No photo" when live editor state has displayable photos. */
export function applyLiveEditorPhotosToInventoryCard(
  card: BrNegocioInventoryCardModel,
  liveState: AgenteIndividualResidencialFormState,
): BrNegocioInventoryCardModel {
  // IDB tokens are not displayable — do not short-circuit over live inlined URLs.
  if (isDisplayableInventoryPhotoUrl(card.photoUrl)) return card;
  const photos = (Array.isArray(liveState.fotosDataUrls) ? liveState.fotosDataUrls : [])
    .map((u) => trim(String(u)))
    .filter(Boolean);
  if (!photos.length) return card;
  const idx = Math.min(Math.max(0, liveState.fotoPortadaIndex), Math.max(0, photos.length - 1));
  for (const candidate of [photos[idx], photos[0], ...photos]) {
    const photoUrl = safePhotoUrl(candidate);
    if (photoUrl) {
      return {
        ...card,
        photoUrl,
        gallerySlotUrls: inventoryGallerySlotUrls(photos, idx),
        photoCount: Math.max(card.photoCount, photos.length),
      };
    }
  }
  return { ...card, gallerySlotUrls: inventoryGallerySlotUrls(photos, idx), photoCount: Math.max(card.photoCount, photos.length) };
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
