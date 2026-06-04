import { createEmptyOfertaLocalDraft } from "./createEmptyOfertaLocalDraft";
import type { OfertaLocalDraft } from "./ofertasLocalesTypes";

export const OFERTAS_LOCALES_DRAFT_STORAGE_KEY = "leonix:ofertas-locales:draft:v1" as const;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function mergeDraft(stored: Record<string, unknown>): OfertaLocalDraft {
  const base = createEmptyOfertaLocalDraft();
  return {
    ...base,
    ...stored,
    serviceZipCodes: Array.isArray(stored.serviceZipCodes)
      ? stored.serviceZipCodes.filter((z): z is string => typeof z === "string")
      : base.serviceZipCodes,
    languageTags: Array.isArray(stored.languageTags)
      ? stored.languageTags.filter((t): t is OfertaLocalDraft["languageTags"][number] =>
          t === "es" || t === "en" || t === "bilingual"
        )
      : base.languageTags,
    flyerAssets: [],
    couponAssets: [],
  };
}

export function loadOfertaLocalDraftFromStorage(): OfertaLocalDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(OFERTAS_LOCALES_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainObject(parsed)) return null;
    return mergeDraft(parsed);
  } catch {
    return null;
  }
}

export function saveOfertaLocalDraftToStorage(draft: OfertaLocalDraft): void {
  if (typeof window === "undefined") return;
  try {
    const payload = { ...draft, flyerAssets: [], couponAssets: [] };
    window.localStorage.setItem(OFERTAS_LOCALES_DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota or privacy mode — ignore silently.
  }
}

export function clearOfertaLocalDraftStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(OFERTAS_LOCALES_DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
