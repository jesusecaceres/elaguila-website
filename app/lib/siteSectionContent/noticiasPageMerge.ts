import type { NoticiasPagePayload } from "./payloadTypes";

const BASE = {
  es: {
    pageTitle: "Noticias",
    subtitle: "Noticias locales, comunidad, cultura y actualidad para nuestra gente.",
    // N4 editorial-truth audit: this label is the most recent story by publish date (see
    // NoticiasPageClient's `featured` = articles[0]) -- there is no real breaking-news
    // determination behind it, so "Última Hora" overclaimed urgency. "En Portada" (front page /
    // top story) truthfully matches what the code actually surfaces.
    breakingLabel: "En Portada",
  },
  en: {
    pageTitle: "News",
    subtitle: "Local news, community, culture and current stories for our community.",
    breakingLabel: "Top Story",
  },
};

export type NoticiasPageCopy = {
  es: { pageTitle: string; subtitle: string; breakingLabel: string };
  en: { pageTitle: string; subtitle: string; breakingLabel: string };
};

export function mergeNoticiasPagePayload(patch: Record<string, unknown>): NoticiasPageCopy {
  const p = patch as unknown as NoticiasPagePayload;
  return {
    es: {
      pageTitle: p.pageTitle?.es?.trim() || BASE.es.pageTitle,
      subtitle: p.subtitle?.es?.trim() || BASE.es.subtitle,
      breakingLabel: p.breakingLabel?.es?.trim() || BASE.es.breakingLabel,
    },
    en: {
      pageTitle: p.pageTitle?.en?.trim() || BASE.en.pageTitle,
      subtitle: p.subtitle?.en?.trim() || BASE.en.subtitle,
      breakingLabel: p.breakingLabel?.en?.trim() || BASE.en.breakingLabel,
    },
  };
}
