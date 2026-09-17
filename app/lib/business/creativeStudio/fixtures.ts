/**
 * Program 6, Gate 6AB — Deterministic non-production fixture definitions for QA only.
 * These are NOT fake public businesses. Internal fixture constants/tests only.
 */
import type { CreativeArchetypeKey, CreativeLane } from "./archetypes/types";
import type { PrintFormatKey } from "./printSpecs";
import type { RiskClass, CreativeLanguage, CreativeAssetType } from "./types";
import type { LayoutVariant } from "./archetypes/compositionRules";
// Re-export for convenience
export type { LayoutVariant } from "./archetypes/compositionRules";

export interface CreativeFixture {
  key: string;
  label: string;
  businessName: string;
  businessCategory: string;
  archetype: CreativeArchetypeKey;
  lane: CreativeLane;
  format: PrintFormatKey;
  layoutVariant: LayoutVariant;
  assetType: CreativeAssetType;
  language: CreativeLanguage;
  riskClass: RiskClass;
  headline: string;
  primaryMessage: string;
  cta: string;
  benefits: readonly string[];
  disclaimers: readonly string[];
  prohibitedClaims: readonly string[];
  hasLogo: boolean;
  hasHeroImage: boolean;
  hasPortrait: boolean;
  qrDestination: string | null;
  imagePixelWidth: number | null;
  imagePixelHeight: number | null;
}

export const CREATIVE_FIXTURES: readonly CreativeFixture[] = [
  {
    key: "FIXTURE_A",
    label: "Traditional-upgraded attorney full page",
    businessName: "Law Office of Garcia & Associates",
    businessCategory: "attorneys",
    archetype: "AUTHORITY_TRADITIONAL_UPGRADED",
    lane: "LANE_A_TRADITIONAL_UPGRADED",
    format: "FULL_PAGE",
    layoutVariant: "A",
    assetType: "magazine_ad",
    language: "es_primary_en_support",
    riskClass: "LEGAL",
    headline: "Lesión en un accidente? Protéjase.",
    primaryMessage: "Experiencia legal en accidentes automovilísticos.",
    cta: "Consulta gratuita hoy",
    benefits: ["Más de 15 años de experiencia", "Atención personalizada", "Hablamos español"],
    disclaimers: ["La consulta no crea relación abogado-cliente.", "Resultados pasados no garantizan resultados futuros."],
    prohibitedClaims: ["guaranteed_outcome", "guaranteed_result"],
    hasLogo: true,
    hasHeroImage: false,
    hasPortrait: true,
    qrDestination: "https://leonix.media/garcia-associates",
    imagePixelWidth: 900,
    imagePixelHeight: 1200,
  },
  {
    key: "FIXTURE_B",
    label: "Premium restaurant half horizontal",
    businessName: "El León Dorado",
    businessCategory: "restaurants",
    archetype: "PREMIUM_PHOTO_HERO",
    lane: "LANE_B_PREMIUM_CREATIVE",
    format: "HALF_HORIZONTAL",
    layoutVariant: "A",
    assetType: "magazine_ad",
    language: "bilingual",
    riskClass: "NORMAL",
    headline: "Cocina de fuego. Sabor de hogar.",
    primaryMessage: "Cocina mexicana contemporánea con ingredientes locales.",
    cta: "Reserve su mesa",
    benefits: ["Menú de temporada", "Bar de mezcal artesanal", "Terraza al aire libre"],
    disclaimers: [],
    prohibitedClaims: ["fake_testimonial", "fake_award"],
    hasLogo: true,
    hasHeroImage: true,
    hasPortrait: false,
    qrDestination: "https://leonix.media/el-leon-dorado",
    imagePixelWidth: 2400,
    imagePixelHeight: 1600,
  },
  {
    key: "FIXTURE_C",
    label: "Event venue full page",
    businessName: "Salón Real Hacienda",
    businessCategory: "banquet_halls",
    archetype: "EVENT_VENUE_SHOWCASE",
    lane: "LANE_B_PREMIUM_CREATIVE",
    format: "FULL_PAGE",
    layoutVariant: "A",
    assetType: "magazine_ad",
    language: "es",
    riskClass: "NORMAL",
    headline: "Su evento inolvidable empieza aquí.",
    primaryMessage: "Salón de eventos para quinceañeras, bodas y celebraciones.",
    cta: "Agende su visita",
    benefits: ["Capacidad hasta 300 invitados", "Paquetes personalizados", "Estacionamiento gratuito"],
    disclaimers: [],
    prohibitedClaims: ["invented_package_price"],
    hasLogo: true,
    hasHeroImage: true,
    hasPortrait: false,
    qrDestination: "https://leonix.media/salon-real-hacienda",
    imagePixelWidth: 2400,
    imagePixelHeight: 3200,
  },
  {
    key: "FIXTURE_D",
    label: "Recruitment quarter page",
    businessName: "Construcciones El Águila",
    businessCategory: "trades",
    archetype: "RECRUITMENT_HIRING",
    lane: "LANE_A_TRADITIONAL_UPGRADED",
    format: "QUARTER",
    layoutVariant: "A",
    assetType: "magazine_ad",
    language: "es",
    riskClass: "EMPLOYMENT",
    headline: "Buscamos electricistas.",
    primaryMessage: "Oportunidad de trabajo en construcción.",
    cta: "Llame hoy",
    benefits: ["Trabajo estable", "Pago semanal", "Capacitación proporcionada"],
    disclaimers: ["Equal opportunity employer."],
    prohibitedClaims: ["discriminatory_language", "invented_salary", "fake_benefit"],
    hasLogo: true,
    hasHeroImage: false,
    hasPortrait: false,
    qrDestination: "https://leonix.media/construcciones-aguila-jobs",
    imagePixelWidth: null,
    imagePixelHeight: null,
  },
  {
    key: "FIXTURE_E",
    label: "Sponsored editorial full page — Leonix Te Explica",
    businessName: "Leonix Te Explica",
    businessCategory: "leonix_te_explica",
    archetype: "SPONSORED_EDITORIAL",
    lane: "LANE_C_SPONSORED_EDITORIAL",
    format: "FULL_PAGE",
    layoutVariant: "A",
    assetType: "sponsored_insert",
    language: "es",
    riskClass: "LEGAL",
    headline: "5 cosas que debes hacer después de un accidente automovilístico",
    primaryMessage: "Información educativa sobre pasos a seguir después de un accidente.",
    cta: "Escanea para más recursos",
    benefits: [
      "1. Verifica que estás a salvo",
      "2. Llama al 911",
      "3. Toma fotos del escenario",
      "4. Intercambia información",
      "5. Busca atención médica",
    ],
    disclaimers: [
      "Contenido educativo, no es asesoría legal.",
      "Presentado con el apoyo de [Sponsor Name].",
      "El patrocinador no controla el contenido editorial.",
    ],
    prohibitedClaims: ["legal_advice_from_leonix", "guaranteed_outcome"],
    hasLogo: false,
    hasHeroImage: false,
    hasPortrait: false,
    qrDestination: "https://leonix.media/te-explica/accidente-auto",
    imagePixelWidth: null,
    imagePixelHeight: null,
  },
];

export function getFixture(key: string): CreativeFixture | null {
  return CREATIVE_FIXTURES.find((f) => f.key === key) ?? null;
}

export function getAllFixtures(): readonly CreativeFixture[] {
  return CREATIVE_FIXTURES;
}
