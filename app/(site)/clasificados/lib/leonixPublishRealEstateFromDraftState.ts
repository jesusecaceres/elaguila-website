/**
 * Leonix BR + Rentas: draft form state → same `detail_pairs` / contact contract as preview → Supabase `listings`.
 * Use these from preview pages (and optionally from a future “Publish” step on the form).
 */

import type { BienesRaicesPrivadoFormState } from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import { mapBienesRaicesPrivadoStateToPreviewVm } from "@/app/clasificados/publicar/bienes-raices/privado/application/mapping/mapBienesRaicesPrivadoStateToPreviewVm";
import { mapRentasPrivadoStateToPreviewVm } from "@/app/clasificados/publicar/rentas/privado/application/mapping/mapRentasPrivadoStateToPreviewVm";
import type { RentasPrivadoFormState } from "@/app/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";
import { mapBienesRaicesNegocioStateToPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm";
import { mapRentasNegocioStateToPreviewVm } from "@/app/clasificados/publicar/rentas/negocio/application/mapping/mapRentasNegocioStateToPreviewVm";
import { rentasNegocioToBienesRaicesNegocioState } from "@/app/clasificados/publicar/rentas/negocio/application/mapping/rentasNegocioToBienesRaicesNegocioState";
import type { BienesRaicesNegocioFormState } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState";
import type { RentasNegocioFormState } from "@/app/clasificados/publicar/rentas/negocio/schema/rentasNegocioFormState";
import { mergeLeonixListingContractDetailPairs } from "@/app/clasificados/lib/leonixRealEstatePersistContract";
import {
  buildDetailPairsFromBienesRaicesNegocioPreviewVm,
  buildDetailPairsFromBienesRaicesPrivadoPreviewVm,
} from "@/app/clasificados/lib/leonixRealEstateDetailPairsFromPreviewVm";
import { inferCategoriaPropiedadFromBienesNegocioState } from "@/app/clasificados/lib/leonixInferCategoriaPropiedad";
import { buildBusinessMetaJsonFromBienesRaicesNegocioState } from "@/app/clasificados/lib/leonixNegocioBusinessMetaFromFormState";
import {
  publishLeonixRealEstateListingCore,
  type PublishLeonixRealEstateListingCoreResult,
} from "@/app/clasificados/lib/leonixPublishRealEstateListingCore";

function digitsOnly(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
}

function trim(s: unknown): string {
  if (s == null) return "";
  return typeof s === "string" ? s.trim() : String(s).trim();
}

function priceNumberFromDigitsString(raw: string): number {
  const d = String(raw ?? "").replace(/[^0-9.]/g, "");
  const n = Number(d);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

function privadoSellerContact(seller: {
  telefono?: string;
  whatsapp?: string;
  correo?: string;
}): { phone: string | null; email: string | null } {
  const phone = digitsOnly(seller.telefono ?? "") || digitsOnly(seller.whatsapp ?? "");
  const email = trim(seller.correo) || null;
  return { phone: phone.length >= 10 ? phone.slice(0, 15) : null, email };
}

function negocioOperationFromBienes(s: BienesRaicesNegocioFormState): "sale" | "rent" {
  return s.publicationType === "residencial_renta" ? "rent" : "sale";
}

function negocioContactAndBusinessName(s: BienesRaicesNegocioFormState): {
  phone: string | null;
  email: string | null;
  businessName: string | null;
} {
  const adv = s.advertiserType;
  if (adv === "agente_individual") {
    const id = s.identityAgente;
    const phone = digitsOnly(id.telDirecto) || digitsOnly(id.telOficina);
    return {
      phone: phone.length >= 10 ? phone.slice(0, 15) : null,
      email: trim(id.email) || null,
      businessName: trim(id.brokerage) || trim(s.titulo) || null,
    };
  }
  if (adv === "equipo_agentes") {
    const id = s.identityEquipo;
    const phone = digitsOnly(id.telGeneral);
    return {
      phone: phone.length >= 10 ? phone.slice(0, 15) : null,
      email: trim(id.email) || null,
      businessName: trim(id.nombreEquipo) || trim(s.titulo) || null,
    };
  }
  if (adv === "oficina_brokerage") {
    const id = s.identityOficina;
    const phone = digitsOnly(id.telPrincipal);
    return {
      phone: phone.length >= 10 ? phone.slice(0, 15) : null,
      email: trim(id.email) || null,
      businessName: trim(id.nombreOficina) || trim(s.titulo) || null,
    };
  }
  if (adv === "constructor_desarrollador") {
    const id = s.identityConstructor;
    const phone = digitsOnly(id.tel);
    return {
      phone: phone.length >= 10 ? phone.slice(0, 15) : null,
      email: trim(id.email) || null,
      businessName: trim(id.nombreDesarrollador) || trim(s.titulo) || null,
    };
  }
  return { phone: null, email: null, businessName: trim(s.titulo) || null };
}

export async function publishLeonixListingFromBienesRaicesPrivadoDraft(
  state: BienesRaicesPrivadoFormState,
  lang: "es" | "en"
): Promise<PublishLeonixRealEstateListingCoreResult> {
  const vm = mapBienesRaicesPrivadoStateToPreviewVm(state);
  const human = buildDetailPairsFromBienesRaicesPrivadoPreviewVm(vm);
  const pairs = mergeLeonixListingContractDetailPairs(human, {
    branch: "bienes_raices_privado",
    operation: "sale",
    categoriaPropiedad: state.categoriaPropiedad,
  });
  const contact = privadoSellerContact(state.seller);
  return publishLeonixRealEstateListingCore({
    title: state.titulo,
    description: state.descripcion,
    city: trim(state.ciudad) || trim(state.ubicacionLinea),
    price: priceNumberFromDigitsString(state.precio),
    isFree: false,
    category: "bienes-raices",
    sellerType: "personal",
    detailPairs: pairs,
    contactPhoneDigits: contact.phone,
    contactEmail: contact.email,
    imageSources: [...state.media.photoDataUrls],
    lang,
  });
}

export async function publishLeonixListingFromRentasPrivadoDraft(
  state: RentasPrivadoFormState,
  lang: "es" | "en"
): Promise<PublishLeonixRealEstateListingCoreResult> {
  const vm = mapRentasPrivadoStateToPreviewVm(state);
  const human = buildDetailPairsFromBienesRaicesPrivadoPreviewVm(vm);
  const pairs = mergeLeonixListingContractDetailPairs(human, {
    branch: "rentas_privado",
    operation: "rent",
    categoriaPropiedad: state.categoriaPropiedad,
  });
  const contact = privadoSellerContact(state.seller);
  return publishLeonixRealEstateListingCore({
    title: state.titulo,
    description: state.descripcion,
    city: trim(state.ciudad) || trim(state.ubicacionLinea),
    price: priceNumberFromDigitsString(state.rentaMensual),
    isFree: false,
    category: "rentas",
    sellerType: "personal",
    detailPairs: pairs,
    contactPhoneDigits: contact.phone,
    contactEmail: contact.email,
    imageSources: [...state.media.photoDataUrls],
    lang,
  });
}

export async function publishLeonixListingFromBienesRaicesNegocioDraft(
  state: BienesRaicesNegocioFormState,
  lang: "es" | "en"
): Promise<PublishLeonixRealEstateListingCoreResult> {
  const vm = mapBienesRaicesNegocioStateToPreviewVm(state);
  const human = buildDetailPairsFromBienesRaicesNegocioPreviewVm(vm);
  const cat = inferCategoriaPropiedadFromBienesNegocioState(state);
  const pairs = mergeLeonixListingContractDetailPairs(human, {
    branch: "bienes_raices_negocio",
    operation: negocioOperationFromBienes(state),
    categoriaPropiedad: cat,
  });
  const c = negocioContactAndBusinessName(state);
  const meta = buildBusinessMetaJsonFromBienesRaicesNegocioState(state);
  return publishLeonixRealEstateListingCore({
    title: state.titulo,
    description: state.descripcionLarga || state.descripcionCorta,
    city: trim(state.ciudad) || trim(state.direccion),
    price: priceNumberFromDigitsString(state.precio),
    isFree: false,
    category: "bienes-raices",
    sellerType: "business",
    businessName: c.businessName,
    businessMetaJson: meta,
    detailPairs: pairs,
    contactPhoneDigits: c.phone,
    contactEmail: c.email,
    imageSources: [...state.media.photoUrls],
    lang,
  });
}

export async function publishLeonixListingFromRentasNegocioDraft(
  state: RentasNegocioFormState,
  lang: "es" | "en"
): Promise<PublishLeonixRealEstateListingCoreResult> {
  const vm = mapRentasNegocioStateToPreviewVm(state);
  const human = buildDetailPairsFromBienesRaicesNegocioPreviewVm(vm);
  const pairs = mergeLeonixListingContractDetailPairs(human, {
    branch: "rentas_negocio",
    operation: "rent",
    categoriaPropiedad: state.categoriaPropiedad,
  });
  const br = rentasNegocioToBienesRaicesNegocioState(state);
  const meta = buildBusinessMetaJsonFromBienesRaicesNegocioState(br);
  const phone = digitsOnly(state.negocioTelDirecto) || digitsOnly(state.negocioTelOficina) || digitsOnly(state.negocioWhatsapp);
  const biz = trim(state.negocioNombre) || trim(state.negocioMarca);
  return publishLeonixRealEstateListingCore({
    title: state.titulo,
    description: state.descripcion,
    city: trim(state.ciudad) || trim(state.ubicacionLinea),
    price: priceNumberFromDigitsString(state.rentaMensual),
    isFree: false,
    category: "rentas",
    sellerType: "business",
    businessName: biz || null,
    businessMetaJson: meta,
    detailPairs: pairs,
    contactPhoneDigits: phone.length >= 10 ? phone.slice(0, 15) : null,
    contactEmail: trim(state.negocioEmail) || null,
    imageSources: [...state.media.photoDataUrls],
    lang,
  });
}
