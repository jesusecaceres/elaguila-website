import type { BienesRaicesPrivadoPreviewVm } from "@/app/clasificados/bienes-raices/preview/privado/model/bienesRaicesPrivadoPreviewVm";
import { mapBienesRaicesPrivadoStateToPreviewVm } from "@/app/clasificados/publicar/bienes-raices/privado/application/mapping/mapBienesRaicesPrivadoStateToPreviewVm";
import { mergePartialBienesRaicesPrivadoState } from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import type { BienesRaicesPrivadoFormState } from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import { RENTAS_PLAZO_LABELS } from "@/app/clasificados/rentas/shared/utils/rentasPublishConstants";
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
  return mergePartialBienesRaicesPrivadoState({
    categoriaPropiedad: s.categoriaPropiedad,
    titulo: s.titulo,
    precio: s.rentaMensual,
    ciudad: s.ciudad,
    ubicacionLinea: s.ubicacionLinea,
    enlaceMapa: s.enlaceMapa,
    descripcion: s.descripcion,
    estadoAnuncio: s.estadoAnuncio === "rentado" ? "vendido" : s.estadoAnuncio,
    media: s.media,
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
  });
}

function rentalDetailRows(s: RentasPrivadoFormState): BienesRaicesPreviewFact[] {
  const rows: BienesRaicesPreviewFact[] = [];
  const rent = formatUsdMonthly(s.rentaMensual);
  if (rent) rows.push({ label: "Renta mensual", value: rent });
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

function rentalQuickFacts(s: RentasPrivadoFormState): BienesRaicesPreviewQuickFactVm[] {
  const out: BienesRaicesPreviewQuickFactVm[] = [];
  const rent = formatUsdMonthly(s.rentaMensual);
  if (rent) out.push({ label: "Renta mensual", value: rent, icon: "calendar" });
  const dep = trim(s.deposito);
  if (dep) out.push({ label: "Depósito", value: dep, icon: "pin" });
  if (s.plazoContrato && RENTAS_PLAZO_LABELS[s.plazoContrato]) {
    out.push({ label: "Plazo", value: RENTAS_PLAZO_LABELS[s.plazoContrato].es, icon: "calendar" });
  }
  const disp = trim(s.disponibilidad);
  if (disp) out.push({ label: "Disponibilidad", value: disp, icon: "calendar" });
  if (s.amueblado === "amueblado") out.push({ label: "Amueblado", value: "Sí", icon: "home" });
  if (s.amueblado === "sin_amueblar") out.push({ label: "Amueblado", value: "No", icon: "home" });
  if (s.mascotas === "permitidas") out.push({ label: "Mascotas", value: "Permitidas", icon: "sparkle" });
  if (s.mascotas === "no_permitidas") out.push({ label: "Mascotas", value: "No", icon: "sparkle" });
  const svc = trim(s.serviciosIncluidos);
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
  };
}
