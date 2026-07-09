import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

export function autosVehicleCityHelper(lang: AutosNegociosLang): string {
  return lang === "es"
    ? "Escribe la ciudad del vehículo. Si aparece una sugerencia, puedes seleccionarla; también puedes escribirla manualmente."
    : "Enter the vehicle city. You can select a suggestion if available, or type it manually.";
}

export function autosVehicleZipHelper(lang: AutosNegociosLang): string {
  return lang === "es"
    ? "Acepta cualquier código postal (EE. UU. u otro país)."
    : "Accepts any postal / ZIP code (US or international).";
}

export function autosVehicleCountryHelper(lang: AutosNegociosLang): string {
  return lang === "es"
    ? "Por defecto Estados Unidos; puedes escribir otro país si aplica."
    : "Defaults to United States; enter another country if needed.";
}

export function autosVehicleCityPlaceholder(lang: AutosNegociosLang): string {
  return lang === "es" ? "Ciudad del vehículo" : "Vehicle city";
}
