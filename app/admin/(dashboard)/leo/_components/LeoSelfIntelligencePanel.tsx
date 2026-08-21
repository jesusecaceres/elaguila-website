/**
 * LEO-20B — Self-Intelligence executive cockpit (presentation only).
 * Consumes LeonixInternalIntelligenceProfile — does not recalculate health or ranking.
 */
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import { LEO_SELF_INTELLIGENCE_V1_DIMENSIONS } from "@/app/leo/_lib/leoSelfIntelligenceTypes";
import type {
  LeoSelfIntelligenceBlindSpot,
  LeoSelfIntelligenceDimensionResult,
  LeoSelfIntelligenceNextMove,
  LeonixInternalIntelligenceProfile,
} from "@/app/leo/_lib/leoSelfIntelligenceTypes";

import {
  presentSelfIntelligenceDimension,
  presentSelfIntelligenceFreshness,
  presentSelfIntelligenceHealthState,
  scrubOwnerFacingText,
} from "./leoOwnerPresentation";

export type LeoSelfIntelligenceLoad =
  | { ok: true; profile: LeonixInternalIntelligenceProfile }
  | { ok: false; limitation: string };

function healthTone(state: LeoSelfIntelligenceDimensionResult["state"]): string {
  switch (state) {
    case "CRITICAL":
      return "border-rose-300 bg-rose-50 text-rose-900";
    case "NEEDS_ATTENTION":
      return "border-[#C9782F]/50 bg-[#FFF4E8] text-[#7A3E10]";
    case "WATCH":
      return "border-[#1E4A7A]/30 bg-[#F0F5FA] text-[#1E4A7A]";
    case "HEALTHY":
      return "border-[#2A4536]/30 bg-[#EEF5F0] text-[#2A4536]";
    case "NOT_MEASURED":
      return "border-[color:var(--lx-border)] bg-[color:var(--lx-section)] text-[#5C5346]";
    default:
      return "border-[color:var(--lx-border)] bg-white/70 text-[#5C5346]";
  }
}

function DimensionCard({ dim }: { dim: LeoSelfIntelligenceDimensionResult }) {
  const title = presentSelfIntelligenceDimension(dim.dimension);
  const stateLabel = presentSelfIntelligenceHealthState(dim.state);
  const limitation = dim.limitations[0] ? scrubOwnerFacingText(dim.limitations[0]) : null;

  return (
    <article className="min-w-0 rounded-xl border border-[color:var(--lx-border)]/70 bg-white/80 p-3.5 sm:p-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h3 className="min-w-0 flex-1 break-words text-sm font-bold text-[#1E1810] sm:text-[15px]">
          {title}
        </h3>
        <span
          className={`inline-flex max-w-full shrink-0 rounded-md border px-2.5 py-1 text-[11px] font-bold tracking-wide ${healthTone(dim.state)}`}
        >
          {stateLabel}
        </span>
      </div>
      <p className="mt-2 break-words text-sm leading-relaxed text-[#5C5346]">
        {scrubOwnerFacingText(dim.reason)}
      </p>
      {dim.freshness !== "UNKNOWN" ? (
        <p className="mt-1.5 text-[11px] font-medium text-[#A67C52]">
          {presentSelfIntelligenceFreshness(dim.freshness)}
        </p>
      ) : null}
      {limitation ? (
        <p className="mt-1.5 break-words text-[11px] text-amber-900">Note: {limitation}</p>
      ) : null}
      <details className="mt-2">
        <summary className="cursor-pointer touch-manipulation py-1 text-[11px] font-bold uppercase tracking-wide text-[#A67C52]">
          Details
        </summary>
        <div className="mt-1.5 space-y-1.5 border-t border-[color:var(--lx-border)]/40 pt-2 text-xs leading-relaxed text-[#5C5346]">
          <p>
            <span className="font-semibold text-[#1E1810]">Confidence:</span>{" "}
            {scrubOwnerFacingText(dim.confidence.toLowerCase())}
          </p>
          <p>
            <span className="font-semibold text-[#1E1810]">Evidence basis:</span>{" "}
            {scrubOwnerFacingText(dim.epistemic.toLowerCase())}
          </p>
          {dim.evidenceRefs.length > 0 ? (
            <p className="break-words">
              <span className="font-semibold text-[#1E1810]">Evidence:</span>{" "}
              {dim.evidenceRefs.slice(0, 4).map(scrubOwnerFacingText).join(" · ")}
            </p>
          ) : (
            <p>No evidence references attached for this dimension.</p>
          )}
          {dim.limitations.length > 1
            ? dim.limitations.slice(1, 3).map((l) => (
                <p key={l} className="break-words">
                  {scrubOwnerFacingText(l)}
                </p>
              ))
            : null}
        </div>
      </details>
    </article>
  );
}

function NextRightMoveHero({ move }: { move: LeoSelfIntelligenceNextMove }) {
  return (
    <div
      className="min-w-0 rounded-2xl border border-[#7A1E2C]/25 bg-gradient-to-br from-[#FFF8F6] to-white p-4 shadow-[0_10px_28px_-16px_rgba(122,30,44,0.22)] sm:p-5"
      data-leo-si-next-move
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">Next Right Move</p>
      <h3 className="mt-1 break-words text-lg font-bold leading-snug text-[#1E1810] sm:text-xl">
        {scrubOwnerFacingText(move.title)}
      </h3>
      <p className="mt-2 break-words text-sm leading-relaxed text-[#5C5346]">
        <span className="font-semibold text-[#1E1810]">Why now: </span>
        {scrubOwnerFacingText(move.whyNow)}
      </p>
      <p className="mt-2 break-words text-sm leading-relaxed text-[#5C5346]">
        <span className="font-semibold text-[#1E1810]">Expected benefit: </span>
        {scrubOwnerFacingText(move.expectedBenefit)}
      </p>

      <dl className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="min-w-0 rounded-lg bg-white/80 px-3 py-2">
          <dt className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">Confidence</dt>
          <dd className="mt-0.5 text-sm font-semibold text-[#1E1810]">
            {scrubOwnerFacingText(move.confidence.toLowerCase())}
          </dd>
        </div>
        <div className="min-w-0 rounded-lg bg-white/80 px-3 py-2">
          <dt className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">Effort</dt>
          <dd className="mt-0.5 text-sm font-semibold text-[#1E1810]">
            {scrubOwnerFacingText(move.effort.toLowerCase())}
          </dd>
        </div>
        <div className="min-w-0 rounded-lg bg-white/80 px-3 py-2">
          <dt className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">Owner action</dt>
          <dd className="mt-0.5 text-sm font-semibold text-[#1E1810]">
            {move.ownerActionRequired ? "Required" : "Not required"}
          </dd>
        </div>
        <div className="min-w-0 rounded-lg bg-white/80 px-3 py-2">
          <dt className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">LEO can prepare</dt>
          <dd className="mt-0.5 text-sm font-semibold text-[#1E1810]">
            {move.leoCanPrepare ? "Yes" : "No"}
          </dd>
        </div>
      </dl>

      <p
        className="mt-3 rounded-lg border border-[color:var(--lx-border)]/60 bg-[color:var(--lx-section)]/90 px-3 py-2.5 text-xs leading-relaxed text-[#5C5346]"
        role="note"
      >
        {move.leoCanExecuteWithCurrentAuthority
          ? "LEO may execute with current authority."
          : "Recommendation only — requires owner approval or action. Capability is not authority."}
      </p>
    </div>
  );
}

function BlindSpotsSection({ spots }: { spots: LeoSelfIntelligenceBlindSpot[] }) {
  if (spots.length === 0) return null;

  return (
    <details className="min-w-0" open={false} data-leo-si-blind-spots>
      <summary className="cursor-pointer touch-manipulation list-none py-1 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[#1E1810]">What LEO cannot currently measure</h3>
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[#A67C52]">
            {spots.length} areas · tap to expand
          </span>
        </div>
        <p className="mt-1 text-xs text-[#5C5346]">
          Not measured is missing instrumentation — not a claim that performance is poor.
        </p>
      </summary>
      <ul className="mt-3 space-y-2">
        {spots.map((spot) => (
          <li
            key={`${spot.dimension}:${spot.subcomponent ?? "full"}`}
            className="min-w-0 rounded-xl border border-[color:var(--lx-border)]/60 bg-[color:var(--lx-section)]/80 p-3.5"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="min-w-0 flex-1 break-words text-sm font-bold text-[#1E1810]">
                {spot.subcomponent === "SEARCH_PERFORMANCE"
                  ? "SEO / Discovery — Search performance"
                  : spot.dimension === "CUSTOMER_JOURNEY" && spot.subcomponent
                    ? `Customer Journey — ${presentSelfIntelligenceDimension(spot.subcomponent)}`
                    : presentSelfIntelligenceDimension(spot.dimension)}
              </p>
              <span className="inline-flex rounded-md border border-[color:var(--lx-border)] bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5C5346]">
                {presentSelfIntelligenceHealthState(spot.state)}
              </span>
            </div>
            <p className="mt-1.5 break-words text-xs leading-relaxed text-[#5C5346]">
              {scrubOwnerFacingText(spot.reason)}
            </p>
            <p className="mt-1 break-words text-[11px] leading-relaxed text-[#5C5346]/90">
              Missing: {scrubOwnerFacingText(spot.whatEvidenceIsMissing)}
            </p>
          </li>
        ))}
      </ul>
    </details>
  );
}

function DiscoverySeoPartialCallout({
  dim,
}: {
  dim: LeoSelfIntelligenceDimensionResult;
}) {
  return (
    <div
      className="mb-4 min-w-0 rounded-xl border border-[color:var(--lx-border)]/70 bg-[color:var(--lx-section)]/90 p-3.5 sm:p-4"
      data-leo-si-discovery-seo
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">
        Discovery / SEO
      </p>
      <p className="mt-1 text-sm font-bold text-[#1E1810]">
        Partially measured — technical readiness only
      </p>
      <p className="mt-1.5 break-words text-sm leading-relaxed text-[#5C5346]">
        {scrubOwnerFacingText(dim.reason)}
      </p>
      <p className="mt-2 text-xs font-semibold text-[#5C5346]">
        Search performance: not measured (no rankings, impressions, clicks, or indexation proof).
      </p>
    </div>
  );
}

function CustomerJourneyPartialCallout({
  dim,
}: {
  dim: LeoSelfIntelligenceDimensionResult;
}) {
  const countNote = dim.limitations.find((l) => /Bounded ANALYTICS counts/i.test(l));
  return (
    <div
      className="mb-4 min-w-0 rounded-xl border border-[color:var(--lx-border)]/70 bg-[color:var(--lx-section)]/90 p-3.5 sm:p-4"
      data-leo-si-customer-journey
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">
        Customer Journey
      </p>
      <p className="mt-1 text-sm font-bold text-[#1E1810]">
        Partially measured — buyer engagement only
      </p>
      <p className="mt-1.5 break-words text-sm leading-relaxed text-[#5C5346]">
        {scrubOwnerFacingText(dim.reason)}
      </p>
      {countNote ? (
        <p className="mt-2 break-words text-xs leading-relaxed text-[#5C5346]">
          {scrubOwnerFacingText(countNote)}
        </p>
      ) : null}
      <p className="mt-2 text-xs font-semibold text-[#5C5346]">
        Still unmeasured: seller publish funnel, checkout-to-payment, renewal, and end-to-end attribution.
        Event counts are not conversion or abandonment rates.
      </p>
    </div>
  );
}

export function LeoSelfIntelligencePanel({ load }: { load: LeoSelfIntelligenceLoad }) {
  if (!load.ok) {
    return (
      <section
        className={`${adminCardBase} min-w-0 border-amber-200/80 bg-amber-50/70 p-4 sm:p-5`}
        aria-labelledby="leo-self-intelligence-heading"
        data-leo-self-intelligence
        role="status"
      >
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">Self-Intelligence</p>
        <h2 id="leo-self-intelligence-heading" className="mt-1 text-lg font-bold text-[#1E1810]">
          Temporarily unavailable
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-amber-950">{load.limitation}</p>
      </section>
    );
  }

  const { profile } = load;
  const v1Dims = LEO_SELF_INTELLIGENCE_V1_DIMENSIONS.map(
    (id) =>
      profile.healthMap.find((d) => d.dimension === id) ??
      profile.dimensions.find((d) => d.dimension === id),
  ).filter((d): d is LeoSelfIntelligenceDimensionResult => Boolean(d));
  const discoverySeo = profile.healthMap.find((d) => d.dimension === "DISCOVERY_SEO");
  const customerJourney = profile.healthMap.find((d) => d.dimension === "CUSTOMER_JOURNEY");

  return (
    <section
      className={`${adminCardBase} min-w-0 overflow-hidden border-[#7A1E2C]/12 p-4 shadow-[0_12px_40px_-16px_rgba(122,30,44,0.14)] sm:p-5`}
      aria-labelledby="leo-self-intelligence-heading"
      data-leo-self-intelligence
    >
      <div className="mb-4 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">Self-Intelligence</p>
        <h2
          id="leo-self-intelligence-heading"
          className="mt-1 text-xl font-bold tracking-tight text-[#1E1810] sm:text-2xl"
        >
          How Leonix is doing
        </h2>
        <p className="mt-3 break-words text-base font-semibold leading-relaxed text-[#1E1810]">
          {scrubOwnerFacingText(profile.overallInterpretation)}
        </p>
      </div>

      {profile.topNextMove ? (
        <div className="mb-4 min-w-0">
          <NextRightMoveHero move={profile.topNextMove} />
        </div>
      ) : (
        <p className="mb-4 text-sm text-[#5C5346]">
          No ranked Next Right Move from current evidence coverage.
        </p>
      )}

      <div className="mb-4 min-w-0">
        <h3 className="text-sm font-bold text-[#1E1810]">Known coverage</h3>
        <p className="mt-0.5 text-xs text-[#5C5346]">
          Four live dimensions — stable where coverage supports it; attention where evidence shows weakness.
        </p>
        <div className="mt-3 grid min-w-0 grid-cols-1 gap-2.5 sm:gap-3">
          {v1Dims.map((dim) => (
            <DimensionCard key={dim.dimension} dim={dim} />
          ))}
        </div>
      </div>

      {discoverySeo ? <DiscoverySeoPartialCallout dim={discoverySeo} /> : null}
      {customerJourney ? <CustomerJourneyPartialCallout dim={customerJourney} /> : null}

      <BlindSpotsSection spots={profile.blindSpots} />

      {profile.limitations.length > 0 ? (
        <details className="mt-4 min-w-0">
          <summary className="cursor-pointer touch-manipulation py-1 text-[11px] font-bold uppercase tracking-wide text-[#A67C52]">
            Limitations
          </summary>
          <ul className="mt-2 space-y-1 border-t border-[color:var(--lx-border)]/40 pt-2">
            {profile.limitations.slice(0, 5).map((l) => (
              <li key={l} className="break-words text-xs leading-relaxed text-[#5C5346]">
                {scrubOwnerFacingText(l)}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <p className="mt-4 text-[10px] leading-relaxed text-[#5C5346]/80">
        Interpretation of existing Leonix evidence — not a second reporting or system-health engine. No overall
        health percentage. Ask LEO: &quot;How is Leonix doing?&quot;
      </p>
    </section>
  );
}
