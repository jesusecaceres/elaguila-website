/**
 * Business Development & Growth Engine, Gate D — dev-only visual QA harness (MD Part 13).
 *
 * Renders the REAL GrowthPlanPanel component against deterministic, hardcoded fixtures (no
 * database, no auth, no live OpenAI call) so its actual rendered layout can be verified at 390px
 * with a real browser/DOM — Gate C could only do source-level structural checks (className
 * inspection); this closes that gap with true rendered validation.
 *
 * Safety: gated on NODE_ENV !== "production" so this route does not exist in any deployed
 * environment (Preview or Production) — matches the standard "dev-only route" convention, not a
 * capability check, since there is no real business data here to protect and no mutation is
 * possible from this page (the actual mutation API routes still enforce their own real
 * capability/session checks regardless of how this page is reached). Deliberately placed OUTSIDE
 * app/admin/ (rather than under it) so local visual QA never needs the site-wide leonix_admin
 * front-door cookie (middleware.ts) or the real staff/owner session — this page carries zero real
 * business data, so nothing behind that cookie is exposed by skipping it.
 */
import { notFound } from "next/navigation";
import { GrowthPlanPanel } from "../admin/(dashboard)/businesses/[businessId]/GrowthPlanJourney";
import type {
  GrowthAssessment,
  GrowthCampaign,
  GrowthMediaChannel,
  GrowthOfficialRequirement,
  GrowthSolution,
} from "@/app/lib/business/growthEngine/types";

const NOW = new Date().toISOString();
let idCounter = 0;
const nextId = () => `fixture-${(idCounter += 1)}`;
const F = (textEs: string, textEn: string) => ({ textEs, textEn });

function makeAssessment(overrides: Partial<GrowthAssessment>): GrowthAssessment {
  return {
    id: nextId(),
    businessId: "fixture-biz",
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

function makeSolution(overrides: Partial<GrowthSolution>): GrowthSolution {
  return {
    id: nextId(),
    businessId: "fixture-biz",
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

function makeRequirement(overrides: Partial<GrowthOfficialRequirement>): GrowthOfficialRequirement {
  return {
    id: nextId(),
    businessId: "fixture-biz",
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

function makeCampaign(overrides: Partial<GrowthCampaign>): GrowthCampaign {
  return {
    id: nextId(),
    businessId: "fixture-biz",
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

const MEDIA_CHANNELS: GrowthMediaChannel[] = [
  { id: "mc-1", channelKey: "leonix_social", channelClass: "leonix_owned", labelEs: "Redes de Leonix", labelEn: "Leonix Social", availabilityState: "available", config: {}, notesEs: null, notesEn: null, isActive: true },
  { id: "mc-2", channelKey: "radio", channelClass: "partner", labelEs: "Radio", labelEn: "Radio", availabilityState: "available_partner_terms_required", config: {}, notesEs: "Los términos comerciales requieren confirmación.", notesEn: "Commercial terms require confirmation.", isActive: true },
];

const ALL_PERMS = {
  canCreateAssessment: true,
  canReviewAssessment: true,
  canManageSolutions: true,
  canManageCampaigns: true,
  canManageRoadmap: true,
  canManageOfficialRequirements: true,
  canManageCommitments: true,
};

function FixtureFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ borderBottom: "4px solid #1F3A2D", paddingBottom: 24, marginBottom: 24 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, padding: "8px 12px", background: "#1F3A2D", color: "white" }}>{title}</h2>
      <div style={{ maxWidth: 390, margin: "0 auto", border: "1px solid #ccc" }}>
        <div style={{ padding: 12, background: "#FAF7F2" }}>{children}</div>
      </div>
    </section>
  );
}

export default function GrowthPlanFixturesDevPage() {
  if (process.env.NODE_ENV === "production") notFound();

  // Fixture 1: No assessment
  const f1 = (
    <GrowthPlanPanel
      businessId="fixture-1" businessStage="operating" roadmapType="established"
      currentAssessment={null} assessmentHistory={[]} solutions={[]} campaigns={[]}
      officialRequirements={[]} roadmapSteps={[]} mediaChannels={[]} {...ALL_PERMS}
    />
  );

  // Fixture 2: Needs Review
  const assessment2 = makeAssessment({
    status: "needs_review",
    whatFound: [F("Tiene página de Google confirmada.", "Has a confirmed Google page.")],
    whatUnknown: [F("No sabemos el presupuesto mensual.", "We don't know the monthly budget.")],
    clientQuestions: [F("¿Cuál es su capacidad máxima?", "What is your maximum capacity?"), F("¿Qué promociones ha ofrecido antes?", "What promotions have you offered before?")],
  });
  const f2 = (
    <GrowthPlanPanel
      businessId="fixture-2" businessStage="operating" roadmapType="established"
      currentAssessment={assessment2} assessmentHistory={[]} solutions={[]} campaigns={[]}
      officialRequirements={[]} roadmapSteps={[]} mediaChannels={[]} {...ALL_PERMS}
    />
  );

  // Fixture 3: War Fitness-style established, reviewed, with solutions/campaign/media
  const assessment3 = makeAssessment({
    status: "reviewed", reviewedAt: NOW,
    whatFound: [F("El gimnasio confirma 3 ubicaciones activas.", "The gym confirms 3 active locations.")],
    clientQuestions: [
      F("¿Cuántos miembros activos tiene actualmente?", "How many active members do you currently have?"),
      F("¿Qué porcentaje de capacidad usan sus clases de mayor demanda?", "What percentage of capacity do your highest-demand classes use?"),
      F("¿Qué promociones de membresía ha ofrecido antes?", "What membership promotions have you offered before?"),
      F("¿Cuál es la capacidad máxima por clase?", "What is the maximum capacity per class?"),
    ],
    recommendedMediaMix: [{ ...F("Promover el paquete de inscripción en redes de Leonix.", "Promote the enrollment package on Leonix social."), channelKey: "leonix_social" }],
  });
  const solutions3 = [
    makeSolution({ providerClass: "leonix_provides", category: "brand", titleEs: "Rediseñar el logo", titleEn: "Redesign the logo", state: "approved" }),
    makeSolution({ providerClass: "external_professional_required", category: "legal_licensing", titleEs: "Confirmar licencia", titleEn: "Confirm license", state: "reviewed" }),
    makeSolution({ providerClass: "leonix_coordinates_partner", category: "radio", titleEs: "Coordinar spot de radio", titleEn: "Coordinate radio spot", state: "reviewed" }),
  ];
  const f3 = (
    <GrowthPlanPanel
      businessId="fixture-3" businessStage="operating" roadmapType="established"
      currentAssessment={assessment3} assessmentHistory={[{ id: assessment3.id, status: "reviewed", createdAt: NOW, reviewedAt: NOW }]}
      solutions={solutions3} campaigns={[makeCampaign({ status: "ready_for_review" })]}
      officialRequirements={[makeRequirement({ state: "needs_research" })]} roadmapSteps={[]} mediaChannels={MEDIA_CHANNELS} {...ALL_PERMS}
    />
  );

  // Fixture 4: Startup
  const assessment4 = makeAssessment({ status: "needs_review", whatUnknown: [F("El nombre del negocio no está confirmado.", "The business name is not confirmed.")] });
  const f4 = (
    <GrowthPlanPanel
      businessId="fixture-4" businessStage="planning_prelaunch" roadmapType="startup"
      currentAssessment={assessment4} assessmentHistory={[]} solutions={[]} campaigns={[]}
      officialRequirements={[makeRequirement({ requirementTopicEs: "Licencia de alimentos", requirementTopicEn: "Food handling license" })]}
      roadmapSteps={[]} mediaChannels={[]} {...ALL_PERMS}
    />
  );

  return (
    <div style={{ fontFamily: "sans-serif", padding: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Growth Plan — 390px Visual QA Fixtures (dev only)</h1>
      <p style={{ fontSize: 12, color: "#666" }}>Not part of the product. Resize your viewport to 390px wide to inspect each fixture below.</p>
      <FixtureFrame title="1. No Assessment (empty state)">{f1}</FixtureFrame>
      <FixtureFrame title="2. Needs Review">{f2}</FixtureFrame>
      <FixtureFrame title="3. War Fitness-style established (reviewed, solutions, campaign, media, official requirement)">{f3}</FixtureFrame>
      <FixtureFrame title="4. Startup / Idea">{f4}</FixtureFrame>
    </div>
  );
}
