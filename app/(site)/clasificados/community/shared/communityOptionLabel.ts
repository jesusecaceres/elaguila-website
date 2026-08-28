import type { Lang } from "@/app/clasificados/config/clasificadosHub";

/** Generic, category-agnostic "find option by value" lookup shared by result filter chip builders. */
export function optionLabel(
  options: readonly { value: string; labelEs: string; labelEn: string }[],
  value: string,
  lang: Lang,
): string {
  const row = options.find((o) => o.value === value);
  if (!row) return value;
  return lang === "en" ? row.labelEn : row.labelEs;
}
