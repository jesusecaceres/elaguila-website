import type { AutosClassifiedsLang } from "./autosClassifiedsTypes";

export function autosVinDecodeButtonLabel(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Decodificar VIN" : "Decode VIN";
}

export function autosVinDecodeHelper(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Usa el VIN para completar datos del vehículo automáticamente. Puedes editar cualquier dato después."
    : "Use the VIN to auto-fill vehicle details. You can edit any field afterward.";
}

export function autosVinDecodeLoading(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Decodificando VIN…" : "Decoding VIN…";
}

export function autosVinDecodeSuccess(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Datos encontrados. Revisa y ajusta antes de continuar."
    : "Details found. Review and adjust before continuing.";
}

export function autosVinDecodePartial(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Encontramos algunos datos. Completa manualmente lo que falte."
    : "We found some details. Complete anything missing manually.";
}

export function autosVinDecodeSummaryTitle(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Datos encontrados por VIN" : "Details found by VIN";
}

export function autosVinDecodeError(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "No pudimos decodificar este VIN. Puedes continuar ingresando los datos manualmente."
    : "We could not decode this VIN. You can continue entering details manually.";
}

export function autosVinDecodeInvalid(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Ingresa un VIN válido de 17 caracteres (sin I, O ni Q)."
    : "Enter a valid 17-character VIN (no I, O, or Q).";
}
