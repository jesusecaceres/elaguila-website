import type { NosotrosPayload } from "./payloadTypes";

export type NosotrosResolved = {
  es: {
    heroTitle: string;
    lead: string;
    mission: string;
    vision: string;
    values: string;
    ctaPrimary: string;
    ctaSecondary: string;
    mediaAlt: string;
  };
  en: {
    heroTitle: string;
    lead: string;
    mission: string;
    vision: string;
    values: string;
    ctaPrimary: string;
    ctaSecondary: string;
    mediaAlt: string;
  };
  mediaImageSrc: string | null;
  ctaPrimaryHref: string | null;
  ctaSecondaryHref: string | null;
};

const BASE: NosotrosResolved = {
  es: {
    heroTitle: "Sobre Leonix Media",
    lead: "Leonix Media es una plataforma bilingüe de visibilidad empresarial, clasificados, comunidad y descubrimiento local bajo Leonix Global LLC. Edita este texto desde el admin para contar tu historia con más detalle.",
    mission: "",
    vision: "",
    values: "",
    ctaPrimary: "Contacto",
    ctaSecondary: "Tienda",
    mediaAlt: "Leonix Media",
  },
  en: {
    heroTitle: "About Leonix Media",
    lead: "Leonix Media is a bilingual business visibility, classifieds, community, and local discovery platform under Leonix Global LLC. Edit this copy in admin to publish your full story.",
    mission: "",
    vision: "",
    values: "",
    ctaPrimary: "Contact",
    ctaSecondary: "Store",
    mediaAlt: "Leonix Media",
  },
  mediaImageSrc: null,
  ctaPrimaryHref: "/contacto",
  ctaSecondaryHref: "/tienda",
};

function s(v: string | undefined, fb: string): string {
  return v !== undefined && v.trim() !== "" ? v.trim() : fb;
}

export function mergeNosotrosCopy(patch: NosotrosPayload | null | undefined): NosotrosResolved {
  if (!patch) return BASE;
  return {
    es: {
      heroTitle: s(patch.heroTitle?.es, BASE.es.heroTitle),
      lead: s(patch.lead?.es, BASE.es.lead),
      mission: s(patch.mission?.es, BASE.es.mission),
      vision: s(patch.vision?.es, BASE.es.vision),
      values: s(patch.values?.es, BASE.es.values),
      ctaPrimary: s(patch.ctaPrimary?.es, BASE.es.ctaPrimary),
      ctaSecondary: s(patch.ctaSecondary?.es, BASE.es.ctaSecondary),
      mediaAlt: s(patch.mediaImageAlt?.es, BASE.es.mediaAlt),
    },
    en: {
      heroTitle: s(patch.heroTitle?.en, BASE.en.heroTitle),
      lead: s(patch.lead?.en, BASE.en.lead),
      mission: s(patch.mission?.en, BASE.en.mission),
      vision: s(patch.vision?.en, BASE.en.vision),
      values: s(patch.values?.en, BASE.en.values),
      ctaPrimary: s(patch.ctaPrimary?.en, BASE.en.ctaPrimary),
      ctaSecondary: s(patch.ctaSecondary?.en, BASE.en.ctaSecondary),
      mediaAlt: s(patch.mediaImageAlt?.en, BASE.en.mediaAlt),
    },
    mediaImageSrc: patch.mediaImageSrc?.trim() || null,
    ctaPrimaryHref: patch.ctaPrimaryHref?.trim() || BASE.ctaPrimaryHref,
    ctaSecondaryHref: patch.ctaSecondaryHref?.trim() || BASE.ctaSecondaryHref,
  };
}
