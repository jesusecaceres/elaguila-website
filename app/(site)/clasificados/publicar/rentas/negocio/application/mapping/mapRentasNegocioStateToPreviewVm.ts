import type {
  BienesRaicesNegocioPreviewVm,
  BienesRaicesPreviewFact,
} from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import { mapBienesRaicesNegocioStateToPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm";
import { RENTAS_PLAZO_LABELS } from "@/app/clasificados/rentas/shared/utils/rentasPublishConstants";
import {
  formatRentasDepositUsdPreview,
  formatRentasDisponibilidadDisplay,
  formatRentasServiciosIncluidosOutput,
} from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";
import type { RentasNegocioFormState } from "../../schema/rentasNegocioFormState";
import { rentasNegocioToBienesRaicesNegocioState } from "./rentasNegocioToBienesRaicesNegocioState";
import { digitsOnly } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/phoneMask";

function trim(s: string): string {
  return String(s ?? "").trim();
}

function priceDigits(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
}

function smsHrefFromState(raw: string): string | null {
  const d = digitsOnly(raw);
  if (d.length < 10) return null;
  return `sms:${d}`;
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
  return {
    ...vm,
    priceDisplay,
    propertyDetailsRows: extra.length ? [...extra, ...vm.propertyDetailsRows] : vm.propertyDetailsRows,
    contact: {
      ...vm.contact,
      showSms: Boolean(smsHref),
      smsHref,
    },
  };
}
