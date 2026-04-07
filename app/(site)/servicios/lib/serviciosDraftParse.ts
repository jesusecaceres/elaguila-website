import type { ServiciosApplicationDraft } from "../types/serviciosApplicationDraft";

/** Minimal structural validation — resolver + UI guards handle the rest */
export function parseServiciosApplicationDraftJson(json: string): ServiciosApplicationDraft | null {
  try {
    const v = JSON.parse(json) as unknown;
    if (!v || typeof v !== "object") return null;
    const o = v as Record<string, unknown>;
    if (!o.identity || typeof o.identity !== "object") return null;
    const id = o.identity as Record<string, unknown>;
    if (typeof id.slug !== "string" || typeof id.businessName !== "string") return null;
    if (!o.hero || typeof o.hero !== "object") return null;
    if (!o.contact || typeof o.contact !== "object") return null;
    return v as ServiciosApplicationDraft;
  } catch {
    return null;
  }
}
