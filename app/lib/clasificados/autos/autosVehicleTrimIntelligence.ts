import type { AutosClassifiedsLang } from "./autosClassifiedsTypes";
import { getKnownTrimsForVehicle } from "./autosVehicleData";

export function autosMissingStructuredTrimHelper(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "No encontramos versiones estructuradas para este modelo en nuestra lista. Puedes escribirla manualmente o usar el VIN para intentar completar más datos."
    : "We could not find structured trims for this model in our list. You can type it manually or use the VIN to try to complete more details.";
}

export function autosVinDetectedTrimLabel(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Detectado por VIN" : "Detected by VIN";
}

export function hasLocalStructuredTrims(year: number | undefined, make: string | undefined, model: string | undefined): boolean {
  return getKnownTrimsForVehicle(year, make, model).length > 0;
}

export function trimMatchesLocalCatalog(
  trim: string | undefined,
  year: number | undefined,
  make: string | undefined,
  model: string | undefined,
): boolean {
  const t = trim?.trim();
  if (!t) return false;
  return getKnownTrimsForVehicle(year, make, model).some((x) => x.toLowerCase() === t.toLowerCase());
}
