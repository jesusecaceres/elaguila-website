/**
 * Client Discovery & Project Blueprint Engine, Gate 4 — Preferred Platforms Registry (MD
 * <preferred_platform_registry>). Pure application-code configuration, NOT a database table —
 * mirrors the exact precedent already established by projectTypeRegistry.ts / websiteDiscoveryCatalog.ts:
 * a catalog that evolves in code, while per-project STATE (an approved architecture decision) lives
 * in Gate 1's own business_project_discovery_items table.
 *
 * This is internal Leonix architecture guidance, never a commercial pricing table (MD: "Do not put
 * commercial pricing in this registry"). Every recurring-cost signal uses a durable classification
 * — never a stale exact vendor price (MD <registry_contract>).
 */

export const PLATFORM_REGISTRY_VERSION = "platform_registry_v1";

export type PlatformCategory =
  | "domain_dns" | "frontend" | "hosting" | "cms" | "forms_email"
  | "database_auth_storage" | "analytics" | "source_control"
  | "booking_scheduling_external" | "commerce_external" | "visual_platform" | "existing_platform_external";

/** preferred = Leonix's own default recommendation; alternate = an approved non-default Leonix option; external_existing = a client-owned platform Leonix integrates with/preserves rather than replaces. */
export type PlatformTier = "preferred" | "alternate" | "external_existing";

/**
 * Durable, never-stale cost signals (MD <registry_contract>: "Vendor pricing changes... If a
 * current exact price is ever needed later, that requires live/official research.").
 */
export type RecurringCostClass = "no_expected_cost" | "may_have_recurring_cost" | "paid_external_provider" | "verify_current_pricing";

/** Who should hold the permanent account by default (MD <ownership_model>: "the client should normally own permanent business infrastructure"). */
export type PlatformOwnerDefault = "client" | "leonix_managed" | "shared" | "depends_on_project";

export interface PlatformDefinition {
  key: string;
  category: PlatformCategory;
  nameEs: string;
  nameEn: string;
  tier: PlatformTier;
  active: boolean;
  capabilityTags: readonly string[];
  useCasesEs: string;
  useCasesEn: string;
  avoidWhenEs: string;
  avoidWhenEn: string;
  requiresClientAccount: boolean;
  defaultOwner: PlatformOwnerDefault;
  leonixAccessRoleEs: string;
  leonixAccessRoleEn: string;
  recurringCostClass: RecurringCostClass;
  handoffNotesEs: string;
  handoffNotesEn: string;
  architectureNotesEs: string;
  architectureNotesEn: string;
}

export const PLATFORM_REGISTRY: readonly PlatformDefinition[] = [
  // ============================================================================================
  // DOMAIN / DNS
  // ============================================================================================
  {
    key: "cloudflare", category: "domain_dns", nameEs: "Cloudflare (Registrador/DNS)", nameEn: "Cloudflare (Registrar/DNS)",
    tier: "preferred", active: true, capabilityTags: ["domain_registration", "dns"],
    useCasesEs: "TLD compatible, propiedad normal del cliente, sin restricción de registrador existente que haga innecesaria la migración.",
    useCasesEn: "Supported TLD, normal client ownership/handoff, no existing registrar constraint making migration unnecessary.",
    avoidWhenEs: "El cliente ya tiene un registrador funcional y accesible sin razón real para migrar.",
    avoidWhenEn: "The client already has a working, accessible registrar with no real reason to migrate.",
    requiresClientAccount: true, defaultOwner: "client",
    leonixAccessRoleEs: "Acceso de administrador/colaborador para gestionar DNS", leonixAccessRoleEn: "Admin/collaborator access to manage DNS",
    recurringCostClass: "may_have_recurring_cost",
    handoffNotesEs: "El cliente normalmente es dueño de la cuenta permanente del dominio.", handoffNotesEn: "The client normally owns the permanent domain account.",
    architectureNotesEs: "Registrador y DNS no son lo mismo que el alojamiento.", architectureNotesEn: "Registrar and DNS are not the same thing as hosting.",
  },
  // ============================================================================================
  // FRONTEND
  // ============================================================================================
  {
    key: "nextjs_tailwind", category: "frontend", nameEs: "Next.js + Tailwind", nameEn: "Next.js + Tailwind",
    tier: "preferred", active: true, capabilityTags: ["code_first", "custom_design", "source_controlled"],
    useCasesEs: "Leonix construye un sitio web del cliente basado en código; el diseño personalizado importa; encaja con despliegue en Vercel.",
    useCasesEn: "Leonix is building a code-first client website; custom design matters; Vercel deployment fits; maintainable source control matters.",
    avoidWhenEs: "El cliente necesita edición visual rápida sin backend técnico personalizado (considere Framer) o ya tiene una plataforma adecuada que preservar.",
    avoidWhenEn: "The client needs rapid visual editing without custom technical backend needs (consider Framer), or already has a suitable platform to preserve.",
    requiresClientAccount: false, defaultOwner: "client",
    leonixAccessRoleEs: "Acceso de colaborador al repositorio de código (GitHub)", leonixAccessRoleEn: "Collaborator access to the code repository (GitHub)",
    recurringCostClass: "no_expected_cost",
    handoffNotesEs: "El código fuente vive en un repositorio de GitHub propiedad del cliente o de Leonix según el acuerdo.", handoffNotesEn: "Source code lives in a GitHub repository owned by the client or Leonix per the engagement.",
    architectureNotesEs: "Base del stack preferido de Leonix para sitios basados en código.", architectureNotesEn: "Foundation of Leonix's preferred code-first stack.",
  },
  // ============================================================================================
  // HOSTING / DEPLOYMENT
  // ============================================================================================
  {
    key: "vercel", category: "hosting", nameEs: "Vercel", nameEn: "Vercel",
    tier: "preferred", active: true, capabilityTags: ["hosting", "preview_deployments", "git_based"],
    useCasesEs: "Construcción basada en código Next.js; despliegues de vista previa; producción; flujo de trabajo limpio basado en Git.",
    useCasesEn: "Next.js/code-first build; preview deployments; production deployment; clean Git-based workflow.",
    avoidWhenEs: "El proyecto preserva una plataforma existente (Shopify/WordPress/Webflow/Wix/Squarespace) que ya incluye su propio alojamiento.",
    avoidWhenEn: "The project preserves an existing platform (Shopify/WordPress/Webflow/Wix/Squarespace) that already includes its own hosting.",
    requiresClientAccount: true, defaultOwner: "client",
    leonixAccessRoleEs: "Acceso de miembro del equipo/colaborador al proyecto de Vercel", leonixAccessRoleEn: "Team member/collaborator access to the Vercel project",
    recurringCostClass: "may_have_recurring_cost",
    handoffNotesEs: "El cliente normalmente debe ser dueño de la cuenta de alojamiento permanente y su facturación.", handoffNotesEn: "The client should normally own the permanent hosting account and its billing.",
    architectureNotesEs: "Alojamiento preferido para el stack Next.js.", architectureNotesEn: "Preferred hosting for the Next.js stack.",
  },
  // ============================================================================================
  // CMS
  // ============================================================================================
  {
    key: "sanity", category: "cms", nameEs: "Sanity", nameEn: "Sanity",
    tier: "preferred", active: true, capabilityTags: ["structured_content", "client_editing"],
    useCasesEs: "El cliente/personal debe editar contenido estructurado regularmente; la frecuencia/roles de edición justifican un CMS.",
    useCasesEn: "Client/staff must regularly edit structured content; editing frequency/roles justify a CMS.",
    avoidWhenEs: "El cliente no necesita editar el sitio, o el contenido es estático y rara vez cambia. No agregar por defecto.",
    avoidWhenEn: "The client does not need to edit the site, or content is static and rarely changes. Do not add by default.",
    requiresClientAccount: true, defaultOwner: "client",
    leonixAccessRoleEs: "Acceso de administrador/editor al proyecto de Sanity", leonixAccessRoleEn: "Admin/editor access to the Sanity project",
    recurringCostClass: "may_have_recurring_cost",
    handoffNotesEs: "El cliente normalmente es dueño de la cuenta permanente del CMS.", handoffNotesEn: "The client normally owns the permanent CMS account.",
    architectureNotesEs: "Solo se recomienda cuando la edición estructurada es una necesidad real, nunca por preferencia de Leonix.", architectureNotesEn: "Only recommended when structured editing is a real need, never because Leonix prefers it.",
  },
  // ============================================================================================
  // FORMS / TRANSACTIONAL EMAIL
  // ============================================================================================
  {
    key: "resend", category: "forms_email", nameEs: "Resend", nameEn: "Resend",
    tier: "preferred", active: true, capabilityTags: ["transactional_email", "form_delivery"],
    useCasesEs: "Formularios de contacto, formularios de cotización, notificaciones transaccionales — solo cuando realmente se necesita entrega de correo.",
    useCasesEn: "Contact forms, quote forms, transactional notifications — only when email delivery is actually required.",
    avoidWhenEs: "El sitio no tiene formularios que generen correos electrónicos.", avoidWhenEn: "The site has no email-generating forms.",
    requiresClientAccount: false, defaultOwner: "leonix_managed",
    leonixAccessRoleEs: "Configuración a nivel de proyecto; no requiere cuenta separada del cliente en la mayoría de los casos", leonixAccessRoleEn: "Project-level configuration; usually no separate client account required",
    recurringCostClass: "no_expected_cost",
    handoffNotesEs: "Generalmente incluido en la infraestructura del proyecto, no una cuenta separada que el cliente deba administrar.", handoffNotesEn: "Usually bundled into project infrastructure, not a separate account the client must manage.",
    architectureNotesEs: "Preferido para entrega de correo transaccional/formularios únicamente.", architectureNotesEn: "Preferred for transactional/form-delivery email only.",
  },
  // ============================================================================================
  // DATABASE / AUTH / STORAGE
  // ============================================================================================
  {
    key: "supabase", category: "database_auth_storage", nameEs: "Supabase", nameEn: "Supabase",
    tier: "preferred", active: true, capabilityTags: ["database", "auth", "storage"],
    useCasesEs: "Estado persistente de la aplicación, autenticación, registros de usuario, almacenamiento protegido, flujo de trabajo respaldado por base de datos — cuando son requisitos reales del proyecto.",
    useCasesEn: "Persistent application state, authentication, user records, protected storage, database-backed workflow — when they are real project requirements.",
    avoidWhenEs: "El proyecto es un sitio de marketing simple sin estado persistente. No agregar Supabase a un sitio de marketing simple.",
    avoidWhenEn: "The project is a simple marketing website with no persistent state. Do not add Supabase to a simple marketing website.",
    requiresClientAccount: true, defaultOwner: "depends_on_project",
    leonixAccessRoleEs: "Acceso de administrador/desarrollador al proyecto de Supabase", leonixAccessRoleEn: "Admin/developer access to the Supabase project",
    recurringCostClass: "may_have_recurring_cost",
    handoffNotesEs: "Requiere una decisión explícita de propiedad — cuenta permanente del cliente vs. servicio administrado por Leonix.", handoffNotesEn: "Requires an explicit ownership decision — permanent client account vs. Leonix-managed service.",
    architectureNotesEs: "Nunca se agrega casualmente; requiere justificación de base de datos/autenticación/almacenamiento real.", architectureNotesEn: "Never added casually; requires a real database/auth/storage justification.",
  },
  // ============================================================================================
  // ANALYTICS
  // ============================================================================================
  {
    key: "vercel_analytics", category: "analytics", nameEs: "Vercel Analytics", nameEn: "Vercel Analytics",
    tier: "preferred", active: true, capabilityTags: ["basic_analytics", "privacy_friendly"],
    useCasesEs: "Medición básica de tráfico sin configuración adicional cuando el sitio ya está en Vercel.", useCasesEn: "Basic traffic measurement with no extra setup when the site is already on Vercel.",
    avoidWhenEs: "El cliente necesita seguimiento avanzado de campañas o ya tiene una propiedad de Google Analytics establecida.", avoidWhenEn: "The client needs advanced campaign tracking or already has an established Google Analytics property.",
    requiresClientAccount: false, defaultOwner: "client",
    leonixAccessRoleEs: "Incluido en el acceso al proyecto de Vercel", leonixAccessRoleEn: "Included via Vercel project access",
    recurringCostClass: "may_have_recurring_cost",
    handoffNotesEs: "Ligado a la propiedad de la cuenta de Vercel.", handoffNotesEn: "Tied to Vercel account ownership.",
    architectureNotesEs: "Adecuado cuando no se necesita seguimiento de campañas de marketing más profundo.", architectureNotesEn: "Suitable when deeper marketing-campaign tracking is not needed.",
  },
  {
    key: "google_analytics", category: "analytics", nameEs: "Google Analytics", nameEn: "Google Analytics",
    tier: "alternate", active: true, capabilityTags: ["campaign_tracking", "marketing_measurement"],
    useCasesEs: "Medición de marketing/campañas; el cliente ya tiene una cuenta de Google Analytics o la necesita para publicidad.", useCasesEn: "Marketing/campaign measurement; the client already has a Google Analytics account or needs one for advertising.",
    avoidWhenEs: "El cliente no hace seguimiento de campañas y ya se está usando Vercel Analytics.", avoidWhenEn: "The client does not track campaigns and Vercel Analytics is already in use.",
    requiresClientAccount: true, defaultOwner: "client",
    leonixAccessRoleEs: "Acceso de editor/analista a la propiedad de Google Analytics", leonixAccessRoleEn: "Editor/analyst access to the Google Analytics property",
    recurringCostClass: "no_expected_cost",
    handoffNotesEs: "El cliente normalmente es dueño de la propiedad de análisis.", handoffNotesEn: "The client normally owns the analytics property.",
    architectureNotesEs: "Evite agregar varios sistemas de análisis sin una razón.", architectureNotesEn: "Avoid adding multiple analytics systems without a reason.",
  },
  // ============================================================================================
  // SOURCE CONTROL
  // ============================================================================================
  {
    key: "github", category: "source_control", nameEs: "GitHub", nameEn: "GitHub",
    tier: "preferred", active: true, capabilityTags: ["version_control", "code_review"],
    useCasesEs: "Todo proyecto basado en código Next.js.", useCasesEn: "Every Next.js code-first project.",
    avoidWhenEs: "El proyecto usa una plataforma sin código (Webflow/Wix/Squarespace) sin código fuente separado.", avoidWhenEn: "The project uses a no-code platform (Webflow/Wix/Squarespace) with no separate source code.",
    requiresClientAccount: false, defaultOwner: "depends_on_project",
    leonixAccessRoleEs: "Acceso de colaborador/mantenedor al repositorio", leonixAccessRoleEn: "Collaborator/maintainer access to the repository",
    recurringCostClass: "no_expected_cost",
    handoffNotesEs: "La propiedad del repositorio depende del acuerdo del proyecto.", handoffNotesEn: "Repository ownership depends on the project agreement.",
    architectureNotesEs: "Flujo de trabajo: Blueprint del Proyecto → GitHub → implementación técnica → Vista previa de Vercel → control de calidad de Leonix → aprobación del cliente → lanzamiento a producción.", architectureNotesEn: "Workflow: Project Blueprint → GitHub → technical implementation → Vercel Preview → Leonix QA → client approval → production launch.",
  },
  // ============================================================================================
  // ALTERNATE VISUAL PLATFORM
  // ============================================================================================
  {
    key: "framer", category: "visual_platform", nameEs: "Framer", nameEn: "Framer",
    tier: "alternate", active: true, capabilityTags: ["visual_editing", "rapid_handoff", "marketing_site"],
    useCasesEs: "Sitio de marketing muy visual; requisitos técnicos simples; la edición visual rápida es mejor para el cliente; sin necesidad significativa de backend personalizado.",
    useCasesEn: "Highly visual marketing site; simple technical requirements; rapid visual editing/handoff is a better client fit; no meaningful custom backend need.",
    avoidWhenEs: "El proyecto necesita lógica de backend personalizada, base de datos, o autenticación.", avoidWhenEn: "The project needs custom backend logic, a database, or authentication.",
    requiresClientAccount: true, defaultOwner: "client",
    leonixAccessRoleEs: "Acceso de colaborador/editor al proyecto de Framer", leonixAccessRoleEn: "Collaborator/editor access to the Framer project",
    recurringCostClass: "may_have_recurring_cost",
    handoffNotesEs: "El cliente normalmente es dueño de la cuenta permanente de Framer.", handoffNotesEn: "The client normally owns the permanent Framer account.",
    architectureNotesEs: "Alternativa aprobada al stack de código para sitios simples y muy visuales.", architectureNotesEn: "Approved alternative to the code stack for simple, highly visual sites.",
  },
  // ============================================================================================
  // EXTERNAL / EXISTING PLATFORMS — preserved, never fully re-implemented by Leonix (MD
  // <preserve_existing_platform>: "integrate with useful existing platforms instead of replacing
  // them unnecessarily").
  // ============================================================================================
  {
    key: "shopify", category: "existing_platform_external", nameEs: "Shopify (existente)", nameEn: "Shopify (existing)",
    tier: "external_existing", active: true, capabilityTags: ["ecommerce", "existing_platform"],
    useCasesEs: "El cliente ya tiene una tienda Shopify funcional con comercio significativo.", useCasesEn: "The client already has a working Shopify store with meaningful commerce.",
    avoidWhenEs: "No migrar únicamente para estandarizar con el stack de Leonix.", avoidWhenEn: "Never migrate merely to standardize on Leonix's stack.",
    requiresClientAccount: true, defaultOwner: "client",
    leonixAccessRoleEs: "Acceso de colaborador/personal según el alcance del proyecto", leonixAccessRoleEn: "Collaborator/staff access per project scope",
    recurringCostClass: "paid_external_provider",
    handoffNotesEs: "El cliente conserva la propiedad; Leonix se integra en lugar de reemplazar.", handoffNotesEn: "Client retains ownership; Leonix integrates rather than replaces.",
    architectureNotesEs: "Considere fuertemente PRESERVE_EXISTING_PLATFORM cuando el comercio existente sea significativo.", architectureNotesEn: "Strongly consider PRESERVE_EXISTING_PLATFORM when existing commerce is meaningful.",
  },
  {
    key: "wordpress", category: "existing_platform_external", nameEs: "WordPress (existente)", nameEn: "WordPress (existing)",
    tier: "external_existing", active: true, capabilityTags: ["cms", "existing_platform"],
    useCasesEs: "El cliente ya tiene un sitio WordPress adecuado para sus metas reales del proyecto.", useCasesEn: "The client already has a WordPress site suitable for their actual project goals.",
    avoidWhenEs: "No condene automáticamente WordPress solo por ser una plataforma más antigua.", avoidWhenEn: "Do not automatically condemn WordPress merely for being an older platform.",
    requiresClientAccount: true, defaultOwner: "client",
    leonixAccessRoleEs: "Acceso de administrador según el alcance del proyecto", leonixAccessRoleEn: "Admin access per project scope",
    recurringCostClass: "verify_current_pricing",
    handoffNotesEs: "El cliente conserva la propiedad del alojamiento/tema/complementos existentes.", handoffNotesEn: "Client retains ownership of existing hosting/theme/plugins.",
    architectureNotesEs: "La decisión de preservar o reconstruir depende de las metas reales del proyecto, no de la edad de la plataforma.", architectureNotesEn: "The decision to preserve or rebuild depends on actual project goals, not platform age.",
  },
  {
    key: "webflow", category: "existing_platform_external", nameEs: "Webflow (existente)", nameEn: "Webflow (existing)",
    tier: "external_existing", active: true, capabilityTags: ["visual_editing", "existing_platform"],
    useCasesEs: "El cliente ya tiene un sitio Webflow adecuado.", useCasesEn: "The client already has a suitable Webflow site.",
    avoidWhenEs: "No migrar únicamente para estandarizar con el stack de Leonix.", avoidWhenEn: "Never migrate merely to standardize on Leonix's stack.",
    requiresClientAccount: true, defaultOwner: "client",
    leonixAccessRoleEs: "Acceso de colaborador según el alcance del proyecto", leonixAccessRoleEn: "Collaborator access per project scope",
    recurringCostClass: "paid_external_provider",
    handoffNotesEs: "El cliente conserva la propiedad de la cuenta de Webflow.", handoffNotesEn: "Client retains ownership of the Webflow account.",
    architectureNotesEs: "Considere preservar cuando la migración aporte poco valor real al cliente.", architectureNotesEn: "Consider preserving when migration creates little real client value.",
  },
  {
    key: "wix", category: "existing_platform_external", nameEs: "Wix (existente)", nameEn: "Wix (existing)",
    tier: "external_existing", active: true, capabilityTags: ["visual_editing", "existing_platform"],
    useCasesEs: "El cliente ya tiene un sitio Wix adecuado para sus metas reales.", useCasesEn: "The client already has a Wix site suitable for their actual goals.",
    avoidWhenEs: "No migrar únicamente para estandarizar con el stack de Leonix.", avoidWhenEn: "Never migrate merely to standardize on Leonix's stack.",
    requiresClientAccount: true, defaultOwner: "client",
    leonixAccessRoleEs: "Acceso de colaborador según el alcance del proyecto", leonixAccessRoleEn: "Collaborator access per project scope",
    recurringCostClass: "paid_external_provider",
    handoffNotesEs: "El cliente conserva la propiedad de la cuenta de Wix.", handoffNotesEn: "Client retains ownership of the Wix account.",
    architectureNotesEs: "Considere preservar cuando el riesgo/costo de migración supere el beneficio.", architectureNotesEn: "Consider preserving when migration cost/risk outweighs the benefit.",
  },
  {
    key: "squarespace", category: "existing_platform_external", nameEs: "Squarespace (existente)", nameEn: "Squarespace (existing)",
    tier: "external_existing", active: true, capabilityTags: ["visual_editing", "existing_platform"],
    useCasesEs: "El cliente ya tiene un sitio Squarespace adecuado.", useCasesEn: "The client already has a suitable Squarespace site.",
    avoidWhenEs: "No migrar únicamente para estandarizar con el stack de Leonix.", avoidWhenEn: "Never migrate merely to standardize on Leonix's stack.",
    requiresClientAccount: true, defaultOwner: "client",
    leonixAccessRoleEs: "Acceso de colaborador según el alcance del proyecto", leonixAccessRoleEn: "Collaborator access per project scope",
    recurringCostClass: "paid_external_provider",
    handoffNotesEs: "El cliente conserva la propiedad de la cuenta de Squarespace.", handoffNotesEn: "Client retains ownership of the Squarespace account.",
    architectureNotesEs: "Considere preservar cuando la migración aporte poco valor real al cliente.", architectureNotesEn: "Consider preserving when migration creates little real client value.",
  },
  {
    key: "external_booking_provider", category: "booking_scheduling_external", nameEs: "Proveedor externo de reservas (existente)", nameEn: "External booking provider (existing)",
    tier: "external_existing", active: true, capabilityTags: ["booking", "scheduling", "existing_platform"],
    useCasesEs: "El cliente ya usa un sistema de reservas confiable; solo se necesita un enlace externo.", useCasesEn: "The client already uses a reliable booking system; only an external link is needed.",
    avoidWhenEs: "No construya un motor de reservas personalizado cuando un enlace externo es suficiente.", avoidWhenEn: "Do not build a custom scheduling engine when an external link is enough.",
    requiresClientAccount: true, defaultOwner: "client",
    leonixAccessRoleEs: "Generalmente ninguno — solo se enlaza, no se administra", leonixAccessRoleEn: "Usually none — only linked, not managed",
    recurringCostClass: "verify_current_pricing",
    handoffNotesEs: "El cliente conserva la propiedad total de la cuenta de reservas.", handoffNotesEn: "Client retains full ownership of the booking account.",
    architectureNotesEs: "Preferir un sistema externo confiable cuando reemplazarlo no agregue valor al cliente.", architectureNotesEn: "Prefer a reliable external system when replacing it adds no client value.",
  },
  {
    key: "external_commerce_provider", category: "commerce_external", nameEs: "Proveedor externo de pagos/pedidos (existente)", nameEn: "External payment/ordering provider (existing)",
    tier: "external_existing", active: true, capabilityTags: ["payments", "ordering", "existing_platform"],
    useCasesEs: "Proveedor de pedidos de restaurante, plataforma de donaciones, proveedor de boletos — cuando un enlace/insignia externo satisface al cliente.", useCasesEn: "Restaurant ordering provider, donation platform, ticket provider — when an external link/embed satisfies the client.",
    avoidWhenEs: "No construya software de pago personalizado solo porque es técnicamente posible.", avoidWhenEn: "Do not build custom payment software just because it is technically possible.",
    requiresClientAccount: true, defaultOwner: "client",
    leonixAccessRoleEs: "Generalmente ninguno — solo se enlaza/inserta, no se administra", leonixAccessRoleEn: "Usually none — only linked/embedded, not managed",
    recurringCostClass: "verify_current_pricing",
    handoffNotesEs: "El cliente conserva la propiedad total de la cuenta de comercio/pagos.", handoffNotesEn: "Client retains full ownership of the commerce/payment account.",
    architectureNotesEs: "El comercio nativo/personalizado aumenta materialmente el alcance y puede activar revisión comercial.", architectureNotesEn: "Native/custom commerce materially increases scope and may trigger commercial review.",
  },
  {
    key: "other_external_platform", category: "existing_platform_external", nameEs: "Otra plataforma externa (requiere explicación)", nameEn: "Other external platform (requires explanation)",
    tier: "external_existing", active: true, capabilityTags: ["existing_platform", "catch_all"],
    useCasesEs: "Una plataforma existente y justificada no listada arriba que el cliente depende de sus operaciones.", useCasesEn: "An existing, justified platform not listed above that the client's operations depend on.",
    avoidWhenEs: "Nunca seleccione sin una explicación concreta y concisa.", avoidWhenEn: "Never select without a concrete, concise explanation.",
    requiresClientAccount: true, defaultOwner: "client",
    leonixAccessRoleEs: "Determinado caso por caso", leonixAccessRoleEn: "Determined case by case",
    recurringCostClass: "verify_current_pricing",
    handoffNotesEs: "El cliente conserva la propiedad total.", handoffNotesEn: "Client retains full ownership.",
    architectureNotesEs: "Requiere una explicación por escrito del revisor de arquitectura al seleccionarse.", architectureNotesEn: "Requires a written explanation from the architecture reviewer when selected.",
  },
] as const;

const PLATFORM_BY_KEY = new Map(PLATFORM_REGISTRY.map((p) => [p.key, p]));

export function getPlatform(key: string): PlatformDefinition | null {
  return PLATFORM_BY_KEY.get(key) ?? null;
}

export function isKnownPlatformKey(key: string): boolean {
  return PLATFORM_BY_KEY.has(key);
}

export function platformsForCategory(category: PlatformCategory): readonly PlatformDefinition[] {
  return PLATFORM_REGISTRY.filter((p) => p.category === category && p.active);
}

/** The one designated "requires explanation" catch-all key (MD: "Support 'Other / External platform' with required explanation when genuinely needed"). */
export const OTHER_EXTERNAL_PLATFORM_KEY = "other_external_platform";
