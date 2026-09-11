/**
 * Client Discovery & Project Blueprint Engine, Gate 6 — deterministic blueprint packet builder for
 * the specialized (non-Website) project families (MD <project_blueprint_framework>).
 *
 * BusinessProjectBlueprintPacket = LogoBrand | PrintCollateral | MediaCampaign, a discriminated
 * union on `projectType`, sharing one common base shape (identity, business context, objective,
 * audience, assets, scope, responsibilities, dependencies, unresolved items, source traceability,
 * build gates, acceptance criteria, QA matrix, launch/handoff checklists) — the same conceptual
 * shape Gate 5's WebsiteProjectBlueprintPacket already uses, deliberately NOT the same TypeScript
 * type (Website's packet stays untouched to avoid any Gate 5 regression risk; blueprintRepository
 * .ts's BusinessProjectBlueprint is generic over the packet type, so both live safely side by side
 * in the same table via blueprint_type).
 *
 * Pure functions only — no database, no network, no AI-generated hidden reasoning.
 */
import { createHash } from "node:crypto";

import type { DiscoveryTruthClass, ProjectDiscoveryIntent, ProjectDiscoverySource } from "./types";
import type {
  SpecializedDiscoveryContext,
  SpecializedRequirementDefinition,
  SpecializedRequirementEvaluation,
  SpecializedReadinessResult,
} from "./specializedDiscoveryEngine";
import { evaluateSpecializedRequirements } from "./specializedDiscoveryEngine";
import type { BlueprintSourceReference } from "./blueprintEngine";
import type { LogoBrandSection } from "./logoBrandDiscoveryCatalog";
import type { PrintCollateralSection } from "./printCollateralDiscoveryCatalog";
import type { CampaignSection } from "./campaignDiscoveryCatalog";

// ---------------------------------------------------------------------------------------------
// Blueprint readiness (MD <project_readiness>) — a generic wrapper over SpecializedReadinessResult
// that ALSO factors in cross-intent dependencies (MD <dependency_engine>), never re-deriving the
// underlying requirement completeness logic itself.
// ---------------------------------------------------------------------------------------------
export type SpecializedBlueprintReadinessState = "READY" | "NOT_READY" | "NEEDS_LEONIX_DECISION" | "DEPENDENCY_BLOCKED";

export interface BlockingDependencySummary {
  dependsOnIntentId: string;
  dependsOnTitle: string;
  reasonEs: string;
  reasonEn: string;
}

export interface SpecializedBlueprintReadinessResult {
  state: SpecializedBlueprintReadinessState;
  reasonEs: string;
  reasonEn: string;
  requiredBeforeBuildBlockers: readonly SpecializedRequirementEvaluation[];
  leonixDecisionsOutstanding: readonly SpecializedRequirementEvaluation[];
  blockingDependencies: readonly BlockingDependencySummary[];
}

export function evaluateProjectBlueprintReadiness(
  readiness: SpecializedReadinessResult,
  blockingDependencies: readonly BlockingDependencySummary[],
): SpecializedBlueprintReadinessResult {
  if (readiness.requiredBeforeBuildBlockers.length > 0) {
    return {
      state: "NOT_READY",
      reasonEs: "Aún faltan respuestas requeridas del cliente antes de construir.",
      reasonEn: "Required client answers before build are still missing.",
      requiredBeforeBuildBlockers: readiness.requiredBeforeBuildBlockers,
      leonixDecisionsOutstanding: readiness.leonixDecisionsOutstanding,
      blockingDependencies: [],
    };
  }
  if (readiness.leonixDecisionsOutstanding.length > 0) {
    return {
      state: "NEEDS_LEONIX_DECISION",
      reasonEs: "Quedan decisiones de Leonix pendientes.",
      reasonEn: "Leonix decisions are still outstanding.",
      requiredBeforeBuildBlockers: [],
      leonixDecisionsOutstanding: readiness.leonixDecisionsOutstanding,
      blockingDependencies: [],
    };
  }
  if (blockingDependencies.length > 0) {
    return {
      state: "DEPENDENCY_BLOCKED",
      reasonEs: "Este proyecto está esperando a que otro proyecto termine primero.",
      reasonEn: "This project is waiting on another project to finish first.",
      requiredBeforeBuildBlockers: [],
      leonixDecisionsOutstanding: [],
      blockingDependencies,
    };
  }
  return {
    state: "READY",
    reasonEs: "Toda la información requerida está resuelta y no hay dependencias pendientes.",
    reasonEn: "All required information is resolved and no dependencies are outstanding.",
    requiredBeforeBuildBlockers: [],
    leonixDecisionsOutstanding: [],
    blockingDependencies: [],
  };
}

// ---------------------------------------------------------------------------------------------
// Truth separation (identical contract to blueprintEngine.ts's own isAuthoritativeForBlueprint).
// ---------------------------------------------------------------------------------------------
export function isAuthoritativeForSpecializedBlueprint(e: SpecializedRequirementEvaluation): boolean {
  if (e.status !== "confirmed" && e.status !== "captured_unconfirmed") return false;
  const truthClass = e.item?.truthClass;
  if (truthClass === "ai_extracted") return e.status === "confirmed";
  return true;
}

export interface SpecializedBlueprintRow {
  fieldKey: string;
  labelEs: string;
  labelEn: string;
  displayValue: string;
  truthClass: DiscoveryTruthClass;
  section: string;
}

function toRow(e: SpecializedRequirementEvaluation): SpecializedBlueprintRow {
  return {
    fieldKey: e.requirement.fieldKey,
    labelEs: e.requirement.labelEs,
    labelEn: e.requirement.labelEn,
    displayValue: e.item?.displayValue ?? e.knownFact?.displayValue ?? "",
    truthClass: e.item?.truthClass ?? "public_verified",
    section: e.requirement.section,
  };
}

function rowsForSections(evaluations: readonly SpecializedRequirementEvaluation[], sections: readonly string[]): SpecializedBlueprintRow[] {
  return evaluations.filter((e) => sections.includes(e.requirement.section) && isAuthoritativeForSpecializedBlueprint(e)).map(toRow);
}

function findRow(evaluations: readonly SpecializedRequirementEvaluation[], fieldKey: string): SpecializedBlueprintRow | null {
  const e = evaluations.find((x) => x.requirement.fieldKey === fieldKey);
  return e && isAuthoritativeForSpecializedBlueprint(e) ? toRow(e) : null;
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
// Build gates / acceptance / QA / launch / handoff — generic small helpers shared by every family.
// ---------------------------------------------------------------------------------------------
export interface SpecializedBuildGate {
  key: string;
  titleEs: string;
  titleEn: string;
  itemsEs: readonly string[];
  itemsEn: readonly string[];
}

export interface SpecializedTextItem {
  key: string;
  textEs: string;
  textEn: string;
}

export interface SpecializedQaRow {
  key: string;
  labelEs: string;
  labelEn: string;
  conditional: boolean;
}

function bilingualBullets(items: readonly { es: string; en: string }[]): { es: string; en: string }[] {
  return items.map((i) => ({ ...i }));
}

// ---------------------------------------------------------------------------------------------
// Common base packet shape.
// ---------------------------------------------------------------------------------------------
interface SpecializedBlueprintBase {
  businessId: string;
  discoveryId: string;
  projectIntentId: string;
  workingTitle: string;
  generatedAt: string;
  catalogVersion: string;

  businessDisplayName: string;
  businessPublicName: string | null;
  broadBusinessType: string;
  specificBusinessType: string | null;
  businessStage: string;

  objective: readonly SpecializedBlueprintRow[];
  audience: readonly SpecializedBlueprintRow[];

  assets: readonly { label: string; sourceType: string; externalUrl: string | null; notes: string | null }[];
  missingAssets: readonly SpecializedBlueprintRow[];

  inScopeSummary: string;
  outOfScopeSummary: string;
  futureOptional: readonly SpecializedBlueprintRow[];

  clientResponsibilities: readonly { es: string; en: string }[];
  leonixResponsibilities: readonly { es: string; en: string }[];

  dependencies: readonly { intentId: string; projectType: string; title: string; status: string }[];

  unresolvedBeforeLaunch: readonly SpecializedBlueprintRow[];
  unresolvedClientActions: readonly SpecializedBlueprintRow[];
  unresolvedLeonixActions: readonly SpecializedBlueprintRow[];
  unresolvedNonBlocking: readonly SpecializedBlueprintRow[];

  sourceReferences: readonly BlueprintSourceReference[];

  buildGates: readonly SpecializedBuildGate[];
  acceptanceCriteria: readonly SpecializedTextItem[];
  qaMatrix: readonly SpecializedQaRow[];
  launchChecklist: readonly SpecializedTextItem[];
  handoffChecklist: readonly SpecializedTextItem[];
}

export interface LogoBrandBlueprintPacket extends SpecializedBlueprintBase {
  projectType: "logo_brand_identity";
  brandName: readonly SpecializedBlueprintRow[];
  projectKind: readonly SpecializedBlueprintRow[];
  brandPersonality: readonly SpecializedBlueprintRow[];
  visualDirection: readonly SpecializedBlueprintRow[];
  existingIdentity: readonly SpecializedBlueprintRow[];
  deliverables: readonly SpecializedBlueprintRow[];
}

export interface PrintCollateralBlueprintPacket extends SpecializedBlueprintBase {
  projectType: "business_cards" | "flyer" | "banner_signage" | "referral_materials";
  brandDependency: readonly SpecializedBlueprintRow[];
  layoutContent: readonly SpecializedBlueprintRow[];
  specification: readonly SpecializedBlueprintRow[];
  production: readonly SpecializedBlueprintRow[];
}

export interface MediaCampaignBlueprintPacket extends SpecializedBlueprintBase {
  projectType: "campaign_creative" | "sponsored_editorial" | "media_exposure_campaign";
  offerMessage: readonly SpecializedBlueprintRow[];
  cta: readonly SpecializedBlueprintRow[];
  channels: readonly SpecializedBlueprintRow[];
  timing: readonly SpecializedBlueprintRow[];
  creative: readonly SpecializedBlueprintRow[];
  measurement: readonly SpecializedBlueprintRow[];
}

export type SpecializedProjectBlueprintPacket = LogoBrandBlueprintPacket | PrintCollateralBlueprintPacket | MediaCampaignBlueprintPacket;

// ---------------------------------------------------------------------------------------------
// Shared base-field computation.
// ---------------------------------------------------------------------------------------------
interface BuildBaseInput<TSection extends string> {
  ctx: SpecializedDiscoveryContext;
  catalog: readonly SpecializedRequirementDefinition<TSection>[];
  catalogVersion: string;
  discovery: { title: string; sourceGrowthAssessmentId: string | null; sourceGrowthSolutionId: string | null; sourceOpportunityId: string | null; sourceMeetingId: string | null };
  intents: readonly ProjectDiscoveryIntent[];
  sources: readonly ProjectDiscoverySource[];
  businessDisplayName: string;
  businessPublicName: string | null;
  objectiveSections: readonly TSection[];
  audienceSections: readonly TSection[];
  assetSections: readonly TSection[];
  inScopeFieldKey?: string;
  outOfScopeFieldKey?: string;
  clientResponsibilities: readonly { es: string; en: string }[];
  leonixResponsibilities: readonly { es: string; en: string }[];
  buildGates: readonly SpecializedBuildGate[];
  acceptanceCriteria: readonly SpecializedTextItem[];
  qaMatrix: readonly SpecializedQaRow[];
  launchChecklist: readonly SpecializedTextItem[];
  handoffChecklist: readonly SpecializedTextItem[];
}

function buildBase<TSection extends string>(input: BuildBaseInput<TSection>): { base: SpecializedBlueprintBase; evaluations: readonly SpecializedRequirementEvaluation<TSection>[] } {
  const { ctx, catalog, discovery, intents, sources } = input;
  const evaluations = evaluateSpecializedRequirements(catalog, ctx);

  const assets = sources
    .filter((s) => s.sourceType === "asset" || s.sourceType === "website_url")
    .map((s) => ({ label: s.label ?? (s.sourceType === "asset" ? "Asset" : "Reference"), sourceType: s.sourceType, externalUrl: s.externalUrl, notes: s.notes }));

  const missingAssets = evaluations.filter((e) => input.assetSections.includes(e.requirement.section) && (e.status === "missing" || e.status === "needs_confirmation"));

  const inScopeItem = input.inScopeFieldKey ? findRow(evaluations, input.inScopeFieldKey) : null;
  const outOfScopeItem = input.outOfScopeFieldKey ? findRow(evaluations, input.outOfScopeFieldKey) : null;

  const dependencies = intents
    .filter((i) => i.id !== ctx.projectIntentId)
    .map((i) => ({ intentId: i.id, projectType: i.projectType, title: i.title, status: i.status }));

  const unresolvedBeforeLaunch = evaluations.filter((e) => e.requirement.defaultCompletenessClass === "required_before_launch" && (e.status === "missing" || e.status === "needs_confirmation"));
  const unresolvedClientActions = unresolvedBeforeLaunch.filter((e) => e.requirement.whoShouldAnswer === "CLIENT");
  const unresolvedLeonixActions = evaluations.filter((e) => e.requirement.defaultCompletenessClass === "needs_leonix_decision" && e.status === "missing");
  const unresolvedNonBlocking = evaluations.filter((e) => e.requirement.defaultCompletenessClass === "helpful" && e.status === "missing");
  const futureOptional = evaluations.filter((e) => e.requirement.defaultCompletenessClass === "optional");

  const base: SpecializedBlueprintBase = {
    businessId: ctx.businessId,
    discoveryId: ctx.discoveryId,
    projectIntentId: ctx.projectIntentId ?? "",
    workingTitle: discovery.title,
    generatedAt: new Date().toISOString(),
    catalogVersion: input.catalogVersion,

    businessDisplayName: input.businessDisplayName,
    businessPublicName: input.businessPublicName,
    broadBusinessType: ctx.broadBusinessType,
    specificBusinessType: ctx.specificBusinessType,
    businessStage: ctx.businessStage,

    objective: rowsForSections(evaluations, input.objectiveSections),
    audience: rowsForSections(evaluations, input.audienceSections),

    assets,
    missingAssets: missingAssets.map(toRow),

    inScopeSummary: inScopeItem?.displayValue ?? "",
    outOfScopeSummary: outOfScopeItem?.displayValue ?? "",
    futureOptional: futureOptional.map(toRow),

    clientResponsibilities: bilingualBullets(input.clientResponsibilities),
    leonixResponsibilities: bilingualBullets(input.leonixResponsibilities),

    dependencies,

    unresolvedBeforeLaunch: unresolvedBeforeLaunch.map(toRow),
    unresolvedClientActions: unresolvedClientActions.map(toRow),
    unresolvedLeonixActions: unresolvedLeonixActions.map(toRow),
    unresolvedNonBlocking: unresolvedNonBlocking.map(toRow),

    sourceReferences: buildSourceReferences(sources, discovery),

    buildGates: input.buildGates,
    acceptanceCriteria: input.acceptanceCriteria,
    qaMatrix: input.qaMatrix,
    launchChecklist: input.launchChecklist,
    handoffChecklist: input.handoffChecklist,
  };

  return { base, evaluations };
}

// ---------------------------------------------------------------------------------------------
// LOGO / BRAND
// ---------------------------------------------------------------------------------------------
export interface SpecializedBlueprintCommonInput<TSection extends string> {
  ctx: SpecializedDiscoveryContext;
  catalog: readonly SpecializedRequirementDefinition<TSection>[];
  catalogVersion: string;
  discovery: { title: string; sourceGrowthAssessmentId: string | null; sourceGrowthSolutionId: string | null; sourceOpportunityId: string | null; sourceMeetingId: string | null };
  intents: readonly ProjectDiscoveryIntent[];
  sources: readonly ProjectDiscoverySource[];
  businessDisplayName: string;
  businessPublicName: string | null;
}

function genericClientResponsibilities(missingAssetsCount: number): { es: string; en: string }[] {
  const items: { es: string; en: string }[] = [];
  if (missingAssetsCount > 0) items.push({ es: "Entregar los activos faltantes.", en: "Deliver the missing assets." });
  items.push({ es: "Aprobar el contenido y las decisiones de diseño en los puntos de revisión acordados.", en: "Approve content and design decisions at the agreed review checkpoints." });
  return items;
}

const GENERIC_LEONIX_RESPONSIBILITIES: readonly { es: string; en: string }[] = [
  { es: "Ejecutar el trabajo aprobado según el alcance y las decisiones registradas en este plan.", en: "Execute the approved work per the scope and decisions recorded in this blueprint." },
];

function genericBuildGates(titleEs: string, titleEn: string, itemsEs: readonly string[], itemsEn: readonly string[]): SpecializedBuildGate[] {
  return [
    { key: "foundation", titleEs: "PUERTA 1 — FUNDAMENTOS", titleEn: "GATE 1 — FOUNDATION", itemsEs: ["Dirección/alcance confirmado."], itemsEn: ["Direction/scope confirmed."] },
    { key: "core", titleEs, titleEn, itemsEs, itemsEn },
    { key: "client_review", titleEs: "PUERTA 3 — REVISIÓN DEL CLIENTE", titleEn: "GATE 3 — CLIENT REVIEW", itemsEs: ["Revisión y aprobación del cliente."], itemsEn: ["Client review and approval."] },
    { key: "handoff", titleEs: "PUERTA 4 — ENTREGA", titleEn: "GATE 4 — HANDOFF", itemsEs: ["Entrega final registrada."], itemsEn: ["Final handoff recorded."] },
  ];
}

const GENERIC_QA_UNIVERSAL: readonly SpecializedQaRow[] = [
  { key: "content_accuracy", labelEs: "Exactitud del contenido", labelEn: "Content accuracy", conditional: false },
  { key: "brand_consistency", labelEs: "Consistencia de marca", labelEn: "Brand consistency", conditional: false },
  { key: "spelling_grammar", labelEs: "Ortografía / gramática", labelEn: "Spelling / grammar", conditional: false },
  { key: "client_approval", labelEs: "Aprobación del cliente", labelEn: "Client approval", conditional: false },
];

export function buildLogoBrandBlueprintPacket(input: SpecializedBlueprintCommonInput<LogoBrandSection>): LogoBrandBlueprintPacket {
  const { base, evaluations } = buildBase({
    ...input,
    objectiveSections: ["purpose"],
    audienceSections: ["audience"],
    assetSections: ["assets"],
    inScopeFieldKey: "logo_in_scope_summary",
    outOfScopeFieldKey: "logo_out_of_scope_summary",
    clientResponsibilities: genericClientResponsibilities(0),
    leonixResponsibilities: GENERIC_LEONIX_RESPONSIBILITIES,
    buildGates: genericBuildGates(
      "PUERTA 2 — CONCEPTOS DE DISEÑO", "GATE 2 — DESIGN CONCEPTS",
      ["Conceptos iniciales de logo basados en la dirección de marca aprobada."], ["Initial logo concepts based on the approved brand direction."],
    ),
    acceptanceCriteria: [
      { key: "name_correct", textEs: "El nombre y la capitalización coinciden exactamente con lo confirmado.", textEn: "The name and capitalization exactly match what was confirmed." },
      { key: "deliverables_complete", textEs: "Todos los entregables solicitados están incluidos.", textEn: "All requested deliverables are included." },
      { key: "restrictions_respected", textEs: "Ningún símbolo/contenido prohibido aparece en el diseño final.", textEn: "No prohibited symbol/content appears in the final design." },
    ],
    qaMatrix: [...GENERIC_QA_UNIVERSAL, { key: "scalability", labelEs: "Legibilidad en tamaño pequeño", labelEn: "Legibility at small size", conditional: false }],
    launchChecklist: [
      { key: "final_files_delivered", textEs: "Archivos finales entregados en los formatos acordados.", textEn: "Final files delivered in the agreed formats." },
      { key: "client_launch_approval", textEs: "Aprobación final del cliente obtenida.", textEn: "Client final approval obtained." },
    ],
    handoffChecklist: [
      { key: "source_files_delivered", textEs: "Archivos fuente entregados o archivados según corresponda.", textEn: "Source files delivered or archived as appropriate." },
      { key: "final_blueprint_version", textEs: "Versión final del plan registrada.", textEn: "Final blueprint version recorded." },
    ],
  });

  return {
    ...base,
    projectType: "logo_brand_identity",
    brandName: rowsForSections(evaluations, ["brand_name"]),
    projectKind: rowsForSections(evaluations, ["project_type"]),
    brandPersonality: rowsForSections(evaluations, ["brand_personality"]),
    visualDirection: rowsForSections(evaluations, ["visual_direction"]),
    existingIdentity: rowsForSections(evaluations, ["existing_identity"]),
    deliverables: rowsForSections(evaluations, ["deliverables"]),
  };
}

// ---------------------------------------------------------------------------------------------
// PRINT COLLATERAL
// ---------------------------------------------------------------------------------------------
export function buildPrintCollateralBlueprintPacket(
  input: SpecializedBlueprintCommonInput<PrintCollateralSection> & { projectType: "business_cards" | "flyer" | "banner_signage" | "referral_materials" },
): PrintCollateralBlueprintPacket {
  // Evaluated once here (pure, cheap) so the conditional preflight QA rows below can see the real
  // layoutContent rows — buildBase() would otherwise only compute evaluations AFTER qaMatrix is
  // already decided, too late to react to e.g. a QR destination actually being captured.
  const preEvaluations = evaluateSpecializedRequirements(input.catalog, input.ctx);
  const preLayoutContent = rowsForSections(preEvaluations, ["contact_content", "layout_content"]);
  const preflightQa = buildPrintPreflightQa({ specification: [], production: [], layoutContent: preLayoutContent });

  const { base, evaluations } = buildBase({
    ...input,
    objectiveSections: ["layout_content"],
    audienceSections: [],
    assetSections: ["assets"],
    clientResponsibilities: genericClientResponsibilities(0),
    leonixResponsibilities: GENERIC_LEONIX_RESPONSIBILITIES,
    buildGates: genericBuildGates(
      "PUERTA 2 — DISEÑO", "GATE 2 — DESIGN",
      ["Diseño de la pieza según el contenido y la especificación confirmados."], ["Piece design per the confirmed content and specification."],
    ),
    acceptanceCriteria: [
      { key: "contact_info_correct", textEs: "Toda la información de contacto mostrada es correcta.", textEn: "All displayed contact information is correct." },
      { key: "cta_visible", textEs: "El llamado a la acción es visible y claro.", textEn: "The call to action is visible and clear." },
    ],
    qaMatrix: [...GENERIC_QA_UNIVERSAL, { key: "preflight", labelEs: "Preflight de impresión", labelEn: "Print preflight", conditional: false }, ...preflightQa],
    launchChecklist: [
      { key: "final_files_delivered", textEs: "Archivos finales listos para producción.", textEn: "Final files ready for production." },
      { key: "client_launch_approval", textEs: "Aprobación final del cliente obtenida.", textEn: "Client final approval obtained." },
    ],
    handoffChecklist: [
      { key: "production_files_delivered", textEs: "Archivos de producción entregados.", textEn: "Production files delivered." },
      { key: "final_blueprint_version", textEs: "Versión final del plan registrada.", textEn: "Final blueprint version recorded." },
    ],
  });

  return {
    ...base,
    projectType: input.projectType,
    brandDependency: rowsForSections(evaluations, ["brand_dependency"]),
    layoutContent: rowsForSections(evaluations, ["contact_content", "layout_content"]),
    specification: rowsForSections(evaluations, ["specification"]),
    production: rowsForSections(evaluations, ["production"]),
  };
}

/** MD <print_preflight_qa> — a small preflight checklist appended once the packet's own specification/production rows are known. */
export function buildPrintPreflightQa(packet: Pick<PrintCollateralBlueprintPacket, "specification" | "production" | "layoutContent">): SpecializedQaRow[] {
  const rows: SpecializedQaRow[] = [
    { key: "dimensions_confirmed", labelEs: "Dimensiones confirmadas", labelEn: "Dimensions confirmed", conditional: false },
    { key: "bleed_safe_area", labelEs: "Sangrado / área segura", labelEn: "Bleed / safe area", conditional: false },
    { key: "resolution_quality", labelEs: "Resolución / calidad de imagen", labelEn: "Resolution / image quality", conditional: false },
  ];
  // print_qr_destination's catalog section is "layout_content", not "specification" — checked here
  // rather than in packet.specification, which would never contain it.
  if (packet.layoutContent.some((r) => r.fieldKey === "print_qr_destination" && r.displayValue)) {
    rows.push({ key: "qr_scans_correctly", labelEs: "El código QR escanea correctamente", labelEn: "QR code scans correctly", conditional: true });
  }
  return rows;
}

// ---------------------------------------------------------------------------------------------
// MEDIA CAMPAIGN
// ---------------------------------------------------------------------------------------------
export function buildMediaCampaignBlueprintPacket(
  input: SpecializedBlueprintCommonInput<CampaignSection> & { projectType: "campaign_creative" | "sponsored_editorial" | "media_exposure_campaign" },
): MediaCampaignBlueprintPacket {
  const { base, evaluations } = buildBase({
    ...input,
    objectiveSections: ["objective"],
    audienceSections: ["audience"],
    assetSections: ["creative"],
    clientResponsibilities: genericClientResponsibilities(0),
    leonixResponsibilities: [
      ...GENERIC_LEONIX_RESPONSIBILITIES,
      { es: "Nunca presentar un canal recomendado como inventario vendido o confirmado hasta que el estado comercial real lo confirme.", en: "Never present a recommended channel as sold/confirmed inventory until the real commercial state confirms it." },
    ],
    buildGates: genericBuildGates(
      "PUERTA 2 — CREATIVO Y CANALES", "GATE 2 — CREATIVE & CHANNELS",
      ["Creativo de campaña preparado para los canales solicitados (sujeto a confirmación de canal)."], ["Campaign creative prepared for the requested channels (pending channel confirmation)."],
    ),
    acceptanceCriteria: [
      { key: "message_consistent", textEs: "El mensaje es consistente en todos los canales aprobados.", textEn: "The message is consistent across every approved channel." },
      { key: "cta_functional", textEs: "El llamado a la acción funciona correctamente en cada canal.", textEn: "The call to action works correctly on every channel." },
      { key: "no_unconfirmed_inventory_claim", textEs: "Ningún material presenta un canal socio como inventario confirmado sin verificación real.", textEn: "No material presents a partner channel as confirmed inventory without real verification." },
    ],
    qaMatrix: [...GENERIC_QA_UNIVERSAL, { key: "cta_destinations", labelEs: "Destinos del CTA", labelEn: "CTA destinations", conditional: false }],
    launchChecklist: [
      { key: "channels_confirmed", textEs: "Los canales finales están confirmados (no solo solicitados).", textEn: "Final channels are confirmed (not just requested)." },
      { key: "client_launch_approval", textEs: "Aprobación final del cliente obtenida.", textEn: "Client final approval obtained." },
    ],
    handoffChecklist: [
      { key: "measurement_plan_recorded", textEs: "Plan de medición registrado.", textEn: "Measurement plan recorded." },
      { key: "final_blueprint_version", textEs: "Versión final del plan registrada.", textEn: "Final blueprint version recorded." },
    ],
  });

  return {
    ...base,
    projectType: input.projectType,
    offerMessage: rowsForSections(evaluations, ["offer_message"]),
    cta: rowsForSections(evaluations, ["cta"]),
    channels: rowsForSections(evaluations, ["channels"]),
    timing: rowsForSections(evaluations, ["timing"]),
    creative: rowsForSections(evaluations, ["creative"]),
    measurement: rowsForSections(evaluations, ["measurement"]),
  };
}

// ---------------------------------------------------------------------------------------------
// Deterministic input fingerprint (MD <staleness>) — never a raw timestamp comparison. Generic
// across every specialized family: unlike Website, there is no separate "approved architecture" to
// fold in, so this hashes the sorted captured items alone (mirrors
// blueprintEngine.ts#computeBlueprintInputFingerprint's own item-hashing half exactly).
// ---------------------------------------------------------------------------------------------
export function computeSpecializedBlueprintInputFingerprint(ctx: SpecializedDiscoveryContext): string {
  const stableItems = [...ctx.capturedItems]
    .sort((a, b) => a.fieldKey.localeCompare(b.fieldKey) || (a.projectIntentId ?? "").localeCompare(b.projectIntentId ?? ""))
    .map((i) => `${i.fieldKey}:${i.projectIntentId ?? ""}:${JSON.stringify(i.value)}:${i.truthClass}:${i.confirmationState}`);
  const payload = JSON.stringify({ items: stableItems });
  return createHash("sha256").update(payload).digest("hex");
}
