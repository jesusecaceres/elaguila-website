import type { IglesiasPagePayload } from "./payloadTypes";

const BASE = {
  es: {
    title: "Iglesias",
    subtitle:
      "Muy pronto: un directorio gratuito y neutral para ayudar a familias a encontrar un lugar de adoración. Sin rankings pagados. Sin monetización.",
    note: "¿Tu iglesia quiere aparecer aquí cuando abramos? Escríbenos por ahora desde la página de Contacto.",
    backCta: "Volver a Clasificados",
  },
  en: {
    title: "Churches",
    subtitle:
      "Coming soon: a free, neutral directory to help families find a place of worship. No paid rankings. No monetization.",
    note: "Want your church listed when we open? For now, please reach out using the Contact page.",
    backCta: "Back to Classifieds",
  },
};

export type IglesiasPageCopy = {
  es: { title: string; subtitle: string; note: string; backCta: string };
  en: { title: string; subtitle: string; note: string; backCta: string };
};

export function mergeIglesiasPagePayload(patch: Record<string, unknown>): IglesiasPageCopy {
  const p = patch as unknown as IglesiasPagePayload;
  return {
    es: {
      title: p.title?.es?.trim() || BASE.es.title,
      subtitle: p.subtitle?.es?.trim() || BASE.es.subtitle,
      note: p.note?.es?.trim() || BASE.es.note,
      backCta: p.backCta?.es?.trim() || BASE.es.backCta,
    },
    en: {
      title: p.title?.en?.trim() || BASE.en.title,
      subtitle: p.subtitle?.en?.trim() || BASE.en.subtitle,
      note: p.note?.en?.trim() || BASE.en.note,
      backCta: p.backCta?.en?.trim() || BASE.en.backCta,
    },
  };
}
