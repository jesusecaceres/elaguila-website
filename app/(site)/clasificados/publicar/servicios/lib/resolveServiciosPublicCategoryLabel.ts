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

export function resolveServiciosPublicCategoryLabel(
  state: Pick<ClasificadosServiciosApplicationState, "businessTypeId" | "customServiceDescription">,
  lang: ServiciosLang,
): string | undefined {
  const preset = getBusinessTypePreset(state.businessTypeId);
  const custom = String(state.customServiceDescription ?? "").trim();

  const internalFallback = isServiciosInternalFallbackBusinessTypeId(state.businessTypeId) || preset?.internalGroup === "other";
  if (internalFallback) {
    return custom.length > 0 ? custom : undefined;
  }

  const presetLabel = preset ? (lang === "en" ? preset.labelEn : preset.labelEs) : undefined;
  return presetLabel?.trim() || undefined;
}

