import { BR_HIGHLIGHT_PRESET_DEFS } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/brHighlightMeta";

/**
 * Emoji shown only in Rentas publish forms (Privado/Negocio). Preview/listing output stays label-only via `BR_HIGHLIGHT_PRESET_DEFS`.
 */
export const RENTAS_RESIDENCIAL_HIGHLIGHT_FORM_VISUAL: Record<(typeof BR_HIGHLIGHT_PRESET_DEFS)[number]["key"], string> = {
  piscina: "🏊",
  cocinaRemodelada: "🍽️",
  electrodomesticosLujo: "✨",
  patio: "🌿",
  balcon: "🏙️",
  vista: "🌄",
  comunidadCerrada: "🛡️",
  techosAltos: "↕️",
  cuartoPrincipalGrande: "🛏️",
  walkInCloset: "👗",
  oficinaEnCasa: "💻",
  panelesSolares: "☀️",
  smartHome: "🏠",
  chimenea: "🔥",
  lavanderia: "🧺",
  estacionamientoTechado: "🚗",
  accesoControlado: "🔐",
  elevador: "🛗",
  terraza: "🌇",
  gimnasio: "🏋️",
  amenidadesDesarrollo: "⭐",
};
