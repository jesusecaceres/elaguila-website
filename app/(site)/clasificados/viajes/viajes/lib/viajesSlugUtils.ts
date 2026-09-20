import { normalizeViajesDestinationKey } from "./normalizeViajesDestination";

export function slugifyViajesListingBase(raw: string): string {
  const s = normalizeViajesDestinationKey(raw).replace(/\s+/g, "-").replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return s.slice(0, 56) || "viaje";
}
