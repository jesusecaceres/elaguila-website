/**
 * Preserve return context when opening offer detail from Viajes home vs results.
 */

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { getViajesUi } from "../data/viajesUiCopy";
import { setLangOnHref } from "./viajesLangHref";

const VIAJES_PREFIX = "/clasificados/viajes";

export function isSafeViajesInternalPath(path: string): boolean {
  if (!path.startsWith(VIAJES_PREFIX)) return false;
  if (path.includes("://")) return false;
  if (path.includes("//")) return false;
  return true;
}

/** Append `back` query for offer detail routes (`URLSearchParams` handles encoding). */
export function withViajesOfferBackParam(offerHref: string, backPath: string): string {
  if (!offerHref.includes("/clasificados/viajes/oferta/")) return offerHref;
  const [path, existingQs] = offerHref.split("?");
  const p = new URLSearchParams(existingQs ?? "");
  p.set("back", backPath);
  const qs = p.toString();
  return qs ? `${path}?${qs}` : path;
}

export function parseViajesOfferBackParam(raw: string | string[] | undefined): string | undefined {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v || typeof v !== "string") return undefined;
  try {
    const decoded = decodeURIComponent(v);
    return isSafeViajesInternalPath(decoded) ? decoded : undefined;
  } catch {
    return isSafeViajesInternalPath(v) ? v : undefined;
  }
}

export function resolveViajesOfferBack(
  rawBack: string | string[] | undefined,
  /** When `back` query is missing or unsafe (e.g. direct entry). */
  fallbackHref: string = "/clasificados/viajes",
  lang: Lang = "es"
): { href: string; label: string } {
  const parsed = parseViajesOfferBackParam(rawBack);
  const rawHref = parsed ?? fallbackHref;
  const href = setLangOnHref(rawHref, lang);
  const ui = getViajesUi(lang);
  const label = rawHref.includes("/resultados") ? ui.backToResults : ui.backToViajesHome;
  return { href, label };
}
