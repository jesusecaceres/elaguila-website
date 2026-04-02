/** Same query contract as Navbar / Autos Negocios: `?lang=es` | `?lang=en`. */

export type BrAgenteResidencialLang = "es" | "en";

export function normalizeBrAgenteResidencialLang(raw: string | null | undefined): BrAgenteResidencialLang {
  return raw === "en" ? "en" : "es";
}

export function withBrAgenteResLangParam(path: string, lang: BrAgenteResidencialLang): string {
  const [pathname, queryString] = path.split("?");
  const params = new URLSearchParams(queryString ?? "");
  params.set("lang", lang);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : `${pathname}?lang=${lang}`;
}
