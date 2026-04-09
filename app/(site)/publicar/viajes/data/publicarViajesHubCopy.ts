import type { Lang } from "@/app/clasificados/config/clasificadosHub";

export type PublicarViajesHubCopy = {
  documentTitle: string;
  back: string;
  kicker: string;
  title: string;
  intro: string;
  stepsTitle: string;
  steps: { label: string; detail: string }[];
  negociosTitle: string;
  negociosBody: string;
  negociosCta: string;
  privadoTitle: string;
  privadoBody: string;
  privadoCta: string;
  footLink: string;
  footRest: string;
  modeNote: string;
};

function es(): PublicarViajesHubCopy {
  return {
    documentTitle: "Publicar · Leonix Viajes",
    back: "Volver al hub de publicar",
    kicker: "Leonix Clasificados",
    title: "Publica en Viajes",
    intro:
      "Viajes es una categoría curada. Elige si publicas como negocio/agencia o como particular: ambas vías usan borrador local, vista previa en Clasificados y revisión antes de salir en vivo. Los socios comerciales (afiliados) se gestionan solo en el equipo Leonix — no desde aquí.",
    stepsTitle: "Flujo previsto",
    steps: [
      { label: "1. Entrada", detail: "Eliges negocios o privado y lees expectativas de calidad y confianza." },
      { label: "2. Solicitud", detail: "Completas la oferta en borrador (guardado en este dispositivo)." },
      { label: "3. Vista previa", detail: "Revisas la ficha en Clasificados antes de publicar." },
      { label: "4. Publicación", detail: "El pago y la publicación en vivo llegarán en la siguiente fase del sistema." },
    ],
    negociosTitle: "Negocios y agencias",
    negociosBody:
      "Solicitud estructurada para agencias y operadores — alineada con la ficha pública de Viajes (destino, inclusiones, precio, contacto del negocio).",
    negociosCta: "Continuar a la solicitud",
    privadoTitle: "Particulares (privado)",
    privadoBody:
      "Para personas que ofrecen un viaje, cupo o paquete propio — no es la vía de agencia ni inventario de socios comerciales. Revisión y calidad de anuncio aplican.",
    privadoCta: "Continuar como particular",
    footLink: "Ver Viajes en Clasificados",
    footRest: "para ver ejemplos de fichas y confianza en la categoría.",
    modeNote:
      "Tres vías en el producto: socios comerciales (solo Leonix), negocios con solicitud, y particular con borrador local. Leonix no procesa reservas ni pagos en esta vitrina — descubrimiento y contacto con reglas de confianza de Viajes.",
  };
}

function en(): PublicarViajesHubCopy {
  return {
    documentTitle: "Publish · Leonix Viajes",
    back: "Back to publishing hub",
    kicker: "Leonix Classifieds",
    title: "Publish on Viajes",
    intro:
      "Viajes is curated. Choose business/agency or private individual: both use a local draft, a Classifieds preview, and review before going live. Commercial partner (affiliate) inventory is managed only by Leonix — not from this flow.",
    stepsTitle: "Intended flow",
    steps: [
      { label: "1. Entry", detail: "Choose business or private and read quality and trust expectations." },
      { label: "2. Application", detail: "Complete the offer as a draft (saved on this device)." },
      { label: "3. Preview", detail: "Review your card in Classifieds before publishing." },
      { label: "4. Publishing", detail: "Payment and live publishing arrive in the next system phase." },
    ],
    negociosTitle: "Businesses & agencies",
    negociosBody:
      "Structured application for agencies and operators — aligned with the public Viajes card (destination, inclusions, price, business contact).",
    negociosCta: "Continue to application",
    privadoTitle: "Private individuals",
    privadoBody:
      "For people offering their own trip, spot, or package — not the agency path and not commercial partner inventory. Listings are reviewed for accuracy and quality.",
    privadoCta: "Continue as a private seller",
    footLink: "Open Viajes in Classifieds",
    footRest: "to see sample listings and category trust cues.",
    modeNote:
      "Three lanes in the product: commercial partners (Leonix-internal), businesses via application, and private listings with a local draft. Leonix does not process travel bookings or payments in this showcase — it is discovery and contact with Viajes trust expectations.",
  };
}

export function getPublicarViajesHubCopy(lang: Lang): PublicarViajesHubCopy {
  return lang === "en" ? en() : es();
}
