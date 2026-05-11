import type {
  BienesRaicesNegocioPreviewVm,
  BienesRaicesPreviewFact,
  BienesRaicesPreviewQuickFactVm,
} from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import { mapBienesRaicesNegocioStateToPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm";
import {
  digitsOnly,
  formatUsPhoneDisplay,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/phoneMask";
import { RENTAS_PLAZO_LABELS } from "@/app/clasificados/rentas/shared/utils/rentasPublishConstants";
import {
  buildRentasAssembledAddressLine,
  buildRentasCityStateZipLine,
  buildRentasGoogleMapsSearchQuery,
  buildRentasStreetLine,
  formatRentasDepositUsdPreview,
  formatRentasDisponibilidadDisplay,
  rentasGoogleMapsUrlFromQuery,
} from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";
import {
  buildRentasFlowContractRows,
  buildRentasFlowPropertyBodyRows,
  buildRentasFlowTipoResumenRow,
  buildRentasRentaMensualRow,
  rentasFlowGroupActive,
} from "@/app/clasificados/rentas/shared/rentasRentalTypeApply";
import type { RentasNegocioFormState } from "../../schema/rentasNegocioFormState";
import { rentasNegocioToBienesRaicesNegocioState } from "./rentasNegocioToBienesRaicesNegocioState";

function trim(s: string): string {
  return String(s ?? "").trim();
}

function priceDigits(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
}

function formatUsdMonthly(precio: string): string {
  const d = priceDigits(precio);
  if (!d) return "";
  const n = Number(d);
  if (!Number.isFinite(n) || n <= 0) return "";
  const cur = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  return `${cur} / mes`;
}

function phoneDisplayFormatted(raw: string): string {
  const t = trim(raw);
  if (!t) return "";
  const d = digitsOnly(t);
  return d.length >= 10 ? formatUsPhoneDisplay(d) : t;
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
  if (d.length < 10) return null;
  const msg =
    "Vi tu anuncio de renta en Leonix Media. Quiero saber si todavia esta disponible y si podemos hablar.";
  return `sms:${d}?&body=${encodeURIComponent(msg)}`;
}

function plazoDisplay(s: RentasNegocioFormState): string {
  if (s.plazoContrato === "otro") return trim(s.plazoContratoOtro);
  if (s.plazoContrato && RENTAS_PLAZO_LABELS[s.plazoContrato]) return RENTAS_PLAZO_LABELS[s.plazoContrato].es;
  return "";
}

function rentalContractQuickStrip(s: RentasNegocioFormState): BienesRaicesPreviewQuickFactVm[] {
  const out: BienesRaicesPreviewQuickFactVm[] = [];
  const g = rentasFlowGroupActive(s);
  const showFurn = g === "unset" || g === "full_housing" || g === "room_shared" || g === "commercial_space";
  const rent = formatUsdMonthly(s.rentaMensual);
  if (rent) out.push({ label: "Renta mensual", value: rent, icon: "calendar" });
  const dep = formatRentasDepositUsdPreview(s.deposito);
  if (dep) out.push({ label: "Depósito", value: dep, icon: "pin" });
  const pl = plazoDisplay(s);
  if (pl) out.push({ label: "Plazo", value: pl, icon: "calendar" });
  const disp = formatRentasDisponibilidadDisplay(s.disponibilidad);
  if (disp) out.push({ label: "Disponibilidad", value: disp, icon: "calendar" });
  if (showFurn) {
    if (s.amueblado === "amueblado") out.push({ label: "Amueblado", value: "Sí", icon: "home" });
    if (s.amueblado === "sin_amueblar") out.push({ label: "Amueblado", value: "No", icon: "home" });
  }
  return out;
}

function dedupeQuickFactsByLabel(items: BienesRaicesPreviewQuickFactVm[]): BienesRaicesPreviewQuickFactVm[] {
  const seen = new Set<string>();
  const out: BienesRaicesPreviewQuickFactVm[] = [];
  for (const x of items) {
    if (seen.has(x.label)) continue;
    seen.add(x.label);
    out.push(x);
  }
  return out;
}

function normalizeRentasNegocioHighlights(rows: BienesRaicesPreviewFact[]): BienesRaicesPreviewFact[] {
  const out: BienesRaicesPreviewFact[] = [];
  for (const r of rows) {
    const v = trim(r.value);
    if (!v || /Agrega características en el formulario/i.test(v)) continue;
    if (r.label === "Destacado") {
      out.push({ label: v, value: "Sí" });
    } else if (r.label === "Personalizado") {
      out.push({ label: v, value: "Sí" });
    }
  }
  return out;
}

export function mapRentasNegocioStateToPreviewVm(s: RentasNegocioFormState): BienesRaicesNegocioPreviewVm {
  const neg = rentasNegocioToBienesRaicesNegocioState(s);
  const vm = mapBienesRaicesNegocioStateToPreviewVm(neg);
  const lead: BienesRaicesPreviewFact[] = [];
  const rm = buildRentasRentaMensualRow(s);
  if (rm) lead.push(rm);
  lead.push(...buildRentasFlowTipoResumenRow(s));
  const extra = [...lead, ...buildRentasFlowContractRows(s)];
  const d = priceDigits(s.rentaMensual);
  let priceDisplay = vm.priceDisplay;
  if (d && priceDisplay !== "—") {
    priceDisplay = `${priceDisplay} / mes`;
  }

  const primaryPhoneRaw = trim(s.negocioTelDirecto) || trim(s.negocioTelOficina);
  const smsHref = smsHrefFromState(s.negocioMensajesTexto);
  const telHref = telHrefFromPhoneDisplay(primaryPhoneRaw);
  const waRaw = trim(s.negocioWhatsapp) || primaryPhoneRaw;
  const waHref = waHrefFromPhoneDisplay(waRaw);

  const exact = s.mostrarDireccionExacta !== false;
  const cross = trim(s.direccionCruceCercano);
  const line1 = exact ? buildRentasStreetLine(s) : cross;
  const cityStateZip = buildRentasCityStateZipLine(s);
  const assembled = exact ? buildRentasAssembledAddressLine(s) : [line1, trim(s.ciudad), trim(s.zonaVecindario)].filter(Boolean).join(", ");
  const mapsUrl = rentasGoogleMapsUrlFromQuery(buildRentasGoogleMapsSearchQuery(s));
  const zona = trim(s.zonaVecindario);
  const hasMeaningfulAddress = Boolean(line1 || trim(s.ciudad) || trim(s.direccionCodigoPostal) || mapsUrl);

  const propertyDetailsRows: BienesRaicesPreviewFact[] = [...extra, ...buildRentasFlowPropertyBodyRows(s)];

  const quickStripMerged = rentalContractQuickStrip(s);

  const quickFacts = dedupeQuickFactsByLabel([...quickStripMerged, ...vm.quickFacts]);

  const highlightsRows = normalizeRentasNegocioHighlights(vm.highlightsRows ?? []);

  return {
    ...vm,
    priceDisplay,
    addressLine: assembled || vm.addressLine,
    quickFacts,
    propertyDetailsRows,
    highlightsRows,
    hasHighlights: highlightsRows.length > 0,
    highlightsSectionTitle: "Destacados",
    identity: {
      ...vm.identity,
      contactPhone: phoneDisplayFormatted(primaryPhoneRaw),
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
      smsHref: smsHref ?? vm.contact.smsHref,
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
