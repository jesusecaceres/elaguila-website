import {
  resolveCategoryListingMonetization,
  type CategoryListingToolKey,
  type CategoryListingToolStatus,
} from "@/app/lib/listingPlans/categoryListingMonetization";
import {
  buildAdminListingMonetizationInput,
  type AdminListingMonetizationHints,
} from "@/app/admin/_lib/buildAdminListingMonetizationInput";
import { adminDashboardMetricChip } from "@/app/admin/_components/adminTheme";

const TOOL_ORDER: Array<{ key: CategoryListingToolKey; label: string }> = [
  { key: "republish", label: "Republish" },
  { key: "moveToTop", label: "Move top" },
  { key: "featured", label: "Featured" },
  { key: "verified", label: "Verified" },
  { key: "analytics", label: "Analytics" },
  { key: "expirationRenewal", label: "Expire/renew" },
  { key: "autoRefresh", label: "Auto refresh" },
];

const PRIORITY_WARNING_CODES = new Set([
  "missing_leonix_ad_id",
  "servicios_plan_missing",
  "dual_analytics_pipeline",
  "package_entitlement_not_supplied",
  "republish_metadata_missing",
]);

function statusChipClass(status: CategoryListingToolStatus): string {
  switch (status) {
    case "available":
      return "border-[#2A4536]/40 bg-[#F4FAF2] text-[#2A4536]";
    case "locked":
      return "border-[#C9782F]/40 bg-[#FFF3E6] text-[#8A4B12]";
    case "unsupported":
      return "border-[#E8DFD0] bg-[#FAF7F2] text-[#5C5346]";
    case "future":
      return "border-[#C9B46A]/50 bg-[#FFFCF7] text-[#6B5B2E]";
    default:
      return "border-[#E8DFD0] bg-[#FFFCF7] text-[#7A7164]";
  }
}

export function ServiciosAdminMonetizationPanel({
  listing,
  hints,
}: {
  listing: Record<string, unknown>;
  hints?: AdminListingMonetizationHints | null;
}) {
  const input = buildAdminListingMonetizationInput({
    category: "servicios",
    sourceTable: "servicios_public_listings",
    row: listing,
    hints,
  });
  const summary = resolveCategoryListingMonetization(input);
  const warnings = [...summary.catalogWarnings, ...summary.gaps]
    .filter((w) => PRIORITY_WARNING_CODES.has(w.code))
    .slice(0, 3);

  return (
    <div className="min-w-0 space-y-2" data-testid="servicios-admin-monetization-panel">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg border border-[#2A2620] bg-[#2A2620] px-2 py-1 text-[11px] font-bold text-[#FAF7F2]">
          {summary.displayPlanLabel || summary.planLabel || "Plan unspecified"}
        </span>
        {summary.pipelineClassification !== "UNKNOWN" ? (
          <span className={adminDashboardMetricChip}>Pipeline: {summary.pipelineClassification}</span>
        ) : null}
        {!summary.isClientReady ? (
          <span className="rounded-lg border border-[#E8DFD0] bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-semibold text-[#5C5346]">
            Partial readiness
          </span>
        ) : null}
      </div>
      <p className="text-xs text-[#5C5346]">
        Plan source: <span className="font-semibold text-[#3D3629]">{summary.planSource}</span>
        {summary.accountTierIgnored ? " · account tier ignored" : ""}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {TOOL_ORDER.map(({ key, label }) => {
          const state = summary.tools[key];
          return (
            <span
              key={key}
              className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${statusChipClass(state.status)}`}
              title={state.reason ?? state.label}
            >
              {label}: {state.status}
            </span>
          );
        })}
      </div>
      {warnings.length ? (
        <ul className="space-y-1 text-[11px] leading-snug text-[#8A4B12]">
          {warnings.map((w) => (
            <li key={`${w.code}-${w.message}`}>
              {w.severity === "gap" ? "Gap" : "Note"}: {w.message}
            </li>
          ))}
        </ul>
      ) : null}
      <details className="rounded-lg border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 p-2 text-[10px] text-[#5C5346]">
        <summary className="cursor-pointer font-semibold text-[#3D3629]">View monetization details</summary>
        <p className="mt-2 font-mono leading-relaxed">
          {summary.category} · {summary.listingTier ?? "—"} · tools read-only (staff actions use row buttons)
        </p>
      </details>
    </div>
  );
}
