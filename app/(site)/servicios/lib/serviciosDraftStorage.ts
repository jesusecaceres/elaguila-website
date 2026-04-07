import type { ServiciosApplicationDraft } from "../types/serviciosApplicationDraft";
import { parseServiciosApplicationDraftJson } from "./serviciosDraftParse";

/** Browser persistence key for the Servicios application form (future publicar flow) */
export const SERVICIOS_APPLICATION_DRAFT_STORAGE_KEY = "leonix.servicios.applicationDraft.v1";

export function readServiciosApplicationDraftFromBrowser(): ServiciosApplicationDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SERVICIOS_APPLICATION_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return parseServiciosApplicationDraftJson(raw);
  } catch {
    return null;
  }
}

export function writeServiciosApplicationDraftToBrowser(draft: ServiciosApplicationDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SERVICIOS_APPLICATION_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* quota / private mode */
  }
}
