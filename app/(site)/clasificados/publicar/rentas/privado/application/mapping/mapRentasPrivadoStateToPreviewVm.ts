import type { BienesRaicesPrivadoPreviewVm } from "@/app/clasificados/bienes-raices/preview/privado/model/bienesRaicesPrivadoPreviewVm";
import { mapBienesRaicesPrivadoStateToPreviewVm } from "@/app/clasificados/publicar/bienes-raices/privado/application/mapping/mapBienesRaicesPrivadoStateToPreviewVm";
import { mergePartialBienesRaicesPrivadoState } from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import type { BienesRaicesPrivadoFormState } from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
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
import type { RentasPrivadoFormState } from "../../schema/rentasPrivadoFormState";
import { rentasLeadSmsBody, RENTAS_LEAD_MESSAGE_ES } from "@/app/clasificados/rentas/shared/rentasLeadContactCopy";
import type { BienesRaicesPreviewFact, BienesRaicesPreviewQuickFactVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";

function trim(s: string): string {
  return String(s ?? "").trim();
}

function digitsOnly15(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "").slice(0, 15);
}

function telHrefFromPhoneDisplay(raw: string): string | null {
  const d = digitsOnly15(raw);
  if (d.length < 10) return null;
  return `tel:${d}`;
}

function smsHrefFromPhoneDisplay(raw: string): string | null {
  const d = digitsOnly15(raw);
  if (d.length < 10) return null;
  return `sms:${d}?&body=${encodeURIComponent(rentasLeadSmsBody("es"))}`;
}

function waHrefFromPhoneDisplay(raw: string): string | null {
  const d = digitsOnly15(raw);
  if (d.length < 10) return null;
  return `https://wa.me/${d}?text=${encodeURIComponent(RENTAS_LEAD_MESSAGE_ES)}`;
}

function phoneDisplayFormatted(raw: string): string {
  const t = trim(raw);
  if (!t) return "";
  const d = digitsOnly(t);
  return d.length >= 10 ? formatUsPhoneDisplay(d) : t;
}

const ESTADO_RENTAS: Record<RentasPrivadoFormState["estadoAnuncio"], string> = {
  disponible: "Disponible",
  pendiente: "Pendiente",
  bajo_contrato: "Bajo contrato",
  rentado: "Rentado",
};

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

function toBienesRaicesPrivadoShape(s: RentasPrivadoFormState): BienesRaicesPrivadoFormState {
  const line1 = buildRentasStreetLine(s);
  return mergePartialBienesRaicesPrivadoState({
    categoriaPropiedad: s.categoriaPropiedad,
    titulo: s.titulo,
    precio: s.rentaMensual,
    ciudad: s.ciudad,
    ubicacionLinea: line1,
    enlaceMapa: "",
    descripcion: s.descripcion,
    estadoAnuncio: s.estadoAnuncio === "rentado" ? "vendido" : s.estadoAnuncio,
    media: {
      photoDataUrls: s.media.photoDataUrls,
      primaryImageIndex: s.media.primaryImageIndex,
      videoUrl: s.media.videoUrl,
      videoLocalDataUrl: s.media.videoLocalDataUrl,
    },
    seller: {
      fotoDataUrl: s.seller.fotoDataUrl,
      nombre: s.seller.nombre,
      etiquetaRol: "",
      telefono: s.seller.telefono,
      whatsapp: s.seller.whatsapp,
      mensajesTexto: s.seller.mensajesTexto,
      correo: s.seller.correo,
      notaContacto: s.seller.notaContacto,
    },
    residencial: s.residencial,
    comercial: s.comercial,
    terreno: s.terreno,
    petsAllowed: s.mascotas === "permitidas" ? "yes" : s.mascotas === "no_permitidas" ? "no" : "",
  });
}

function plazoDisplay(s: RentasPrivadoFormState): string {
  if (s.plazoContrato === "otro") return trim(s.plazoContratoOtro);
  if (s.plazoContrato && RENTAS_PLAZO_LABELS[s.plazoContrato]) return RENTAS_PLAZO_LABELS[s.plazoContrato].es;
  return "";
}

function rentalQuickFacts(s: RentasPrivadoFormState): BienesRaicesPreviewQuickFactVm[] {
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

function rentOperationSummary(cat: RentasPrivadoFormState["categoriaPropiedad"]): string {
  if (cat === "residencial") return "Renta residencial";
  if (cat === "comercial") return "Renta comercial";
  return "Renta terreno / lote";
}

export function mapRentasPrivadoStateToPreviewVm(s: RentasPrivadoFormState): BienesRaicesPrivadoPreviewVm {
  const base = mapBienesRaicesPrivadoStateToPreviewVm(toBienesRaicesPrivadoShape(s));
  const exact = s.mostrarDireccionExacta !== false;
  const cross = trim(s.direccionCruceCercano);
  const line1 = exact ? buildRentasStreetLine(s) : cross;
  const cityStateZip = buildRentasCityStateZipLine(s);
  const mapsQ = buildRentasGoogleMapsSearchQuery(s);
  const mapsUrl = rentasGoogleMapsUrlFromQuery(mapsQ);
  const hasMeaningfulAddress = Boolean(line1 || trim(s.ciudad) || trim(s.direccionCodigoPostal) || mapsUrl);
  const addressLine = exact
    ? buildRentasAssembledAddressLine(s)
    : [line1, trim(s.ciudad), trim(s.zonaVecindario)].filter(Boolean).join(", ");

  const lead: BienesRaicesPreviewFact[] = [];
  const rm = buildRentasRentaMensualRow(s);
  if (rm) lead.push(rm);
  lead.push(...buildRentasFlowTipoResumenRow(s));
  const rentRows = [...lead, ...buildRentasFlowContractRows(s)];
  const rentFacts = rentalQuickFacts(s);
  const quickFacts = dedupeQuickFactsByLabel([...rentFacts, ...base.quickFacts]);

  const propertyBody: BienesRaicesPreviewFact[] = buildRentasFlowPropertyBodyRows(s);

  const telHref = telHrefFromPhoneDisplay(s.seller.telefono);
  const smsHref = smsHrefFromPhoneDisplay(s.seller.mensajesTexto);
  const waDigitsPrimary = trim(s.seller.whatsapp) ? trim(s.seller.whatsapp) : trim(s.seller.telefono);
  const waHref = waHrefFromPhoneDisplay(waDigitsPrimary);

  const mailto =
    trim(s.seller.correo) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trim(s.seller.correo))
      ? `mailto:${trim(s.seller.correo)}?subject=${encodeURIComponent("Pregunta sobre tu renta (Leonix)")}&body=${encodeURIComponent(RENTAS_LEAD_MESSAGE_ES)}`
      : null;

  const highlightsRows = base.highlightsRows.map((r) => ({
    ...r,
    value: trim(r.value) === "✓" ? "Sí" : r.value,
  }));

  return {
    ...base,
    addressLine,
    priceDisplay: formatUsdMonthly(s.rentaMensual),
    listingStatusLabel: ESTADO_RENTAS[s.estadoAnuncio],
    operationSummary: rentOperationSummary(s.categoriaPropiedad),
    quickFacts,
    propertyDetailsRows: [...rentRows, ...propertyBody],
    highlightsRows,
    highlightsSectionTitle: "Destacados",
    seller: {
      ...base.seller,
      byOwnerLabel: "",
      phoneDisplay: phoneDisplayFormatted(s.seller.telefono),
      whatsappDisplay: phoneDisplayFormatted(s.seller.whatsapp),
      smsDisplay: phoneDisplayFormatted(s.seller.mensajesTexto),
      noteLine: trim(s.seller.notaContacto),
    },
    contact: {
      ...base.contact,
      solicitarInfoHref: mailto,
      showSolicitarInfo: Boolean(mailto),
      llamarHref: telHref,
      showLlamar: Boolean(telHref),
      whatsappHref: waHref,
      showWhatsapp: Boolean(waHref),
      smsHref,
      showSms: Boolean(smsHref),
      instructionsLine: "",
    },
    location: {
      ...base.location,
      line1,
      cityStateZip,
      mapsUrl,
      hasMeaningfulAddress,
    },
  };
}
