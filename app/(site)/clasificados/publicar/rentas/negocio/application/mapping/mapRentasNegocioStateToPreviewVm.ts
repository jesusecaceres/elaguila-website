import type {
  BienesRaicesNegocioPreviewVm,
  BienesRaicesPreviewFact,
} from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import { mapBienesRaicesNegocioStateToPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm";
import { RENTAS_PLAZO_LABELS } from "@/app/clasificados/rentas/shared/utils/rentasPublishConstants";
import type { RentasNegocioFormState } from "../../schema/rentasNegocioFormState";
import { rentasNegocioToBienesRaicesNegocioState } from "./rentasNegocioToBienesRaicesNegocioState";

function trim(s: string): string {
  return String(s ?? "").trim();
}

function priceDigits(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
}

function rentalContractRows(s: RentasNegocioFormState): BienesRaicesPreviewFact[] {
  const rows: BienesRaicesPreviewFact[] = [];
  const dep = trim(s.deposito);
  if (dep) rows.push({ label: "Depósito", value: dep });
  if (s.plazoContrato && RENTAS_PLAZO_LABELS[s.plazoContrato]) {
    rows.push({ label: "Plazo del contrato", value: RENTAS_PLAZO_LABELS[s.plazoContrato].es });
  }
  const disp = trim(s.disponibilidad);
  if (disp) rows.push({ label: "Disponibilidad", value: disp });
  if (s.amueblado === "amueblado") rows.push({ label: "Amueblado", value: "Amueblado" });
  if (s.amueblado === "sin_amueblar") rows.push({ label: "Amueblado", value: "Sin amueblar" });
  if (s.mascotas === "permitidas") rows.push({ label: "Mascotas", value: "Permitidas" });
  if (s.mascotas === "no_permitidas") rows.push({ label: "Mascotas", value: "No permitidas" });
  const svc = trim(s.serviciosIncluidos);
  if (svc) rows.push({ label: "Servicios incluidos", value: svc });
  const req = trim(s.requisitos);
  if (req) rows.push({ label: "Requisitos", value: req });
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
  return {
    ...vm,
    priceDisplay,
    propertyDetailsRows: extra.length ? [...extra, ...vm.propertyDetailsRows] : vm.propertyDetailsRows,
  };
}
