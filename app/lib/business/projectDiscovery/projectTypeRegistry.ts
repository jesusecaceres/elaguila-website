/**
 * Client Discovery & Project Blueprint Engine, Gate 1 — canonical project-type registry (MD
 * <project_type_registry>). Pure application-code configuration, NOT a database table — mirrors
 * the exact precedent already established by Growth Engine's ESTABLISHED_ROADMAP_STEPS /
 * STARTUP_ROADMAP_STEPS (roadmapCatalog.ts): a catalog that evolves in code, while per-business
 * STATE (a discovery's primary_project_type, an intent's project_type) lives in the database as a
 * plain validated string column.
 *
 * No commercial pricing lives here (MD: "Do not put commercial pricing in this registry"). No
 * assumption that every project type shares the same discovery questions (MD: "Do not hardcode
 * assumptions that every project has the same discovery questions") — discoverySchemaKey is only a
 * forward-compatible pointer a later gate's adaptive question engine can key off of; Gate 1 defines
 * no actual per-type question schema.
 */
import type { ProjectType } from "./types";

export type ProjectTypeCategory = "digital" | "brand" | "print" | "media" | "platform" | "multi" | "other";

export type ProjectTypeExecutionDestination =
  | "creative_studio"
  | "growth_campaign"
  | "custom_platform_engagement"
  | "multi_project_bundle"
  | "not_yet_determined";

export interface ProjectTypeDefinition {
  key: ProjectType;
  labelEs: string;
  labelEn: string;
  category: ProjectTypeCategory;
  discoverySchemaKey: string;
  executionDestination: ProjectTypeExecutionDestination;
  active: boolean;
}

export const PROJECT_TYPE_REGISTRY: readonly ProjectTypeDefinition[] = [
  { key: "website", labelEs: "Sitio web", labelEn: "Website", category: "digital", discoverySchemaKey: "website", executionDestination: "creative_studio", active: true },
  { key: "website_improvement", labelEs: "Mejora de sitio web", labelEn: "Website Improvement", category: "digital", discoverySchemaKey: "website", executionDestination: "creative_studio", active: true },
  { key: "landing_page", labelEs: "Página de destino", labelEn: "Landing Page", category: "digital", discoverySchemaKey: "landing_page", executionDestination: "creative_studio", active: true },
  { key: "logo_brand_identity", labelEs: "Logo / Identidad de marca", labelEn: "Logo / Brand Identity", category: "brand", discoverySchemaKey: "brand_identity", executionDestination: "creative_studio", active: true },
  { key: "business_cards", labelEs: "Tarjetas de presentación", labelEn: "Business Cards", category: "print", discoverySchemaKey: "print_collateral", executionDestination: "creative_studio", active: true },
  { key: "flyer", labelEs: "Volante", labelEn: "Flyer", category: "print", discoverySchemaKey: "print_collateral", executionDestination: "creative_studio", active: true },
  { key: "banner_signage", labelEs: "Banner / Señalización", labelEn: "Banner / Signage", category: "print", discoverySchemaKey: "print_collateral", executionDestination: "creative_studio", active: true },
  { key: "promotional_products", labelEs: "Productos promocionales", labelEn: "Promotional Products", category: "print", discoverySchemaKey: "print_collateral", executionDestination: "not_yet_determined", active: true },
  { key: "campaign_creative", labelEs: "Creativo de campaña", labelEn: "Campaign Creative", category: "media", discoverySchemaKey: "campaign", executionDestination: "growth_campaign", active: true },
  { key: "sponsored_editorial", labelEs: "Editorial patrocinado", labelEn: "Sponsored Editorial", category: "media", discoverySchemaKey: "campaign", executionDestination: "creative_studio", active: true },
  { key: "media_exposure_campaign", labelEs: "Campaña de medios / exposición", labelEn: "Media / Exposure Campaign", category: "media", discoverySchemaKey: "campaign", executionDestination: "growth_campaign", active: true },
  { key: "social_setup_cleanup", labelEs: "Configuración / limpieza de redes sociales", labelEn: "Social Setup / Cleanup", category: "digital", discoverySchemaKey: "social_presence", executionDestination: "not_yet_determined", active: true },
  { key: "google_business_profile_support", labelEs: "Soporte de Perfil de Negocio de Google", labelEn: "Google Business Profile Support", category: "digital", discoverySchemaKey: "social_presence", executionDestination: "not_yet_determined", active: true },
  { key: "referral_materials", labelEs: "Materiales de referencia", labelEn: "Referral Materials", category: "print", discoverySchemaKey: "print_collateral", executionDestination: "creative_studio", active: true },
  { key: "launch_package_multi_project", labelEs: "Paquete de lanzamiento / Multi-proyecto", labelEn: "Launch Package / Multi-project Engagement", category: "multi", discoverySchemaKey: "multi_project", executionDestination: "multi_project_bundle", active: true },
  { key: "custom_platform_software", labelEs: "Plataforma personalizada / Software", labelEn: "Custom Platform / Software Project", category: "platform", discoverySchemaKey: "custom_platform", executionDestination: "custom_platform_engagement", active: true },
  { key: "other", labelEs: "Otro tipo de proyecto aprobado", labelEn: "Other Approved Project Type", category: "other", discoverySchemaKey: "other", executionDestination: "not_yet_determined", active: true },
];

const REGISTRY_BY_KEY = new Map(PROJECT_TYPE_REGISTRY.map((def) => [def.key, def]));

export function isKnownProjectType(value: string): value is ProjectType {
  return REGISTRY_BY_KEY.has(value as ProjectType);
}

export function getProjectTypeDefinition(key: ProjectType): ProjectTypeDefinition {
  const def = REGISTRY_BY_KEY.get(key);
  if (!def) throw new Error(`Unknown project type: ${key}`);
  return def;
}

export function activeProjectTypes(): readonly ProjectTypeDefinition[] {
  return PROJECT_TYPE_REGISTRY.filter((def) => def.active);
}

export function projectTypeLabel(key: ProjectType): string {
  const def = getProjectTypeDefinition(key);
  return `${def.labelEs} / ${def.labelEn}`;
}
