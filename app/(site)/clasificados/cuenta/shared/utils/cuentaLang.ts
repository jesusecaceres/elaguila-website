/**
 * Cuenta page: resolve `lang` from URL search params.
 */

export type Lang = "es" | "en";

export function getCuentaLang(sp: URLSearchParams | null): Lang {
  const v = (sp?.get("lang") ?? "").toLowerCase();
  return v === "en" ? "en" : "es";
}
