import {
  resolveCategoryListingMonetization,
  type CategoryListingMonetizationSummary,
  type CategoryListingToolKey,
  type CategoryListingToolStatus,
} from "@/app/lib/listingPlans/categoryListingMonetization";
import {
  buildAdminListingMonetizationInput,
  type AdminListingMonetizationHints,
} from "@/app/admin/_lib/buildAdminListingMonetizationInput";

type Props = {
  category?: string | null;
  source?: string | null;
  listing: Record<string, unknown>;
  detailPairs?: unknown;
  hints?: AdminListingMonetizationHints | null;
};

const TOOL_ORDER: Array<{ key: CategoryListingToolKey; label: string; title?: string }> = [
  { key: "republish", label: "Republish" },
  { key: "moveToTop", label: "Move top" },
  { key: "featured", label: "Featured" },
  {
    key: "verified",
    label: "Verified",
    title: "Trust/admin verification — not paid visibility",
  },
  { key: "analytics", label: "Analytics" },
  { key: "leads", label: "Leads" },
  { key: "expirationRenewal", label: "Expire/renew" },
  { key: "boost", label: "Boost" },
  { key: "autoRefresh", label: "Auto Refresh" },
  { key: "concierge", label: "Concierge" },
];

const PRIORITY_WARNING_CODES = new Set([
  "missing_leonix_ad_id",
  "missing_owner_id",
  "missing_source_id",
  "expires_at_missing",
  "featured_until_missing",
  "legacy_boost_expires",
  "package_entitlement_not_supplied",
  "dual_analytics_pipeline",
  "category_not_client_ready",
  "separate_monetization_model",
  "legacy_mock_admin",
  "leonix_id_derived",
  "en_venta_pro_leak",
  "viajes_expiration_missing",
  "republish_metadata_missing",
  "servicios_plan_missing",
  "unknown_category",
]);

function boolText(value: boolean | null | undefined): string | null {
  if (value == null) return null;
  return value ? "yes" : "no";
}

function statusClass(status: CategoryListingToolStatus): string {
  switch (status) {
    case "available":
      return "border-emerald-200 bg-emerald-50 text-emerald-950";
    case "locked":
      return "border-amber-300 bg-amber-50/90 text-amber-950";
    case "unsupported":
      return "border-slate-200 bg-slate-50 text-slate-700";
    case "future":
      return "border-[#D4C4A8] bg-[#FBF7EF] text-[#5C4E2E]";
    case "unknown":
    default:
      return "border-[#E8DFD0] bg-[#FFFCF7] text-[#7A5C2E]";
  }
}

function compactDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (!Number.isFinite(d.getTime())) return raw;
  return d.toISOString().slice(0, 10);
}

function pickCompactWarnings(summary: CategoryListingMonetizationSummary) {
  const structured = [...summary.catalogWarnings, ...summary.gaps];
  const prioritized = structured.filter((w) => PRIORITY_WARNING_CODES.has(w.code));
  const rest = structured.filter((w) => !PRIORITY_WARNING_CODES.has(w.code));
  return [...prioritized, ...rest].slice(0, 4);
}

export function AdminListingMonetizationSummary({
  category,
  source = "listings",
  listing,
  detailPairs,
  hints,
}: Props) {
  const input = buildAdminListingMonetizationInput({
    category,
    sourceTable: source ?? "listings",
    row: listing,
    detailPairs,
    hints,
  });
  const summary = resolveCategoryListingMonetization(input);
  const meta = summary.metadata;
  const metadataBits = [
    meta.leonixAdId ? `LX ${meta.leonixAdId}` : null,
    meta.sourceId ? `id ${String(meta.sourceId).slice(0, 8)}` : null,
    meta.slug ? `slug ${meta.slug}` : null,
    meta.republishedAt ? `ref ${compactDate(meta.republishedAt)}` : null,
    meta.republishCount != null ? `ref# ${meta.republishCount}` : null,
    meta.expiresAt ? `exp ${compactDate(meta.expiresAt)}` : null,
    boolText(meta.promoted) ? `promoted ${boolText(meta.promoted)}` : null,
    boolText(meta.featured) ? `featured ${boolText(meta.featured)}` : null,
    boolText(meta.verified) ? `verified ${boolText(meta.verified)}` : null,
  ].filter((bit): bit is string => Boolean(bit));

  const compactWarnings = pickCompactWarnings(summary);
  const tierLine = [summary.planKind, summary.listingTier].filter(Boolean).join(" · ");

  return (
    <div
      className="min-w-[16rem] max-w-[24rem] rounded-xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/90 p-2 text-[10px] leading-snug text-[#5C5346]"
      title="Read-only: does not activate monetization or tools."
    >
      <div className="flex flex-wrap items-center gap-1">
        <span className="rounded-full bg-[#2A2620] px-2 py-0.5 font-bold text-[#FAF7F2]">
          {summary.displayPlanLabel || summary.planLabel || "Unspecified plan"}
        </span>
        <span className="rounded-full border border-[#E8DFD0] bg-white px-2 py-0.5 font-semibold text-[#5C5346]">
          {summary.category}
        </span>
        {!summary.isClientReady ? (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-semibold text-slate-700">
            Not client-ready
          </span>
        ) : null}
      </div>
      {tierLine ? <p className="mt-1 font-mono text-[10px] text-[#7A7164]">Tier: {tierLine}</p> : null}
      {summary.pipelineClassification !== "UNKNOWN" ? (
        <p className="mt-0.5 text-[10px] text-[#7A7164]">Pipeline: {summary.pipelineClassification}</p>
      ) : null}
      <p className="mt-1 text-[10px] text-[#7A7164]">Plan source: {summary.planSource}</p>
      {summary.accountTierIgnored ? (
        <p className="mt-1 font-semibold text-[#7A7164]">Account tier ignored — listing metadata only.</p>
      ) : null}
      {metadataBits.length ? (
        <p className="mt-1 text-[#5C5346]">{metadataBits.join(" · ")}</p>
      ) : (
        <p className="mt-1 text-[#9A9084]">No safe row metadata.</p>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {TOOL_ORDER.map(({ key, label, title: toolTitle }) => {
          const state = summary.tools[key];
          const badgeTitle = toolTitle ?? (state.reason ? `${state.label}: ${state.reason}` : state.label);
          return (
            <span
              key={key}
              className={`rounded-full border px-1.5 py-0.5 font-semibold ${statusClass(state.status)}`}
              title={badgeTitle}
            >
              {label}: {state.status}
            </span>
          );
        })}
      </div>
      {compactWarnings.length ? (
        <div className="mt-2 space-y-0.5 text-[10px] text-amber-950">
          {compactWarnings.map((warning) => (
            <p key={`${warning.code}-${warning.message}`}>
              {warning.severity === "gap" ? "Gap" : warning.severity === "warning" ? "Warn" : "Info"}:{" "}
              {warning.message}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
