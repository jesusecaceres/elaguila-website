import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { BuscoTypeSlug } from "./buscoQuickTypes";

export type BuscoTypeOption = {
  value: Exclude<BuscoTypeSlug, "">;
  labelEs: string;
  labelEn: string;
};

/** Public labels per product spec (ES). */
export const BUSCO_TYPE_OPTIONS: readonly BuscoTypeOption[] = [
  { value: "articulo", labelEs: "Busco artículo", labelEn: "Looking for item" },
  { value: "ayuda", labelEs: "Busco ayuda", labelEn: "Looking for help" },
  { value: "servicio", labelEs: "Busco servicio", labelEn: "Looking for service" },
  { value: "grupo_actividad", labelEs: "Busco grupo o actividad", labelEn: "Looking for group or activity" },
  { value: "transporte", labelEs: "Busco transporte / ride", labelEn: "Looking for ride / transport" },
  { value: "voluntarios", labelEs: "Busco voluntarios", labelEn: "Looking for volunteers" },
  { value: "recurso_comunitario", labelEs: "Busco recurso comunitario", labelEn: "Looking for community resource" },
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
