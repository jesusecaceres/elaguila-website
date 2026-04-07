import type { ServiciosApplicationDraft } from "../../types/serviciosApplicationDraft";

export function createEmptyServiciosApplicationDraft(): ServiciosApplicationDraft {
  return {
    identity: { slug: "", businessName: "" },
    hero: {},
    contact: {},
  };
}
