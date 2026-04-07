/**
 * Travel landing: category-owned URL builders (`/clasificados/travel`, optional `t=` section hints).
 */

export type TravelSectionKey =
  | "deals"
  | "agents"
  | "resorts"
  | "cruises"
  | "tours"
  | "car-rentals"
  | "escapadas";

type Lang = "es" | "en";

/** Preserve query params and target the Travel category page. */
export function buildTravelTargetHref(
  sp: { forEach: (cb: (value: string, key: string) => void) => void } | null | undefined,
  lang: Lang
): string {
  const next = new URLSearchParams();

  if (sp) {
    sp.forEach((value, key) => {
      if (key === "cat") return;
      if (typeof value === "string" && value.length > 0) next.set(key, value);
    });
  }

  next.set("lang", lang);

  return `/clasificados/travel?${next.toString()}`;
}

/** Extend travel href with optional section hint (`t`) and extra params. */
export function buildTravelSectionHref(
  baseHref: string,
  section?: TravelSectionKey,
  extra?: Record<string, string>
): string {
  const [path, qs] = baseHref.split("?");
  const next = new URLSearchParams(qs || "");

  if (section) next.set("t", section);
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => {
      if (v && v.trim().length > 0) next.set(k, v.trim());
    });
  }

  return `${path}?${next.toString()}`;
}
