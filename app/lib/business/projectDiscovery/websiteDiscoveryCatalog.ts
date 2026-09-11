/**
 * Client Discovery & Project Blueprint Engine, Gate 2 — canonical Website Discovery requirement
 * catalog (MD <website_information_contract>, <requirement_definition>). Pure application-code
 * configuration, NOT a database table or a generic rules-language — mirrors the exact precedent
 * already established by Growth Engine's roadmapCatalog.ts / projectTypeRegistry.ts (Gate 1): a
 * catalog that evolves in code, while per-business STATE (a captured answer) lives in Gate 1's own
 * extensible business_project_discovery_items table. Dependency/applicability rules are plain
 * TypeScript predicates over a WebsiteDiscoveryContext — no generic rules engine.
 *
 * Versioned explicitly (WEBSITE_DISCOVERY_CATALOG_VERSION) so a future generated blueprint can
 * record which discovery doctrine produced it (MD <catalog_architecture>).
 */
import type { DiscoveryCompletenessClass } from "./types";

export const WEBSITE_DISCOVERY_CATALOG_VERSION = "website_discovery_v1";

// ---------------------------------------------------------------------------------------------
// Sections — the 27 information domains from the Master (MD <website_information_contract>).
// ---------------------------------------------------------------------------------------------
export type WebsiteDiscoverySection =
  | "business_identity"
  | "website_objective"
  | "audience"
  | "offers_services_products"
  | "brand_identity"
  | "visual_references"
  | "content"
  | "media_assets"
  | "page_architecture"
  | "primary_cta"
  | "forms"
  | "domain"
  | "hosting_deployment"
  | "cms"
  | "backend_database_auth"
  | "booking_scheduling"
  | "payments_commerce"
  | "social_presence"
  | "seo"
  | "analytics"
  | "accessibility"
  | "languages"
  | "privacy_legal"
  | "ownership_billing"
  | "maintenance"
  | "scope"
  | "schedule_approvals";

export const WEBSITE_DISCOVERY_SECTIONS: readonly WebsiteDiscoverySection[] = [
  "business_identity", "website_objective", "audience", "offers_services_products", "brand_identity",
  "visual_references", "content", "media_assets", "page_architecture", "primary_cta", "forms", "domain",
  "hosting_deployment", "cms", "backend_database_auth", "booking_scheduling", "payments_commerce",
  "social_presence", "seo", "analytics", "accessibility", "languages", "privacy_legal",
  "ownership_billing", "maintenance", "scope", "schedule_approvals",
];

/** MD <requirement_definition> "who should answer". */
export type WebsiteAnswerSource = "CLIENT" | "LEONIX" | "PUBLIC_RESEARCH" | "SYSTEM_DERIVED" | "OFFICIAL_RESEARCH";

export type WebsiteValueType = "text" | "number" | "boolean" | "date" | "url" | "list" | "asset_ref" | "choice" | "other";

/** MD <industry_branches>. Resolved from canonical business taxonomy, never a display-label guess. */
export type IndustryBranchKey = "restaurant" | "fitness" | "radio_media" | "church" | "professional_service" | "home_local_service";

/** MD <scope_escalation>. */
export type ScopeSignalReason =
  | "user_authentication" | "customer_dashboard" | "native_marketplace" | "complex_database"
  | "stored_customer_history" | "native_workflow_state" | "custom_checkout" | "significant_uploads"
  | "proprietary_messaging" | "scheduling_engine" | "significant_integrations" | "regulated_sensitive_data"
  | "native_mobile_app";

/**
 * Minimal read-only view of discovery state a requirement's predicate needs — deliberately NOT the
 * full WebsiteDiscoveryContext type (defined in websiteDiscoveryLogic.ts, which imports THIS file)
 * to avoid a circular import; both describe the same shape structurally.
 */
export interface WebsiteRequirementPredicateContext {
  hasCapturedValue(fieldKey: string, expected?: unknown): boolean;
  getCapturedValue(fieldKey: string): unknown;
  isKnownFromCanonicalTruth(fieldKey: string): boolean;
  industryBranch: IndustryBranchKey | null;
  isNewBusiness: boolean;
  hasExistingWebsite: boolean;
}

export interface WebsiteRequirementDefinition {
  fieldKey: string;
  section: WebsiteDiscoverySection;
  labelEn: string;
  labelEs: string;
  operatorGuidanceEn: string;
  operatorGuidanceEs: string;
  clientQuestionEn: string;
  clientQuestionEs: string;
  valueType: WebsiteValueType;
  defaultCompletenessClass: DiscoveryCompletenessClass;
  whoShouldAnswer: WebsiteAnswerSource;
  /** Only relevant/askable when this returns true (or when omitted — always applicable). */
  applicabilityCondition?: (ctx: WebsiteRequirementPredicateContext) => boolean;
  /** A dependency condition is a stricter applicability gate: the PARENT need must exist first (MD <conditional_dependencies>). */
  dependencyCondition?: (ctx: WebsiteRequirementPredicateContext) => boolean;
  priority: number;
  mayBlockBuild: boolean;
  mayBlockLaunch: boolean;
  canonicalTruthMaySatisfy: boolean;
  canonicalTruthHint?: string;
  recommendReconfirmation: boolean;
  sensitiveDataWarning?: string;
  scopeEscalationSignal?: ScopeSignalReason;
  industryBranch?: IndustryBranchKey;
}

// =================================================================================================
// 1. BUSINESS IDENTITY — mostly satisfiable from canonical Business Identity / Living Book truth.
// =================================================================================================
const businessIdentity: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "public_business_name", section: "business_identity",
    labelEn: "Public business name", labelEs: "Nombre público del negocio",
    operatorGuidanceEn: "Confirm the exact public-facing name to use on the site — may differ from the legal name.",
    operatorGuidanceEs: "Confirme el nombre público exacto para el sitio — puede diferir del nombre legal.",
    clientQuestionEn: "What exact name should we use for your business on the website?",
    clientQuestionEs: "¿Qué nombre exacto debemos usar para su negocio en el sitio web?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: true,
    canonicalTruthHint: "businesses.public_name / display_name", recommendReconfirmation: false,
  },
  {
    fieldKey: "decision_maker_approver", section: "business_identity",
    labelEn: "Decision maker / project approver", labelEs: "Persona que decide / aprueba el proyecto",
    operatorGuidanceEn: "Identify who has final approval authority for this project.",
    operatorGuidanceEs: "Identifique quién tiene la autoridad final de aprobación para este proyecto.",
    clientQuestionEn: "Who will give final approval on design and content decisions?",
    clientQuestionEs: "¿Quién dará la aprobación final sobre las decisiones de diseño y contenido?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "public_contact_phone", section: "business_identity",
    labelEn: "Public phone number", labelEs: "Número de teléfono público",
    operatorGuidanceEn: "Confirm the phone number the public should call.", operatorGuidanceEs: "Confirme el número de teléfono que el público debe llamar.",
    clientQuestionEn: "What phone number should visitors call?", clientQuestionEs: "¿A qué número de teléfono deben llamar los visitantes?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: true,
    canonicalTruthHint: "business_facts (contact category)", recommendReconfirmation: true,
  },
  {
    fieldKey: "service_area", section: "business_identity",
    labelEn: "Service area / location", labelEs: "Área de servicio / ubicación",
    operatorGuidanceEn: "Confirm the geographic area the business actually serves.", operatorGuidanceEs: "Confirme el área geográfica que el negocio realmente atiende.",
    clientQuestionEn: "What area or locations do you serve?", clientQuestionEs: "¿Qué área o ubicaciones atiende?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: true, recommendReconfirmation: false,
  },
];

// =================================================================================================
// 2. WEBSITE OBJECTIVE
// =================================================================================================
const websiteObjective: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "primary_business_goal", section: "website_objective",
    labelEn: "Primary business goal for this website", labelEs: "Objetivo principal del negocio para este sitio",
    operatorGuidanceEn: "Capture the real driving reason for this project — never assume it's generic 'more customers.'",
    operatorGuidanceEs: "Capture la razón real detrás de este proyecto — nunca asuma que es genérico 'más clientes.'",
    clientQuestionEn: "What do you most want this website to accomplish?", clientQuestionEs: "¿Qué es lo que más quiere que logre este sitio web?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: true,
    canonicalTruthHint: "Growth Assessment nextRightMove / growth solution rationale", recommendReconfirmation: false,
  },
  {
    fieldKey: "launch_trigger", section: "website_objective",
    labelEn: "Launch trigger / driving event", labelEs: "Motivo / evento que impulsa el lanzamiento",
    operatorGuidanceEn: "Is there a specific event, promotion, or deadline driving this project?", operatorGuidanceEs: "¿Hay un evento, promoción o fecha límite específica que impulse este proyecto?",
    clientQuestionEn: "Is there a specific event or deadline behind this project?", clientQuestionEs: "¿Hay un evento o fecha límite específica detrás de este proyecto?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "current_pain_point", section: "website_objective",
    labelEn: "Current pain point with existing presence", labelEs: "Problema actual con la presencia existente",
    operatorGuidanceEn: "Only ask when an existing website/presence is known.", operatorGuidanceEs: "Solo pregunte cuando se conozca un sitio web/presencia existente.",
    clientQuestionEn: "What frustrates you most about your current website?", clientQuestionEs: "¿Qué es lo que más le frustra de su sitio web actual?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.hasExistingWebsite,
    priority: 2, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

// =================================================================================================
// 3. AUDIENCE
// =================================================================================================
const audience: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "primary_customer", section: "audience",
    labelEn: "Primary customer / audience", labelEs: "Cliente / audiencia principal",
    operatorGuidanceEn: "Get a real description, not a vague 'everyone.'", operatorGuidanceEs: "Obtenga una descripción real, no un vago 'todos.'",
    clientQuestionEn: "Who is your ideal customer?", clientQuestionEs: "¿Quién es su cliente ideal?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: true, recommendReconfirmation: false,
  },
  {
    fieldKey: "trust_builders", section: "audience",
    labelEn: "What creates trust with this audience", labelEs: "Qué genera confianza con esta audiencia",
    operatorGuidanceEn: "Credentials, reviews, guarantees, years in business, etc.", operatorGuidanceEs: "Credenciales, reseñas, garantías, años en el negocio, etc.",
    clientQuestionEn: "What makes a customer trust a business like yours?", clientQuestionEs: "¿Qué hace que un cliente confíe en un negocio como el suyo?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

// =================================================================================================
// 4. OFFERS / SERVICES / PRODUCTS
// =================================================================================================
const offers: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "core_services_products", section: "offers_services_products",
    labelEn: "Core services or products to feature", labelEs: "Servicios o productos principales a destacar",
    operatorGuidanceEn: "The specific offerings that must appear on the site.", operatorGuidanceEs: "Las ofertas específicas que deben aparecer en el sitio.",
    clientQuestionEn: "What are the main services or products we should feature?", clientQuestionEs: "¿Cuáles son los principales servicios o productos que debemos destacar?",
    valueType: "list", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: true, recommendReconfirmation: false,
  },
  {
    fieldKey: "priority_offering", section: "offers_services_products",
    labelEn: "Priority offering to push", labelEs: "Oferta prioritaria a impulsar",
    operatorGuidanceEn: "What does the client most want to grow — vs. what they don't want more of.", operatorGuidanceEs: "Qué es lo que el cliente más quiere crecer, frente a lo que no quiere más.",
    clientQuestionEn: "Which service or product do you most want to grow right now?", clientQuestionEs: "¿Qué servicio o producto quiere crecer más en este momento?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "publishable_pricing", section: "offers_services_products",
    labelEn: "Pricing approved for publication", labelEs: "Precios aprobados para publicación",
    operatorGuidanceEn: "Only publish pricing the client has explicitly approved.", operatorGuidanceEs: "Solo publique precios que el cliente haya aprobado explícitamente.",
    clientQuestionEn: "Is there any pricing you'd like published on the site?", clientQuestionEs: "¿Hay algún precio que le gustaría publicar en el sitio?",
    valueType: "text", defaultCompletenessClass: "optional", whoShouldAnswer: "CLIENT",
    priority: 4, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

// =================================================================================================
// 5. BRAND IDENTITY — CLIENT_PREFERENCE-heavy (MD <content_and_brand>).
// =================================================================================================
const brandIdentity: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "existing_logo", section: "brand_identity",
    labelEn: "Existing logo availability", labelEs: "Disponibilidad de logo existente",
    operatorGuidanceEn: "Does a usable logo file already exist?", operatorGuidanceEs: "¿Ya existe un archivo de logo utilizable?",
    clientQuestionEn: "Do you have an existing logo file we can use?", clientQuestionEs: "¿Tiene un archivo de logo existente que podamos usar?",
    valueType: "boolean", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "colors_liked", section: "brand_identity",
    labelEn: "Colors liked", labelEs: "Colores que le gustan",
    operatorGuidanceEn: "Client preference — never a confirmed business fact.", operatorGuidanceEs: "Preferencia del cliente — nunca un hecho de negocio confirmado.",
    clientQuestionEn: "What colors do you like for your brand?", clientQuestionEs: "¿Qué colores le gustan para su marca?",
    valueType: "list", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "colors_disliked", section: "brand_identity",
    labelEn: "Colors disliked", labelEs: "Colores que no le gustan",
    operatorGuidanceEn: "Just as valuable as what they like.", operatorGuidanceEs: "Tan valioso como lo que le gusta.",
    clientQuestionEn: "Are there any colors you specifically do NOT want?", clientQuestionEs: "¿Hay algún color que específicamente NO quiera?",
    valueType: "list", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 4, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "visual_personality", section: "brand_identity",
    labelEn: "Desired visual personality / tone", labelEs: "Personalidad / tono visual deseado",
    operatorGuidanceEn: "Modern, energetic, luxurious, simple, etc. — a client preference.", operatorGuidanceEs: "Moderno, enérgico, lujoso, simple, etc. — una preferencia del cliente.",
    clientQuestionEn: "How should the site feel? (modern, warm, energetic, luxurious, simple...)", clientQuestionEs: "¿Cómo debe sentirse el sitio? (moderno, cálido, enérgico, lujoso, simple...)",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "symbols_avoided", section: "brand_identity",
    labelEn: "Symbols/imagery to avoid", labelEs: "Símbolos/imágenes a evitar",
    operatorGuidanceEn: "Cultural or personal meaning may matter here.", operatorGuidanceEs: "El significado cultural o personal puede importar aquí.",
    clientQuestionEn: "Are there any symbols or images we should avoid?", clientQuestionEs: "¿Hay algún símbolo o imagen que debamos evitar?",
    valueType: "text", defaultCompletenessClass: "optional", whoShouldAnswer: "CLIENT",
    priority: 4, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

// =================================================================================================
// 6. VISUAL REFERENCES
// =================================================================================================
const visualReferences: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "websites_liked", section: "visual_references",
    labelEn: "Websites liked (with reason)", labelEs: "Sitios web que le gustan (con razón)",
    operatorGuidanceEn: "Screenshots are evidence of preference, never permission to copy a competitor's brand (MD <visual_reference_contract>).",
    operatorGuidanceEs: "Las capturas de pantalla son evidencia de preferencia, nunca permiso para copiar la marca de un competidor.",
    clientQuestionEn: "Can you share a website you like, and what specifically you like about it?", clientQuestionEs: "¿Puede compartir un sitio web que le guste, y qué le gusta específicamente de él?",
    valueType: "asset_ref", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "websites_disliked", section: "visual_references",
    labelEn: "Websites disliked (with reason)", labelEs: "Sitios web que no le gustan (con razón)",
    operatorGuidanceEn: "Equally valuable — capture the specific reason, not just the link.", operatorGuidanceEs: "Igual de valioso — capture la razón específica, no solo el enlace.",
    clientQuestionEn: "Is there a website style you specifically want to avoid?", clientQuestionEs: "¿Hay un estilo de sitio web que específicamente quiera evitar?",
    valueType: "asset_ref", defaultCompletenessClass: "optional", whoShouldAnswer: "CLIENT",
    priority: 4, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

// =================================================================================================
// 7. CONTENT
// =================================================================================================
const content: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "copy_ownership", section: "content",
    labelEn: "Who writes the copy", labelEs: "Quién escribe el contenido",
    operatorGuidanceEn: "Client-provided vs. Leonix-authored — affects timeline and scope.", operatorGuidanceEs: "Proporcionado por el cliente vs. redactado por Leonix — afecta el cronograma y alcance.",
    clientQuestionEn: "Will you provide the text, or should Leonix write it for you?", clientQuestionEs: "¿Proporcionará el texto, o debería Leonix escribirlo por usted?",
    valueType: "choice", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "about_story", section: "content",
    labelEn: "About / founder story", labelEs: "Historia del negocio / fundador",
    operatorGuidanceEn: "Only if an About section is planned.", operatorGuidanceEs: "Solo si se planea una sección Acerca de.",
    clientQuestionEn: "What is the story behind your business?", clientQuestionEs: "¿Cuál es la historia detrás de su negocio?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: true, recommendReconfirmation: false,
  },
  {
    fieldKey: "testimonials_available", section: "content",
    labelEn: "Testimonials/reviews available", labelEs: "Testimonios/reseñas disponibles",
    operatorGuidanceEn: "No unverified testimonial, credential, or claim may be published as fact.", operatorGuidanceEs: "Ningún testimonio, credencial o afirmación sin verificar puede publicarse como hecho.",
    clientQuestionEn: "Do you have real customer testimonials we can feature?", clientQuestionEs: "¿Tiene testimonios reales de clientes que podamos destacar?",
    valueType: "boolean", defaultCompletenessClass: "optional", whoShouldAnswer: "CLIENT",
    priority: 4, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    sensitiveDataWarning: "Never publish a testimonial, credential, or certification the client has not explicitly confirmed as real.",
  },
];

// =================================================================================================
// 8. MEDIA / ASSETS
// =================================================================================================
const mediaAssets: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "photo_assets_available", section: "media_assets",
    labelEn: "Photos available (location/team/product)", labelEs: "Fotos disponibles (ubicación/equipo/producto)",
    operatorGuidanceEn: "Determine whether professional photography is needed.", operatorGuidanceEs: "Determine si se necesita fotografía profesional.",
    clientQuestionEn: "Do you have good photos of your business, team, or products?", clientQuestionEs: "¿Tiene buenas fotos de su negocio, equipo o productos?",
    valueType: "asset_ref", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "asset_ownership_license", section: "media_assets",
    labelEn: "Asset ownership / license status", labelEs: "Propiedad / estado de licencia de los activos",
    operatorGuidanceEn: "Confirm the client actually owns rights to any provided media.", operatorGuidanceEs: "Confirme que el cliente realmente posee los derechos de cualquier medio proporcionado.",
    clientQuestionEn: "Do you own the rights to the photos/videos you're providing?", clientQuestionEs: "¿Posee los derechos de las fotos/videos que está proporcionando?",
    valueType: "boolean", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

// =================================================================================================
// 9. PAGE / SECTION ARCHITECTURE
// =================================================================================================
const pageArchitecture: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "required_pages_sections", section: "page_architecture",
    labelEn: "Required pages/sections", labelEs: "Páginas/secciones requeridas",
    operatorGuidanceEn: "Derive structure from the project's actual needs, not a universal page count (MD §8.9).", operatorGuidanceEs: "Derive la estructura de las necesidades reales del proyecto, no de un conteo universal de páginas.",
    clientQuestionEn: "What are the must-have pages or sections for your site?", clientQuestionEs: "¿Cuáles son las páginas o secciones imprescindibles para su sitio?",
    valueType: "list", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "LEONIX",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

// =================================================================================================
// 10. PRIMARY CTA / CONVERSION PATH
// =================================================================================================
const primaryCta: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "primary_cta_type", section: "primary_cta",
    labelEn: "Primary call to action", labelEs: "Llamada a la acción principal",
    operatorGuidanceEn: "Call, Text, WhatsApp, Email, Contact form, Quote, Book, Reserve, Order, Buy, Donate, Listen Live, Watch Live, Register, Apply, Visit, Directions, Other — never leave this unknown before build.",
    operatorGuidanceEs: "Llamar, mensaje de texto, WhatsApp, correo, formulario de contacto, cotización, reservar, ordenar, comprar, donar, escuchar en vivo, ver en vivo, registrarse, aplicar, visitar, direcciones, otro.",
    clientQuestionEn: "What is the single most important action you want a visitor to take?", clientQuestionEs: "¿Cuál es la acción más importante que quiere que tome un visitante?",
    valueType: "choice", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "cta_destination_owner", section: "primary_cta",
    labelEn: "CTA destination / provider owner", labelEs: "Destino de la CTA / propietario del proveedor",
    operatorGuidanceEn: "Where does the CTA actually go, and who owns that account/provider?", operatorGuidanceEs: "¿A dónde va realmente la CTA, y quién es dueño de esa cuenta/proveedor?",
    clientQuestionEn: "Where should that action actually take the visitor?", clientQuestionEs: "¿A dónde debería llevar esa acción al visitante?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

// =================================================================================================
// 11. FORMS — dependency-gated on wanting a contact form (MD <conditional_dependencies>).
// =================================================================================================
const forms: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "wants_contact_form", section: "forms",
    labelEn: "Wants a contact form", labelEs: "Quiere un formulario de contacto",
    operatorGuidanceEn: "The trigger for every other forms question below.", operatorGuidanceEs: "El disparador para cada otra pregunta de formularios a continuación.",
    clientQuestionEn: "Would you like a contact form on the site?", clientQuestionEs: "¿Le gustaría un formulario de contacto en el sitio?",
    valueType: "boolean", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "form_recipient", section: "forms",
    labelEn: "Form submission recipient", labelEs: "Destinatario de las respuestas del formulario",
    operatorGuidanceEn: "Never leave a form live with no confirmed recipient.", operatorGuidanceEs: "Nunca deje un formulario activo sin un destinatario confirmado.",
    clientQuestionEn: "Who should receive form submissions?", clientQuestionEs: "¿Quién debe recibir las respuestas del formulario?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    dependencyCondition: (ctx) => ctx.hasCapturedValue("wants_contact_form", true),
    priority: 1, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "form_required_fields", section: "forms",
    labelEn: "Required form fields", labelEs: "Campos requeridos del formulario",
    operatorGuidanceEn: "Ask only after the client confirms wanting a form.", operatorGuidanceEs: "Pregunte solo después de que el cliente confirme que quiere un formulario.",
    clientQuestionEn: "What information should the form collect?", clientQuestionEs: "¿Qué información debe recopilar el formulario?",
    valueType: "list", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    dependencyCondition: (ctx) => ctx.hasCapturedValue("wants_contact_form", true),
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "form_sensitive_data_restriction", section: "forms",
    labelEn: "Sensitive-data restriction on the form", labelEs: "Restricción de datos sensibles en el formulario",
    operatorGuidanceEn: "Never collect health/financial/minors' data through a normal contact form (MD <legal_and_sensitive_information>).",
    operatorGuidanceEs: "Nunca recopile datos de salud/financieros/de menores a través de un formulario de contacto normal.",
    clientQuestionEn: "This form should not be used to collect sensitive personal, medical, or financial information — is that acceptable?",
    clientQuestionEs: "Este formulario no debe usarse para recopilar información personal sensible, médica o financiera — ¿es aceptable?",
    valueType: "boolean", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "LEONIX",
    dependencyCondition: (ctx) => ctx.hasCapturedValue("wants_contact_form", true),
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    sensitiveDataWarning: "Do not encourage collection of sensitive personal, medical, or financial data in a normal contact form.",
  },
];

// =================================================================================================
// 12. DOMAIN — high-value because it often blocks launch (MD <domain_and_ownership>). No secrets.
// =================================================================================================
const domain: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "has_existing_domain", section: "domain",
    labelEn: "Has an existing domain", labelEs: "Tiene un dominio existente",
    operatorGuidanceEn: "Determine whether this is a new domain purchase or an existing one.", operatorGuidanceEs: "Determine si se trata de una compra de dominio nuevo o uno existente.",
    clientQuestionEn: "Do you already own a domain name?", clientQuestionEs: "¿Ya tiene un nombre de dominio?",
    valueType: "boolean", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: true, recommendReconfirmation: false,
  },
  {
    fieldKey: "domain_owner", section: "domain",
    labelEn: "Domain legal/account owner", labelEs: "Propietario legal/de cuenta del dominio",
    operatorGuidanceEn: "The client should normally own the permanent domain account (MD §8.12). Never ask for the password.",
    operatorGuidanceEs: "El cliente normalmente debe ser dueño de la cuenta permanente del dominio. Nunca pida la contraseña.",
    clientQuestionEn: "Who owns the domain account (not the password — just who the owner is)?", clientQuestionEs: "¿Quién es dueño de la cuenta del dominio (no la contraseña — solo quién es el dueño)?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    dependencyCondition: (ctx) => ctx.hasCapturedValue("has_existing_domain", true),
    priority: 1, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "domain_access_available", section: "domain",
    labelEn: "DNS/domain access available", labelEs: "Acceso a DNS/dominio disponible",
    operatorGuidanceEn: "Ask 'do you have access', never 'what is your password.'", operatorGuidanceEs: "Pregunte 'tiene acceso', nunca 'cuál es su contraseña.'",
    clientQuestionEn: "Do you (or can you get) access to the domain/DNS settings?", clientQuestionEs: "¿Tiene (o puede obtener) acceso a la configuración del dominio/DNS?",
    valueType: "boolean", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    dependencyCondition: (ctx) => ctx.hasCapturedValue("has_existing_domain", true),
    priority: 1, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "desired_new_domain", section: "domain",
    labelEn: "Desired new domain name", labelEs: "Nombre de dominio nuevo deseado",
    operatorGuidanceEn: "Only relevant when there is no existing domain (MD Preferred: Cloudflare Registrar).", operatorGuidanceEs: "Solo relevante cuando no hay un dominio existente.",
    clientQuestionEn: "What domain name would you like to use?", clientQuestionEs: "¿Qué nombre de dominio le gustaría usar?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    dependencyCondition: (ctx) => ctx.hasCapturedValue("has_existing_domain", false),
    priority: 1, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

// =================================================================================================
// 13. HOSTING / DEPLOYMENT
// =================================================================================================
const hostingDeployment: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "existing_host_migration_needed", section: "hosting_deployment",
    labelEn: "Existing host / migration needed", labelEs: "Alojamiento existente / migración necesaria",
    operatorGuidanceEn: "Only relevant when there is an existing site to migrate.", operatorGuidanceEs: "Solo relevante cuando hay un sitio existente que migrar.",
    clientQuestionEn: "Where is your current site hosted, and who manages that account?", clientQuestionEs: "¿Dónde está alojado su sitio actual, y quién administra esa cuenta?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.hasExistingWebsite,
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "hosting_billing_owner", section: "hosting_deployment",
    labelEn: "Hosting billing owner", labelEs: "Propietario de facturación del alojamiento",
    operatorGuidanceEn: "Preferred: Vercel (MD <preferred_platform_registry>).", operatorGuidanceEs: "Preferido: Vercel.",
    clientQuestionEn: "Who should be responsible for the hosting account and its billing?", clientQuestionEs: "¿Quién debe ser responsable de la cuenta de alojamiento y su facturación?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "existing_website_transition_plan", section: "hosting_deployment",
    labelEn: "Existing website transition plan (replace vs. preserve)", labelEs: "Plan de transición del sitio existente (reemplazar vs. preservar)",
    operatorGuidanceEn: "Costly to discover only after the meeting ends — a classic 'Before You Wrap Up' item.",
    operatorGuidanceEs: "Costoso de descubrir solo después de que termine la reunión — un elemento clásico de 'Antes de Terminar'.",
    clientQuestionEn: "Should your current website be fully replaced, or does anything need to stay live during the transition?",
    clientQuestionEs: "¿Su sitio web actual debe reemplazarse por completo, o algo debe permanecer activo durante la transición?",
    valueType: "choice", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.hasExistingWebsite,
    priority: 1, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

// =================================================================================================
// 14. CMS / CONTENT EDITING — dependency-gated (MD: "Do not add a CMS if the client does not need one.")
// =================================================================================================
const cms: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "wants_self_managed_content", section: "cms",
    labelEn: "Client wants to self-manage content", labelEs: "El cliente quiere administrar su propio contenido",
    operatorGuidanceEn: "The trigger for every other CMS question. Do not add a CMS if unnecessary.", operatorGuidanceEs: "El disparador para cada otra pregunta de CMS. No agregue un CMS si no es necesario.",
    clientQuestionEn: "Do you want to be able to update content yourself after launch?", clientQuestionEs: "¿Quiere poder actualizar el contenido usted mismo después del lanzamiento?",
    valueType: "boolean", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "cms_editors_who_what_how_often", section: "cms",
    labelEn: "Who edits, what, and how often", labelEs: "Quién edita, qué, y con qué frecuencia",
    operatorGuidanceEn: "Determines editor seats and CMS complexity.", operatorGuidanceEs: "Determina los accesos de editor y la complejidad del CMS.",
    clientQuestionEn: "Who on your team will make updates, and how often — events, menu, team, articles?", clientQuestionEs: "¿Quién en su equipo hará las actualizaciones, y con qué frecuencia — eventos, menú, equipo, artículos?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    dependencyCondition: (ctx) => ctx.hasCapturedValue("wants_self_managed_content", true),
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "cms_architecture_decision", section: "cms",
    labelEn: "CMS architecture decision", labelEs: "Decisión de arquitectura del CMS",
    operatorGuidanceEn: "Preferred: Sanity, only when structured content editing is truly needed. This is a Leonix technical decision, never a client question.",
    operatorGuidanceEs: "Preferido: Sanity, solo cuando realmente se necesite edición de contenido estructurado. Esta es una decisión técnica de Leonix, nunca una pregunta al cliente.",
    clientQuestionEn: "(Internal — not asked to the client)", clientQuestionEs: "(Interno — no se pregunta al cliente)",
    valueType: "text", defaultCompletenessClass: "needs_leonix_decision", whoShouldAnswer: "LEONIX",
    dependencyCondition: (ctx) => ctx.hasCapturedValue("wants_self_managed_content", true),
    priority: 2, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

// =================================================================================================
// 15. BACKEND / DATABASE / AUTH — ask only when justified; several trigger scope escalation.
// =================================================================================================
const backendDatabaseAuth: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "wants_user_accounts", section: "backend_database_auth",
    labelEn: "Wants user accounts / login", labelEs: "Quiere cuentas de usuario / inicio de sesión",
    operatorGuidanceEn: "A major Custom Platform signal — trigger scope review (MD <scope_escalation>).", operatorGuidanceEs: "Una señal importante de Plataforma Personalizada — active la revisión de alcance.",
    clientQuestionEn: "Do visitors need to create an account or log in?", clientQuestionEs: "¿Los visitantes necesitan crear una cuenta o iniciar sesión?",
    valueType: "boolean", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    scopeEscalationSignal: "user_authentication",
  },
  {
    fieldKey: "wants_customer_dashboard", section: "backend_database_auth",
    labelEn: "Wants a private customer/member dashboard", labelEs: "Quiere un panel privado de cliente/miembro",
    operatorGuidanceEn: "A major Custom Platform signal.", operatorGuidanceEs: "Una señal importante de Plataforma Personalizada.",
    clientQuestionEn: "Do you need a private dashboard where customers see their own history or records?", clientQuestionEs: "¿Necesita un panel privado donde los clientes vean su propio historial o registros?",
    valueType: "boolean", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    scopeEscalationSignal: "customer_dashboard",
  },
  {
    fieldKey: "backend_database_needed", section: "backend_database_auth",
    labelEn: "Persistent database needed", labelEs: "Base de datos persistente necesaria",
    operatorGuidanceEn: "Preferred: Supabase, only when persistent state is actually required. Internal architecture decision.",
    operatorGuidanceEs: "Preferido: Supabase, solo cuando realmente se requiera estado persistente. Decisión de arquitectura interna.",
    clientQuestionEn: "(Internal — not asked to the client)", clientQuestionEs: "(Interno — no se pregunta al cliente)",
    valueType: "boolean", defaultCompletenessClass: "needs_leonix_decision", whoShouldAnswer: "LEONIX",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    scopeEscalationSignal: "complex_database",
  },
];

// =================================================================================================
// 16. BOOKING / SCHEDULING — dependency-gated.
// =================================================================================================
const bookingScheduling: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "wants_online_booking", section: "booking_scheduling",
    labelEn: "Wants online booking/scheduling", labelEs: "Quiere reservas/programación en línea",
    operatorGuidanceEn: "The trigger for every other booking question.", operatorGuidanceEs: "El disparador para cada otra pregunta de reservas.",
    clientQuestionEn: "Do you want visitors to book or schedule online?", clientQuestionEs: "¿Quiere que los visitantes reserven o programen en línea?",
    valueType: "boolean", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    scopeEscalationSignal: "scheduling_engine",
  },
  {
    fieldKey: "booking_provider_ownership", section: "booking_scheduling",
    labelEn: "Existing booking provider and account ownership", labelEs: "Proveedor de reservas existente y propiedad de la cuenta",
    operatorGuidanceEn: "Prefer a reliable external system when replacing it adds no client value (MD §16).", operatorGuidanceEs: "Prefiera un sistema externo confiable cuando reemplazarlo no agregue valor al cliente.",
    clientQuestionEn: "Do you already use a booking system? Who owns that account?", clientQuestionEs: "¿Ya usa un sistema de reservas? ¿Quién es dueño de esa cuenta?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    dependencyCondition: (ctx) => ctx.hasCapturedValue("wants_online_booking", true),
    priority: 1, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "booking_payment_required", section: "booking_scheduling",
    labelEn: "Booking requires payment", labelEs: "La reserva requiere pago",
    operatorGuidanceEn: "If yes, cross-reference with Payments/Commerce section.", operatorGuidanceEs: "Si es sí, referencie con la sección de Pagos/Comercio.",
    clientQuestionEn: "Does booking require a payment or deposit?", clientQuestionEs: "¿La reserva requiere un pago o depósito?",
    valueType: "boolean", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    dependencyCondition: (ctx) => ctx.hasCapturedValue("wants_online_booking", true),
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

// =================================================================================================
// 17. PAYMENTS / COMMERCE — native checkout triggers major scope escalation.
// =================================================================================================
const paymentsCommerce: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "wants_native_checkout", section: "payments_commerce",
    labelEn: "Wants native on-site checkout (not just an informational link)", labelEs: "Quiere pago nativo en el sitio (no solo un enlace informativo)",
    operatorGuidanceEn: "Native commerce can materially change project scope (MD §17) — treat as a major scope signal.",
    operatorGuidanceEs: "El comercio nativo puede cambiar materialmente el alcance del proyecto — trátelo como una señal de alcance importante.",
    clientQuestionEn: "Should customers be able to pay directly on your site, or is a link to an existing checkout enough?", clientQuestionEs: "¿Los clientes deben poder pagar directamente en su sitio, o basta un enlace a un pago existente?",
    valueType: "choice", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    // Deliberately NOT scopeEscalationSignal-tagged: wanting native checkout in the abstract is not
    // yet enough evidence (MD <website_archetype_awareness>: "Questions must derive from actual
    // goals and features"). The escalation signal lives on commerce_tax_shipping_inventory below,
    // which only becomes askable once this want is confirmed AND represents real checkout
    // follow-through (tax/shipping/inventory/refunds).
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "commerce_tax_shipping_inventory", section: "payments_commerce",
    labelEn: "Tax / shipping / inventory / refunds needs", labelEs: "Necesidades de impuestos / envío / inventario / reembolsos",
    operatorGuidanceEn: "Only relevant once native checkout is confirmed.", operatorGuidanceEs: "Solo relevante una vez confirmado el pago nativo.",
    clientQuestionEn: "Do you need to handle taxes, shipping, inventory, and refunds through the site?", clientQuestionEs: "¿Necesita manejar impuestos, envío, inventario y reembolsos a través del sitio?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    dependencyCondition: (ctx) => ctx.hasCapturedValue("wants_native_checkout", true),
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    scopeEscalationSignal: "custom_checkout",
  },
  {
    fieldKey: "payment_provider_ownership", section: "payments_commerce",
    labelEn: "Payment provider account ownership", labelEs: "Propiedad de la cuenta del proveedor de pagos",
    operatorGuidanceEn: "Compliance-sensitive — the client owns the merchant account, never Leonix.", operatorGuidanceEs: "Sensible al cumplimiento — el cliente es dueño de la cuenta de comerciante, nunca Leonix.",
    clientQuestionEn: "Do you already have a payment provider account (e.g. Stripe)?", clientQuestionEs: "¿Ya tiene una cuenta de proveedor de pagos (por ejemplo, Stripe)?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    dependencyCondition: (ctx) => ctx.hasCapturedValue("wants_native_checkout", true),
    priority: 1, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

// =================================================================================================
// 18. SOCIAL / EXTERNAL PRESENCE
// =================================================================================================
const socialPresence: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "social_profiles_to_link", section: "social_presence",
    labelEn: "Social profiles to link", labelEs: "Perfiles sociales a enlazar",
    operatorGuidanceEn: "Public research may already have found these.", operatorGuidanceEs: "La investigación pública puede haberlos encontrado ya.",
    clientQuestionEn: "Which social profiles should we link from the site?", clientQuestionEs: "¿Qué perfiles sociales debemos enlazar desde el sitio?",
    valueType: "list", defaultCompletenessClass: "helpful", whoShouldAnswer: "PUBLIC_RESEARCH",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: true, recommendReconfirmation: true,
  },
];

// =================================================================================================
// 19. SEO / DISCOVERY
// =================================================================================================
const seo: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "seo_target_keywords_geo", section: "seo",
    labelEn: "Target services/geography for discovery", labelEs: "Servicios/geografía objetivo para descubrimiento",
    operatorGuidanceEn: "No guaranteed ranking claims are ever made to the client (MD §19).", operatorGuidanceEs: "Nunca se hacen promesas de posicionamiento garantizado al cliente.",
    clientQuestionEn: "What should people search for to find you?", clientQuestionEs: "¿Qué deberían buscar las personas para encontrarlo?",
    valueType: "list", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "old_site_redirects_needed", section: "seo",
    labelEn: "Redirects from old site needed", labelEs: "Redirecciones del sitio anterior necesarias",
    operatorGuidanceEn: "Only relevant with an existing site being replaced.", operatorGuidanceEs: "Solo relevante cuando se reemplaza un sitio existente.",
    clientQuestionEn: "(Internal — determined from the existing site, not asked to the client)", clientQuestionEs: "(Interno — se determina del sitio existente, no se pregunta al cliente)",
    valueType: "boolean", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "LEONIX",
    applicabilityCondition: (ctx) => ctx.hasExistingWebsite,
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

// =================================================================================================
// 20. ANALYTICS / MEASUREMENT
// =================================================================================================
const analytics: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "measurable_events_of_interest", section: "analytics",
    labelEn: "What success should be measurable", labelEs: "Qué éxito debe ser medible",
    operatorGuidanceEn: "Calls, form submissions, bookings, orders — business-specific.", operatorGuidanceEs: "Llamadas, envíos de formularios, reservas, pedidos — específico del negocio.",
    clientQuestionEn: "How will you know the website is working?", clientQuestionEs: "¿Cómo sabrá que el sitio web está funcionando?",
    valueType: "list", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

// =================================================================================================
// 21. ACCESSIBILITY — Leonix remains responsible for technical decisions; ask only what's genuinely
// client-specific (MD <accessibility>).
// =================================================================================================
const accessibility: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "known_audience_accessibility_needs", section: "accessibility",
    labelEn: "Known audience accessibility needs", labelEs: "Necesidades de accesibilidad conocidas de la audiencia",
    operatorGuidanceEn: "Only a client-facing question when the client actually knows something specific — WCAG implementation itself is a Leonix responsibility.",
    operatorGuidanceEs: "Solo es una pregunta al cliente cuando realmente conoce algo específico — la implementación técnica de WCAG es responsabilidad de Leonix.",
    clientQuestionEn: "Do you know of any specific accessibility needs among your customers?", clientQuestionEs: "¿Conoce alguna necesidad de accesibilidad específica entre sus clientes?",
    valueType: "text", defaultCompletenessClass: "optional", whoShouldAnswer: "CLIENT",
    priority: 4, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "captions_transcripts_needed", section: "accessibility",
    labelEn: "Captions/transcripts needed for audio/video", labelEs: "Subtítulos/transcripciones necesarias para audio/video",
    operatorGuidanceEn: "Only relevant when audio/video content is planned.", operatorGuidanceEs: "Solo relevante cuando se planea contenido de audio/video.",
    clientQuestionEn: "(Internal — determined once media content is known, not a separate client question)", clientQuestionEs: "(Interno — se determina una vez que se conoce el contenido multimedia)",
    valueType: "boolean", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "LEONIX",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

// =================================================================================================
// 22. LANGUAGES
// =================================================================================================
const languages: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "bilingual_site_needed", section: "languages",
    labelEn: "Bilingual site needed", labelEs: "Sitio bilingüe necesario",
    operatorGuidanceEn: "Confirm primary/secondary language and translation ownership.", operatorGuidanceEs: "Confirme el idioma principal/secundario y la propiedad de la traducción.",
    clientQuestionEn: "Should the site be available in both English and Spanish?", clientQuestionEs: "¿El sitio debe estar disponible en inglés y español?",
    valueType: "boolean", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: true, recommendReconfirmation: false,
  },
  {
    fieldKey: "translation_ownership", section: "languages",
    labelEn: "Translation ownership", labelEs: "Propiedad de la traducción",
    operatorGuidanceEn: "Only relevant when bilingual is confirmed.", operatorGuidanceEs: "Solo relevante cuando se confirma bilingüe.",
    clientQuestionEn: "Who provides the translated content — you or Leonix?", clientQuestionEs: "¿Quién proporciona el contenido traducido — usted o Leonix?",
    valueType: "choice", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    dependencyCondition: (ctx) => ctx.hasCapturedValue("bilingual_site_needed", true),
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

// =================================================================================================
// 23. PRIVACY / LEGAL / COMPLIANCE — never fabricate legal conclusions (MD <legal_and_sensitive_information>).
// =================================================================================================
const privacyLegal: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "collects_personal_information", section: "privacy_legal",
    labelEn: "Site collects personal information", labelEs: "El sitio recopila información personal",
    operatorGuidanceEn: "Forms, analytics, cookies, uploads all count.", operatorGuidanceEs: "Formularios, análisis, cookies, cargas — todo cuenta.",
    clientQuestionEn: "(Internal — determined from the confirmed feature set, not asked directly)", clientQuestionEs: "(Interno — se determina del conjunto de funciones confirmado)",
    valueType: "boolean", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "LEONIX",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "industry_regulatory_requirements", section: "privacy_legal",
    labelEn: "Industry-specific regulatory requirements", labelEs: "Requisitos regulatorios específicos de la industria",
    operatorGuidanceEn: "Never fabricate a legal conclusion — this always routes to official research or an external professional.",
    operatorGuidanceEs: "Nunca fabrique una conclusión legal — esto siempre se dirige a investigación oficial o un profesional externo.",
    clientQuestionEn: "(Not asked as a yes/no client question — routed to official research)", clientQuestionEs: "(No se pregunta como sí/no al cliente — se dirige a investigación oficial)",
    valueType: "text", defaultCompletenessClass: "needs_official_research", whoShouldAnswer: "OFFICIAL_RESEARCH",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    sensitiveDataWarning: "Never state a licensing or legal requirement as confirmed fact without official verification.",
  },
  {
    fieldKey: "handles_minors_or_medical_financial_data", section: "privacy_legal",
    labelEn: "Handles minors' or medical/financial data", labelEs: "Maneja datos de menores o médicos/financieros",
    operatorGuidanceEn: "A serious scope/compliance signal — flag for Leonix architecture review, never handled casually.",
    operatorGuidanceEs: "Una señal seria de alcance/cumplimiento — márquela para revisión de arquitectura de Leonix.",
    clientQuestionEn: "Will the site ever collect information about minors, or medical/financial details?", clientQuestionEs: "¿El sitio alguna vez recopilará información sobre menores, o detalles médicos/financieros?",
    valueType: "boolean", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    scopeEscalationSignal: "regulated_sensitive_data",
    sensitiveDataWarning: "Regulated/sensitive data handling requires Leonix architecture review before any commitment.",
  },
];

// =================================================================================================
// 24. OWNERSHIP / BILLING — no project reaches handoff without this being explicit (MD §13).
// =================================================================================================
const ownershipBilling: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "platform_ownership_register", section: "ownership_billing",
    labelEn: "Ownership register for every permanent platform", labelEs: "Registro de propiedad para cada plataforma permanente",
    operatorGuidanceEn: "Account owner, billing owner, recovery email, Leonix access level — captured as ordinary discovery items, never a password field.",
    operatorGuidanceEs: "Propietario de la cuenta, propietario de facturación, correo de recuperación, nivel de acceso de Leonix — nunca un campo de contraseña.",
    clientQuestionEn: "For each account we set up, who should be the permanent owner?", clientQuestionEs: "Para cada cuenta que configuremos, ¿quién debe ser el propietario permanente?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

// =================================================================================================
// 25. MAINTENANCE
// =================================================================================================
const maintenance: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "maintenance_responsibility", section: "maintenance",
    labelEn: "Ongoing maintenance responsibility", labelEs: "Responsabilidad de mantenimiento continuo",
    operatorGuidanceEn: "Client-managed, Leonix-managed, or mixed — sets support expectations.", operatorGuidanceEs: "Administrado por el cliente, por Leonix, o mixto — establece expectativas de soporte.",
    clientQuestionEn: "After launch, who will keep the site updated?", clientQuestionEs: "Después del lanzamiento, ¿quién mantendrá el sitio actualizado?",
    valueType: "choice", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

// =================================================================================================
// 26. SCOPE
// =================================================================================================
const scope: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "in_scope_summary", section: "scope",
    labelEn: "In-scope summary", labelEs: "Resumen de lo incluido",
    operatorGuidanceEn: "What Leonix is building now — explicit, not implied.", operatorGuidanceEs: "Lo que Leonix está construyendo ahora — explícito, no implícito.",
    clientQuestionEn: "(Internal — compiled from confirmed answers, not asked directly)", clientQuestionEs: "(Interno — se compila de las respuestas confirmadas)",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "LEONIX",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "out_of_scope_summary", section: "scope",
    labelEn: "Out-of-scope summary", labelEs: "Resumen de lo no incluido",
    operatorGuidanceEn: "What is explicitly not included, to prevent scope-creep disputes later.", operatorGuidanceEs: "Lo que explícitamente no está incluido, para prevenir disputas de alcance más tarde.",
    clientQuestionEn: "(Internal — compiled from confirmed answers, not asked directly)", clientQuestionEs: "(Interno — se compila de las respuestas confirmadas)",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "LEONIX",
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

// =================================================================================================
// 27. SCHEDULE / APPROVALS
// =================================================================================================
const scheduleApprovals: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "hard_launch_deadline", section: "schedule_approvals",
    labelEn: "Hard launch deadline (and why)", labelEs: "Fecha límite de lanzamiento firme (y por qué)",
    operatorGuidanceEn: "A real deadline changes prioritization — confirm it's real, not assumed urgency.", operatorGuidanceEs: "Una fecha límite real cambia la priorización — confirme que es real, no urgencia asumida.",
    clientQuestionEn: "Is there a hard deadline for launch, and what's driving it?", clientQuestionEs: "¿Hay una fecha límite firme para el lanzamiento, y qué la impulsa?",
    valueType: "date", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "content_delivery_date", section: "schedule_approvals",
    labelEn: "Content delivery date commitment", labelEs: "Compromiso de fecha de entrega de contenido",
    operatorGuidanceEn: "When will the client actually deliver copy/photos/approvals — a common source of delay.", operatorGuidanceEs: "Cuándo entregará realmente el cliente el texto/fotos/aprobaciones — una fuente común de retraso.",
    clientQuestionEn: "By when can you provide your content and approvals?", clientQuestionEs: "¿Para cuándo puede proporcionar su contenido y aprobaciones?",
    valueType: "date", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

// =================================================================================================
// INDUSTRY BRANCHES (MD <industry_branches>) — additional, conditional requirements, each gated on
// industryBranch AND (for goal-dependent ones) an actual client goal, never category alone (MD
// <website_archetype_awareness>: "Questions must derive from actual goals and features, not category alone.").
// =================================================================================================
const restaurantBranch: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "restaurant_menu_source", section: "content", industryBranch: "restaurant",
    labelEn: "Menu source / format", labelEs: "Fuente / formato del menú",
    operatorGuidanceEn: "PDF, photos, or text — determines build effort.", operatorGuidanceEs: "PDF, fotos, o texto — determina el esfuerzo de construcción.",
    clientQuestionEn: "How would you like to share your menu with us — PDF, photos, or a written list?", clientQuestionEs: "¿Cómo le gustaría compartir su menú con nosotros — PDF, fotos, o una lista escrita?",
    valueType: "choice", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "restaurant",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "restaurant_ordering_provider_ownership", section: "booking_scheduling", industryBranch: "restaurant",
    labelEn: "Online ordering provider ownership", labelEs: "Propiedad del proveedor de pedidos en línea",
    operatorGuidanceEn: "Only relevant if the client wants online ordering exposed on the site.", operatorGuidanceEs: "Solo relevante si el cliente quiere pedidos en línea expuestos en el sitio.",
    clientQuestionEn: "Do you already use an online ordering platform? Who owns that account?", clientQuestionEs: "¿Ya usa una plataforma de pedidos en línea? ¿Quién es dueño de esa cuenta?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "restaurant",
    dependencyCondition: (ctx) => ctx.hasCapturedValue("restaurant_wants_online_ordering", true),
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "restaurant_wants_online_ordering", section: "offers_services_products", industryBranch: "restaurant",
    labelEn: "Wants online ordering exposed on the site", labelEs: "Quiere pedidos en línea expuestos en el sitio",
    operatorGuidanceEn: "May be optional, an external provider link, or required depending on client goal.", operatorGuidanceEs: "Puede ser opcional, un enlace a un proveedor externo, o requerido según el objetivo del cliente.",
    clientQuestionEn: "Do you want customers to order online through your site?", clientQuestionEs: "¿Quiere que los clientes ordenen en línea a través de su sitio?",
    valueType: "boolean", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "restaurant",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "restaurant_wants_reservations", section: "booking_scheduling", industryBranch: "restaurant",
    labelEn: "Wants online reservations", labelEs: "Quiere reservaciones en línea",
    operatorGuidanceEn: "Independent of ordering — a restaurant may want one, both, or neither.", operatorGuidanceEs: "Independiente de los pedidos — un restaurante puede querer uno, ambos, o ninguno.",
    clientQuestionEn: "Do you want customers to make table reservations online?", clientQuestionEs: "¿Quiere que los clientes hagan reservaciones de mesa en línea?",
    valueType: "boolean", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "restaurant",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "restaurant_catering_offered", section: "offers_services_products", industryBranch: "restaurant",
    labelEn: "Catering offered", labelEs: "Servicio de catering ofrecido",
    operatorGuidanceEn: "May need its own inquiry path.", operatorGuidanceEs: "Puede necesitar su propio camino de consulta.",
    clientQuestionEn: "Do you offer catering?", clientQuestionEs: "¿Ofrece catering?",
    valueType: "boolean", defaultCompletenessClass: "optional", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "restaurant",
    priority: 4, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "restaurant_multiple_locations", section: "business_identity", industryBranch: "restaurant",
    labelEn: "Multiple locations", labelEs: "Múltiples ubicaciones",
    operatorGuidanceEn: "Affects page architecture (location pages, per-location hours).", operatorGuidanceEs: "Afecta la arquitectura de páginas (páginas de ubicación, horarios por ubicación).",
    clientQuestionEn: "Do you have more than one location?", clientQuestionEs: "¿Tiene más de una ubicación?",
    valueType: "boolean", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "restaurant",
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: true, recommendReconfirmation: false,
  },
  {
    fieldKey: "restaurant_dietary_allergen_info", section: "content", industryBranch: "restaurant",
    labelEn: "Dietary/allergen information", labelEs: "Información dietética/de alérgenos",
    operatorGuidanceEn: "Only where the client chooses/needs to disclose it — never fabricated.", operatorGuidanceEs: "Solo donde el cliente elige/necesita revelarlo — nunca fabricado.",
    clientQuestionEn: "Do you want to list dietary or allergen information on the menu?", clientQuestionEs: "¿Quiere listar información dietética o de alérgenos en el menú?",
    valueType: "boolean", defaultCompletenessClass: "optional", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "restaurant",
    priority: 4, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

const fitnessBranch: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "fitness_membership_types", section: "offers_services_products", industryBranch: "fitness",
    labelEn: "Membership types offered", labelEs: "Tipos de membresía ofrecidos",
    operatorGuidanceEn: "Only relevant if membership is exposed on the site.", operatorGuidanceEs: "Solo relevante si la membresía se expone en el sitio.",
    clientQuestionEn: "What membership types do you offer?", clientQuestionEs: "¿Qué tipos de membresía ofrece?",
    valueType: "list", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "fitness",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: true, recommendReconfirmation: false,
  },
  {
    fieldKey: "fitness_class_schedule_wanted", section: "booking_scheduling", industryBranch: "fitness",
    labelEn: "Class schedule exposed/managed on site", labelEs: "Horario de clases expuesto/administrado en el sitio",
    operatorGuidanceEn: "Relevant only if the client wants it exposed/managed (MD <website_archetype_awareness>).", operatorGuidanceEs: "Relevante solo si el cliente quiere que se exponga/administre.",
    clientQuestionEn: "Do you want your class schedule shown or managed through the site?", clientQuestionEs: "¿Quiere que su horario de clases se muestre o administre a través del sitio?",
    valueType: "boolean", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "fitness",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "fitness_personal_training_offered", section: "offers_services_products", industryBranch: "fitness",
    labelEn: "Personal training offered", labelEs: "Entrenamiento personal ofrecido",
    operatorGuidanceEn: "May need its own booking path.", operatorGuidanceEs: "Puede necesitar su propio camino de reserva.",
    clientQuestionEn: "Do you offer personal training?", clientQuestionEs: "¿Ofrece entrenamiento personal?",
    valueType: "boolean", defaultCompletenessClass: "optional", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "fitness",
    priority: 4, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "fitness_trial_offer", section: "offers_services_products", industryBranch: "fitness",
    labelEn: "Trial / intro offer", labelEs: "Oferta de prueba / introducción",
    operatorGuidanceEn: "Cross-reference with Growth Engine current-promotion detection where available.", operatorGuidanceEs: "Referencie con la detección de promoción actual del Growth Engine cuando esté disponible.",
    clientQuestionEn: "Do you have a trial or introductory offer for new members?", clientQuestionEs: "¿Tiene una oferta de prueba o introductoria para nuevos miembros?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "fitness",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: true,
    canonicalTruthHint: "Growth Assessment recommendedMediaMix / current promotion detection", recommendReconfirmation: true,
  },
  {
    fieldKey: "fitness_capacity", section: "offers_services_products", industryBranch: "fitness",
    labelEn: "Capacity for new members/classes", labelEs: "Capacidad para nuevos miembros/clases",
    operatorGuidanceEn: "Never recommend a campaign before this is known (MD §21 Guardrail).", operatorGuidanceEs: "Nunca recomiende una campaña antes de conocer esto.",
    clientQuestionEn: "Do you have capacity to take on more members right now?", clientQuestionEs: "¿Tiene capacidad para aceptar más miembros en este momento?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "fitness",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "fitness_target_member", section: "audience", industryBranch: "fitness",
    labelEn: "Target member profile", labelEs: "Perfil de miembro objetivo",
    operatorGuidanceEn: "More specific than the generic audience question.", operatorGuidanceEs: "Más específico que la pregunta genérica de audiencia.",
    clientQuestionEn: "What kind of member are you most trying to attract?", clientQuestionEs: "¿Qué tipo de miembro está tratando de atraer más?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "fitness",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

const radioMediaBranch: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "radio_streaming_provider", section: "backend_database_auth", industryBranch: "radio_media",
    labelEn: "Streaming provider", labelEs: "Proveedor de transmisión",
    operatorGuidanceEn: "Listen Live may become the primary CTA — this becomes required-before-build for a radio site (MD <website_archetype_awareness>).",
    operatorGuidanceEs: "Escuchar en vivo puede convertirse en la CTA principal — esto se vuelve requerido antes de construir para un sitio de radio.",
    clientQuestionEn: "What streaming provider powers your Listen Live?", clientQuestionEs: "¿Qué proveedor de transmisión impulsa su Escuchar en Vivo?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "radio_media",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "radio_stream_access_ownership", section: "ownership_billing", industryBranch: "radio_media",
    labelEn: "Stream ownership / access", labelEs: "Propiedad / acceso al stream",
    operatorGuidanceEn: "Never ask for the password — only who owns/has access.", operatorGuidanceEs: "Nunca pida la contraseña — solo quién es dueño/tiene acceso.",
    clientQuestionEn: "Who owns and has access to the streaming account?", clientQuestionEs: "¿Quién es dueño y tiene acceso a la cuenta de transmisión?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "radio_media",
    priority: 1, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "radio_fallback_if_stream_unavailable", section: "backend_database_auth", industryBranch: "radio_media",
    labelEn: "Fallback behavior if the stream is unavailable", labelEs: "Comportamiento de respaldo si el stream no está disponible",
    operatorGuidanceEn: "Prevents an embarrassing dead-air Listen Live button.", operatorGuidanceEs: "Evita un botón de Escuchar en Vivo embarazoso sin transmisión.",
    clientQuestionEn: "What should visitors see if the live stream is temporarily down?", clientQuestionEs: "¿Qué deberían ver los visitantes si la transmisión en vivo está temporalmente caída?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "radio_media",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "radio_programming_hosts", section: "content", industryBranch: "radio_media",
    labelEn: "Programming / hosts to feature", labelEs: "Programación / locutores a destacar",
    operatorGuidanceEn: "Content inventory for a programming/hosts page.", operatorGuidanceEs: "Inventario de contenido para una página de programación/locutores.",
    clientQuestionEn: "What programming and hosts should we feature?", clientQuestionEs: "¿Qué programación y locutores debemos destacar?",
    valueType: "list", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "radio_media",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "radio_advertisers_sponsors_page", section: "offers_services_products", industryBranch: "radio_media",
    labelEn: "Advertiser/sponsor page needed", labelEs: "Página de anunciantes/patrocinadores necesaria",
    operatorGuidanceEn: "A revenue-facing page distinct from the public listener experience.", operatorGuidanceEs: "Una página orientada a ingresos distinta de la experiencia pública del oyente.",
    clientQuestionEn: "Do you want a page for potential advertisers/sponsors?", clientQuestionEs: "¿Quiere una página para posibles anunciantes/patrocinadores?",
    valueType: "boolean", defaultCompletenessClass: "optional", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "radio_media",
    priority: 4, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

const churchBranch: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "church_service_times", section: "content", industryBranch: "church",
    labelEn: "Service times", labelEs: "Horarios de servicio",
    operatorGuidanceEn: "Core content for a church site.", operatorGuidanceEs: "Contenido esencial para un sitio de iglesia.",
    clientQuestionEn: "What are your service times?", clientQuestionEs: "¿Cuáles son sus horarios de servicio?",
    valueType: "list", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "church",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: true, recommendReconfirmation: false,
  },
  {
    fieldKey: "church_livestream_wanted", section: "backend_database_auth", industryBranch: "church",
    labelEn: "Livestream wanted", labelEs: "Transmisión en vivo deseada",
    operatorGuidanceEn: "Determines media/embed requirements.", operatorGuidanceEs: "Determina los requisitos de medios/embebido.",
    clientQuestionEn: "Do you want to livestream services on the site?", clientQuestionEs: "¿Quiere transmitir servicios en vivo en el sitio?",
    valueType: "boolean", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "church",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "church_online_giving_wanted", section: "payments_commerce", industryBranch: "church",
    labelEn: "Online giving wanted", labelEs: "Donaciones en línea deseadas",
    operatorGuidanceEn: "Relevant ONLY if online giving is desired — never assumed (MD <website_archetype_awareness>).", operatorGuidanceEs: "Relevante SOLO si se desea donación en línea — nunca se asume.",
    clientQuestionEn: "Do you want to accept online giving/donations through the site?", clientQuestionEs: "¿Quiere aceptar donaciones en línea a través del sitio?",
    valueType: "boolean", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "church",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "church_giving_provider", section: "payments_commerce", industryBranch: "church",
    labelEn: "Giving provider and account ownership", labelEs: "Proveedor de donaciones y propiedad de la cuenta",
    operatorGuidanceEn: "Only relevant once online giving is confirmed.", operatorGuidanceEs: "Solo relevante una vez confirmada la donación en línea.",
    clientQuestionEn: "Do you already use a giving platform? Who owns that account?", clientQuestionEs: "¿Ya usa una plataforma de donaciones? ¿Quién es dueño de esa cuenta?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "church",
    dependencyCondition: (ctx) => ctx.hasCapturedValue("church_online_giving_wanted", true),
    priority: 1, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "church_ministries_events", section: "content", industryBranch: "church",
    labelEn: "Ministries and events to feature", labelEs: "Ministerios y eventos a destacar",
    operatorGuidanceEn: "Content inventory.", operatorGuidanceEs: "Inventario de contenido.",
    clientQuestionEn: "What ministries and upcoming events should we feature?", clientQuestionEs: "¿Qué ministerios y eventos próximos debemos destacar?",
    valueType: "list", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "church",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

const professionalServiceBranch: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "professional_credentials_to_feature", section: "content", industryBranch: "professional_service",
    labelEn: "Credentials to feature", labelEs: "Credenciales a destacar",
    operatorGuidanceEn: "Never publish an unverified credential (MD §8.7).", operatorGuidanceEs: "Nunca publique una credencial sin verificar.",
    clientQuestionEn: "What licenses, certifications, or credentials should we feature?", clientQuestionEs: "¿Qué licencias, certificaciones o credenciales debemos destacar?",
    valueType: "list", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "professional_service",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    sensitiveDataWarning: "Never publish a credential the client has not explicitly confirmed and can substantiate.",
  },
  {
    fieldKey: "professional_consultation_process", section: "website_objective", industryBranch: "professional_service",
    labelEn: "Consultation / lead qualification process", labelEs: "Proceso de consulta / calificación de prospectos",
    operatorGuidanceEn: "Drives the conversion path design.", operatorGuidanceEs: "Impulsa el diseño del camino de conversión.",
    clientQuestionEn: "How do you typically qualify or start working with a new client?", clientQuestionEs: "¿Cómo suele calificar o comenzar a trabajar con un nuevo cliente?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "professional_service",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "professional_compliance_sensitive_claims", section: "privacy_legal", industryBranch: "professional_service",
    labelEn: "Compliance-sensitive claims", labelEs: "Afirmaciones sensibles al cumplimiento",
    operatorGuidanceEn: "Routes to official research/external professional, never a fabricated conclusion.", operatorGuidanceEs: "Se dirige a investigación oficial/profesional externo, nunca una conclusión fabricada.",
    clientQuestionEn: "(Not asked directly — routed to official research when a regulated claim is involved)", clientQuestionEs: "(No se pregunta directamente — se dirige a investigación oficial)",
    valueType: "text", defaultCompletenessClass: "needs_official_research", whoShouldAnswer: "OFFICIAL_RESEARCH",
    applicabilityCondition: (ctx) => ctx.industryBranch === "professional_service",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

const homeLocalServiceBranch: WebsiteRequirementDefinition[] = [
  {
    fieldKey: "home_service_area_map", section: "business_identity", industryBranch: "home_local_service",
    labelEn: "Service area (detailed)", labelEs: "Área de servicio (detallada)",
    operatorGuidanceEn: "More specific than the generic service-area question — often multiple cities/zip codes.", operatorGuidanceEs: "Más específico que la pregunta genérica de área de servicio — a menudo varias ciudades/códigos postales.",
    clientQuestionEn: "Exactly which areas or zip codes do you serve?", clientQuestionEs: "¿Exactamente qué áreas o códigos postales atiende?",
    valueType: "list", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "home_local_service",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: true, recommendReconfirmation: false,
  },
  {
    fieldKey: "home_service_quote_process", section: "website_objective", industryBranch: "home_local_service",
    labelEn: "Quote process", labelEs: "Proceso de cotización",
    operatorGuidanceEn: "Free estimate, paid inspection, phone-only — shapes the primary CTA.", operatorGuidanceEs: "Estimación gratis, inspección pagada, solo por teléfono — moldea la CTA principal.",
    clientQuestionEn: "How do customers get a quote from you?", clientQuestionEs: "¿Cómo obtienen los clientes una cotización de usted?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "home_local_service",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "home_service_emergency_service", section: "offers_services_products", industryBranch: "home_local_service",
    labelEn: "Emergency service offered", labelEs: "Servicio de emergencia ofrecido",
    operatorGuidanceEn: "Affects urgency of the primary CTA.", operatorGuidanceEs: "Afecta la urgencia de la CTA principal.",
    clientQuestionEn: "Do you offer emergency/same-day service?", clientQuestionEs: "¿Ofrece servicio de emergencia/el mismo día?",
    valueType: "boolean", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "home_local_service",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "home_service_license_insurance_claims", section: "privacy_legal", industryBranch: "home_local_service",
    labelEn: "License/insurance claims requiring verification", labelEs: "Afirmaciones de licencia/seguro que requieren verificación",
    operatorGuidanceEn: "Never publish 'licensed and insured' without verification — routes to official research.", operatorGuidanceEs: "Nunca publique 'con licencia y asegurado' sin verificación — se dirige a investigación oficial.",
    clientQuestionEn: "(Not asked directly — any licensing/insurance claim is routed to official research before publication)", clientQuestionEs: "(No se pregunta directamente — cualquier afirmación de licencia/seguro se dirige a investigación oficial)",
    valueType: "text", defaultCompletenessClass: "needs_official_research", whoShouldAnswer: "OFFICIAL_RESEARCH",
    applicabilityCondition: (ctx) => ctx.industryBranch === "home_local_service",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    sensitiveDataWarning: "Never publish a licensing or insurance claim as confirmed fact without official verification.",
  },
  {
    fieldKey: "home_service_before_after_media", section: "media_assets", industryBranch: "home_local_service",
    labelEn: "Before/after media available", labelEs: "Medios de antes/después disponibles",
    operatorGuidanceEn: "High-conversion content for this category when available.", operatorGuidanceEs: "Contenido de alta conversión para esta categoría cuando esté disponible.",
    clientQuestionEn: "Do you have before/after photos of completed jobs?", clientQuestionEs: "¿Tiene fotos de antes/después de trabajos completados?",
    valueType: "asset_ref", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    applicabilityCondition: (ctx) => ctx.industryBranch === "home_local_service",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];

export const WEBSITE_REQUIREMENTS: readonly WebsiteRequirementDefinition[] = [
  ...businessIdentity, ...websiteObjective, ...audience, ...offers, ...brandIdentity, ...visualReferences,
  ...content, ...mediaAssets, ...pageArchitecture, ...primaryCta, ...forms, ...domain, ...hostingDeployment,
  ...cms, ...backendDatabaseAuth, ...bookingScheduling, ...paymentsCommerce, ...socialPresence, ...seo,
  ...analytics, ...accessibility, ...languages, ...privacyLegal, ...ownershipBilling, ...maintenance,
  ...scope, ...scheduleApprovals,
  ...restaurantBranch, ...fitnessBranch, ...radioMediaBranch, ...churchBranch, ...professionalServiceBranch, ...homeLocalServiceBranch,
];

const REQUIREMENTS_BY_FIELD_KEY = new Map(WEBSITE_REQUIREMENTS.map((r) => [r.fieldKey, r]));

export function getWebsiteRequirement(fieldKey: string): WebsiteRequirementDefinition | null {
  return REQUIREMENTS_BY_FIELD_KEY.get(fieldKey) ?? null;
}

export function requirementsForSection(section: WebsiteDiscoverySection): readonly WebsiteRequirementDefinition[] {
  return WEBSITE_REQUIREMENTS.filter((r) => r.section === section);
}

export function generalWebsiteRequirements(): readonly WebsiteRequirementDefinition[] {
  return WEBSITE_REQUIREMENTS.filter((r) => !r.industryBranch);
}

export function industryBranchRequirements(branch: IndustryBranchKey): readonly WebsiteRequirementDefinition[] {
  return WEBSITE_REQUIREMENTS.filter((r) => r.industryBranch === branch);
}
