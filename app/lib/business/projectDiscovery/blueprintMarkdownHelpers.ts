/**
 * Client Discovery & Project Blueprint Engine, Gate 5/10.2 — low-level deterministic Markdown
 * rendering primitives for a WebsiteProjectBlueprintPacket. Extracted from blueprintMarkdown.ts so
 * both it and the canonical category registry (blueprintCategoryRegistry.ts) can import these
 * without a circular module dependency between the two.
 */
import type { BlueprintBuildGate, BlueprintQaRow, BlueprintRequirementRow, BlueprintTextItem, WebsiteProjectBlueprintPacket } from "./blueprintEngine";
import { redactCredentialLikeText } from "./blueprintRedaction";
import {
  accessStatusLabel,
  architectureClassLabel,
  binaryDecisionLabel,
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

export function truthTag(truthClass: DiscoveryTruthClass): string {
  return `[${BLUEPRINT_TRUTH_TAGS[truthClass]}]`;
}

export function s(value: string): string {
  return redactCredentialLikeText(value);
}

export function rowLine(row: BlueprintRequirementRow): string {
  const value = row.displayValue.trim();
  const valueText = value.length > 0 ? s(value) : "_(sin valor / no value)_";
  return `- **${row.labelEs} / ${row.labelEn}:** ${valueText} ${truthTag(row.truthClass)}`;
}

export function rows(list: readonly BlueprintRequirementRow[]): string {
  return list.map(rowLine).join("\n");
}

export function textItems(list: readonly BlueprintTextItem[]): string {
  return list.map((i) => `- ${s(i.textEs)} / ${s(i.textEn)}`).join("\n");
}

export function bilingualBullets(list: readonly { es: string; en: string }[]): string {
  return list.map((i) => `- ${s(i.es)} / ${s(i.en)}`).join("\n");
}

/** Omits the section entirely when body is empty/whitespace-only — never "N/A" spam. */
export function section(n: number, titleEs: string, titleEn: string, body: string): string {
  if (body.trim().length === 0) return "";
  return `## ${n}. ${titleEs} / ${titleEn}\n\n${body.trim()}\n`;
}

export function buildGatesBlock(gates: readonly BlueprintBuildGate[]): string {
  return gates
    .map((g) => {
      const lines = g.itemsEs.map((es, idx) => `  - ${s(es)} / ${s(g.itemsEn[idx] ?? es)}`).join("\n");
      return `### ${g.titleEs} / ${g.titleEn}\n${lines}`;
    })
    .join("\n\n");
}

export function qaMatrixBlock(list: readonly BlueprintQaRow[]): string {
  const header = "| Área de prueba / Test area | Condicional / Conditional |\n| --- | --- |";
  const body = list.map((r) => `| ${r.labelEs} / ${r.labelEn} | ${r.conditional ? "Sí / Yes" : "No"} |`).join("\n");
  return `${header}\n${body}`;
}

export function ownershipBlock(architecture: WebsiteProjectBlueprintPacket["architecture"]): string {
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

export function recurringServicesBlock(architecture: WebsiteProjectBlueprintPacket["architecture"]): string {
  if (architecture.recurringServices.length === 0) return "";
  return architecture.recurringServices.map((r) => `- ${r.platformKey}: ${formatBilingual(recurringCostClassLabel(r.costClass))}`).join("\n");
}

export function externalIntegrationsBlock(architecture: WebsiteProjectBlueprintPacket["architecture"]): string {
  if (architecture.externalIntegrations.length === 0) return "";
  return architecture.externalIntegrations
    .map((p) => `- ${p.platformKey ?? "(sin especificar / unspecified)"} — ${formatBilingual(platformDecisionStatusLabel(p.status))}: ${s(p.reasonEs)} / ${s(p.reasonEn)}`)
    .join("\n");
}

/** MD §14 #21 — CMS decision, its own category. */
export function cmsDecisionBlock(architecture: WebsiteProjectBlueprintPacket["architecture"]): string {
  return `- **CMS:** ${formatBilingual(cmsDecisionLabel(architecture.cms.decision))}${architecture.cms.platformKey ? ` (${architecture.cms.platformKey})` : ""}`;
}

/** MD §14 #22 — Backend/database/auth decision, its own category. */
export function backendDecisionBlock(architecture: WebsiteProjectBlueprintPacket["architecture"]): string {
  const lines: string[] = [
    `- **Base de datos / Database:** ${formatBilingual(binaryDecisionLabel(architecture.database.decision))}`,
    `- **Autenticación / Auth:** ${formatBilingual(binaryDecisionLabel(architecture.auth.decision))}`,
    `- **Almacenamiento / Storage:** ${formatBilingual(storageDecisionLabel(architecture.storage.decision))}`,
  ];
  return lines.join("\n");
}

/** MD §14 #23 — Domain/DNS decision, its own category (previously computed but never rendered). */
export function domainDnsBlock(architecture: WebsiteProjectBlueprintPacket["architecture"]): string {
  const d = architecture.domainDns;
  const lines: string[] = [`- **Dominio/DNS / Domain/DNS:** ${s(d.reasonEs)} / ${s(d.reasonEn)}`];
  if (d.registrarPlatformKey) lines.push(`- **Registrador / Registrar:** ${d.registrarPlatformKey}`);
  if (d.dnsPlatformKey) lines.push(`- **DNS:** ${d.dnsPlatformKey}`);
  if (d.isLaunchBlocker) lines.push("- **⚠ BLOQUEADOR DE LANZAMIENTO / LAUNCH BLOCKER** — el acceso al dominio no está confirmado. / Domain access is not confirmed.");
  return lines.join("\n");
}

/** MD §14 #24 — Hosting/deployment, its own category. */
export function hostingDeploymentBlock(architecture: WebsiteProjectBlueprintPacket["architecture"]): string {
  return `- **Frontend/Alojamiento / Frontend/Hosting:** ${architecture.frontend.platformKey ?? "—"} / ${architecture.hosting.platformKey ?? "—"} — ${formatBilingual(platformDecisionStatusLabel(architecture.hosting.status))}`;
}

/** MD §14 #25 — Platform decisions and rationale, its own category. Renders architecture classification plus the WHY behind every platform decision (architecture.reasonsEs/reasonsEn) and recurring-cost implications (MD §12) — both computed since Gate 4 but never rendered before Gate 10.2. */
export function platformRationaleBlock(architecture: WebsiteProjectBlueprintPacket["architecture"]): string {
  const lines: string[] = [
    `- **Clasificación de arquitectura / Architecture classification:** ${formatBilingual(architectureClassLabel(architecture.architectureClass))} ${truthTag("technical_decision")}`,
    `- **Complejidad de infraestructura / Infrastructure complexity:** ${architecture.infrastructureComplexity} — ${s(architecture.infrastructureComplexityReasonEs)} / ${s(architecture.infrastructureComplexityReasonEn)}`,
  ];
  architecture.reasonsEs.forEach((es, idx) => {
    const en = architecture.reasonsEn[idx] ?? es;
    if (es.trim().length > 0) lines.push(`- ${s(es)} / ${s(en)}`);
  });
  if (architecture.migrationRequired) {
    lines.push(`- **Migración / Migration:** ${s(architecture.migrationNotesEs)} / ${s(architecture.migrationNotesEn)}`);
  }
  if (architecture.requiresCommercialReview) {
    lines.push("- **⚠ REVISIÓN COMERCIAL REQUERIDA / COMMERCIAL REVIEW REQUIRED** — esta es una Plataforma Personalizada sin proceso de aprobación comercial establecido todavía; no debe tratarse como aprobación ordinaria. / This is a Custom Platform with no established commercial-approval process yet; must not be treated as ordinary approval.");
  }
  const recurring = recurringServicesBlock(architecture);
  if (recurring) lines.push(`- **Costos recurrentes potenciales / Potential recurring costs:**\n${recurring}`);
  return lines.join("\n");
}

export function dependenciesBlock(packet: WebsiteProjectBlueprintPacket): string {
  const parts: string[] = [];
  if (packet.dependencies.length > 0) {
    parts.push(packet.dependencies.map((d) => `- ${d.title} (${d.projectType}) — ${d.status}`).join("\n"));
  }
  if (packet.architecture.unresolvedBlockers.length > 0) {
    parts.push(`**Bloqueadores de acceso / Access blockers:** ${packet.architecture.unresolvedBlockers.join(", ")}`);
  }
  return parts.join("\n\n");
}

export function unresolvedBlock(packet: WebsiteProjectBlueprintPacket): string {
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

export function sourceReferencesBlock(packet: WebsiteProjectBlueprintPacket): string {
  if (packet.sourceReferences.length === 0) return "";
  return packet.sourceReferences.map((r) => `- ${r.label} (${r.kind})`).join("\n");
}

export function definitionOfDoneBlock(packet: WebsiteProjectBlueprintPacket): string {
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
