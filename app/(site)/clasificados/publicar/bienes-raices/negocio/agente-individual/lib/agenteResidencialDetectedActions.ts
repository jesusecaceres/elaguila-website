/**
 * BR-INV-FIX-01A — data-driven buyer actions from valid Agente form fields.
 */
import type { AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
import {
  buildContactModel,
  buildMainAgentBusinessHub,
  type AgenteResPreviewLocale,
} from "./agenteResidencialPreviewFormat";

export type DetectedBuyerActionId =
  | "call"
  | "whatsapp"
  | "email"
  | "schedule"
  | "website"
  | "listing"
  | "mls"
  | "tour"
  | "brochure"
  | "socials"
  | "google_reviews"
  | "google_business"
  | "yelp_reviews";

export type DetectedBuyerAction = {
  id: DetectedBuyerActionId;
  label: string;
  active: boolean;
};

const LABELS: Record<DetectedBuyerActionId, { es: string; en: string }> = {
  call: { es: "Llamar", en: "Call" },
  whatsapp: { es: "WhatsApp", en: "WhatsApp" },
  email: { es: "Solicitar información", en: "Request information" },
  schedule: { es: "Programar visita", en: "Schedule visit" },
  website: { es: "Ver sitio web", en: "View website" },
  listing: { es: "Ver listado completo", en: "View full listing" },
  mls: { es: "Ver MLS", en: "View MLS" },
  tour: { es: "Ver tour", en: "View tour" },
  brochure: { es: "Ver folleto", en: "View brochure" },
  socials: { es: "Redes sociales", en: "Social links" },
  google_business: { es: "Google Business", en: "Google Business" },
  google_reviews: { es: "Opiniones en Google", en: "Google reviews" },
  yelp_reviews: { es: "Opiniones en Yelp", en: "Yelp reviews" },
};

function labelFor(id: DetectedBuyerActionId, locale: AgenteResPreviewLocale): string {
  return locale === "en" ? LABELS[id].en : LABELS[id].es;
}

/** Read-only summary for Step 8 and preview parity checks. */
export function detectAgenteResBuyerActions(
  s: AgenteIndividualResidencialFormState,
  locale: AgenteResPreviewLocale = "es",
): DetectedBuyerAction[] {
  const cr = buildContactModel(s);
  const hub = buildMainAgentBusinessHub(s);

  const rows: Array<{ id: DetectedBuyerActionId; active: boolean }> = [
    { id: "call", active: cr.showLlamar },
    { id: "whatsapp", active: cr.showWhatsapp },
    { id: "email", active: cr.showSolicitarInformacion },
    { id: "schedule", active: cr.showProgramarVisita },
    { id: "website", active: cr.showVerSitioWeb },
    { id: "listing", active: cr.showVerListado },
    { id: "mls", active: cr.showVerMls },
    { id: "tour", active: cr.showVerTour },
    { id: "brochure", active: cr.showVerFolleto },
    { id: "socials", active: hub.hasSocialIcons },
    { id: "google_business", active: Boolean(hub.googleBusinessUrl) },
    { id: "google_reviews", active: Boolean(hub.googleReviewsUrl) },
    { id: "yelp_reviews", active: Boolean(hub.yelpReviewsUrl) },
  ];

  return rows.map(({ id, active }) => ({ id, label: labelFor(id, locale), active }));
}

export function countActiveAgenteResBuyerActions(s: AgenteIndividualResidencialFormState): number {
  return detectAgenteResBuyerActions(s).filter((a) => a.active).length;
}
