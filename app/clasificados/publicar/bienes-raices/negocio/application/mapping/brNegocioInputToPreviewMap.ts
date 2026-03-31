/**
 * BR Negocio — input → output mapping contract (handoff).
 *
 * Rule: preview UI (`BienesRaicesNegocioPreviewView`) consumes only `BienesRaicesNegocioPreviewVm`.
 * That VM is built in one place: `mapBienesRaicesNegocioStateToPreviewVm`.
 * Do not reshape listing data inside preview components.
 */

import type { BienesRaicesNegocioFormState } from "../schema/bienesRaicesNegocioFormState";
import type { BienesRaicesNegocioPreviewVm } from "./bienesRaicesNegocioPreviewVm";
import { mapBienesRaicesNegocioStateToPreviewVm } from "./mapBienesRaicesNegocioStateToPreviewVm";

/** Canonical mapper: form state → preview VM (hero, galería, identidad, CTAs, etc.). */
export function mapNegocioFormStateToBrNegocioPreviewVm(state: BienesRaicesNegocioFormState): BienesRaicesNegocioPreviewVm {
  return mapBienesRaicesNegocioStateToPreviewVm(state);
}

/**
 * Documentación de módulos: qué pasos del formulario alimentan qué zona del preview.
 * (Solo referencia; la lógica vive en `mapBienesRaicesNegocioStateToPreviewVm`.)
 */
export const BR_NEGOCIO_PREVIEW_TARGETS = {
  heroTitle: "Información principal → titulo",
  addressLine: "Información principal → dirección, colonia, ciudad, estado, CP",
  priceDisplay: "Información principal → precio",
  listingStatusLabel: "Información principal → listingStatus",
  operationSummary: "Tipo de publicación + listingStatus (sin duplicar tipoOperación libre)",
  quickFacts: "Datos principales + tipo de publicación → filas rápidas (residencial, terreno, comercial, multifamiliar, proyecto)",
  contactRailTitle: "Tipo de anunciante → título del carril oscuro de contacto",
  identity: "Identidad del negocio (por tipo de anunciante) + Confianza → mostrar licencia/brokerage/redes",
  media: "Galería multimedia → fotos/portada, videos, tour, planos, plano sitio (constructor)",
  propertyDetailsRows: "Datos principales + tipo de publicación",
  highlightsRows: "Detalles destacados → presets + líneas personalizadas",
  description: "Descripción completa (y fallback descripción corta)",
  deepBlocks: "Detalles técnicos (sin escuelas/HOA duplicados; esos van a módulos inferiores)",
  detailClusters: "Agrupación escaneable: diseño, espacios, servicios, lote, finanzas, observaciones",
  location: "Información principal → dirección estructurada + enlace a mapa",
  schools: "Detalle profundo → escuelas (distrito, primaria, secundaria, prepa)",
  community: "Detalle profundo → vecindario / transporte + campos de proyecto cuando aplica",
  hoaDevelopment: "HOA profundo + resumen de listado + proyecto; plano de sitio (constructor)",
  contact: {
    rail: "Contacto y CTAs → toggles solicitar info, visita, llamar, WhatsApp",
    secondAgent: "Segundo agente (agente individual con toggle) o nombres en Equipo",
    lender: "Asesor de préstamos cuando el módulo está activo y hay datos",
  },
} as const;
