import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { MascotasPerdidosNoticeTypeSlug, MascotasPerdidosTriState } from "./mascotasPerdidosQuickTypes";

export type MascotasPerdidosNoticeOption = {
  value: Exclude<MascotasPerdidosNoticeTypeSlug, "">;
  labelEs: string;
  labelEn: string;
};

/**
 * Gate 3 Section B — audited "Mascota vista/avistamiento" and "Mascota robada" for addition.
 * Deliberately NOT added: a sighting is functionally indistinguishable from "encontrada" from a
 * finder's discovery-and-form perspective (same fields, same intent — report where/when an animal
 * was seen), so a separate type would only fragment search/discovery without a real product gain.
 * "Robada" raises legal-allegation complexity (implicating a person) the current flat, anonymous
 * notice model isn't built for, and doesn't cleanly differentiate from "perdida" in the fields it
 * would need. Five types remain per product spec — no taxonomy bloat.
 */
export const MASCOTAS_PERDIDOS_NOTICE_OPTIONS: readonly MascotasPerdidosNoticeOption[] = [
  { value: "mascota-perdida", labelEs: "Mascota perdida", labelEn: "Lost pet" },
  { value: "mascota-encontrada", labelEs: "Mascota encontrada", labelEn: "Found pet" },
  { value: "adopcion-mascota", labelEs: "Adopción de mascota", labelEn: "Pet adoption" },
  { value: "objeto-perdido", labelEs: "Objeto perdido", labelEn: "Lost item" },
  { value: "objeto-encontrado", labelEs: "Objeto encontrado", labelEn: "Found item" },
] as const;

const LABEL_BY_SLUG = new Map(MASCOTAS_PERDIDOS_NOTICE_OPTIONS.map((o) => [o.value, o] as const));

export function resolveMascotasPerdidosNoticeLabel(slug: string, lang: Lang): string {
  const row = LABEL_BY_SLUG.get(slug as Exclude<MascotasPerdidosNoticeTypeSlug, "">);
  if (row) return lang === "en" ? row.labelEn : row.labelEs;
  return slug || "—";
}

export type MascotasPerdidosSelectOption = { value: string; labelEs: string; labelEn: string };

export const MASCOTAS_SEX_OPTIONS: readonly MascotasPerdidosSelectOption[] = [
  { value: "macho", labelEs: "Macho", labelEn: "Male" },
  { value: "hembra", labelEs: "Hembra", labelEn: "Female" },
  { value: "no_se", labelEs: "No sé", labelEn: "Not sure" },
] as const;

export const MASCOTAS_SIZE_OPTIONS: readonly MascotasPerdidosSelectOption[] = [
  { value: "pequeno", labelEs: "Pequeño", labelEn: "Small" },
  { value: "mediano", labelEs: "Mediano", labelEn: "Medium" },
  { value: "grande", labelEs: "Grande", labelEn: "Large" },
] as const;

const TRI_STATE_LABELS: Record<Exclude<MascotasPerdidosTriState, "">, { es: string; en: string }> = {
  si: { es: "Sí", en: "Yes" },
  no: { es: "No", en: "No" },
  no_se: { es: "No sé", en: "Not sure" },
};

export function labelMascotasTriState(v: MascotasPerdidosTriState, lang: Lang): string {
  if (!v) return "";
  return lang === "en" ? TRI_STATE_LABELS[v].en : TRI_STATE_LABELS[v].es;
}

function labelBySlug(list: readonly MascotasPerdidosSelectOption[], slug: string, lang: Lang): string {
  const row = list.find((o) => o.value === slug);
  if (row) return lang === "en" ? row.labelEn : row.labelEs;
  return slug || "";
}

export function labelMascotasSex(slug: string, lang: Lang): string {
  return labelBySlug(MASCOTAS_SEX_OPTIONS, slug, lang);
}

export function labelMascotasSize(slug: string, lang: Lang): string {
  return labelBySlug(MASCOTAS_SIZE_OPTIONS, slug, lang);
}
