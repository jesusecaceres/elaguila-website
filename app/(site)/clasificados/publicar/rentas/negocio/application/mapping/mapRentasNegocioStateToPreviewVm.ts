import type {
  BienesRaicesNegocioPreviewVm,
  BienesRaicesPreviewFact,
} from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import { mapBienesRaicesNegocioStateToPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm";
import { RENTAS_PLAZO_LABELS } from "@/app/clasificados/rentas/shared/utils/rentasPublishConstants";
import {
  buildRentasAssembledAddressLine,
  buildRentasCityStateZipLine,
  buildRentasGoogleMapsSearchQuery,
  buildRentasStreetLine,
  formatRentasDepositUsdPreview,
  formatRentasDisponibilidadDisplay,
  formatRentasServiciosIncluidosOutput,
  rentasGoogleMapsUrlFromQuery,
} from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";
import type { RentasNegocioFormState } from "../../schema/rentasNegocioFormState";
import { rentasNegocioToBienesRaicesNegocioState } from "./rentasNegocioToBienesRaicesNegocioState";

function trim(s: string): string {
  return String(s ?? "").trim();
}

function priceDigits(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
}

function digitsOnly15(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "").slice(0, 15);
}

function telHrefFromPhoneDisplay(raw: string): string | null {
  const d = digitsOnly15(raw);
  if (d.length < 10) return null;
  return `tel:${d}`;
}

function waHrefFromPhoneDisplay(raw: string): string | null {
  const d = digitsOnly15(raw);
  if (d.length < 10) return null;
  return `https://wa.me/${d}`;
}

function smsHrefFromState(raw: string): string | null {
  const d = digitsOnly15(raw);
  if (d.replace(/\D/g, "").length < 10) return null;
  return `sms:${d.replace(/\D/g, "")}`;
}

function plazoDisplay(s: RentasNegocioFormState): string {
  if (s.plazoContrato === "otro") return trim(s.plazoContratoOtro);
  if (s.plazoContrato && RENTAS_PLAZO_LABELS[s.plazoContrato]) return RENTAS_PLAZO_LABELS[s.plazoContrato].es;
  return "";
}

function rentalContractRows(s: RentasNegocioFormState): BienesRaicesPreviewFact[] {
  const rows: BienesRaicesPreviewFact[] = [];
  const dep = formatRentasDepositUsdPreview(s.deposito);
  if (dep) rows.push({ label: "Depósito", value: dep });
  const pl = plazoDisplay(s);
  if (pl) rows.push({ label: "Plazo del contrato", value: pl });
  const disp = formatRentasDisponibilidadDisplay(s.disponibilidad);
  if (disp) rows.push({ label: "Disponibilidad", value: disp });
  if (s.amueblado === "amueblado") rows.push({ label: "Amueblado", value: "Amueblado" });
  if (s.amueblado === "sin_amueblar") rows.push({ label: "Amueblado", value: "Sin amueblar" });
  if (s.mascotas === "permitidas") rows.push({ label: "Mascotas", value: "Permitidas" });
  if (s.mascotas === "no_permitidas") rows.push({ label: "Mascotas", value: "No permitidas" });
  const svc = formatRentasServiciosIncluidosOutput(s);
  if (svc) rows.push({ label: "Servicios incluidos", value: svc });
  const req = trim(s.requisitos);
  if (req) rows.push({ label: "Requisitos", value: req });
  const zona = trim(s.zonaVecindario);
  if (zona) rows.push({ label: "Zona o vecindario", value: zona });
  const note = trim(s.negocioBio);
  if (note) rows.push({ label: "Mensaje del contacto", value: note });
  return rows;
}

export function mapRentasNegocioStateToPreviewVm(s: RentasNegocioFormState): BienesRaicesNegocioPreviewVm {
  const neg = rentasNegocioToBienesRaicesNegocioState(s);
  const vm = mapBienesRaicesNegocioStateToPreviewVm(neg);
  const extra = rentalContractRows(s);
  const d = priceDigits(s.rentaMensual);
  let priceDisplay = vm.priceDisplay;
  if (d && priceDisplay !== "—") {
    priceDisplay = `${priceDisplay} / mes`;
  }
  const smsHref = smsHrefFromState(s.negocioMensajesTexto);
  const telHref = telHrefFromPhoneDisplay(trim(s.negocioTelDirecto) || trim(s.negocioTelOficina));
  const waHref = waHrefFromPhoneDisplay(trim(s.negocioWhatsapp) || trim(s.negocioTelDirecto) || trim(s.negocioTelOficina));
  const exact = s.mostrarDireccionExacta !== false;
  const cross = trim(s.direccionCruceCercano);
  const line1 = exact ? buildRentasStreetLine(s) : cross;
  const cityStateZip = buildRentasCityStateZipLine(s);
  const assembled = exact ? buildRentasAssembledAddressLine(s) : [line1, trim(s.ciudad), trim(s.zonaVecindario)].filter(Boolean).join(", ");
  const mapsUrl = rentasGoogleMapsUrlFromQuery(buildRentasGoogleMapsSearchQuery(s));
  const zona = trim(s.zonaVecindario);
  const hasMeaningfulAddress = Boolean(line1 || trim(s.ciudad) || trim(s.direccionCodigoPostal) || mapsUrl);
  return {
    ...vm,
    priceDisplay,
    addressLine: assembled || vm.addressLine,
    propertyDetailsRows: extra.length ? [...extra, ...vm.propertyDetailsRows] : vm.propertyDetailsRows,
    identity: {
      ...vm.identity,
      contactPhone: trim(s.negocioTelDirecto) || trim(s.negocioTelOficina),
      contactEmail: trim(s.negocioEmail),
      bioLine: trim(s.negocioBio) || vm.identity.bioLine,
    },
    contact: {
      ...vm.contact,
      llamarHref: telHref ?? vm.contact.llamarHref,
      showLlamar: Boolean(telHref ?? vm.contact.llamarHref),
      whatsappHref: waHref ?? vm.contact.whatsappHref,
      showWhatsapp: Boolean(waHref ?? vm.contact.whatsappHref),
      showSms: Boolean(smsHref),
      smsHref,
    },
    location: {
      ...vm.location,
      line1,
      colonia: zona,
      cityStateZip,
      fullAddress: assembled || vm.location.fullAddress,
      mapsUrl,
      hasMeaningfulAddress,
    },
  };
}
