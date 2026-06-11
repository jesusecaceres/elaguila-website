import type { DealerCustomLink } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { safeExternalHref } from "@/app/clasificados/autos/negocios/lib/dealerDraftSanitize";

const MAX_CUSTOM_LINKS = 2;

function draftSafeTrim(raw: string | undefined, liveDraft: boolean): string {
  if (!raw) return "";
  if (liveDraft && raw !== raw.trimEnd()) return raw;
  return raw.trim();
}

/** Normalize draft rows — caps at 2, ensures stable ids. Drops fully empty rows unless `keepEmptyRows`. */
export function normalizeDealerCustomLinks(
  raw: unknown,
  opts?: { keepEmptyRows?: boolean; liveDraft?: boolean },
): DealerCustomLink[] {
  if (!Array.isArray(raw)) return [];
  const liveDraft = opts?.liveDraft ?? false;
  const out: DealerCustomLink[] = [];
  for (let i = 0; i < raw.length && out.length < MAX_CUSTOM_LINKS; i++) {
    const row = raw[i];
    if (!row || typeof row !== "object") continue;
    const labelRaw = typeof (row as { label?: string }).label === "string" ? (row as { label: string }).label : "";
    const urlRaw = typeof (row as { url?: string }).url === "string" ? (row as { url: string }).url : "";
    const label = draftSafeTrim(labelRaw, liveDraft);
    const url = draftSafeTrim(urlRaw, liveDraft);
    if (!opts?.keepEmptyRows && !label && !url) continue;
    const idRaw =
      typeof (row as { id?: string }).id === "string" ? draftSafeTrim((row as { id: string }).id, false) : "";
    out.push({
      id: idRaw || `dealer-link-${out.length}`,
      label: label || undefined,
      url: url || undefined,
    });
  }
  return out;
}

export type DealerCustomLinkOutput = { label: string; url: string };

/** Output-only rows with safe https URLs (max 2). */
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
