import { CreateRecommendationButton, OverrideForm, RecommendationTransitionButtons } from "./StewardshipActions";
import type {
  BusinessRecommendation,
  BusinessRecommendationOverride,
  BusinessRecommendationTest,
  PrimaryIntervention,
  SixTestKey,
  StewardshipLedgerEntry,
} from "@/app/lib/business/stewardship/types";

const LADDER: { key: PrimaryIntervention; label: string }[] = [
  { key: "free_owner_action", label: "Free owner action" },
  { key: "education_guided_self_service", label: "Education / guided self-service" },
  { key: "small_corrective_service", label: "Small corrective service" },
  { key: "leonix_product_or_advertising", label: "Leonix product / advertising" },
  { key: "ongoing_managed_support", label: "Managed support" },
  { key: "external_specialist_referral", label: "External referral" },
  { key: "no_action_yet", label: "No action" },
];

const SIX_TEST_LABELS: Record<SixTestKey, string> = {
  need: "Need",
  readiness: "Readiness",
  capacity: "Capacity",
  life_alignment: "Life alignment",
  value: "Value",
  lion_code: "Lion Code",
};

function testResultClass(result: string): string {
  if (result === "pass") return "bg-emerald-100 text-emerald-800";
  if (result === "caution") return "bg-amber-100 text-amber-800";
  if (result === "blocked") return "bg-red-100 text-red-800";
  return "bg-red-100 text-red-800";
}

export function StewardshipOpportunityFlowNav({
  current,
  hasHealth = true,
  hasRecommend = true,
  hasOpportunity = true,
  hasCreative = true,
}: {
  current: "health" | "recommend" | "opportunity" | "creative";
  hasHealth?: boolean;
  hasRecommend?: boolean;
  hasOpportunity?: boolean;
  hasCreative?: boolean;
}) {
  const steps = [
    hasHealth ? { id: "health" as const, href: "#health", label: "Business Health" } : null,
    hasRecommend ? { id: "recommend" as const, href: "#recommend", label: "Next Right Move" } : null,
    hasOpportunity ? { id: "opportunity" as const, href: "#opportunity", label: "Opportunities" } : null,
    hasCreative ? { id: "creative" as const, href: "#creative", label: "Creative Studio" } : null,
  ].filter((step): step is { id: "health" | "recommend" | "opportunity" | "creative"; href: string; label: string } => step !== null);

  if (steps.length === 0) return null;

  return (
    <nav aria-label="Recommendation and opportunity flow" className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {steps.map((step) => (
        <a
          key={step.id}
          href={step.href}
          className={
            current === step.id
              ? "inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-3 py-2 text-xs font-semibold text-white"
              : "inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-3 py-2 text-xs font-semibold text-[#1E1810]"
          }
        >
          {step.label}
        </a>
      ))}
    </nav>
  );
}

function optionFor(current: BusinessRecommendation, key: PrimaryIntervention): string | null {
  switch (key) {
    case "free_owner_action":
      return current.freeOptionEn;
    case "education_guided_self_service":
      return current.guidedOptionEn;
    case "small_corrective_service":
      return current.correctiveServiceOptionEn;
    case "ongoing_managed_support":
      return current.managedOptionEn;
    case "external_specialist_referral":
      return current.externalReferralOptionEn;
    case "no_action_yet":
      return current.doNothingYetOptionEn;
    default:
      return null;
  }
}

export function RecommendJourney({
  businessId,
  current,
  tests,
  overrides,
  ledger,
  canCreate,
  canApprove,
  canOverride,
  canViewLedger,
  hasHealth,
  hasOpportunity,
  hasCreative,
}: {
  businessId: string;
  current: BusinessRecommendation | null;
  tests: BusinessRecommendationTest[];
  overrides: BusinessRecommendationOverride[];
  ledger: StewardshipLedgerEntry[];
  canCreate: boolean;
  canApprove: boolean;
  canOverride: boolean;
  canViewLedger: boolean;
  hasHealth: boolean;
  hasOpportunity: boolean;
  hasCreative: boolean;
}) {
  return (
    <section id="recommend" className="scroll-mt-24 rounded-2xl border border-[#E8DFD0] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Recommendations</p>
          <h2 className="mt-1 font-serif text-lg font-bold text-[#1E1810]">Next Right Move</h2>
        </div>
        {canCreate ? <CreateRecommendationButton businessId={businessId} /> : null}
      </div>
      <p className="mt-1 text-xs text-[#7A7164]">
        What should this business do next? Stewardship is advisory. It is not an Opportunity, not a sale, and not an AI advisor.
      </p>
      <StewardshipOpportunityFlowNav
        current="recommend"
        hasHealth={hasHealth}
        hasOpportunity={hasOpportunity}
        hasCreative={hasCreative}
      />

      {!current ? (
        <p className="mt-3 text-sm text-[#7A7164]">No active recommendation.</p>
      ) : (
        <div className="mt-3 space-y-3 rounded-lg border border-[#C9A84A]/40 bg-[#FFFDF7] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-[#1E1810]">{current.candidateKey}</span>
            <span className="rounded-full bg-[#EDE6D6] px-2 py-0.5 text-[10px] font-bold text-[#3D3428]">
              {current.status} · v{current.version}
            </span>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Why this recommendation exists</p>
            <p className="mt-1 text-sm text-[#3D3428]">{current.verifiedNeedEn}</p>
            <p className="mt-1 text-xs text-[#7A7164]">{current.selectionReasonEn}</p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">What action is recommended</p>
            <p className="mt-1 text-sm font-semibold text-[#1E1810]">
              {LADDER.find((step) => step.key === current.primaryIntervention)?.label ?? current.primaryIntervention}
            </p>
            <p className="mt-1 text-xs text-[#7A7164]">
              Effort: {current.expectedEffort} · cost band: {current.costBand} (existing band, not a pricing engine)
            </p>
            <p className="mt-1 text-xs text-[#3D3428]">{current.successMetricEn}</p>
            <p className="mt-1 text-[10px] text-[#7A7164]">
              Stored confidence (not a score): {current.confidence}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Recommendation ladder</p>
            <p className="mt-1 text-[10px] text-[#7A7164]">Existing stewardship ladder. Leonix sale is not forced. External referral and no action remain valid.</p>
            <ol className="mt-2 space-y-1">
              {LADDER.map((step) => {
                const selected = step.key === current.primaryIntervention;
                const option = optionFor(current, step.key);
                return (
                  <li
                    key={step.key}
                    className={
                      selected
                        ? "rounded-lg border border-[#C9A84A] bg-white px-3 py-2 text-xs font-semibold text-[#1E1810]"
                        : "rounded-lg border border-[#E8DFD0] bg-[#FAF6EE] px-3 py-2 text-xs text-[#7A7164]"
                    }
                  >
                    {step.label}
                    {selected && option ? <span className="mt-1 block font-normal text-[#3D3428]">{option}</span> : null}
                  </li>
                );
              })}
            </ol>
          </div>

          {current.rejectedHigherCostReasonEn ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900">Cautions</p>
              <p className="mt-1 text-xs text-amber-900">{current.rejectedHigherCostReasonEn}</p>
            </div>
          ) : null}

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Six tests</p>
            <p className="mt-1 text-[10px] text-[#7A7164]">Stored results only. This page does not infer pass or fail.</p>
            <ul className="mt-2 space-y-2">
              {tests.map((test) => (
                <li key={test.id} className="rounded-lg border border-[#E8DFD0] bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#1E1810]">{SIX_TEST_LABELS[test.testKey] ?? test.testKey}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${testResultClass(test.result)}`}>{test.result}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#3D3428]">{test.explanationEn}</p>
                  <p className="mt-1 text-[10px] text-[#7A7164]">Stored confidence (not a score): {test.confidence}</p>
                </li>
              ))}
              {tests.length === 0 ? <li className="text-xs text-[#7A7164]">No six-test results are stored for this recommendation.</li> : null}
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-[#E8DFD0] bg-white p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Evidence / readiness</p>
              <p className="mt-1 text-xs text-[#3D3428]">{current.readinessExplanationEn}</p>
              <p className="mt-1 text-xs text-[#7A7164]">{current.businessConsequenceEn}</p>
            </div>
            <div className="rounded-lg border border-[#E8DFD0] bg-white p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Alignment / capacity</p>
              <p className="mt-1 text-xs text-[#3D3428]">{current.ownerGoalAlignmentEn}</p>
              <p className="mt-1 text-xs text-[#7A7164]">{current.capacityImpactEn}</p>
            </div>
          </div>

          <div className="rounded-lg border border-[#E8DFD0] bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Who must approve</p>
            {canApprove ? (
              <p className="mt-1 text-xs text-[#3D3428]">Your role may approve or share this recommendation using the existing stewardship actions.</p>
            ) : (
              <p className="mt-1 text-xs text-[#3D3428]">
                You can view this Next Right Move. Approval, sharing, and override remain manager / super-admin actions.
              </p>
            )}
          </div>

          <RecommendationTransitionButtons
            businessId={businessId}
            recommendationId={current.id}
            status={current.status}
            canCreate={canCreate}
            canApprove={canApprove}
          />

          {canOverride && current.status !== "draft" ? (
            <OverrideForm businessId={businessId} recommendationId={current.id} />
          ) : null}

          {overrides.length > 0 ? (
            <>
              <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Override history</h3>
              <ul className="space-y-1">
                {overrides.map((entry) => (
                  <li key={entry.id} className="text-xs text-[#3D3428]">
                    {new Date(entry.createdAt).toLocaleString()} — {entry.actorEmail}: {entry.reason} ({entry.changedFields.join(", ")})
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      )}

      {canViewLedger ? (
        <>
          <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Stewardship Ledger</h3>
          <ul className="mt-2 space-y-1">
            {ledger.slice(0, 20).map((entry) => (
              <li key={entry.id} className="text-xs text-[#3D3428]">
                {new Date(entry.createdAt).toLocaleString()} — <span className="font-semibold">{entry.eventType}</span>
                {entry.reasonEn ? `: ${entry.reasonEn}` : ""}
              </li>
            ))}
            {ledger.length === 0 ? <li className="text-sm text-[#7A7164]">No ledger entries yet.</li> : null}
          </ul>
        </>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {hasOpportunity ? (
          <a href="#opportunity" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-4 py-2 text-xs font-semibold text-[#1E1810]">
            Review Opportunities
          </a>
        ) : null}
        {hasCreative ? (
          <a href="#creative" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-4 py-2 text-xs font-semibold text-[#3D3428]">
            Creative Studio
          </a>
        ) : null}
      </div>
    </section>
  );
}
