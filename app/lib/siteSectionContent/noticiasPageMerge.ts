import type { NoticiasPagePayload } from "./payloadTypes";

const BASE = {
  es: {
    pageTitle: "Noticias",
    subtitle: "Titulares, cultura y comunidad — actualizado al momento para nuestra gente.",
    breakingLabel: "Última Hora",
  },
  en: {
    pageTitle: "News",
    subtitle: "Headlines, culture, and community — updated in real time for our people.",
    breakingLabel: "Breaking",
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
