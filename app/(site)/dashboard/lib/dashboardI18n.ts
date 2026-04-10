import type { Lang } from "./listingDisplayStatus";

export type { Lang };

export function dashboardLangFromSearchParams(searchParams: { get: (k: string) => string | null } | null | undefined): Lang {
  return searchParams?.get("lang") === "en" ? "en" : "es";
}
