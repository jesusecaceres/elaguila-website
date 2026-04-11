import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { BR_RESULTS } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";

/** Parsed BR results URL (`/clasificados/bienes-raices/resultados`). */
export type BrResultsParsedState = {
  lang: Lang;
  q: string;
  city: string;
  operationType: "" | "venta" | "renta";
  /** URL `propertyType` (casa | departamento | terreno | comercial | …). */
  propertyType: string;
  sellerType: "" | "privado" | "negocio";
  priceMin: string;
  priceMax: string;
  beds: string;
  baths: string;
  pets: string;
  furnished: string;
  pool: string;
  sort: string;
  page: string;
  /** US ZIP when listing rows include `zipCode` (publish-backed). */
  zip: string;
  /** Comma-separated primary chip ids (landing handoff). */
  primary: string;
  secondary: string;
  /** Legacy price band (`precio`) — mapped to min/max when numeric bounds absent. */
  precio: string;
};

const LANG_SET = new Set<Lang>(["es", "en"]);

export function resolveBrResultsLang(raw: string | null): Lang {
  return raw === "en" ? "en" : "es";
}

export function parseBrResultsUrl(searchParams: URLSearchParams): BrResultsParsedState {
  const langRaw = searchParams.get("lang");
  const lang: Lang = LANG_SET.has(langRaw as Lang) ? (langRaw as Lang) : "es";

  const op = searchParams.get("operationType");
  const operationType: BrResultsParsedState["operationType"] =
    op === "venta" || op === "renta" ? op : "";

  const st = searchParams.get("sellerType");
  const sellerType: BrResultsParsedState["sellerType"] =
    st === "privado" || st === "negocio" ? st : "";

  const sort = searchParams.get("sort") ?? "reciente";
  const page = searchParams.get("page") ?? "1";

  const propertyType =
    searchParams.get("propertyType") ??
    (() => {
      const tipo = searchParams.get("tipo");
      if (tipo === "casa") return "casa";
      if (tipo === "depto") return "departamento";
      if (tipo === "terreno") return "terreno";
      if (tipo === "comercial") return "comercial";
      return "";
    })();

  return {
    lang,
    q: searchParams.get("q") ?? "",
    city: searchParams.get("city") ?? "",
    operationType,
    propertyType,
    sellerType,
    priceMin: searchParams.get("priceMin") ?? "",
    priceMax: searchParams.get("priceMax") ?? "",
    beds: searchParams.get("beds") ?? searchParams.get("recs") ?? "",
    baths: searchParams.get("baths") ?? "",
    pets: searchParams.get("pets") === "true" ? "true" : "",
    furnished: searchParams.get("furnished") === "true" ? "true" : "",
    pool: searchParams.get("pool") === "true" ? "true" : "",
    sort,
    page,
    zip: searchParams.get("zip") ?? "",
    primary: searchParams.get("primary") ?? "",
    secondary: searchParams.get("secondary") ?? "",
    precio: searchParams.get("precio") ?? "",
  };
}

/**
 * Merge patches into current query string and return a full results href.
 * Passing `null` for a key removes it. Always sets `lang`.
 */
export function mergeBrResultsHref(
  current: URLSearchParams,
  patch: Partial<Record<string, string | null>>,
  lang: Lang
): string {
  const next = new URLSearchParams(current.toString());
  next.set("lang", lang);
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined || v === "") next.delete(k);
    else next.set(k, v);
  }
  const qs = next.toString();
  return qs ? `${BR_RESULTS}?${qs}` : `${BR_RESULTS}?lang=${lang}`;
}
