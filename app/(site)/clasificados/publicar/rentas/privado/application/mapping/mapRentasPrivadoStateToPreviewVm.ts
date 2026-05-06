import type { BienesRaicesPrivadoPreviewVm } from "@/app/clasificados/bienes-raices/preview/privado/model/bienesRaicesPrivadoPreviewVm";
import { mapBienesRaicesPrivadoStateToPreviewVm } from "@/app/clasificados/publicar/bienes-raices/privado/application/mapping/mapBienesRaicesPrivadoStateToPreviewVm";
import { mergePartialBienesRaicesPrivadoState } from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import type { BienesRaicesPrivadoFormState } from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import { RENTAS_PLAZO_LABELS } from "@/app/clasificados/rentas/shared/utils/rentasPublishConstants";
import {
  buildRentasCityStateZipLine,
  buildRentasGoogleMapsSearchQuery,
  buildRentasStreetLine,
  formatRentasDepositUsdPreview,
  formatRentasDisponibilidadDisplay,
  formatRentasServiciosIncluidosOutput,
  rentasGoogleMapsUrlFromQuery,
} from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";
import type { RentasPrivadoFormState } from "../../schema/rentasPrivadoFormState";
import type { BienesRaicesPreviewFact, BienesRaicesPreviewQuickFactVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";

function trim(s: string): string {
  return String(s ?? "").trim();
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

function rentalDetailRows(s: RentasPrivadoFormState): BienesRaicesPreviewFact[] {
  const rows: BienesRaicesPreviewFact[] = [];
  const rent = formatUsdMonthly(s.rentaMensual);
  if (rent) rows.push({ label: "Renta mensual", value: rent });
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

function rentalQuickFacts(s: RentasPrivadoFormState): BienesRaicesPreviewQuickFactVm[] {
  const out: BienesRaicesPreviewQuickFactVm[] = [];
  const rent = formatUsdMonthly(s.rentaMensual);
  if (rent) out.push({ label: "Renta mensual", value: rent, icon: "calendar" });
  const dep = formatRentasDepositUsdPreview(s.deposito);
  if (dep) out.push({ label: "Depósito", value: dep, icon: "pin" });
  const pl = plazoDisplay(s);
  if (pl) out.push({ label: "Plazo", value: pl, icon: "calendar" });
  const disp = formatRentasDisponibilidadDisplay(s.disponibilidad);
  if (disp) out.push({ label: "Disponibilidad", value: disp, icon: "calendar" });
  if (s.amueblado === "amueblado") out.push({ label: "Amueblado", value: "Sí", icon: "home" });
  if (s.amueblado === "sin_amueblar") out.push({ label: "Amueblado", value: "No", icon: "home" });
  if (s.mascotas === "permitidas") out.push({ label: "Mascotas", value: "Permitidas", icon: "sparkle" });
  if (s.mascotas === "no_permitidas") out.push({ label: "Mascotas", value: "No", icon: "sparkle" });
  const svc = formatRentasServiciosIncluidosOutput(s);
  if (svc) out.push({ label: "Servicios", value: svc, icon: "sparkle" });
  return out;
}

function rentOperationSummary(cat: RentasPrivadoFormState["categoriaPropiedad"]): string {
  if (cat === "residencial") return "Renta residencial";
  if (cat === "comercial") return "Renta comercial";
  return "Renta terreno / lote";
}

export function mapRentasPrivadoStateToPreviewVm(s: RentasPrivadoFormState): BienesRaicesPrivadoPreviewVm {
  const base = mapBienesRaicesPrivadoStateToPreviewVm(toBienesRaicesPrivadoShape(s));
  const line1 = buildRentasStreetLine(s);
  const cityZip = buildRentasCityStateZipLine(s);
  const zona = trim(s.zonaVecindario);
  const cityStateZip = cityZip;
  const mapsUrl = rentasGoogleMapsUrlFromQuery(buildRentasGoogleMapsSearchQuery(s));
  const hasMeaningfulAddress = Boolean(line1 || trim(s.ciudad) || zona || mapsUrl);
  const addressLine = [line1, trim(s.ciudad), zona ? `Zona: ${zona}` : ""].filter(Boolean).join(" · ");
  const rentRows = rentalDetailRows(s);
  const rentFacts = rentalQuickFacts(s);
  const mailto =
    trim(s.seller.correo) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trim(s.seller.correo))
      ? `mailto:${trim(s.seller.correo)}?subject=${encodeURIComponent("Pregunta sobre tu renta (Leonix — particular)")}`
      : null;

  const nameShown = trim(s.seller.nombre);
  const byOwner = nameShown ? "Arrendador" : "";

  return {
    ...base,
    addressLine,
    priceDisplay: formatUsdMonthly(s.rentaMensual),
    listingStatusLabel: ESTADO_RENTAS[s.estadoAnuncio],
    operationSummary: rentOperationSummary(s.categoriaPropiedad),
    quickFacts: [...rentFacts, ...base.quickFacts],
    propertyDetailsRows: [...rentRows, ...base.propertyDetailsRows],
    seller: {
      ...base.seller,
      byOwnerLabel: byOwner,
    },
    contact: {
      ...base.contact,
      solicitarInfoHref: mailto,
      showSolicitarInfo: Boolean(mailto),
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
