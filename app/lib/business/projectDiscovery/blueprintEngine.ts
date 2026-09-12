/**
 * Client Discovery & Project Blueprint Engine, Gate 5 — deterministic Website Project Blueprint
 * packet builder + readiness/staleness/drift logic. Pure functions only — no database, no
 * network, no AI-generated hidden reasoning (MD <deterministic_generation>: "Do NOT use OpenAI to
 * invent the blueprint"). Consumes the SAME WebsiteDiscoveryContext/evaluations/architecture
 * packet Gates 2-4 already build; never a second evaluation engine.
 */
import { createHash } from "node:crypto";

import { evaluateWebsiteRequirements, resolveIndustryBranch, type RequirementEvaluation, type WebsiteReadinessResult } from "./websiteDiscoveryLogic";
import { SECTION_REVIEW_GROUPS } from "./discoveryLabels";
import type { WebsiteDiscoveryContext } from "./websiteDiscoveryLogic";
import type { IndustryBranchKey, WebsiteDiscoverySection } from "./websiteDiscoveryCatalog";
import type { WebsiteArchitectureDecisionPacket } from "./architectureDecisionEngine";
import { buildArchitectureDecisionPacket } from "./architectureDecisionEngine";
import { detectWebsiteScopeSignals } from "./websiteDiscoveryLogic";
import type { DiscoveryTruthClass, ProjectDiscoveryConsent, ProjectDiscoveryIntent, ProjectDiscoverySource } from "./types";

// ---------------------------------------------------------------------------------------------
// Versioning lifecycle (MD <versioning>) — shared by the Markdown generator, the repository layer,
// and the review UI, so the five states are never redefined in more than one place.
// ---------------------------------------------------------------------------------------------
export type BlueprintStatus = "draft" | "internal_review" | "client_confirmation_needed" | "approved_for_build" | "superseded";

// ---------------------------------------------------------------------------------------------
// Blueprint readiness (MD <blueprint_readiness>)
// ---------------------------------------------------------------------------------------------
export type WebsiteBlueprintReadinessState = "READY" | "NOT_READY" | "NEEDS_LEONIX_DECISION" | "COMMERCIAL_REVIEW_REQUIRED";

export interface WebsiteBlueprintReadinessResult {
  state: WebsiteBlueprintReadinessState;
  reasonEs: string;
  reasonEn: string;
  requiredBeforeBuildBlockers: readonly RequirementEvaluation[];
  leonixDecisionsOutstanding: readonly RequirementEvaluation[];
  architectureApproved: boolean;
}

/**
 * Blueprint generation is allowed only when Gate 2's own readiness already says the client side is
 * resolved AND an approved architecture decision exists AND (for Custom Platform) the truthfully-
 * reported commercial-review placeholder is not left pending. This never re-derives Gate 2's own
 * required-before-build/Leonix-decision logic — it only adds the one new gate Gate 4 introduced.
 */
export function evaluateWebsiteBlueprintReadiness(
  readiness: WebsiteReadinessResult,
  approvedArchitecture: WebsiteArchitectureDecisionPacket | null,
): WebsiteBlueprintReadinessResult {
  if (readiness.requiredBeforeBuildBlockers.length > 0) {
    return {
      state: "NOT_READY",
      reasonEs: "Aún faltan respuestas requeridas del cliente antes de construir.",
      reasonEn: "Required client answers before build are still missing.",
      requiredBeforeBuildBlockers: readiness.requiredBeforeBuildBlockers,
      leonixDecisionsOutstanding: readiness.leonixDecisionsOutstanding,
      architectureApproved: Boolean(approvedArchitecture),
    };
  }

  if (!approvedArchitecture || readiness.leonixDecisionsOutstanding.length > 0) {
    return {
      state: "NEEDS_LEONIX_DECISION",
      reasonEs: approvedArchitecture ? "Quedan decisiones de arquitectura de Leonix pendientes." : "Aún no se ha aprobado una decisión de arquitectura.",
      reasonEn: approvedArchitecture ? "Leonix architecture decisions are still outstanding." : "No architecture decision has been approved yet.",
      requiredBeforeBuildBlockers: [],
      leonixDecisionsOutstanding: readiness.leonixDecisionsOutstanding,
      architectureApproved: Boolean(approvedArchitecture),
    };
  }

  if (approvedArchitecture.requiresCommercialReview) {
    return {
      state: "COMMERCIAL_REVIEW_REQUIRED",
      reasonEs: "Esta es una Plataforma Personalizada — se requiere revisión comercial antes de una aprobación de sitio ordinaria.",
      reasonEn: "This is a Custom Platform — commercial review is required before ordinary-website approval.",
      requiredBeforeBuildBlockers: [],
      leonixDecisionsOutstanding: [],
      architectureApproved: true,
    };
  }

  return {
    state: "READY",
    reasonEs: "Toda la información requerida y la arquitectura están resueltas.",
    reasonEn: "All required information and architecture are resolved.",
    requiredBeforeBuildBlockers: [],
    leonixDecisionsOutstanding: [],
    architectureApproved: true,
  };
}

// ---------------------------------------------------------------------------------------------
// Truth separation (MD <truth_separation>) — AI-extracted, unreviewed material is never
// authoritative; a staff observation is never rendered as client-confirmed.
// ---------------------------------------------------------------------------------------------
export function isAuthoritativeForBlueprint(e: RequirementEvaluation): boolean {
  if (e.status !== "confirmed" && e.status !== "captured_unconfirmed") return false;
  const truthClass = e.item?.truthClass;
  // An AI-extracted claim only becomes authoritative once a human has actually reviewed/confirmed it.
  if (truthClass === "ai_extracted") return e.status === "confirmed";
  return true;
}

// ---------------------------------------------------------------------------------------------
// Requirement row (the generic per-section display unit the packet uses instead of ~90 hand-named
// fields — mirrors Gate 3's own Sections Review grouping, MD <blueprint_packet>).
// ---------------------------------------------------------------------------------------------
export interface BlueprintRequirementRow {
  fieldKey: string;
  labelEs: string;
  labelEn: string;
  displayValue: string;
  truthClass: DiscoveryTruthClass;
  section: WebsiteDiscoverySection;
}

function toRow(e: RequirementEvaluation): BlueprintRequirementRow {
  return {
    fieldKey: e.requirement.fieldKey,
    labelEs: e.requirement.labelEs,
    labelEn: e.requirement.labelEn,
    displayValue: e.item?.displayValue ?? e.knownFact?.displayValue ?? "",
    truthClass: e.item?.truthClass ?? "public_verified",
    section: e.requirement.section,
  };
}

function rowsForSections(evaluations: readonly RequirementEvaluation[], sections: readonly WebsiteDiscoverySection[]): BlueprintRequirementRow[] {
  return evaluations.filter((e) => sections.includes(e.requirement.section) && isAuthoritativeForBlueprint(e)).map(toRow);
}

function findRow(evaluations: readonly RequirementEvaluation[], fieldKey: string): BlueprintRequirementRow | null {
  const e = evaluations.find((x) => x.requirement.fieldKey === fieldKey);
  return e && isAuthoritativeForBlueprint(e) ? toRow(e) : null;
}

// ---------------------------------------------------------------------------------------------
// Source traceability (MD <blueprint_packet>: SOURCE TRACEABILITY)
// ---------------------------------------------------------------------------------------------
export interface BlueprintSourceReference {
  kind: "meeting" | "source_file" | "growth_assessment" | "growth_solution" | "opportunity" | "asset" | "website_url" | "manual_note";
  id: string;
  label: string;
}

function buildSourceReferences(sources: readonly ProjectDiscoverySource[], discovery: { sourceGrowthAssessmentId: string | null; sourceGrowthSolutionId: string | null; sourceOpportunityId: string | null; sourceMeetingId: string | null }): BlueprintSourceReference[] {
  const refs: BlueprintSourceReference[] = [];
  if (discovery.sourceGrowthAssessmentId) refs.push({ kind: "growth_assessment", id: discovery.sourceGrowthAssessmentId, label: "Growth Assessment" });
  if (discovery.sourceGrowthSolutionId) refs.push({ kind: "growth_solution", id: discovery.sourceGrowthSolutionId, label: "Growth Solution" });
  if (discovery.sourceOpportunityId) refs.push({ kind: "opportunity", id: discovery.sourceOpportunityId, label: "Opportunity" });
  if (discovery.sourceMeetingId) refs.push({ kind: "meeting", id: discovery.sourceMeetingId, label: "Meeting" });
  for (const s of sources) {
    if (s.sourceType === "asset" && s.businessSourceFileId) refs.push({ kind: "source_file", id: s.businessSourceFileId, label: s.label ?? "Asset" });
    else if (s.sourceType === "website_url" && s.externalUrl) refs.push({ kind: "website_url", id: s.id, label: s.label ?? s.externalUrl });
    else if (s.sourceType === "manual") refs.push({ kind: "manual_note", id: s.id, label: "Meeting note" });
  }
  return refs;
}

// ---------------------------------------------------------------------------------------------
// Responsibilities (MD <blueprint_packet>: CLIENT RESPONSIBILITIES / LEONIX RESPONSIBILITIES) —
// deterministically derived from real packet state, never generic filler unrelated to this project.
// ---------------------------------------------------------------------------------------------
function buildClientResponsibilities(architecture: WebsiteArchitectureDecisionPacket, missingAssetsCount: number): { es: string; en: string }[] {
  const items: { es: string; en: string }[] = [];
  if (architecture.domainDns.isLaunchBlocker) items.push({ es: "Proveer acceso al dominio/DNS.", en: "Provide domain/DNS access." });
  if (missingAssetsCount > 0) items.push({ es: "Entregar los activos faltantes (logo, fotos, documentos).", en: "Deliver the missing assets (logo, photos, documents)." });
  items.push({ es: "Aprobar el contenido y las decisiones de diseño en los puntos de revisión acordados.", en: "Approve content and design decisions at the agreed review checkpoints." });
  if (architecture.ownership.some((o) => o.owner === "client")) items.push({ es: "Mantener la propiedad de las cuentas permanentes indicadas.", en: "Maintain ownership of the indicated permanent accounts." });
  return items;
}

function buildLeonixResponsibilities(architecture: WebsiteArchitectureDecisionPacket): { es: string; en: string }[] {
  const items: { es: string; en: string }[] = [
    { es: "Arquitectura, diseño, construcción, control de calidad y despliegue del sitio aprobado.", en: "Architecture, design, build, QA, and deployment of the approved site." },
  ];
  if (architecture.cms.decision === "REQUIRED") items.push({ es: "Configurar el CMS aprobado y capacitar al cliente en su uso.", en: "Set up the approved CMS and train the client on its use." });
  if (architecture.database.decision === "REQUIRED" || architecture.auth.decision === "REQUIRED") items.push({ es: "Implementar y asegurar la base de datos/autenticación aprobada.", en: "Implement and secure the approved database/authentication." });
  return items;
}

// ---------------------------------------------------------------------------------------------
// The full packet (MD <blueprint_packet>)
// ---------------------------------------------------------------------------------------------
export interface WebsiteProjectBlueprintPacket {
  // IDENTITY
  businessId: string;
  discoveryId: string;
  projectIntentId: string;
  projectType: "website";
  workingTitle: string;
  generatedAt: string;
  discoveryCatalogVersion: string;
  platformRegistryVersion: string;

  // BUSINESS CONTEXT
  businessDisplayName: string;
  businessPublicName: string | null;
  broadBusinessType: string;
  specificBusinessType: string | null;
  businessStage: string;
  businessIdentity: readonly BlueprintRequirementRow[];

  // PROJECT PURPOSE
  objective: readonly BlueprintRequirementRow[];
  primaryCta: BlueprintRequirementRow | null;
  /** Gate 10.2 — MD §14 Blueprint category #8, distinct from the Primary CTA (#7) above. */
  secondaryCtas: readonly BlueprintRequirementRow[];

  // AUDIENCE
  audience: readonly BlueprintRequirementRow[];

  // CLIENT VISION — combined brand_identity + visual_references (kept for the existing client-safe
  // projection, which reads this exact field). Gate 10.2 adds the finer MD-faithful split below
  // (#9/#10/#15/#16) as additive views over the SAME evaluations, never a second data source.
  clientVision: readonly BlueprintRequirementRow[];
  /** MD §14 #16 — brand system only (brand_identity section), separate from visual references. */
  brandSystem: readonly BlueprintRequirementRow[];
  /** MD §14 #15 — visual references only (visual_references section), separate from brand system. */
  visualReferences: readonly BlueprintRequirementRow[];
  /** MD §14 #9 — the liked/wanted subset of clientVision (fieldKey does not end in disliked/avoided). */
  clientPreferences: readonly BlueprintRequirementRow[];
  /** MD §14 #10 — the disliked/avoid subset of clientVision. */
  clientDislikes: readonly BlueprintRequirementRow[];

  // CONTENT
  content: readonly BlueprintRequirementRow[];
  /** MD §14 #14 — the subset of `content` that specifically answers who must WRITE the copy (copy_ownership), surfaced as its own category alongside the broader content inventory (#13). */
  requiredContentCreation: readonly BlueprintRequirementRow[];

  // ASSETS
  assets: readonly { label: string; sourceType: string; externalUrl: string | null; notes: string | null }[];
  missingAssets: readonly BlueprintRequirementRow[];

  // SITE STRUCTURE
  siteStructure: readonly BlueprintRequirementRow[];

  // FUNCTIONAL REQUIREMENTS
  forms: readonly BlueprintRequirementRow[];
  functionalRequirements: readonly BlueprintRequirementRow[];

  // TECHNICAL DECISIONS (approved architecture — MD <architecture_drift>: always the APPROVED one)
  architecture: WebsiteArchitectureDecisionPacket;
  /**
   * Gate 10.6 — the raw client-provided domain answers (owner, desired new domain, registrar/
   * renewal/auto-renew/who-pays, alternate domains). Previously only the architecture engine's own
   * SYNTHESIZED domainDns recommendation (kind/registrarPlatformKey/reason) was rendered in the
   * Blueprint (#23) — none of the actual captured text (an actual domain name, a real registrar
   * name, a real renewal date, real alternate domains) ever reached the document a builder reads,
   * a real information-loss gap between discovery and the execution contract. Rendered alongside
   * the architecture decision in #23, never replacing it.
   */
  domainDetails: readonly BlueprintRequirementRow[];
  /**
   * Gate 10.6 — the raw client-provided ownership answer (e.g. "for each account we set up, who
   * should be the permanent owner?" — often an actual name/email). The structured
   * `architecture.ownership` array (rendered in #31) only ever carries a CATEGORICAL owner
   * (client/leonix/shared) since Gate 10.3's `buildOwnership()` — a real person's name/email the
   * client gave during discovery, if any, never reached the document. Rendered alongside the
   * structured per-platform entries in #31, never replacing them.
   */
  ownershipDetails: readonly BlueprintRequirementRow[];
  /** Gate 10.6 — same class of gap as domainDetails/ownershipDetails: the raw hosting_deployment
   * answers (billing owner name/email, existing-site transition plan replace-vs-preserve) never
   * reached the document — only the architecture's own frontend/hosting platform choice did. */
  hostingDetails: readonly BlueprintRequirementRow[];

  // SEO / ANALYTICS
  seo: readonly BlueprintRequirementRow[];
  analyticsRequirements: readonly BlueprintRequirementRow[];

  // ACCESSIBILITY / LANGUAGE
  accessibility: readonly BlueprintRequirementRow[];
  languages: readonly BlueprintRequirementRow[];

  // PRIVACY / OFFICIAL RESEARCH
  privacyLegal: readonly BlueprintRequirementRow[];
  officialResearchOutstanding: readonly BlueprintRequirementRow[];

  // MAINTENANCE (MD §14 #32) — previously captured in discovery but never surfaced in the packet.
  maintenance: readonly BlueprintRequirementRow[];

  // SCOPE
  inScopeSummary: string;
  outOfScopeSummary: string;
  futureOptional: readonly BlueprintRequirementRow[];

  // RESPONSIBILITIES
  clientResponsibilities: readonly { es: string; en: string }[];
  leonixResponsibilities: readonly { es: string; en: string }[];

  // DEPENDENCIES (MD <multi_project_dependency>)
  dependencies: readonly { intentId: string; projectType: string; title: string; status: string }[];

  // SCHEDULE
  schedule: readonly BlueprintRequirementRow[];

  // UNRESOLVED ITEMS
  unresolvedBeforeLaunch: readonly BlueprintRequirementRow[];
  unresolvedClientActions: readonly BlueprintRequirementRow[];
  unresolvedLeonixActions: readonly BlueprintRequirementRow[];
  unresolvedNonBlocking: readonly BlueprintRequirementRow[];

  // SOURCE TRACEABILITY
  sourceReferences: readonly BlueprintSourceReference[];

  // BUILD CONTRACT (MD <build_gates>, <acceptance_criteria>, <qa_matrix>, <launch_checklist>,
  // <handoff_checklist>) — computed once at generation time from the SAME frozen packet fields
  // above, so an approved version's build contract can never silently drift.
  industryBranch: IndustryBranchKey | null;
  buildGates: readonly BlueprintBuildGate[];
  acceptanceCriteria: readonly BlueprintTextItem[];
  qaMatrix: readonly BlueprintQaRow[];
  launchChecklist: readonly BlueprintTextItem[];
  handoffChecklist: readonly BlueprintTextItem[];
}

// ---------------------------------------------------------------------------------------------
// Build gates / acceptance / QA / launch / handoff (MD <build_gates> et al.) — project-specific,
// rule-based, never a hardcoded single-client template applied to every site.
// ---------------------------------------------------------------------------------------------
export interface BlueprintBuildGate {
  key: string;
  titleEs: string;
  titleEn: string;
  itemsEs: readonly string[];
  itemsEn: readonly string[];
}

export interface BlueprintTextItem {
  key: string;
  textEs: string;
  textEn: string;
}

export interface BlueprintQaRow {
  key: string;
  labelEs: string;
  labelEn: string;
  conditional: boolean;
}

function ctaAcceptance(primaryCta: BlueprintRequirementRow | null): BlueprintTextItem[] {
  if (!primaryCta) return [];
  const value = primaryCta.displayValue.toLowerCase();
  const items: BlueprintTextItem[] = [
    { key: "cta_visible", textEs: "La llamada a la acción principal es visible en cada página relevante.", textEn: "The primary call to action is visible on every relevant page." },
  ];
  if (value.includes("call") || value.includes("llamar")) {
    items.push({ key: "cta_call", textEs: "El número de teléfono es correcto y funciona al tocar en móvil.", textEn: "The phone number is correct and works on mobile tap." });
  }
  if (value.includes("listen") || value.includes("escuchar")) {
    items.push({ key: "cta_listen_live", textEs: "El stream de Escuchar en Vivo inicia correctamente, con comportamiento de respaldo si falla.", textEn: "The Listen Live stream launches correctly, with fallback behavior if it fails." });
    items.push({ key: "cta_listen_live_mobile", textEs: "Escuchar en Vivo funciona en móvil.", textEn: "Listen Live works on mobile." });
  }
  if (value.includes("book") || value.includes("reserv")) {
    items.push({ key: "cta_booking", textEs: "El botón de reservar dirige al proveedor externo correcto — nunca a un programador interno falso.", textEn: "The booking button goes to the correct external provider — never a fake internal scheduler." });
  }
  if (value.includes("order") || value.includes("orden")) {
    items.push({ key: "cta_order", textEs: "El botón de ordenar dirige a la plataforma de pedidos correcta.", textEn: "The order button goes to the correct ordering platform." });
  }
  return items;
}

function formsAcceptance(forms: readonly BlueprintRequirementRow[]): BlueprintTextItem[] {
  if (forms.length === 0) return [];
  return [
    { key: "form_required_fields", textEs: "El formulario exige los campos requeridos antes de enviarse.", textEn: "The form requires its required fields before submitting." },
    { key: "form_success_state", textEs: "El formulario muestra un estado de éxito claro al enviarse.", textEn: "The form shows a clear success state on submission." },
    { key: "form_failure_state", textEs: "El formulario muestra un estado de error claro si falla el envío.", textEn: "The form shows a clear failure state if submission fails." },
    { key: "form_recipient", textEs: "Las respuestas llegan al destinatario correcto confirmado en el descubrimiento.", textEn: "Submissions reach the correct recipient confirmed during discovery." },
    { key: "form_spam_protection", textEs: "El formulario tiene protección contra spam.", textEn: "The form has spam protection." },
    { key: "form_sensitive_data", textEs: "El formulario no recopila información sensible no autorizada.", textEn: "The form does not collect unauthorized sensitive information." },
  ];
}

function bilingualAcceptance(languages: readonly BlueprintRequirementRow[]): BlueprintTextItem[] {
  const bilingual = languages.find((l) => l.fieldKey === "bilingual_site_needed" && /s[ií]|yes|true/i.test(l.displayValue));
  if (!bilingual) return [];
  return [
    { key: "bilingual_navigation", textEs: "La navegación y el contenido se comportan correctamente en ambos idiomas.", textEn: "Navigation and content behave correctly in both languages." },
    { key: "bilingual_no_mixed_copy", textEs: "No hay contenido mezclado o sin traducir de forma no intencional.", textEn: "No unintended mixed or untranslated copy exists." },
  ];
}

function cmsAcceptance(cms: WebsiteArchitectureDecisionPacket["cms"]): BlueprintTextItem[] {
  if (cms.decision !== "REQUIRED") return [];
  return [{ key: "cms_editor_can_update", textEs: "El editor designado puede actualizar el tipo de contenido previsto en el CMS.", textEn: "The intended editor can update the intended content type in the CMS." }];
}

function buildAcceptanceCriteria(packet: Pick<WebsiteProjectBlueprintPacket, "primaryCta" | "forms" | "languages" | "architecture">): BlueprintTextItem[] {
  return [
    ...ctaAcceptance(packet.primaryCta),
    ...formsAcceptance(packet.forms),
    ...bilingualAcceptance(packet.languages),
    ...cmsAcceptance(packet.architecture.cms),
  ];
}

function buildQaMatrix(packet: Pick<WebsiteProjectBlueprintPacket, "forms" | "languages" | "architecture" | "functionalRequirements">): BlueprintQaRow[] {
  const universal: BlueprintQaRow[] = [
    { key: "desktop", labelEs: "Escritorio", labelEn: "Desktop", conditional: false },
    { key: "tablet", labelEs: "Tableta", labelEn: "Tablet", conditional: false },
    { key: "mobile_390", labelEs: "Móvil 390px", labelEn: "390px Mobile", conditional: false },
    { key: "navigation", labelEs: "Navegación", labelEn: "Navigation", conditional: false },
    { key: "cta_destinations", labelEs: "Destinos de CTA", labelEn: "CTA destinations", conditional: false },
    { key: "images_assets", labelEs: "Imágenes/activos", labelEn: "Images/assets", conditional: false },
    { key: "accessibility", labelEs: "Accesibilidad", labelEn: "Accessibility", conditional: false },
    { key: "metadata_seo", labelEs: "Metadatos/SEO", labelEn: "Metadata/SEO", conditional: false },
    { key: "error_states", labelEs: "Estados de error", labelEn: "Error states", conditional: false },
    { key: "production_domain", labelEs: "Dominio de producción", labelEn: "Production domain", conditional: false },
    { key: "no_placeholder_content", labelEs: "Sin contenido de relleno", labelEn: "No placeholder content", conditional: false },
    { key: "ownership_access", labelEs: "Propiedad/acceso", labelEn: "Ownership/access", conditional: false },
    { key: "performance", labelEs: "Rendimiento", labelEn: "Performance", conditional: false },
  ];
  const conditional: BlueprintQaRow[] = [];
  if (packet.forms.length > 0) conditional.push({ key: "forms", labelEs: "Formularios", labelEn: "Forms", conditional: true }, { key: "external_links", labelEs: "Enlaces externos", labelEn: "External links", conditional: true });
  if (packet.languages.some((l) => l.fieldKey === "bilingual_site_needed")) conditional.push({ key: "bilingual", labelEs: "Comportamiento bilingüe", labelEn: "Bilingual behavior", conditional: true });
  if (packet.functionalRequirements.some((r) => r.section === "booking_scheduling")) conditional.push({ key: "booking", labelEs: "Reservas", labelEn: "Booking", conditional: true });
  if (packet.functionalRequirements.some((r) => r.section === "payments_commerce")) conditional.push({ key: "ordering_commerce", labelEs: "Pedidos/comercio", labelEn: "Ordering/commerce", conditional: true });
  if (packet.architecture.cms.decision === "REQUIRED") conditional.push({ key: "cms", labelEs: "CMS", labelEn: "CMS", conditional: true });
  if (packet.architecture.auth.decision === "REQUIRED") conditional.push({ key: "auth", labelEs: "Autenticación", labelEn: "Auth", conditional: true }, { key: "dashboard", labelEs: "Panel", labelEn: "Dashboard", conditional: true });
  if (packet.architecture.externalIntegrations.length > 0) conditional.push({ key: "integrations", labelEs: "Integraciones", labelEn: "Integrations", conditional: true });
  if (packet.architecture.analytics.some((a) => a.status === "required")) conditional.push({ key: "analytics", labelEs: "Analítica", labelEn: "Analytics", conditional: true });
  if (packet.functionalRequirements.some((r) => r.section === "payments_commerce")) conditional.push({ key: "billing", labelEs: "Facturación", labelEn: "Billing", conditional: true });
  return [...universal, ...conditional];
}

function buildLaunchChecklist(packet: Pick<WebsiteProjectBlueprintPacket, "architecture" | "forms" | "unresolvedBeforeLaunch">): BlueprintTextItem[] {
  const items: BlueprintTextItem[] = [
    { key: "content_approved", textEs: "Contenido del cliente aprobado.", textEn: "Client content approved." },
    { key: "public_contact_verified", textEs: "Información pública de contacto verificada.", textEn: "Public contact info verified." },
  ];
  if (packet.architecture.domainDns.kind !== "unknown") items.push({ key: "domain_control", textEs: "Control del dominio disponible.", textEn: "Domain control available." });
  if (packet.architecture.hosting.status === "required") items.push({ key: "dns_target", textEs: "Objetivo de DNS aprobado.", textEn: "DNS target approved." }, { key: "production_env", textEs: "Entorno de producción configurado.", textEn: "Production environment configured." });
  if (packet.forms.length > 0) items.push({ key: "form_recipient_verified", textEs: "Destinatario del formulario verificado.", textEn: "Form recipient verified." });
  if (packet.architecture.analytics.some((a) => a.status === "required")) items.push({ key: "analytics_ownership", textEs: "Propiedad de la analítica confirmada.", textEn: "Analytics ownership confirmed." });
  if (packet.architecture.migrationRequired) items.push({ key: "redirects_mapped", textEs: "Redirecciones del sitio anterior mapeadas.", textEn: "Redirects from the old site mapped." });
  items.push({ key: "accessibility_qa", textEs: "Control de calidad de accesibilidad completado.", textEn: "Accessibility QA completed." }, { key: "smoke_test", textEs: "Prueba de humo en producción realizada.", textEn: "Production smoke test performed." }, { key: "client_launch_approval", textEs: "Aprobación de lanzamiento del cliente obtenida.", textEn: "Client launch approval obtained." });
  return items;
}

function buildHandoffChecklist(packet: Pick<WebsiteProjectBlueprintPacket, "architecture">): BlueprintTextItem[] {
  const items: BlueprintTextItem[] = [{ key: "production_url", textEs: "URL de producción registrada.", textEn: "Production URL recorded." }];
  for (const o of packet.architecture.ownership) {
    items.push({ key: `owner_${o.platformKey}`, textEs: `Propietario y acceso de ${o.platformKey} confirmados.`, textEn: `${o.platformKey} owner and access confirmed.` });
  }
  items.push(
    { key: "billing_responsibility", textEs: "Responsabilidad de facturación explícita.", textEn: "Billing responsibility explicit." },
    { key: "renewal_responsibility", textEs: "Responsabilidad de renovación explícita.", textEn: "Renewal responsibility explicit." },
    { key: "recovery_admin", textEs: "Responsable de recuperación/administración explícito.", textEn: "Recovery/admin responsibility explicit." },
    { key: "client_access", textEs: "Acceso del cliente confirmado.", textEn: "Client access confirmed." },
    { key: "leonix_access", textEs: "Acceso de Leonix confirmado.", textEn: "Leonix access confirmed." },
    { key: "edit_instructions", textEs: "Instrucciones de edición entregadas si aplica.", textEn: "Edit instructions delivered if applicable." },
    { key: "support_arrangement", textEs: "Arreglo de soporte acordado.", textEn: "Support arrangement agreed." },
    { key: "final_blueprint_version", textEs: "Versión final del blueprint registrada.", textEn: "Final blueprint version recorded." },
    { key: "launch_date", textEs: "Fecha de lanzamiento registrada.", textEn: "Launch date recorded." },
  );
  return items;
}

function buildProjectSpecificGates(packet: Pick<WebsiteProjectBlueprintPacket, "architecture" | "siteStructure" | "forms" | "functionalRequirements" | "industryBranch">): BlueprintBuildGate[] {
  const gates: BlueprintBuildGate[] = [];
  const isCustomPlatform = packet.architecture.architectureClass === "CUSTOM_PLATFORM";

  gates.push({
    key: "foundation", titleEs: "GATE 1 — FUNDAMENTOS", titleEn: "GATE 1 — FOUNDATION",
    itemsEs: [`Configuración del repositorio/proyecto (${packet.architecture.frontend.platformKey ?? "plataforma existente"}).`, "Tokens de diseño y layout base.", `Supuestos de arquitectura de dominio (${packet.architecture.domainDns.kind}).`],
    itemsEn: [`Repository/project setup (${packet.architecture.frontend.platformKey ?? "existing platform"}).`, "Design tokens and base layout.", `Domain architecture assumptions (${packet.architecture.domainDns.kind}).`],
  });

  if (isCustomPlatform) {
    gates.push(
      { key: "data_model_auth", titleEs: "GATE 2 — MODELO DE DATOS Y AUTENTICACIÓN", titleEn: "GATE 2 — DATA MODEL & AUTH", itemsEs: ["Modelo de base de datos.", "Autenticación y roles."], itemsEn: ["Database model.", "Authentication and roles."] },
      { key: "core_workflow", titleEs: "GATE 3 — FLUJO DE TRABAJO PRINCIPAL DE LA APLICACIÓN", titleEn: "GATE 3 — CORE APPLICATION WORKFLOW", itemsEs: ["Flujo de trabajo/estado personalizado central."], itemsEn: ["Central custom workflow/state."] },
    );
  } else {
    gates.push({ key: "core_content", titleEs: "GATE 2 — CONTENIDO PRINCIPAL / PÁGINA DE INICIO", titleEn: "GATE 2 — CORE CONTENT / HOMEPAGE", itemsEs: ["Página de inicio con las secciones confirmadas."], itemsEn: ["Homepage with confirmed sections."] });
    if (packet.siteStructure.length > 0) {
      gates.push({ key: "secondary_sections", titleEs: "GATE 3 — SECCIONES/PÁGINAS SECUNDARIAS", titleEn: "GATE 3 — SECONDARY SECTIONS / PAGES", itemsEs: packet.siteStructure.map((r) => r.displayValue || r.labelEs), itemsEn: packet.siteStructure.map((r) => r.displayValue || r.labelEn) });
    }
  }

  if (packet.forms.length > 0 || packet.functionalRequirements.length > 0) {
    gates.push({
      key: "forms_integrations", titleEs: "GATE 4 — FORMULARIOS / INTEGRACIONES", titleEn: "GATE 4 — FORMS / INTEGRATIONS",
      itemsEs: [...packet.forms.map((f) => f.displayValue || f.labelEs), ...packet.functionalRequirements.map((f) => f.displayValue || f.labelEs)].filter(Boolean),
      itemsEn: [...packet.forms.map((f) => f.displayValue || f.labelEn), ...packet.functionalRequirements.map((f) => f.displayValue || f.labelEn)].filter(Boolean),
    });
  }

  gates.push({ key: "responsive_accessibility", titleEs: "GATE 5 — RESPONSIVO / ACCESIBILIDAD", titleEn: "GATE 5 — RESPONSIVE / ACCESSIBILITY", itemsEs: ["Contrato estructural de 390px.", "Accesibilidad básica (teclado, contraste, alt text)."], itemsEn: ["390px structural contract.", "Baseline accessibility (keyboard, contrast, alt text)."] });
  gates.push({ key: "seo_analytics", titleEs: "GATE 6 — SEO / ANALÍTICA", titleEn: "GATE 6 — SEO / ANALYTICS", itemsEs: ["Metadatos y datos estructurados.", "Analítica aprobada configurada."], itemsEn: ["Metadata and structured data.", "Approved analytics configured."] });
  gates.push({ key: "client_review", titleEs: "GATE 7 — REVISIÓN DEL CLIENTE", titleEn: "GATE 7 — CLIENT REVIEW", itemsEs: ["Revisión segura para el cliente antes del lanzamiento."], itemsEn: ["Client-safe review before launch."] });
  gates.push({ key: "release_handoff", titleEs: "GATE 8 — LANZAMIENTO / ENTREGA", titleEn: "GATE 8 — RELEASE / HANDOFF", itemsEs: ["Lanzamiento a producción y entrega registrada."], itemsEn: ["Production launch and recorded handoff."] });

  return gates;
}

const SITE_STRUCTURE_SECTIONS: readonly WebsiteDiscoverySection[] = ["page_architecture"];
const CONTENT_SECTIONS: readonly WebsiteDiscoverySection[] = ["content", "offers_services_products", "media_assets"];
const CLIENT_VISION_SECTIONS: readonly WebsiteDiscoverySection[] = ["brand_identity", "visual_references"];
const FUNCTIONAL_SECTIONS: readonly WebsiteDiscoverySection[] = ["booking_scheduling", "payments_commerce", "backend_database_auth", "cms", "social_presence"];

export function buildWebsiteProjectBlueprintPacket(input: {
  ctx: WebsiteDiscoveryContext;
  discovery: { title: string; sourceGrowthAssessmentId: string | null; sourceGrowthSolutionId: string | null; sourceOpportunityId: string | null; sourceMeetingId: string | null };
  intents: readonly ProjectDiscoveryIntent[];
  selectedIntentId: string;
  sources: readonly ProjectDiscoverySource[];
  approvedArchitecture: WebsiteArchitectureDecisionPacket;
  businessDisplayName: string;
  businessPublicName: string | null;
}): WebsiteProjectBlueprintPacket {
  const { ctx, discovery, intents, selectedIntentId, sources, approvedArchitecture, businessDisplayName, businessPublicName } = input;
  const evaluations = evaluateWebsiteRequirements(ctx);

  const assets = sources
    .filter((s) => s.sourceType === "asset" || s.sourceType === "website_url")
    .map((s) => ({ label: s.label ?? (s.sourceType === "asset" ? "Asset" : "Reference"), sourceType: s.sourceType, externalUrl: s.externalUrl, notes: s.notes }));

  const missingAssets = evaluations.filter((e) => e.requirement.section === "media_assets" && (e.status === "missing" || e.status === "needs_confirmation"));

  const inScopeItem = findRow(evaluations, "in_scope_summary");
  const outOfScopeItem = findRow(evaluations, "out_of_scope_summary");

  const dependencies = intents
    .filter((i) => i.id !== selectedIntentId)
    .map((i) => ({ intentId: i.id, projectType: i.projectType, title: i.title, status: i.status }));

  const unresolvedBeforeLaunch = evaluations.filter((e) => e.requirement.defaultCompletenessClass === "required_before_launch" && (e.status === "missing" || e.status === "needs_confirmation"));
  const unresolvedClientActions = unresolvedBeforeLaunch.filter((e) => e.requirement.whoShouldAnswer === "CLIENT");
  const unresolvedLeonixActions = evaluations.filter((e) => (e.requirement.defaultCompletenessClass === "needs_leonix_decision") && (e.status === "missing"));
  // "Non-blocking" here mirrors Gate 2's own helpfulMissing bucket exactly — required_before_build
  // gaps can never reach this point (blueprint readiness already refuses generation while any
  // exist), so "non-blocking" only ever means HELPFUL items left uncaptured.
  const unresolvedNonBlocking = evaluations.filter((e) => e.requirement.defaultCompletenessClass === "helpful" && e.status === "missing");
  // FUTURE / OPTIONAL is Gate 2's own "optional" completeness class verbatim — "useful only if
  // relevant," i.e. an idea worth preserving but never part of the current delivery.
  const futureOptional = evaluations.filter((e) => e.requirement.defaultCompletenessClass === "optional");
  const officialResearchOutstanding = evaluations.filter((e) => e.requirement.defaultCompletenessClass === "needs_official_research" && e.status === "missing");
  const industryBranch = resolveIndustryBranch(ctx);

  const forms = rowsForSections(evaluations, ["forms"]);
  const functionalRequirements = rowsForSections(evaluations, FUNCTIONAL_SECTIONS);
  const languages = rowsForSections(evaluations, ["languages"]);
  const siteStructure = rowsForSections(evaluations, SITE_STRUCTURE_SECTIONS);
  const primaryCta = findRow(evaluations, "primary_cta_type");
  const secondaryCtaRow = findRow(evaluations, "secondary_ctas");
  const secondaryCtas = secondaryCtaRow ? [secondaryCtaRow] : [];
  const maintenance = rowsForSections(evaluations, ["maintenance"]);
  const brandSystem = rowsForSections(evaluations, ["brand_identity"]);
  const visualReferences = rowsForSections(evaluations, ["visual_references"]);
  const isDislikeFieldKey = (fieldKey: string) => /disliked|avoided/i.test(fieldKey);
  const clientPreferences = [...brandSystem, ...visualReferences].filter((r) => !isDislikeFieldKey(r.fieldKey));
  const clientDislikes = [...brandSystem, ...visualReferences].filter((r) => isDislikeFieldKey(r.fieldKey));
  const copyOwnershipRow = findRow(evaluations, "copy_ownership");
  const requiredContentCreation = copyOwnershipRow ? [copyOwnershipRow] : [];
  const acceptanceCriteria = buildAcceptanceCriteria({ primaryCta, forms, languages, architecture: approvedArchitecture });
  const qaMatrix = buildQaMatrix({ forms, languages, architecture: approvedArchitecture, functionalRequirements });
  const launchChecklist = buildLaunchChecklist({ architecture: approvedArchitecture, forms, unresolvedBeforeLaunch: unresolvedBeforeLaunch.map(toRow) });
  const handoffChecklist = buildHandoffChecklist({ architecture: approvedArchitecture });
  const buildGates = buildProjectSpecificGates({ architecture: approvedArchitecture, siteStructure, forms, functionalRequirements, industryBranch });

  return {
    businessId: ctx.businessId,
    discoveryId: ctx.discoveryId,
    projectIntentId: selectedIntentId,
    projectType: "website",
    workingTitle: discovery.title,
    generatedAt: new Date().toISOString(),
    discoveryCatalogVersion: approvedArchitecture.discoveryCatalogVersion,
    platformRegistryVersion: approvedArchitecture.registryVersion,

    businessDisplayName,
    businessPublicName,
    broadBusinessType: ctx.broadBusinessType,
    specificBusinessType: ctx.specificBusinessType,
    businessStage: ctx.businessStage,
    businessIdentity: rowsForSections(evaluations, ["business_identity"]),

    objective: rowsForSections(evaluations, ["website_objective"]),
    primaryCta,
    secondaryCtas,

    audience: rowsForSections(evaluations, ["audience"]),
    clientVision: rowsForSections(evaluations, CLIENT_VISION_SECTIONS),
    brandSystem,
    visualReferences,
    clientPreferences,
    clientDislikes,
    content: rowsForSections(evaluations, CONTENT_SECTIONS),
    requiredContentCreation,

    assets,
    missingAssets: missingAssets.map(toRow),

    siteStructure,

    forms,
    functionalRequirements,

    architecture: approvedArchitecture,
    domainDetails: rowsForSections(evaluations, ["domain"]),
    ownershipDetails: rowsForSections(evaluations, ["ownership_billing"]),
    hostingDetails: rowsForSections(evaluations, ["hosting_deployment"]),

    seo: rowsForSections(evaluations, ["seo"]),
    analyticsRequirements: rowsForSections(evaluations, ["analytics"]),

    accessibility: rowsForSections(evaluations, ["accessibility"]),
    languages,

    privacyLegal: rowsForSections(evaluations, ["privacy_legal"]),
    officialResearchOutstanding: officialResearchOutstanding.map(toRow),

    maintenance,

    inScopeSummary: inScopeItem?.displayValue ?? "",
    outOfScopeSummary: outOfScopeItem?.displayValue ?? "",
    futureOptional: futureOptional.map(toRow),
    clientResponsibilities: buildClientResponsibilities(approvedArchitecture, missingAssets.length).map((r) => r),
    leonixResponsibilities: buildLeonixResponsibilities(approvedArchitecture),

    dependencies,
    schedule: rowsForSections(evaluations, ["schedule_approvals"]),

    unresolvedBeforeLaunch: unresolvedBeforeLaunch.map(toRow),
    unresolvedClientActions: unresolvedClientActions.map(toRow),
    unresolvedLeonixActions: unresolvedLeonixActions.map(toRow),
    unresolvedNonBlocking: unresolvedNonBlocking.map(toRow),

    sourceReferences: buildSourceReferences(sources, discovery),

    industryBranch,
    buildGates,
    acceptanceCriteria,
    qaMatrix,
    launchChecklist,
    handoffChecklist,
  };
}

// ---------------------------------------------------------------------------------------------
// Deterministic input fingerprint (MD <staleness>) — never a raw timestamp comparison.
// ---------------------------------------------------------------------------------------------
export function computeBlueprintInputFingerprint(ctx: WebsiteDiscoveryContext, approvedArchitecture: WebsiteArchitectureDecisionPacket): string {
  const stableItems = [...ctx.capturedItems]
    .sort((a, b) => a.fieldKey.localeCompare(b.fieldKey) || (a.projectIntentId ?? "").localeCompare(b.projectIntentId ?? ""))
    .map((i) => `${i.fieldKey}:${i.projectIntentId ?? ""}:${JSON.stringify(i.value)}:${i.truthClass}:${i.confirmationState}`);
  const architectureFingerprint = `${approvedArchitecture.architectureClass}:${approvedArchitecture.preserveExistingPlatformKey ?? ""}:${approvedArchitecture.cms.decision}:${approvedArchitecture.database.decision}:${approvedArchitecture.auth.decision}:${approvedArchitecture.formsEmail.status}`;
  const payload = JSON.stringify({ items: stableItems, architectureFingerprint });
  return createHash("sha256").update(payload).digest("hex");
}

// ---------------------------------------------------------------------------------------------
// Architecture drift (MD <architecture_drift>) — never invalidates approval automatically.
// ---------------------------------------------------------------------------------------------
export interface ArchitectureDriftField {
  fieldEs: string;
  fieldEn: string;
  approvedValue: string;
  currentValue: string;
}

export interface ArchitectureDriftResult {
  hasDrifted: boolean;
  changedFields: readonly ArchitectureDriftField[];
}

export function detectArchitectureDrift(approved: WebsiteArchitectureDecisionPacket, current: WebsiteArchitectureDecisionPacket): ArchitectureDriftResult {
  const changed: ArchitectureDriftField[] = [];
  const compare = (fieldEs: string, fieldEn: string, a: string, c: string) => {
    if (a !== c) changed.push({ fieldEs, fieldEn, approvedValue: a, currentValue: c });
  };
  compare("Clasificación de arquitectura", "Architecture classification", approved.architectureClass, current.architectureClass);
  compare("CMS", "CMS", approved.cms.decision, current.cms.decision);
  compare("Base de datos", "Database", approved.database.decision, current.database.decision);
  compare("Autenticación", "Auth", approved.auth.decision, current.auth.decision);
  compare("Formularios/Correo", "Forms/Email", approved.formsEmail.status, current.formsEmail.status);
  compare("Alojamiento", "Hosting", approved.hosting.status, current.hosting.status);
  return { hasDrifted: changed.length > 0, changedFields: changed };
}

/** Recomputes the LIVE (unapproved) recommendation for drift comparison only — never used as the blueprint's own architecture source (MD: "Blueprint generation must use the APPROVED architecture"). */
export function recomputeLiveArchitectureForDriftCheck(ctx: WebsiteDiscoveryContext): WebsiteArchitectureDecisionPacket {
  return buildArchitectureDecisionPacket(ctx, detectWebsiteScopeSignals(ctx));
}

// Re-exported for convenience so callers only need one import for the common "sections" grouping.
export { SECTION_REVIEW_GROUPS };
export type { ProjectDiscoveryConsent };
