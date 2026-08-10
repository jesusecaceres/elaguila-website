import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { actorHasCapability, requireSalesWorkspaceAccess, type SalesWorkspaceDenialReason } from "../../../_lib/businessWorkspaceAccess";
import { getBusinessWorkspaceDetail } from "../../../_lib/businessWorkspaceData";
import { computeNextHelpfulAction, computeProfileCompleteness, type ProfileCompletenessInput } from "../../../_lib/salesWorkspaceLogic";
import { BROAD_BUSINESS_TYPES, BUSINESS_STAGES, CONTACT_LABELS, DIGITAL_PROFILE_PLATFORMS, OPERATING_MODELS, SALES_CHANNELS, SALES_RELATIONSHIPS } from "@/app/lib/business/constants";
import { countryLabel } from "@/app/lib/business/countries";
import { formatUsPhoneForDisplay } from "@/app/(site)/dashboard/business-tools/onboarding/_steps/Step6ContactsProfiles";
import { physicalAddressSummary, summarizeServiceCoverage } from "@/app/(site)/dashboard/business-tools/onboarding/wizardTypes";
import { businessIdentityCopy } from "@/app/(site)/dashboard/business-tools/_components/businessIdentityCopy";
import { FollowUpPanel, NotesPanel, StatusQuickActions } from "./BusinessWorkspaceActions";
import { CreateFactForm, CreateUnknownForm, DiscoveryPanel, FactDecisionButtons, ResolveUnknownForm } from "./LivingBusinessBookActions";
import { shapeFactsForStaffActor } from "../../../_lib/livingBookVisibility";
import {
  listContradictionsForBusiness, listDiscoverySessionsForBusiness, listFactsForBusiness, listUnknownsForBusiness,
} from "@/app/lib/business/livingBook/repository";
import { computeBookCompleteness } from "@/app/lib/business/livingBook/logic";
import { MarkHumanReviewForm, RunAssessmentButton } from "./HealthMapActions";
import { getFullRun, getLatestCompletedRun, listRunsForBusiness } from "@/app/lib/business/healthMap/repository";
import { HEALTH_DIMENSION_KEYS } from "@/app/lib/business/healthMap/constants";
import { CreateRecommendationButton, OverrideForm, RecommendationTransitionButtons } from "./StewardshipActions";
import { listLedgerForBusiness, listOverridesForRecommendation, listRecommendationsForBusiness, listTestsForRecommendation } from "@/app/lib/business/stewardship/repository";
import { BriefingReviewPanel, ConsentStatusPanel, RunResearchButton, SourceFilesPanel, SourceLinksPanel } from "./FieldDiscoveryActions";
import { listConsentForBusiness, listSourceFilesForBusiness, listSourceLinksForBusiness } from "@/app/lib/business/fieldDiscovery/repository";
import { getDefaultBusinessIntelligenceProvider } from "@/app/lib/business/aiResearch/providerRegistry";
import { listBriefingDraftsForBusiness, listResearchRunsForBusiness } from "@/app/lib/business/aiResearch/repository";

export const dynamic = "force-dynamic";

function labelFromList(list: readonly { value: string; es: string; en: string }[], value: string | null, lang: "en" | "es" = "en"): string {
  if (!value) return "—";
  return list.find((o) => o.value === value)?.[lang] ?? value;
}

const IDENTITY_DENIAL_REASONS: readonly SalesWorkspaceDenialReason[] = ["no_admin_cookie", "bootstrap_session_not_allowed", "no_operator_identity", "auth_user_not_found"];

export default async function AdminBusinessDetailPage({ params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    redirect(IDENTITY_DENIAL_REASONS.includes(access.reason) ? "/admin/login" : "/admin/team?access_denied=1");
  }
  if (!actorHasCapability(access.actor, "view_business_detail")) {
    redirect("/admin/team?access_denied=1");
  }

  const { businessId } = await params;
  const detail = await getBusinessWorkspaceDetail(businessId, access.actor);
  if (!detail) {
    return (
      <div className="max-w-3xl">
        <AdminPageHeader title="Business not found" eyebrow="Sales workspace" />
        <Link href="/admin/businesses" className="text-sm font-semibold text-[#7A1E2C] underline">
          ← Back to businesses
        </Link>
      </div>
    );
  }

  const { business, membership, contacts, serviceAreas, digitalProfiles, customLinks, listingLinks, salesProfile, notes, currentFollowUp } = detail;
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
        const [factsRaw, unknowns, contradictions, discoverySessions] = await Promise.all([
          listFactsForBusiness(business.id),
          listUnknownsForBusiness(business.id),
          listContradictionsForBusiness(business.id),
          listDiscoverySessionsForBusiness(business.id),
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
        return { facts, unknowns, contradictions, discoverySessions, completeness };
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
        return { sourceLinks, sourceFiles, consent, runs, latestDraft, providerAvailable };
      })()
    : null;

  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/admin/businesses" className="text-xs font-semibold text-[#7A1E2C] underline">
        ← Back to businesses
      </Link>
      <AdminPageHeader
        title={business.displayName}
        eyebrow={business.publicName && business.publicName !== business.displayName ? `Public name: ${business.publicName}` : "Sales workspace"}
        subtitle={`${labelFromList(BROAD_BUSINESS_TYPES, business.broadBusinessType)} · ${labelFromList(BUSINESS_STAGES, business.businessStage)}`}
        rightSlot={<StatusQuickActions businessId={business.id} currentStatus={salesProfile.status} />}
      />

      {/* B. Contact actions — near the top, real formatted values, respects visibility. */}
      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">Contact actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {primaryPhone ? (
            <a href={`tel:${primaryPhone.normalizedValue}`} className="min-h-[40px] rounded-lg bg-[#7A1E2C] px-3 py-2 text-xs font-bold text-white">
              Call {formatUsPhoneForDisplay(primaryPhone.value)}
            </a>
          ) : null}
          {primaryPhone?.capabilities.includes("sms") ? (
            <a href={`sms:${primaryPhone.normalizedValue}`} className="min-h-[40px] rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#3D3428]">
              SMS
            </a>
          ) : null}
          {primaryPhone?.capabilities.includes("whatsapp") ? (
            <a href={`https://wa.me/${primaryPhone.normalizedValue.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="min-h-[40px] rounded-lg border border-emerald-600 px-3 py-2 text-xs font-semibold text-emerald-800">
              WhatsApp
            </a>
          ) : null}
          {primaryEmail ? (
            <a href={`mailto:${primaryEmail.value}`} className="min-h-[40px] rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#3D3428]">
              Email
            </a>
          ) : null}
          {websiteContact ? (
            <a href={websiteContact.value.startsWith("http") ? websiteContact.value : `https://${websiteContact.value}`} target="_blank" rel="noopener noreferrer" className="min-h-[40px] rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#3D3428]">
              Website
            </a>
          ) : null}
          {!canViewPrivateContacts ? (
            <p className="text-xs text-[#7A7164]">Your role does not include permission to view private contact details.</p>
          ) : !primaryPhone && !primaryEmail && !websiteContact ? (
            <p className="text-xs text-[#7A7164]">No verified contact method on file yet.</p>
          ) : null}
        </div>
      </section>

      {/* G. Possible next helpful action */}
      <section className="rounded-2xl border border-[#C9A84A]/50 bg-[#FBF7EF] p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">Possible next helpful action</h2>
        <p className="mt-1 text-base font-bold text-[#7A1E2C]">{nextAction.headline.en}</p>
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

      {/* Follow-up system */}
      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">Follow-up</h2>
        <div className="mt-3">
          <FollowUpPanel businessId={business.id} current={currentFollowUp} />
        </div>
      </section>

      {/* Notes */}
      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">Sales notes</h2>
        <p className="mt-1 text-xs text-[#7A7164]">Internal only — never shown to the business owner.</p>
        <div className="mt-3">
          <NotesPanel businessId={business.id} notes={notes} />
        </div>
      </section>

      {/* Living Business Book (Gate BCO-5A) — capability-gated; entirely absent from the page when the actor lacks view_business_book, not just visually hidden. */}
      {canViewBook && bookData ? (
        <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
          <h2 className="text-sm font-bold text-[#1E1810]">Living Business Book</h2>
          <p className="mt-1 text-xs text-[#7A7164]">What Leonix knows, what&apos;s confirmed, what&apos;s unknown, and what&apos;s changed over time.</p>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-[#E8DFD0] p-2 text-center">
              <p className="text-lg font-bold text-[#1E1810]">{bookData.completeness.confirmedFactCount}</p>
              <p className="text-[10px] text-[#7A7164]">Confirmed facts</p>
            </div>
            <div className="rounded-lg border border-[#E8DFD0] p-2 text-center">
              <p className="text-lg font-bold text-[#1E1810]">{bookData.completeness.ownerStatementCount}</p>
              <p className="text-[10px] text-[#7A7164]">Owner statements</p>
            </div>
            <div className="rounded-lg border border-[#E8DFD0] p-2 text-center">
              <p className="text-lg font-bold text-amber-800">{bookData.completeness.openUnknownCount}</p>
              <p className="text-[10px] text-[#7A7164]">Open unknowns</p>
            </div>
            <div className="rounded-lg border border-[#E8DFD0] p-2 text-center">
              <p className="text-lg font-bold text-red-700">{bookData.completeness.unresolvedContradictionCount}</p>
              <p className="text-[10px] text-[#7A7164]">Unresolved contradictions</p>
            </div>
          </div>

          <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Facts</h3>
          <ul className="mt-2 space-y-2">
            {bookData.facts.map((f) => (
              <li key={f.id} className="rounded-lg border border-[#E8DFD0] p-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#1E1810]">{f.factKey}</span>
                  <span className="rounded-full bg-[#EDE6D6] px-2 py-0.5 text-[10px] font-bold text-[#3D3428]">{f.sourceClass}</span>
                </div>
                <p className="mt-1 text-sm text-[#3D3428]">{f.displayValue ?? "—"}</p>
                <p className="mt-1 text-[10px] text-[#9A9184]">
                  {f.confirmationState} · confidence: {f.confidence} · {f.sensitivity}
                </p>
                {canConfirmFact && f.confirmationState !== "owner_confirmed" ? <FactDecisionButtons businessId={business.id} factId={f.id} /> : null}
              </li>
            ))}
            {bookData.facts.length === 0 ? <li className="text-sm text-[#7A7164]">No facts recorded yet.</li> : null}
          </ul>
          <div className="mt-3">
            <CreateFactForm businessId={business.id} canConfirm={canConfirmFact} />
          </div>

          <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Unknowns</h3>
          <ul className="mt-2 space-y-2">
            {bookData.unknowns.map((u) => (
              <li key={u.id} className="rounded-lg border border-[#E8DFD0] p-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-[#1E1810]">{u.questionLabel}</span>
                  <span className="rounded-full bg-[#FFF4E0] px-2 py-0.5 text-[10px] font-bold text-[#5C4E2E]">{u.status}</span>
                </div>
                {u.status === "open" && canManageUnknowns ? <ResolveUnknownForm businessId={business.id} unknown={u} /> : null}
                {u.status === "answered" ? <p className="mt-1 text-xs text-[#7A7164]">Resolution: {u.resolution}</p> : null}
              </li>
            ))}
            {bookData.unknowns.length === 0 ? <li className="text-sm text-[#7A7164]">No open unknowns.</li> : null}
          </ul>
          {canManageUnknowns ? (
            <div className="mt-3">
              <CreateUnknownForm businessId={business.id} />
            </div>
          ) : null}

          <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Contradictions</h3>
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
              <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Discovery</h3>
              <div className="mt-2">
                <DiscoveryPanel businessId={business.id} session={bookData.discoverySessions.find((s) => s.status === "in_progress") ?? null} />
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {/* Business Health Map (Gate BCO-6A) — capability-gated; entirely absent from the page when the actor lacks view_business_health_map. */}
      {canViewHealthMap && healthData ? (
        <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#1E1810]">Business Health Map</h2>
            {canRunHealthAssessment ? <RunAssessmentButton businessId={business.id} /> : null}
          </div>
          <p className="mt-1 text-xs text-[#7A7164]">
            A deterministic, explainable read of seven business dimensions — never an AI advisor, never a numeric score.
          </p>

          {!healthData.latestRun ? (
            <p className="mt-3 text-sm text-[#7A7164]">No assessment has been run yet.</p>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <div className="rounded-lg border border-[#E8DFD0] p-2 text-center">
                  <p className="text-lg font-bold text-emerald-700">{healthData.latestRun.strongCount}</p>
                  <p className="text-[10px] text-[#7A7164]">Strong</p>
                </div>
                <div className="rounded-lg border border-[#E8DFD0] p-2 text-center">
                  <p className="text-lg font-bold text-[#1E1810]">{healthData.latestRun.stableCount}</p>
                  <p className="text-[10px] text-[#7A7164]">Stable</p>
                </div>
                <div className="rounded-lg border border-[#E8DFD0] p-2 text-center">
                  <p className="text-lg font-bold text-amber-800">{healthData.latestRun.needsAttentionCount}</p>
                  <p className="text-[10px] text-[#7A7164]">Needs attention</p>
                </div>
                <div className="rounded-lg border border-[#E8DFD0] p-2 text-center">
                  <p className="text-lg font-bold text-[#7A7164]">{healthData.latestRun.insufficientInformationCount}</p>
                  <p className="text-[10px] text-[#7A7164]">Insufficient info</p>
                </div>
                <div className="rounded-lg border border-[#E8DFD0] p-2 text-center">
                  <p className="text-lg font-bold text-red-700">{healthData.latestRun.contradictionBlockedCount}</p>
                  <p className="text-[10px] text-[#7A7164]">Blocked</p>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-[#9A9184]">
                Calculation version {healthData.latestRun.calculationVersion} · last calculated {healthData.latestRun.completedAt ? new Date(healthData.latestRun.completedAt).toLocaleString("en-US") : "—"}
              </p>

              <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Dimensions</h3>
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

      {/* Next Right Move / Stewardship Engine (Gate BCO-TODAY-3) — capability-gated. */}
      {canViewRecommendations && stewardshipData ? (
        <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#1E1810]">Next Right Move / Stewardship</h2>
            {canCreateRecommendation ? <CreateRecommendationButton businessId={business.id} /> : null}
          </div>
          <p className="mt-1 text-xs text-[#7A7164]">
            &quot;What is the smallest truthful intervention that can produce meaningful progress?&quot; — never an AI advisor, never sold before it protects.
          </p>

          {!stewardshipData.current ? (
            <p className="mt-3 text-sm text-[#7A7164]">No current Next Right Move for this business.</p>
          ) : (
            <>
              <div className="mt-3 rounded-lg border border-[#E8DFD0] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#1E1810]">{stewardshipData.current.candidateKey}</span>
                  <span className="rounded-full bg-[#EDE6D6] px-2 py-0.5 text-[10px] font-bold text-[#3D3428]">{stewardshipData.current.status} · v{stewardshipData.current.version}</span>
                </div>
                <p className="mt-1 text-sm text-[#3D3428]">{stewardshipData.current.verifiedNeedEn}</p>
                <p className="mt-1 text-xs text-[#7A7164]">Primary intervention: {stewardshipData.current.primaryIntervention} · effort: {stewardshipData.current.expectedEffort} · cost: {stewardshipData.current.costBand}</p>
                {stewardshipData.current.rejectedHigherCostReasonEn ? (
                  <p className="mt-1 text-xs text-[#7A7164]">Why not a higher-cost option: {stewardshipData.current.rejectedHigherCostReasonEn}</p>
                ) : null}

                <h3 className="mt-3 text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Six tests</h3>
                <ul className="mt-1 space-y-1">
                  {stewardshipData.tests.map((test) => (
                    <li key={test.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#3D3428]">{test.testKey}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${test.result === "pass" ? "bg-emerald-100 text-emerald-800" : test.result === "caution" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                        {test.result}
                      </span>
                      <span className="flex-1 text-[#7A7164]">{test.explanationEn}</span>
                    </li>
                  ))}
                </ul>

                <RecommendationTransitionButtons
                  businessId={business.id}
                  recommendationId={stewardshipData.current.id}
                  status={stewardshipData.current.status}
                  canCreate={canCreateRecommendation}
                  canApprove={canApproveRecommendation}
                />

                {canOverrideRecommendation && stewardshipData.current.status !== "draft" ? (
                  <OverrideForm businessId={business.id} recommendationId={stewardshipData.current.id} />
                ) : null}

                {stewardshipData.overrides.length > 0 ? (
                  <>
                    <h3 className="mt-3 text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Override history</h3>
                    <ul className="mt-1 space-y-1">
                      {stewardshipData.overrides.map((o) => (
                        <li key={o.id} className="text-xs text-[#3D3428]">
                          {new Date(o.createdAt).toLocaleString()} — {o.actorEmail}: {o.reason} ({o.changedFields.join(", ")})
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            </>
          )}

          {canViewLedger ? (
            <>
              <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Stewardship Ledger</h3>
              <ul className="mt-2 space-y-1">
                {stewardshipData.ledger.slice(0, 20).map((entry) => (
                  <li key={entry.id} className="text-xs text-[#3D3428]">
                    {new Date(entry.createdAt).toLocaleString()} — <span className="font-semibold">{entry.eventType}</span>{entry.reasonEn ? `: ${entry.reasonEn}` : ""}
                  </li>
                ))}
                {stewardshipData.ledger.length === 0 ? <li className="text-sm text-[#7A7164]">No ledger entries yet.</li> : null}
              </ul>
            </>
          ) : null}
        </section>
      ) : null}

      {/* Program 4 — Field Discovery + AI Research Engine */}
      {fieldDiscoveryData ? (
        <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
          <h2 className="text-sm font-bold text-[#1E1810]">Field Discovery</h2>
          <div className="mt-3 space-y-3">
            <ConsentStatusPanel consent={fieldDiscoveryData.consent} />
            <SourceLinksPanel sourceLinks={fieldDiscoveryData.sourceLinks} />
            <SourceFilesPanel sourceFiles={fieldDiscoveryData.sourceFiles} />
            <RunResearchButton
              businessId={business.id}
              canRun={canRunAiResearch}
              providerAvailable={fieldDiscoveryData.providerAvailable}
              runs={fieldDiscoveryData.runs}
            />
            <BriefingReviewPanel
              businessId={business.id}
              draft={fieldDiscoveryData.latestDraft}
              canReview={canReviewAiBriefing}
              canPromote={canPromoteAiBriefing}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
