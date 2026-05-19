import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { MascotasPerdidosNoticeTypeSlug } from "./mascotasPerdidosQuickTypes";

export type MascotasPerdidosNoticeOption = {
  value: Exclude<MascotasPerdidosNoticeTypeSlug, "">;
  labelEs: string;
  labelEn: string;
};

/** Exactly five notice types per product spec. */
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
