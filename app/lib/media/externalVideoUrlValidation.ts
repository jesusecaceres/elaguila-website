/**
 * Globalization Package B (Gate B3) — shared strict external-video URL validator.
 *
 * Fills the two confirmed validator gaps without inventing per-category provider policy:
 *  - SERVICIOS previously accepted any web URL for its video slots (generic
 *    isProbablyValidWebUrl — no https requirement, no parseability guarantee).
 *  - VIAJES (negocios) has a raw `videoUrl` string with no validation at all; the Viajes
 *    workstream consumes THIS validator through the media boundary contract
 *    (listingMediaConfigs.ts `videoValidator: "shared-https-strict"`) — no Viajes-owned UI is
 *    edited by this program.
 *
 * Semantics deliberately mirror the strictest existing category validator
 * (normalizeAutosExternalVideoUrl, app/lib/clasificados/autos/autosExternalVideoUrlValidation.ts):
 * https-only, URL-parseable, never a local/preview ref (blob:/data:), trimmed. No provider
 * whitelist — same as Autos: any https host is a valid EXTERNAL link; embeddability remains a
 * per-category presentation concern. Local video uploads are never allowed through this path.
 */

import { isPersistableMediaUrl } from "./listingMediaContract";

/** Returns the normalized URL, or null when invalid. */
export function normalizeStrictExternalVideoUrl(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (!isPersistableMediaUrl(value)) return null;
  if (!/^https:\/\//i.test(value)) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function isStrictExternalVideoUrl(raw: string | null | undefined): boolean {
  return normalizeStrictExternalVideoUrl(raw) !== null;
}
