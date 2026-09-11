import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { actorHasCapability, isOwnerBootstrapActor, requireSalesWorkspaceAccess, type SalesWorkspaceDenialReason } from "../../../_lib/businessWorkspaceAccess";
import { getBusinessWorkspaceDetail } from "../../../_lib/businessWorkspaceData";
import { BUSINESS_SALES_STATUSES, FOLLOW_UP_STATUSES, computeNextHelpfulAction, computeProfileCompleteness, deriveFollowUpDisplayStatus, type ProfileCompletenessInput } from "../../../_lib/salesWorkspaceLogic";
import { BusinessDashboardNav } from "./BusinessDashboardNav";
import { computeBusinessDashboardNextAction } from "./businessDashboardNextAction";
import { BROAD_BUSINESS_TYPES, BUSINESS_STAGES, CONTACT_LABELS, DIGITAL_PROFILE_PLATFORMS, OPERATING_MODELS, SALES_CHANNELS, SALES_RELATIONSHIPS } from "@/app/lib/business/constants";
import { countryLabel } from "@/app/lib/business/countries";
import { formatUsPhoneForDisplay } from "@/app/lib/business/phoneDisplay";
import { physicalAddressSummary, summarizeServiceCoverage } from "@/app/(site)/dashboard/business-tools/onboarding/wizardTypes";
import { businessIdentityCopy } from "@/app/(site)/dashboard/business-tools/_components/businessIdentityCopy";
import { FollowUpPanel, NotesPanel, StatusQuickActions } from "./BusinessWorkspaceActions";
import { CreateFactForm, CreateUnknownForm, DiscoveryPanel, FactDecisionButtons, ResolveUnknownForm } from "./LivingBusinessBookActions";
import { shapeFactsForStaffActor } from "../../../_lib/livingBookVisibility";
import {
  listContradictionsForBusiness, listDiscoverySessionsForBusiness, listEvidenceForBusiness, listFactsForBusiness, listUnknownsForBusiness,
} from "@/app/lib/business/livingBook/repository";
import { computeBookCompleteness } from "@/app/lib/business/livingBook/logic";
import { MarkHumanReviewForm, RunAssessmentButton } from "./HealthMapActions";
import { getFullRun, getLatestCompletedRun, listRunsForBusiness } from "@/app/lib/business/healthMap/repository";
import { HEALTH_DIMENSION_KEYS } from "@/app/lib/business/healthMap/constants";
import { RecommendJourney, StewardshipOpportunityFlowNav } from "./RecommendJourney";
import { listLedgerForBusiness, listOverridesForRecommendation, listRecommendationsForBusiness, listTestsForRecommendation } from "@/app/lib/business/stewardship/repository";
import { BriefingReviewPanel, ConsentStatusPanel, RunResearchButton, SourceFilesPanel, SourceFindingsPanel, SourceLinksPanel } from "./FieldDiscoveryActions";
import { listConsentForBusiness, listSourceFilesForBusiness, listSourceLinksForBusiness } from "@/app/lib/business/fieldDiscovery/repository";
import { getDefaultBusinessIntelligenceProvider } from "@/app/lib/business/aiResearch/providerRegistry";
import { isGooglePlacesConfigured } from "@/app/lib/business/aiResearch/googlePlacesAdapter";
import { listBriefingDraftsForBusiness, listResearchRunsForBusiness } from "@/app/lib/business/aiResearch/repository";
import { assembleCockpitBriefing } from "@/app/lib/business/meetingStudio/cockpitBriefing";
import { listMeetingsForBusiness, listAttendeesForMeeting, listConsentsForMeeting, listNotesForMeeting, listTranscriptsForMeeting } from "@/app/lib/business/meetingStudio/repository";
import { isMeetingStudioEnabled } from "@/app/lib/business/meetingStudio/featureFlag";
import { MeetingJourney } from "./MeetingJourney";
import { listProposalsForBusiness } from "@/app/lib/business/proposals/repository";
import { CreateProposalForm, ProposalDetailPanel } from "./ProposalActions";
import { listCommitmentsForBusiness, listEventsForCommitment } from "@/app/lib/business/promiseKeeper/repository";
import { CreateCommitmentForm, CommitmentDetailPanel } from "./PromiseKeeperActions";
import { commitmentPriorityBucket, COMMITMENT_PRIORITY_ORDER, COMMITMENT_PRIORITY_LABEL, type CommitmentPriorityBucket } from "./commitmentPriority";
import { listJobsForBusiness } from "@/app/lib/business/creativeStudio/repository";
import { isCreativeStudioEnabled } from "@/app/lib/business/creativeStudio/featureFlag";
import { getConfiguredCreativeProviders } from "@/app/lib/business/creativeStudio/providerRegistry";
import { isImageGenerationLive } from "@/app/lib/business/creativeStudio/providerTypes";
import { CreativeJourney, loadCreativeJobWorkspaces } from "./CreativeJourney";
import { listBusinessOutcomes } from "@/app/lib/business/outcomes/repository";
import { isOutcomesEnabled } from "@/app/lib/business/outcomes/featureFlag";
import { OutcomesPanel } from "./OutcomesPanel";
import { listOpportunitiesForBusiness } from "@/app/lib/business/opportunity/repository";
import { isOpportunityEnabled } from "@/app/lib/business/opportunity/featureFlag";
import { OpportunitiesPanel } from "./OpportunityActions";
import { OwnershipClaimPanel } from "./OwnershipClaimPanel";
import { listAllSignals } from "@/app/lib/business/advisor/repository";
import { isAdvisorEnabled } from "@/app/lib/business/advisor/featureFlag";
import { AdvisorPanel } from "./AdvisorPanel";
import { listThreadsForBusiness } from "@/app/lib/business/assistant/repository";
import { isAssistantEnabled } from "@/app/lib/business/assistant/featureFlag";
import { AssistantPanel } from "./AssistantPanel";
import {
  getCurrentGrowthAssessment,
  listGrowthAssessmentsForBusiness,
  listGrowthSolutionsForBusiness,
  listGrowthCampaignsForBusiness,
  listOfficialRequirementsForBusiness,
  ensureGrowthRoadmapForBusiness,
  listGrowthMediaChannels,
} from "@/app/lib/business/growthEngine/repository";
import { growthRoadmapTypeForBusinessStage } from "@/app/lib/business/growthEngine/lifeStage";
import { GrowthPlanPanel } from "./GrowthPlanJourney";
import { ClientDiscoveryJourney } from "./ClientDiscoveryJourney";
import {
  listDiscoveryEventsForDiscovery,
  listProjectDiscoveriesForBusiness,
  listProjectDiscoveryConsents,
  listProjectDiscoveryIntents,
  listProjectDiscoveryItems,
  listProjectDiscoverySources,
} from "@/app/lib/business/projectDiscovery/repository";
import { buildWebsiteDiscoveryContext } from "@/app/lib/business/projectDiscovery/websiteDiscoveryContext";
import { detectWebsiteScopeSignals, evaluateWebsiteReadiness, evaluateWebsiteRequirements } from "@/app/lib/business/projectDiscovery/websiteDiscoveryLogic";
import { buildBeforeYouWrapUp, buildQuestionsToAskNow } from "@/app/lib/business/projectDiscovery/websiteQuestionEngine";
import { resolveStartFromGrowthSolutionPrefill } from "@/app/lib/business/projectDiscovery/discoveryWorkspaceViewModel";
import { buildArchitectureDecisionPacket, type WebsiteArchitectureDecisionPacket } from "@/app/lib/business/projectDiscovery/architectureDecisionEngine";
import { computeBlueprintInputFingerprint, detectArchitectureDrift, evaluateWebsiteBlueprintReadiness } from "@/app/lib/business/projectDiscovery/blueprintEngine";
import { getLatestBlueprintForIntent } from "@/app/lib/business/projectDiscovery/blueprintRepository";
import { buildSpecializedDiscoveryContext } from "@/app/lib/business/projectDiscovery/specializedDiscoveryContext";
import { buildSpecializedBeforeYouWrapUp, buildSpecializedQuestionsToAskNow, evaluateSpecializedReadiness, evaluateSpecializedRequirements } from "@/app/lib/business/projectDiscovery/specializedDiscoveryEngine";
import { catalogForProjectType, specializedFamilyForProjectType } from "@/app/lib/business/projectDiscovery/specializedBlueprintDispatch";
import { computeSpecializedBlueprintInputFingerprint, evaluateProjectBlueprintReadiness, type SpecializedProjectBlueprintPacket } from "@/app/lib/business/projectDiscovery/specializedBlueprintEngine";
import { computeBlockingDependencies, suggestSystemDependencies } from "@/app/lib/business/projectDiscovery/projectDependencyEngine";
import { listIntentDependenciesForDiscovery } from "@/app/lib/business/projectDiscovery/projectDependencyRepository";
import { buildClientReviewData } from "@/app/lib/business/projectDiscovery/clientReviewDataAssembler";

export const dynamic = "force-dynamic";

function labelFromList(list: readonly { value: string; es: string; en: string }[], value: string | null, lang: "en" | "es" = "en"): string {
  if (!value) return "—";
  return list.find((o) => o.value === value)?.[lang] ?? value;
}

// Gate MD-completion — visibly distinguish a fact's source class so an unreviewed AI inference
// never reads the same as an owner-confirmed fact at a glance. Mirrors the truth-class palette
// already established in MeetingJourney.tsx (emerald = confirmed, purple = AI inference).
function factSourceClassBadgeClass(sourceClass: string): string {
  if (sourceClass === "owner_confirmed") return "bg-emerald-100 text-emerald-900";
  if (sourceClass === "ai_inference") return "bg-purple-100 text-purple-800";
  return "bg-[#EDE6D6] text-[#3D3428]";
}

const IDENTITY_DENIAL_REASONS: readonly SalesWorkspaceDenialReason[] = ["no_admin_cookie", "bootstrap_session_not_allowed", "no_operator_identity", "auth_user_not_found"];

export default async function AdminBusinessDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams?: Promise<{ discoveryIntent?: string; startGrowthSolutionId?: string }>;
}) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    redirect(IDENTITY_DENIAL_REASONS.includes(access.reason) ? "/admin/login" : "/admin/team?access_denied=1");
  }
  if (!actorHasCapability(access.actor, "view_business_detail")) {
    redirect("/admin/team?access_denied=1");
  }

  const { businessId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const detail = await getBusinessWorkspaceDetail(businessId, access.actor);
  if (!detail) {
    return (
      <div className="max-w-3xl">
        <AdminPageHeader title="Business not found" eyebrow="Business Concierge" />
        <Link href="/admin/businesses" className="text-sm font-semibold text-[#7A1E2C] underline">
          ← Back to businesses
        </Link>
      </div>
    );
  }

  const { business, membership, contacts, serviceAreas, digitalProfiles, customLinks, listingLinks, salesProfile, notes, currentFollowUp } = detail;
  const todayIso = new Date().toISOString().slice(0, 10);
  const followUpDisplayStatus = currentFollowUp
    ? deriveFollowUpDisplayStatus(currentFollowUp.status, currentFollowUp.scheduledDate, todayIso)
    : null;
  const primaryArea = serviceAreas.find((a) => a.isPrimary) ?? serviceAreas[0] ?? null;
  const t = businessIdentityCopy("en");

  const completenessInput: ProfileCompletenessInput = {
    business: {
      displayName: business.displayName,
      broadBusinessType: business.broadBusinessType,
      businessStage: business.businessStage,
      updatedAt: business.updatedAt,
      preferredResponseMethod: business.preferredResponseMethod,
    },
    authorizationNeedsReview: membership?.manualReviewFlag ?? false,
    contacts: contacts.map((c) => ({ contactType: c.contactType, capabilities: c.capabilities })),
    serviceAreas: serviceAreas.map((a) => ({ country: a.country, rawText: a.rawText })),
    digitalProfiles: digitalProfiles.map((d) => ({ platform: d.platform })),
    customLinks: customLinks.map((l) => ({ linkType: l.linkType })),
    listingLinks: listingLinks.map((l) => ({ status: l.status })),
  };
  const completeness = computeProfileCompleteness(completenessInput);
  const nextAction = computeNextHelpfulAction(completenessInput);
  const missingCriticalContact = !completeness.items.find((i) => i.id === "primary_contact_confirmed")?.met;

  const canViewPrivateContacts = actorHasCapability(access.actor, "view_private_contacts");
  const primaryPhone = canViewPrivateContacts ? contacts.find((c) => c.contactType === "phone") : undefined;
  const primaryEmail = canViewPrivateContacts ? contacts.find((c) => c.contactType === "email") : undefined;
  const websiteContact = canViewPrivateContacts ? (contacts.find((c) => c.contactType === "website") ?? null) : null;

  const canViewBook = actorHasCapability(access.actor, "view_business_book");
  const canConfirmFact = actorHasCapability(access.actor, "confirm_business_fact");
  const canManageUnknowns = actorHasCapability(access.actor, "manage_unknowns");
  const canConductDiscovery = actorHasCapability(access.actor, "conduct_discovery");
  const bookData = canViewBook
    ? await (async () => {
        const [factsRaw, unknowns, contradictions, discoverySessions, evidence] = await Promise.all([
          listFactsForBusiness(business.id),
          listUnknownsForBusiness(business.id),
          listContradictionsForBusiness(business.id),
          listDiscoverySessionsForBusiness(business.id),
          listEvidenceForBusiness(business.id),
        ]);
        const facts = shapeFactsForStaffActor(factsRaw, access.actor.capabilities);
        const completeness = computeBookCompleteness({
          facts: facts.map((f) => ({ status: f.status, sourceClass: f.sourceClass, lastVerifiedAt: f.lastVerifiedAt })),
          unknowns,
          contradictions,
          discoveryAnswered: null,
          discoveryTotal: null,
          nowIso: new Date().toISOString(),
        });
        return { facts, unknowns, contradictions, discoverySessions, evidence, completeness };
      })()
    : null;

  const canViewHealthMap = actorHasCapability(access.actor, "view_business_health_map");
  const canRunHealthAssessment = actorHasCapability(access.actor, "run_business_health_assessment");
  const canMarkHumanReview = actorHasCapability(access.actor, "mark_health_human_review");
  const healthData = canViewHealthMap
    ? await (async () => {
        const [latestRun, recentRuns] = await Promise.all([getLatestCompletedRun(business.id), listRunsForBusiness(business.id, 10)]);
        if (!latestRun) return { latestRun: null, dimensionResults: [], findings: [], readiness: null, recentRuns };
        const full = await getFullRun(latestRun.id);
        return { latestRun: full?.run ?? null, dimensionResults: full?.dimensionResults ?? [], findings: full?.findings ?? [], readiness: full?.readiness ?? null, recentRuns };
      })()
    : null;

  const canViewRecommendations = actorHasCapability(access.actor, "view_recommendations");
  const canCreateRecommendation = actorHasCapability(access.actor, "create_recommendation");
  const canApproveRecommendation = actorHasCapability(access.actor, "approve_recommendation");
  const canOverrideRecommendation = actorHasCapability(access.actor, "override_recommendation");
  const canViewLedger = actorHasCapability(access.actor, "view_stewardship_ledger");
  const stewardshipData = canViewRecommendations
    ? await (async () => {
        const recommendations = await listRecommendationsForBusiness(business.id);
        const current = recommendations.find((r) => r.isCurrent) ?? null;
        const [tests, overrides, ledger] = await Promise.all([
          current ? listTestsForRecommendation(current.id) : Promise.resolve([]),
          current ? listOverridesForRecommendation(current.id) : Promise.resolve([]),
          canViewLedger ? listLedgerForBusiness(business.id, 50) : Promise.resolve([]),
        ]);
        return { recommendations, current, tests, overrides, ledger };
      })()
    : null;

  const canViewFieldDiscovery = actorHasCapability(access.actor, "view_field_discovery");
  const canRunAiResearch = actorHasCapability(access.actor, "run_ai_research");
  const canReviewAiBriefing = actorHasCapability(access.actor, "review_ai_briefing");
  const canPromoteAiBriefing = actorHasCapability(access.actor, "promote_ai_briefing");
  const fieldDiscoveryData = canViewFieldDiscovery
    ? await (async () => {
        const [sourceLinks, sourceFiles, consent, runs, drafts, provider] = await Promise.all([
          listSourceLinksForBusiness(business.id),
          listSourceFilesForBusiness(business.id),
          listConsentForBusiness(business.id),
          listResearchRunsForBusiness(business.id),
          listBriefingDraftsForBusiness(business.id),
          getDefaultBusinessIntelligenceProvider(),
        ]);
        const latestRun = runs[0] ?? null;
        const latestDraft = latestRun ? drafts.find((d) => d.researchRunId === latestRun.id) ?? null : null;
        const providerAvailable = await provider.isConfigured();
        const googlePlacesAvailable = isGooglePlacesConfigured();
        return { sourceLinks, sourceFiles, consent, runs, latestRun, latestDraft, providerAvailable, googlePlacesAvailable };
      })()
    : null;

  // Program 5 — Lion's Cockpit + Meeting Studio + Proposals + Promise Keeper
  const canViewMeetingStudio = actorHasCapability(access.actor, "view_meeting_studio");
  const canPrepareMeeting = actorHasCapability(access.actor, "prepare_business_meeting");
  const canReviewMeetingNotes = actorHasCapability(access.actor, "review_meeting_notes");
  const canCreateProposal = actorHasCapability(access.actor, "create_proposal");
  const canReviewProposal = actorHasCapability(access.actor, "review_proposal");
  const canRecordProposalDecision = actorHasCapability(access.actor, "record_proposal_decision");
  const canViewCommitments = actorHasCapability(access.actor, "view_commitments");
  const canManageCommitments = actorHasCapability(access.actor, "manage_own_commitments") || actorHasCapability(access.actor, "manage_team_commitments");
  const meetingStudioEnabled = canViewMeetingStudio ? await isMeetingStudioEnabled() : false;

  const program5Data = (canViewMeetingStudio && meetingStudioEnabled)
    ? await (async () => {
        const [briefing, meetings, proposals, commitments] = await Promise.all([
          assembleCockpitBriefing(business.id, business.displayName, business.businessPrimaryLanguage ?? null),
          listMeetingsForBusiness(business.id),
          canViewCommitments ? listProposalsForBusiness(business.id) : Promise.resolve([]),
          canViewCommitments ? listCommitmentsForBusiness(business.id) : Promise.resolve([]),
        ]);

        const meetingsWithDetails = await Promise.all(
          meetings.slice(0, 5).map(async (m) => {
            const [attendees, consents, notes, transcripts] = await Promise.all([
              listAttendeesForMeeting(m.id, business.id),
              listConsentsForMeeting(m.id, business.id),
              listNotesForMeeting(m.id, business.id),
              listTranscriptsForMeeting(m.id, business.id),
            ]);
            return { meeting: m, attendees, consents, notes, transcripts };
          }),
        );

        const commitmentsWithEvents = canViewCommitments
          ? await Promise.all(
              commitments.slice(0, 10).map(async (c) => {
                const events = await listEventsForCommitment(c.id, business.id);
                return { commitment: c, events };
              }),
            )
          : [];

        return { briefing, meetings, meetingsWithDetails, proposals, commitmentsWithEvents };
      })()
    : null;

  // Program 6 — Creative Studio
  const canViewCreativeStudio = actorHasCapability(access.actor, "view_creative_studio");
  const creativeStudioEnabled = canViewCreativeStudio ? await isCreativeStudioEnabled() : false;
  const creativeJobs = (canViewCreativeStudio && creativeStudioEnabled)
    ? await listJobsForBusiness(business.id)
    : [];
  // Package A — truthful provider availability for staff (never claims an unconfigured provider is live).
  const creativeProviderAvailability = canViewCreativeStudio ? await getConfiguredCreativeProviders() : { gemini: false, openai: false };
  const canGenerateCreative = actorHasCapability(access.actor, "generate_creative_draft");
  const canCreateCreativeBrief = actorHasCapability(access.actor, "create_creative_job") || actorHasCapability(access.actor, "approve_creative_brief");
  const imageGenerationLive = isImageGenerationLive();

  // Package B — Contextual Opportunity / Sponsorship Bridge
  const canViewOpportunities = actorHasCapability(access.actor, "view_opportunities");
  const canGenerateOwnershipClaim = actorHasCapability(access.actor, "generate_ownership_claim");
  const opportunityEnabled = canViewOpportunities ? await isOpportunityEnabled() : false;
  const opportunities = (canViewOpportunities && opportunityEnabled) ? await listOpportunitiesForBusiness(business.id) : [];
  const canReviewOpportunity = actorHasCapability(access.actor, "review_opportunity");
  const canCreateOpportunityCreativeRequest = actorHasCapability(access.actor, "create_opportunity_creative_request");
  const creativeJobViews = (canViewCreativeStudio && creativeStudioEnabled)
    ? await loadCreativeJobWorkspaces(business.id, creativeJobs, opportunities.map((row) => ({ id: row.id, titleEn: row.titleEn })))
    : [];

  // Program 7 — Outcomes + Advisor + Assistant (bounded; read failure must not crash the dashboard)
  let outcomesEnabled = false;
  let program7Outcomes: Awaited<ReturnType<typeof listBusinessOutcomes>> = [];
  let outcomesUnavailable = false;
  try {
    outcomesEnabled = await isOutcomesEnabled();
    program7Outcomes = outcomesEnabled ? await listBusinessOutcomes(business.id) : [];
  } catch {
    outcomesEnabled = false;
    program7Outcomes = [];
    outcomesUnavailable = true;
  }

  let advisorEnabled = false;
  let program7Signals: Awaited<ReturnType<typeof listAllSignals>> = [];
  let advisorUnavailable = false;
  try {
    advisorEnabled = await isAdvisorEnabled();
    program7Signals = advisorEnabled ? await listAllSignals(business.id) : [];
  } catch {
    advisorEnabled = false;
    program7Signals = [];
    advisorUnavailable = true;
  }

  let assistantEnabled = false;
  let program7Threads: Awaited<ReturnType<typeof listThreadsForBusiness>> = [];
  let assistantUnavailable = false;
  try {
    assistantEnabled = await isAssistantEnabled();
    program7Threads = assistantEnabled ? await listThreadsForBusiness(business.id) : [];
  } catch {
    assistantEnabled = false;
    program7Threads = [];
    assistantUnavailable = true;
  }

  // Growth Engine, Gate C — Growth Plan. view_growth_engine gates the whole section; the finer
  // manage_* / review_* / create_* capabilities gate individual actions inside it (server-side,
  // not just UI hiding — every write route re-checks its own capability independently).
  const canViewGrowthEngine = actorHasCapability(access.actor, "view_growth_engine");
  const canCreateGrowthAssessment = actorHasCapability(access.actor, "create_growth_assessment");
  const canReviewGrowthAssessment = actorHasCapability(access.actor, "review_growth_assessment");
  const canManageGrowthSolutions = actorHasCapability(access.actor, "manage_growth_solutions");
  const canManageGrowthCampaigns = actorHasCapability(access.actor, "manage_growth_campaigns");
  const canManageGrowthRoadmap = actorHasCapability(access.actor, "manage_growth_roadmap");
  const canManageOfficialRequirements = actorHasCapability(access.actor, "manage_official_requirements_research");
  const growthRoadmapType = growthRoadmapTypeForBusinessStage(business.businessStage);
  const growthPlanData = canViewGrowthEngine
    ? await (async () => {
        const [currentAssessment, assessmentHistory, solutions, campaigns, officialRequirements, roadmapSteps, mediaChannels] = await Promise.all([
          getCurrentGrowthAssessment(business.id),
          listGrowthAssessmentsForBusiness(business.id),
          listGrowthSolutionsForBusiness(business.id),
          listGrowthCampaignsForBusiness(business.id),
          listOfficialRequirementsForBusiness(business.id),
          ensureGrowthRoadmapForBusiness(business.id, growthRoadmapType, { type: "system", role: "growth_roadmap_seed" }),
          listGrowthMediaChannels(),
        ]);
        return { currentAssessment, assessmentHistory, solutions, campaigns, officialRequirements, roadmapSteps, mediaChannels };
      })()
    : null;

  // Client Discovery & Project Blueprint Engine, Gate 3 — Client Discovery workspace. A business
  // normally carries ONE active discovery record with many project intents (multi-project via
  // shared discovery, MD <multi_project_foundation>) rather than many discovery records; the
  // "current" one is the most recently updated discovery not yet blueprint_created, falling back
  // to the most recent overall so a completed discovery is still visible/reviewable.
  const canViewProjectDiscovery = actorHasCapability(access.actor, "view_project_discovery");
  const canCreateProjectDiscovery = actorHasCapability(access.actor, "create_project_discovery");
  const canManageProjectDiscovery = actorHasCapability(access.actor, "manage_project_discovery");
  const canReviewProjectDiscovery = actorHasCapability(access.actor, "review_project_discovery");
  const canManageDiscoveryConsent = actorHasCapability(access.actor, "manage_discovery_consent");
  const canManageProjectBlueprint = actorHasCapability(access.actor, "manage_project_blueprint");
  const upcomingMeetingsForBridge = program5Data
    ? program5Data.meetings
        .filter((m) => m.status === "planned" || m.status === "prepared" || m.status === "in_progress")
        .map((m) => ({ id: m.id, label: m.scheduledAt ? new Date(m.scheduledAt).toLocaleString("en-US") : "Reunión sin fecha / Unscheduled meeting" }))
    : [];

  const clientDiscoveryData = canViewProjectDiscovery
    ? await (async () => {
        const discoveries = await listProjectDiscoveriesForBusiness(business.id);
        const currentDiscovery = discoveries.find((d) => d.status !== "blueprint_created") ?? discoveries[0] ?? null;
        if (!currentDiscovery) return { currentDiscovery: null, otherDiscoveries: [], intents: [], selectedIntentId: null, items: [], sources: [], consents: [], events: [], website: null, specialized: null, clientReview: null, existingSourceFiles: [] };

        const otherDiscoveries = discoveries.filter((d) => d.id !== currentDiscovery.id);
        const [intents, items, sources, consents, events, businessSourceFiles] = await Promise.all([
          listProjectDiscoveryIntents(currentDiscovery.id, business.id),
          listProjectDiscoveryItems(currentDiscovery.id, business.id),
          listProjectDiscoverySources(currentDiscovery.id, business.id),
          listProjectDiscoveryConsents(currentDiscovery.id, business.id),
          listDiscoveryEventsForDiscovery(currentDiscovery.id, business.id),
          listSourceFilesForBusiness(business.id),
        ]);
        // Gate 3.1 <part_3_asset_ref_renderer> — the canonical-asset picker's option list; reuses
        // the exact same business_source_files rows Field Discovery already shows, never a second
        // blob store or a fake file id.
        const existingSourceFiles = businessSourceFiles.map((f) => ({ id: f.id, label: `${f.originalFilename} (${f.fileKind})` }));

        const requestedIntentId = typeof resolvedSearchParams.discoveryIntent === "string" ? resolvedSearchParams.discoveryIntent : null;
        const selectedIntent = (requestedIntentId ? intents.find((i) => i.id === requestedIntentId) : null) ?? intents[0] ?? null;

        const website = selectedIntent && selectedIntent.projectType === "website"
          ? await (async () => {
              const ctx = await buildWebsiteDiscoveryContext(business.id, currentDiscovery.id, selectedIntent.id);
              if (!ctx) return null;
              const evaluations = evaluateWebsiteRequirements(ctx);
              const readiness = evaluateWebsiteReadiness(ctx);
              const questionsToAskNow = buildQuestionsToAskNow(ctx);
              const wrapUp = buildBeforeYouWrapUp(ctx);
              const scopeSignals = detectWebsiteScopeSignals(ctx);
              // Gate 4 — the live recommendation is always recomputed from current discovery
              // truth; the APPROVED decision (when one exists) is read back from its own frozen
              // discovery item so a later answer change never silently rewrites a staff decision.
              const architectureRecommendation = buildArchitectureDecisionPacket(ctx, scopeSignals);
              const approvedItem = items.find((i) => i.fieldKey === "website_architecture_decision" && i.truthClass === "technical_decision");
              const approvedArchitecture = approvedItem ? (approvedItem.value as unknown as WebsiteArchitectureDecisionPacket) : null;
              // Gate 5 — blueprint readiness/version/staleness/drift, all derived from the SAME
              // ctx/readiness/approvedArchitecture the rest of this block already computed; never a
              // second evaluation engine.
              const blueprintReadiness = evaluateWebsiteBlueprintReadiness(readiness, approvedArchitecture);
              const latestBlueprint = await getLatestBlueprintForIntent(business.id, selectedIntent.id);
              const currentFingerprint = approvedArchitecture ? computeBlueprintInputFingerprint(ctx, approvedArchitecture) : null;
              const isStale = latestBlueprint && currentFingerprint ? currentFingerprint !== latestBlueprint.inputFingerprint : false;
              const architectureDrift = latestBlueprint ? detectArchitectureDrift(latestBlueprint.packet.architecture, architectureRecommendation) : null;
              return { evaluations, readiness, questionsToAskNow, wrapUp, scopeSignals, architectureRecommendation, approvedArchitecture, blueprintReadiness, latestBlueprint, isStale, currentFingerprint, architectureDrift };
            })()
          : null;

        // Gate 6 — Logo/Brand, Print Collateral, Media Campaign share ONE generic engine (never the
        // Website catalog/architecture review). Dependencies are discovery-wide, computed once here.
        const specialized = selectedIntent && specializedFamilyForProjectType(selectedIntent.projectType)
          ? await (async () => {
              const ctx = await buildSpecializedDiscoveryContext(business.id, currentDiscovery.id, selectedIntent.id);
              if (!ctx) return null;
              const catalogEntry = catalogForProjectType(ctx.projectType);
              const family = specializedFamilyForProjectType(ctx.projectType);
              if (!catalogEntry || !family) return null;

              const evaluations = evaluateSpecializedRequirements(catalogEntry.catalog, ctx);
              const readiness = evaluateSpecializedReadiness(catalogEntry.catalog, ctx);
              const questionsToAskNow = buildSpecializedQuestionsToAskNow(catalogEntry.catalog, ctx);
              const wrapUp = buildSpecializedBeforeYouWrapUp(catalogEntry.catalog, ctx);

              const dependencies = await listIntentDependenciesForDiscovery(business.id, currentDiscovery.id);
              const latestBlueprintByIntentId = new Map<string, string | null>();
              for (const intent of intents) {
                const latest = await getLatestBlueprintForIntent(business.id, intent.id);
                latestBlueprintByIntentId.set(intent.id, latest?.status ?? null);
              }
              const blockingDependencies = computeBlockingDependencies(selectedIntent.id, dependencies, intents, latestBlueprintByIntentId);
              const suggestedDependencies = suggestSystemDependencies(intents, dependencies);

              const blueprintReadiness = evaluateProjectBlueprintReadiness(readiness, blockingDependencies);
              const latestBlueprint = await getLatestBlueprintForIntent<SpecializedProjectBlueprintPacket>(business.id, selectedIntent.id);
              const currentFingerprint = computeSpecializedBlueprintInputFingerprint(ctx);
              const isStale = latestBlueprint ? currentFingerprint !== latestBlueprint.inputFingerprint : false;

              return { family, evaluations, readiness, questionsToAskNow, wrapUp, blueprintReadiness, latestBlueprint, isStale, currentFingerprint, dependencies, suggestedDependencies, blockingDependencies };
            })()
          : null;

        // Gate 7 — Client Review + QA + Launch/Handoff. Always reviews the LATEST blueprint version
        // for the selected intent (whichever engine — Website or specialized — produced it); a
        // dedicated "view an older version" picker is not yet built (isLatestVersion is therefore
        // always true today), so the SUPERSEDED VERSION warning never fires in this initial cut.
        const latestBlueprintForReview = website?.latestBlueprint ?? specialized?.latestBlueprint ?? null;
        const clientReview = latestBlueprintForReview
          ? await buildClientReviewData(business.id, latestBlueprintForReview, latestBlueprintForReview.version)
          : null;

        return { currentDiscovery, otherDiscoveries, intents, selectedIntentId: selectedIntent?.id ?? null, items, sources, consents, events, website, specialized, clientReview, existingSourceFiles };
      })()
    : null;

  const startFromGrowthSolution = resolveStartFromGrowthSolutionPrefill({
    requestedSolutionId: resolvedSearchParams.startGrowthSolutionId,
    solutions: growthPlanData?.solutions ?? null,
    currentAssessmentId: growthPlanData?.currentAssessment?.id,
    discoveryAlreadyExists: Boolean(clientDiscoveryData?.currentDiscovery),
  });

  // Gate 2 — Business Dashboard cockpit. Local nav order matches the canonical staff journey
  // (Understand -> Diagnose -> Outreach -> Meet -> Recommend -> Opportunity -> Create -> Agree ->
  // Follow Through). Ownership Claim intentionally stays off this list — it is a separate,
  // staff-prospect-to-real-owner handoff flow, not part of the normal working journey.
  const dashboardTabs = [
    { id: "overview", label: "Resumen / Overview" },
    ...(canViewGrowthEngine && growthPlanData ? [{ id: "growth-plan", label: "Plan de Crecimiento / Growth Plan" }] : []),
    ...(canViewProjectDiscovery && clientDiscoveryData ? [{ id: "client-discovery", label: "Descubrimiento del Cliente / Client Discovery" }] : []),
    ...(canViewBook && bookData ? [{ id: "business-book", label: "Libro del Negocio / Business Book" }] : []),
    ...(fieldDiscoveryData ? [{ id: "discover", label: "Descubrir / Discover" }] : []),
    ...(canViewHealthMap && healthData ? [{ id: "health", label: "Salud / Health" }] : []),
    { id: "outreach", label: "Contacto / Outreach" },
    ...(program5Data ? [{ id: "meetings", label: "Reuniones / Meetings" }] : []),
    ...(canViewRecommendations && stewardshipData ? [{ id: "recommend", label: "Próximo Paso / Next Right Move" }] : []),
    ...(canViewOpportunities && opportunityEnabled ? [{ id: "opportunity", label: "Oportunidades / Opportunities" }] : []),
    ...(canViewCreativeStudio && creativeStudioEnabled ? [{ id: "creative", label: "Estudio Creativo / Creative Studio" }] : []),
    ...(program5Data && canViewCommitments ? [{ id: "proposals", label: "Decisión del Cliente / Client Decision" }] : []),
    ...(program5Data && canViewCommitments ? [{ id: "promises", label: "Compromisos / Commitments" }] : []),
    ...(outcomesEnabled ? [{ id: "outcomes", label: "Resultados / Outcomes" }] : []),
    ...(advisorEnabled ? [{ id: "advisor", label: "Asesor / Advisor" }] : []),
    ...(assistantEnabled ? [{ id: "assistant", label: "Asistente / Assistant" }] : []),
  ];

  const locationChip = primaryArea?.country ? countryLabel(primaryArea.country, "en") : null;
  const commitmentCount = program5Data?.briefing.commitments?.activeCount;
  const opportunityCount = canViewOpportunities && opportunityEnabled ? opportunities.length : null;

  // Gate 2 — operational status signals for the hero strip. Derived entirely from data already
  // loaded above for other sections; no new query is issued to compute any of these.
  const upcomingMeeting = program5Data?.meetings.find(
    (m) => (m.status === "planned" || m.status === "prepared") && m.scheduledAt !== null && new Date(m.scheduledAt).getTime() >= Date.now(),
  ) ?? null;
  const creativeAwaitingReviewCount = creativeJobViews.filter((j) => j.job.status === "in_review" || j.job.status === "owner_review").length;
  const currentProposal = program5Data?.proposals.find((p) => p.isCurrent) ?? null;
  const blockedOrOverdueCommitmentCount = program5Data
    ? program5Data.commitmentsWithEvents.filter(
        ({ commitment: c }) => c.status === "blocked" || (c.status === "active" && c.dueAt !== null && new Date(c.dueAt).getTime() < Date.now()),
      ).length
    : 0;

  const nextRightAction = computeBusinessDashboardNextAction({
    followUpStatus: followUpDisplayStatus,
    followUpDate: currentFollowUp?.scheduledDate ?? null,
    commitments: program5Data ? program5Data.commitmentsWithEvents.map(({ commitment: c }) => ({ status: c.status, dueAt: c.dueAt, titleEn: c.titleEn })) : [],
    meetings: program5Data ? program5Data.meetings.map((m) => ({ status: m.status, scheduledAt: m.scheduledAt })) : [],
    missingCriticalContact,
    recommendationStatus: stewardshipData?.current?.status ?? null,
    opportunities: opportunities.map((o) => ({ lifecycleState: o.lifecycleState })),
    creativeJobs: creativeJobViews.map((j) => ({ status: j.job.status })),
    proposals: program5Data ? program5Data.proposals.map((p) => ({ isCurrent: p.isCurrent, status: p.status })) : [],
    fallbackHeadlineEn: nextAction.headline.en,
    fallbackEvidenceEn: nextAction.evidence.en,
  });

  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/admin/businesses" className="text-xs font-semibold text-[#7A1E2C] underline">
        ← Volver a negocios / Back to businesses
      </Link>

      <header className="rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Image src="/logo-clean.png" alt="" width={40} height={40} className="mt-0.5 h-8 w-8 shrink-0 object-contain sm:h-10 sm:w-10" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Business Concierge</p>
              <h1 className="mt-1 font-serif text-2xl font-bold leading-tight tracking-tight text-[#1E1810] sm:text-3xl">
                {business.displayName}
              </h1>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8A6B1F]">Panel del Negocio / Business Dashboard</p>
              {business.publicName && business.publicName !== business.displayName ? (
                <p className="mt-1 text-xs text-[#7A7164]">Nombre público / Public name: {business.publicName}</p>
              ) : null}
            </div>
          </div>
          <StatusQuickActions businessId={business.id} currentStatus={salesProfile.status} />
        </div>

        <dl className="mt-4 flex flex-wrap gap-2">
          <div className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2">
            <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Estado / Status</dt>
            <dd className="text-xs font-semibold text-[#1E1810]">{labelFromList(BUSINESS_SALES_STATUSES, salesProfile.status)}</dd>
          </div>
          {business.businessStage ? (
            <div className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Etapa / Stage</dt>
              <dd className="text-xs font-semibold text-[#1E1810]">{labelFromList(BUSINESS_STAGES, business.businessStage)}</dd>
            </div>
          ) : null}
          {business.broadBusinessType ? (
            <div className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Categoría / Category</dt>
              <dd className="text-xs font-semibold text-[#1E1810]">{labelFromList(BROAD_BUSINESS_TYPES, business.broadBusinessType)}</dd>
            </div>
          ) : null}
          {locationChip ? (
            <div className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Ubicación / Location</dt>
              <dd className="text-xs font-semibold text-[#1E1810]">{locationChip}</dd>
            </div>
          ) : null}
          <div className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2">
            <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Completo / Complete</dt>
            <dd className="text-xs font-semibold text-[#1E1810]">
              {completeness.metCount}/{completeness.totalCount}
            </dd>
          </div>
          {salesProfile.lastContactedAt ? (
            <div className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Último contacto / Last contact</dt>
              <dd className="text-xs font-semibold text-[#1E1810]">{new Date(salesProfile.lastContactedAt).toLocaleDateString("en-US")}</dd>
            </div>
          ) : null}
          {currentFollowUp ? (
            <div className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Seguimiento / Follow-up</dt>
              <dd className="text-xs font-semibold text-[#1E1810]">
                {currentFollowUp.scheduledDate}
                {currentFollowUp.scheduledTime ? ` · ${currentFollowUp.scheduledTime.slice(0, 5)}` : ""}
                {" · "}
                {labelFromList(FOLLOW_UP_STATUSES, followUpDisplayStatus)}
              </dd>
            </div>
          ) : null}
          {upcomingMeeting ? (
            <div className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Próxima reunión / Next meeting</dt>
              <dd className="text-xs font-semibold text-[#1E1810]">{upcomingMeeting.scheduledAt ? new Date(upcomingMeeting.scheduledAt).toLocaleString("en-US") : "—"}</dd>
            </div>
          ) : null}
          {commitmentCount && commitmentCount > 0 ? (
            <div className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Compromisos activos / Active commitments</dt>
              <dd className="text-xs font-semibold text-[#1E1810]">
                {commitmentCount}
                {blockedOrOverdueCommitmentCount > 0 ? <span className="ml-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-800">{blockedOrOverdueCommitmentCount} atrasado/bloqueado · overdue/blocked</span> : null}
              </dd>
            </div>
          ) : null}
          {opportunityCount && opportunityCount > 0 ? (
            <div className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Oportunidades / Opportunities</dt>
              <dd className="text-xs font-semibold text-[#1E1810]">{opportunityCount}</dd>
            </div>
          ) : null}
          {creativeAwaitingReviewCount > 0 ? (
            <div className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Creativo en revisión / Creative awaiting review</dt>
              <dd className="text-xs font-semibold text-[#1E1810]">{creativeAwaitingReviewCount}</dd>
            </div>
          ) : null}
          {currentProposal ? (
            <div className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Propuesta / Proposal</dt>
              <dd className="text-xs font-semibold text-[#1E1810]">
                {currentProposal.status === "owner_review" ? "Esperando decisión del cliente / Awaiting client decision" : currentProposal.status === "accepted" ? "Aceptada — entrega al dueño pendiente / Accepted — handoff pending" : currentProposal.status}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <a href="#outreach" className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-semibold text-white">
            Agregar nota / Add note
          </a>
          <a href="#outreach" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-4 py-2 text-xs font-semibold text-[#1E1810]">
            Seguimiento / Follow-up
          </a>
          <Link
            href={`/admin/field/${business.id}`}
            className="inline-flex min-h-[44px] flex-col items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-white px-4 py-2 text-xs font-semibold text-[#7A1E2C]"
          >
            <span>Agente de Campo / Field Agent</span>
            <span className="text-[10px] font-normal text-[#7A7164]">Captura rápida en el campo. / Quick capture in the field.</span>
          </Link>
          {fieldDiscoveryData ? (
            <a href="#discover" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-4 py-2 text-xs font-semibold text-[#1E1810]">
              Descubrir / Discover
            </a>
          ) : null}
          {program5Data ? (
            <a href="#meetings" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-4 py-2 text-xs font-semibold text-[#1E1810]">
              Iniciar reunión / Start meeting
            </a>
          ) : null}
          {canViewOpportunities && opportunityEnabled ? (
            <a href="#opportunity" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-4 py-2 text-xs font-semibold text-[#1E1810]">
              Revisar oportunidades / Review opportunities
            </a>
          ) : null}
          {canViewCreativeStudio && creativeStudioEnabled ? (
            <a href="#creative" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-4 py-2 text-xs font-semibold text-[#1E1810]">
              Estudio Creativo / Creative Studio
            </a>
          ) : null}
          {program5Data && canViewCommitments ? (
            <a href="#proposals" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-4 py-2 text-xs font-semibold text-[#1E1810]">
              Decisión del Cliente / Client Decision
            </a>
          ) : null}
        </div>
      </header>

      {/* Gate 2 — Next Right Action. One deterministic, precedence-ordered signal composed from
          data already loaded above (never a second AI recommendation engine). Sits above the fold,
          immediately after the hero, so staff never have to hunt for "what do I do right now." */}
      <section className="rounded-2xl border border-[#C9A84A]/50 bg-[#FBF7EF] p-4">
        <h2 className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Próxima acción / Next right action</h2>
        <p className="mt-1 text-base font-bold text-[#7A1E2C]">{nextRightAction.what}</p>
        <p className="mt-1 text-xs text-[#5C5346]">{nextRightAction.why}</p>
        <a href={nextRightAction.whereHref} className="mt-3 inline-flex min-h-[40px] items-center justify-center rounded-lg bg-[#7A1E2C] px-3 py-2 text-xs font-bold text-white">
          {nextRightAction.whereLabel}
        </a>
      </section>

      <BusinessDashboardNav tabs={dashboardTabs} />

      <div id="overview" className="scroll-mt-24 space-y-4">
        <h2 className="font-serif text-lg font-bold text-[#1E1810]">Resumen / Overview</h2>
        <p className="text-xs text-[#7A7164]">
          Resumen ejecutivo: quién es este negocio, qué sabe Leonix, qué tan sana está la relación y qué espera una decisión. / The executive brief — who this business is, what Leonix knows, how healthy the relationship is, and what is waiting for a decision.
        </p>

        {/* Gate 2 — Overview executive-brief summary cards. Every number here is derived from data
            already loaded for the deeper sections below; nothing is queried twice and nothing is
            fabricated when a domain has no data yet. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Datos del negocio / Business snapshot</h3>
            <dl className="mt-2 space-y-1 text-xs text-[#3D3428]">
              <div>{labelFromList(BROAD_BUSINESS_TYPES, business.broadBusinessType)} · {labelFromList(BUSINESS_STAGES, business.businessStage)}</div>
              <div>{locationChip ?? "Ubicación no registrada / Location not on file"}</div>
              <div>{business.businessPrimaryLanguage ?? "Idioma principal no registrado / Primary language not on file"}</div>
            </dl>
          </section>

          {canViewBook && bookData ? (
            <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Lo que entendemos / Current understanding</h3>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                <div><p className="text-lg font-bold text-[#1E1810]">{bookData.completeness.confirmedFactCount}</p><p className="text-[10px] text-[#7A7164]">Confirmado / Confirmed</p></div>
                <div><p className="text-lg font-bold text-amber-800">{bookData.completeness.openUnknownCount}</p><p className="text-[10px] text-[#7A7164]">Incógnitas / Unknowns</p></div>
                <div><p className="text-lg font-bold text-red-700">{bookData.completeness.unresolvedContradictionCount}</p><p className="text-[10px] text-[#7A7164]">Conflictos / Conflicts</p></div>
              </dl>
              <a href="#business-book" className="mt-2 inline-block text-xs font-semibold text-[#7A1E2C] underline">Abrir Libro del Negocio / Open Business Book</a>
            </section>
          ) : null}

          {canViewHealthMap && healthData ? (
            <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Salud del negocio / Business health</h3>
              {!healthData.latestRun ? (
                <p className="mt-2 text-xs text-[#7A7164]">Necesitamos más información verificada antes de evaluar esta área. / We need more verified information before assessing this area.</p>
              ) : (
                <>
                  <dl className="mt-2 grid grid-cols-4 gap-1 text-center text-xs">
                    <div><p className="text-lg font-bold text-emerald-700">{healthData.latestRun.strongCount}</p><p className="text-[10px] text-[#7A7164]">Fuerte / Strong</p></div>
                    <div><p className="text-lg font-bold text-amber-800">{healthData.latestRun.needsAttentionCount}</p><p className="text-[10px] text-[#7A7164]">Atención / Attention</p></div>
                    <div><p className="text-lg font-bold text-[#7A7164]">{healthData.latestRun.insufficientInformationCount}</p><p className="text-[10px] text-[#7A7164]">Poco claro / Unclear</p></div>
                    <div><p className="text-lg font-bold text-red-700">{healthData.latestRun.contradictionBlockedCount}</p><p className="text-[10px] text-[#7A7164]">Bloqueado / Blocked</p></div>
                  </dl>
                  <a href="#health" className="mt-2 inline-block text-xs font-semibold text-[#7A1E2C] underline">Abrir Mapa de Salud / Open Health Map</a>
                </>
              )}
            </section>
          ) : null}

          <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Relación / Relationship</h3>
            <dl className="mt-2 space-y-1 text-xs text-[#3D3428]">
              <div>Estado / Status: {labelFromList(BUSINESS_SALES_STATUSES, salesProfile.status)}</div>
              <div>Último contacto / Last contact: {salesProfile.lastContactedAt ? new Date(salesProfile.lastContactedAt).toLocaleDateString("en-US") : "no registrado / not recorded"}</div>
              <div>
                {currentFollowUp
                  ? `Próximo seguimiento / Next follow-up: ${currentFollowUp.scheduledDate} · ${labelFromList(FOLLOW_UP_STATUSES, followUpDisplayStatus)}`
                  : "No hay seguimiento programado actualmente. / No follow-up is currently scheduled."}
              </div>
            </dl>
            <a href="#outreach" className="mt-2 inline-block text-xs font-semibold text-[#7A1E2C] underline">Abrir Contacto / Open Outreach</a>
          </section>

          {canViewRecommendations && stewardshipData ? (
            <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Próximo paso / Next right move</h3>
              {!stewardshipData.current ? (
                <p className="mt-2 text-xs text-[#7A7164]">Leonix aún está aprendiendo lo suficiente para recomendar responsablemente. / Leonix is still learning enough to recommend responsibly.</p>
              ) : (
                <>
                  <p className="mt-2 text-sm font-semibold text-[#1E1810]">{stewardshipData.current.primaryIntervention}</p>
                  <p className="mt-1 text-xs text-[#7A7164]">Estado / Status: {stewardshipData.current.status}</p>
                </>
              )}
              <a href="#recommend" className="mt-2 inline-block text-xs font-semibold text-[#7A1E2C] underline">Abrir Recomendaciones / Open Recommendations</a>
            </section>
          ) : null}

          {(canViewOpportunities && opportunityEnabled) || (canViewCreativeStudio && creativeStudioEnabled) ? (
            <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Oportunidades y creatividad / Opportunities &amp; creative</h3>
              <dl className="mt-2 space-y-1 text-xs text-[#3D3428]">
                {canViewOpportunities && opportunityEnabled ? (
                  <div>{opportunities.length === 0 ? "No hay oportunidades listas para revisión. / No relevant opportunities are ready for review yet." : `${opportunities.length} opportunit${opportunities.length === 1 ? "y" : "ies"} on record.`}</div>
                ) : null}
                {canViewCreativeStudio && creativeStudioEnabled ? (
                  <div>{creativeJobViews.length === 0 ? "No se ha creado ninguna solicitud creativa aún. / No creative request has been created yet." : `${creativeAwaitingReviewCount} awaiting review of ${creativeJobViews.length} job(s).`}</div>
                ) : null}
              </dl>
              <div className="mt-2 flex gap-3">
                {canViewOpportunities && opportunityEnabled ? <a href="#opportunity" className="text-xs font-semibold text-[#7A1E2C] underline">Abrir Oportunidades / Open Opportunities</a> : null}
                {canViewCreativeStudio && creativeStudioEnabled ? <a href="#creative" className="text-xs font-semibold text-[#7A1E2C] underline">Abrir Creativo / Open Creative</a> : null}
              </div>
            </section>
          ) : null}

          {program5Data && canViewCommitments ? (
            <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Compromisos / Commitments</h3>
              <dl className="mt-2 space-y-1 text-xs text-[#3D3428]">
                <div>{program5Data.commitmentsWithEvents.length} abiertos / open</div>
                <div className={blockedOrOverdueCommitmentCount > 0 ? "font-semibold text-red-700" : ""}>{blockedOrOverdueCommitmentCount} atrasados o bloqueados / overdue or blocked</div>
              </dl>
              <a href="#promises" className="mt-2 inline-block text-xs font-semibold text-[#7A1E2C] underline">Abrir Compromisos / Open Commitments</a>
            </section>
          ) : null}
        </div>

      {/* G. Possible next helpful action (profile-completeness specific — kept as detail beneath
          the deterministic Next Right Action strip above, not a competing headline). */}
      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">Profile completeness follow-up</h2>
        <p className="mt-1 text-sm font-semibold text-[#1E1810]">{nextAction.headline.en}</p>
        <p className="mt-2 text-xs text-[#5C5346]">
          <span className="font-semibold">Evidence:</span> {nextAction.evidence.en}
        </p>
        <p className="mt-1 text-xs text-[#5C5346]">
          <span className="font-semibold">Confirm:</span> {nextAction.whatToConfirm.en}
        </p>
        <p className="mt-1 text-xs text-[#7A7164]">
          <span className="font-semibold">Do not recommend yet:</span> {nextAction.whatNotToRecommendYet.en}
        </p>
      </section>

      {/* F. Profile completeness — checklist, never a bare percentage. */}
      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">
          Profile completeness — {completeness.metCount}/{completeness.totalCount}
        </h2>
        <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {completeness.items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-xs">
              <span aria-hidden="true" className={item.met ? "text-emerald-700" : "text-[#A67C52]"}>
                {item.met ? "✓" : "○"}
              </span>
              <span className={item.met ? "text-[#3D3428]" : "text-[#7A7164]"}>{item.label.en}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* A. Business summary */}
      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">Business summary</h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-[#8A6B1F]">Legal name</dt>
            <dd className="text-sm text-[#1E1810]">{business.legalName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#8A6B1F]">Languages</dt>
            <dd className="text-sm text-[#1E1810]">{business.businessPrimaryLanguage ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#8A6B1F]">Operating model</dt>
            <dd className="text-sm text-[#1E1810]">{business.operatingModels.map((m) => labelFromList(OPERATING_MODELS, m)).join(", ") || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#8A6B1F]">Sales relationships</dt>
            <dd className="text-sm text-[#1E1810]">{business.salesRelationships.map((m) => labelFromList(SALES_RELATIONSHIPS, m)).join(", ") || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#8A6B1F]">Sales channels</dt>
            <dd className="text-sm text-[#1E1810]">{business.salesChannels.map((m) => labelFromList(SALES_CHANNELS, m)).join(", ") || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#8A6B1F]">Year started</dt>
            <dd className="text-sm text-[#1E1810]">{business.yearStarted ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#8A6B1F]">Last updated</dt>
            <dd className="text-sm text-[#1E1810]">{new Date(business.updatedAt).toLocaleString("en-US")}</dd>
          </div>
        </dl>
      </section>

      {/* C. Location and service coverage — never merged into one line. */}
      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">Location and service coverage</h2>
        <dl className="mt-3 space-y-3">
          <div>
            <dt className="text-xs font-semibold text-[#8A6B1F]">Business country</dt>
            <dd className="text-sm text-[#1E1810]">{primaryArea?.country ? countryLabel(primaryArea.country, "en") : "—"}</dd>
          </div>
          {primaryArea && physicalAddressSummary(primaryArea.structuredDetails, primaryArea.country ?? "", "en") ? (
            <div>
              <dt className="text-xs font-semibold text-[#8A6B1F]">Physical address {primaryArea.structuredDetails.addressVisibility ? `(${primaryArea.structuredDetails.addressVisibility})` : ""}</dt>
              <dd className="text-sm text-[#1E1810]">{physicalAddressSummary(primaryArea.structuredDetails, primaryArea.country ?? "", "en")}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-semibold text-[#8A6B1F]">Service area</dt>
            <dd className="text-sm text-[#1E1810]">{primaryArea ? summarizeServiceCoverage(primaryArea.country ?? "", primaryArea.structuredDetails, "en", t.wizard.step5.coverage.summary) : "—"}</dd>
          </div>
        </dl>
      </section>

      {/* D. Digital presence */}
      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">Digital presence</h2>
        {digitalProfiles.length === 0 && customLinks.length === 0 ? (
          <p className="mt-2 text-sm text-[#7A7164]">No digital profiles or links on file.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {digitalProfiles.map((p) => (
              <li key={p.id}>
                <a href={p.handleOrUrl.startsWith("http") || p.handleOrUrl.startsWith("@") ? p.handleOrUrl : `https://${p.handleOrUrl}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[#E8DFD0] bg-[#FAF7F2] px-3 py-1 text-xs font-semibold text-[#3D3428] hover:bg-white">
                  {labelFromList(DIGITAL_PROFILE_PLATFORMS, p.platform)}
                </a>
              </li>
            ))}
            {customLinks.map((l) => (
              <li key={l.id}>
                <a href={l.displayUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[#E8DFD0] bg-[#FAF7F2] px-3 py-1 text-xs font-semibold text-[#3D3428] hover:bg-white">
                  {l.customLabel ?? l.linkType}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Contacts — all methods, labeled, formatted. */}
      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">All contacts on file</h2>
        <dl className="mt-2 space-y-2">
          {contacts.map((c) => (
            <div key={c.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
              <dt className="text-xs font-semibold text-[#8A6B1F]">{labelFromList(CONTACT_LABELS, c.label)}</dt>
              <dd className="text-[#1E1810]">{!canViewPrivateContacts ? c.value : c.contactType === "phone" ? formatUsPhoneForDisplay(c.value) : c.value}</dd>
              <dd className="text-[10px] text-[#9A9184]">({c.visibility})</dd>
            </div>
          ))}
          {contacts.length === 0 ? <p className="text-sm text-[#7A7164]">No contacts on file.</p> : null}
          {contacts.length > 0 && !canViewPrivateContacts ? <p className="text-xs text-[#7A7164]">Contact values are hidden — your role does not include view_private_contacts.</p> : null}
        </dl>
      </section>

      {/* E. Connected Leonix advertisements */}
      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">Connected Leonix advertisements</h2>
        {listingLinks.length === 0 ? (
          <p className="mt-2 text-sm text-[#7A7164]">No connected advertisements.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {listingLinks.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E8DFD0] p-2 text-xs">
                <span>
                  {l.listingSource} · Ad ID {l.listingId}
                </span>
                <span className="rounded-full bg-[#EDE6D6] px-2 py-0.5 font-bold text-[#3D3428]">{l.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Sales preparation panel */}
      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">Before contacting this business</h2>
        <ul className="mt-2 space-y-1 text-xs text-[#5C5346]">
          <li>Preferred contact method: {business.preferredResponseMethod ?? "not set — confirm before calling"}</li>
          <li>Primary language: {business.businessPrimaryLanguage ?? "not set"}</li>
          <li>Connected ads: {listingLinks.length}</li>
          <li>Last contacted: {salesProfile.lastContactedAt ? new Date(salesProfile.lastContactedAt).toLocaleDateString("en-US") : "never recorded"}</li>
          {membership?.manualReviewFlag ? <li className="font-semibold text-amber-800">⚠ Authorization needs review before proceeding.</li> : null}
          {!primaryPhone && !primaryEmail ? <li className="font-semibold text-amber-800">⚠ No verified owner contact on file.</li> : null}
        </ul>
      </section>
      </div>

      {/* Growth Engine, Gate C — Growth Plan. The interpretive layer over Business Book/Health/
          Meetings/Opportunities/Creative/Proposals/Commitments — never a duplicate of their own
          detail screens, only a summary + deep links + the assessment-specific actions. Entirely
          absent from the page when the actor lacks view_growth_engine, not just visually hidden. */}
      {canViewGrowthEngine && growthPlanData ? (
        <section id="growth-plan" className="scroll-mt-24 space-y-3">
          <div className="rounded-2xl border border-[#D6C7AD]/70 bg-[#FFFDF7] p-4">
            <h2 className="font-serif text-lg font-bold text-[#1E1810]">Plan de Crecimiento / Growth Plan</h2>
            <p className="mt-1 text-xs text-[#7A7164]">
              Lo que sabemos, lo que falta, qué preguntar y el próximo paso correcto — conectado al trabajo real, no un reporte aislado. / What we know, what is missing, what to ask, and the next right move — connected to real work, not an isolated report.
            </p>
          </div>
          <GrowthPlanPanel
            businessId={business.id}
            businessStage={business.businessStage}
            roadmapType={growthRoadmapType}
            currentAssessment={growthPlanData.currentAssessment}
            assessmentHistory={growthPlanData.assessmentHistory.map((a) => ({ id: a.id, status: a.status, createdAt: a.createdAt, reviewedAt: a.reviewedAt }))}
            solutions={growthPlanData.solutions}
            campaigns={growthPlanData.campaigns}
            officialRequirements={growthPlanData.officialRequirements}
            roadmapSteps={growthPlanData.roadmapSteps}
            mediaChannels={growthPlanData.mediaChannels}
            canCreateAssessment={canCreateGrowthAssessment}
            canReviewAssessment={canReviewGrowthAssessment}
            canManageSolutions={canManageGrowthSolutions}
            canManageCampaigns={canManageGrowthCampaigns}
            canManageRoadmap={canManageGrowthRoadmap}
            canManageOfficialRequirements={canManageOfficialRequirements}
            canManageCommitments={canManageCommitments}
            canStartProjectDiscovery={canViewProjectDiscovery && canCreateProjectDiscovery}
          />
        </section>
      ) : null}

      {/* Client Discovery & Project Blueprint Engine, Gate 3 — capability-gated; entirely absent
          from the page when the actor lacks view_project_discovery, not just visually hidden. */}
      {canViewProjectDiscovery && clientDiscoveryData ? (
        <section id="client-discovery" className="scroll-mt-24 space-y-3">
          <div className="rounded-2xl border border-[#D6C7AD]/70 bg-[#FFFDF7] p-4">
            <h2 className="font-serif text-lg font-bold text-[#1E1810]">Descubrimiento del Cliente / Client Discovery</h2>
            <p className="mt-1 text-xs text-[#7A7164]">
              Lo siguiente correcto que preguntar — no un formulario de 90 preguntas. Capture lo que el cliente dice, vea qué falta, y sepa cuándo está listo para el plan del proyecto. / The next right thing to ask — not a 90-question wall. Capture what the client says, see what&apos;s still missing, and know when it&apos;s ready for the project blueprint.
            </p>
          </div>
          <ClientDiscoveryJourney
            businessId={business.id}
            currentDiscovery={clientDiscoveryData.currentDiscovery}
            otherDiscoveries={clientDiscoveryData.otherDiscoveries}
            intents={clientDiscoveryData.intents}
            selectedIntentId={clientDiscoveryData.selectedIntentId}
            items={clientDiscoveryData.items}
            sources={clientDiscoveryData.sources}
            consents={clientDiscoveryData.consents}
            events={clientDiscoveryData.events}
            website={clientDiscoveryData.website}
            specialized={clientDiscoveryData.specialized}
            clientReview={clientDiscoveryData.clientReview}
            upcomingMeetings={upcomingMeetingsForBridge}
            canCreate={canCreateProjectDiscovery}
            canManage={canManageProjectDiscovery}
            canReview={canReviewProjectDiscovery}
            canManageConsent={canManageDiscoveryConsent}
            canManageBlueprint={canManageProjectBlueprint}
            startFromGrowthSolution={startFromGrowthSolution}
            existingSourceFiles={clientDiscoveryData.existingSourceFiles}
          />
        </section>
      ) : null}

      {/* Living Business Book (Gate BCO-5A) — capability-gated; entirely absent from the page when the actor lacks view_business_book, not just visually hidden. */}
      {canViewBook && bookData ? (
        <section id="business-book" className="scroll-mt-24 rounded-2xl border border-[#E8DFD0] bg-white p-4">
          <h2 className="font-serif text-lg font-bold text-[#1E1810]">Libro del Negocio / Business Book</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Hechos verificados, evidencia, incógnitas, contradicciones y el entendimiento en evolución de Leonix sobre este negocio. Una inferencia de IA nunca se muestra como equivalente a un hecho confirmado. / Verified facts, evidence, unknowns, contradictions, and the evolving Leonix understanding of this business. AI inference is never shown as equivalent to a confirmed fact.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-[#E8DFD0] p-2 text-center">
              <p className="text-lg font-bold text-[#1E1810]">{bookData.completeness.confirmedFactCount}</p>
              <p className="text-[10px] text-[#7A7164]">Hechos confirmados / Confirmed facts</p>
            </div>
            <div className="rounded-lg border border-[#E8DFD0] p-2 text-center">
              <p className="text-lg font-bold text-[#1E1810]">{bookData.completeness.ownerStatementCount}</p>
              <p className="text-[10px] text-[#7A7164]">Declaraciones del dueño / Owner statements</p>
            </div>
            <div className="rounded-lg border border-[#E8DFD0] p-2 text-center">
              <p className="text-lg font-bold text-amber-800">{bookData.completeness.openUnknownCount}</p>
              <p className="text-[10px] text-[#7A7164]">Incógnitas abiertas / Open unknowns</p>
            </div>
            <div className="rounded-lg border border-[#E8DFD0] p-2 text-center">
              <p className="text-lg font-bold text-red-700">{bookData.completeness.unresolvedContradictionCount}</p>
              <p className="text-[10px] text-[#7A7164]">Contradicciones sin resolver / Unresolved contradictions</p>
            </div>
          </div>

          <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Hechos / Facts</h3>
          <p className="text-[11px] text-[#9A9184]">Verdad duradera y verificada del negocio — distinta de una nota del personal, una declaración del dueño o una inferencia de IA. / Durable, verified business truth — distinct from a staff note, an owner statement, or an AI inference.</p>
          <ul className="mt-2 space-y-2">
            {bookData.facts.map((f) => (
              <li key={f.id} className="rounded-lg border border-[#E8DFD0] p-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#1E1810]">{f.factKey}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${factSourceClassBadgeClass(f.sourceClass)}`}>{f.sourceClass}</span>
                </div>
                <p className="mt-1 text-sm text-[#3D3428]">{f.displayValue ?? "—"}</p>
                <p className="mt-1 text-[10px] text-[#9A9184]">
                  {f.confirmationState} · confianza / confidence: {f.confidence} · {f.sensitivity}
                </p>
                {canConfirmFact && f.confirmationState !== "owner_confirmed" ? <FactDecisionButtons businessId={business.id} factId={f.id} /> : null}
              </li>
            ))}
            {bookData.facts.length === 0 ? <li className="text-sm text-[#7A7164]">Aún no hay hechos registrados. / No facts recorded yet.</li> : null}
          </ul>
          <div className="mt-3">
            <CreateFactForm businessId={business.id} canConfirm={canConfirmFact} />
          </div>

          <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Evidencia / Evidence</h3>
          <p className="text-[11px] text-[#9A9184]">
            Notas del personal, cargas de descubrimiento de campo y otras observaciones de apoyo. La evidencia no es un hecho hasta que un humano la promueve explícitamente arriba. / Staff notes, field discovery uploads, and other supporting observations. Evidence is not a fact until a human explicitly promotes it above.
          </p>
          <ul className="mt-2 space-y-2">
            {bookData.evidence.slice(0, 20).map((e) => (
              <li key={e.id} className="rounded-lg border border-[#E8DFD0] p-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#1E1810]">{e.sourceTitle}</span>
                  <span className="rounded-full bg-[#EDE6D6] px-2 py-0.5 text-[10px] font-bold text-[#3D3428]">{e.evidenceType.replace(/_/g, " ")}</span>
                </div>
                {e.capturedText ? <p className="mt-1 break-words text-sm text-[#3D3428]">{e.capturedText}</p> : null}
                <p className="mt-1 text-[10px] text-[#9A9184]">
                  {new Date(e.createdAt).toLocaleString()} · {e.collectedByRole} · confiabilidad / reliability: {e.reliability}
                </p>
              </li>
            ))}
            {bookData.evidence.length === 0 ? <li className="text-sm text-[#7A7164]">Aún no hay evidencia registrada. / No evidence recorded yet.</li> : null}
            {bookData.evidence.length > 20 ? <li className="text-[10px] text-[#9A9184]">Mostrando las 20 más recientes de {bookData.evidence.length}. / Showing the 20 most recent of {bookData.evidence.length}.</li> : null}
          </ul>

          <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Incógnitas / Unknowns</h3>
          <p className="text-[11px] text-[#9A9184]">Lo que Leonix aún necesita confirmar antes de recomendar responsablemente. / What Leonix still needs to confirm before recommending responsibly.</p>
          <ul className="mt-2 space-y-2">
            {bookData.unknowns.map((u) => (
              <li key={u.id} className="rounded-lg border border-[#E8DFD0] p-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-[#1E1810]">{u.questionLabel}</span>
                  <span className="rounded-full bg-[#FFF4E0] px-2 py-0.5 text-[10px] font-bold text-[#5C4E2E]">{u.status}</span>
                </div>
                {u.status === "open" && canManageUnknowns ? <ResolveUnknownForm businessId={business.id} unknown={u} /> : null}
                {u.status === "answered" ? <p className="mt-1 text-xs text-[#7A7164]">Resolución / Resolution: {u.resolution}</p> : null}
              </li>
            ))}
            {bookData.unknowns.length === 0 ? <li className="text-sm text-[#7A7164]">No hay incógnitas abiertas. / No open unknowns.</li> : null}
          </ul>
          {canManageUnknowns ? (
            <div className="mt-3">
              <CreateUnknownForm businessId={business.id} />
            </div>
          ) : null}

          <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Contradicciones / Contradictions</h3>
          <p className="text-[11px] text-[#9A9184]">Dos afirmaciones que no pueden ser ambas ciertas — deben resolverse, nunca elegirse en silencio. / Two claims that cannot both be true — must be resolved, never silently picked.</p>
          <ul className="mt-2 space-y-2">
            {bookData.contradictions.map((c) => (
              <li key={c.id} className="rounded-lg border border-[#E8DFD0] p-2 text-xs">
                <p><span className="font-semibold">A:</span> {c.claimALabel}</p>
                <p><span className="font-semibold">B:</span> {c.claimBLabel}</p>
                <p className="mt-1 text-[10px] text-[#9A9184]">{c.status}{c.resolution ? ` — ${c.resolution}` : ""}</p>
              </li>
            ))}
            {bookData.contradictions.length === 0 ? <li className="text-sm text-[#7A7164]">No contradictions on record.</li> : null}
          </ul>

          {canConductDiscovery ? (
            <>
              <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Discovery sessions</h3>
              <p className="text-[11px] text-[#9A9184]">Structured Q&amp;A distinct from the Discover section&apos;s public-source research below.</p>
              <div className="mt-2">
                <DiscoveryPanel businessId={business.id} session={bookData.discoverySessions.find((s) => s.status === "in_progress") ?? null} />
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {/* Program 4 — Field Discovery + AI Research Engine. Positioned right after Business Book:
          both are the "what do we know" phase before Health's "what does it mean" diagnosis. */}
      {fieldDiscoveryData ? (
        <section id="discover" className="scroll-mt-24 rounded-2xl border border-[#E8DFD0] bg-white p-4">
          <h2 className="font-serif text-lg font-bold text-[#1E1810]">Descubrir / Discover</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Reunir evidencia, contexto de fuentes públicas, información faltante, fotos/archivos y borradores de resumen apoyados por IA. Una inferencia de IA no es un hecho confirmado. / Gather evidence, public-source context, missing information, photos/files, and AI-supported briefing drafts. AI inference is not a confirmed fact.
          </p>
          <div className="mt-3 space-y-3">
            <ConsentStatusPanel consent={fieldDiscoveryData.consent} />
            <SourceLinksPanel sourceLinks={fieldDiscoveryData.sourceLinks} />
            <SourceFilesPanel sourceFiles={fieldDiscoveryData.sourceFiles} />
            <RunResearchButton
              businessId={business.id}
              canRun={canRunAiResearch}
              providerAvailable={fieldDiscoveryData.providerAvailable}
              googlePlacesAvailable={fieldDiscoveryData.googlePlacesAvailable}
              runs={fieldDiscoveryData.runs}
            />
            <SourceFindingsPanel latestRun={fieldDiscoveryData.latestRun} />
            <BriefingReviewPanel
              businessId={business.id}
              draft={fieldDiscoveryData.latestDraft}
              canReview={canReviewAiBriefing}
              canPromote={canPromoteAiBriefing}
            />
          </div>
        </section>
      ) : null}

      {/* Business Health Map (Gate BCO-6A) — capability-gated; entirely absent from the page when the actor lacks view_business_health_map. */}
      {canViewHealthMap && healthData ? (
        <section id="health" className="scroll-mt-24 rounded-2xl border border-[#E8DFD0] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif text-lg font-bold text-[#1E1810]">Salud del Negocio / Business Health</h2>
            {canRunHealthAssessment ? <RunAssessmentButton businessId={business.id} /> : null}
          </div>
          <p className="mt-1 text-xs text-[#7A7164]">
            Dónde el negocio está fuerte, estable, necesita atención, carece de información o está bloqueado por una contradicción. Nunca una puntuación numérica. / Where the business is strong, stable, needs attention, lacks information, or is blocked by contradiction. Never a numeric score.
          </p>
          <StewardshipOpportunityFlowNav
            current="health"
            hasRecommend={Boolean(canViewRecommendations && stewardshipData)}
            hasOpportunity={Boolean(canViewOpportunities && opportunityEnabled)}
            hasCreative={Boolean(canViewCreativeStudio && creativeStudioEnabled)}
          />

          {!healthData.latestRun ? (
            <p className="mt-3 text-sm text-[#7A7164]">Necesitamos más información verificada antes de evaluar esta área. / We need more verified information before assessing this area.</p>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <div className="rounded-lg border border-[#E8DFD0] p-2 text-center">
                  <p className="text-lg font-bold text-emerald-700">{healthData.latestRun.strongCount}</p>
                  <p className="text-[10px] text-[#7A7164]">Fuerte / Strong</p>
                </div>
                <div className="rounded-lg border border-[#E8DFD0] p-2 text-center">
                  <p className="text-lg font-bold text-[#1E1810]">{healthData.latestRun.stableCount}</p>
                  <p className="text-[10px] text-[#7A7164]">Estable / Stable</p>
                </div>
                <div className="rounded-lg border border-[#E8DFD0] p-2 text-center">
                  <p className="text-lg font-bold text-amber-800">{healthData.latestRun.needsAttentionCount}</p>
                  <p className="text-[10px] text-[#7A7164]">Necesita atención / Needs attention</p>
                </div>
                <div className="rounded-lg border border-[#E8DFD0] p-2 text-center">
                  <p className="text-lg font-bold text-[#7A7164]">{healthData.latestRun.insufficientInformationCount}</p>
                  <p className="text-[10px] text-[#7A7164]">Información insuficiente / Insufficient info</p>
                </div>
                <div className="rounded-lg border border-[#E8DFD0] p-2 text-center">
                  <p className="text-lg font-bold text-red-700">{healthData.latestRun.contradictionBlockedCount}</p>
                  <p className="text-[10px] text-[#7A7164]">Bloqueado / Blocked</p>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-[#9A9184]">
                Versión de cálculo / Calculation version {healthData.latestRun.calculationVersion} · último cálculo / last calculated {healthData.latestRun.completedAt ? new Date(healthData.latestRun.completedAt).toLocaleString("en-US") : "—"}
              </p>

              <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Dimensiones / Dimensions</h3>
              <ul className="mt-2 space-y-2">
                {HEALTH_DIMENSION_KEYS.map((key) => {
                  const dim = healthData.dimensionResults.find((d) => d.dimensionKey === key);
                  if (!dim) return null;
                  return (
                    <li key={key} className="rounded-lg border border-[#E8DFD0] p-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#1E1810]">{key}</span>
                        <span className="rounded-full bg-[#EDE6D6] px-2 py-0.5 text-[10px] font-bold text-[#3D3428]">{dim.status}</span>
                      </div>
                      <p className="mt-1 text-sm text-[#3D3428]">{dim.explanationEn}</p>
                      {dim.limitationsEn ? <p className="mt-1 text-xs text-[#7A7164]">{dim.limitationsEn}</p> : null}
                      <p className="mt-1 text-[10px] text-[#9A9184]">
                        confidence: {dim.confidence} · evidence: {dim.evidenceStrength} · freshness: {dim.freshness} · {dim.supportingFactIds.length} supporting fact(s) · {dim.relatedUnknownIds.length} related unknown(s) · {dim.relatedContradictionIds.length} related contradiction(s)
                      </p>
                    </li>
                  );
                })}
              </ul>

              {healthData.readiness ? (
                <>
                  <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Recommendation readiness</h3>
                  <div className="mt-2 rounded-lg border border-[#E8DFD0] p-2">
                    <span className="rounded-full bg-[#EDE6D6] px-2 py-0.5 text-[10px] font-bold text-[#3D3428]">{healthData.readiness.readinessStatus}</span>
                    <p className="mt-1 text-sm text-[#3D3428]">{healthData.readiness.reasonEn}</p>
                    {healthData.readiness.humanReviewRequired ? <p className="mt-1 text-xs font-semibold text-amber-800">⚠ Human review flagged{healthData.readiness.humanReviewMarkedByEmail ? ` by ${healthData.readiness.humanReviewMarkedByEmail}` : ""}.</p> : null}
                    {canMarkHumanReview ? (
                      <MarkHumanReviewForm businessId={business.id} runId={healthData.latestRun.id} currentlyRequired={healthData.readiness.humanReviewRequired} />
                    ) : null}
                  </div>
                </>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      <div id="outreach" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#1E1810]">Contacto / Outreach</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Si hemos contactado a este negocio, qué pasó, quién lo atendió y si se necesita otro contacto. / Have we contacted this business, what happened, who handled it, and whether another contact is needed.
            Sales follow-ups are relationship actions in <code className="text-[11px]">business_follow_ups</code> — not Promise Keeper commitments.
          </p>
        </div>

        {/* Gate 3 — Relationship status leads Outreach: "have we contacted them, what's the state." */}
        <section className="rounded-2xl border border-[#E8DFD0] bg-[#FFFDF7] p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Estado de la relación / Relationship status</h3>
          <p className="mt-2 text-sm font-semibold text-[#1E1810]">{labelFromList(BUSINESS_SALES_STATUSES, salesProfile.status)}</p>
          <p className="mt-1 text-xs text-[#7A7164]">
            Último contacto / Last contacted: {salesProfile.lastContactedAt ? new Date(salesProfile.lastContactedAt).toLocaleString("en-US") : "no registrado / not recorded"}
          </p>
          <p className="mt-1 text-[11px] text-[#7A7164]">Cambie el estado con el control de Estado en el encabezado del panel. Solo valores canónicos existentes. / Change status with the Status control in the dashboard header. Existing canonical values only.</p>
        </section>

        {/* Gate 3 — Recent activity. This repo has no separate structured contact-attempt
            timeline (confirmed by direct inspection); internal notes ARE the real recent-activity
            record, so this section honestly serves that role rather than fabricating a feed. */}
        <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
          <h3 className="text-sm font-bold text-[#1E1810]">Actividad reciente — notas internas / Recent activity — internal notes</h3>
          <p className="mt-1 text-xs text-[#7A7164]">
            Notas internas de la relación (<code className="text-[11px]">business_sales_notes</code>). Nunca se muestran al dueño. No es un hecho confirmado del negocio ni una nota de personal del Living Book de Field Agent. / Internal relationship notes. Never shown to the owner. Not a confirmed business fact and not a Field Agent Living Book staff note.
          </p>
          <div className="mt-3">
            <NotesPanel
              businessId={business.id}
              notes={notes}
              canWrite={actorHasCapability(access.actor, "create_internal_note") && !isOwnerBootstrapActor(access.actor)}
            />
          </div>
        </section>

        <section id="follow-up" className="scroll-mt-24 rounded-2xl border border-[#E8DFD0] bg-white p-4">
          <h3 className="text-sm font-bold text-[#1E1810]">Seguimiento / Follow-up</h3>
          <p className="mt-1 text-xs text-[#7A7164]">
            Próximo contacto de relación — cuándo, por qué y la acción esperada. Distinto de las notas del Living Book de Field Agent, hechos confirmados, notas de reunión y compromisos de Promise Keeper. / Next relationship contact — when, why, and expected action. Distinct from Field Agent Living Book notes, confirmed facts, meeting notes, and Promise Keeper commitments.
          </p>
          <div className="mt-3">
            <FollowUpPanel
              businessId={business.id}
              current={currentFollowUp}
              canWrite={actorHasCapability(access.actor, "create_follow_up") && !isOwnerBootstrapActor(access.actor)}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Acciones de contacto / Contact actions</h3>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {primaryPhone ? (
              <a href={`tel:${primaryPhone.normalizedValue}`} className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-3 py-2 text-xs font-bold text-white">
                Llamar / Call {formatUsPhoneForDisplay(primaryPhone.value)}
              </a>
            ) : null}
            {primaryPhone?.capabilities.includes("sms") ? (
              <a href={`sms:${primaryPhone.normalizedValue}`} className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#3D3428]">
                SMS
              </a>
            ) : null}
            {primaryPhone?.capabilities.includes("whatsapp") ? (
              <a href={`https://wa.me/${primaryPhone.normalizedValue.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 px-3 py-2 text-xs font-semibold text-[#1F3A2D]">
                WhatsApp
              </a>
            ) : null}
            {primaryEmail ? (
              <a href={`mailto:${primaryEmail.value}`} className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#3D3428]">
                Correo / Email
              </a>
            ) : null}
            {websiteContact ? (
              <a href={websiteContact.value.startsWith("http") ? websiteContact.value : `https://${websiteContact.value}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#3D3428]">
                Sitio web / Website
              </a>
            ) : null}
            {!canViewPrivateContacts ? (
              <p className="text-xs text-[#7A7164]">Su rol no incluye permiso para ver detalles de contacto privados. / Your role does not include permission to view private contact details.</p>
            ) : !primaryPhone && !primaryEmail && !websiteContact ? (
              <p className="text-xs text-[#7A7164]">Aún no hay ningún método de contacto verificado registrado. / No verified contact method on file yet.</p>
            ) : null}
          </div>
        </section>
      </div>

      {/* Program 5 — Lion's Cockpit + Meeting Studio. Meetings sits right after Outreach and
          right before Recommendations, matching the canonical PREP -> MEETING -> REVIEW ->
          RECOMMEND journey. */}
      {program5Data ? (
        <div id="meetings" className="scroll-mt-24">
        <MeetingJourney
          businessId={business.id}
          briefing={program5Data.briefing}
          meetings={program5Data.meetings}
          meetingsWithDetails={program5Data.meetingsWithDetails}
          canPrepareMeeting={canPrepareMeeting}
          canReviewNotes={canReviewMeetingNotes}
          relationship={{
            statusLabel: labelFromList(BUSINESS_SALES_STATUSES, salesProfile.status),
            lastContactedAt: salesProfile.lastContactedAt,
            followUp: currentFollowUp && followUpDisplayStatus
              ? { scheduledDate: currentFollowUp.scheduledDate, displayStatus: labelFromList(FOLLOW_UP_STATUSES, followUpDisplayStatus) }
              : null,
          }}
          followThrough={{
            canViewCommitments,
            canCreateCommitment: canManageCommitments,
            hasCurrentProposal: program5Data.proposals.some((p) => p.isCurrent),
            hasRecommend: Boolean(canViewRecommendations && stewardshipData),
            hasOpportunity: Boolean(canViewOpportunities && opportunityEnabled),
            opportunityCount: canViewOpportunities && opportunityEnabled ? opportunities.length : null,
            hasCreative: Boolean(canViewCreativeStudio && creativeStudioEnabled),
          }}
        />
        </div>
      ) : null}

      {canViewRecommendations && stewardshipData ? (
        <RecommendJourney
          businessId={business.id}
          current={stewardshipData.current}
          tests={stewardshipData.tests}
          overrides={stewardshipData.overrides}
          ledger={stewardshipData.ledger}
          canCreate={canCreateRecommendation}
          canApprove={canApproveRecommendation}
          canOverride={canOverrideRecommendation}
          canViewLedger={canViewLedger}
          canCreateProposal={canCreateProposal}
          hasHealth={Boolean(canViewHealthMap && healthData)}
          hasOpportunity={Boolean(canViewOpportunities && opportunityEnabled)}
          hasCreative={Boolean(canViewCreativeStudio && creativeStudioEnabled)}
        />
      ) : null}

      {/* Package B — Contextual Opportunity / Sponsorship Bridge. Positioned right after
          Recommendations and before Creative, matching RECOMMEND -> OPPORTUNITY -> CREATE. */}
      {canViewOpportunities && opportunityEnabled ? (
        <section id="opportunity" className="scroll-mt-24 rounded-2xl border border-[#E8DFD0] bg-white p-4">
          <h2 className="font-serif text-lg font-bold text-[#1E1810]">Oportunidades / Opportunities</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            ¿Hay una oportunidad editorial / patrocinio / publicidad de Leonix que valga la pena revisar? Aprobar una nunca confirma patrocinio, nunca acepta en nombre del cliente y nunca envía contacto. / Is there a contextual Leonix editorial / sponsorship / advertising opportunity worth reviewing? Approving one never confirms sponsorship, never accepts for the client, and never sends outreach.
          </p>
          <StewardshipOpportunityFlowNav
            current="opportunity"
            hasHealth={Boolean(canViewHealthMap && healthData)}
            hasRecommend={Boolean(canViewRecommendations && stewardshipData)}
            hasCreative={Boolean(canViewCreativeStudio && creativeStudioEnabled)}
          />
          <div className="mt-3">
          <OpportunitiesPanel
            businessId={business.id}
            opportunities={opportunities.map((o) => ({
              id: o.id,
              opportunityType: o.opportunityType,
              titleEn: o.titleEn,
              titleEs: o.titleEs,
              summaryEn: o.summaryEn,
              matchReasons: o.matchReasons,
              confidence: o.confidence,
              readinessRecommended: o.readinessRecommended,
              readinessExplanationEn: o.readinessExplanationEn,
              sourceTitle: o.sourceTitle,
              sourceType: o.sourceType,
              reviewNote: o.reviewNote,
              lifecycleState: o.lifecycleState,
            }))}
            canReview={canReviewOpportunity}
            canCreateCreativeRequest={canCreateOpportunityCreativeRequest}
          />
          </div>
        </section>
      ) : null}

      {/* Program 6 — Creative Studio. Right after Opportunities, right before the client
          decision it feeds. */}
      {canViewCreativeStudio && creativeStudioEnabled ? (
        <section id="creative" className="scroll-mt-24 rounded-2xl border border-[#E8DFD0] bg-white p-4">
          <h2 className="font-serif text-lg font-bold text-[#1E1810]">Estudio Creativo / Creative Studio</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Transformar la verdad verificada del negocio en paquetes de producción creativa listos para imprimir o para Canva. Los trabajos creativos no se crean automáticamente cuando se aprueba una oportunidad. La aprobación no es publicación. / Transform verified business truth into print-ready / Canva-ready creative production packets. Creative jobs are not created automatically when an opportunity is approved. Approval is not publication.
          </p>
          <StewardshipOpportunityFlowNav
            current="creative"
            hasHealth={Boolean(canViewHealthMap && healthData)}
            hasRecommend={Boolean(canViewRecommendations && stewardshipData)}
            hasOpportunity={Boolean(canViewOpportunities && opportunityEnabled)}
          />
          <CreativeJourney
            businessId={business.id}
            jobs={creativeJobViews}
            providerAvailability={creativeProviderAvailability}
            canGenerate={canGenerateCreative}
            canCreateBrief={canCreateCreativeBrief}
            imageGenerationLive={imageGenerationLive}
          />
        </section>
      ) : null}

      {/* Proposals / Client Decision */}
      {program5Data && canViewCommitments ? (
        <section id="proposals" className="scroll-mt-24 rounded-2xl border border-[#E8DFD0] bg-white p-4">
          <div id="decide" className="scroll-mt-24" />
          <h2 className="font-serif text-lg font-bold text-[#1E1810]">Decisión del Cliente / Client Decision</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Reuniones → recomendaciones → oportunidades → creatividad → esta propuesta → decisión del cliente → entrega al dueño (si se acepta) → compromisos.
            La aceptación es un registro humano de que el cliente aceptó esta propuesta. No cobra, no firma un contrato, no publica ni confirma una oportunidad. / Meetings → recommendations → opportunities → creative → this proposal → client decision → owner handoff (if accepted) → commitments. Acceptance is a human record that the client accepted this proposal. It does not charge, sign a contract, publish, or confirm an opportunity.
          </p>
          <nav aria-label="Proposal journey" className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {program5Data ? <a href="#meetings" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#3D3428]">Meetings</a> : null}
            {canViewRecommendations && stewardshipData ? <a href="#recommend" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#3D3428]">Next Right Move</a> : null}
            {canViewOpportunities && opportunityEnabled ? <a href="#opportunity" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#3D3428]">Opportunities</a> : null}
            {canViewCreativeStudio && creativeStudioEnabled ? <a href="#creative" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#3D3428]">Creative Studio</a> : null}
            <a href="#promises" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#3D3428]">Commitments</a>
            <a href="#outreach" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#3D3428]">Outreach</a>
          </nav>
          {(() => {
            const current = program5Data.proposals.filter((p) => p.isCurrent);
            const earlier = program5Data.proposals.filter((p) => !p.isCurrent).slice(0, 5);
            const canWriteFollowUp = actorHasCapability(access.actor, "create_follow_up") && !isOwnerBootstrapActor(access.actor);
            const canRecordDecision = canRecordProposalDecision && !isOwnerBootstrapActor(access.actor);
            const recommendationPrefill = stewardshipData?.current ? {
              id: stewardshipData.current.id,
              verifiedNeedEn: stewardshipData.current.verifiedNeedEn,
              verifiedNeedEs: stewardshipData.current.verifiedNeedEs,
              recommendedIntervention: stewardshipData.current.primaryIntervention,
              ownerGoalEn: stewardshipData.current.ownerGoalAlignmentEn,
              ownerGoalEs: stewardshipData.current.ownerGoalAlignmentEs,
              freeOptionEn: stewardshipData.current.freeOptionEn,
              freeOptionEs: stewardshipData.current.freeOptionEs,
              successMetricEn: stewardshipData.current.successMetricEn,
              successMetricEs: stewardshipData.current.successMetricEs,
              reviewDate: stewardshipData.current.reviewDate,
            } : null;
            return (
              <div className="mt-3 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Current proposal</p>
                {current.length === 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-[#7A7164]">No proposal has been created yet.</p>
                    <CreateProposalForm
                      businessId={business.id}
                      canCreate={canCreateProposal}
                      hasCurrentProposal={false}
                      currentProposal={null}
                      recommendation={recommendationPrefill}
                    />
                  </div>
                ) : current.map((p) => (
                  <ProposalDetailPanel
                    key={p.id}
                    businessId={business.id}
                    proposal={p}
                    canReview={canReviewProposal}
                    canRecord={canRecordProposalDecision}
                    canRecordDecision={canRecordDecision}
                    canWriteFollowUp={canWriteFollowUp}
                    hasCurrentFollowUp={Boolean(currentFollowUp)}
                  />
                ))}
                {current.length > 0 && canCreateProposal ? (
                  <CreateProposalForm
                    businessId={business.id}
                    canCreate={canCreateProposal}
                    hasCurrentProposal
                    currentProposal={current[0] ?? null}
                    recommendation={recommendationPrefill}
                  />
                ) : null}
                {earlier.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Earlier proposals</p>
                    {earlier.map((p) => (
                      <ProposalDetailPanel
                        key={p.id}
                        businessId={business.id}
                        proposal={p}
                        canReview={false}
                        canRecord={false}
                        canRecordDecision={false}
                        canWriteFollowUp={false}
                        hasCurrentFollowUp={Boolean(currentFollowUp)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })()}
        </section>
      ) : null}

      {/* Owner Handoff — commercial/operational escalation after client acceptance. Only renders
          when a real accepted current proposal exists. Composed entirely from already-loaded page
          data (proposals, creative jobs, commitments) — no new queries, no new domain. Distinct
          from the Ownership Claim account-access mechanism further down the page (id="ownership-claim"). */}
      {program5Data && canViewCommitments ? (() => {
        const acceptedProposal = program5Data.proposals.find((p) => p.isCurrent && p.status === "accepted") ?? null;
        if (!acceptedProposal) return null;
        const openCommitments = program5Data.commitmentsWithEvents.filter(
          ({ commitment }) => commitment.status !== "completed" && commitment.status !== "released",
        );
        const latestCreativeWorkspace = creativeJobViews[0] ?? null;
        const latestCreativeJob = latestCreativeWorkspace?.job ?? null;
        const outstandingCreativeItems = latestCreativeWorkspace?.brief?.missingAssetDescriptions ?? [];
        return (
          <section id="owner-handoff" className="scroll-mt-24 rounded-2xl border border-[#C9A84A]/50 bg-[#FBF7EF] p-4">
            <h2 className="font-serif text-lg font-bold text-[#1E1810]">Entrega al Dueño / Owner Handoff</h2>
            <p className="mt-1 text-xs text-[#7A7164]">
              El cliente aceptó la dirección comercial a continuación. Esto resume lo que Chuy necesita hacer a continuación. No reemplaza el contrato, el pago ni la publicación — esos siguen siendo pasos separados fuera de Business Concierge. / The client accepted the commercial direction below. This summarizes what Chuy needs next. It does not replace contract, payment, or publication — those remain separate steps outside Business Concierge.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-[#E8DFD0] bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Propuesta aceptada / Accepted proposal</p>
                <p className="mt-1 text-xs font-semibold text-[#1E1810]">{acceptedProposal.recommendedIntervention.replace(/_/g, " ")}</p>
                <p className="mt-1 break-words text-xs text-[#3D3428]">{acceptedProposal.verifiedNeedEn}</p>
                <p className="mt-1 text-[10px] text-[#7A7164]">
                  Aceptada / Accepted {acceptedProposal.acceptedAt ? new Date(acceptedProposal.acceptedAt).toLocaleString() : "—"}
                  {acceptedProposal.acceptedByEmail ? ` by ${acceptedProposal.acceptedByEmail}` : ""}.
                </p>
              </div>
              <div className="rounded-lg border border-[#E8DFD0] bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Estado creativo / Creative status</p>
                {latestCreativeJob ? (
                  <p className="mt-1 text-xs text-[#3D3428]">{latestCreativeJob.assetType.replace(/_/g, " ")} — {latestCreativeJob.status.replace(/_/g, " ")}</p>
                ) : (
                  <p className="mt-1 text-xs text-[#7A7164]">No se ha creado ninguna solicitud creativa aún. / No creative request has been created yet.</p>
                )}
                {outstandingCreativeItems.length > 0 ? (
                  <p className="mt-1 text-[11px] text-amber-900">
                    Pendiente / Outstanding: {outstandingCreativeItems.join("; ")}
                  </p>
                ) : null}
                <a href="#creative" className="mt-1 inline-flex min-h-[36px] items-center text-[11px] font-semibold text-[#7A1E2C] underline">Abrir Estudio Creativo / Open Creative Studio</a>
              </div>
              <div className="rounded-lg border border-[#E8DFD0] bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Compromisos abiertos / Open commitments</p>
                {openCommitments.length === 0 ? (
                  <p className="mt-1 text-xs text-[#7A7164]">No hay compromisos abiertos para este negocio. / No open commitments for this business.</p>
                ) : (
                  <ul className="mt-1 space-y-0.5">
                    {openCommitments.slice(0, 3).map(({ commitment }) => (
                      <li key={commitment.id} className="text-xs text-[#3D3428]">
                        {commitment.titleEn}
                        {commitment.dueAt ? ` — ${new Date(commitment.dueAt).toLocaleDateString()}` : ""}
                      </li>
                    ))}
                    {openCommitments.length > 3 ? (
                      <li className="text-[10px] text-[#7A7164]">+{openCommitments.length - 3} más / more</li>
                    ) : null}
                  </ul>
                )}
                <a href="#promises" className="mt-1 inline-flex min-h-[36px] items-center text-[11px] font-semibold text-[#7A1E2C] underline">Revisar Compromisos / Review Commitments</a>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900">No registrado en Business Concierge / Not tracked in Business Concierge</p>
                <p className="mt-1 text-xs text-amber-900">
                  La firma del contrato, el pago y el estado de publicación no se registran en este sistema. Confírmelos directamente antes de considerar esta relación como ejecutada. / Contract signature, payment, and publication status are not recorded in this system. Confirm those directly before treating this relationship as executed.
                </p>
              </div>
            </div>
            {business.creationSource === "staff_assisted" ? (
              <a href="#ownership-claim" className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-white px-4 py-2 text-xs font-semibold text-[#1E1810]">
                Acceso a la cuenta del dueño (Reclamo de Propiedad) / Owner account access (Ownership Claim)
              </a>
            ) : null}
          </section>
        );
      })() : null}

      {/* Promise Keeper */}
      {program5Data && canViewCommitments ? (
        <section id="promises" className="scroll-mt-24 rounded-2xl border border-[#E8DFD0] bg-white p-4">
          <h2 className="font-serif text-lg font-bold text-[#1E1810]">Compromisos / Commitments</h2>
          <p className="mt-1 text-xs text-[#7A7164]">Lo que Leonix y los actores relevantes prometieron hacer. Los compromisos no son seguimientos de ventas. / What Leonix and relevant actors promised to do. Commitments are not sales follow-ups.</p>
          {canManageCommitments ? <CreateCommitmentForm businessId={business.id} /> : null}
          <div className="mt-3 space-y-4">
            {program5Data.commitmentsWithEvents.length === 0 ? (
              <p className="text-sm text-[#7A7164]">No open commitments for this business.</p>
            ) : (() => {
              const nowMs = Date.now();
              const buckets: Record<CommitmentPriorityBucket, typeof program5Data.commitmentsWithEvents> = {
                overdue: [], blocked: [], due_soon: [], open: [], history: [],
              };
              for (const row of program5Data.commitmentsWithEvents) {
                buckets[commitmentPriorityBucket(row.commitment, nowMs)].push(row);
              }
              return COMMITMENT_PRIORITY_ORDER.map((bucket) => (
                buckets[bucket].length === 0 ? null : (
                  <div key={bucket} className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">
                      {COMMITMENT_PRIORITY_LABEL[bucket]} ({buckets[bucket].length})
                    </p>
                    {buckets[bucket].map(({ commitment, events }) => (
                      <CommitmentDetailPanel
                        key={commitment.id}
                        businessId={business.id}
                        commitment={commitment}
                        events={events}
                      />
                    ))}
                  </div>
                )
              ));
            })()}
          </div>
        </section>
      ) : null}

      <section id="outcomes" className="scroll-mt-24 rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="font-serif text-lg font-bold text-[#1E1810]">Resultados / Outcomes</h2>
        {outcomesUnavailable ? (
          <p className="mt-2 text-xs text-[#7A7164]">No se pudieron cargar los resultados. No se inventó ningún resultado registrado. / Outcomes could not be loaded. No recorded result was invented.</p>
        ) : outcomesEnabled ? (
          <>
            <p className="mt-1 text-xs text-[#7A7164]">Medición veraz con resultado/confianza/causalidad acotados. Nunca garantizado ni probado. / Truthful measurement with bounded result/confidence/causation. Never guaranteed or proven.</p>
            <OutcomesPanel outcomes={program7Outcomes.map((o) => ({ id: o.id, metricKey: o.metricKey, metricLabelEs: o.metricLabelEs, metricLabelEn: o.metricLabelEn, baselineValue: o.baselineValue, measuredValue: o.measuredValue, result: o.result, confidence: o.confidence, causationClaim: o.causationClaim, reviewStatus: o.reviewStatus, createdAt: o.createdAt }))} />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <p className="text-xs text-[#7A7164] sm:mr-2 sm:self-center">Cerrar el ciclo — ¿qué debería hacer Leonix a continuación para este negocio? / Close the loop — what should Leonix do next for this business?</p>
              {canViewRecommendations && stewardshipData ? (
                <a href="#recommend" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-4 py-2 text-xs font-semibold text-[#1E1810]">
                  Revisar Próximo Paso / Review Next Right Move
                </a>
              ) : null}
              <a href="#advisor" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-4 py-2 text-xs font-semibold text-[#3D3428]">
                Asesor Proactivo / Proactive Advisor
              </a>
            </div>
          </>
        ) : (
          <p className="mt-2 text-xs text-[#7A7164]">Este módulo no está habilitado en este entorno. / This module is not enabled in this environment.</p>
        )}
      </section>

      <section id="advisor" className="scroll-mt-24 rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="font-serif text-lg font-bold text-[#1E1810]">Asesor Proactivo / Proactive Advisor</h2>
        {advisorUnavailable ? (
          <p className="mt-2 text-xs text-[#7A7164]">No se pudieron cargar las señales del asesor. El panel sigue disponible. / Advisor signals could not be loaded. The dashboard remains available.</p>
        ) : advisorEnabled ? (
          <>
            <p className="mt-1 text-xs text-[#7A7164]">Señales deterministas a partir de la verdad existente. No es un segundo motor de recomendación. Nunca actúa ni envía automáticamente. / Deterministic signals from existing truth. Not a second recommendation engine. Never auto-acts or auto-sends.</p>
            <AdvisorPanel
              businessId={business.id}
              signals={program7Signals.map((s) => ({ id: s.id, signalType: s.signalType, severity: s.severity, status: s.status, titleEn: s.titleEn, titleEs: s.titleEs, explanationEn: s.explanationEn, explanationEs: s.explanationEs, detectedAt: s.detectedAt }))}
            />
          </>
        ) : (
          <p className="mt-2 text-xs text-[#7A7164]">Este módulo no está habilitado en este entorno. / This module is not enabled in this environment.</p>
        )}
      </section>

      <section id="assistant" className="scroll-mt-24 rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="font-serif text-lg font-bold text-[#1E1810]">Asistente de Business Concierge / Business Concierge Assistant</h2>
        {assistantUnavailable ? (
          <p className="mt-2 text-xs text-[#7A7164]">No se pudo cargar el asistente. No se muestra ningún hilo o respuesta falsos. / Assistant could not be loaded. No fake thread or answer is shown.</p>
        ) : assistantEnabled ? (
          <>
            <p className="mt-1 text-xs text-[#7A7164]">Limitado al contexto de este negocio. La IA puede LEER, EXPLICAR, RESUMIR, GUIAR, REDACTAR, SUGERIR — nunca mutar el estado de forma autónoma. / Bounded to this business context. AI may READ, EXPLAIN, SUMMARIZE, GUIDE, DRAFT, SUGGEST — never autonomously mutate state.</p>
            <AssistantPanel
              businessId={business.id}
              threads={program7Threads.map((t) => ({ id: t.id, status: t.status, titleEn: t.titleEn, titleEs: t.titleEs, primaryContextType: t.primaryContextType, lastMessageAt: t.lastMessageAt, createdAt: t.createdAt }))}
            />
          </>
        ) : (
          <p className="mt-2 text-xs text-[#7A7164]">Este módulo no está habilitado en este entorno. / This module is not enabled in this environment.</p>
        )}
      </section>

      {/* Ownership Claim — technical/business account-authorship mechanism (staff-prospect -> real
          owner account claim). Distinct from the commercial "Owner Handoff" section above
          (id="owner-handoff"): this is account access, not a post-acceptance escalation summary,
          and does not require an accepted proposal. Intentionally separated from the normal working
          journey above — last on the page, muted styling, not a primary nav tab. */}
      {business.creationSource === "staff_assisted" ? (
        <section id="ownership-claim" className="scroll-mt-24 rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2] p-4">
          <h2 className="font-serif text-base font-bold text-[#5C5346]">Reclamo de Propiedad — Acceso a la Cuenta del Dueño / Ownership Claim — Owner Account Access</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Entrega técnica de la cuenta — invita al verdadero dueño del negocio a reclamar esta cuenta existente. Separado del resumen comercial de Entrega al Dueño arriba; no está ligado a la aceptación de una propuesta. / Technical account handoff — invites the real business owner to claim this existing account. Separate from the commercial Owner Handoff summary above; not tied to proposal acceptance.
          </p>
          <OwnershipClaimPanel businessId={business.id} canGenerate={canGenerateOwnershipClaim} />
        </section>
      ) : null}
    </div>
  );
}
