import type { IglesiasPagePayload } from "./payloadTypes";

const BASE = {
  es: {
    title: "Iglesias",
    subtitle:
      "La oración es para todos. Iglesias existe para ayudar a las personas a encontrar apoyo, comunidad de fe y una iglesia cerca. Leonix no vende posiciones, no rankingea congregaciones y no respalda una teología.",
    note: "¿Representas una iglesia? Envía los datos de tu congregación. Revisamos cada solicitud antes de publicarla.",
    backCta: "Volver a Iglesias",
  },
  en: {
    title: "Churches",
    subtitle:
      "Prayer is for everyone. Iglesias exists to help people find support, faith community, and a church nearby. Leonix does not sell rankings, does not rank congregations, and does not endorse a theology.",
    note: "Do you represent a church? Submit your congregation. Every application is reviewed before it is published.",
    backCta: "Back to Churches",
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
