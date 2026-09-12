import Link from "next/link";
import {
  AnalyzeBusinessButton,
  ReviewAssessmentButton,
  PromoteSuggestionButton,
  SolutionStateButtons,
  CreateCreativeRequestButton,
  CreateFollowUpFromSolutionButton,
  CreateCommitmentButton,
  ResearchOfficialRequirementButton,
  VerifyOfficialRequirementForm,
  RoadmapStepControl,
  QuestionsBatchAddForm,
  CampaignBuilderForm,
  CampaignStatusControl,
  RecordOutcomeForm,
} from "./GrowthPlanActions";
import { providerClassLabel, roadmapStateLabel } from "./growthPlanLabels";
import { roadmapStepCatalog } from "@/app/lib/business/growthEngine/roadmapCatalog";
import { classifyGrowthSolutionExecutionRoute, growthExecutionRouteIsCreativeStudio } from "@/app/lib/business/growthEngine/executionMatrix";
import type {
  GrowthAssessment,
  GrowthCampaign,
  GrowthMediaChannel,
  GrowthOfficialRequirement,
  GrowthProviderClass,
  GrowthRoadmapStep,
  GrowthRoadmapType,
  GrowthSolution,
} from "@/app/lib/business/growthEngine/types";
import type { BusinessStage } from "@/app/lib/business/types";
import type { BusinessOutcome } from "@/app/lib/business/outcomes/types";
import type { OpportunityReadinessResult } from "@/app/lib/business/opportunity/readinessAdapter";

const CARD = "rounded-2xl border border-[#E8DFD0] bg-white p-4";

// ---------------------------------------------------------------------------
// Readiness — a display-only heuristic derived transparently from the current assessment's own
// content and its promoted solutions' own readiness fields. Never a stored/fabricated value —
// business_growth_assessments has no readiness column; this is purely how Growth Plan presents
// what the assessment and solutions already say.
// ---------------------------------------------------------------------------
type DisplayReadiness = "ready" | "needs_preparation" | "needs_more_information" | "blocked";

const READINESS_LABEL: Record<DisplayReadiness, { es: string; en: string; className: string }> = {
  ready: { es: "Listo", en: "Ready", className: "bg-emerald-100 text-emerald-900" },
  needs_preparation: { es: "Necesita preparación", en: "Needs Preparation", className: "bg-amber-100 text-amber-800" },
  needs_more_information: { es: "Necesita más información", en: "Need More Information", className: "bg-[#EDE6D6] text-[#3D3428]" },
  blocked: { es: "Bloqueado", en: "Blocked", className: "bg-red-100 text-red-800" },
};

function deriveDisplayReadiness(assessment: GrowthAssessment, solutions: readonly GrowthSolution[]): DisplayReadiness {
  if (solutions.some((s) => s.state !== "dismissed" && s.state !== "complete" && s.readiness === "blocked")) return "blocked";
  const knownWeight = assessment.whatKnown.length + assessment.whatFound.length;
  const unknownWeight = assessment.whatUnknown.length + assessment.needsVerification.length;
  if (unknownWeight > knownWeight) return "needs_more_information";
  if (solutions.some((s) => s.state !== "dismissed" && s.readiness === "ready")) return "ready";
  return "needs_preparation";
}

const ASSESSMENT_STATUS_LABEL: Record<GrowthAssessment["status"], { es: string; en: string; className: string }> = {
  draft: { es: "Borrador", en: "Draft", className: "bg-[#EDE6D6] text-[#7A7164]" },
  needs_review: { es: "Necesita revisión", en: "Needs Review", className: "bg-amber-100 text-amber-800" },
  reviewed: { es: "Revisado", en: "Reviewed", className: "bg-emerald-100 text-emerald-900" },
  needs_correction: { es: "Necesita corrección", en: "Needs Correction", className: "bg-amber-100 text-amber-900" },
  rejected: { es: "Rechazado", en: "Rejected", className: "bg-red-100 text-red-800" },
  superseded: { es: "Reemplazado", en: "Superseded", className: "bg-[#EDE6D6] text-[#7A7164]" },
};

// =================================================================================================
// SECTION 1 — Growth Snapshot
// =================================================================================================
function GrowthSnapshotSection({
  businessId,
  businessStage,
  currentAssessment,
  solutions,
  canCreateAssessment,
  canReviewAssessment,
}: {
  businessId: string;
  businessStage: BusinessStage;
  currentAssessment: GrowthAssessment | null;
  solutions: readonly GrowthSolution[];
  canCreateAssessment: boolean;
  canReviewAssessment: boolean;
}) {
  const isStartup = businessStage === "planning_prelaunch" || businessStage === "newly_opened";
  const statusLabel = currentAssessment ? ASSESSMENT_STATUS_LABEL[currentAssessment.status] : null;
  const readiness = currentAssessment ? deriveDisplayReadiness(currentAssessment, solutions) : null;
  const readinessLabel = readiness ? READINESS_LABEL[readiness] : null;

  return (
    <section className={CARD}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#FAF7F2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">
          {isStartup ? "Idea / Startup" : "Negocio establecido / Established"}
        </span>
        {statusLabel ? (
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusLabel.className}`}>
            {statusLabel.es} / {statusLabel.en}
          </span>
        ) : (
          <span className="rounded-full bg-[#EDE6D6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">
            Sin analizar / Not Analyzed
          </span>
        )}
        {readinessLabel ? (
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${readinessLabel.className}`}>
            {readinessLabel.es} / {readinessLabel.en}
          </span>
        ) : null}
      </div>

      {currentAssessment ? (
        <div className="mt-3 rounded-xl border border-[#C9A84A]/40 bg-[#FFFDF7] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Próximo paso correcto / Next Right Move</p>
          <p className="mt-1 text-sm font-semibold text-[#1E1810]">{currentAssessment.nextRightMoveEs}</p>
          <p className="text-sm text-[#6B5E47]">{currentAssessment.nextRightMoveEn}</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-[#6B5E47]">
          Analice este negocio para identificar vacíos, preguntas del cliente y próximos pasos. / Analyze this business to identify gaps, client questions, and next steps.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {canCreateAssessment ? (
          <AnalyzeBusinessButton businessId={businessId} hasAssessment={Boolean(currentAssessment)} />
        ) : !currentAssessment ? (
          <p className="text-xs text-[#7A7164]">Se requiere un gerente para analizar este negocio. / A manager is required to analyze this business.</p>
        ) : null}
      </div>

      {currentAssessment && currentAssessment.status === "needs_review" && canReviewAssessment ? (
        <div className="mt-3 border-t border-dashed border-[#E8DFD0] pt-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Revisar evaluación / Review Assessment</p>
          <ReviewAssessmentButton businessId={businessId} assessmentId={currentAssessment.id} />
        </div>
      ) : null}

      {currentAssessment && (currentAssessment.status === "needs_correction" || currentAssessment.status === "rejected") ? (
        <div className={`mt-3 rounded-xl border p-3 ${currentAssessment.status === "rejected" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wide ${currentAssessment.status === "rejected" ? "text-red-800" : "text-amber-900"}`}>
            {currentAssessment.status === "rejected" ? "Rechazado — no es guía de trabajo / Rejected — not working guidance" : "Necesita corrección — no es guía de trabajo / Needs correction — not working guidance"}
          </p>
          {currentAssessment.operatorReviewNotes ? <p className="mt-1 text-sm text-[#3D3428]">{currentAssessment.operatorReviewNotes}</p> : null}
          <p className="mt-1 text-[11px] text-[#7A7164]">
            Vuelva a analizar para crear una nueva versión que incorpore esto. / Re-analyze to create a new version that incorporates this.
          </p>
        </div>
      ) : null}
    </section>
  );
}

// =================================================================================================
// SECTION 2 — What We Found
// =================================================================================================
function WhatWeFoundSection({ assessment }: { assessment: GrowthAssessment }) {
  const items = [...assessment.whatFound, ...assessment.whatKnown].slice(0, 6);
  return (
    <section className={CARD}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Lo que encontramos / What We Found</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-[#6B5E47]">No hay hallazgos todavía. / No findings yet.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="rounded-lg border border-dashed border-[#E8DFD0] p-2 text-sm">
              <span className="block">{item.textEs}</span>
              <span className="block text-[#6B5E47]">{item.textEn}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={`#business-book`} className="inline-flex min-h-[36px] items-center rounded-lg border border-[#E8DFD0] px-3 py-1.5 text-[11px] font-semibold text-[#3D3428]">
          Ver Libro del Negocio / View Business Book
        </Link>
        <Link href={`#discover`} className="inline-flex min-h-[36px] items-center rounded-lg border border-[#E8DFD0] px-3 py-1.5 text-[11px] font-semibold text-[#3D3428]">
          Ver Investigación / View Research
        </Link>
      </div>
    </section>
  );
}

// =================================================================================================
// SECTION 3 — Missing / Needs Confirmation
// =================================================================================================
function MissingInformationSection({ assessment }: { assessment: GrowthAssessment }) {
  const groups: { titleEs: string; titleEn: string; items: readonly { textEs: string; textEn: string }[] }[] = [
    { titleEs: "Información faltante", titleEn: "Missing Information", items: assessment.whatUnknown },
    { titleEs: "Requiere confirmación del cliente", titleEn: "Needs Client Confirmation", items: assessment.needsVerification },
    { titleEs: "Requiere atención", titleEn: "Needs Attention", items: assessment.weakOrMissing },
  ];
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <section className={CARD}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Falta / Requiere confirmación — Missing / Needs Confirmation</h3>
      {total === 0 ? (
        <p className="mt-2 text-sm text-[#6B5E47]">No hay vacíos identificados en este momento. / No gaps identified right now.</p>
      ) : (
        groups
          .filter((g) => g.items.length > 0)
          .map((g) => (
            <div key={g.titleEn} className="mt-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A1E2C]">{g.titleEs} / {g.titleEn}</p>
              <ul className="mt-1 space-y-1.5">
                {g.items.slice(0, 6).map((item, i) => (
                  <li key={i} className="rounded-lg border border-dashed border-[#E8DFD0] p-2 text-sm">
                    <span className="block">{item.textEs}</span>
                    <span className="block text-[#6B5E47]">{item.textEn}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
      )}
    </section>
  );
}

// =================================================================================================
// SECTION 4 — Questions for the Client
// =================================================================================================
function QuestionsSection({ businessId, assessment }: { businessId: string; assessment: GrowthAssessment }) {
  return (
    <section className={CARD}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Preguntas para el cliente / Questions for the Client</h3>
      {assessment.clientQuestions.length === 0 ? (
        <p className="mt-2 text-sm text-[#6B5E47]">No hay preguntas de crecimiento sin responder en este momento. / No unanswered growth questions right now.</p>
      ) : (
        <QuestionsBatchAddForm businessId={businessId} questions={assessment.clientQuestions} />
      )}
    </section>
  );
}

// =================================================================================================
// SECTION 5 — Growth Opportunities (informational — the canonical Opportunity system stays separate)
// =================================================================================================
function GrowthOpportunitiesSection({ assessment }: { assessment: GrowthAssessment }) {
  return (
    <section className={CARD}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Oportunidades de crecimiento / Growth Opportunities</h3>
      {assessment.growthOpportunities.length === 0 ? (
        <p className="mt-2 text-sm text-[#6B5E47]">No se identificaron oportunidades de crecimiento todavía. / No growth opportunities identified yet.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {assessment.growthOpportunities.slice(0, 6).map((item, i) => (
            <li key={i} className="rounded-lg border border-dashed border-[#E8DFD0] p-2 text-sm">
              <span className="block">{item.textEs}</span>
              <span className="block text-[#6B5E47]">{item.textEn}</span>
            </li>
          ))}
        </ul>
      )}
      <Link href="#opportunity" className="mt-3 inline-flex min-h-[36px] items-center rounded-lg border border-[#E8DFD0] px-3 py-1.5 text-[11px] font-semibold text-[#3D3428]">
        Ver Oportunidades / View Opportunities
      </Link>
    </section>
  );
}

// =================================================================================================
// SECTION 6 — Recommended Solutions (suggested, from the assessment, + canonical promoted ones)
// =================================================================================================
/**
 * Gate D — routes every solution through the ONE canonical execution matrix
 * (classifyGrowthSolutionExecutionRoute) instead of Gate C's inline regex, and adds the three
 * routes Gate C left unrepresented: EXTERNAL PROFESSIONAL, PARTNER COORDINATION, and PROMOTIONAL
 * MATERIAL — each a real Promise Keeper commitment via CreateCommitmentButton, never a fake
 * Creative Studio job (growthExecutionRouteIsCreativeStudio is the explicit guard for that rule).
 */
function SolutionExecutionActions({
  businessId,
  solution,
  canManageSolutions,
  canManageCommitments,
  canStartProjectDiscovery,
}: {
  businessId: string;
  solution: GrowthSolution;
  canManageSolutions: boolean;
  canManageCommitments: boolean;
  canStartProjectDiscovery: boolean;
}) {
  // Gate 3 — Client Discovery bridge (MD <growth_bridge>). A plain navigation link, never a second
  // "create discovery" write path: Start Discovery itself lives only in the Client Discovery tab,
  // so clicking this twice is harmless — if a discovery already exists it is simply shown, never
  // duplicated.
  const startDiscoveryLink =
    canStartProjectDiscovery && (solution.state === "reviewed" || solution.state === "approved" || solution.state === "in_progress") ? (
      <Link
        href={`/admin/businesses/${businessId}?startGrowthSolutionId=${solution.id}#client-discovery`}
        className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-3 py-1.5 text-[11px] font-semibold text-[#1E1810]"
      >
        Iniciar Descubrimiento del Cliente / Start Client Discovery
      </Link>
    ) : null;

  if (!canManageSolutions || solution.state === "dismissed") return startDiscoveryLink;
  if (solution.linkedCreativeJobId || solution.linkedCampaignId || solution.linkedOfficialRequirementId || solution.linkedCommitmentId) {
    return (
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <p className="text-[10px] text-emerald-800">Vinculado a trabajo existente / Linked to existing work</p>
        {startDiscoveryLink}
      </div>
    );
  }

  const { route } = classifyGrowthSolutionExecutionRoute(solution);
  const commitmentTitleEs = `Acción de crecimiento: ${solution.titleEs}`;
  const commitmentTitleEn = `Growth action: ${solution.titleEn}`;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {route === "official_requirement" ? (
        <ResearchOfficialRequirementButton businessId={businessId} jurisdiction={solution.category} topicEs={solution.titleEs} topicEn={solution.titleEn} />
      ) : null}
      {growthExecutionRouteIsCreativeStudio(route) ? (
        <CreateCreativeRequestButton
          businessId={businessId}
          solutionId={solution.id}
          lane={route === "creative_logo" ? "logo" : route === "creative_website" ? "website" : route === "creative_sponsored_editorial" ? "sponsored_editorial" : "ad"}
        />
      ) : null}
      {(route === "external_professional" || route === "partner_coordination" || route === "promotional_material") && canManageCommitments ? (
        <CreateCommitmentButton
          businessId={businessId}
          solutionId={solution.id}
          titleEs={commitmentTitleEs}
          titleEn={commitmentTitleEn}
          buttonLabelEs={route === "external_professional" ? "Crear compromiso: profesional externo" : route === "promotional_material" ? "Crear compromiso: pedido Promocionales" : "Crear compromiso: coordinar socio"}
          buttonLabelEn={route === "external_professional" ? "Create commitment: external professional" : route === "promotional_material" ? "Create commitment: Promocionales order" : "Create commitment: coordinate partner"}
        />
      ) : null}
      <CreateFollowUpFromSolutionButton businessId={businessId} purpose={`${solution.titleEs} / ${solution.titleEn}`} />
      {canManageCommitments ? (
        <CreateCommitmentButton
          businessId={businessId}
          solutionId={solution.id}
          titleEs={commitmentTitleEs}
          titleEn={commitmentTitleEn}
          buttonLabelEs="Crear compromiso"
          buttonLabelEn="Create commitment"
        />
      ) : null}
      {startDiscoveryLink}
    </div>
  );
}

/**
 * WHOLE-PRODUCT PARTIAL-CLOSURE (BU2_SIX_TEST_REUSE) — renders the same structured
 * Readiness/Capacity/Life-alignment/Lion-Code reasoning stewardship's six-test evaluator proves,
 * via the shared readinessAdapter (see the doctrine comment where sixTestReadiness is computed in
 * page.tsx). "Need" and "Value" are not shown because, exactly as for Opportunities, a Growth
 * solution has no Health Map dimensionKey / cost band to evaluate them against — this is the same
 * accepted scope limit the doctrine already established for Opportunities, not a new gap.
 */
function SixTestReuseBadge({ readiness }: { readiness: OpportunityReadinessResult }) {
  const rows: { label: string; pass: boolean }[] = [
    { label: "Readiness", pass: readiness.readinessIsReady },
    { label: "Capacity", pass: !readiness.capacityBlocked },
    { label: "Life alignment", pass: readiness.ownerGoalKnown },
    { label: "Lion Code", pass: !readiness.lionCodeConcern },
  ];
  return (
    <div className="mt-1 rounded-lg border border-dashed border-[#E8DFD0] bg-[#FAF7F2]/50 p-2">
      <div className="flex flex-wrap gap-1.5">
        {rows.map((r) => (
          <span key={r.label} className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${r.pass ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-800"}`}>
            {r.label}
          </span>
        ))}
      </div>
      <p className="mt-1 text-[10px] text-[#7A7164]">{readiness.explanationEs} / {readiness.explanationEn}</p>
    </div>
  );
}

function SolutionCard({
  businessId,
  solution,
  sixTestReadiness,
  canManageSolutions,
  canManageCommitments,
  canStartProjectDiscovery,
}: {
  businessId: string;
  solution: GrowthSolution;
  sixTestReadiness: OpportunityReadinessResult | null;
  canManageSolutions: boolean;
  canManageCommitments: boolean;
  canStartProjectDiscovery: boolean;
}) {
  return (
    <li className="rounded-lg border border-[#E8DFD0] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-bold uppercase text-[#8A6B1F]">{solution.state}</span>
        <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5 text-[10px] uppercase text-[#7A7164]">{solution.priority}</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-[#1E1810]">{solution.titleEs}</p>
      <p className="text-sm text-[#6B5E47]">{solution.titleEn}</p>
      {solution.rationaleEs ? (
        <p className="mt-1 text-xs text-[#7A7164]">
          {solution.rationaleEs} / {solution.rationaleEn}
        </p>
      ) : null}
      {sixTestReadiness && solution.state !== "dismissed" && solution.state !== "complete" ? <SixTestReuseBadge readiness={sixTestReadiness} /> : null}
      {canManageSolutions ? <SolutionStateButtons businessId={businessId} solutionId={solution.id} state={solution.state} /> : null}
      <SolutionExecutionActions businessId={businessId} solution={solution} canManageSolutions={canManageSolutions} canManageCommitments={canManageCommitments} canStartProjectDiscovery={canStartProjectDiscovery} />
    </li>
  );
}

function RecommendedSolutionsSection({
  businessId,
  assessment,
  solutions,
  sixTestReadiness,
  canManageSolutions,
  canManageCommitments,
  canStartProjectDiscovery,
}: {
  businessId: string;
  assessment: GrowthAssessment | null;
  solutions: readonly GrowthSolution[];
  sixTestReadiness: OpportunityReadinessResult | null;
  canManageSolutions: boolean;
  canManageCommitments: boolean;
  canStartProjectDiscovery: boolean;
}) {
  const byClass = (pc: GrowthProviderClass) => solutions.filter((s) => s.providerClass === pc);
  const groups: { pc: GrowthProviderClass; items: GrowthSolution[] }[] = [
    { pc: "leonix_provides", items: byClass("leonix_provides") },
    { pc: "leonix_coordinates_partner", items: byClass("leonix_coordinates_partner") },
    { pc: "external_professional_required", items: byClass("external_professional_required") },
  ];
  const suggestions = assessment?.suggestedSolutions ?? [];

  return (
    <section className={CARD}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Soluciones recomendadas / Recommended Solutions</h3>
      {solutions.length === 0 && suggestions.length === 0 ? (
        <p className="mt-2 text-sm text-[#6B5E47]">
          No se debe recomendar ninguna solución hasta que sepamos más. / No solution should be recommended until we know more.
        </p>
      ) : null}

      {groups.map((g) =>
        g.items.length > 0 ? (
          <div key={g.pc} className="mt-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A1E2C]">{providerClassLabel(g.pc)}</p>
            <ul className="mt-1 space-y-2">
              {g.items.map((s) => (
                <SolutionCard key={s.id} businessId={businessId} solution={s} sixTestReadiness={sixTestReadiness} canManageSolutions={canManageSolutions} canManageCommitments={canManageCommitments} canStartProjectDiscovery={canStartProjectDiscovery} />
              ))}
            </ul>
          </div>
        ) : null,
      )}

      {suggestions.length > 0 && assessment ? (
        <div className="mt-3 border-t border-dashed border-[#E8DFD0] pt-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Sugerencias de IA sin revisar / Unreviewed AI suggestions</p>
          <ul className="mt-1 space-y-2">
            {suggestions.slice(0, 8).map((s, i) => (
              <li key={i} className="rounded-lg border border-dashed border-[#E8DFD0] p-2">
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-800">Sugerencia / Suggestion</span>
                <p className="mt-1 text-sm">{s.textEs}</p>
                <p className="text-sm text-[#6B5E47]">{s.textEn}</p>
                <p className="mt-0.5 text-[10px] text-[#9A9184]">{providerClassLabel(s.providerClass)}</p>
                {canManageSolutions ? (
                  <PromoteSuggestionButton businessId={businessId} assessmentId={assessment.id} suggestion={{ ...s, evidenceRefs: s.evidenceRefs ?? [] }} />
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

// =================================================================================================
// SECTION 7 — Media / Exposure Plan
// =================================================================================================
function MediaMixSection({ assessment, mediaChannels }: { assessment: GrowthAssessment | null; mediaChannels: readonly GrowthMediaChannel[] }) {
  if (!assessment || assessment.recommendedMediaMix.length === 0) return null;
  const byKey = new Map(mediaChannels.map((c) => [c.channelKey, c]));

  return (
    <section className={CARD}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Plan de medios / exposición — Media / Exposure Plan</h3>
      <ul className="mt-2 space-y-1.5">
        {assessment.recommendedMediaMix.map((item, i) => {
          const channel = byKey.get(item.channelKey);
          const isPartner = channel?.channelClass === "partner";
          return (
            <li key={i} className="rounded-lg border border-dashed border-[#E8DFD0] p-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[#1E1810]">{channel ? `${channel.labelEs} / ${channel.labelEn}` : item.channelKey}</span>
                {isPartner ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-800">Canal socio / Partner channel</span> : null}
              </div>
              <p className="mt-0.5">{item.textEs}</p>
              <p className="text-[#6B5E47]">{item.textEn}</p>
              {isPartner ? (
                <p className="mt-1 text-[10px] text-[#9A9184]">
                  Los términos comerciales requieren confirmación. / Commercial terms require confirmation.
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// =================================================================================================
// SECTION 8 — Roadmap
// =================================================================================================
function RoadmapSection({
  businessId,
  roadmapType,
  steps,
  canManageRoadmap,
}: {
  businessId: string;
  roadmapType: GrowthRoadmapType;
  steps: readonly GrowthRoadmapStep[];
  canManageRoadmap: boolean;
}) {
  const catalog = roadmapStepCatalog(roadmapType);
  const byKey = new Map(steps.map((s) => [s.stepKey, s]));
  const ordered = catalog.map((def) => ({ def, step: byKey.get(def.stepKey) ?? null }));

  const currentIndex = ordered.findIndex(({ step }) => step?.state === "in_progress");
  const firstIncompleteIndex = ordered.findIndex(({ step }) => !step || (step.state !== "complete" && step.state !== "not_applicable"));
  const focusIndex = currentIndex !== -1 ? currentIndex : firstIncompleteIndex !== -1 ? firstIncompleteIndex : 0;
  const preview = ordered.slice(Math.max(0, focusIndex - 1), focusIndex + 3);

  return (
    <section className={CARD}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Hoja de ruta / Roadmap</h3>
      <ol className="mt-2 space-y-1.5">
        {preview.map(({ def, step }) => {
          const state = step?.state ?? "not_started";
          return (
            <li key={def.stepKey} className="flex flex-col gap-2 rounded-lg border border-[#E8DFD0] p-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <span className="text-sm font-semibold text-[#1E1810]">
                {def.labelEs} / {def.labelEn}
              </span>
              <span className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5 text-[10px] uppercase text-[#7A7164]">{roadmapStateLabel(state)}</span>
                {canManageRoadmap ? <RoadmapStepControl businessId={businessId} stepKey={def.stepKey} state={state} /> : null}
              </span>
            </li>
          );
        })}
      </ol>
      <details className="mt-2">
        <summary className="cursor-pointer text-[11px] font-semibold text-[#7A1E2C]">Ver hoja de ruta completa / View full roadmap</summary>
        <ol className="mt-2 space-y-1">
          {ordered.map(({ def, step }) => (
            <li key={def.stepKey} className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-[#E8DFD0] px-2 py-1.5 text-xs">
              <span>{def.labelEs} / {def.labelEn}</span>
              <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5 text-[10px] uppercase text-[#7A7164]">{roadmapStateLabel(step?.state ?? "not_started")}</span>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

// =================================================================================================
// SECTION 9 — Projects / Campaigns
// =================================================================================================
function ProjectsCampaignsSection({
  businessId,
  campaigns,
  solutions,
  canManageCampaigns,
  mediaChannels,
  reviewedAssessment,
}: {
  businessId: string;
  campaigns: readonly GrowthCampaign[];
  solutions: readonly GrowthSolution[];
  canManageCampaigns: boolean;
  mediaChannels: readonly GrowthMediaChannel[];
  reviewedAssessment: GrowthAssessment | null;
}) {
  const activeCampaigns = campaigns.filter((c) => c.status !== "complete" && c.status !== "cancelled");
  const activeProjects = solutions.filter((s) => s.state === "in_progress" && (s.linkedCreativeJobId || s.linkedOfficialRequirementId));

  return (
    <section className={CARD}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Proyectos / Campañas — Projects / Campaigns</h3>

      {activeProjects.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {activeProjects.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-[#E8DFD0] p-2 text-sm">
              <span>{s.titleEs} / {s.titleEn}</span>
              <Link href={s.linkedCreativeJobId ? "#creative" : "#growth-plan"} className="text-[11px] font-semibold text-[#7A1E2C]">
                Abrir / Open
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {activeCampaigns.length === 0 ? (
        <p className="mt-2 text-sm text-[#6B5E47]">No hay campaña de crecimiento activa. / No active growth campaign.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {activeCampaigns.map((c) => (
            <li key={c.id} className="rounded-lg border border-[#E8DFD0] p-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-bold uppercase text-[#8A6B1F]">{c.status}</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-[#1E1810]">{c.objectiveEs}</p>
              <p className="text-sm text-[#6B5E47]">{c.objectiveEn}</p>
              {canManageCampaigns ? <CampaignStatusControl businessId={businessId} campaignId={c.id} status={c.status} /> : null}
            </li>
          ))}
        </ul>
      )}

      {canManageCampaigns ? (
        <div className="mt-3">
          <CampaignBuilderForm
            businessId={businessId}
            prefillObjectiveEs={reviewedAssessment?.nextRightMoveEs ?? undefined}
            prefillObjectiveEn={reviewedAssessment?.nextRightMoveEn ?? undefined}
            mediaChannels={mediaChannels}
          />
        </div>
      ) : null}
    </section>
  );
}

// =================================================================================================
// SECTION 10 — Measurement
// =================================================================================================
/**
 * WHOLE-PRODUCT PARTIAL-CLOSURE (AL_OUTCOMES / BV_MEASUREMENT) — `outcomes` is the SAME
 * business_outcomes rows Program 7 already persists for recommendation/commitment/creative-job
 * execution; this section only filters to the ones tagged with this business's growth_campaign_id
 * (see business_outcomes_growth_linkage migration). Never a second, Growth-only measurement store.
 */
function MeasurementSection({
  businessId,
  assessment,
  campaigns,
  outcomes,
  outcomesEnabled,
  canRecordOutcome,
}: {
  businessId: string;
  assessment: GrowthAssessment | null;
  campaigns: readonly GrowthCampaign[];
  outcomes: readonly BusinessOutcome[];
  outcomesEnabled: boolean;
  canRecordOutcome: boolean;
}) {
  const measurableCampaigns = campaigns.filter((c) => c.status === "live" || c.status === "measuring" || c.status === "complete");
  const hasMeasurable = measurableCampaigns.length > 0;
  return (
    <section className={CARD}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Medición / Measurement</h3>
      {assessment && assessment.measurementPlan.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {assessment.measurementPlan.map((item, i) => (
            <li key={i} className="rounded-lg border border-dashed border-[#E8DFD0] p-2 text-sm">
              <span className="block">{item.textEs}</span>
              <span className="block text-[#6B5E47]">{item.textEn}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[#6B5E47]">
          No se está midiendo nada todavía. Una campaña o proyecto debe definir qué éxito se puede observar realmente. / Nothing is being measured yet. A campaign or project must define what success can realistically be observed.
        </p>
      )}
      {!hasMeasurable ? (
        <p className="mt-2 text-[11px] text-[#9A9184]">Sin resultados todavía — no hay campañas activas o medidas. / No results yet — no active or measured campaigns.</p>
      ) : null}

      {hasMeasurable && outcomesEnabled ? (
        <ul className="mt-3 space-y-2">
          {measurableCampaigns.map((c) => {
            const campaignOutcomes = outcomes.filter((o) => o.growthCampaignId === c.id);
            return (
              <li key={c.id} className="rounded-xl border border-[#E8DFD0] p-2">
                <p className="text-xs font-semibold text-[#1E1810]">{c.objectiveEn}</p>
                {campaignOutcomes.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {campaignOutcomes.map((o) => (
                      <li key={o.id} className="text-[11px] text-[#6B5E47]">
                        {o.metricLabelEn}: {o.baselineValue ?? "—"} → {o.measuredValue ?? "not yet measured"} ({o.result})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-[11px] text-[#9A9184]">Sin resultado registrado todavía para esta campaña. / No outcome recorded yet for this campaign.</p>
                )}
                {canRecordOutcome ? <RecordOutcomeForm businessId={businessId} growthCampaignId={c.id} /> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

// =================================================================================================
// SECTION 11 — Assessment History
// =================================================================================================
function AssessmentHistorySection({ history }: { history: readonly { id: string; status: string; createdAt: string; reviewedAt: string | null }[] }) {
  if (history.length === 0) return null;
  return (
    <details className="mt-1 rounded-2xl border border-[#E8DFD0] bg-white p-4">
      <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Historial de evaluaciones / Assessment History</summary>
      <ul className="mt-2 space-y-1">
        {history.map((h) => {
          const label = ASSESSMENT_STATUS_LABEL[h.status as GrowthAssessment["status"]];
          return (
            <li key={h.id} className="flex items-center justify-between gap-2 text-xs text-[#6B5E47]">
              <span>{new Date(h.createdAt).toLocaleDateString()}</span>
              <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5 text-[10px] uppercase">{label ? `${label.es} / ${label.en}` : h.status}</span>
              <span>{h.reviewedAt ? `Revisado ${new Date(h.reviewedAt).toLocaleDateString()}` : "—"}</span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

// =================================================================================================
// Top-level orchestrator
// =================================================================================================
export function GrowthPlanPanel({
  businessId,
  businessStage,
  roadmapType,
  currentAssessment,
  assessmentHistory,
  solutions,
  campaigns,
  officialRequirements,
  roadmapSteps,
  mediaChannels,
  outcomes,
  outcomesEnabled,
  canRecordOutcome,
  sixTestReadiness,
  canCreateAssessment,
  canReviewAssessment,
  canManageSolutions,
  canManageCampaigns,
  canManageRoadmap,
  canManageOfficialRequirements,
  canManageCommitments,
  canStartProjectDiscovery,
}: {
  businessId: string;
  businessStage: BusinessStage;
  roadmapType: GrowthRoadmapType;
  currentAssessment: GrowthAssessment | null;
  assessmentHistory: readonly { id: string; status: string; createdAt: string; reviewedAt: string | null }[];
  solutions: readonly GrowthSolution[];
  campaigns: readonly GrowthCampaign[];
  officialRequirements: readonly GrowthOfficialRequirement[];
  roadmapSteps: readonly GrowthRoadmapStep[];
  mediaChannels: readonly GrowthMediaChannel[];
  outcomes: readonly BusinessOutcome[];
  outcomesEnabled: boolean;
  canRecordOutcome: boolean;
  sixTestReadiness: OpportunityReadinessResult | null;
  canCreateAssessment: boolean;
  canReviewAssessment: boolean;
  canManageSolutions: boolean;
  canManageCampaigns: boolean;
  canManageRoadmap: boolean;
  canManageOfficialRequirements: boolean;
  canManageCommitments: boolean;
  canStartProjectDiscovery: boolean;
}) {
  const reviewedAssessment = currentAssessment?.status === "reviewed" ? currentAssessment : null;
  const pendingRequirements = officialRequirements.filter((r) => r.state !== "human_verified" && r.state !== "not_applicable");

  return (
    <div className="space-y-3">
      <GrowthSnapshotSection
        businessId={businessId}
        businessStage={businessStage}
        currentAssessment={currentAssessment}
        solutions={solutions}
        canCreateAssessment={canCreateAssessment}
        canReviewAssessment={canReviewAssessment}
      />

      {currentAssessment ? (
        <>
          <WhatWeFoundSection assessment={currentAssessment} />
          <MissingInformationSection assessment={currentAssessment} />
          <QuestionsSection businessId={businessId} assessment={currentAssessment} />
          <GrowthOpportunitiesSection assessment={currentAssessment} />
        </>
      ) : null}

      <RecommendedSolutionsSection
        businessId={businessId}
        assessment={currentAssessment}
        solutions={solutions}
        sixTestReadiness={sixTestReadiness}
        canManageSolutions={canManageSolutions}
        canManageCommitments={canManageCommitments}
        canStartProjectDiscovery={canStartProjectDiscovery}
      />

      {pendingRequirements.length > 0 ? (
        <section className={CARD}>
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Requisitos oficiales / Official Requirements</h3>
          <ul className="mt-2 space-y-2">
            {pendingRequirements.map((r) => (
              <li key={r.id} className="rounded-lg border border-amber-200 bg-amber-50 p-2">
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-800">Requiere investigación oficial / Needs Official Research</span>
                <p className="mt-1 text-sm font-semibold text-[#1E1810]">{r.requirementTopicEs}</p>
                <p className="text-sm text-[#6B5E47]">{r.requirementTopicEn}</p>
                {canManageOfficialRequirements ? <VerifyOfficialRequirementForm businessId={businessId} requirementId={r.id} /> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <MediaMixSection assessment={currentAssessment} mediaChannels={mediaChannels} />

      <RoadmapSection businessId={businessId} roadmapType={roadmapType} steps={roadmapSteps} canManageRoadmap={canManageRoadmap} />

      <ProjectsCampaignsSection
        businessId={businessId}
        campaigns={campaigns}
        solutions={solutions}
        canManageCampaigns={canManageCampaigns}
        mediaChannels={mediaChannels}
        reviewedAssessment={reviewedAssessment}
      />

      <MeasurementSection
        businessId={businessId}
        assessment={currentAssessment}
        campaigns={campaigns}
        outcomes={outcomes}
        outcomesEnabled={outcomesEnabled}
        canRecordOutcome={canRecordOutcome}
      />

      <AssessmentHistorySection history={assessmentHistory} />
    </div>
  );
}
