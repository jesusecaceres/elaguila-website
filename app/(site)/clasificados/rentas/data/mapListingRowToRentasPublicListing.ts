/**
 * Maps Supabase `listings` rows (category `rentas`) → `RentasPublicListing` for browse/detail.
 * Resilient to partial rows; discovery filters read numeric rent from `rentMonthly` and machine keys in `detail_pairs`.
 */

import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { parseLeonixImageUrlsFromDescription, stripLeonixPublishedDescriptionBody } from "@/app/clasificados/lib/leonixListingGalleryMarker";
import {
  parseLeonixListingContract,
  parseLeonixMachineFacetRead,
  type LeonixClasificadosBranch,
} from "@/app/clasificados/lib/leonixRealEstateListingContract";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import { parseRentasDetailMachineRead } from "@/app/clasificados/rentas/lib/rentasDetailPairRead";
import { rentasShowExactAddressFromDetailPairs } from "@/app/clasificados/rentas/lib/leonixRentasShowing";
import { buildRentasPublishedFlowExtensionRows } from "@/app/clasificados/rentas/shared/rentasRentalTypeApply";
import { normalizeLeonixHttpsUrl } from "@/app/clasificados/lib/leonixContactSocialNormalize";
import { parseBusinessMeta } from "@/app/clasificados/config/businessListingContract";
import {
  enrichContactChannelsFromBusinessMeta,
  parseLeonixContactChannelsV1FromDetailPairs,
} from "@/app/clasificados/lib/leonixContactChannelsV1";
import { augmentLeonixDetailPairsFromStructuredColumns } from "@/app/clasificados/lib/leonixListingStructuredPayload";
import {
  filterRentasPhotoUrlList,
  isRentasPlaceholderImageUrl,
  rentasPublishedVideoShouldAppearInGallery,
} from "@/app/clasificados/rentas/lib/rentasListingPublishedMediaGuards";
import { rentasListingPromotedFromRow } from "@/app/clasificados/rentas/lib/rentasListingPromotionFromRow";

function trim(s: unknown): string {
  if (s == null) return "";
  return typeof s === "string" ? s.trim() : String(s).trim();
}

function businessMetaFromRow(row: ListingRowLike): {
  description?: string;
  marca?: string;
  agentName?: string;
  redesFromMeta?: string;
} {
  const raw = row.business_meta;
  if (typeof raw !== "string" || !raw.trim()) return {};
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const d = trim(o.negocioDescripcion);
    const marca = trim(o.negocioNombreCorreduria);
    const agentName = trim(o.negocioAgente);
    const redesFromMeta = trim(o.negocioRedes);
    return {
      description: d || undefined,
      marca: marca || undefined,
      agentName: agentName || undefined,
      redesFromMeta: redesFromMeta || undefined,
    };
  } catch {
    return {};
  }
}

function sanitizeHttpUrl(raw: string | null | undefined): string | undefined {
  const u = trim(raw ?? "");
  if (!u || !/^https?:\/\//i.test(u)) return undefined;
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return u;
  } catch {
    return undefined;
  }
}

function rentasCatalogEligibleFromMachineStatus(code: string | null): boolean {
  const s = (code ?? "").trim().toLowerCase();
  if (!s) return true;
  if (s === "disponible" || s === "pendiente") return true;
  if (s === "bajo_contrato" || s === "rentado") return false;
  return true;
}

function pairValue(detailPairs: unknown, needle: string): string | null {
  if (!Array.isArray(detailPairs)) return null;
  const n = needle.toLowerCase();
  for (const p of detailPairs) {
    if (!p || typeof p !== "object") continue;
    const o = p as { label?: string; value?: string };
    const lab = trim(o.label).toLowerCase();
    if (lab === n || lab.includes(n)) {
      const v = trim(o.value);
      return v || null;
    }
  }
  return null;
}

function galleryUrls(images: unknown): string[] | undefined {
  if (!Array.isArray(images) || !images.length) return undefined;
  const out: string[] = [];
  for (const item of images) {
    if (typeof item === "string" && item.trim()) out.push(item.trim());
    else if (item && typeof item === "object") {
      const u = (item as Record<string, unknown>).url ?? (item as Record<string, unknown>).src;
      if (typeof u === "string" && u.trim()) out.push(u.trim());
    }
  }
  return out.length ? out : undefined;
}

function firstNonPlaceholderImageUrl(images: unknown): string {
  if (images == null || !Array.isArray(images) || !images.length) return "";
  for (const item of images) {
    let u = "";
    if (typeof item === "string" && item.trim()) u = item.trim();
    else if (item && typeof item === "object") {
      const raw = (item as Record<string, unknown>).url ?? (item as Record<string, unknown>).src;
      if (typeof raw === "string" && raw.trim()) u = raw.trim();
    }
    if (u && !isRentasPlaceholderImageUrl(u)) return u;
  }
  return "";
}

function branchToSeller(branch: LeonixClasificadosBranch | null): "privado" | "negocio" {
  if (branch === "rentas_negocio" || branch === "bienes_raices_negocio") return "negocio";
  return "privado";
}

function rentDisplayFromPrice(price: unknown, lang: "es" | "en"): string {
  const n = typeof price === "number" && Number.isFinite(price) ? price : Number(String(price ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return lang === "es" ? "Consultar" : "Inquire";
  try {
    const cur = new Intl.NumberFormat(lang === "es" ? "es-MX" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Math.round(n));
    return lang === "es" ? `${cur} / mes` : `${cur} / mo`;
  } catch {
    return `$${Math.round(n)} / mo`;
  }
}

function bedsFromPairs(dp: unknown): string {
  return (
    pairValue(dp, "recámaras") ??
    pairValue(dp, "recamaras") ??
    pairValue(dp, "bedrooms") ??
    pairValue(dp, "habitaciones") ??
    "—"
  );
}

function bathsFromPairs(dp: unknown): string {
  return pairValue(dp, "baños") ?? pairValue(dp, "baths") ?? pairValue(dp, "bathrooms") ?? "—";
}

function sqftFromPairs(dp: unknown): string {
  return (
    pairValue(dp, "interior (ft²)") ??
    pairValue(dp, "interior (ft2)") ??
    pairValue(dp, "tamaño interior") ??
    pairValue(dp, "interior") ??
    pairValue(dp, "superficie") ??
    pairValue(dp, "sqft") ??
    pairValue(dp, "m²") ??
    "—"
  );
}

function amuebladoFromPairs(dp: unknown): boolean | undefined {
  const a =
    pairValue(dp, "amueblado") ??
    pairValue(dp, "furnished") ??
    "";
  const t = a.toLowerCase();
  if (t.includes("amuebl") || t === "yes" || t === "sí" || t === "si") return true;
  if (t.includes("sin amuebl") || t === "unfurnished" || t === "no") return false;
  return undefined;
}

function mascotasFromPairs(dp: unknown): boolean | undefined {
  const a = pairValue(dp, "mascotas") ?? pairValue(dp, "pets") ?? "";
  const t = a.toLowerCase();
  if (t.includes("permit") || t === "yes" || t === "sí" || t === "si") return true;
  if (t.includes("no permit") || t === "no") return false;
  return undefined;
}

function sqftNumericFromText(s: string): number | null {
  if (!s || s === "—") return null;
  const n = Number(String(s).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function furnishedFromRentasCodes(
  code: string | null,
  human: boolean | undefined,
  machine: boolean | null,
): boolean | undefined {
  const c = (code ?? "").trim().toLowerCase();
  if (c === "amueblado") return true;
  if (c === "sin_amueblar") return false;
  if (human !== undefined) return human;
  if (machine === true || machine === false) return machine;
  return undefined;
}

function petsFromRentasCodes(code: string | null, human: boolean | undefined, machine: boolean | null): boolean | undefined {
  const c = (code ?? "").trim().toLowerCase();
  if (c === "permitidas") return true;
  if (c === "no_permitidas") return false;
  if (human !== undefined) return human;
  if (machine === true || machine === false) return machine;
  return undefined;
}

function roomBathPublicLabel(code: string | null | undefined): string | undefined {
  const c = (code ?? "").trim();
  const m: Record<string, string> = {
    privado: "privado",
    compartido: "compartido",
    no_incluido: "no incluido",
  };
  return m[c] ?? (c || undefined);
}

function roomKitchenPublicLabel(code: string | null | undefined): string | undefined {
  const c = (code ?? "").trim();
  const m: Record<string, string> = {
    privada: "privada",
    compartida: "compartida",
    no_incluida: "no incluida",
  };
  return m[c] ?? (c || undefined);
}

function triStateSiNo(raw: string | null | undefined): boolean | null {
  const t = (raw ?? "").trim().toLowerCase();
  if (t === "si" || t === "sí") return true;
  if (t === "no") return false;
  return null;
}

export type ListingRowLike = Record<string, unknown>;

/**
 * Returns `null` if the row is not a Rentas listing we can surface publicly.
 */
export function mapListingRowToRentasPublicListing(row: ListingRowLike, lang: "es" | "en" = "es"): RentasPublicListing | null {
  const cat = String(row.category ?? "").toLowerCase();
  if (cat !== "rentas") return null;

  /** Legacy / partially migrated rows may omit `status`; treat empty as active when mapping public browse. */
  const statusRaw = String(row.status ?? "").trim().toLowerCase();
  const status = statusRaw === "" ? "active" : statusRaw;
  const published = row.is_published !== false;
  const detailPairs = augmentLeonixDetailPairsFromStructuredColumns(row.detail_pairs, row.listing_json, row.contact_json);
  const lx = parseLeonixListingContract(detailPairs);
  const mf = parseLeonixMachineFacetRead(detailPairs);
  const rx = parseRentasDetailMachineRead(detailPairs);
  const availabilityRaw = (rx.listingStatus ?? "").trim().toLowerCase();
  const rentasListingAvailability: RentasPublicListing["rentasListingAvailability"] =
    availabilityRaw === "disponible" ||
    availabilityRaw === "pendiente" ||
    availabilityRaw === "bajo_contrato" ||
    availabilityRaw === "rentado"
      ? availabilityRaw
      : null;
  const browseActive =
    status === "active" && published && rentasCatalogEligibleFromMachineStatus(rx.listingStatus);
  const branchSeller = branchToSeller(lx.branch);
  const categoria: BrNegocioCategoriaPropiedad =
    lx.categoriaPropiedad === "residencial" || lx.categoriaPropiedad === "comercial" || lx.categoriaPropiedad === "terreno_lote"
      ? lx.categoriaPropiedad
      : "residencial";

  const id = trim(row.id);
  if (!id) return null;

  const title = trim(row.title) || (lang === "es" ? "Renta" : "Rental");
  const city = trim(row.city) || undefined;
  const zipRaw = trim(row.zip);
  const postalCode = zipRaw.replace(/\D/g, "").slice(0, 10) || mf.postalCode?.replace(/\D/g, "").slice(0, 10) || undefined;
  const estadoPair = trim(pairValue(detailPairs, "Estado") ?? trim(row.state));
  const zonaVecindario = trim(
    pairValue(detailPairs, "Zona o vecindario") ??
      pairValue(detailPairs, "zona o vecindario") ??
      pairValue(detailPairs, "Colonia") ??
      "",
  );
  const showExactAddress = rentasShowExactAddressFromDetailPairs(detailPairs);
  const publicLocationLine =
    pairValue(detailPairs, "Ubicación") ??
    pairValue(detailPairs, "Dirección") ??
    null;
  const approxParts = [city, estadoPair].filter(Boolean);
  const approxLine =
    (approxParts.length ? approxParts.join(", ") : "") +
    (approxParts.length && zonaVecindario ? ` · ${zonaVecindario}` : zonaVecindario ? zonaVecindario : "") ||
    (postalCode && city ? `${city} ${postalCode}` : city || postalCode || "");
  const addressLine = showExactAddress
    ? trim(publicLocationLine) ||
      [city, postalCode].filter(Boolean).join(city && postalCode ? ", " : "") ||
      city ||
      postalCode ||
      "—"
    : approxLine || trim(publicLocationLine) || "—";
  const cityStateZip = [city, estadoPair].filter(Boolean).join(", ");
  const resultBrowseLocation = (() => {
    if (cityStateZip && zonaVecindario) return `${cityStateZip} · ${zonaVecindario}`;
    if (cityStateZip) return cityStateZip;
    if (zonaVecindario && postalCode) return `${zonaVecindario} · ${postalCode}`;
    if (zonaVecindario) return zonaVecindario;
    if (postalCode && city) return `${city} · ${postalCode}`;
    if (city) return city;
    if (postalCode) return postalCode;
    return "";
  })();

  const priceNum =
    typeof row.price === "number" && Number.isFinite(row.price)
      ? Math.round(row.price)
      : Math.round(Number(String(row.price ?? "").replace(/[^0-9.]/g, "")) || 0);

  const depDigits = rx.depositUsdDigits ?? "";
  const depNum = depDigits ? Math.round(Number(String(depDigits).replace(/\D/g, "")) || 0) : 0;
  const depositUsd = depNum > 0 ? depNum : undefined;

  const phoneRaw = trim(row.contact_phone);
  const emailRaw = trim(row.contact_email);
  const contactPhone = phoneRaw.replace(/\D/g, "").length >= 10 ? phoneRaw : undefined;
  const contactEmail = emailRaw.includes("@") ? emailRaw : undefined;
  const smsRaw = (rx.contactSmsDigits ?? "").replace(/\D/g, "");
  const contactSmsDigits = smsRaw.length >= 10 ? smsRaw.slice(0, 15) : undefined;
  const waRaw = (rx.contactWhatsappDigits ?? "").replace(/\D/g, "");
  const contactWhatsappDigits = waRaw.length >= 10 ? waRaw.slice(0, 15) : undefined;
  const contactNote =
    pairValue(detailPairs, "Mensaje del contacto") ??
    pairValue(detailPairs, "Nota para interesados") ??
    undefined;

  const galRaw = galleryUrls(row.images);
  const galFiltered = galRaw?.length ? filterRentasPhotoUrlList(galRaw) : [];
  const galFromImages = galFiltered.length ? galFiltered : undefined;
  const galFromDesc = filterRentasPhotoUrlList(parseLeonixImageUrlsFromDescription(row.description));
  const gal =
    galFromImages && galFromImages.length ? galFromImages : galFromDesc.length ? galFromDesc : undefined;
  const imgFromColumn = firstNonPlaceholderImageUrl(row.images);
  const img = imgFromColumn || (gal?.[0] ?? "") || (galFromDesc[0] ?? "");
  const imageUrl = img || "/logo.png";

  const halfDigits = rx.halfBathsDigits ?? "";
  const halfParsed = Math.round(Number(String(halfDigits).replace(/\D/g, "")) || 0);
  const halfBathsCount = halfParsed > 0 ? halfParsed : null;

  const mapUrl = sanitizeHttpUrl(rx.mapUrl);
  const muxPid = trim(row.mux_playback_id as string | undefined);
  const muxThumbRow = trim(row.mux_thumbnail_url as string | undefined);
  const muxHls = muxPid ? `https://stream.mux.com/${muxPid}.m3u8` : "";
  const muxPoster =
    muxThumbRow ||
    (muxPid ? `https://image.mux.com/${muxPid}/thumbnail.jpg` : "");
  const videoUrlSan = sanitizeHttpUrl(rx.videoUrl);
  const pairVideo =
    videoUrlSan && rentasPublishedVideoShouldAppearInGallery(videoUrlSan) ? videoUrlSan : undefined;
  const muxVideo = muxHls && rentasPublishedVideoShouldAppearInGallery(muxHls) ? muxHls : undefined;
  const videoUrl = muxVideo ?? pairVideo;
  const videoPosterUrl = muxVideo && muxPoster && /^https:\/\//i.test(muxPoster) ? muxPoster : undefined;
  const bizMeta = businessMetaFromRow(row);
  const businessSocial = (rx.businessSocial ?? "").trim() || bizMeta.redesFromMeta || undefined;
  const businessMarca = bizMeta.marca;
  const businessAgentName = bizMeta.agentName;
  const businessDescription = bizMeta.description;

  const publishedAt =
    trim(row.republish_sort_at) ||
    trim(row.republished_at) ||
    trim(row.published_at) ||
    trim(row.created_at) ||
    trim(row.updated_at) ||
    undefined;

  const biz = trim(row.business_name);
  const sellerDisplay =
    branchSeller === "negocio"
      ? { es: biz || "Negocio", en: biz || "Business" }
      : { es: "Particular", en: "Private seller" };

  const promoted = rentasListingPromotedFromRow(row);
  const badges: string[] = branchSeller === "negocio" ? ["negocio"] : ["privado"];
  if (promoted) badges.push("destacada");

  const bedsHuman = bedsFromPairs(detailPairs);
  const bathsHuman = bathsFromPairs(detailPairs);
  const sqftStr = sqftFromPairs(detailPairs);
  const fullBaths = pairValue(detailPairs, "Baños completos") ?? undefined;
  const halfBaths = pairValue(detailPairs, "Medios baños") ?? undefined;
  const lotSqft =
    pairValue(detailPairs, "Lote (ft²)") ??
    pairValue(detailPairs, "Lote (ft2)") ??
    pairValue(detailPairs, "Tamaño del lote") ??
    undefined;
  const yearBuilt = pairValue(detailPairs, "Año de construcción") ?? undefined;
  const condition = pairValue(detailPairs, "Condición") ?? undefined;
  const parking = pairValue(detailPairs, "Estacionamiento") ?? undefined;
  const beds = mf.bedroomsCount != null ? String(mf.bedroomsCount) : bedsHuman;
  const baths = mf.bathroomsCount != null ? String(mf.bathroomsCount) : bathsHuman;

  const amuebladoHuman = amuebladoFromPairs(detailPairs);
  const mascotasHuman = mascotasFromPairs(detailPairs);
  const amueblado = furnishedFromRentasCodes(rx.furnishedCode, amuebladoHuman, mf.furnished);
  const mascotasPermitidas = petsFromRentasCodes(rx.petsCode, mascotasHuman, mf.petsAllowed);

  const rentalTypeCode = (rx.rentalTypeCode ?? "").trim() || undefined;
  const rentalTypeCustom = (rx.rentalTypeCustom ?? "").trim() || undefined;
  const leaseConditionsRaw =
    (rx.leaseConditions ?? "").trim() ||
    (pairValue(detailPairs, "Condiciones importantes") ?? "").trim() ||
    "";
  const leaseConditions = leaseConditionsRaw || undefined;
  const rentasRoomBathLabel = roomBathPublicLabel(rx.roomBathKind) ?? undefined;
  const rentasRoomKitchenLabel = roomKitchenPublicLabel(rx.roomKitchenKind) ?? undefined;
  const rentasRoomMaxOccupants = (rx.roomMaxOccupants ?? "").trim() || undefined;
  const rentasStorageAccess24h = triStateSiNo(rx.storageAccess24h);
  const rentasStorageSecurity = triStateSiNo(rx.storageSecurity);
  const sharedSpacePreferences =
    (pairValue(detailPairs, "Preferencias del espacio compartido") ?? "").trim() || undefined;

  const ch0 = parseLeonixContactChannelsV1FromDetailPairs(detailPairs);
  const bmParsed = parseBusinessMeta(row.business_meta);
  const contactChannels = enrichContactChannelsFromBusinessMeta(ch0, bmParsed);

  const flowExtensionRows = buildRentasPublishedFlowExtensionRows(
    {
      rentalTypeCode,
      categoriaPropiedad: categoria,
      rentasRoomBathLabel,
      rentasRoomKitchenLabel,
      rentasRoomMaxOccupants,
      beds,
      baths,
      sqft: sqftStr,
    },
    (label) => pairValue(detailPairs, label),
  );

  return {
    id,
    slug: id,
    leonixAdId: trim(row.leonix_ad_id as string | undefined) || undefined,
    title,
    imageUrl,
    galleryUrls: gal,
    rentDisplay: rentDisplayFromPrice(row.price, lang),
    rentMonthly: priceNum > 0 ? priceNum : undefined,
    depositUsd,
    contactPhone,
    contactEmail,
    contactSmsDigits,
    contactWhatsappDigits,
    contactNote,
    contactChannels,
    addressLine,
    resultBrowseLocation: resultBrowseLocation || undefined,
    city,
    stateRegion: estadoPair || undefined,
    postalCode,
    publishedAt,
    browseActive,
    rentasListingAvailability,
    beds,
    baths,
    halfBathsCount,
    fullBaths,
    halfBaths,
    sqft: sqftStr,
    lotSqft,
    yearBuilt,
    condition,
    parking,
    interiorSqftApprox: sqftNumericFromText(sqftStr),
    parkingSpots: mf.parkingSpots,
    pool: mf.pool,
    propertySubtype: mf.propertySubtype,
    resultsPropertyKind: mf.resultsPropertyKind,
    highlightSlugs: mf.highlightSlugs?.length ? [...mf.highlightSlugs] : undefined,
    leaseTermCode: rx.leaseTermCode ?? undefined,
    availabilityNote: rx.availabilityNote ?? undefined,
    servicesIncluded: rx.servicesIncluded ?? undefined,
    requirements: rx.requirements ?? undefined,
    sharedSpacePreferences,
    rentalTypeCode,
    rentalTypeCustom,
    leaseConditions,
    rentasRoomBathLabel,
    rentasRoomKitchenLabel,
    rentasRoomMaxOccupants,
    rentasStorageAccess24h,
    rentasStorageSecurity,
    businessLicense: rx.businessLicense ?? undefined,
    businessWebsite: rx.businessWebsite ?? undefined,
    businessSocial,
    businessMarca,
    businessAgentName,
    businessDescription,
    showExactAddress,
    flowExtensionRows: flowExtensionRows.length ? flowExtensionRows : undefined,
    showingByAppointment: rx.showingByAppointment,
    showingAvailability: rx.showingAvailability ?? undefined,
    showingInstructions: rx.showingInstructions ?? undefined,
    virtualTourUrl: normalizeLeonixHttpsUrl(rx.virtualTourUrl) ?? undefined,
    mapUrl,
    videoUrl,
    videoPosterUrl,
    categoriaPropiedad: categoria,
    branch: branchSeller,
    badges,
    promoted,
    recencyRank: publishedAt ? Math.min(100, Math.floor(Date.parse(publishedAt) / 86400000) % 100) : 50,
    amueblado,
    mascotasPermitidas,
    description: (() => {
      const cleaned = stripLeonixPublishedDescriptionBody(row.description);
      const es = cleaned || "Anuncio publicado en Leonix Rentas.";
      const en = cleaned || "Listing published on Leonix Rentals.";
      return { es, en };
    })(),
    sellerDisplay,
  };
}
