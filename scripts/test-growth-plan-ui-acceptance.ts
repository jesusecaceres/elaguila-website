/**
 * Business Development & Growth Engine, Gate C — deterministic UI acceptance tests for the
 * progressive Growth Plan workspace (GrowthPlanJourney.tsx / GrowthPlanActions.tsx). Same
 * scratch-copy technique used throughout this session (see
 * scripts/test-growth-analyst-provider-safety.ts): the real component source is copied
 * unmodified except for two runtime-only import redirects (`next/navigation` -> a stub
 * `useRouter`, `next/link` -> a plain `<a>` stub) and a `roadmapCatalog` relative-path fix — the
 * actual section logic, copy, and conditionals under test are never reimplemented. Rendered via
 * react-dom/server (renderToStaticMarkup) to real, static HTML and asserted on with substring
 * checks. No live network, no database, no Next.js runtime required.
 *
 * Run from repo root: npx tsx scripts/test-growth-plan-ui-acceptance.ts
 */
import { strict as assert } from "node:assert";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

let passed = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

console.log("Growth Plan UI Acceptance — deterministic rendering tests\n");

async function main(): Promise<void> {
  const ROOT = path.resolve(__dirname, "..");
  const SRC_DIR = path.join(ROOT, "app", "admin", "(dashboard)", "businesses", "[businessId]");
  // Scratch dir MUST live inside the repo tree so node_modules resolution (react, react-dom) works.
  const scratchDir = mkdtempSync(path.join(ROOT, "scripts", ".ui-acceptance-scratch-"));

  try {
  // --- Copy + minimally patch the two real component files --------------------------------------
  let actionsSource = readFileSync(path.join(SRC_DIR, "GrowthPlanActions.tsx"), "utf8");
  const actionsBefore = actionsSource;
  actionsSource = actionsSource.replace('import { useRouter } from "next/navigation";', 'import { useRouter } from "./stubNavigation";');
  actionsSource = actionsSource.replace(
    'import { humanizeStaffWriteError } from "@/app/admin/_lib/staffWriteErrorMessages";',
    'import { humanizeStaffWriteError } from "./staffWriteErrorMessages";',
  );
  assert.notEqual(actionsSource, actionsBefore, "expected to patch at least one import in GrowthPlanActions.tsx");
  writeFileSync(path.join(scratchDir, "GrowthPlanActions.tsx"), `import React from "react";\n${actionsSource}`, "utf8");

  let journeySource = readFileSync(path.join(SRC_DIR, "GrowthPlanJourney.tsx"), "utf8");
  const journeyBefore = journeySource;
  journeySource = journeySource.replace('import Link from "next/link";', 'import Link from "./stubLink";');
  journeySource = journeySource.replace(
    'import { roadmapStepCatalog } from "@/app/lib/business/growthEngine/roadmapCatalog";',
    'import { roadmapStepCatalog } from "./roadmapCatalog";',
  );
  journeySource = journeySource.replace(
    'import { classifyGrowthSolutionExecutionRoute, growthExecutionRouteIsCreativeStudio } from "@/app/lib/business/growthEngine/executionMatrix";',
    'import { classifyGrowthSolutionExecutionRoute, growthExecutionRouteIsCreativeStudio } from "./executionMatrix";',
  );
  assert.notEqual(journeySource, journeyBefore, "expected to patch at least one import in GrowthPlanJourney.tsx");
  writeFileSync(path.join(scratchDir, "GrowthPlanJourney.tsx"), `import React from "react";\n${journeySource}`, "utf8");

  // roadmapCatalog.ts and growthPlanLabels.ts only have type-only imports (erased at runtime by
  // esbuild), so both can be copied unmodified with no sibling types.ts required.
  cpSync(path.join(ROOT, "app/lib/business/growthEngine/roadmapCatalog.ts"), path.join(scratchDir, "roadmapCatalog.ts"));
  cpSync(path.join(ROOT, "app/admin/_lib/staffWriteErrorMessages.ts"), path.join(scratchDir, "staffWriteErrorMessages.ts"));
  cpSync(path.join(SRC_DIR, "growthPlanLabels.ts"), path.join(scratchDir, "growthPlanLabels.ts"));
  cpSync(path.join(ROOT, "app/lib/business/growthEngine/executionMatrix.ts"), path.join(scratchDir, "executionMatrix.ts"));

  writeFileSync(path.join(scratchDir, "stubNavigation.ts"), "export function useRouter() { return { refresh() {} }; }\n", "utf8");
  writeFileSync(
    path.join(scratchDir, "stubLink.tsx"),
    [
      'import React from "react";',
      "export default function Link({ href, children, className }: { href: string; children?: React.ReactNode; className?: string }) {",
      "  return React.createElement('a', { href, className }, children);",
      "}",
      "",
    ].join("\n"),
    "utf8",
  );

  async function loadPanel() {
    const mod = await import(pathToFileURL(path.join(scratchDir, "GrowthPlanJourney.tsx")).href);
    return mod.GrowthPlanPanel as (props: Record<string, unknown>) => React.ReactElement;
  }

  function render(GrowthPlanPanel: (props: Record<string, unknown>) => React.ReactElement, props: Record<string, unknown>): string {
    return renderToStaticMarkup(React.createElement(GrowthPlanPanel, props));
  }

  // --- Fixture builders ---------------------------------------------------------------------------
  const NOW = new Date().toISOString();
  let idCounter = 0;
  const nextId = () => `fixture-${(idCounter += 1)}`;

  const F = (textEs: string, textEn: string) => ({ textEs, textEn });

  function makeAssessment(overrides: Record<string, unknown>) {
    return {
      id: nextId(),
      businessId: "biz-1",
      status: "needs_review",
      providerKey: "openai",
      modelKey: "gpt-test",
      inputSnapshot: {},
      inputHash: "hash-1",
      costMetadata: {},
      summaryEs: null,
      summaryEn: null,
      whatFound: [],
      whatKnown: [],
      whatUnknown: [],
      needsVerification: [],
      weakOrMissing: [],
      clientQuestions: [],
      risksConstraints: [],
      growthOpportunities: [],
      suggestedSolutions: [],
      recommendedMediaMix: [],
      priorityOrder: [],
      measurementPlan: [],
      nextRightMoveEs: "Confirmar el correo del negocio con el cliente.",
      nextRightMoveEn: "Confirm the business email with the client.",
      createdActorType: "system",
      createdByRosterId: null,
      createdByAuthUserId: null,
      createdByRole: "growth_analyst",
      reviewedAt: null,
      reviewedByRosterId: null,
      reviewedByAuthUserId: null,
      reviewedByRole: null,
      operatorReviewNotes: null,
      createdAt: NOW,
      updatedAt: NOW,
      ...overrides,
    };
  }

  function makeSolution(overrides: Record<string, unknown>) {
    return {
      id: nextId(),
      businessId: "biz-1",
      sourceAssessmentId: null,
      providerClass: "leonix_provides",
      category: "digital_presence",
      titleEs: "Actualizar el sitio web",
      titleEn: "Update the website",
      rationaleEs: null,
      rationaleEn: null,
      evidenceRefs: [],
      readiness: "needs_preparation",
      priority: "medium",
      state: "suggested",
      linkedCampaignId: null,
      linkedCreativeJobId: null,
      linkedCommitmentId: null,
      linkedOfficialRequirementId: null,
      createdActorType: "system",
      createdByRosterId: null,
      createdByAuthUserId: null,
      createdByRole: "growth_analyst",
      reviewedAt: null,
      reviewedByRosterId: null,
      reviewedByAuthUserId: null,
      reviewedByRole: null,
      reviewNote: null,
      createdAt: NOW,
      updatedAt: NOW,
      ...overrides,
    };
  }

  function makeRequirement(overrides: Record<string, unknown>) {
    return {
      id: nextId(),
      businessId: "biz-1",
      jurisdiction: "California",
      requirementTopicEs: "Licencia de negocio",
      requirementTopicEn: "Business license",
      businessCategoryContext: null,
      sourceUrl: null,
      sourceAgency: null,
      lastVerifiedAt: null,
      state: "needs_research",
      needsHumanVerification: true,
      notes: null,
      createdAt: NOW,
      updatedAt: NOW,
      ...overrides,
    };
  }

  function makeCampaign(overrides: Record<string, unknown>) {
    return {
      id: nextId(),
      businessId: "biz-1",
      sourceSolutionId: null,
      linkedOpportunityId: null,
      objectiveEs: "Llenar clases de las 6pm",
      objectiveEn: "Fill the 6pm classes",
      targetAudienceEs: null,
      targetAudienceEn: null,
      offerEs: null,
      offerEn: null,
      primaryCtaEs: null,
      primaryCtaEn: null,
      capacityAssumption: null,
      campaignStart: null,
      campaignEnd: null,
      budgetAmount: null,
      budgetCurrency: "USD",
      creativeRequirements: {},
      trackingPlan: {},
      status: "draft",
      clientApprovedAt: null,
      clientApprovalNote: null,
      staffApprovedAt: null,
      staffApprovedByRosterId: null,
      staffApprovedByRole: null,
      createdActorType: "system",
      createdByRosterId: null,
      createdByRole: "growth_analyst",
      createdAt: NOW,
      updatedAt: NOW,
      ...overrides,
    };
  }

  const basePermissions = {
    canCreateAssessment: true,
    canReviewAssessment: true,
    canManageSolutions: true,
    canManageCampaigns: true,
    canManageRoadmap: true,
    canManageOfficialRequirements: true,
    canManageCommitments: true,
  };

  const RAW_CODES_NEVER_VISIBLE = ["bootstrap_write_denied", "provider_unavailable", "invalid_provider_output", "persistence_failed"];

  function assertNoRawCodes(html: string, label: string) {
    for (const code of RAW_CODES_NEVER_VISIBLE) {
      assert.ok(!html.includes(code), `${label}: raw code "${code}" must never appear in rendered HTML`);
    }
  }

  async function run() {
    const GrowthPlanPanel = await loadPanel();

    // === Scenario 1 — No Assessment empty state ================================================
    check("Scenario 1: No Assessment shows empty state, not-analyzed chip, and no phantom sections", () => {
      const html = render(GrowthPlanPanel, {
        businessId: "biz-1",
        businessStage: "operating",
        roadmapType: "established",
        currentAssessment: null,
        assessmentHistory: [],
        solutions: [],
        campaigns: [],
        officialRequirements: [],
        roadmapSteps: [],
        mediaChannels: [],
        ...basePermissions,
      });
      assert.ok(html.includes("Sin analizar / Not Analyzed"), "expected not-analyzed status chip");
      assert.ok(html.includes("Analice este negocio"), "expected the analyze-this-business empty-state copy");
      assert.ok(!html.includes("Lo que encontramos"), "What We Found section must not render with no assessment");
      assert.ok(!html.includes("Falta / Requiere confirmación"), "Missing Information section must not render with no assessment");
      assert.ok(html.includes("No se debe recomendar ninguna solución"), "expected the no-solutions empty-state copy");
      assertNoRawCodes(html, "Scenario 1");
    });

    // === Scenario 2 — Needs Review full display =================================================
    check("Scenario 2: Needs Review assessment shows full findings and the review action", () => {
      const assessment = makeAssessment({
        status: "needs_review",
        whatFound: [F("Tiene página de Google confirmada.", "Has a confirmed Google page.")],
        whatKnown: [F("Opera de martes a sábado.", "Operates Tuesday through Saturday.")],
        whatUnknown: [F("No sabemos el presupuesto mensual.", "We don't know the monthly budget.")],
        clientQuestions: [F("¿Cuál es su capacidad máxima?", "What is your maximum capacity?")],
        growthOpportunities: [F("Podría anunciar horas de menor tráfico.", "Could advertise off-peak hours.")],
      });
      const html = render(GrowthPlanPanel, {
        businessId: "biz-1",
        businessStage: "operating",
        roadmapType: "established",
        currentAssessment: assessment,
        assessmentHistory: [],
        solutions: [],
        campaigns: [],
        officialRequirements: [],
        roadmapSteps: [],
        mediaChannels: [],
        ...basePermissions,
      });
      assert.ok(html.includes("Necesita revisión / Needs Review"), "expected needs_review status chip");
      assert.ok(html.includes("Tiene página de Google confirmada."), "expected whatFound item rendered");
      assert.ok(html.includes("No sabemos el presupuesto mensual."), "expected whatUnknown item rendered");
      assert.ok(html.includes("¿Cuál es su capacidad máxima?"), "expected client question rendered");
      assert.ok(html.includes("Revisar evaluación / Review Assessment"), "expected review-assessment action block");
      assert.ok(html.includes("Aceptar como guía de trabajo / Accept as working guidance"), "expected accept-as-working-guidance button");
      assert.ok(html.includes("Ninguna decisión confirma hechos automáticamente"), "expected the no-silent-fact-promotion disclaimer");
      assert.ok(html.includes("Necesita corrección / Needs correction"), "expected the needs-correction review decision button");
      assert.ok(html.includes("Rechazar / Reject"), "expected the reject review decision button");
      assertNoRawCodes(html, "Scenario 2");
    });

    // === Scenario 3 — Reviewed assessment + real action bridges ================================
    check("Scenario 3: Reviewed assessment exposes real action bridges into owning domains", () => {
      const assessment = makeAssessment({ status: "reviewed", reviewedAt: NOW, reviewedByRole: "sales_manager" });
      const solutions = [
        makeSolution({ providerClass: "leonix_provides", category: "brand", titleEs: "Rediseñar el logo", titleEn: "Redesign the logo", state: "approved" }),
        makeSolution({ providerClass: "external_professional_required", category: "legal_licensing", titleEs: "Confirmar licencia", titleEn: "Confirm license", state: "reviewed" }),
      ];
      const requirement = makeRequirement({ state: "needs_research" });
      const campaign = makeCampaign({ status: "ready_for_review" });
      const html = render(GrowthPlanPanel, {
        businessId: "biz-1",
        businessStage: "operating",
        roadmapType: "established",
        currentAssessment: assessment,
        assessmentHistory: [],
        solutions,
        campaigns: [campaign],
        officialRequirements: [requirement],
        roadmapSteps: [],
        mediaChannels: [],
        ...basePermissions,
      });
      assert.ok(html.includes("Crear proyecto de logo / Create Logo Project"), "expected Creative Studio logo bridge for a logo solution");
      assert.ok(html.includes("Investigar requisito / Research Requirement"), "expected official-requirements research bridge for a legal solution");
      assert.ok(html.includes("Crear seguimiento / Create Follow-up"), "expected follow-up bridge on every actionable solution");
      assert.ok(html.includes("Requiere investigación oficial / Needs Official Research"), "expected the pending official requirement badge");
      assert.ok(html.includes("Verificar / Verify"), "expected the verify-requirement bridge (manager-only)");
      assert.ok(html.includes("Avanzar a / Move to ready_for_review") === false, "current status should not offer to move to itself");
      assert.ok(html.includes("Crear campaña / Build Campaign"), "expected campaign builder entry point");
      assertNoRawCodes(html, "Scenario 3");
    });

    // === Scenario 4 — War-Fitness-style established business acceptance fixture ================
    check("Scenario 4: Established gym fixture — membership/promotion/capacity questions, conditional campaign, no invented metrics", () => {
      const assessment = makeAssessment({
        status: "reviewed",
        reviewedAt: NOW,
        whatFound: [F("El gimnasio confirma 3 ubicaciones activas.", "The gym confirms 3 active locations.")],
        whatKnown: [F("Ofrece membresías mensuales y anuales.", "Offers monthly and annual memberships.")],
        clientQuestions: [
          F("¿Cuántos miembros activos tiene actualmente?", "How many active members do you currently have?"),
          F("¿Qué porcentaje de capacidad usan sus clases de mayor demanda?", "What percentage of capacity do your highest-demand classes use?"),
          F("¿Qué promociones de membresía ha ofrecido antes?", "What membership promotions have you offered before?"),
          F("¿Cuál es la capacidad máxima por clase?", "What is the maximum capacity per class?"),
        ],
        recommendedMediaMix: [{ ...F("Promover el paquete de inscripción en redes de Leonix.", "Promote the enrollment package on Leonix social."), channelKey: "leonix_social" }],
        nextRightMoveEs: "Confirmar capacidad real antes de lanzar una promoción de inscripción.",
        nextRightMoveEn: "Confirm real capacity before launching an enrollment promotion.",
      });
      const solutions = [makeSolution({ providerClass: "leonix_provides", category: "membership_campaign", titleEs: "Campaña de inscripción", titleEn: "Enrollment campaign", state: "approved", readiness: "ready" })];
      const mediaChannels = [{ id: "mc-1", channelKey: "leonix_social", channelClass: "leonix_owned", labelEs: "Redes de Leonix", labelEn: "Leonix Social", availabilityState: "available", config: {}, notesEs: null, notesEn: null, isActive: true }];
      const html = render(GrowthPlanPanel, {
        businessId: "biz-1",
        businessStage: "operating",
        roadmapType: "established",
        currentAssessment: assessment,
        assessmentHistory: [],
        solutions,
        campaigns: [],
        officialRequirements: [],
        roadmapSteps: [],
        mediaChannels,
        ...basePermissions,
      });
      assert.ok(html.includes("Próximo paso correcto / Next Right Move"), "expected the Next Right Move heading");
      assert.ok(html.includes("Confirmar capacidad real antes de lanzar una promoción de inscripción."), "expected the exact next-right-move text");
      assert.ok(html.includes("El gimnasio confirma 3 ubicaciones activas."), "expected the What We Found item");
      assert.ok(html.includes("¿Cuántos miembros activos tiene actualmente?"), "expected membership question 1");
      assert.ok(html.includes("¿Qué porcentaje de capacidad usan sus clases de mayor demanda?"), "expected capacity question 2");
      assert.ok(html.includes("¿Qué promociones de membresía ha ofrecido antes?"), "expected promotion question 3");
      assert.ok(html.includes("¿Cuál es la capacidad máxima por clase?"), "expected capacity question 4");
      assert.ok(html.includes("Campaña de inscripción"), "expected the conditional recommended solution");
      assert.ok(html.includes("Redes de Leonix / Leonix Social"), "expected the conditional media mix entry");
      assert.ok(!/\d+%\s*(occupancy|attendance|retention)/i.test(html), "must not invent unverified performance metrics");
      assertNoRawCodes(html, "Scenario 4");
    });

    // === Scenario 5 — Startup / Idea ============================================================
    check("Scenario 5: Startup business shows the startup roadmap and never fakes a licensing conclusion", () => {
      const assessment = makeAssessment({
        status: "needs_review",
        whatUnknown: [F("El nombre del negocio no está confirmado.", "The business name is not confirmed.")],
      });
      const requirement = makeRequirement({ state: "needs_research", requirementTopicEs: "Licencia de alimentos", requirementTopicEn: "Food handling license" });
      const html = render(GrowthPlanPanel, {
        businessId: "biz-1",
        businessStage: "planning_prelaunch",
        roadmapType: "startup",
        currentAssessment: assessment,
        assessmentHistory: [],
        solutions: [],
        campaigns: [],
        officialRequirements: [requirement],
        roadmapSteps: [],
        mediaChannels: [],
        ...basePermissions,
      });
      assert.ok(html.includes("Idea / Idea") || html.includes(">Idea /"), "expected the startup roadmap's first step (Idea)");
      assert.ok(html.includes("Modelo de negocio / Business Model"), "expected a startup-only roadmap step");
      assert.ok(!html.includes("Entender / Understand"), "must not show the established roadmap's Understand step for a startup");
      assert.ok(html.includes("Requiere investigación oficial / Needs Official Research"), "expected the honest needs-research badge, not a fabricated verified license");
      assert.ok(!html.includes("human_verified"), "must never render the raw human_verified state string");
      assertNoRawCodes(html, "Scenario 5");
    });

    // === Scenario 6 — Low Information ===========================================================
    check("Scenario 6: Low-information business shows unknowns dominating and no aggressive media plan", () => {
      const assessment = makeAssessment({
        status: "needs_review",
        whatFound: [],
        whatKnown: [],
        whatUnknown: [F("No sabemos el tipo de negocio exacto.", "We don't know the exact business type."), F("No hay información de contacto verificada.", "No verified contact information.")],
        needsVerification: [F("Confirmar si el negocio sigue operando.", "Confirm whether the business is still operating.")],
        recommendedMediaMix: [],
        nextRightMoveEs: "Reunir información básica antes de recomendar cualquier medio.",
        nextRightMoveEn: "Gather basic information before recommending any media.",
      });
      const html = render(GrowthPlanPanel, {
        businessId: "biz-1",
        businessStage: "operating",
        roadmapType: "established",
        currentAssessment: assessment,
        assessmentHistory: [],
        solutions: [],
        campaigns: [],
        officialRequirements: [],
        roadmapSteps: [],
        mediaChannels: [],
        ...basePermissions,
      });
      assert.ok(html.includes("Necesita más información / Need More Information"), "expected the needs-more-information readiness chip when unknowns dominate");
      assert.ok(html.includes("Reunir información básica antes de recomendar cualquier medio."), "expected a gather-information next move, not a media push");
      assert.ok(!html.includes("Plan de medios"), "Media/Exposure Plan section must not render when there is no recommended media mix");
      assertNoRawCodes(html, "Scenario 6");
    });

    // === Scenario 7 — Contradiction ==============================================================
    check("Scenario 7: Contradiction stays visibly unresolved, never falsely marked reviewed", () => {
      const assessment = makeAssessment({
        status: "needs_review",
        needsVerification: [F("El horario del sitio web no coincide con lo que dijo el dueño.", "The website hours don't match what the owner stated.")],
        weakOrMissing: [F("Contradicción entre fuentes sobre el horario.", "Contradiction between sources about hours.")],
      });
      const html = render(GrowthPlanPanel, {
        businessId: "biz-1",
        businessStage: "operating",
        roadmapType: "established",
        currentAssessment: assessment,
        assessmentHistory: [],
        solutions: [],
        campaigns: [],
        officialRequirements: [],
        roadmapSteps: [],
        mediaChannels: [],
        ...basePermissions,
      });
      assert.ok(html.includes("El horario del sitio web no coincide con lo que dijo el dueño."), "expected the contradiction surfaced under Needs Client Confirmation");
      assert.ok(html.includes("Requiere confirmación del cliente / Needs Client Confirmation"), "expected the needs-confirmation group heading");
      assert.ok(!html.includes("Revisado / Reviewed"), "must not display a Reviewed status chip while the assessment is still needs_review");
      assertNoRawCodes(html, "Scenario 7");
    });

    // === Scenario 8 — View-only sales rep =======================================================
    check("Scenario 8: View-only actor sees full content but zero manager-only controls", () => {
      const assessment = makeAssessment({
        status: "reviewed",
        reviewedAt: NOW,
        whatFound: [F("Confirmado por el dueño.", "Confirmed by the owner.")],
        clientQuestions: [F("¿Cuál es su presupuesto mensual?", "What is your monthly budget?")],
      });
      const solutions = [makeSolution({ state: "reviewed" })];
      const requirement = makeRequirement({ state: "needs_research" });
      const campaign = makeCampaign({ status: "draft" });
      const html = render(GrowthPlanPanel, {
        businessId: "biz-1",
        businessStage: "operating",
        roadmapType: "established",
        currentAssessment: assessment,
        assessmentHistory: [],
        solutions,
        campaigns: [campaign],
        officialRequirements: [requirement],
        roadmapSteps: [],
        mediaChannels: [],
        canCreateAssessment: false,
        canReviewAssessment: false,
        canManageSolutions: false,
        canManageCampaigns: false,
        canManageRoadmap: false,
        canManageOfficialRequirements: false,
        canManageCommitments: false,
      });
      assert.ok(html.includes("Confirmado por el dueño."), "view-only actor must still see What We Found content");
      assert.ok(html.includes("¿Cuál es su presupuesto mensual?"), "view-only actor must still see client questions");
      assert.ok(!html.includes("Aceptar como guía de trabajo"), "view-only actor must not see the review action");
      // "Descartar / Dismiss" is ambiguous on its own since Gate D reuses the same label for the
      // ephemeral, ungated per-question dismiss control (QuestionsBatchAddForm) — scope the
      // solution-state-dismiss check to the Recommended Solutions section specifically.
      const solutionsSectionStart = html.indexOf("Soluciones recomendadas / Recommended Solutions");
      assert.ok(solutionsSectionStart !== -1, "expected the Recommended Solutions section to render");
      const solutionsSectionEnd = html.indexOf("Hoja de ruta / Roadmap", solutionsSectionStart);
      const solutionsSectionHtml = html.slice(solutionsSectionStart, solutionsSectionEnd === -1 ? undefined : solutionsSectionEnd);
      assert.ok(!solutionsSectionHtml.includes("Aprobar / Approve") && !solutionsSectionHtml.includes("Descartar / Dismiss"), "view-only actor must not see solution state controls");
      assert.ok(!solutionsSectionHtml.includes("Crear compromiso") && !solutionsSectionHtml.includes("Create commitment"), "view-only actor must not see the commitment-creation bridge");
      // "Verificar / Verify" is ambiguous on its own — the established roadmap's "verify" step
      // shares the exact same bilingual label text. Scope the check to the Official Requirements
      // section itself (between its own heading and the next top-level section) to confirm the
      // manager-only verify-requirement control is absent there specifically.
      const requirementsSectionStart = html.indexOf("Requisitos oficiales / Official Requirements");
      assert.ok(requirementsSectionStart !== -1, "expected the Official Requirements section to render its view-only content");
      // "Hoja de ruta / Roadmap" always renders (unlike the optional Media Mix section), so it's a
      // reliable end-of-section boundary regardless of fixture content.
      const requirementsSectionEnd = html.indexOf("Hoja de ruta / Roadmap", requirementsSectionStart);
      assert.ok(requirementsSectionEnd !== -1, "expected the Roadmap section to follow Official Requirements");
      const requirementsSectionHtml = html.slice(requirementsSectionStart, requirementsSectionEnd);
      assert.ok(!requirementsSectionHtml.includes("Verificar / Verify"), "view-only actor must not see the verify-requirement control");
      assert.ok(!html.includes("Crear campaña / Build Campaign"), "view-only actor must not see the campaign builder");
      assert.ok(!html.includes("Avanzar a / Move to"), "view-only actor must not see campaign status advance control");
      assertNoRawCodes(html, "Scenario 8");
    });

    // === Scenario 9 (Gate D) — Needs Correction / Rejected banners, never shown as working guidance
    check("Scenario 9: needs_correction and rejected assessments show a clear non-working-guidance banner with the reviewer note", () => {
      const correctionAssessment = makeAssessment({ status: "needs_correction", operatorReviewNotes: "El nombre del negocio está mal escrito." });
      const htmlCorrection = render(GrowthPlanPanel, {
        businessId: "biz-9a", businessStage: "operating", roadmapType: "established",
        currentAssessment: correctionAssessment, assessmentHistory: [], solutions: [], campaigns: [],
        officialRequirements: [], roadmapSteps: [], mediaChannels: [], ...basePermissions,
      });
      assert.ok(htmlCorrection.includes("Necesita corrección — no es guía de trabajo"), "expected the needs_correction banner");
      assert.ok(htmlCorrection.includes("El nombre del negocio está mal escrito."), "expected the reviewer's correction note to render");
      assert.ok(htmlCorrection.includes("Vuelva a analizar"), "expected the re-analyze prompt");
      assertNoRawCodes(htmlCorrection, "Scenario 9a");

      const rejectedAssessment = makeAssessment({ status: "rejected", operatorReviewNotes: "La información de origen no es confiable." });
      const htmlRejected = render(GrowthPlanPanel, {
        businessId: "biz-9b", businessStage: "operating", roadmapType: "established",
        currentAssessment: rejectedAssessment, assessmentHistory: [], solutions: [], campaigns: [],
        officialRequirements: [], roadmapSteps: [], mediaChannels: [], ...basePermissions,
      });
      assert.ok(htmlRejected.includes("Rechazado — no es guía de trabajo"), "expected the rejected banner");
      assert.ok(htmlRejected.includes("La información de origen no es confiable."), "expected the reviewer's rejection reason to render");
      assert.ok(!htmlRejected.includes("Revisado / Reviewed"), "a rejected assessment must never show as Reviewed");
      assertNoRawCodes(htmlRejected, "Scenario 9b");
    });

    // === Scenario 10 (Gate D) — execution matrix routes external professional / partner / promo to commitments
    check("Scenario 10: external professional, partner coordination, and promotional material solutions offer a Promise Keeper commitment bridge, never a fake Creative Studio job", () => {
      const assessment = makeAssessment({ status: "reviewed", reviewedAt: NOW });
      const solutions = [
        makeSolution({ providerClass: "external_professional_required", category: "specialized_it_security", titleEs: "Auditoría de seguridad de TI", titleEn: "IT security audit", state: "reviewed" }),
        makeSolution({ providerClass: "leonix_coordinates_partner", category: "radio", titleEs: "Spot de radio", titleEn: "Radio spot", state: "reviewed" }),
        makeSolution({ providerClass: "leonix_provides", category: "promotional_material", titleEs: "Pedido de volantes", titleEn: "Flyer order", state: "reviewed" }),
      ];
      const html = render(GrowthPlanPanel, {
        businessId: "biz-10", businessStage: "operating", roadmapType: "established",
        currentAssessment: assessment, assessmentHistory: [], solutions, campaigns: [],
        officialRequirements: [], roadmapSteps: [], mediaChannels: [], ...basePermissions,
      });
      assert.ok(html.includes("Crear compromiso: profesional externo"), "expected the external-professional commitment bridge");
      assert.ok(html.includes("Crear compromiso: coordinar socio"), "expected the partner-coordination commitment bridge");
      assert.ok(html.includes("Crear compromiso: pedido Promocionales"), "expected the promotional-material commitment bridge");
      assert.ok(!html.includes("Crear proyecto de logo") && !html.includes("Crear proyecto de sitio web"), "none of these three routes should ever open a Creative Studio job");
      assertNoRawCodes(html, "Scenario 10");
    });
  }

  await run();
  } finally {
    rmSync(scratchDir, { recursive: true, force: true });
  }
}

main()
  .then(() => {
    console.log(`\n${passed} check(s) passed.`);
    if (process.exitCode) {
      console.error("\nSOME CHECKS FAILED.");
    } else {
      console.log("ALL CHECKS PASSED.");
    }
  })
  .catch((e) => {
    console.error("UNEXPECTED FAILURE:", e);
    process.exitCode = 1;
  });

