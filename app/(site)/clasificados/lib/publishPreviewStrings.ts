/**
 * Compact preview / card display strings derived from the unified publish snapshot.
 */

import type { PublishDraftSnapshot } from "@/app/clasificados/lib/publishDraftSnapshot";

export type PublishPreviewLang = "es" | "en";

export function getShortPreviewText(raw: string, maxLen = 90): string {
  const t = (raw ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen).trim() + "…";
}

export const COMPACT_PREVIEW_TEASER_MAX_LEN = 80;

export function buildPublishPreviewDisplayStrings(params: {
  snapshot: PublishDraftSnapshot;
  lang: PublishPreviewLang;
  todayLabel: string;
}): {
  previewTitle: string;
  previewDescription: string;
  previewPrice: string;
  previewCity: string;
  previewPosted: string;
  previewShortDescription: string;
} {
  const { snapshot, lang, todayLabel } = params;
  return {
    previewTitle: snapshot.title || (lang === "es" ? "(Sin título)" : "(No title)"),
    previewDescription: snapshot.description || (lang === "es" ? "(Sin descripción)" : "(No description)"),
    previewPrice: snapshot.priceLabel,
    previewCity: (snapshot.cityCanonical ?? snapshot.city) || (lang === "es" ? "(Ciudad)" : "(City)"),
    previewPosted: todayLabel,
    previewShortDescription: getShortPreviewText(snapshot.description, COMPACT_PREVIEW_TEASER_MAX_LEN),
  };
}

