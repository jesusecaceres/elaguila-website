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
  soonTitle: string;
  soonBody: string;
  soonCta: string;
  footLink: string;
  footRest: string;
  modeNote: string;
};

function es(): PublicarViajesHubCopy {
  return {
    documentTitle: "Publicar · Leonix Viajes",
    back: "Volver al hub de publicar",
    kicker: "Leonix Clasificados",
    title: "Publica una oferta de viajes (negocio)",
    intro:
      "Viajes es una categoría curada: las solicitudes de negocio pasan por revisión antes de publicarse. Aquí eliges la vía de agencia u operador — no hay publicación libre para particulares en esta versión.",
    stepsTitle: "Flujo previsto",
    steps: [
      { label: "1. Entrada", detail: "Eliges la vía de negocio y entiendes expectativas." },
      { label: "2. Solicitud", detail: "Completas la oferta y los datos del negocio (borrador local)." },
      { label: "3. Vista previa", detail: "Revisas cómo se verá la ficha pública en Clasificados." },
      { label: "4. Envío y moderación", detail: "El envío en vivo y la moderación llegarán en una siguiente fase del producto." },
    ],
    negociosTitle: "Negocios y agencias",
    negociosBody:
      "Solicitud estructurada para ofertas de viaje de calidad — alineada con la ficha pública de Viajes (destino, inclusiones, precio, contacto).",
    negociosCta: "Continuar a la solicitud",
    soonTitle: "Socios e integraciones",
    soonBody: "Reservado para inventario de socios comerciales y programas internos. Sin autoservicio abierto aún.",
    soonCta: "Próximamente",
    footLink: "Ver Viajes en Clasificados",
    footRest: "para ver ejemplos de fichas y confianza en la categoría.",
    modeNote:
      "Leonix no procesa reservas ni pagos de viajes en esta vitrina — es descubrimiento y contacto, con reglas de confianza propias de Viajes.",
  };
}

function en(): PublicarViajesHubCopy {
  return {
    documentTitle: "Publish · Leonix Viajes",
    back: "Back to publishing hub",
    kicker: "Leonix Classifieds",
    title: "Publish a travel offer (business)",
    intro:
      "Viajes is a curated category: business applications are reviewed before going live. This path is for agencies and operators — there is no open consumer free-post lane in this version.",
    stepsTitle: "Intended flow",
    steps: [
      { label: "1. Entry", detail: "Choose the business path and understand expectations." },
      { label: "2. Application", detail: "Complete the offer and business details (local draft)." },
      { label: "3. Preview", detail: "Review how the public listing will look in Classifieds." },
      { label: "4. Submit & moderation", detail: "Live submit and moderation ship in a later product phase." },
    ],
    negociosTitle: "Businesses & agencies",
    negociosBody:
      "Structured request for quality travel offers — aligned with the public Viajes card (destination, inclusions, price, contact).",
    negociosCta: "Continue to application",
    soonTitle: "Partners & integrations",
    soonBody: "Reserved for commercial partner inventory and internal programs. Not open for self-serve yet.",
    soonCta: "Coming soon",
    footLink: "Open Viajes in Classifieds",
    footRest: "to see sample listings and category trust cues.",
    modeNote:
      "Leonix does not process travel bookings or payments in this showcase — it’s discovery and contact, with Viajes-specific trust expectations.",
  };
}

export function getPublicarViajesHubCopy(lang: Lang): PublicarViajesHubCopy {
  return lang === "en" ? en() : es();
}
