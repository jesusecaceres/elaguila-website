import { isIglesiasNeedKey, isIglesiasServiceLanguage, type IglesiasNeedKey, type IglesiasServiceLanguage } from "./taxonomy";
import type { IglesiasBrowseState } from "./types";

export type { IglesiasBrowseState };

export function emptyIglesiasBrowseState(): IglesiasBrowseState {
  return {
    q: "",
    city: "",
    zip: "",
    need: null,
    language: null,
    prayerNetwork: null,
  };
}

function first(sp: URLSearchParams, key: string): string {
  return (sp.get(key) ?? "").trim();
}

/**
 * UI language remains `lang` (Leonix chrome).
 * Church language filter uses `language` so the two never collide.
 * `prayer_network` is accepted for forward-compatible URLs and ignored in BUILD 01 filtering.
 */
export function parseIglesiasBrowseState(sp: URLSearchParams): IglesiasBrowseState {
  const needRaw = first(sp, "need").toUpperCase();
  const languageRaw = first(sp, "language").toLowerCase();
  const prayerRaw = first(sp, "prayer_network").toLowerCase();

  const cityRaw = first(sp, "city").slice(0, 80);
  const zipRaw = first(sp, "zip").slice(0, 12);
  const zipFromCity = !zipRaw && /^\d{5}(-\d{4})?$/.test(cityRaw);
  const zip = zipFromCity ? cityRaw : zipRaw;
  const city = zipFromCity ? "" : cityRaw;

  return {
    q: first(sp, "q").slice(0, 120),
    city,
    zip,
    need: isIglesiasNeedKey(needRaw) ? (needRaw as IglesiasNeedKey) : null,
    language: isIglesiasServiceLanguage(languageRaw) ? (languageRaw as IglesiasServiceLanguage) : null,
    prayerNetwork: prayerRaw === "1" || prayerRaw === "true" ? true : prayerRaw === "0" || prayerRaw === "false" ? false : null,
  };
}

export function iglesiasBrowseSearchParams(state: IglesiasBrowseState, uiLang: "es" | "en"): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set("lang", uiLang);
  if (state.q) sp.set("q", state.q);
  if (state.city) sp.set("city", state.city);
  if (state.zip) sp.set("zip", state.zip);
  if (state.need) sp.set("need", state.need);
  if (state.language) sp.set("language", state.language);
  if (state.prayerNetwork === true) sp.set("prayer_network", "1");
  return sp;
}

export function buildIglesiasHref(state: IglesiasBrowseState, uiLang: "es" | "en", hash?: string): string {
  const qs = iglesiasBrowseSearchParams(state, uiLang).toString();
  const path = qs ? `/iglesias?${qs}` : `/iglesias?lang=${uiLang}`;
  return hash ? `${path}#${hash}` : path;
}

export function iglesiasHasActiveFilters(state: IglesiasBrowseState): boolean {
  return Boolean(state.q || state.city || state.zip || state.need || state.language);
}
