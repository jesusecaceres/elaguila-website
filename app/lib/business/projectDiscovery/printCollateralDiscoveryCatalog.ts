/**
 * Client Discovery & Project Blueprint Engine, Gate 6 — Print / Promotional Collateral discovery
 * catalog (MD <print_collateral>, <promotional_creative>). Covers Business Cards, Flyer,
 * Banner/Signage, and Referral Materials as ONE shared engine with small conditional branches
 * keyed on the concrete ProjectType — never five separate catalogs (MD: "Do not make five separate
 * engines if one print-collateral engine with project-type branches is sufficient").
 *
 * Never invents printer pricing, quantities, paper stock, or bleed specs — those either come from a
 * real client/vendor answer or are explicitly flagged needs_official_research (REQUIRED BEFORE
 * PRODUCTION) rather than guessed.
 */
import type { ProjectType } from "./types";
import type { SpecializedRequirementDefinition, SpecializedRequirementPredicateContext } from "./specializedDiscoveryEngine";

export const PRINT_COLLATERAL_CATALOG_VERSION = "print_collateral_discovery_v1";

export type PrintCollateralSection =
  | "brand_dependency"
  | "contact_content"
  | "layout_content"
  | "specification"
  | "production"
  | "assets"
  | "approval";

export const PRINT_COLLATERAL_SECTIONS: readonly PrintCollateralSection[] = [
  "brand_dependency", "contact_content", "layout_content", "specification", "production", "assets", "approval",
];

type PrintReq = SpecializedRequirementDefinition<PrintCollateralSection>;

const BUSINESS_CARDS: ProjectType = "business_cards";
const FLYER: ProjectType = "flyer";
const BANNER_SIGNAGE: ProjectType = "banner_signage";
const REFERRAL_MATERIALS: ProjectType = "referral_materials";

function isProjectType(...types: readonly ProjectType[]) {
  return (ctx: SpecializedRequirementPredicateContext) => types.includes(ctx.projectType);
}

export const PRINT_COLLATERAL_REQUIREMENTS: readonly PrintReq[] = [
  // ---------------------------------------------------------------------------------------------
  // BRAND DEPENDENCY — every print family needs an approved logo/brand direction to design against.
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "existing_logo", section: "brand_dependency",
    labelEn: "Existing/approved logo available", labelEs: "Logo existente/aprobado disponible",
    operatorGuidanceEn: "Shared with Website/Logo — print collateral should reference the same approved brand direction, never a second guess at the logo.",
    operatorGuidanceEs: "Compartido con Sitio Web/Logo — los materiales impresos deben referenciar la misma dirección de marca aprobada, nunca una segunda suposición del logo.",
    clientQuestionEn: "Do you have an existing or approved logo to use on this piece?", clientQuestionEs: "¿Tiene un logo existente o aprobado para usar en esta pieza?",
    valueType: "boolean", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "colors_liked", section: "brand_dependency",
    labelEn: "Brand colors", labelEs: "Colores de marca",
    operatorGuidanceEn: "Shared with Website/Logo brand_identity sections.", operatorGuidanceEs: "Compartido con las secciones de identidad de marca de Sitio Web/Logo.",
    clientQuestionEn: "What are your brand colors?", clientQuestionEs: "¿Cuáles son sus colores de marca?",
    valueType: "list", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },

  // ---------------------------------------------------------------------------------------------
  // CONTACT / CONTENT — Business Cards branch
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "card_person_lines", section: "contact_content",
    labelEn: "Name / role / contact lines per card", labelEs: "Líneas de nombre / puesto / contacto por tarjeta",
    operatorGuidanceEn: "Business cards only — capture exactly who and what appears on each card, never assume one generic card fits everyone.",
    operatorGuidanceEs: "Solo tarjetas de presentación — capture exactamente quién y qué aparece en cada tarjeta, nunca asuma que una tarjeta genérica sirve para todos.",
    clientQuestionEn: "Who needs cards, and what name/title/contact info goes on each?", clientQuestionEs: "¿Quién necesita tarjetas, y qué nombre/puesto/información de contacto va en cada una?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(BUSINESS_CARDS),
  },
  {
    fieldKey: "card_quantity", section: "contact_content",
    labelEn: "Quantity per person/card (production planning only)", labelEs: "Cantidad por persona/tarjeta (solo para planificación de producción)",
    operatorGuidanceEn: "Only relevant when quantity actually affects production planning — never a pricing question.",
    operatorGuidanceEs: "Solo relevante cuando la cantidad realmente afecta la planificación de producción — nunca una pregunta de precio.",
    clientQuestionEn: "Roughly how many cards do you need printed?", clientQuestionEs: "¿Aproximadamente cuántas tarjetas necesita impresas?",
    valueType: "number", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(BUSINESS_CARDS),
  },

  // ---------------------------------------------------------------------------------------------
  // LAYOUT / CONTENT — shared across the whole print family, with conditional branches.
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "print_phone_email_web_social", section: "contact_content",
    labelEn: "Phone / email / website / social / QR to feature", labelEs: "Teléfono / correo / sitio web / redes sociales / QR a incluir",
    operatorGuidanceEn: "Confirm exactly which contact channels should appear — never assume every channel belongs on every piece.",
    operatorGuidanceEs: "Confirme exactamente qué canales de contacto deben aparecer — nunca asuma que todos los canales van en cada pieza.",
    clientQuestionEn: "Which contact info (phone, email, website, social, QR) should appear on this piece?", clientQuestionEs: "¿Qué información de contacto (teléfono, correo, sitio web, redes sociales, QR) debe aparecer en esta pieza?",
    valueType: "list", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "print_address", section: "contact_content",
    labelEn: "Physical address (if featured)", labelEs: "Dirección física (si se incluye)",
    operatorGuidanceEn: "Only ask when a physical location is actually relevant to this piece.", operatorGuidanceEs: "Solo pregunte cuando una ubicación física sea realmente relevante para esta pieza.",
    clientQuestionEn: "Should a physical address appear, and if so, which one?", clientQuestionEs: "¿Debe aparecer una dirección física, y de ser así, cuál?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "print_language", section: "contact_content",
    labelEn: "Language(s)", labelEs: "Idioma(s)",
    operatorGuidanceEn: "Confirm primary/secondary language before content is drafted.", operatorGuidanceEs: "Confirme el idioma principal/secundario antes de redactar el contenido.",
    clientQuestionEn: "What language(s) should this piece be in?", clientQuestionEs: "¿En qué idioma(s) debe estar esta pieza?",
    valueType: "choice", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    options: [
      { value: "es", labelEn: "Spanish", labelEs: "Español" },
      { value: "en", labelEn: "English", labelEs: "Inglés" },
      { value: "bilingual", labelEn: "Bilingual", labelEs: "Bilingüe" },
    ],
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "print_front_back_sides", section: "layout_content",
    labelEn: "Front/back or single-sided", labelEs: "Frente/reverso o un solo lado",
    operatorGuidanceEn: "Business cards and flyers both need this — a banner is effectively always single-sided (front-facing), so skip it there.",
    operatorGuidanceEs: "Tarjetas de presentación y volantes necesitan esto — un banner es efectivamente siempre de un solo lado (de frente), así que se omite ahí.",
    clientQuestionEn: "Should this be single-sided, or front and back?", clientQuestionEs: "¿Debe ser de un solo lado, o frente y reverso?",
    valueType: "choice", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    options: [
      { value: "single_sided", labelEn: "Single-sided", labelEs: "Un solo lado" },
      { value: "front_and_back", labelEn: "Front and back", labelEs: "Frente y reverso" },
    ],
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(BUSINESS_CARDS, FLYER, REFERRAL_MATERIALS),
  },
  {
    fieldKey: "print_desired_style", section: "layout_content",
    labelEn: "Desired style", labelEs: "Estilo deseado",
    operatorGuidanceEn: "Capture in the client's own words — never assume a generic style.", operatorGuidanceEs: "Capture en las propias palabras del cliente — nunca asuma un estilo genérico.",
    clientQuestionEn: "What style or feel do you want for this piece?", clientQuestionEs: "¿Qué estilo o sensación quiere para esta pieza?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "print_content_hierarchy", section: "layout_content",
    labelEn: "Content hierarchy — what matters most", labelEs: "Jerarquía de contenido — qué importa más",
    operatorGuidanceEn: "What should draw the eye first — never guess without asking.", operatorGuidanceEs: "Qué debe atraer la vista primero — nunca adivine sin preguntar.",
    clientQuestionEn: "What's the single most important thing someone should notice first?", clientQuestionEs: "¿Cuál es lo más importante que alguien debe notar primero?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(FLYER, BANNER_SIGNAGE, REFERRAL_MATERIALS),
  },
  {
    fieldKey: "print_cta", section: "layout_content",
    labelEn: "Call to action", labelEs: "Llamado a la acción",
    operatorGuidanceEn: "What should the viewer do after seeing this piece.", operatorGuidanceEs: "Qué debe hacer el espectador después de ver esta pieza.",
    clientQuestionEn: "What do you want someone to do after seeing this?", clientQuestionEs: "¿Qué quiere que haga alguien después de ver esto?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(FLYER, BANNER_SIGNAGE, REFERRAL_MATERIALS),
  },
  {
    fieldKey: "print_qr_destination", section: "layout_content",
    labelEn: "QR code destination", labelEs: "Destino del código QR",
    operatorGuidanceEn: "Only relevant when a QR code was requested — must be a real, live destination, never a placeholder link.",
    operatorGuidanceEs: "Solo relevante cuando se solicitó un código QR — debe ser un destino real y activo, nunca un enlace de relleno.",
    clientQuestionEn: "Where should the QR code lead?", clientQuestionEs: "¿A dónde debe llevar el código QR?",
    valueType: "url", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    dependencyCondition: (ctx) => {
      const v = ctx.getCapturedValue("print_phone_email_web_social");
      return Array.isArray(v) && v.includes("qr");
    },
  },

  // ---------------------------------------------------------------------------------------------
  // SPECIFICATION — Flyer/Banner/Signage need dimensions; a distance-viewed piece needs distance.
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "print_physical_or_digital", section: "specification",
    labelEn: "Physical print, digital-only, or both", labelEs: "Impreso físico, solo digital, o ambos",
    operatorGuidanceEn: "Flyers in particular vary widely — a purely digital flyer has no print/bleed/paper concerns at all.",
    operatorGuidanceEs: "Los volantes en particular varían mucho — un volante puramente digital no tiene ninguna preocupación de impresión/sangrado/papel.",
    clientQuestionEn: "Will this be printed physically, shared digitally only, or both?", clientQuestionEs: "¿Esto se imprimirá físicamente, se compartirá solo digitalmente, o ambos?",
    valueType: "choice", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    options: [
      { value: "physical", labelEn: "Physical print", labelEs: "Impreso físico" },
      { value: "digital", labelEn: "Digital only", labelEs: "Solo digital" },
      { value: "both", labelEn: "Both", labelEs: "Ambos" },
    ],
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(FLYER),
  },
  {
    fieldKey: "print_dimensions_known", section: "specification",
    labelEn: "Known size/specification", labelEs: "Tamaño/especificación conocida",
    operatorGuidanceEn: "If the client (or a venue/vendor) already knows a required size, capture it exactly — Leonix decides the final spec only when nothing is already constrained.",
    operatorGuidanceEs: "Si el cliente (o un lugar/proveedor) ya conoce un tamaño requerido, capture exactamente — Leonix decide la especificación final solo cuando nada ya está limitado.",
    clientQuestionEn: "Is there a required size or specification already (e.g. from a venue or vendor)?", clientQuestionEs: "¿Ya hay un tamaño o especificación requerida (ej. de un lugar o proveedor)?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(BANNER_SIGNAGE),
  },
  {
    fieldKey: "print_viewing_distance_location", section: "specification",
    labelEn: "Viewing distance and installation location", labelEs: "Distancia de visualización y ubicación de instalación",
    operatorGuidanceEn: "Banner/signage only — legibility and layout depend heavily on how far away it will be read from and where it goes.",
    operatorGuidanceEs: "Solo banner/señalización — la legibilidad y el diseño dependen mucho de a qué distancia se leerá y dónde se instalará.",
    clientQuestionEn: "From how far away will this typically be viewed, and where will it be installed?", clientQuestionEs: "¿Desde qué distancia se verá típicamente esto, y dónde se instalará?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(BANNER_SIGNAGE),
  },
  {
    fieldKey: "print_orientation", section: "specification",
    labelEn: "Orientation", labelEs: "Orientación",
    operatorGuidanceEn: "Confirm portrait/landscape when it isn't obvious from the specification.", operatorGuidanceEs: "Confirme vertical/horizontal cuando no sea obvio de la especificación.",
    clientQuestionEn: "Should this be portrait or landscape?", clientQuestionEs: "¿Debe ser vertical u horizontal?",
    valueType: "choice", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    options: [
      { value: "portrait", labelEn: "Portrait", labelEs: "Vertical" },
      { value: "landscape", labelEn: "Landscape", labelEs: "Horizontal" },
    ],
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(FLYER, BANNER_SIGNAGE),
  },
  {
    fieldKey: "print_distribution_use_context", section: "specification",
    labelEn: "Distribution / use context", labelEs: "Contexto de distribución / uso",
    operatorGuidanceEn: "How and where this piece will actually be distributed/used — shapes both design and quantity.",
    operatorGuidanceEs: "Cómo y dónde se distribuirá/usará realmente esta pieza — determina tanto el diseño como la cantidad.",
    clientQuestionEn: "How and where will this be distributed or used?", clientQuestionEs: "¿Cómo y dónde se distribuirá o usará esto?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(FLYER, REFERRAL_MATERIALS),
  },
  {
    fieldKey: "promotional_product_imprint_vendor_spec", section: "specification",
    labelEn: "Imprint area / vendor template (if a physical promotional product)", labelEs: "Área de impresión / plantilla de proveedor (si es un producto promocional físico)",
    operatorGuidanceEn: "A real vendor imprint-area spec is required before production — never guess at a vendor's template. Flag as needs_official_research when unknown.",
    operatorGuidanceEs: "Se requiere una especificación real del área de impresión del proveedor antes de producir — nunca adivine la plantilla de un proveedor. Márquelo como needs_official_research cuando se desconozca.",
    clientQuestionEn: "Do we already have the vendor's imprint-area template/specification for this item?", clientQuestionEs: "¿Ya tenemos la plantilla/especificación del área de impresión del proveedor para este artículo?",
    valueType: "text", defaultCompletenessClass: "needs_official_research", whoShouldAnswer: "OFFICIAL_RESEARCH",
    priority: 4, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: isProjectType(REFERRAL_MATERIALS),
  },

  // ---------------------------------------------------------------------------------------------
  // PRODUCTION — Leonix production decisions, never guessed pricing/stock.
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "print_bleed_safe_area_decision", section: "production",
    labelEn: "Bleed / safe-area handling", labelEs: "Manejo de sangrado / área segura",
    operatorGuidanceEn: "A Leonix production decision, never a client-facing question — recorded for the blueprint's own traceability only.",
    operatorGuidanceEs: "Una decisión de producción de Leonix, nunca una pregunta al cliente — se registra solo para la trazabilidad del propio plan del proyecto.",
    clientQuestionEn: "", clientQuestionEs: "",
    valueType: "text", defaultCompletenessClass: "not_applicable", whoShouldAnswer: "LEONIX",
    priority: 5, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "print_paper_finish_preference", section: "production",
    labelEn: "Paper/finish preference (only if actually being coordinated)", labelEs: "Preferencia de papel/acabado (solo si realmente se está coordinando)",
    operatorGuidanceEn: "Only ask when Leonix or the client is actually coordinating a specific printer — never invent a stock/finish otherwise.",
    operatorGuidanceEs: "Solo pregunte cuando Leonix o el cliente realmente estén coordinando una imprenta específica — nunca invente un papel/acabado de lo contrario.",
    clientQuestionEn: "Do you have a paper stock or finish preference for this print run?", clientQuestionEs: "¿Tiene una preferencia de tipo de papel o acabado para esta impresión?",
    valueType: "text", defaultCompletenessClass: "optional", whoShouldAnswer: "CLIENT",
    priority: 5, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "print_vendor_known", section: "production",
    labelEn: "Printer/vendor (if already known)", labelEs: "Imprenta/proveedor (si ya se conoce)",
    operatorGuidanceEn: "Only relevant if a specific printer/vendor is already confirmed — never assumed.", operatorGuidanceEs: "Solo relevante si ya se confirmó una imprenta/proveedor específico — nunca se asume.",
    clientQuestionEn: "Do you already have a printer or vendor for this?", clientQuestionEs: "¿Ya tiene una imprenta o proveedor para esto?",
    valueType: "text", defaultCompletenessClass: "optional", whoShouldAnswer: "CLIENT",
    priority: 5, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },

  // ---------------------------------------------------------------------------------------------
  // ASSETS
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "print_client_supplied_assets", section: "assets",
    labelEn: "Client-supplied assets (photos, logos, copy)", labelEs: "Activos proporcionados por el cliente (fotos, logos, texto)",
    operatorGuidanceEn: "Canonical reference uploads, reused from the shared business_source_files store.", operatorGuidanceEs: "Cargas de referencia canónicas, reutilizadas del almacén compartido business_source_files.",
    clientQuestionEn: "Can you upload any photos, logo files, or written copy you already have for this?", clientQuestionEs: "¿Puede subir fotos, archivos de logo, o texto escrito que ya tenga para esto?",
    valueType: "asset_ref", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },

  // ---------------------------------------------------------------------------------------------
  // APPROVAL
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "decision_maker_approver", section: "approval",
    labelEn: "Approver", labelEs: "Persona que aprueba",
    operatorGuidanceEn: "Shared with Website/Logo business_identity/approval sections.", operatorGuidanceEs: "Compartido con las secciones de identidad de negocio/aprobación de Sitio Web/Logo.",
    clientQuestionEn: "Who will give final approval on this piece?", clientQuestionEs: "¿Quién dará la aprobación final de esta pieza?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "print_deadline_event_trigger", section: "approval",
    labelEn: "Deadline / event or distribution trigger", labelEs: "Fecha límite / evento o factor de distribución",
    operatorGuidanceEn: "Confirm whether a real event/deadline is driving this, and what it is.", operatorGuidanceEs: "Confirme si un evento/fecha límite real está impulsando esto, y cuál es.",
    clientQuestionEn: "Is there a specific event or deadline driving this piece?", clientQuestionEs: "¿Hay un evento o fecha límite específico que impulse esta pieza?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];
