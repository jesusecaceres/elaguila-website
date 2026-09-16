/**
 * Autos Dealer's category config for the shared `ApplicationReadinessChecklist` — informational
 * only, never a completion gate. Items mirror what the current Dealer application actually asks
 * for (dealership identity/contact, address/hours, vehicle identity/media/description).
 */
import type { AutosNegociosLang } from "./autosNegociosLang";

export function autosDealerReadinessChecklistTitle(lang: AutosNegociosLang): string {
  return lang === "es" ? "¿Listo para publicar? Ten esto a la mano" : "Ready to publish? Have this on hand";
}

export function autosDealerReadinessChecklistIntro(lang: AutosNegociosLang): string {
  return lang === "es"
    ? "Opcional — te ayuda a completar la solicitud más rápido. Nada aquí bloquea tu progreso."
    : "Optional — helps you move through the application faster. Nothing here blocks your progress.";
}

export function autosDealerReadinessChecklistItems(lang: AutosNegociosLang): string[] {
  return lang === "es"
    ? [
        "Nombre del concesionario",
        "Logo del concesionario",
        "Teléfono de oficina",
        "Teléfono personal / móvil",
        "Número para mensajes de texto",
        "Número de WhatsApp",
        "Sitio web",
        "URL para agendar cita / prueba de manejo",
        "Dirección del negocio",
        "Horario regular",
        "Horarios especiales, si aplica",
        "Idiomas que hablas",
        "Enlaces a redes sociales, si los usas",
        "Enlaces de Google / Yelp, si los usas",
        "Contacto de financiamiento, si aplica",
        "VIN / número de stock",
        "Año, marca, modelo y versión",
        "Precio y millaje",
        "Fotos del vehículo",
        "URLs de video, opcional",
        "Descripción del vehículo",
      ]
    : [
        "Dealership name",
        "Dealer logo",
        "Office phone",
        "Personal / mobile phone",
        "SMS/text number",
        "WhatsApp number",
        "Website",
        "Booking / test-drive URL",
        "Business address",
        "Regular hours",
        "Special hours, if any",
        "Languages you speak",
        "Social links, if used",
        "Google / Yelp links, if used",
        "Finance contact, if applicable",
        "VIN / stock number",
        "Year, make, model, and trim",
        "Price and mileage",
        "Vehicle photos",
        "Video URLs, optional",
        "Vehicle description",
      ];
}
