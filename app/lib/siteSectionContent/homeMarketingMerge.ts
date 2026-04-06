import type { HomeMarketingPayload } from "./payloadTypes";

export type HomeMarketingResolved = {
  es: {
    title: string;
    identity: string;
    precedent: string;
    ctaPrimary: string;
    ctaSecondary: string;
    coverAlt: string;
  };
  en: {
    title: string;
    identity: string;
    precedent: string;
    ctaPrimary: string;
    ctaSecondary: string;
    coverAlt: string;
  };
  coverImageSrc: string;
};

const BASE: HomeMarketingResolved = {
  es: {
    title: "LEONIX",
    identity: "Comunidad, Cultura y Fe",
    precedent: "Revista de Comunidad, Cultura y Negocios",
    ctaPrimary: "Explorar la revista",
    ctaSecondary: "Edición digital",
    coverAlt: "Portada de la revista LEONIX",
  },
  en: {
    title: "LEONIX",
    identity: "Community, Culture & Faith",
    precedent: "Magazine of Community, Culture & Business",
    ctaPrimary: "Explore the magazine",
    ctaSecondary: "Digital edition",
    coverAlt: "LEONIX magazine cover",
  },
  coverImageSrc: "/home_thumbnail.png",
};

function s(v: string | undefined, fallback: string): string {
  return v !== undefined && v.trim() !== "" ? v.trim() : fallback;
}

export function mergeHomeMarketing(patch: HomeMarketingPayload | null | undefined): HomeMarketingResolved {
  if (!patch) return BASE;
  return {
    es: {
      title: s(patch.title?.es, BASE.es.title),
      identity: s(patch.identity?.es, BASE.es.identity),
      precedent: s(patch.precedent?.es, BASE.es.precedent),
      ctaPrimary: s(patch.ctaPrimary?.es, BASE.es.ctaPrimary),
      ctaSecondary: s(patch.ctaSecondary?.es, BASE.es.ctaSecondary),
      coverAlt: s(patch.coverAlt?.es, BASE.es.coverAlt),
    },
    en: {
      title: s(patch.title?.en, BASE.en.title),
      identity: s(patch.identity?.en, BASE.en.identity),
      precedent: s(patch.precedent?.en, BASE.en.precedent),
      ctaPrimary: s(patch.ctaPrimary?.en, BASE.en.ctaPrimary),
      ctaSecondary: s(patch.ctaSecondary?.en, BASE.en.ctaSecondary),
      coverAlt: s(patch.coverAlt?.en, BASE.en.coverAlt),
    },
    coverImageSrc: patch.coverImageSrc?.trim() || BASE.coverImageSrc,
  };
}
