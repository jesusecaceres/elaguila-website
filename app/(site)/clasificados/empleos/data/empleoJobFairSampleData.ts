/**
 * Phase 4: Job Fair public detail shell — maps later to a lightweight feria application.
 */

export type JobFairModality = "presencial" | "virtual" | "híbrida";

export type EmpleoJobFairSample = {
  /** Main H1 / event name */
  title: string;
  flyerImageSrc: string;
  flyerImageAlt: string;
  dateLine: string;
  timeLine?: string;
  venue: string;
  city: string;
  state: string;
  organizer?: string;
  /** Optional link for organizer name */
  organizerUrl?: string;
  /** Short structured tags for the details card (filters/display later). */
  detailsBullets: string[];
  /** Optional repeat block below; omit to hide secondary section. */
  secondaryDetails?: string[];
  ctaIntro: string;
  contactPhone?: string;
  contactEmail?: string;
  /** Future filter / taxonomy (optional in UI for this shell). */
  eventType?: string;
  modality?: JobFairModality;
  freeEntry?: boolean;
  bilingual?: boolean;
  industryFocus?: string;
};

export const EMPLEO_JOB_FAIR_SAMPLE: EmpleoJobFairSample = {
  title: "Feria de Empleo",
  flyerImageSrc:
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=80",
  flyerImageAlt: "Feria de empleo con stands y visitantes",
  dateLine: "Miércoles, 15 de Julio",
  timeLine: "10 AM – 3 PM",
  venue: "Centro de Convenciones de San Antonio",
  city: "San Antonio",
  state: "TX",
  organizer: "ExpoEmpleos",
  organizerUrl: "https://example.com/expoempleos",
  detailsBullets: ["Feria de Empleo", "Presencial", "Entrada gratuita"],
  secondaryDetails: ["Feria de Empleo", "Presencial", "Entrada gratuita"],
  ctaIntro:
    "¡No te pierdas nuestra feria de empleo! Haz clic en el botón para ver más detalles y prepararte para este gran evento.",
  contactPhone: "555-987-5643",
  contactEmail: "info@expoempleos.example.com",
  eventType: "feria de empleo",
  modality: "presencial",
  freeEntry: true,
  bilingual: false,
  industryFocus: "Multi-sector",
};

export function hasJobFairDetails(items: string[] | undefined): items is string[] {
  return Boolean(items && items.length > 0);
}
