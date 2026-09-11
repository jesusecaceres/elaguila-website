/**
 * Client Discovery & Project Blueprint Engine, Gate 10.2 — Digital Presence discovery catalog (MD
 * §7 "Social Setup / Cleanup", "Google Business Profile support"). Covers both as ONE shared engine
 * with small conditional branches keyed on the concrete ProjectType — mirroring
 * printCollateralDiscoveryCatalog.ts's own precedent (MD Gate 10.2 <phase_6>: "the smallest
 * truthful reusable project-family architecture", never five separate engines).
 *
 * Both subtypes were previously registry-only stubs with zero dedicated discovery — confirmed by
 * Gate 10.1's forensic audit (specializedFamilyForProjectType returned null for both, so every
 * intent of this type silently fell through to the generic Website catalog and surfaced 103
 * irrelevant Website-shaped questions). This closes that gap with real, distinct requirements.
 *
 * Hard rule (MD Gate 10.2 <phase_7>): NEVER collect passwords, recovery codes, API keys, or any
 * other secret — only who owns/has access, exactly like the existing radio_stream_access_ownership
 * precedent in websiteDiscoveryCatalog.ts. No Google/social-platform API is invented anywhere in
 * this file or its packet/execution bridge — the execution destination is an honest manual staff
 * handoff (the blueprint's own handoffStatus seam, the same mechanism Website already uses),
 * because no automated downstream integration exists for either subtype.
 */
import type { ProjectType } from "./types";
import type { SpecializedRequirementDefinition, SpecializedRequirementPredicateContext } from "./specializedDiscoveryEngine";

export const DIGITAL_PRESENCE_CATALOG_VERSION = "digital_presence_discovery_v1";

export type DigitalPresenceSection =
  | "current_presence"
  | "identity_consistency"
  | "content_assets"
  | "ownership_access"
  | "requested_changes"
  | "gbp_listing_details"
  | "approval";

export const DIGITAL_PRESENCE_SECTIONS: readonly DigitalPresenceSection[] = [
  "current_presence", "identity_consistency", "content_assets", "ownership_access", "requested_changes", "gbp_listing_details", "approval",
];

type DigitalPresenceReq = SpecializedRequirementDefinition<DigitalPresenceSection>;

const SOCIAL_SETUP_CLEANUP: ProjectType = "social_setup_cleanup";
const GBP_SUPPORT: ProjectType = "google_business_profile_support";

function isProjectType(...types: readonly ProjectType[]) {
  return (ctx: SpecializedRequirementPredicateContext) => types.includes(ctx.projectType);
}

export const DIGITAL_PRESENCE_REQUIREMENTS: readonly DigitalPresenceReq[] = [
  // ---------------------------------------------------------------------------------------------
  // CURRENT PRESENCE — shared shape, but the actual platform set differs per subtype.
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "social_current_platforms", section: "current_presence",
    labelEn: "Current platforms and profile URLs", labelEs: "Plataformas actuales y URLs de perfil",
    operatorGuidanceEn: "Every existing social profile, with its real URL — the inventory this whole engagement works from.", operatorGuidanceEs: "Cada perfil social existente, con su URL real — el inventario del que parte todo este trabajo.",
    clientQuestionEn: "What social platforms are you currently on, and what are the profile URLs?", clientQuestionEs: "¿En qué plataformas sociales está actualmente, y cuáles son las URLs de los perfiles?",
    valueType: "list", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: true, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(SOCIAL_SETUP_CLEANUP),
  },
  {
    fieldKey: "social_duplicate_outdated_profiles", section: "current_presence",
    labelEn: "Duplicate or outdated profiles found", labelEs: "Perfiles duplicados u obsoletos encontrados",
    operatorGuidanceEn: "A real, staff-observed inventory finding — never assumed from the platform list alone.", operatorGuidanceEs: "Un hallazgo real observado por el personal — nunca asumido solo de la lista de plataformas.",
    clientQuestionEn: "Are there any old, duplicate, or abandoned profiles that should be addressed?", clientQuestionEs: "¿Hay perfiles antiguos, duplicados o abandonados que deban atenderse?",
    valueType: "list", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(SOCIAL_SETUP_CLEANUP),
  },
  {
    fieldKey: "social_missing_desired_profiles", section: "current_presence",
    labelEn: "Missing/desired new profiles", labelEs: "Perfiles nuevos deseados/faltantes",
    operatorGuidanceEn: "Platforms the client wants but doesn't have yet — creation, not just cleanup.", operatorGuidanceEs: "Plataformas que el cliente quiere pero aún no tiene — creación, no solo limpieza.",
    clientQuestionEn: "Are there any platforms you want a presence on that you don't have yet?", clientQuestionEs: "¿Hay alguna plataforma en la que quiera tener presencia y aún no la tenga?",
    valueType: "list", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(SOCIAL_SETUP_CLEANUP),
  },
  {
    fieldKey: "gbp_existing_listing_url", section: "current_presence",
    labelEn: "Existing Google Business Profile URL", labelEs: "URL del Perfil de Negocio de Google existente",
    operatorGuidanceEn: "The real, current listing — never a guessed/created-from-scratch URL.", operatorGuidanceEs: "El listado real y actual — nunca una URL adivinada/creada desde cero.",
    clientQuestionEn: "Do you already have a Google Business Profile? What's the URL?", clientQuestionEs: "¿Ya tiene un Perfil de Negocio de Google? ¿Cuál es la URL?",
    valueType: "url", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(GBP_SUPPORT),
  },
  {
    fieldKey: "gbp_verification_status", section: "current_presence",
    labelEn: "Verification status", labelEs: "Estado de verificación",
    operatorGuidanceEn: "An unverified listing blocks most real GBP work — surface this early.", operatorGuidanceEs: "Un listado no verificado bloquea la mayoría del trabajo real de GBP — señale esto temprano.",
    clientQuestionEn: "Is the listing already verified with Google?", clientQuestionEs: "¿El listado ya está verificado con Google?",
    valueType: "choice", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    options: [
      { value: "verified", labelEn: "Verified", labelEs: "Verificado" },
      { value: "unverified", labelEn: "Not verified", labelEs: "No verificado" },
      { value: "unknown", labelEn: "Not sure", labelEs: "No estoy seguro" },
    ],
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(GBP_SUPPORT),
  },

  // ---------------------------------------------------------------------------------------------
  // IDENTITY CONSISTENCY — Social Setup/Cleanup only.
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "social_naming_consistency", section: "identity_consistency",
    labelEn: "Naming consistency across platforms", labelEs: "Consistencia del nombre entre plataformas",
    operatorGuidanceEn: "The same business should read as the same business everywhere.", operatorGuidanceEs: "El mismo negocio debe leerse como el mismo negocio en todas partes.",
    clientQuestionEn: "Should the business name read exactly the same on every platform, or does it already vary?", clientQuestionEs: "¿El nombre del negocio debe leerse exactamente igual en cada plataforma, o ya varía?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: true, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(SOCIAL_SETUP_CLEANUP),
  },
  {
    fieldKey: "social_bios_descriptions", section: "identity_consistency",
    labelEn: "Bios/descriptions to use", labelEs: "Biografías/descripciones a usar",
    operatorGuidanceEn: "Real client-approved copy — never invented.", operatorGuidanceEs: "Texto real aprobado por el cliente — nunca inventado.",
    clientQuestionEn: "What bio/description should appear across the profiles?", clientQuestionEs: "¿Qué biografía/descripción debe aparecer en los perfiles?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(SOCIAL_SETUP_CLEANUP),
  },
  {
    fieldKey: "social_cta_consistency", section: "identity_consistency",
    labelEn: "Call-to-action consistency", labelEs: "Consistencia de la llamada a la acción",
    operatorGuidanceEn: "What action every profile should point toward — mirrors the Website's own primary CTA concept.", operatorGuidanceEs: "Hacia qué acción debe apuntar cada perfil — refleja el concepto de CTA principal del sitio web.",
    clientQuestionEn: "What's the one action you want every profile to point people toward (call, website, order, etc.)?", clientQuestionEs: "¿Cuál es la única acción hacia la que quiere que cada perfil dirija a la gente (llamar, sitio web, ordenar, etc.)?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(SOCIAL_SETUP_CLEANUP),
  },
  {
    fieldKey: "social_business_contact_info", section: "identity_consistency",
    labelEn: "Business/contact info to publish", labelEs: "Información de negocio/contacto a publicar",
    operatorGuidanceEn: "Phone/address/hours/website as they should appear — shared with the canonical business identity where it already exists.", operatorGuidanceEs: "Teléfono/dirección/horario/sitio web tal como deben aparecer.",
    clientQuestionEn: "What contact info (phone, address, hours, website) should appear on every profile?", clientQuestionEs: "¿Qué información de contacto (teléfono, dirección, horario, sitio web) debe aparecer en cada perfil?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: true, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(SOCIAL_SETUP_CLEANUP),
  },
  {
    fieldKey: "social_links_to_use", section: "identity_consistency",
    labelEn: "Links to use in profiles", labelEs: "Enlaces a usar en los perfiles",
    operatorGuidanceEn: "The real destination link(s) for each profile's own link field.", operatorGuidanceEs: "El/los enlace(s) de destino reales para el campo de enlace de cada perfil.",
    clientQuestionEn: "What link(s) should the profiles use (website, booking page, linktree, etc.)?", clientQuestionEs: "¿Qué enlace(s) deben usar los perfiles (sitio web, página de reservas, linktree, etc.)?",
    valueType: "url", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(SOCIAL_SETUP_CLEANUP),
  },

  // ---------------------------------------------------------------------------------------------
  // CONTENT / ASSETS
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "social_logo_profile_images", section: "content_assets",
    labelEn: "Logo/profile images available", labelEs: "Imágenes de logo/perfil disponibles",
    operatorGuidanceEn: "Reuses the canonical asset store — never a second upload path.", operatorGuidanceEs: "Reutiliza el almacén de activos canónico — nunca una segunda vía de carga.",
    clientQuestionEn: "Do you have a logo/profile image ready to upload?", clientQuestionEs: "¿Tiene una imagen de logo/perfil lista para subir?",
    valueType: "asset_ref", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(SOCIAL_SETUP_CLEANUP),
  },
  {
    fieldKey: "social_cover_banner_images", section: "content_assets",
    labelEn: "Cover/banner images available", labelEs: "Imágenes de portada/banner disponibles",
    operatorGuidanceEn: "Cover art is platform-specific (dimensions vary) — capture availability here, sizing is a Leonix production decision.", operatorGuidanceEs: "La imagen de portada es específica de la plataforma — capture la disponibilidad aquí, el tamaño es una decisión de producción de Leonix.",
    clientQuestionEn: "Do you have cover/banner images, or should Leonix design them?", clientQuestionEs: "¿Tiene imágenes de portada/banner, o debería Leonix diseñarlas?",
    valueType: "asset_ref", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(SOCIAL_SETUP_CLEANUP),
  },
  {
    fieldKey: "gbp_logo_photos", section: "content_assets",
    labelEn: "Logo/photos for the listing", labelEs: "Logo/fotos para el listado",
    operatorGuidanceEn: "Real business photos — never stock imagery for a location-verified listing.", operatorGuidanceEs: "Fotos reales del negocio — nunca imágenes de stock para un listado verificado de ubicación.",
    clientQuestionEn: "Do you have a logo and real business photos to add to the listing?", clientQuestionEs: "¿Tiene un logo y fotos reales del negocio para agregar al listado?",
    valueType: "asset_ref", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(GBP_SUPPORT),
  },

  // ---------------------------------------------------------------------------------------------
  // OWNERSHIP / ACCESS — never ask for the password, only who owns/has access (MD §8.24 precedent).
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "social_account_ownership_access", section: "ownership_access",
    labelEn: "Account ownership/access status per platform", labelEs: "Propiedad/estado de acceso de la cuenta por plataforma",
    operatorGuidanceEn: "Never ask for the password — only who owns/has access, exactly like the Website domain-ownership precedent.", operatorGuidanceEs: "Nunca pida la contraseña — solo quién es dueño/tiene acceso.",
    clientQuestionEn: "Who owns and has access to each of these accounts?", clientQuestionEs: "¿Quién es dueño y tiene acceso a cada una de estas cuentas?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(SOCIAL_SETUP_CLEANUP),
    sensitiveDataWarning: "Never collect the actual password/recovery code — ownership/access status only.",
  },
  {
    fieldKey: "gbp_ownership_access", section: "ownership_access",
    labelEn: "Listing ownership/access status", labelEs: "Propiedad/estado de acceso del listado",
    operatorGuidanceEn: "Never ask for the password — only who owns/manages the listing.", operatorGuidanceEs: "Nunca pida la contraseña — solo quién es dueño/administra el listado.",
    clientQuestionEn: "Who currently owns/manages the Google Business Profile listing?", clientQuestionEs: "¿Quién es dueño/administra actualmente el listado del Perfil de Negocio de Google?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(GBP_SUPPORT),
    sensitiveDataWarning: "Never collect the actual password/recovery code — ownership/access status only.",
  },
  {
    fieldKey: "gbp_review_response_ownership", section: "ownership_access",
    labelEn: "Who responds to reviews going forward", labelEs: "Quién responde a las reseñas en adelante",
    operatorGuidanceEn: "An ongoing operational responsibility, not a one-time setup task — record it explicitly so it isn't silently dropped after handoff.", operatorGuidanceEs: "Una responsabilidad operativa continua, no una tarea de configuración única.",
    clientQuestionEn: "Once this is set up, who will respond to new reviews — you, or Leonix?", clientQuestionEs: "Una vez configurado esto, ¿quién responderá a las nuevas reseñas — usted, o Leonix?",
    valueType: "choice", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    options: [
      { value: "client", labelEn: "The client", labelEs: "El cliente" },
      { value: "leonix", labelEn: "Leonix", labelEs: "Leonix" },
      { value: "shared", labelEn: "Shared/varies", labelEs: "Compartido/varía" },
    ],
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(GBP_SUPPORT),
  },
  {
    fieldKey: "digital_presence_final_access_handoff", section: "ownership_access",
    labelEn: "Final access/handoff requirement", labelEs: "Requisito final de acceso/entrega",
    operatorGuidanceEn: "What must be confirmed before this engagement can be marked handed off — mirrors Website's own ownership/handoff invariant (MD §13).", operatorGuidanceEs: "Qué debe confirmarse antes de que este trabajo pueda marcarse como entregado.",
    clientQuestionEn: "Once the work is done, who needs ongoing access, and is that confirmed?", clientQuestionEs: "Una vez terminado el trabajo, ¿quién necesita acceso continuo, y está confirmado?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },

  // ---------------------------------------------------------------------------------------------
  // REQUESTED CHANGES
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "social_cleanup_requests", section: "requested_changes",
    labelEn: "Specific cleanup requests", labelEs: "Solicitudes específicas de limpieza",
    operatorGuidanceEn: "The concrete work items — never a vague 'clean everything up.'", operatorGuidanceEs: "Los elementos de trabajo concretos — nunca un vago 'limpiar todo.'",
    clientQuestionEn: "What specifically would you like cleaned up or fixed?", clientQuestionEs: "¿Qué le gustaría específicamente que se limpiara o corrigiera?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(SOCIAL_SETUP_CLEANUP),
  },
  {
    fieldKey: "gbp_requested_changes", section: "requested_changes",
    labelEn: "Requested changes to the listing", labelEs: "Cambios solicitados al listado",
    operatorGuidanceEn: "The concrete work items for this GBP engagement.", operatorGuidanceEs: "Los elementos de trabajo concretos para este trabajo de GBP.",
    clientQuestionEn: "What specifically needs to change on the listing?", clientQuestionEs: "¿Qué específicamente necesita cambiar en el listado?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(GBP_SUPPORT),
  },

  // ---------------------------------------------------------------------------------------------
  // GBP LISTING DETAILS — Google Business Profile support only.
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "gbp_business_name", section: "gbp_listing_details",
    labelEn: "Business name for the listing", labelEs: "Nombre del negocio para el listado",
    operatorGuidanceEn: "Must match Google's real-business-name policy — never a keyword-stuffed variant.", operatorGuidanceEs: "Debe coincidir con la política de nombre de negocio real de Google — nunca una variante con palabras clave añadidas.",
    clientQuestionEn: "What is the exact business name that should appear on the listing?", clientQuestionEs: "¿Cuál es el nombre exacto del negocio que debe aparecer en el listado?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: true, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(GBP_SUPPORT),
  },
  {
    fieldKey: "gbp_primary_category", section: "gbp_listing_details",
    labelEn: "Primary/secondary category", labelEs: "Categoría principal/secundaria",
    operatorGuidanceEn: "Google's own category taxonomy — never invented.", operatorGuidanceEs: "La taxonomía de categorías propia de Google — nunca inventada.",
    clientQuestionEn: "What category best describes your business on Google?", clientQuestionEs: "¿Qué categoría describe mejor su negocio en Google?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(GBP_SUPPORT),
  },
  {
    fieldKey: "gbp_address_service_area", section: "gbp_listing_details",
    labelEn: "Address / service area", labelEs: "Dirección / área de servicio",
    operatorGuidanceEn: "A storefront address or a service-area radius — never both fabricated at once.", operatorGuidanceEs: "Una dirección de tienda o un radio de área de servicio — nunca ambos inventados a la vez.",
    clientQuestionEn: "Do customers visit a physical address, or do you serve a service area (or both)?", clientQuestionEs: "¿Los clientes visitan una dirección física, o atiende un área de servicio (o ambos)?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: true, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(GBP_SUPPORT),
  },
  {
    fieldKey: "gbp_phone_website", section: "gbp_listing_details",
    labelEn: "Phone / website for the listing", labelEs: "Teléfono / sitio web para el listado",
    operatorGuidanceEn: "Shared with canonical business identity where it already exists.", operatorGuidanceEs: "Compartido con la identidad de negocio canónica donde ya exista.",
    clientQuestionEn: "What phone number and website should appear on the listing?", clientQuestionEs: "¿Qué número de teléfono y sitio web deben aparecer en el listado?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: true, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(GBP_SUPPORT),
  },
  {
    fieldKey: "gbp_hours", section: "gbp_listing_details",
    labelEn: "Business hours", labelEs: "Horario de negocio",
    operatorGuidanceEn: "Real, current hours — a wrong listed hour is a common source of client complaints.", operatorGuidanceEs: "Horario real y actual — un horario listado incorrecto es una fuente común de quejas de clientes.",
    clientQuestionEn: "What are your real business hours?", clientQuestionEs: "¿Cuál es su horario real de negocio?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: true, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(GBP_SUPPORT),
  },
  {
    fieldKey: "gbp_description", section: "gbp_listing_details",
    labelEn: "Business description", labelEs: "Descripción del negocio",
    operatorGuidanceEn: "Real, client-approved copy for the 'From the business' field.", operatorGuidanceEs: "Texto real aprobado por el cliente para el campo 'Sobre el negocio.'",
    clientQuestionEn: "What description should appear on the listing?", clientQuestionEs: "¿Qué descripción debe aparecer en el listado?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(GBP_SUPPORT),
  },
  {
    fieldKey: "gbp_services_attributes", section: "gbp_listing_details",
    labelEn: "Services/attributes to list", labelEs: "Servicios/atributos a listar",
    operatorGuidanceEn: "The real services/attributes Google's listing UI supports for this category — never invented beyond what the client offers.", operatorGuidanceEs: "Los servicios/atributos reales que admite la interfaz de listado de Google para esta categoría.",
    clientQuestionEn: "What services or attributes (e.g. 'wheelchair accessible', 'free wifi') should be listed?", clientQuestionEs: "¿Qué servicios o atributos (p. ej. 'accesible en silla de ruedas', 'wifi gratis') deben listarse?",
    valueType: "list", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(GBP_SUPPORT),
  },

  // ---------------------------------------------------------------------------------------------
  // APPROVAL — shared across both subtypes.
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "decision_maker_approver", section: "approval",
    labelEn: "Approver", labelEs: "Persona que aprueba",
    operatorGuidanceEn: "Shared with every other family's approval section.", operatorGuidanceEs: "Compartido con la sección de aprobación de cada otra familia.",
    clientQuestionEn: "Who will give final approval on this work?", clientQuestionEs: "¿Quién dará la aprobación final de este trabajo?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];
