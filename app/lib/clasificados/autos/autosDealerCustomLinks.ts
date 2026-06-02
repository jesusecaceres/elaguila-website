import type { DealerCustomLink } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { safeExternalHref } from "@/app/clasificados/autos/negocios/lib/dealerDraftSanitize";

const MAX_CUSTOM_LINKS = 3;

/** Normalize draft rows — caps at 3, ensures stable ids. Drops fully empty rows unless `keepEmptyRows`. */
export function normalizeDealerCustomLinks(
  raw: unknown,
  opts?: { keepEmptyRows?: boolean },
): DealerCustomLink[] {
  if (!Array.isArray(raw)) return [];
  const out: DealerCustomLink[] = [];
  for (let i = 0; i < raw.length && out.length < MAX_CUSTOM_LINKS; i++) {
    const row = raw[i];
    if (!row || typeof row !== "object") continue;
    const label = typeof (row as { label?: string }).label === "string" ? (row as { label: string }).label.trim() : "";
    const url = typeof (row as { url?: string }).url === "string" ? (row as { url: string }).url.trim() : "";
    if (!opts?.keepEmptyRows && !label && !url) continue;
    const idRaw = typeof (row as { id?: string }).id === "string" ? (row as { id: string }).id.trim() : "";
    out.push({
      id: idRaw || `dealer-link-${out.length}`,
      label: label || undefined,
      url: url || undefined,
    });
  }
  return out;
}

export type DealerCustomLinkOutput = { label: string; url: string };

/** Output-only rows with safe https URLs (max 3). */
export function dealerCustomLinksForOutput(
  links: DealerCustomLink[] | undefined,
  lang: "es" | "en",
): DealerCustomLinkOutput[] {
  const fallback = lang === "en" ? "Additional link" : "Enlace adicional";
  const out: DealerCustomLinkOutput[] = [];
  for (const row of links ?? []) {
    const href = safeExternalHref(row.url);
    if (!href) continue;
    const label = row.label?.trim() || fallback;
    out.push({ label, url: href });
    if (out.length >= MAX_CUSTOM_LINKS) break;
  }
  return out;
}
