/**
 * Client Discovery & Project Blueprint Engine, Gate 6 — deterministic Markdown rendering of a
 * SpecializedProjectBlueprintPacket (Logo/Brand, Print Collateral, Media Campaign). Mirrors
 * blueprintMarkdown.ts's own doctrine exactly (deterministic, no OpenAI, truth-tagged, redacted,
 * no "N/A" spam) — kept as a separate small file rather than modifying Gate 5's Website-only
 * generator, since the section lists genuinely differ per family.
 */
import type { BlueprintStatus } from "./blueprintEngine";
import { redactCredentialLikeText } from "./blueprintRedaction";
import { blueprintStatusLabel, formatBilingual } from "./discoveryLabels";
import type { DiscoveryTruthClass } from "./types";
import type {
  LogoBrandBlueprintPacket,
  MediaCampaignBlueprintPacket,
  PrintCollateralBlueprintPacket,
  SpecializedBlueprintRow,
  SpecializedBuildGate,
  SpecializedProjectBlueprintPacket,
  SpecializedQaRow,
  SpecializedTextItem,
} from "./specializedBlueprintEngine";

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

function rowLine(row: SpecializedBlueprintRow): string {
  const value = row.displayValue.trim();
  const valueText = value.length > 0 ? s(value) : "_(sin valor / no value)_";
  return `- **${row.labelEs} / ${row.labelEn}:** ${valueText} ${truthTag(row.truthClass)}`;
}

function rows(list: readonly SpecializedBlueprintRow[]): string {
  return list.map(rowLine).join("\n");
}

function textItems(list: readonly SpecializedTextItem[]): string {
  return list.map((i) => `- ${s(i.textEs)} / ${s(i.textEn)}`).join("\n");
}

function bilingualBullets(list: readonly { es: string; en: string }[]): string {
  return list.map((i) => `- ${s(i.es)} / ${s(i.en)}`).join("\n");
}

function section(n: number, titleEs: string, titleEn: string, body: string): string {
  if (body.trim().length === 0) return "";
  return `## ${n}. ${titleEs} / ${titleEn}\n\n${body.trim()}\n`;
}

function buildGatesBlock(gates: readonly SpecializedBuildGate[]): string {
  return gates
    .map((g) => {
      const lines = g.itemsEs.map((es, idx) => `  - ${s(es)} / ${s(g.itemsEn[idx] ?? es)}`).join("\n");
      return `### ${g.titleEs} / ${g.titleEn}\n${lines}`;
    })
    .join("\n\n");
}

function qaMatrixBlock(list: readonly SpecializedQaRow[]): string {
  const header = "| Área de prueba / Test area | Condicional / Conditional |\n| --- | --- |";
  const body = list.map((r) => `| ${r.labelEs} / ${r.labelEn} | ${r.conditional ? "Sí / Yes" : "No"} |`).join("\n");
  return `${header}\n${body}`;
}

function assetsBlock(packet: SpecializedProjectBlueprintPacket): string {
  const parts: string[] = [];
  if (packet.assets.length > 0) parts.push(packet.assets.map((a) => `- ${s(a.label)} (${a.sourceType})${a.externalUrl ? `: ${a.externalUrl}` : ""}`).join("\n"));
  if (packet.missingAssets.length > 0) parts.push(`**Activos faltantes / Missing assets**\n${rows(packet.missingAssets)}`);
  return parts.join("\n\n");
}

function dependenciesBlock(packet: SpecializedProjectBlueprintPacket): string {
  if (packet.dependencies.length === 0) return "";
  return packet.dependencies.map((d) => `- ${d.title} (${d.projectType}) — ${d.status}`).join("\n");
}

function unresolvedBlock(packet: SpecializedProjectBlueprintPacket): string {
  const parts: string[] = [];
  if (packet.unresolvedBeforeLaunch.length > 0) parts.push(`**[UNRESOLVED-BEFORE-LAUNCH / SIN RESOLVER ANTES DE LANZAR]**\n${rows(packet.unresolvedBeforeLaunch)}`);
  if (packet.unresolvedLeonixActions.length > 0) parts.push(`**Decisiones de Leonix pendientes / Outstanding Leonix decisions**\n${rows(packet.unresolvedLeonixActions)}`);
  if (packet.unresolvedNonBlocking.length > 0) parts.push(`**No bloqueante / Non-blocking**\n${rows(packet.unresolvedNonBlocking)}`);
  return parts.join("\n\n");
}

function sourceReferencesBlock(packet: SpecializedProjectBlueprintPacket): string {
  if (packet.sourceReferences.length === 0) return "";
  return packet.sourceReferences.map((r) => `- ${r.label} (${r.kind})`).join("\n");
}

function definitionOfDoneBlock(packet: SpecializedProjectBlueprintPacket): string {
  const blockers = packet.unresolvedBeforeLaunch.length + packet.unresolvedLeonixActions.length;
  return [
    "- El entregable cumple con todos los criterios de aceptación listados arriba. / The deliverable meets every acceptance criterion listed above.",
    "- Todas las filas de la matriz de control de calidad fueron ejecutadas. / Every QA matrix row has been executed.",
    "- Todos los elementos de la lista de lanzamiento están completos. / Every launch checklist item is complete.",
    "- Todos los elementos de la lista de entrega están completos. / Every handoff checklist item is complete.",
    blockers > 0
      ? `- ⚠ Hay ${blockers} elemento(s) sin resolver antes del lanzamiento. / ⚠ ${blockers} unresolved-before-launch item(s) remain.`
      : "- No quedan elementos sin resolver antes del lanzamiento. / No unresolved-before-launch items remain.",
  ].join("\n");
}

function headerFor(packet: SpecializedProjectBlueprintPacket, titleEs: string, titleEn: string, meta: { version: number; status: BlueprintStatus }): string {
  const statusLabel = formatBilingual(blueprintStatusLabel(meta.status));
  return [
    `# ${titleEs.toUpperCase()} / ${titleEn.toUpperCase()}`,
    "",
    `**Versión / Version:** ${meta.version}`,
    `**Estado / Status:** ${statusLabel}`,
    `**Generado / Generated:** ${packet.generatedAt}`,
    `**Negocio / Business:** ${s(packet.businessDisplayName)}${packet.businessPublicName ? ` (${s(packet.businessPublicName)})` : ""}`,
    `**Título de trabajo / Working title:** ${s(packet.workingTitle)}`,
    `**Catálogo / Catalog:** ${packet.catalogVersion}`,
    "",
  ].join("\n");
}

function commonTailSections(packet: SpecializedProjectBlueprintPacket, startNumber: number): string[] {
  let n = startNumber;
  return [
    section(n++, "Dentro del Alcance", "Scope-In", packet.inScopeSummary ? s(packet.inScopeSummary) : ""),
    section(n++, "Fuera del Alcance", "Scope-Out", packet.outOfScopeSummary ? s(packet.outOfScopeSummary) : ""),
    section(n++, "Futuro / Opcional", "Future / Optional", rows(packet.futureOptional)),
    section(n++, "Responsabilidades del Cliente", "Client Responsibilities", bilingualBullets(packet.clientResponsibilities)),
    section(n++, "Responsabilidades de Leonix", "Leonix Responsibilities", bilingualBullets(packet.leonixResponsibilities)),
    section(n++, "Dependencias", "Dependencies", dependenciesBlock(packet)),
    section(n++, "Puertas de Construcción", "Build Gates", buildGatesBlock(packet.buildGates)),
    section(n++, "Criterios de Aceptación", "Acceptance Criteria", textItems(packet.acceptanceCriteria)),
    section(n++, "Matriz de Control de Calidad", "QA Matrix", qaMatrixBlock(packet.qaMatrix)),
    section(n++, "Lista de Verificación de Lanzamiento", "Launch Checklist", textItems(packet.launchChecklist)),
    section(n++, "Lista de Verificación de Entrega", "Handoff Checklist", textItems(packet.handoffChecklist)),
    section(n++, "Elementos Sin Resolver Conocidos", "Known Unresolved Items", unresolvedBlock(packet)),
    section(n++, "Registro de Fuentes / Evidencia", "Source / Evidence Record", sourceReferencesBlock(packet)),
    section(n, "Definición de Terminado", "Definition of Done", definitionOfDoneBlock(packet)),
  ];
}

export function buildLogoBrandBlueprintMarkdown(packet: LogoBrandBlueprintPacket, meta: { version: number; status: BlueprintStatus }): string {
  const header = headerFor(packet, "Plan de Proyecto de Logo / Marca", "Logo / Brand Project Blueprint", meta);
  const sections = [
    section(1, "Identidad del Proyecto", "Project Identity", [`- **ID de negocio / Business ID:** ${packet.businessId}`, `- **ID de intención / Intent ID:** ${packet.projectIntentId}`].join("\n")),
    section(2, "Nombre de Marca", "Brand Name", rows(packet.brandName)),
    section(3, "Tipo de Proyecto", "Project Type", rows(packet.projectKind)),
    section(4, "Propósito", "Purpose", rows(packet.objective)),
    section(5, "Audiencia", "Audience", rows(packet.audience)),
    section(6, "Personalidad de Marca", "Brand Personality", rows(packet.brandPersonality)),
    section(7, "Dirección Visual", "Visual Direction", rows(packet.visualDirection)),
    section(8, "Identidad Existente", "Existing Identity", rows(packet.existingIdentity)),
    section(9, "Entregables", "Deliverables", rows(packet.deliverables)),
    section(10, "Activos / Archivos Fuente", "Assets / Source Files", assetsBlock(packet)),
    ...commonTailSections(packet, 11),
  ];
  return `${header}\n${sections.filter((sec) => sec.length > 0).join("\n")}`.trim() + "\n";
}

export function buildPrintCollateralBlueprintMarkdown(packet: PrintCollateralBlueprintPacket, meta: { version: number; status: BlueprintStatus }): string {
  const header = headerFor(packet, "Plan de Proyecto de Materiales Impresos", "Print Collateral Project Blueprint", meta);
  const sections = [
    section(1, "Identidad del Proyecto", "Project Identity", [`- **ID de negocio / Business ID:** ${packet.businessId}`, `- **ID de intención / Intent ID:** ${packet.projectIntentId}`, `- **Tipo de pieza / Piece type:** ${packet.projectType}`].join("\n")),
    section(2, "Dependencia de Marca", "Brand Dependency", rows(packet.brandDependency)),
    section(3, "Contenido y Diseño", "Content & Layout", rows(packet.layoutContent)),
    section(4, "Especificación", "Specification", rows(packet.specification)),
    section(5, "Producción", "Production", rows(packet.production)),
    section(6, "Activos", "Assets", assetsBlock(packet)),
    ...commonTailSections(packet, 7),
  ];
  return `${header}\n${sections.filter((sec) => sec.length > 0).join("\n")}`.trim() + "\n";
}

export function buildMediaCampaignBlueprintMarkdown(packet: MediaCampaignBlueprintPacket, meta: { version: number; status: BlueprintStatus }): string {
  const header = headerFor(packet, "Plan de Proyecto de Campaña de Medios", "Media Campaign Project Blueprint", meta);
  const sections = [
    section(1, "Identidad de la Campaña", "Campaign Identity", [`- **ID de negocio / Business ID:** ${packet.businessId}`, `- **ID de intención / Intent ID:** ${packet.projectIntentId}`].join("\n")),
    section(2, "Objetivo", "Objective", rows(packet.objective)),
    section(3, "Audiencia", "Audience", rows(packet.audience)),
    section(4, "Oferta / Mensaje", "Offer / Message", rows(packet.offerMessage)),
    section(5, "Llamado a la Acción", "Call to Action", rows(packet.cta)),
    section(6, "Canales", "Channels", rows(packet.channels)),
    section(7, "Cronograma", "Timing", rows(packet.timing)),
    section(8, "Creativo", "Creative", rows(packet.creative)),
    section(9, "Plan de Medición", "Measurement Plan", rows(packet.measurement)),
    section(10, "Activos", "Assets", assetsBlock(packet)),
    ...commonTailSections(packet, 11),
  ];
  return `${header}\n${sections.filter((sec) => sec.length > 0).join("\n")}`.trim() + "\n";
}

function isPrintCollateralPacket(packet: SpecializedProjectBlueprintPacket): packet is PrintCollateralBlueprintPacket {
  return packet.projectType === "business_cards" || packet.projectType === "flyer" || packet.projectType === "banner_signage" || packet.projectType === "referral_materials";
}

/** Single dispatcher — routes to the correct family's Markdown generator based on packet.projectType. */
export function buildSpecializedBlueprintMarkdown(packet: SpecializedProjectBlueprintPacket, meta: { version: number; status: BlueprintStatus }): string {
  if (packet.projectType === "logo_brand_identity") return buildLogoBrandBlueprintMarkdown(packet, meta);
  if (isPrintCollateralPacket(packet)) return buildPrintCollateralBlueprintMarkdown(packet, meta);
  return buildMediaCampaignBlueprintMarkdown(packet, meta);
}
