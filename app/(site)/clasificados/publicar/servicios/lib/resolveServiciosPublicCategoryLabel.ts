import { getBusinessTypePreset } from "./businessTypePresets";
import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";

function normalizeId(id: string): string {
  return String(id ?? "").trim().toLowerCase();
}

export function isServiciosInternalFallbackBusinessTypeId(id: string): boolean {
  const norm = normalizeId(id);
  if (!norm) return false;
  if (norm === "servicio_otro_generico") return true;
  if (norm === "servicio_no_listado") return true;
  if (norm.includes("no_listado")) return true;
  if (norm.includes("no-veo") || norm.includes("no_veo")) return true;
  if (norm.includes("otro")) return true;
  return false;
}

/**
 * The single rule for "this business type publishes the owner's own description as its public
 * category line" (today only "Otro servicio"). For these types `customServiceDescription` is
 * persisted ONLY as `hero.categoryLine`, so edit hydration reads it back from there using this same
 * rule (serviciosPublishedToApplicationDraft.ts).
 */
export function serviciosBusinessTypeUsesCustomCategoryLabel(businessTypeId: string): boolean {
  return (
    isServiciosInternalFallbackBusinessTypeId(businessTypeId) ||
    getBusinessTypePreset(businessTypeId)?.internalGroup === "other"
  );
}

export function resolveServiciosPublicCategoryLabel(
  state: Pick<ClasificadosServiciosApplicationState, "businessTypeId" | "customServiceDescription">,
  lang: ServiciosLang,
): string | undefined {
  if (serviciosBusinessTypeUsesCustomCategoryLabel(state.businessTypeId)) {
    const custom = String(state.customServiceDescription ?? "").trim();
    return custom.length > 0 ? custom : undefined;
  }

  const preset = getBusinessTypePreset(state.businessTypeId);
  const presetLabel = preset ? (lang === "en" ? preset.labelEn : preset.labelEs) : undefined;
  return presetLabel?.trim() || undefined;
}

