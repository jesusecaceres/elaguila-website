/**
 * Client Discovery & Project Blueprint Engine, Gate 10.2 — the canonical Website Blueprint
 * category registry (MD §14 <blueprint_packet>): the ONE explicit, exhaustive list of the 47
 * content categories a generated Website Project Blueprint must represent. Both the deterministic
 * Markdown builder (blueprintMarkdown.ts) and the durable test suite iterate this SAME registry, so
 * a category can never be silently dropped from one without the other noticing.
 *
 * Every category maps to real packet data — never a placeholder invented to pad the count. Several
 * categories reuse the exact same underlying discovery answer (e.g. #7 Primary CTA and #8 Secondary
 * CTAs both come from the primary_cta catalog section) because the MD's own category list is a
 * content-outline, not a claim that every category needs an independent discovery question (MD
 * Gate 10.2 <phase_1_md_source_of_truth>: "semantic completeness, not arbitrary row counts").
 */
import {
  rows, rowLine, textItems, bilingualBullets, buildGatesBlock, qaMatrixBlock, ownershipBlock,
  externalIntegrationsBlock, cmsDecisionBlock, backendDecisionBlock, domainDnsBlock, hostingDeploymentBlock,
  platformRationaleBlock, dependenciesBlock, unresolvedBlock, sourceReferencesBlock, definitionOfDoneBlock, s,
} from "./blueprintMarkdownHelpers";
import type { WebsiteProjectBlueprintPacket } from "./blueprintEngine";

export interface BlueprintCategoryDefinition {
  /** The MD §14 category number, 1-47. */
  mdNumber: number;
  /** Stable canonical key — never renamed once shipped (durable test + any future external reference relies on it). */
  key: string;
  labelEs: string;
  labelEn: string;
  /** Returns the Markdown body for this category, or "" when genuinely inapplicable (never "N/A" spam). */
  render: (packet: WebsiteProjectBlueprintPacket) => string;
}

export const WEBSITE_BLUEPRINT_CATEGORIES: readonly BlueprintCategoryDefinition[] = [
  {
    mdNumber: 1, key: "project_identity", labelEs: "Identidad del Proyecto", labelEn: "Project Identity",
    render: (p) => [
      `- **ID de negocio / Business ID:** ${p.businessId}`,
      `- **ID de descubrimiento / Discovery ID:** ${p.discoveryId}`,
      `- **ID de intención de proyecto / Project intent ID:** ${p.projectIntentId}`,
      `- **Título de trabajo / Working title:** ${s(p.workingTitle)}`,
      `- **Generado / Generated:** ${p.generatedAt}`,
    ].join("\n"),
  },
  {
    mdNumber: 2, key: "business_identity", labelEs: "Identidad del Cliente/Negocio", labelEn: "Client/Business Identity",
    render: (p) => [
      `- **Negocio / Business:** ${s(p.businessDisplayName)}${p.businessPublicName ? ` (${s(p.businessPublicName)})` : ""}`,
      rows(p.businessIdentity),
    ].filter(Boolean).join("\n"),
  },
  {
    mdNumber: 3, key: "project_type", labelEs: "Tipo de Proyecto", labelEn: "Project Type",
    render: (p) => `- **Tipo de proyecto / Project type:** ${p.projectType}`,
  },
  {
    mdNumber: 4, key: "business_context", labelEs: "Contexto del Negocio", labelEn: "Business Context",
    render: (p) => [
      `- **Tipo de negocio (general) / Broad business type:** ${p.broadBusinessType}`,
      p.specificBusinessType ? `- **Tipo de negocio (específico) / Specific business type:** ${s(p.specificBusinessType)}` : "",
      `- **Etapa del negocio / Business stage:** ${p.businessStage}`,
      p.industryBranch ? `- **Rama de industria / Industry branch:** ${p.industryBranch}` : "",
    ].filter(Boolean).join("\n"),
  },
  { mdNumber: 5, key: "client_goals", labelEs: "Objetivos del Cliente", labelEn: "Client Goals", render: (p) => rows(p.objective) },
  { mdNumber: 6, key: "target_audience", labelEs: "Audiencia Objetivo", labelEn: "Target Audience", render: (p) => rows(p.audience) },
  { mdNumber: 7, key: "primary_cta", labelEs: "CTA Principal", labelEn: "Primary CTA", render: (p) => (p.primaryCta ? rowLine(p.primaryCta) : "") },
  { mdNumber: 8, key: "secondary_ctas", labelEs: "CTAs Secundarias", labelEn: "Secondary CTAs", render: (p) => rows(p.secondaryCtas) },
  { mdNumber: 9, key: "client_preferences", labelEs: "Preferencias Confirmadas del Cliente", labelEn: "Client-Confirmed Preferences", render: (p) => rows(p.clientPreferences) },
  { mdNumber: 10, key: "client_dislikes", labelEs: "Lo que el Cliente No Quiere", labelEn: "Client Dislikes / Avoid List", render: (p) => rows(p.clientDislikes) },
  {
    mdNumber: 11, key: "existing_assets", labelEs: "Activos Existentes", labelEn: "Existing Assets",
    render: (p) => p.assets.map((a) => `- ${s(a.label)} (${a.sourceType})${a.externalUrl ? `: ${a.externalUrl}` : ""}`).join("\n"),
  },
  { mdNumber: 12, key: "missing_assets", labelEs: "Activos Faltantes", labelEn: "Missing Assets", render: (p) => rows(p.missingAssets) },
  { mdNumber: 13, key: "content_inventory", labelEs: "Inventario de Contenido", labelEn: "Content Inventory", render: (p) => rows(p.content) },
  { mdNumber: 14, key: "required_content_creation", labelEs: "Contenido Requerido por Crear", labelEn: "Required Content Creation", render: (p) => rows(p.requiredContentCreation) },
  { mdNumber: 15, key: "visual_references", labelEs: "Referencias Visuales", labelEn: "Visual References", render: (p) => rows(p.visualReferences) },
  { mdNumber: 16, key: "brand_system", labelEs: "Sistema de Marca", labelEn: "Brand System", render: (p) => rows(p.brandSystem) },
  { mdNumber: 17, key: "site_structure", labelEs: "Arquitectura de Páginas/Secciones", labelEn: "Page/Section Architecture", render: (p) => rows(p.siteStructure) },
  { mdNumber: 18, key: "functional_requirements", labelEs: "Requerimientos Funcionales", labelEn: "Functional Requirements", render: (p) => rows(p.functionalRequirements) },
  { mdNumber: 19, key: "forms", labelEs: "Formularios", labelEn: "Forms", render: (p) => rows(p.forms) },
  { mdNumber: 20, key: "integrations", labelEs: "Integraciones", labelEn: "Integrations", render: (p) => externalIntegrationsBlock(p.architecture) },
  { mdNumber: 21, key: "cms_decision", labelEs: "Decisión de CMS", labelEn: "CMS Decision", render: (p) => cmsDecisionBlock(p.architecture) },
  { mdNumber: 22, key: "backend_decision", labelEs: "Decisión de Backend/Base de Datos/Autenticación", labelEn: "Backend/Database/Auth Decision", render: (p) => backendDecisionBlock(p.architecture) },
  { mdNumber: 23, key: "domain_dns", labelEs: "Dominio/DNS", labelEn: "Domain/DNS", render: (p) => domainDnsBlock(p.architecture) },
  { mdNumber: 24, key: "hosting_deployment", labelEs: "Alojamiento/Despliegue", labelEn: "Hosting/Deployment", render: (p) => hostingDeploymentBlock(p.architecture) },
  { mdNumber: 25, key: "platform_rationale", labelEs: "Decisiones de Plataforma y Justificación", labelEn: "Platform Decisions and Rationale", render: (p) => platformRationaleBlock(p.architecture) },
  { mdNumber: 26, key: "seo", labelEs: "SEO", labelEn: "SEO", render: (p) => rows(p.seo) },
  { mdNumber: 27, key: "analytics", labelEs: "Analítica", labelEn: "Analytics", render: (p) => rows(p.analyticsRequirements) },
  { mdNumber: 28, key: "accessibility", labelEs: "Accesibilidad", labelEn: "Accessibility", render: (p) => rows(p.accessibility) },
  { mdNumber: 29, key: "languages", labelEs: "Idiomas", labelEn: "Languages", render: (p) => rows(p.languages) },
  {
    mdNumber: 30, key: "privacy_compliance", labelEs: "Privacidad/Cumplimiento", labelEn: "Privacy/Compliance",
    render: (p) => [rows(p.privacyLegal), p.officialResearchOutstanding.length > 0 ? `**Investigación oficial pendiente / Official research outstanding**\n${rows(p.officialResearchOutstanding)}` : ""].filter(Boolean).join("\n\n"),
  },
  { mdNumber: 31, key: "ownership_billing", labelEs: "Propiedad/Facturación", labelEn: "Ownership/Billing", render: (p) => ownershipBlock(p.architecture) },
  { mdNumber: 32, key: "maintenance", labelEs: "Mantenimiento", labelEn: "Maintenance", render: (p) => rows(p.maintenance) },
  { mdNumber: 33, key: "scope_in", labelEs: "Dentro del Alcance", labelEn: "Scope-In", render: (p) => (p.inScopeSummary ? s(p.inScopeSummary) : "") },
  { mdNumber: 34, key: "scope_out", labelEs: "Fuera del Alcance", labelEn: "Scope-Out", render: (p) => (p.outOfScopeSummary ? s(p.outOfScopeSummary) : "") },
  { mdNumber: 35, key: "future_ideas", labelEs: "Futuro/Opcional", labelEn: "Future Ideas", render: (p) => rows(p.futureOptional) },
  { mdNumber: 36, key: "dependencies", labelEs: "Dependencias", labelEn: "Dependencies", render: (p) => dependenciesBlock(p) },
  { mdNumber: 37, key: "client_responsibilities", labelEs: "Responsabilidades del Cliente", labelEn: "Client Responsibilities", render: (p) => bilingualBullets(p.clientResponsibilities) },
  { mdNumber: 38, key: "leonix_responsibilities", labelEs: "Responsabilidades de Leonix", labelEn: "Leonix Responsibilities", render: (p) => bilingualBullets(p.leonixResponsibilities) },
  { mdNumber: 39, key: "timeline", labelEs: "Cronograma", labelEn: "Timeline", render: (p) => rows(p.schedule) },
  { mdNumber: 40, key: "build_gates", labelEs: "Puertas de Construcción", labelEn: "Build Gates", render: (p) => buildGatesBlock(p.buildGates) },
  { mdNumber: 41, key: "acceptance_criteria", labelEs: "Criterios de Aceptación", labelEn: "Acceptance Criteria", render: (p) => textItems(p.acceptanceCriteria) },
  { mdNumber: 42, key: "qa_matrix", labelEs: "Matriz de Control de Calidad", labelEn: "QA Matrix", render: (p) => qaMatrixBlock(p.qaMatrix) },
  { mdNumber: 43, key: "launch_checklist", labelEs: "Lista de Verificación de Lanzamiento", labelEn: "Launch Checklist", render: (p) => textItems(p.launchChecklist) },
  { mdNumber: 44, key: "handoff_checklist", labelEs: "Lista de Verificación de Entrega", labelEn: "Handoff Checklist", render: (p) => textItems(p.handoffChecklist) },
  { mdNumber: 45, key: "definition_of_done", labelEs: "Definición de Terminado", labelEn: "Definition of Done", render: (p) => definitionOfDoneBlock(p) },
  { mdNumber: 46, key: "known_unresolved", labelEs: "Elementos Sin Resolver Conocidos", labelEn: "Known Unresolved Items", render: (p) => unresolvedBlock(p) },
  { mdNumber: 47, key: "source_references", labelEs: "Registro de Fuentes/Evidencia", labelEn: "Source/Evidence References", render: (p) => sourceReferencesBlock(p) },
];
