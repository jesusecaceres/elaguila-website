/**
 * Package 3 — Community Opportunity Intake copy (ES/EN), following the per-surface typed copy
 * module pattern (`publicarViajesNegociosCopy.ts`). Doctrine wording: free to participate,
 * curated for community value, reviewed before publication — never "exclusive", "verified",
 * "guaranteed", or "best deal".
 */

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type {
  ViajesIntakeBenefitType,
  ViajesIntakeOfferType,
  ViajesIntakePriceBasis,
  ViajesIntakeSamePublicOffer,
  ViajesIntakeValueBand,
} from "@/app/(site)/clasificados/viajes/lib/viajesIntakeTypes";

export type PublicarViajesIntakeCopy = {
  documentTitle: string;
  navBack: string;
  kicker: string;
  title: string;
  intro: string;
  freeLine: string;
  sections: { business: string; offer: string; benefit: string };
  sectionHints: { business: string; offer: string; benefit: string };
  fields: {
    businessName: { label: string; placeholder: string };
    contactName: { label: string; placeholder: string };
    email: { label: string; placeholder: string };
    phone: { label: string; placeholder: string };
    website: { label: string; placeholder: string };
    socials: { label: string; placeholder: string };
    offerType: { label: string; options: Record<ViajesIntakeOfferType | "", string> };
    destino: { label: string; placeholder: string };
    ciudadSalida: { label: string; placeholder: string };
    precio: { label: string; placeholder: string };
    priceBasis: { label: string; options: Record<ViajesIntakePriceBasis | "", string> };
    benefitTypes: { label: string; hint: string; options: Record<ViajesIntakeBenefitType, string> };
    benefitDescription: { label: string; placeholder: string };
    samePublicOffer: { label: string; options: Record<ViajesIntakeSamePublicOffer, string> };
    estimatedValueBand: { label: string; options: Record<ViajesIntakeValueBand | "", string> };
    expiration: { label: string; placeholder: string };
    restrictions: { label: string; placeholder: string };
  };
  errors: Record<string, string>;
  authNote: string;
  submitCta: string;
  submitting: string;
  received: {
    title: string;
    body: string;
    continueNow: string;
    later: string;
  };
  networkError: string;
};

const ES: PublicarViajesIntakeCopy = {
  documentTitle: "Publicar Viajes — Cuéntanos tu oportunidad | Leonix",
  navBack: "Volver a publicar Viajes",
  kicker: "Negocio de viajes · Gratis",
  title: "Cuéntanos qué ofreces",
  intro:
    "Cuéntanos qué ofreces y cómo beneficia a nuestra comunidad. Este formulario corto le da a Leonix una idea de tu oportunidad antes de la solicitud completa — lo que escribas aquí se reutiliza después para que no tengas que escribirlo dos veces.",
  freeLine: "Gratis para participar · seleccionado por valor comunitario · revisado antes de publicar. Sin pago.",
  sections: { business: "1. Tu negocio", offer: "2. Tu oferta", benefit: "3. Beneficio para la comunidad" },
  sectionHints: {
    business: "Quién ofrece esto y cómo te contactamos.",
    offer: "Qué ofreces, dónde y su precio público aproximado.",
    benefit: "Qué recibe la comunidad Leonix. Si es la misma oferta pública, también está bien — dilo tal cual.",
  },
  fields: {
    businessName: { label: "Nombre del negocio o agencia", placeholder: "Ej. Viajes El Sol" },
    contactName: { label: "Nombre de contacto", placeholder: "Persona responsable" },
    email: { label: "Correo", placeholder: "correo@negocio.com" },
    phone: { label: "Teléfono", placeholder: "Ej. (555) 123-4567" },
    website: { label: "Sitio web (opcional)", placeholder: "www.tunegocio.com" },
    socials: { label: "Red social (opcional)", placeholder: "Facebook, Instagram u otro enlace" },
    offerType: {
      label: "Tipo de oferta",
      options: {
        "": "Selecciona…",
        paquete: "Paquete vacacional",
        tour: "Tour / excursión",
        crucero: "Crucero",
        resort: "Hotel / resort",
        escapada: "Escapada",
        transporte: "Transporte / traslados",
        "agencia-servicio": "Agencia / servicio de viajes",
        "viaje-grupo": "Viaje en grupo",
        "viaje-familiar": "Viaje familiar",
        "viaje-religioso": "Viaje religioso / de iglesia",
        "viaje-educativo": "Viaje educativo",
        otro: "Otro",
      },
    },
    destino: { label: "Destino", placeholder: "Ciudad, región o país" },
    ciudadSalida: { label: "Ciudad o región de salida", placeholder: "Ej. San José" },
    precio: { label: "Precio normal / público aproximado", placeholder: "Ej. $1,999" },
    priceBasis: {
      label: "El precio es",
      options: {
        "": "Selecciona…",
        per_person: "Por persona",
        couple: "Por pareja",
        family: "Por familia",
        group: "Por grupo",
      },
    },
    benefitTypes: {
      label: "¿Qué recibe la comunidad Leonix?",
      hint: "Marca lo que aplique. Si no hay un beneficio adicional, deja esto vacío.",
      options: {
        exclusive_discount: "Descuento para la comunidad",
        reduced_booking_fee: "Cuota de reserva reducida o sin costo",
        free_consultation: "Consulta gratuita",
        payment_plan: "Plan de pagos",
        family_discount: "Descuento familiar",
        child_discount: "Descuento para niños",
        group_discount: "Descuento de grupo",
        senior_discount: "Descuento para adultos mayores",
        free_upgrade: "Mejora (upgrade) sin costo",
        free_transportation: "Transporte o recogida sin costo",
        added_amenity: "Amenidad o servicio adicional",
        exclusive_dates: "Fechas o paquete especial",
        community_pricing: "Precio comunitario / sin fines de lucro",
        other: "Otro",
      },
    },
    benefitDescription: {
      label: "Describe el beneficio con exactitud",
      placeholder: "Ej. $250 de descuento y consulta en español para la comunidad Leonix",
    },
    samePublicOffer: {
      label: "¿Esta oferta es la misma que ofreces al público en general?",
      options: {
        same: "Sí, es la misma oferta pública",
        extra: "No, la comunidad Leonix recibe un beneficio adicional",
        partial: "En parte — la comunidad Leonix recibe algo extra",
      },
    },
    estimatedValueBand: {
      label: "Valor aproximado del beneficio",
      options: {
        "": "Selecciona…",
        lt25: "Menos de $25",
        "25_50": "$25–$50",
        "51_100": "$51–$100",
        "101_250": "$101–$250",
        gt250: "$251 o más",
        non_monetary: "No monetario",
      },
    },
    expiration: { label: "Vigencia del beneficio (opcional)", placeholder: "Ej. hasta el 31 de diciembre" },
    restrictions: {
      label: "Restricciones, fechas excluidas o requisitos (opcional)",
      placeholder: "Ej. sujeto a disponibilidad; no aplica en feriados",
    },
  },
  errors: {
    business_name_required: "Escribe el nombre del negocio.",
    contact_name_required: "Escribe el nombre de contacto.",
    email_required: "Escribe un correo.",
    email_invalid: "Revisa el formato del correo.",
    phone_required: "Escribe un teléfono.",
    phone_invalid: "Revisa el formato del teléfono.",
    destination_required: "Escribe el destino.",
    offer_type_required: "Selecciona el tipo de oferta.",
    same_public_offer_required: "Indica si es la misma oferta pública.",
    benefit_description_required: "Describe el beneficio que marcaste.",
  },
  authNote: "Para enviar necesitas iniciar sesión — así tu solicitud queda guardada en tu panel.",
  submitCta: "Enviar información",
  submitting: "Enviando…",
  received: {
    title: "Recibido.",
    body: "Leonix ya tiene la información inicial de tu oportunidad. Puedes continuar ahora con tu solicitud completa — o hacerlo después desde tu panel.",
    continueNow: "Continuar ahora",
    later: "Continuar después desde mi panel",
  },
  networkError: "Error de red. Intenta de nuevo.",
};

const EN: PublicarViajesIntakeCopy = {
  documentTitle: "Publish Travel — Tell us your opportunity | Leonix",
  navBack: "Back to publish Travel",
  kicker: "Travel business · Free",
  title: "Tell us what you offer",
  intro:
    "Tell us what you offer and how it benefits our community. This short form gives Leonix a sense of your opportunity before the full application — what you write here is reused later so you never type it twice.",
  freeLine: "Free to participate · curated for community value · reviewed before publication. No payment.",
  sections: { business: "1. Your business", offer: "2. Your offer", benefit: "3. Community benefit" },
  sectionHints: {
    business: "Who offers this and how we reach you.",
    offer: "What you offer, where, and its approximate public price.",
    benefit: "What the Leonix community receives. If it's the same public offer, that's fine too — just say so.",
  },
  fields: {
    businessName: { label: "Business or agency name", placeholder: "E.g. Viajes El Sol" },
    contactName: { label: "Contact name", placeholder: "Person in charge" },
    email: { label: "Email", placeholder: "email@business.com" },
    phone: { label: "Phone", placeholder: "E.g. (555) 123-4567" },
    website: { label: "Website (optional)", placeholder: "www.yourbusiness.com" },
    socials: { label: "Social profile (optional)", placeholder: "Facebook, Instagram, or another link" },
    offerType: {
      label: "Offer type",
      options: {
        "": "Select…",
        paquete: "Vacation package",
        tour: "Tour / excursion",
        crucero: "Cruise",
        resort: "Hotel / resort",
        escapada: "Getaway",
        transporte: "Transportation / transfers",
        "agencia-servicio": "Travel agency / service",
        "viaje-grupo": "Group trip",
        "viaje-familiar": "Family trip",
        "viaje-religioso": "Religious / church trip",
        "viaje-educativo": "Educational trip",
        otro: "Other",
      },
    },
    destino: { label: "Destination", placeholder: "City, region, or country" },
    ciudadSalida: { label: "Departure city or region", placeholder: "E.g. San José" },
    precio: { label: "Approximate normal / public price", placeholder: "E.g. $1,999" },
    priceBasis: {
      label: "The price is",
      options: {
        "": "Select…",
        per_person: "Per person",
        couple: "Per couple",
        family: "Per family",
        group: "Per group",
      },
    },
    benefitTypes: {
      label: "What does the Leonix community receive?",
      hint: "Check all that apply. If there is no additional benefit, leave this empty.",
      options: {
        exclusive_discount: "Community discount",
        reduced_booking_fee: "Reduced or waived booking fee",
        free_consultation: "Free consultation",
        payment_plan: "Payment plan",
        family_discount: "Family discount",
        child_discount: "Child discount",
        group_discount: "Group discount",
        senior_discount: "Senior discount",
        free_upgrade: "Free upgrade",
        free_transportation: "Free transportation / pickup",
        added_amenity: "Added amenity or service",
        exclusive_dates: "Special dates or package",
        community_pricing: "Community / nonprofit pricing",
        other: "Other",
      },
    },
    benefitDescription: {
      label: "Describe the benefit exactly",
      placeholder: "E.g. $250 off plus a Spanish-language consultation for the Leonix community",
    },
    samePublicOffer: {
      label: "Is this the same offer you make to the general public?",
      options: {
        same: "Yes, same public offer",
        extra: "No, the Leonix community receives an additional benefit",
        partial: "Partially — the Leonix community receives something extra",
      },
    },
    estimatedValueBand: {
      label: "Approximate value of the benefit",
      options: {
        "": "Select…",
        lt25: "Under $25",
        "25_50": "$25–$50",
        "51_100": "$51–$100",
        "101_250": "$101–$250",
        gt250: "$251 or more",
        non_monetary: "Non-monetary",
      },
    },
    expiration: { label: "Benefit expiration (optional)", placeholder: "E.g. through December 31" },
    restrictions: {
      label: "Restrictions, blackout dates, or qualifications (optional)",
      placeholder: "E.g. subject to availability; not valid on holidays",
    },
  },
  errors: {
    business_name_required: "Enter the business name.",
    contact_name_required: "Enter the contact name.",
    email_required: "Enter an email.",
    email_invalid: "Check the email format.",
    phone_required: "Enter a phone number.",
    phone_invalid: "Check the phone format.",
    destination_required: "Enter the destination.",
    offer_type_required: "Select the offer type.",
    same_public_offer_required: "Tell us whether this is the same public offer.",
    benefit_description_required: "Describe the benefit you selected.",
  },
  authNote: "Sign in to send — that keeps your application saved in your dashboard.",
  submitCta: "Send information",
  submitting: "Sending…",
  received: {
    title: "Received.",
    body: "Leonix now has the initial information about your opportunity. You can continue with your full application now — or later from your dashboard.",
    continueNow: "Continue now",
    later: "Continue later from my dashboard",
  },
  networkError: "Network error. Please try again.",
};

export function getPublicarViajesIntakeCopy(lang: Lang): PublicarViajesIntakeCopy {
  return lang === "en" ? EN : ES;
}
