/**
 * Client Discovery & Project Blueprint Engine, Gate 4 — deterministic Website Architecture
 * Decision Engine (MD <architecture_principle>: "NEED DETERMINES ARCHITECTURE"). Pure functions
 * only — no database, no network, no "server-only" marker, no AI-generated hidden reasoning
 * (MD <architecture_output>: "This gate is deterministic architecture logic").
 *
 * Consumes the SAME WebsiteDiscoveryContext + WebsiteScopeSignalResult Gate 2/3 already build —
 * never a second context compiler. detectWebsiteScopeSignals()'s own scopeClassCandidate is
 * "evidence only" (see its own doc comment: "never a final architecture/platform decision — Gate 4
 * owns that"); this file is exactly that promised owner, refining the candidate with real
 * PRESERVE_EXISTING_PLATFORM detection and the full multi-platform stack recommendation.
 */
import { toPredicateContext, type WebsiteDiscoveryContext, type WebsiteScopeSignalResult } from "./websiteDiscoveryLogic";
import type { ScopeSignalReason } from "./websiteDiscoveryCatalog";
import { PLATFORM_REGISTRY_VERSION, isKnownPlatformKey, type RecurringCostClass } from "./platformRegistry";
import { WEBSITE_DISCOVERY_CATALOG_VERSION } from "./websiteDiscoveryCatalog";

// ---------------------------------------------------------------------------------------------
// Classification (MD <architecture_classes>)
// ---------------------------------------------------------------------------------------------
export type WebsiteArchitectureClass = "RAPID_BUSINESS_SITE" | "BUSINESS_SITE" | "CUSTOM_PLATFORM" | "PRESERVE_EXISTING_PLATFORM";

const PRESERVABLE_PLATFORM_KEYS = ["shopify", "wordpress", "webflow", "wix", "squarespace"] as const;
export type PreservablePlatformKey = (typeof PRESERVABLE_PLATFORM_KEYS)[number];

export function isPreservablePlatformKey(value: string | null): value is PreservablePlatformKey {
  return value !== null && (PRESERVABLE_PLATFORM_KEYS as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------------------------
// Per-decision shapes (MD <architecture_output>, <cost_control>)
// ---------------------------------------------------------------------------------------------
export type PlatformDecisionStatus = "required" | "optional" | "not_needed" | "preserve_existing";

export interface PlatformRecommendation {
  platformKey: string | null;
  status: PlatformDecisionStatus;
  recurringCostClass: RecurringCostClass | null;
  reasonEs: string;
  reasonEn: string;
}

export type BinaryDecision = "REQUIRED" | "NOT_NEEDED" | "NEEDS_REVIEW";
export type StorageDecision = "REQUIRED" | "NOT_NEEDED" | "EXTERNAL_EXISTING";
export type CmsDecision = "REQUIRED" | "OPTIONAL" | "NOT_NEEDED" | "PRESERVE_EXISTING";

export interface DecisionWithReason<T extends string> {
  decision: T;
  reasonEs: string;
  reasonEn: string;
}

export type DomainDecisionKind = "client_owned_new_registration" | "preserve_existing_domain" | "domain_access_blocker" | "unknown";

export interface DomainDnsRecommendation {
  kind: DomainDecisionKind;
  registrarPlatformKey: string | null;
  dnsPlatformKey: string | null;
  reasonEs: string;
  reasonEn: string;
  isLaunchBlocker: boolean;
}

export type OwnershipOwner = "client" | "leonix_managed" | "shared" | "unknown";
export type AccessStatus = "not_requested" | "needs_access" | "invited" | "access_confirmed" | "client_action_required";
export type HasAccountAnswer = "yes" | "no" | "unknown";

export interface PlatformOwnershipEntry {
  platformKey: string;
  hasAccount: HasAccountAnswer;
  owner: OwnershipOwner;
  billingOwner: OwnershipOwner;
  recoveryOwner: OwnershipOwner;
  leonixAccessRequired: boolean;
  accessStatus: AccessStatus;
  handoffRequired: boolean;
}

export type InfrastructureComplexity = "LOW" | "MODERATE" | "HIGH" | "CUSTOM";

export interface WebsiteArchitectureDecisionPacket {
  registryVersion: string;
  discoveryCatalogVersion: string;
  discoveryId: string;
  projectIntentId: string;

  architectureClass: WebsiteArchitectureClass;
  preserveExistingPlatformKey: string | null;

  frontend: PlatformRecommendation;
  hosting: PlatformRecommendation;
  domainDns: DomainDnsRecommendation;
  cms: DecisionWithReason<CmsDecision> & { platformKey: string | null };
  formsEmail: PlatformRecommendation;
  database: DecisionWithReason<BinaryDecision>;
  auth: DecisionWithReason<BinaryDecision>;
  storage: DecisionWithReason<StorageDecision>;
  analytics: readonly PlatformRecommendation[];
  externalIntegrations: readonly PlatformRecommendation[];

  ownership: readonly PlatformOwnershipEntry[];

  recurringServices: readonly { platformKey: string; costClass: RecurringCostClass }[];
  infrastructureComplexity: InfrastructureComplexity;
  infrastructureComplexityReasonEs: string;
  infrastructureComplexityReasonEn: string;

  reasonsEs: readonly string[];
  reasonsEn: readonly string[];
  assumptions: readonly string[];
  unresolvedBlockers: readonly string[];

  scopeEscalationReasons: readonly ScopeSignalReason[];
  requiresLeonixArchitectureReview: boolean;
  requiresCommercialReview: boolean;
  /** True whenever requiresCommercialReview is true — no canonical commercial-approval domain exists yet anywhere in this codebase (confirmed by direct inspection); this is the truthfully-reported missing seam MD <custom_platform_guard> requires rather than a fabricated approval system. */
  commercialReviewSeamMissing: boolean;

  migrationRequired: boolean;
  migrationNotesEs: string;
  migrationNotesEn: string;

  isOverride: boolean;
  overrideReasonEs: string | null;
  overrideReasonEn: string | null;
}

// ---------------------------------------------------------------------------------------------
// Input extraction — reuses the exact same predicate-context helper Gate 2's own catalog
// predicates use (toPredicateContext), never a second context reader.
// ---------------------------------------------------------------------------------------------
interface ArchitectureInputs {
  hasExistingWebsite: boolean;
  existingWebsitePlatform: string | null;
  existingWebsiteTransitionPlan: string | null;
  wantsSelfManagedContent: boolean | null;
  wantsUserAccounts: boolean | null;
  wantsCustomerDashboard: boolean | null;
  wantsOnlineBooking: boolean | null;
  wantsNativeCheckout: boolean | null;
  wantsContactForm: boolean | null;
  handlesSensitiveData: boolean | null;
  hasExistingDomain: boolean | null;
  domainAccessAvailable: boolean | null;
  domainOwner: string | null;
}

function readArchitectureInputs(ctx: WebsiteDiscoveryContext): ArchitectureInputs {
  const p = toPredicateContext(ctx);
  const bool = (key: string): boolean | null => {
    const v = p.getCapturedValue(key);
    return typeof v === "boolean" ? v : null;
  };
  const text = (key: string): string | null => {
    const v = p.getCapturedValue(key);
    return typeof v === "string" && v.trim().length > 0 ? v : null;
  };
  return {
    hasExistingWebsite: ctx.hasExistingWebsite,
    existingWebsitePlatform: text("existing_website_platform"),
    existingWebsiteTransitionPlan: text("existing_website_transition_plan"),
    wantsSelfManagedContent: bool("wants_self_managed_content"),
    wantsUserAccounts: bool("wants_user_accounts"),
    wantsCustomerDashboard: bool("wants_customer_dashboard"),
    wantsOnlineBooking: bool("wants_online_booking"),
    wantsNativeCheckout: (() => {
      const v = p.getCapturedValue("wants_native_checkout");
      return typeof v === "boolean" ? v : null;
    })(),
    wantsContactForm: bool("wants_contact_form"),
    handlesSensitiveData: bool("handles_minors_or_medical_financial_data"),
    hasExistingDomain: bool("has_existing_domain"),
    domainAccessAvailable: bool("domain_access_available"),
    domainOwner: text("domain_owner"),
  };
}

// ---------------------------------------------------------------------------------------------
// Classification (MD <architecture_classes>, <preserve_existing_platform>, <decision_rules>)
// ---------------------------------------------------------------------------------------------
function classifyArchitecture(
  inputs: ArchitectureInputs,
  scopeSignals: WebsiteScopeSignalResult,
): { architectureClass: WebsiteArchitectureClass; preserveExistingPlatformKey: string | null } {
  const customPlatformNeeded = scopeSignals.scopeClassCandidate === "custom_platform";
  const explicitlyReplacing = inputs.existingWebsiteTransitionPlan === "replace_fully";
  const explicitlyPreserving = inputs.existingWebsiteTransitionPlan === "preserve_during_transition";

  if (inputs.hasExistingWebsite && isPreservablePlatformKey(inputs.existingWebsitePlatform) && !explicitlyReplacing) {
    // Shopify already carrying meaningful commerce is a strong, standalone preserve signal
    // regardless of the transition-plan answer (MD: "existing Shopify commerce -> strongly
    // consider preserve").
    const shopifyCommerceSignal = inputs.existingWebsitePlatform === "shopify" && (inputs.wantsNativeCheckout === true || inputs.wantsNativeCheckout === null);
    if (shopifyCommerceSignal || explicitlyPreserving || !customPlatformNeeded) {
      return { architectureClass: "PRESERVE_EXISTING_PLATFORM", preserveExistingPlatformKey: inputs.existingWebsitePlatform };
    }
  }

  if (scopeSignals.scopeClassCandidate === "custom_platform") return { architectureClass: "CUSTOM_PLATFORM", preserveExistingPlatformKey: null };
  if (scopeSignals.scopeClassCandidate === "business_site") return { architectureClass: "BUSINESS_SITE", preserveExistingPlatformKey: null };
  return { architectureClass: "RAPID_BUSINESS_SITE", preserveExistingPlatformKey: null };
}

// ---------------------------------------------------------------------------------------------
// CMS decision (MD <cms_decision>)
// ---------------------------------------------------------------------------------------------
function decideCms(inputs: ArchitectureInputs, architectureClass: WebsiteArchitectureClass): WebsiteArchitectureDecisionPacket["cms"] {
  if (architectureClass === "PRESERVE_EXISTING_PLATFORM") {
    return { decision: "PRESERVE_EXISTING", platformKey: inputs.existingWebsitePlatform, reasonEs: "La plataforma existente ya incluye su propia gestión de contenido.", reasonEn: "The existing platform already includes its own content management." };
  }
  if (inputs.wantsSelfManagedContent === true) {
    return { decision: "REQUIRED", platformKey: "sanity", reasonEs: "El cliente necesita actualizar el contenido regularmente — se necesita edición estructurada.", reasonEn: "The client needs to update content regularly — structured editing is needed." };
  }
  if (inputs.wantsSelfManagedContent === false) {
    return { decision: "NOT_NEEDED", platformKey: null, reasonEs: "El cliente no necesita editar el sitio.", reasonEn: "The client does not need to edit the site." };
  }
  return { decision: "OPTIONAL", platformKey: null, reasonEs: "Aún no se sabe si el cliente necesita autoadministrar el contenido.", reasonEn: "Not yet known whether the client needs to self-manage content." };
}

// ---------------------------------------------------------------------------------------------
// Database / Auth / Storage (MD <backend_decision>)
// ---------------------------------------------------------------------------------------------
function decideAuth(inputs: ArchitectureInputs): WebsiteArchitectureDecisionPacket["auth"] {
  if (inputs.wantsUserAccounts === true || inputs.wantsCustomerDashboard === true) {
    return { decision: "REQUIRED", reasonEs: "Se solicitaron cuentas de usuario o un panel privado.", reasonEn: "User accounts or a private dashboard were requested." };
  }
  if (inputs.wantsUserAccounts === false && inputs.wantsCustomerDashboard === false) {
    return { decision: "NOT_NEEDED", reasonEs: "No se necesitan cuentas de usuario ni panel privado.", reasonEn: "No user accounts or private dashboard are needed." };
  }
  return { decision: "NEEDS_REVIEW", reasonEs: "Aún no se sabe si se necesitan cuentas de usuario.", reasonEn: "Not yet known whether user accounts are needed." };
}

function decideDatabase(inputs: ArchitectureInputs, auth: WebsiteArchitectureDecisionPacket["auth"]): WebsiteArchitectureDecisionPacket["database"] {
  if (auth.decision === "REQUIRED") {
    return { decision: "REQUIRED", reasonEs: "La autenticación requiere una base de datos para los registros de usuario.", reasonEn: "Authentication requires a database for user records." };
  }
  if (inputs.wantsOnlineBooking === true || inputs.wantsNativeCheckout === true) {
    return { decision: "NEEDS_REVIEW", reasonEs: "Las reservas o el pago nativo pueden requerir estado persistente — revisar caso por caso.", reasonEn: "Booking or native checkout may require persistent state — review case by case." };
  }
  // Default is NOT_NEEDED whenever no positive persistence signal exists — even when auth itself
  // is still unanswered elsewhere. "Unknown" must never quietly escalate into "assume the more
  // complex stack"; the engine only ever adds complexity for a real, positive signal (MD
  // <architecture_principle>: "prefer the least complex architecture that safely satisfies the
  // project").
  return { decision: "NOT_NEEDED", reasonEs: "No se identificó una necesidad de estado persistente.", reasonEn: "No persistent-state need identified." };
}

function decideStorage(inputs: ArchitectureInputs, auth: WebsiteArchitectureDecisionPacket["auth"]): WebsiteArchitectureDecisionPacket["storage"] {
  if (inputs.handlesSensitiveData === true || inputs.wantsCustomerDashboard === true) {
    return { decision: "REQUIRED", reasonEs: "Se necesita almacenamiento protegido para datos sensibles o documentos privados de clientes.", reasonEn: "Protected storage is needed for sensitive data or private customer documents." };
  }
  if (auth.decision === "NOT_NEEDED") {
    return { decision: "NOT_NEEDED", reasonEs: "No hay una necesidad de almacenamiento protegido identificada.", reasonEn: "No protected-storage need identified." };
  }
  return { decision: "NOT_NEEDED", reasonEs: "El proyecto usa referencias visuales/activos existentes en lugar de almacenamiento de aplicación.", reasonEn: "The project uses existing visual references/assets rather than application storage." };
}

// ---------------------------------------------------------------------------------------------
// Forms / email (MD <forms_decision>)
// ---------------------------------------------------------------------------------------------
function decideFormsEmail(inputs: ArchitectureInputs): PlatformRecommendation {
  if (inputs.wantsContactForm === true) {
    return { platformKey: "resend", status: "required", recurringCostClass: "no_expected_cost", reasonEs: "El sitio tiene un formulario que genera correos.", reasonEn: "The site has a form that generates emails." };
  }
  if (inputs.wantsContactForm === false) {
    return { platformKey: null, status: "not_needed", recurringCostClass: null, reasonEs: "El sitio no tiene formularios que generen correos electrónicos.", reasonEn: "The site has no email-generating forms." };
  }
  return { platformKey: null, status: "optional", recurringCostClass: null, reasonEs: "Aún no se sabe si el sitio necesitará un formulario.", reasonEn: "Not yet known whether the site will need a form." };
}

// ---------------------------------------------------------------------------------------------
// Domain / DNS (MD <domain_decision>) — REGISTRAR, DNS, and HOSTING are never conflated.
// ---------------------------------------------------------------------------------------------
function decideDomainDns(inputs: ArchitectureInputs): DomainDnsRecommendation {
  if (inputs.hasExistingDomain === false) {
    return {
      kind: "client_owned_new_registration", registrarPlatformKey: "cloudflare", dnsPlatformKey: "cloudflare",
      reasonEs: "No hay un dominio existente — se recomienda un registro nuevo propiedad del cliente.", reasonEn: "No existing domain — a new client-owned registration is recommended.",
      isLaunchBlocker: false,
    };
  }
  if (inputs.hasExistingDomain === true && inputs.domainAccessAvailable === true) {
    return {
      kind: "preserve_existing_domain", registrarPlatformKey: null, dnsPlatformKey: null,
      reasonEs: "Existe un dominio con acceso confirmado — se preserva sin forzar una transferencia. El DNS puede apuntar al nuevo alojamiento sin transferir el registrador.",
      reasonEn: "An existing domain with confirmed access — preserved without forcing a transfer. DNS can point to the new hosting without transferring the registrar.",
      isLaunchBlocker: false,
    };
  }
  if (inputs.hasExistingDomain === true && (inputs.domainAccessAvailable === false || inputs.domainAccessAvailable === null)) {
    return {
      kind: "domain_access_blocker", registrarPlatformKey: null, dnsPlatformKey: null,
      reasonEs: "Existe un dominio, pero el acceso no está confirmado — esto es un bloqueador de lanzamiento y requiere acción del cliente.",
      reasonEn: "A domain exists, but access is not confirmed — this is a launch blocker and requires client action.",
      isLaunchBlocker: true,
    };
  }
  return {
    kind: "unknown", registrarPlatformKey: null, dnsPlatformKey: null,
    reasonEs: "Aún no se sabe si el cliente tiene un dominio existente.", reasonEn: "Not yet known whether the client has an existing domain.",
    isLaunchBlocker: false,
  };
}

// ---------------------------------------------------------------------------------------------
// Analytics (MD <analytics_decision>) — proportional, never duplicated without reason.
// ---------------------------------------------------------------------------------------------
function decideAnalytics(architectureClass: WebsiteArchitectureClass): readonly PlatformRecommendation[] {
  if (architectureClass === "PRESERVE_EXISTING_PLATFORM") {
    return [{ platformKey: null, status: "preserve_existing", recurringCostClass: null, reasonEs: "La plataforma existente puede tener su propia analítica.", reasonEn: "The existing platform may have its own analytics." }];
  }
  return [{ platformKey: "vercel_analytics", status: "required", recurringCostClass: "may_have_recurring_cost", reasonEs: "Medición básica de tráfico sin configuración adicional.", reasonEn: "Basic traffic measurement with no extra setup." }];
}

// ---------------------------------------------------------------------------------------------
// External integrations (MD <commerce_decision>, booking) — prefer existing trustworthy systems.
// ---------------------------------------------------------------------------------------------
function decideExternalIntegrations(inputs: ArchitectureInputs): readonly PlatformRecommendation[] {
  const integrations: PlatformRecommendation[] = [];
  if (inputs.wantsOnlineBooking === true) {
    integrations.push({ platformKey: "external_booking_provider", status: "preserve_existing", recurringCostClass: "verify_current_pricing", reasonEs: "Solo se necesita un enlace externo de reservas — no se construye un motor de citas.", reasonEn: "Only an external booking link is needed — no scheduling engine is built." });
  }
  if (inputs.wantsNativeCheckout === false) {
    integrations.push({ platformKey: "external_commerce_provider", status: "preserve_existing", recurringCostClass: "verify_current_pricing", reasonEs: "Un enlace externo de pago/pedidos es suficiente.", reasonEn: "An external payment/ordering link is enough." });
  }
  return integrations;
}

// ---------------------------------------------------------------------------------------------
// Infrastructure complexity (MD <cost_control>)
// ---------------------------------------------------------------------------------------------
function classifyComplexity(architectureClass: WebsiteArchitectureClass, database: WebsiteArchitectureDecisionPacket["database"], cms: WebsiteArchitectureDecisionPacket["cms"], externalIntegrations: readonly PlatformRecommendation[]): { level: InfrastructureComplexity; reasonEs: string; reasonEn: string } {
  if (architectureClass === "CUSTOM_PLATFORM" || database.decision === "REQUIRED") {
    return { level: "CUSTOM", reasonEs: "Requiere base de datos, autenticación o flujo de trabajo personalizado.", reasonEn: "Requires a database, authentication, or a custom workflow." };
  }
  if (architectureClass === "PRESERVE_EXISTING_PLATFORM") {
    return { level: "MODERATE", reasonEs: "Se integra con una plataforma existente en lugar de reconstruirla.", reasonEn: "Integrates with an existing platform rather than rebuilding it." };
  }
  const moderateSignals = (cms.decision === "REQUIRED" ? 1 : 0) + externalIntegrations.length;
  if (moderateSignals >= 2) {
    return { level: "HIGH", reasonEs: "Varias integraciones externas y/o operaciones de contenido complejas.", reasonEn: "Several external integrations and/or complex content operations." };
  }
  if (moderateSignals === 1) {
    return { level: "MODERATE", reasonEs: "CMS y/o una integración externa, más formularios y analítica.", reasonEn: "CMS and/or one external integration, plus forms and analytics." };
  }
  return { level: "LOW", reasonEs: "Vercel, dominio, y entrega simple de formularios.", reasonEn: "Vercel, domain, and simple form delivery." };
}

// ---------------------------------------------------------------------------------------------
// Ownership plan (MD <ownership_model>) — the client normally owns permanent business infrastructure.
// ---------------------------------------------------------------------------------------------
function buildOwnershipEntry(platformKey: string): PlatformOwnershipEntry {
  return {
    platformKey, hasAccount: "unknown", owner: "client", billingOwner: "client", recoveryOwner: "client",
    leonixAccessRequired: true, accessStatus: "not_requested", handoffRequired: true,
  };
}

function buildOwnership(packetSoFar: {
  frontend: PlatformRecommendation; hosting: PlatformRecommendation; domainDns: DomainDnsRecommendation;
  cms: WebsiteArchitectureDecisionPacket["cms"]; formsEmail: PlatformRecommendation;
  database: WebsiteArchitectureDecisionPacket["database"]; storage: WebsiteArchitectureDecisionPacket["storage"];
  preserveExistingPlatformKey: string | null;
}): readonly PlatformOwnershipEntry[] {
  const entries: PlatformOwnershipEntry[] = [];
  if (packetSoFar.domainDns.registrarPlatformKey) entries.push(buildOwnershipEntry(packetSoFar.domainDns.registrarPlatformKey));
  if (packetSoFar.hosting.platformKey && packetSoFar.hosting.status !== "not_needed") entries.push(buildOwnershipEntry(packetSoFar.hosting.platformKey));
  if (packetSoFar.cms.platformKey && packetSoFar.cms.decision !== "NOT_NEEDED") entries.push(buildOwnershipEntry(packetSoFar.cms.platformKey));
  // Gate 10.3 — MD §8.24/§12/§13/§28 all say "for every permanent platform"; formsEmail (Resend) and
  // database/storage (Supabase) previously had ZERO ownership coverage — no structured entry, no
  // handoff checklist item, no catalog field — despite both being real recurring/permanent platforms
  // once required. Reusing the exact same buildOwnershipEntry() shape, never a second ownership model.
  if (packetSoFar.formsEmail.platformKey && packetSoFar.formsEmail.status !== "not_needed") entries.push(buildOwnershipEntry(packetSoFar.formsEmail.platformKey));
  if (packetSoFar.database.decision === "REQUIRED" || packetSoFar.storage.decision === "REQUIRED") entries.push(buildOwnershipEntry("supabase"));
  if (packetSoFar.preserveExistingPlatformKey) entries.push(buildOwnershipEntry(packetSoFar.preserveExistingPlatformKey));
  return entries;
}

// ---------------------------------------------------------------------------------------------
// Top-level builder — the only exported entry point besides the small per-field deciders above
// (kept exported individually so tests can exercise each decision rule directly).
// ---------------------------------------------------------------------------------------------
export interface ArchitectureOverride {
  architectureClass: WebsiteArchitectureClass;
  preserveExistingPlatformKey?: string | null;
  reasonEs: string;
  reasonEn: string;
}

export function buildArchitectureDecisionPacket(
  ctx: WebsiteDiscoveryContext,
  scopeSignals: WebsiteScopeSignalResult,
  override?: ArchitectureOverride,
): WebsiteArchitectureDecisionPacket {
  const inputs = readArchitectureInputs(ctx);

  const classification = override
    ? { architectureClass: override.architectureClass, preserveExistingPlatformKey: override.preserveExistingPlatformKey ?? null }
    : classifyArchitecture(inputs, scopeSignals);
  const { architectureClass, preserveExistingPlatformKey } = classification;
  const isPreserve = architectureClass === "PRESERVE_EXISTING_PLATFORM";

  const frontend: PlatformRecommendation = isPreserve
    ? { platformKey: null, status: "preserve_existing", recurringCostClass: null, reasonEs: "Se preserva el frontend de la plataforma existente.", reasonEn: "The existing platform's frontend is preserved." }
    : { platformKey: "nextjs_tailwind", status: "required", recurringCostClass: "no_expected_cost", reasonEs: "Sitio web basado en código de Leonix.", reasonEn: "Leonix code-first website." };

  const hosting: PlatformRecommendation = isPreserve
    ? { platformKey: null, status: "preserve_existing", recurringCostClass: null, reasonEs: "La plataforma existente incluye su propio alojamiento.", reasonEn: "The existing platform includes its own hosting." }
    : { platformKey: "vercel", status: "required", recurringCostClass: "may_have_recurring_cost", reasonEs: "Despliegue de vista previa y producción para el sitio basado en código.", reasonEn: "Preview and production deployment for the code-first site." };

  const domainDns = decideDomainDns(inputs);
  const cms = decideCms(inputs, architectureClass);
  const formsEmail = isPreserve
    ? { platformKey: null, status: "preserve_existing" as PlatformDecisionStatus, recurringCostClass: null, reasonEs: "La plataforma existente maneja sus propios formularios.", reasonEn: "The existing platform handles its own forms." }
    : decideFormsEmail(inputs);
  const auth = decideAuth(inputs);
  const database = decideDatabase(inputs, auth);
  const storage = decideStorage(inputs, auth);
  const analytics = decideAnalytics(architectureClass);
  const externalIntegrations = decideExternalIntegrations(inputs);

  const ownership = buildOwnership({ frontend, hosting, domainDns, cms, formsEmail, database, storage, preserveExistingPlatformKey });

  const recurringServices = [frontend, hosting, formsEmail, ...analytics, ...externalIntegrations]
    .filter((r): r is PlatformRecommendation & { platformKey: string; recurringCostClass: RecurringCostClass } => Boolean(r.platformKey && r.recurringCostClass && (r.status === "required" || r.status === "preserve_existing")))
    .map((r) => ({ platformKey: r.platformKey, costClass: r.recurringCostClass }));
  if (cms.platformKey && cms.decision === "REQUIRED") recurringServices.push({ platformKey: cms.platformKey, costClass: "may_have_recurring_cost" });
  if (database.decision === "REQUIRED") recurringServices.push({ platformKey: "supabase", costClass: "may_have_recurring_cost" });

  const complexity = classifyComplexity(architectureClass, database, cms, externalIntegrations);

  const requiresLeonixArchitectureReview = scopeSignals.requiresLeonixArchitectureReview || architectureClass === "CUSTOM_PLATFORM";
  const requiresCommercialReview = architectureClass === "CUSTOM_PLATFORM";

  const reasonsEs: string[] = [frontend.reasonEs, hosting.reasonEs, domainDns.reasonEs, cms.reasonEs, formsEmail.reasonEs, database.reasonEs, auth.reasonEs, storage.reasonEs];
  const reasonsEn: string[] = [frontend.reasonEn, hosting.reasonEn, domainDns.reasonEn, cms.reasonEn, formsEmail.reasonEn, database.reasonEn, auth.reasonEn, storage.reasonEn];

  const assumptions: string[] = [];
  const unresolvedBlockers: string[] = [];
  if (inputs.wantsSelfManagedContent === null) assumptions.push("wants_self_managed_content_unknown");
  if (inputs.wantsUserAccounts === null) assumptions.push("wants_user_accounts_unknown");
  if (inputs.wantsContactForm === null) assumptions.push("wants_contact_form_unknown");
  if (domainDns.isLaunchBlocker) unresolvedBlockers.push("domain_access_unknown");
  if (database.decision === "NEEDS_REVIEW") unresolvedBlockers.push("database_needs_review");
  if (auth.decision === "NEEDS_REVIEW") unresolvedBlockers.push("auth_needs_review");

  const migrationRequired = inputs.hasExistingWebsite && !isPreserve;

  return {
    registryVersion: PLATFORM_REGISTRY_VERSION,
    discoveryCatalogVersion: WEBSITE_DISCOVERY_CATALOG_VERSION,
    discoveryId: ctx.discoveryId,
    projectIntentId: ctx.projectIntentId ?? "",
    architectureClass,
    preserveExistingPlatformKey,
    frontend, hosting, domainDns, cms, formsEmail, database, auth, storage, analytics, externalIntegrations,
    ownership,
    recurringServices,
    infrastructureComplexity: complexity.level,
    infrastructureComplexityReasonEs: complexity.reasonEs,
    infrastructureComplexityReasonEn: complexity.reasonEn,
    reasonsEs, reasonsEn, assumptions, unresolvedBlockers,
    scopeEscalationReasons: scopeSignals.reasons,
    requiresLeonixArchitectureReview,
    requiresCommercialReview,
    commercialReviewSeamMissing: requiresCommercialReview,
    migrationRequired,
    migrationNotesEs: migrationRequired ? "Existe un sitio actual que será reemplazado — planifique redirecciones y transición." : "No se requiere migración de un sitio existente.",
    migrationNotesEn: migrationRequired ? "A current site exists and will be replaced — plan redirects and transition." : "No migration from an existing site is required.",
    isOverride: Boolean(override),
    overrideReasonEs: override?.reasonEs ?? null,
    overrideReasonEn: override?.reasonEn ?? null,
  };
}

export function validatePlatformKeyOrOther(key: string, otherExplanation: string | null): boolean {
  if (isKnownPlatformKey(key) && key !== "other_external_platform") return true;
  if (key === "other_external_platform") return Boolean(otherExplanation && otherExplanation.trim().length > 0);
  return false;
}
