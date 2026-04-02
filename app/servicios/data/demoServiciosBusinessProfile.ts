import type { ServiciosBusinessProfile, ServiciosLang } from "../types/serviciosBusinessProfile";
import { mapServiciosApplicationDraftToBusinessProfile } from "../lib/mapServiciosApplicationDraftToBusinessProfile";
import {
  getServiciosApplicationDraftSample,
  serviciosApplicationDraftExpertEn,
  serviciosApplicationDraftExpertEs,
  serviciosApplicationDraftMediumEs,
  serviciosApplicationDraftSparseEs,
} from "./serviciosApplicationDraftSamples";

/**
 * Demo / slug resolver — always: draft → wire profile → `resolveServiciosProfile` at the page boundary.
 */
export function getServiciosProfileBySlug(slug: string, lang: ServiciosLang = "es"): ServiciosBusinessProfile {
  if (slug === "minimal-demo") {
    return mapServiciosApplicationDraftToBusinessProfile(serviciosApplicationDraftSparseEs);
  }
  if (slug === "medium-demo") {
    return mapServiciosApplicationDraftToBusinessProfile(serviciosApplicationDraftMediumEs);
  }
  if (lang === "en") {
    return mapServiciosApplicationDraftToBusinessProfile(serviciosApplicationDraftExpertEn);
  }
  return mapServiciosApplicationDraftToBusinessProfile(serviciosApplicationDraftExpertEs);
}

/** Wire profile from a named sample (used by preview and tests) */
export function getServiciosWireProfileFromSample(
  sampleId: Parameters<typeof getServiciosApplicationDraftSample>[0],
  lang: ServiciosLang
): ServiciosBusinessProfile {
  const draft = getServiciosApplicationDraftSample(sampleId, lang);
  return mapServiciosApplicationDraftToBusinessProfile(draft);
}

/** Re-export drafts for tests / admin tooling */
export {
  serviciosApplicationDraftExpertEs,
  serviciosApplicationDraftExpertEn,
  serviciosApplicationDraftMediumEs,
  serviciosApplicationDraftSparseEs,
};
