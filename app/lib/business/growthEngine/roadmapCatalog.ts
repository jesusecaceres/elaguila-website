/**
 * Business Development & Growth Engine, Section B — the Growth Roadmap step catalog. Lives in
 * application code (not a database table) per the MD's own "conceptual" framing; per-business
 * step STATE lives in business_growth_roadmap_steps, seeded lazily from this catalog.
 *
 * Established Business Roadmap: MD §13.1 (12 steps).
 * Startup / Idea Roadmap: MD §13.2 (14 steps).
 */
import type { GrowthRoadmapStepRequirement, GrowthRoadmapType } from "./types";

export type GrowthRoadmapStepDefinition = {
  stepKey: string;
  sequence: number;
  labelEs: string;
  labelEn: string;
  requirement: GrowthRoadmapStepRequirement;
  dependsOnStepKey: string | null;
};

export const ESTABLISHED_ROADMAP_STEPS: readonly GrowthRoadmapStepDefinition[] = [
  { stepKey: "understand", sequence: 1, labelEs: "Entender", labelEn: "Understand", requirement: "required", dependsOnStepKey: null },
  { stepKey: "verify", sequence: 2, labelEs: "Verificar", labelEn: "Verify", requirement: "required", dependsOnStepKey: "understand" },
  { stepKey: "diagnose", sequence: 3, labelEs: "Diagnosticar", labelEn: "Diagnose", requirement: "required", dependsOnStepKey: "verify" },
  { stepKey: "prioritize", sequence: 4, labelEs: "Priorizar", labelEn: "Prioritize", requirement: "required", dependsOnStepKey: "diagnose" },
  { stepKey: "improve_foundation", sequence: 5, labelEs: "Mejorar la base", labelEn: "Improve Foundation", requirement: "optional", dependsOnStepKey: "prioritize" },
  { stepKey: "improve_brand", sequence: 6, labelEs: "Mejorar la marca", labelEn: "Improve Brand", requirement: "optional", dependsOnStepKey: "prioritize" },
  { stepKey: "improve_digital_presence", sequence: 7, labelEs: "Mejorar presencia digital", labelEn: "Improve Digital Presence", requirement: "optional", dependsOnStepKey: "prioritize" },
  { stepKey: "improve_conversion", sequence: 8, labelEs: "Mejorar conversión", labelEn: "Improve Conversion", requirement: "optional", dependsOnStepKey: "prioritize" },
  { stepKey: "build_campaign", sequence: 9, labelEs: "Construir campaña", labelEn: "Build Campaign", requirement: "required", dependsOnStepKey: "prioritize" },
  { stepKey: "launch", sequence: 10, labelEs: "Lanzar", labelEn: "Launch", requirement: "required", dependsOnStepKey: "build_campaign" },
  { stepKey: "measure", sequence: 11, labelEs: "Medir", labelEn: "Measure", requirement: "required", dependsOnStepKey: "launch" },
  { stepKey: "review_next_right_move", sequence: 12, labelEs: "Revisar / Próximo paso correcto", labelEn: "Review / Next Right Move", requirement: "required", dependsOnStepKey: "measure" },
];

export const STARTUP_ROADMAP_STEPS: readonly GrowthRoadmapStepDefinition[] = [
  { stepKey: "idea", sequence: 1, labelEs: "Idea", labelEn: "Idea", requirement: "required", dependsOnStepKey: null },
  { stepKey: "business_model", sequence: 2, labelEs: "Modelo de negocio", labelEn: "Business Model", requirement: "required", dependsOnStepKey: "idea" },
  { stepKey: "name_identity", sequence: 3, labelEs: "Nombre / Identidad", labelEn: "Name / Identity", requirement: "required", dependsOnStepKey: "business_model" },
  { stepKey: "official_requirements_research", sequence: 4, labelEs: "Investigación de requisitos oficiales", labelEn: "Official Requirements Research", requirement: "required", dependsOnStepKey: "business_model" },
  { stepKey: "legal_tax_license_checklist", sequence: 5, labelEs: "Lista legal / fiscal / de licencias", labelEn: "Legal / Tax / License Checklist", requirement: "required", dependsOnStepKey: "official_requirements_research" },
  { stepKey: "brand", sequence: 6, labelEs: "Marca", labelEn: "Brand", requirement: "required", dependsOnStepKey: "name_identity" },
  { stepKey: "website_domain_email", sequence: 7, labelEs: "Sitio web / dominio / correo", labelEn: "Website / Domain / Email", requirement: "required", dependsOnStepKey: "brand" },
  { stepKey: "google_social", sequence: 8, labelEs: "Google / Redes sociales", labelEn: "Google / Social", requirement: "required", dependsOnStepKey: "brand" },
  { stepKey: "contact_booking_payment", sequence: 9, labelEs: "Contacto / Reservas / Pago", labelEn: "Contact / Booking / Payment", requirement: "required", dependsOnStepKey: "website_domain_email" },
  { stepKey: "physical_collateral", sequence: 10, labelEs: "Material físico", labelEn: "Physical Collateral", requirement: "optional", dependsOnStepKey: "brand" },
  { stepKey: "launch_offer", sequence: 11, labelEs: "Oferta de lanzamiento", labelEn: "Launch Offer", requirement: "required", dependsOnStepKey: "contact_booking_payment" },
  { stepKey: "exposure_campaign", sequence: 12, labelEs: "Campaña de exposición", labelEn: "Exposure Campaign", requirement: "required", dependsOnStepKey: "launch_offer" },
  { stepKey: "measure", sequence: 13, labelEs: "Medir", labelEn: "Measure", requirement: "required", dependsOnStepKey: "exposure_campaign" },
  { stepKey: "grow", sequence: 14, labelEs: "Crecer", labelEn: "Grow", requirement: "required", dependsOnStepKey: "measure" },
];

export function roadmapStepCatalog(roadmapType: GrowthRoadmapType): readonly GrowthRoadmapStepDefinition[] {
  return roadmapType === "startup" ? STARTUP_ROADMAP_STEPS : ESTABLISHED_ROADMAP_STEPS;
}
