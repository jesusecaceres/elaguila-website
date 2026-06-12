import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

export function autosVehicleCityHelper(lang: AutosNegociosLang): string {
  return lang === "es"
    ? "Escribe la ciudad del vehículo. Si aparece una sugerencia, puedes seleccionarla; también puedes escribirla manualmente."
    : "Enter the vehicle city. You can select a suggestion if available, or type it manually.";
}

export function autosVehicleZipHelper(lang: AutosNegociosLang): string {
  return lang === "es"
    ? "Usa el código postal del vehículo para mejorar ubicación, búsqueda y filtros."
    : "Use the vehicle ZIP code to improve location, search, and filters.";
}

export function autosVehicleCityPlaceholder(lang: AutosNegociosLang): string {
  return lang === "es" ? "Ciudad del vehículo" : "Vehicle city";
}
