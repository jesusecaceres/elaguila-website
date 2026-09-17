/**
 * Client Discovery & Project Blueprint Engine, Gate 6 — Logo / Brand Identity discovery catalog
 * (MD <logo_brand_discovery>). Pure application-code configuration, mirrors websiteDiscoveryCatalog
 * .ts's own structure but built on the generic specializedDiscoveryEngine.ts types.
 *
 * Reuses Website's EXACT field keys for every shared-truth concept (public_business_name,
 * decision_maker_approver, existing_logo, colors_liked, colors_disliked, symbols_wanted,
 * symbols_avoided, primary_customer, hard_launch_deadline) — a discovery-level (project-intent-
 * scoped-to-null) capture of one of these fields is therefore automatically visible to a Website
 * intent in the SAME discovery too, and vice versa (MD <shared_truth>: "Do not copy shared values
 * into multiple active discovery-item rows merely for convenience" — Gate 1's own
 * intent-scoped-then-shared-fallback lookup already makes copying unnecessary).
 *
 * No trademark/legal advice is ever generated here — a real ownership/trademark question is always
 * classified needs_official_research, never answered by this catalog or by Leonix staff.
 */
import type { SpecializedRequirementDefinition } from "./specializedDiscoveryEngine";

export const LOGO_BRAND_CATALOG_VERSION = "logo_brand_discovery_v1";

export type LogoBrandSection =
  | "brand_name"
  | "project_type"
  | "purpose"
  | "audience"
  | "brand_personality"
  | "visual_direction"
  | "existing_identity"
  | "deliverables"
  | "assets"
  | "approval";

export const LOGO_BRAND_SECTIONS: readonly LogoBrandSection[] = [
  "brand_name", "project_type", "purpose", "audience", "brand_personality",
  "visual_direction", "existing_identity", "deliverables", "assets", "approval",
];

type LogoReq = SpecializedRequirementDefinition<LogoBrandSection>;

export const LOGO_BRAND_REQUIREMENTS: readonly LogoReq[] = [
  // ---------------------------------------------------------------------------------------------
  // BRAND NAME — a build blocker: Leonix cannot design a logo for an unconfirmed name.
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "public_business_name", section: "brand_name",
    labelEn: "Exact brand/business name for the logo", labelEs: "Nombre exacto de la marca/negocio para el logo",
    operatorGuidanceEn: "Confirm the exact text and capitalization to design around — never assume the legal name is the display name.",
    operatorGuidanceEs: "Confirme el texto exacto y la capitalización para diseñar — nunca asuma que el nombre legal es el nombre público.",
    clientQuestionEn: "What exact name and capitalization should the logo use?", clientQuestionEs: "¿Qué nombre exacto y capitalización debe usar el logo?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: true,
    canonicalTruthHint: "businesses.public_name / display_name", recommendReconfirmation: true,
  },
  {
    fieldKey: "logo_tagline", section: "brand_name",
    labelEn: "Tagline (if any)", labelEs: "Lema / tagline (si aplica)",
    operatorGuidanceEn: "Confirm whether a tagline is wanted in the lockup, and its exact wording — never invent one.",
    operatorGuidanceEs: "Confirme si se desea un lema en el logo, y su redacción exacta — nunca invente uno.",
    clientQuestionEn: "Do you want a tagline included with the logo, and if so, what exact wording?", clientQuestionEs: "¿Quiere un lema incluido con el logo, y de ser así, qué redacción exacta?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },

  // ---------------------------------------------------------------------------------------------
  // PROJECT TYPE
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "logo_project_kind", section: "project_type",
    labelEn: "New identity, refresh, or cleanup", labelEs: "Identidad nueva, actualización, o limpieza",
    operatorGuidanceEn: "Determines whether existing brand equity must be preserved — never treat a refresh as a blank-slate new design.",
    operatorGuidanceEs: "Determina si se debe preservar el valor de marca existente — nunca trate una actualización como un diseño desde cero.",
    clientQuestionEn: "Is this a brand-new logo, a refresh of your current one, or a cleanup/vectorization of an existing file?", clientQuestionEs: "¿Es un logo completamente nuevo, una actualización del actual, o una limpieza/vectorización de un archivo existente?",
    valueType: "choice", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    options: [
      { value: "new_identity", labelEn: "New identity", labelEs: "Identidad nueva" },
      { value: "refresh", labelEn: "Refresh of existing identity", labelEs: "Actualización de identidad existente" },
      { value: "cleanup_vectorization", labelEn: "Cleanup / vectorization only", labelEs: "Solo limpieza / vectorización" },
    ],
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "logo_family_variation_needed", section: "project_type",
    labelEn: "Logo family / variation set needed", labelEs: "Familia de logo / conjunto de variaciones necesario",
    operatorGuidanceEn: "Confirm whether multiple related marks (e.g. a sub-brand or department mark) are needed alongside the primary logo.",
    operatorGuidanceEs: "Confirme si se necesitan múltiples marcas relacionadas (ej. una submarca o marca de departamento) junto con el logo principal.",
    clientQuestionEn: "Do you need a family of related logos (e.g. for a sub-brand or department), or just one primary logo?", clientQuestionEs: "¿Necesita una familia de logos relacionados (ej. para una submarca o departamento), o solo un logo principal?",
    valueType: "boolean", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 4, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },

  // ---------------------------------------------------------------------------------------------
  // PURPOSE
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "logo_primary_use", section: "purpose",
    labelEn: "Primary intended use", labelEs: "Uso principal previsto",
    operatorGuidanceEn: "Where the logo will actually be used most (signage, website, print, vehicle) shapes the deliverable set and format priorities.",
    operatorGuidanceEs: "Dónde se usará realmente más el logo (rótulo, sitio web, impresos, vehículo) determina el conjunto de entregables y las prioridades de formato.",
    clientQuestionEn: "Where will this logo be used most (signage, website, print, vehicle, social media)?", clientQuestionEs: "¿Dónde se usará más este logo (rótulo, sitio web, impresos, vehículo, redes sociales)?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "logo_reason_for_project", section: "purpose",
    labelEn: "Why logo work is needed now", labelEs: "Por qué se necesita trabajo de logo ahora",
    operatorGuidanceEn: "Capture the real driving reason — never assume it's generic 'looks outdated.'",
    operatorGuidanceEs: "Capture la razón real — nunca asuma que es genérico 'se ve anticuado.'",
    clientQuestionEn: "What's driving the need for this logo work right now?", clientQuestionEs: "¿Qué está impulsando la necesidad de este trabajo de logo ahora?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },

  // ---------------------------------------------------------------------------------------------
  // AUDIENCE
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "primary_customer", section: "audience",
    labelEn: "Target customer / community", labelEs: "Cliente / comunidad objetivo",
    operatorGuidanceEn: "The brand personality direction only makes sense relative to a real audience.",
    operatorGuidanceEs: "La dirección de personalidad de marca solo tiene sentido en relación con una audiencia real.",
    clientQuestionEn: "Who is this logo mainly speaking to?", clientQuestionEs: "¿A quién le habla principalmente este logo?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: true, recommendReconfirmation: false,
  },

  // ---------------------------------------------------------------------------------------------
  // BRAND PERSONALITY — free text only; Leonix never fabricates a faith/cultural claim the client
  // did not explicitly request (MD <logo_brand_discovery>: "only if client explicitly wants it").
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "brand_personality_traits", section: "brand_personality",
    labelEn: "Desired brand personality", labelEs: "Personalidad de marca deseada",
    operatorGuidanceEn: "Capture in the client's own words (e.g. modern, established, premium, approachable, energetic, community-focused). Only record faith-related or culturally-specific direction if the CLIENT explicitly asked for it — never assume or suggest one.",
    operatorGuidanceEs: "Capture en las propias palabras del cliente (ej. moderno, establecido, premium, accesible, enérgico, enfocado en la comunidad). Solo registre una dirección religiosa o culturalmente específica si el CLIENTE lo pidió explícitamente — nunca la asuma ni la sugiera.",
    clientQuestionEn: "How would you describe the personality you want this brand to have?", clientQuestionEs: "¿Cómo describiría la personalidad que quiere que tenga esta marca?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    // A meaningful direction is only truly required if the client did NOT explicitly hand Leonix
    // creative discretion — see logo_creative_discretion below.
    dependencyCondition: (ctx) => ctx.getCapturedValue("logo_creative_discretion") !== true,
  },
  {
    fieldKey: "logo_creative_discretion", section: "brand_personality",
    labelEn: "Client grants Leonix creative discretion", labelEs: "El cliente otorga discreción creativa a Leonix",
    operatorGuidanceEn: "If the client has no strong opinion, record that explicitly rather than leaving the personality field silently blank.",
    operatorGuidanceEs: "Si el cliente no tiene una opinión firme, regístrelo explícitamente en lugar de dejar el campo de personalidad en blanco silenciosamente.",
    clientQuestionEn: "Or would you prefer to leave the creative direction entirely up to Leonix?", clientQuestionEs: "¿O prefiere dejar la dirección creativa completamente en manos de Leonix?",
    valueType: "boolean", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },

  // ---------------------------------------------------------------------------------------------
  // VISUAL DIRECTION
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "colors_liked", section: "visual_direction",
    labelEn: "Colors liked", labelEs: "Colores que le gustan",
    operatorGuidanceEn: "Shared with Website's own brand_identity section — a color preference captured once applies to every project in this discovery.",
    operatorGuidanceEs: "Compartido con la sección de identidad de marca del Sitio Web — una preferencia de color capturada una vez aplica a todos los proyectos de este descubrimiento.",
    clientQuestionEn: "What colors do you like for this brand?", clientQuestionEs: "¿Qué colores le gustan para esta marca?",
    valueType: "list", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "colors_disliked", section: "visual_direction",
    labelEn: "Colors to avoid", labelEs: "Colores a evitar",
    operatorGuidanceEn: "Shared with Website's own brand_identity section.", operatorGuidanceEs: "Compartido con la sección de identidad de marca del Sitio Web.",
    clientQuestionEn: "Are there any colors you specifically want to avoid?", clientQuestionEs: "¿Hay colores que específicamente quiere evitar?",
    valueType: "list", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "symbols_wanted", section: "visual_direction",
    labelEn: "Symbols/imagery wanted", labelEs: "Símbolos/imágenes deseados",
    operatorGuidanceEn: "A real build blocker only when the client has specific content that MUST appear — otherwise helpful context.",
    operatorGuidanceEs: "Un bloqueador de construcción real solo cuando el cliente tiene contenido específico que DEBE aparecer — de lo contrario, contexto útil.",
    clientQuestionEn: "Is there a specific symbol, icon, or imagery that must be included?", clientQuestionEs: "¿Hay un símbolo, ícono, o imagen específica que deba incluirse?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "symbols_avoided", section: "visual_direction",
    labelEn: "Symbols/content to avoid", labelEs: "Símbolos/contenido a evitar",
    operatorGuidanceEn: "When the client has real restrictions (religious, cultural, competitor-adjacent), this becomes a build blocker — never guess at a restriction the client did not state.",
    operatorGuidanceEs: "Cuando el cliente tiene restricciones reales (religiosas, culturales, cercanas a la competencia), esto se convierte en un bloqueador de construcción — nunca adivine una restricción que el cliente no mencionó.",
    clientQuestionEn: "Is there anything (symbols, colors, imagery) that must NOT appear in the logo?", clientQuestionEs: "¿Hay algo (símbolos, colores, imágenes) que NO debe aparecer en el logo?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "logo_style_literal_or_abstract", section: "visual_direction",
    labelEn: "Literal vs. abstract, icon/wordmark/emblem preference", labelEs: "Preferencia literal vs. abstracto, ícono/wordmark/emblema",
    operatorGuidanceEn: "Leonix determines the final production format — this only captures a client STYLE preference, never a technical requirement.",
    operatorGuidanceEs: "Leonix determina el formato de producción final — esto solo captura una preferencia de ESTILO del cliente, nunca un requisito técnico.",
    clientQuestionEn: "Do you lean toward a literal image, an abstract mark, a text-based wordmark, or an emblem style?", clientQuestionEs: "¿Prefiere una imagen literal, una marca abstracta, un wordmark basado en texto, o un estilo de emblema?",
    valueType: "choice", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    options: [
      { value: "literal", labelEn: "Literal image", labelEs: "Imagen literal" },
      { value: "abstract", labelEn: "Abstract mark", labelEs: "Marca abstracta" },
      { value: "wordmark", labelEn: "Text-based wordmark", labelEs: "Wordmark basado en texto" },
      { value: "emblem", labelEn: "Emblem", labelEs: "Emblema" },
      { value: "no_preference", labelEn: "No preference", labelEs: "Sin preferencia" },
    ],
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "logo_reference_examples", section: "visual_direction",
    labelEn: "Reference brands/designs — likes and dislikes", labelEs: "Marcas/diseños de referencia — le gusta y no le gusta",
    operatorGuidanceEn: "Real reference examples are far more useful than adjectives alone.",
    operatorGuidanceEs: "Ejemplos de referencia reales son mucho más útiles que solo adjetivos.",
    clientQuestionEn: "Can you share logos/brands you like (and why), and any you dislike (and why)?", clientQuestionEs: "¿Puede compartir logos/marcas que le gusten (y por qué), y alguno que no le guste (y por qué)?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 4, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },

  // ---------------------------------------------------------------------------------------------
  // EXISTING IDENTITY
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "existing_logo", section: "existing_identity",
    labelEn: "Existing logo availability", labelEs: "Disponibilidad de logo existente",
    operatorGuidanceEn: "Shared with Website's own brand_identity section.", operatorGuidanceEs: "Compartido con la sección de identidad de marca del Sitio Web.",
    clientQuestionEn: "Do you currently have a logo, and can you share the source file?", clientQuestionEs: "¿Tiene actualmente un logo, y puede compartir el archivo original?",
    valueType: "boolean", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "logo_trademark_ownership_question", section: "existing_identity",
    labelEn: "Trademark / ownership status", labelEs: "Estado de marca registrada / propiedad",
    operatorGuidanceEn: "Leonix never gives trademark/legal clearance advice. If the client raises an ownership/trademark question, flag it NEEDS_OFFICIAL_RESEARCH / refer to outside counsel — never answer it internally.",
    operatorGuidanceEs: "Leonix nunca da asesoría de autorización de marca registrada/legal. Si el cliente plantea una pregunta de propiedad/marca registrada, márquela como NEEDS_OFFICIAL_RESEARCH / refiera a un abogado externo — nunca la responda internamente.",
    clientQuestionEn: "Are there any known trademark or ownership questions about this name/mark we should be aware of?", clientQuestionEs: "¿Hay alguna pregunta conocida de marca registrada o propiedad sobre este nombre/marca que debamos saber?",
    valueType: "text", defaultCompletenessClass: "needs_official_research", whoShouldAnswer: "OFFICIAL_RESEARCH",
    priority: 5, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    sensitiveDataWarning: "Trademark/legal clearance is never provided by Leonix — refer to outside counsel.",
  },
  {
    fieldKey: "logo_elements_to_preserve", section: "existing_identity",
    labelEn: "What must be preserved from the current identity", labelEs: "Qué debe preservarse de la identidad actual",
    operatorGuidanceEn: "Only relevant for a refresh/cleanup, never for a brand-new identity.", operatorGuidanceEs: "Solo relevante para una actualización/limpieza, nunca para una identidad completamente nueva.",
    clientQuestionEn: "What parts of your current logo, if any, must be preserved?", clientQuestionEs: "¿Qué partes de su logo actual, si acaso, deben preservarse?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    applicabilityCondition: (ctx) => ctx.getCapturedValue("logo_project_kind") !== "new_identity",
  },

  // ---------------------------------------------------------------------------------------------
  // DELIVERABLES
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "logo_deliverables_wanted", section: "deliverables",
    labelEn: "Deliverables wanted", labelEs: "Entregables deseados",
    operatorGuidanceEn: "Leonix determines the final production file formats — this only captures which OUTPUTS the client actually needs (e.g. primary/secondary logo, icon, horizontal/stacked, monochrome, transparent exports, social avatar, favicon).",
    operatorGuidanceEs: "Leonix determina los formatos de archivo de producción final — esto solo captura qué SALIDAS necesita realmente el cliente (ej. logo principal/secundario, ícono, horizontal/apilado, monocromático, exportaciones transparentes, avatar social, favicon).",
    clientQuestionEn: "Which logo deliverables do you need (primary logo, icon/mark, horizontal, stacked, monochrome, social avatar, favicon, etc.)?", clientQuestionEs: "¿Qué entregables de logo necesita (logo principal, ícono/marca, horizontal, apilado, monocromático, avatar social, favicon, etc.)?",
    valueType: "list", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "logo_brand_color_values_needed", section: "deliverables",
    labelEn: "Brand color values + basic usage guide wanted", labelEs: "Valores de color de marca + guía básica de uso deseados",
    operatorGuidanceEn: "Confirm whether the client wants formal hex/RGB color values and a simple usage guide as part of the handoff.",
    operatorGuidanceEs: "Confirme si el cliente desea valores de color formales (hex/RGB) y una guía de uso simple como parte de la entrega.",
    clientQuestionEn: "Do you want formal brand color values and a basic usage guide included?", clientQuestionEs: "¿Quiere valores de color de marca formales y una guía de uso básica incluidos?",
    valueType: "boolean", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 4, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },

  // ---------------------------------------------------------------------------------------------
  // ASSETS
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "logo_source_files_available", section: "assets",
    labelEn: "Existing vector/source file availability", labelEs: "Disponibilidad de archivo vectorial/original existente",
    operatorGuidanceEn: "Only relevant when a current logo exists — never asked for a brand-new identity.", operatorGuidanceEs: "Solo relevante cuando existe un logo actual — nunca se pregunta para una identidad completamente nueva.",
    clientQuestionEn: "Do you have the original vector/source file for your current logo (AI, EPS, SVG)?", clientQuestionEs: "¿Tiene el archivo vectorial/original de su logo actual (AI, EPS, SVG)?",
    valueType: "asset_ref", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
    dependencyCondition: (ctx) => ctx.hasCapturedValue("existing_logo", true),
  },
  {
    fieldKey: "logo_reference_files", section: "assets",
    labelEn: "Reference files (inspiration images, etc.)", labelEs: "Archivos de referencia (imágenes de inspiración, etc.)",
    operatorGuidanceEn: "Canonical reference uploads, reused from the shared business_source_files store — never a second asset system.",
    operatorGuidanceEs: "Cargas de referencia canónicas, reutilizadas del almacén compartido business_source_files — nunca un segundo sistema de activos.",
    clientQuestionEn: "Can you upload any reference/inspiration files?", clientQuestionEs: "¿Puede subir archivos de referencia/inspiración?",
    valueType: "asset_ref", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 4, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },

  // ---------------------------------------------------------------------------------------------
  // APPROVAL
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "decision_maker_approver", section: "approval",
    labelEn: "Approver", labelEs: "Persona que aprueba",
    operatorGuidanceEn: "Shared with Website's own business_identity section.", operatorGuidanceEs: "Compartido con la sección de identidad de negocio del Sitio Web.",
    clientQuestionEn: "Who will give final approval on the logo design?", clientQuestionEs: "¿Quién dará la aprobación final del diseño del logo?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "hard_launch_deadline", section: "approval",
    labelEn: "Hard deadline (and why)", labelEs: "Fecha límite firme (y por qué)",
    operatorGuidanceEn: "Shared with Website's own schedule_approvals section — confirm it's real, not assumed urgency.",
    operatorGuidanceEs: "Compartido con la sección de cronograma del Sitio Web — confirme que es real, no urgencia asumida.",
    clientQuestionEn: "Is there a hard deadline for this logo, and what's driving it?", clientQuestionEs: "¿Hay una fecha límite firme para este logo, y qué la impulsa?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "logo_revision_rounds_expected", section: "approval",
    labelEn: "Revision/feedback workflow expectations", labelEs: "Expectativas de flujo de revisión/retroalimentación",
    operatorGuidanceEn: "Set expectations on how feedback will be gathered and how many revision rounds are planned.",
    operatorGuidanceEs: "Establezca expectativas sobre cómo se recopilará la retroalimentación y cuántas rondas de revisión están planeadas.",
    clientQuestionEn: "How would you like to review and give feedback on logo concepts?", clientQuestionEs: "¿Cómo le gustaría revisar y dar retroalimentación sobre los conceptos de logo?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 4, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },

  // ---------------------------------------------------------------------------------------------
  // SCOPE — for the blueprint's own IN SCOPE / OUT OF SCOPE sections.
  // ---------------------------------------------------------------------------------------------
  {
    fieldKey: "logo_in_scope_summary", section: "deliverables",
    labelEn: "In-scope summary", labelEs: "Resumen dentro del alcance",
    operatorGuidanceEn: "A Leonix-authored summary of exactly what this engagement covers.", operatorGuidanceEs: "Un resumen redactado por Leonix de exactamente qué cubre este trabajo.",
    clientQuestionEn: "", clientQuestionEs: "",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "LEONIX",
    priority: 5, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "logo_out_of_scope_summary", section: "deliverables",
    labelEn: "Out-of-scope summary", labelEs: "Resumen fuera del alcance",
    operatorGuidanceEn: "A Leonix-authored summary of what this engagement explicitly does not cover.", operatorGuidanceEs: "Un resumen redactado por Leonix de qué NO cubre explícitamente este trabajo.",
    clientQuestionEn: "", clientQuestionEs: "",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "LEONIX",
    priority: 5, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];
