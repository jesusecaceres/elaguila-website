/**
 * Client Discovery & Project Blueprint Engine, Gate 5 — deterministic Markdown rendering of a
 * WebsiteProjectBlueprintPacket (MD <deterministic_generation>, <markdown_structure>). Pure string
 * building only: no OpenAI call, no randomness, no wall-clock read beyond the packet's own frozen
 * `generatedAt` — the SAME packet in always produces the SAME Markdown out.
 *
 * Sections that have nothing to say are omitted entirely rather than emitted as "N/A" spam (MD:
 * "never empty N/A section spam — omit or state concisely when inapplicable").
 */
import type { BlueprintBuildGate, BlueprintQaRow, BlueprintRequirementRow, BlueprintStatus, BlueprintTextItem, WebsiteProjectBlueprintPacket } from "./blueprintEngine";
import { redactCredentialLikeText } from "./blueprintRedaction";
import {
  accessStatusLabel,
  architectureClassLabel,
  binaryDecisionLabel,
  blueprintStatusLabel,
  cmsDecisionLabel,
  formatBilingual,
  hasAccountLabel,
  ownershipOwnerLabel,
  platformDecisionStatusLabel,
  recurringCostClassLabel,
  storageDecisionLabel,
} from "./discoveryLabels";
import type { DiscoveryTruthClass } from "./types";

// ---------------------------------------------------------------------------------------------
// Truth-separation labels (MD <truth_separation>) — the EXACT tag set required on the frozen
// build-contract document. Deliberately a SEPARATE mapping from discoveryLabels.ts's
// truthClassLabel(): that one serves the live, editable Sections Review UI; this one serves an
// immutable snapshot and must never let an unreviewed AI claim read as anything but excluded
// (isAuthoritativeForBlueprint already drops ai_extracted/unknown before a row is ever built, so
// those two branches below exist only as a defensive fallback, never an expected path).
// ---------------------------------------------------------------------------------------------
const BLUEPRINT_TRUTH_TAGS: Record<DiscoveryTruthClass, string> = {
  client_confirmed: "CLIENT SAID / EL CLIENTE DIJO",
  client_preference: "CLIENT PREFERENCE / PREFERENCIA DEL CLIENTE",
  staff_observation: "LEONIX INTERPRETATION / INTERPRETACIÓN DE LEONIX",
  technical_decision: "LEONIX TECHNICAL DECISION / DECISIÓN TÉCNICA DE LEONIX",
  leonix_recommendation: "LEONIX TECHNICAL DECISION / DECISIÓN TÉCNICA DE LEONIX",
  public_verified: "PUBLIC-VERIFIED / VERIFICADO PÚBLICAMENTE",
  needs_confirmation: "NEEDS CONFIRMATION / NECESITA CONFIRMACIÓN",
  unknown: "NEEDS CONFIRMATION / NECESITA CONFIRMACIÓN",
  ai_extracted: "NEEDS CONFIRMATION / NECESITA CONFIRMACIÓN",
};

function truthTag(truthClass: DiscoveryTruthClass): string {
  return `[${BLUEPRINT_TRUTH_TAGS[truthClass]}]`;
}

function s(value: string): string {
  return redactCredentialLikeText(value);
}

function rowLine(row: BlueprintRequirementRow): string {
  const value = row.displayValue.trim();
  const valueText = value.length > 0 ? s(value) : "_(sin valor / no value)_";
  return `- **${row.labelEs} / ${row.labelEn}:** ${valueText} ${truthTag(row.truthClass)}`;
}

function rows(list: readonly BlueprintRequirementRow[]): string {
  return list.map(rowLine).join("\n");
}

function textItems(list: readonly BlueprintTextItem[]): string {
  return list.map((i) => `- ${s(i.textEs)} / ${s(i.textEn)}`).join("\n");
}

function bilingualBullets(list: readonly { es: string; en: string }[]): string {
  return list.map((i) => `- ${s(i.es)} / ${s(i.en)}`).join("\n");
}

/** Omits the section entirely when body is empty/whitespace-only — never "N/A" spam. */
function section(n: number, titleEs: string, titleEn: string, body: string): string {
  if (body.trim().length === 0) return "";
  return `## ${n}. ${titleEs} / ${titleEn}\n\n${body.trim()}\n`;
}

function buildGatesBlock(gates: readonly BlueprintBuildGate[]): string {
  return gates
    .map((g) => {
      const lines = g.itemsEs.map((es, idx) => `  - ${s(es)} / ${s(g.itemsEn[idx] ?? es)}`).join("\n");
      return `### ${g.titleEs} / ${g.titleEn}\n${lines}`;
    })
    .join("\n\n");
}

function qaMatrixBlock(list: readonly BlueprintQaRow[]): string {
  const header = "| Área de prueba / Test area | Condicional / Conditional |\n| --- | --- |";
  const body = list.map((r) => `| ${r.labelEs} / ${r.labelEn} | ${r.conditional ? "Sí / Yes" : "No"} |`).join("\n");
  return `${header}\n${body}`;
}

function ownershipBlock(architecture: WebsiteProjectBlueprintPacket["architecture"]): string {
  if (architecture.ownership.length === 0) return "";
  return architecture.ownership
    .map((o) => {
      const owner = formatBilingual(ownershipOwnerLabel(o.owner));
      const access = formatBilingual(accessStatusLabel(o.accessStatus));
      const hasAccount = formatBilingual(hasAccountLabel(o.hasAccount));
      return `- **${o.platformKey}** — Propietario/Owner: ${owner}; Cuenta existente/Has account: ${hasAccount}; Acceso/Access: ${access}${o.handoffRequired ? "; Requiere entrega/Handoff required" : ""}`;
    })
    .join("\n");
}

function recurringServicesBlock(architecture: WebsiteProjectBlueprintPacket["architecture"]): string {
  if (architecture.recurringServices.length === 0) return "";
  return architecture.recurringServices.map((r) => `- ${r.platformKey}: ${formatBilingual(recurringCostClassLabel(r.costClass))}`).join("\n");
}

function externalIntegrationsBlock(architecture: WebsiteProjectBlueprintPacket["architecture"]): string {
  if (architecture.externalIntegrations.length === 0) return "";
  return architecture.externalIntegrations
    .map((p) => `- ${p.platformKey ?? "(sin especificar / unspecified)"} — ${formatBilingual(platformDecisionStatusLabel(p.status))}: ${s(p.reasonEs)} / ${s(p.reasonEn)}`)
    .join("\n");
}

function technicalArchitectureBlock(architecture: WebsiteProjectBlueprintPacket["architecture"]): string {
  const lines: string[] = [
    `- **Clasificación de arquitectura / Architecture classification:** ${formatBilingual(architectureClassLabel(architecture.architectureClass))} ${truthTag("technical_decision")}`,
    `- **Frontend/Hosting:** ${architecture.frontend.platformKey ?? "—"} / ${architecture.hosting.platformKey ?? "—"} — ${formatBilingual(platformDecisionStatusLabel(architecture.hosting.status))}`,
    `- **CMS:** ${formatBilingual(cmsDecisionLabel(architecture.cms.decision))}${architecture.cms.platformKey ? ` (${architecture.cms.platformKey})` : ""}`,
    `- **Base de datos / Database:** ${formatBilingual(binaryDecisionLabel(architecture.database.decision))}`,
    `- **Autenticación / Auth:** ${formatBilingual(binaryDecisionLabel(architecture.auth.decision))}`,
    `- **Almacenamiento / Storage:** ${formatBilingual(storageDecisionLabel(architecture.storage.decision))}`,
    `- **Complejidad de infraestructura / Infrastructure complexity:** ${architecture.infrastructureComplexity} — ${s(architecture.infrastructureComplexityReasonEs)} / ${s(architecture.infrastructureComplexityReasonEn)}`,
  ];
  if (architecture.migrationRequired) {
    lines.push(`- **Migración / Migration:** ${s(architecture.migrationNotesEs)} / ${s(architecture.migrationNotesEn)}`);
  }
  if (architecture.requiresCommercialReview) {
    lines.push("- **⚠ REVISIÓN COMERCIAL REQUERIDA / COMMERCIAL REVIEW REQUIRED** — esta es una Plataforma Personalizada sin proceso de aprobación comercial establecido todavía; no debe tratarse como aprobación ordinaria. / This is a Custom Platform with no established commercial-approval process yet; must not be treated as ordinary approval.");
  }
  return lines.join("\n");
}

function formsIntegrationsBlock(packet: WebsiteProjectBlueprintPacket): string {
  const parts: string[] = [];
  if (packet.forms.length > 0) parts.push(`**Formularios / Forms**\n${rows(packet.forms)}`);
  if (packet.functionalRequirements.length > 0) parts.push(`**Requerimientos funcionales / Functional requirements**\n${rows(packet.functionalRequirements)}`);
  const integrations = externalIntegrationsBlock(packet.architecture);
  if (integrations) parts.push(`**Proveedores externos / External providers**\n${integrations}`);
  const recurring = recurringServicesBlock(packet.architecture);
  if (recurring) parts.push(`**Costos recurrentes potenciales / Potential recurring costs**\n${recurring}`);
  return parts.join("\n\n");
}

function dependenciesBlock(packet: WebsiteProjectBlueprintPacket): string {
  const parts: string[] = [];
  if (packet.dependencies.length > 0) {
    parts.push(packet.dependencies.map((d) => `- ${d.title} (${d.projectType}) — ${d.status}`).join("\n"));
  }
  if (packet.architecture.unresolvedBlockers.length > 0) {
    parts.push(`**Bloqueadores de acceso / Access blockers:** ${packet.architecture.unresolvedBlockers.join(", ")}`);
  }
  return parts.join("\n\n");
}

function unresolvedBlock(packet: WebsiteProjectBlueprintPacket): string {
  const parts: string[] = [];
  if (packet.unresolvedBeforeLaunch.length > 0) {
    parts.push(`**[UNRESOLVED-BEFORE-LAUNCH / SIN RESOLVER ANTES DE LANZAR]**\n${rows(packet.unresolvedBeforeLaunch)}`);
  }
  if (packet.unresolvedLeonixActions.length > 0) {
    parts.push(`**Decisiones de Leonix pendientes / Outstanding Leonix decisions**\n${rows(packet.unresolvedLeonixActions)}`);
  }
  if (packet.unresolvedNonBlocking.length > 0) {
    parts.push(`**No bloqueante / Non-blocking**\n${rows(packet.unresolvedNonBlocking)}`);
  }
  if (packet.officialResearchOutstanding.length > 0) {
    parts.push(`**Investigación oficial pendiente / Official research outstanding**\n${rows(packet.officialResearchOutstanding)}`);
  }
  return parts.join("\n\n");
}

function sourceReferencesBlock(packet: WebsiteProjectBlueprintPacket): string {
  if (packet.sourceReferences.length === 0) return "";
  return packet.sourceReferences.map((r) => `- ${r.label} (${r.kind})`).join("\n");
}

function definitionOfDoneBlock(packet: WebsiteProjectBlueprintPacket): string {
  const blockers = packet.unresolvedBeforeLaunch.length + packet.unresolvedLeonixActions.length;
  const lines = [
    "- El sitio cumple con todos los criterios de aceptación listados arriba. / The site meets every acceptance criterion listed above.",
    "- Todas las filas de la matriz de control de calidad fueron ejecutadas. / Every QA matrix row has been executed.",
    "- Todos los elementos de la lista de lanzamiento están completos. / Every launch checklist item is complete.",
    "- Todos los elementos de la lista de entrega están completos. / Every handoff checklist item is complete.",
    blockers > 0
      ? `- ⚠ Hay ${blockers} elemento(s) sin resolver antes del lanzamiento — deben resolverse antes de la Definición de Terminado. / ⚠ ${blockers} unresolved-before-launch item(s) remain — must be resolved before Definition of Done.`
      : "- No quedan elementos sin resolver antes del lanzamiento. / No unresolved-before-launch items remain.",
  ];
  return lines.join("\n");
}

/**
 * Renders the full 31-section blueprint Markdown document. Deterministic: given the same packet,
 * version, and status, this always returns byte-identical output.
 */
export function buildWebsiteProjectBlueprintMarkdown(packet: WebsiteProjectBlueprintPacket, meta: { version: number; status: BlueprintStatus }): string {
  const statusLabel = formatBilingual(blueprintStatusLabel(meta.status));
  const header = [
    "# LEONIX WEBSITE PROJECT BLUEPRINT / PLAN DEL PROYECTO DE SITIO WEB LEONIX",
    "",
    `**Versión / Version:** ${meta.version}`,
    `**Estado / Status:** ${statusLabel}`,
    `**Generado / Generated:** ${packet.generatedAt}`,
    `**Negocio / Business:** ${s(packet.businessDisplayName)}${packet.businessPublicName ? ` (${s(packet.businessPublicName)})` : ""}`,
    `**Título de trabajo / Working title:** ${s(packet.workingTitle)}`,
    `**Catálogo/Registro / Catalog/Registry:** ${packet.discoveryCatalogVersion} · ${packet.platformRegistryVersion}`,
    "",
    "> Este documento es el contrato de construcción — un constructor calificado debe poder ejecutar sin depender de la memoria oral. / This document is the build contract — a qualified builder should be able to execute without relying on oral history.",
    "",
  ].join("\n");

  const sections = [
    section(1, "Identidad del Proyecto", "Project Identity", [
      `- **ID de negocio / Business ID:** ${packet.businessId}`,
      `- **ID de descubrimiento / Discovery ID:** ${packet.discoveryId}`,
      `- **ID de intención de proyecto / Project intent ID:** ${packet.projectIntentId}`,
      `- **Tipo de proyecto / Project type:** ${packet.projectType}`,
    ].join("\n")),

    section(2, "Contexto del Negocio", "Business Context", [
      `- **Tipo de negocio (general) / Broad business type:** ${packet.broadBusinessType}`,
      packet.specificBusinessType ? `- **Tipo de negocio (específico) / Specific business type:** ${s(packet.specificBusinessType)}` : "",
      `- **Etapa del negocio / Business stage:** ${packet.businessStage}`,
      packet.industryBranch ? `- **Rama de industria / Industry branch:** ${packet.industryBranch}` : "",
      rows(packet.businessIdentity),
    ].filter(Boolean).join("\n")),

    section(3, "Objetivo del Proyecto", "Project Objective", [rows(packet.objective), packet.primaryCta ? rowLine(packet.primaryCta) : ""].filter(Boolean).join("\n")),

    section(4, "Audiencia", "Audience", rows(packet.audience)),

    section(5, "Visión del Cliente y Dirección de Marca", "Client Vision & Brand Direction", rows(packet.clientVision)),

    section(6, "Activos Existentes y Referencias", "Existing Assets & References", [
      packet.assets.length > 0 ? packet.assets.map((a) => `- ${s(a.label)} (${a.sourceType})${a.externalUrl ? `: ${a.externalUrl}` : ""}`).join("\n") : "",
      packet.missingAssets.length > 0 ? `**Activos faltantes / Missing assets**\n${rows(packet.missingAssets)}` : "",
    ].filter(Boolean).join("\n\n")),

    section(7, "Requerimientos de Contenido", "Content Requirements", rows(packet.content)),

    section(8, "Estructura del Sitio Web", "Website Structure", rows(packet.siteStructure)),

    section(9, "Ruta Principal de Conversión / CTAs", "Primary Conversion Path / CTAs", packet.primaryCta ? rowLine(packet.primaryCta) : ""),

    section(10, "Requerimientos Funcionales", "Functional Requirements", [rows(packet.forms), rows(packet.functionalRequirements)].filter(Boolean).join("\n")),

    section(11, "Arquitectura Técnica Aprobada", "Approved Technical Architecture", technicalArchitectureBlock(packet.architecture)),

    section(12, "Propiedad de Dominio / Alojamiento / Plataforma", "Domain / Hosting / Platform Ownership", ownershipBlock(packet.architecture)),

    section(13, "Formularios / Integraciones / Proveedores Externos", "Forms / Integrations / External Providers", formsIntegrationsBlock(packet)),

    section(14, "SEO y Medición", "SEO & Measurement", [rows(packet.seo), rows(packet.analyticsRequirements)].filter(Boolean).join("\n")),

    section(15, "Accesibilidad e Idiomas", "Accessibility & Languages", [rows(packet.accessibility), rows(packet.languages)].filter(Boolean).join("\n")),

    section(16, "Privacidad / Investigación Oficial / Señales Profesionales Externas", "Privacy / Official Research / External Professional Flags", [rows(packet.privacyLegal), packet.officialResearchOutstanding.length > 0 ? `**Investigación oficial pendiente / Official research outstanding**\n${rows(packet.officialResearchOutstanding)}` : ""].filter(Boolean).join("\n\n")),

    section(17, "Dentro del Alcance", "Scope-In", packet.inScopeSummary ? s(packet.inScopeSummary) : ""),

    section(18, "Fuera del Alcance", "Scope-Out", packet.outOfScopeSummary ? s(packet.outOfScopeSummary) : ""),

    section(19, "Futuro / Opcional", "Future / Optional", rows(packet.futureOptional)),

    section(20, "Responsabilidades del Cliente", "Client Responsibilities", bilingualBullets(packet.clientResponsibilities)),

    section(21, "Responsabilidades de Leonix", "Leonix Responsibilities", bilingualBullets(packet.leonixResponsibilities)),

    section(22, "Dependencias y Requisitos de Acceso", "Dependencies & Access Requirements", dependenciesBlock(packet)),

    section(23, "Cronograma y Aprobación", "Timeline & Approval", rows(packet.schedule)),

    section(24, "Puertas de Construcción", "Build Gates", buildGatesBlock(packet.buildGates)),

    section(25, "Criterios de Aceptación", "Acceptance Criteria", textItems(packet.acceptanceCriteria)),

    section(26, "Matriz de Control de Calidad", "QA Matrix", qaMatrixBlock(packet.qaMatrix)),

    section(27, "Lista de Verificación de Lanzamiento", "Launch Checklist", textItems(packet.launchChecklist)),

    section(28, "Lista de Verificación de Entrega", "Handoff Checklist", textItems(packet.handoffChecklist)),

    section(29, "Elementos Sin Resolver Conocidos", "Known Unresolved Items", unresolvedBlock(packet)),

    section(30, "Registro de Fuentes / Evidencia", "Source / Evidence Record", sourceReferencesBlock(packet)),

    section(31, "Definición de Terminado", "Definition of Done", definitionOfDoneBlock(packet)),
  ];

  return `${header}\n${sections.filter((sec) => sec.length > 0).join("\n")}`.trim() + "\n";
}
