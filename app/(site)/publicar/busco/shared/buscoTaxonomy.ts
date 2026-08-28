import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { BuscoBudgetMode, BuscoTypeSlug, BuscoUrgency } from "./buscoQuickTypes";

export type BuscoTypeOption = {
  value: Exclude<BuscoTypeSlug, "">;
  labelEs: string;
  labelEn: string;
};

/** Public labels per product spec (ES). Owner-approved addition: "trabajo" (Gate 4, Section B) —
 *  free Community request for work/side work, NOT the paid Empleos employer product. No
 *  dating/personals type exists or is added here (owner explicitly forbade it). */
export const BUSCO_TYPE_OPTIONS: readonly BuscoTypeOption[] = [
  { value: "articulo", labelEs: "Busco artículo", labelEn: "Looking for item" },
  { value: "ayuda", labelEs: "Busco ayuda", labelEn: "Looking for help" },
  { value: "servicio", labelEs: "Busco servicio", labelEn: "Looking for service" },
  { value: "grupo_actividad", labelEs: "Busco grupo o actividad", labelEn: "Looking for group or activity" },
  { value: "transporte", labelEs: "Busco transporte / ride", labelEn: "Looking for ride / transport" },
  { value: "voluntarios", labelEs: "Busco voluntarios", labelEn: "Looking for volunteers" },
  { value: "recurso_comunitario", labelEs: "Busco recurso comunitario", labelEn: "Looking for community resource" },
  { value: "trabajo", labelEs: "Busco trabajo / trabajo extra", labelEn: "Looking for work / side work" },
  { value: "otro", labelEs: "Otro", labelEn: "Other" },
] as const;

const LABEL_BY_SLUG = new Map(BUSCO_TYPE_OPTIONS.map((o) => [o.value, o] as const));

export function resolveBuscoTypePublicLabel(slug: string, custom: string, lang: Lang): string {
  const c = String(custom ?? "").trim();
  if (slug === "otro" && c) return c;
  if (slug === "otro") return lang === "en" ? "Other" : "Otro";
  const row = LABEL_BY_SLUG.get(slug as Exclude<BuscoTypeSlug, "">);
  if (row) return lang === "en" ? row.labelEn : row.labelEs;
  return c || slug || "—";
}

/** Section G — the 4 owner-approved urgency states. */
export const BUSCO_URGENCY_OPTIONS: readonly { value: BuscoUrgency; labelEs: string; labelEn: string }[] = [
  { value: "normal", labelEs: "Normal", labelEn: "Normal" },
  { value: "esta_semana", labelEs: "Esta semana", labelEn: "This week" },
  { value: "lo_antes_posible", labelEs: "Lo antes posible", labelEn: "As soon as possible" },
  { value: "urgente_hoy", labelEs: "Urgente hoy", labelEn: "Urgent today" },
] as const;

const URGENCY_LABEL_BY_VALUE = new Map(BUSCO_URGENCY_OPTIONS.map((o) => [o.value, o] as const));

export function labelBuscoUrgency(value: BuscoUrgency, lang: Lang): string {
  const row = URGENCY_LABEL_BY_VALUE.get(value);
  if (!row) return "";
  return lang === "en" ? row.labelEn : row.labelEs;
}

/** Section E — structured budget modes. "Tengo presupuesto" reveals a numeric amount input. */
export const BUSCO_BUDGET_MODE_OPTIONS: readonly { value: BuscoBudgetMode; labelEs: string; labelEn: string }[] = [
  { value: "tiene", labelEs: "Tengo presupuesto", labelEn: "I have a budget" },
  { value: "gratis", labelEs: "Gratis / busco ayuda gratuita", labelEn: "Free / looking for free help" },
  { value: "intercambio", labelEs: "Intercambio", labelEn: "Trade / exchange" },
  { value: "convenir", labelEs: "A convenir / negociable", labelEn: "Negotiable" },
  { value: "no_aplica", labelEs: "No aplica", labelEn: "Not applicable" },
] as const;

const BUDGET_MODE_LABEL_BY_VALUE = new Map(BUSCO_BUDGET_MODE_OPTIONS.map((o) => [o.value, o] as const));

export function labelBuscoBudgetMode(value: BuscoBudgetMode, lang: Lang): string {
  const row = BUDGET_MODE_LABEL_BY_VALUE.get(value);
  if (!row) return "";
  return lang === "en" ? row.labelEn : row.labelEs;
}
