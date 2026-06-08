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
} from "./brNegocioAdditionalInventoryDraft";
import {
  formatDetailCountDisplay,
  formatSqftDisplay,
  formatUsdWhole,
} from "@/app/(site)/clasificados/bienes-raices/shared/realEstateAddressPriceFormat";

export type BrNegocioInventoryCardKind = "main" | "additional";

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
  photoUrl: string;
  statusLabel: string;
  roleLabel: string;
};

function cityStateLine(city: string, state: string): string {
  const c = city.trim();
  const st = state.trim();
  if (c && st) return `${c}, ${st}`;
  return c || st || "—";
}

function titleFallback(lang: BrNegocioPrePublishInventoryLang): string {
  return lang === "es" ? "Sin título" : "Untitled";
}

function mainPriceDisplay(price: string, lang: BrNegocioPrePublishInventoryLang): string {
  const formatted = formatUsdWhole(price);
  return formatted || (lang === "es" ? "Precio pendiente" : "Price pending");
}

function safePhotoUrl(raw: string | undefined): string {
  const u = trim(raw ?? "");
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("data:image/")) return u;
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
    ? { role: "Propiedad principal", status: "Borrador principal" }
    : { role: "Main property", status: "Main draft" };

  return {
    kind: "main",
    title: trim(state.titulo) || titleFallback(lang),
    priceDisplay: mainPriceDisplay(state.precio, lang),
    propertyTypeLine: negocioTypeLine(state),
    cityState: cityStateLine(state.ciudad, state.estado),
    bedrooms: trim(state.recamaras),
    bathrooms: trim(state.banosCompletos),
    interiorSqft: trim(state.piesCuadrados),
    lotSqft: trim(state.tamanoLote),
    photoUrl: safePhotoUrl(photos[idx]),
    statusLabel: copy.status,
    roleLabel: copy.role,
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
    ? { role: "Propiedad principal", status: "Borrador principal" }
    : { role: "Main property", status: "Main draft" };

  return {
    kind: "main",
    title: trim(state.titulo) || titleFallback(lang),
    priceDisplay: mainPriceDisplay(state.precio, lang),
    propertyTypeLine: formatTipoPropiedadLine(state, locale),
    cityState: cityStateLine(state.ciudad, state.direccionEstado),
    bedrooms: trim(state.recamaras),
    bathrooms: trim(state.banos),
    interiorSqft: trim(state.tamanoInteriorSqft),
    lotSqft: trim(state.tamanoLoteSqft),
    photoUrl: safePhotoUrl(photos[idx]),
    statusLabel: copy.status,
    roleLabel: copy.role,
  };
}

export function mapAdditionalDraftToInventoryCard(
  draft: BrNegocioAdditionalInventoryPropertyDraft,
  lang: BrNegocioPrePublishInventoryLang,
): BrNegocioInventoryCardModel {
  const typeLabel = brInventoryPropertyTypeLabel(draft.propertyType, lang);
  const subLabel = brInventoryPropertySubtypeLabel(draft.propertyType, draft.propertySubtype, lang);
  const typeLine = subLabel ? `${typeLabel} · ${subLabel}` : typeLabel;
  const copy = lang === "es"
    ? { role: "Propiedad adicional", status: "Borrador — aún no publicado" }
    : { role: "Additional property", status: "Draft — not published yet" };

  return {
    kind: "additional",
    id: draft.id,
    title: trim(draft.title) || titleFallback(lang),
    priceDisplay: brInventoryDraftPriceDisplay(draft.price, lang),
    propertyTypeLine: typeLine,
    cityState: brInventoryDraftLocationLine(draft),
    bedrooms: trim(draft.bedrooms),
    bathrooms: trim(draft.bathrooms),
    interiorSqft: trim(draft.interiorSqft),
    lotSqft: trim(draft.lotSqft),
    photoUrl: safePhotoUrl(childInventoryCoverPhotoUrl(draft)),
    statusLabel: copy.status,
    roleLabel: copy.role,
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
