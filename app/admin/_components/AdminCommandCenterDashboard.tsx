import type { ReactNode } from "react";
import { AdminCommandCenterClient, type AdminCommandCenterSection } from "./AdminCommandCenterClient";
import { AdminDashboardCta, AdminDashboardCtaGrid } from "./AdminDashboardCta";
import { AdminDashboardReviewCardActions } from "./AdminDashboardReviewCardActions";
import { AdminMonetizationLinksCard } from "./AdminMonetizationLinksCard";
import { AdminExecutiveReportsPanel } from "./AdminExecutiveReportsPanel";
import { AdminPagePurposeCard } from "./AdminPagePurposeCard";
import { AdminSectionCard } from "./AdminSectionCard";
import {
  adminCardBase,
  adminDashboardMetricChip,
  adminDashboardUrgentBadge,
  adminWarningCallout,
} from "./adminTheme";
import {
  ADMIN_DASHBOARD_EXPIRING_SOON_DAYS,
  adminDashboardReviewSourceLabel,
  isAdminDashboardUrgentReviewRow,
  splitAdminDashboardExpiringQueue,
  type AdminDashboardExpiringQueueRow,
  type AdminDashboardLeadsCounts,
  type AdminDashboardPendingReviewQueueRow,
  type AdminDashboardSnapshot,
} from "../_lib/adminDashboardData";
import { ADMIN_DASHBOARD_ROUTES } from "../_lib/adminDashboardRoutes";
import type { adminMessages } from "../_lib/adminI18n";
import type { LeoExecutiveReportingSnapshot } from "@/app/leo/_lib/leoExecutiveReportingTypes";
import type { LeoSystemHealthSnapshot } from "@/app/leo/_lib/leoTypes";

type Msg = ReturnType<typeof adminMessages>;

const REVIEW_PREVIEW_LIMIT = 5;
const EXPIRING_PREVIEW_LIMIT = 3;

function fmt(iso: string, locale: string) {
  try {
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) : iso;
  } catch {
    return iso;
  }
}

function displayCount(value: number | string, unavailable?: boolean): ReactNode {
  if (unavailable) return "Unavailable";
  return value;
}

function PriorityTile({
  label,
  value,
  href,
  ctaLabel,
  variant,
  hint,
}: {
  label: string;
  value: ReactNode;
  href: string;
  ctaLabel: string;
  variant: "primary" | "warning" | "view" | "active" | "neutral" | "danger";
  hint?: string;
}) {
  return (
    <div className={`${adminCardBase} min-w-0 border-[#C9B46A]/30 bg-white/95 p-3 sm:p-4`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-[#1E1810] sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-[11px] leading-snug text-[#7A7164]">{hint}</p> : null}
      <AdminDashboardCta href={href} label={ctaLabel} variant={variant} className="mt-2 !min-h-[40px] !py-2 !text-xs" />
    </div>
  );
}

function CommandCard({
  title,
  count,
  nextAction,
  href,
  ctaLabel,
  variant = "primary",
  footnote,
}: {
  title: string;
  count: ReactNode;
  nextAction: string;
  href: string;
  ctaLabel: string;
  variant?: "primary" | "warning" | "view" | "active" | "neutral";
  footnote?: string;
}) {
  return (
    <div className={`${adminCardBase} min-w-0 p-4`}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{title}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-[#1E1810]">{count}</p>
      <p className="mt-1 text-xs text-[#5C5346]">{nextAction}</p>
      {footnote ? <p className="mt-1 text-[11px] text-[#9A9084]">{footnote}</p> : null}
      <AdminDashboardCta href={href} label={ctaLabel} variant={variant} className="mt-3" />
    </div>
  );
}

type DashboardTruthStatus = "real" | "partial" | "planned" | "needs proof";

const STATUS_CLASS: Record<DashboardTruthStatus, string> = {
  real: "border-[#2A4536]/35 bg-emerald-50 text-[#1F3C2F]",
  partial: "border-[#C9782F]/35 bg-[#FFF4E8] text-[#7A4010]",
  planned: "border-[#C9B46A]/45 bg-[#FFFCF7] text-[#5C4E2E]",
  "needs proof": "border-amber-300/70 bg-amber-50 text-amber-950",
};

/** Owner-facing operating language, not engineering-lifecycle jargon (Launch Truth Doctrine). */
const STATUS_LABEL: Record<DashboardTruthStatus, string> = {
  real: "Live",
  partial: "Partial",
  planned: "Planned",
  "needs proof": "Temporarily unavailable",
};

function StatusBadge({ status }: { status: DashboardTruthStatus }) {
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function OperatorCard({
  eyebrow,
  title,
  body,
  status,
  metric,
  primary,
  secondary,
}: {
  eyebrow: string;
  title: string;
  body: string;
  status: DashboardTruthStatus;
  metric?: ReactNode;
  primary?: { href: string; label: string; variant: "primary" | "warning" | "view" | "active" | "neutral" | "premium" };
  secondary?: { href: string; label: string; variant?: "primary" | "warning" | "view" | "active" | "neutral" | "premium" };
}) {
  return (
    <article className={`${adminCardBase} flex min-w-0 flex-col justify-between p-4`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A7164]">{eyebrow}</p>
          <StatusBadge status={status} />
        </div>
        <h3 className="mt-2 text-base font-bold leading-tight text-[#1E1810]">{title}</h3>
        {metric != null ? <p className="mt-2 text-2xl font-bold tabular-nums text-[#1E1810]">{metric}</p> : null}
        <p className="mt-2 text-sm leading-snug text-[#5C5346]">{body}</p>
      </div>
      {(primary || secondary) ? (
        <div className="mt-4 grid gap-2">
          {primary ? (
            <AdminDashboardCta href={primary.href} label={primary.label} variant={primary.variant} className="!min-h-[42px]" />
          ) : null}
          {secondary ? (
            <AdminDashboardCta
              href={secondary.href}
              label={secondary.label}
              variant={secondary.variant ?? "neutral"}
              className="!min-h-[42px]"
            />
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function CompactExpiringRow({ row, m, locale }: { row: AdminDashboardExpiringQueueRow; m: Msg; locale: string }) {
  return (
    <li className="rounded-xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 px-3 py-2.5 text-sm break-words">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#1E1810]">{row.title}</p>
          <p className="text-xs text-[#7A7164]">
            {row.categorySource} · {fmt(row.expiresAtIso, locale)}
          </p>
        </div>
        {row.isExpired ? (
          <span className={adminDashboardUrgentBadge}>Expired</span>
        ) : (
          <span className="rounded-md border border-[#C9782F]/50 bg-[#FFF4E8] px-2 py-0.5 text-[10px] font-bold uppercase text-[#8B4A12]">
            Soon
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <AdminDashboardCta href={row.adminHref} label={m("dashboard.adminQueue")} variant="view" className="!min-h-[36px] !w-auto !px-3 !py-1.5 !text-xs" />
      </div>
    </li>
  );
}

function CompactReviewRow({
  row,
  m,
  locale,
}: {
  row: AdminDashboardPendingReviewQueueRow;
  m: Msg;
  locale: string;
}) {
  const urgent = isAdminDashboardUrgentReviewRow(row);
  // ADMIN-OS-01 GATE C: read the row's own pre-computed truth (full report/AI
  // context) instead of re-deriving from the flattened reason string, which
  // silently mislabeled provenance (an AI- or report-sourced flag would
  // re-classify as "Manual" once its reason text lost its original context).
  const truth = row.flagTruth;
  const reviewSource = adminDashboardReviewSourceLabel(row);

  return (
    <li className="rounded-xl border border-[#E8DFD0]/80 bg-white/95 px-3 py-2.5 text-sm break-words">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {urgent ? <span className={adminDashboardUrgentBadge} aria-label="Urgent review">❗</span> : null}
            <p className="font-medium text-[#1E1810]">{row.title}</p>
          </div>
          <p className="text-xs text-[#7A7164]">
            {row.categorySource} · flagged/review status: {row.status}
          </p>
          <p className="mt-1 text-xs text-[#5C5346]">
            <span
              className="mr-1.5 inline-block rounded-md border border-[#C9B46A]/50 bg-[#FFFCF7] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#5C4E2E]"
              data-testid="admin-flag-source-badge"
            >
              {truth.sourceLabel}
            </span>
            {truth.needsTriage ? (
              <span
                className="mr-1.5 inline-block rounded-md border border-[#7A1E2C]/35 bg-[#FDF2F4] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#7A1E2C]"
                title="Flagged for review but no reason was ever stored — needs manual triage."
                data-testid="admin-flag-needs-triage-badge"
              >
                Needs triage
              </span>
            ) : truth.lifecycleState === "TRIAGE" ? (
              <span
                className="mr-1.5 inline-block rounded-md border border-[#6B5B2E]/35 bg-[#FFFCF7] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#6B5B2E]"
                title="AI has produced a decision and reason. No human has acted on it yet."
                data-testid="admin-flag-lifecycle-triage-badge"
              >
                AI triage
              </span>
            ) : truth.lifecycleState === "ACTION_REQUIRED" ? (
              <span
                className="mr-1.5 inline-block rounded-md border border-amber-700/35 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-900"
                title="A human-legible reason exists (report, manual flag, or status) and this listing is still live/pending — a person needs to act."
                data-testid="admin-flag-lifecycle-action-required-badge"
              >
                Action required
              </span>
            ) : null}
            {m("dashboard.reasonLabel")} {truth.ownerFacingExplanation}
          </p>
          <p className="mt-0.5 text-[10px] text-[#9A9084]">{reviewSource}</p>
        </div>
      </div>
      <AdminDashboardReviewCardActions row={row} />
    </li>
  );
}

export function AdminCommandCenterDashboard({
  m,
  locale,
  snap,
  leads,
  regSummary,
  entSnap,
  promoSnap,
  paySnap,
  catalogStats,
  showPaymentTracker,
  executiveReports,
  systemHealthSnapshot,
}: {
  m: Msg;
  locale: string;
  snap: AdminDashboardSnapshot;
  leads: AdminDashboardLeadsCounts;
  regSummary: { live: number; staged: number; comingSoon: number };
  entSnap: { dataUnavailable: boolean; activeCount: number };
  promoSnap: { dataUnavailable: boolean; activeCount: number };
  paySnap: { unavailable: boolean; pendingCount: number; failedCanceledRefundedCount: number };
  catalogStats: { total: number; live: number; error: string | null };
  showPaymentTracker: boolean;
  executiveReports: LeoExecutiveReportingSnapshot | null;
  systemHealthSnapshot: LeoSystemHealthSnapshot | null;
}) {
  const { expiringSoon, expired } = splitAdminDashboardExpiringQueue(snap.expiringQueueItems);
  const reviewPreview = snap.pendingReviewQueueItems.slice(0, REVIEW_PREVIEW_LIMIT);
  const expiringSoonPreview = expiringSoon.slice(0, EXPIRING_PREVIEW_LIMIT);
  const expiredPreview = expired.slice(0, EXPIRING_PREVIEW_LIMIT);
  // ADMIN-OS-01: canonical deduplicated count — never sum raw pendingListingsReview
  // with the (capped, preview-only) pendingReviewQueueItems.length. A listing that
  // is both flagged AND has pending reports must count once, not twice.
  const pendingReviewCount = snap.reviewAttentionTruth.uniqueListingsNeedingReview;
  // Master Operating Book §15 — "system outage/degradation" is a real Priority Engine
  // factor. Only escalate on an actual live-probe failure (DEGRADED/UNAVAILABLE); NOT_CONFIGURED
  // components (e.g. Stripe/Twilio unset on a single-operator deployment) are expected and must
  // not be treated as an incident — see adminSystemHealth.ts's own overallFromComponents().
  const systemHealthDegraded =
    systemHealthSnapshot != null &&
    (systemHealthSnapshot.overall === "DEGRADED" || systemHealthSnapshot.overall === "UNAVAILABLE");
  const degradedHealthComponents = systemHealthSnapshot?.components.filter(
    (c) => c.state === "DEGRADED" || c.state === "UNAVAILABLE",
  ) ?? [];

  const hero = (
    <header
      className={`${adminCardBase} mb-5 overflow-hidden border-[#C9B46A]/45 bg-gradient-to-br from-[#FFFCF7] via-[#FFF8F0] to-[#F8EAD7] p-4 sm:p-5 lg:p-6`}
      data-testid="admin-command-hero"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B7355]">Leonix Admin OS</p>
          <h1 className="mt-1 font-serif text-3xl font-bold leading-tight text-[#1E1810] sm:text-4xl">Leonix Command Center</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#5C5346] sm:text-base">
            Morning command page for Chuy to run leads, listings, revenue, people, website control, and system risk without fake counts.
          </p>
          <p className="mt-3 rounded-xl border border-[#C9B46A]/35 bg-white/70 px-3 py-2 text-xs font-semibold leading-snug text-[#5C4E2E]">
            Every count on this page is live from Supabase, or clearly marked when a source is temporarily unavailable.
          </p>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:max-w-xs lg:justify-end">
          <span className={adminDashboardMetricChip}>Real data only</span>
          <span className={adminDashboardMetricChip}>Mobile-first cards</span>
          <span className={adminDashboardMetricChip}>390px safe</span>
        </div>
      </div>
    </header>
  );

  /**
   * LEO-POLISH.1 — foreground entry card so LEO (the owner's conversational executive
   * interface) is unmistakably discoverable from Admin, right below the hero. This is a
   * discovery link into the real /admin/leo experience, not a duplicate of it: no conversation
   * UI, morning brief, workspace cards, Hands-Free, or LEO controls live here.
   */
  const leoExecutiveCta = (
    <section
      className={`${adminCardBase} mb-5 border-[#7A1E2C]/25 bg-gradient-to-r from-[#FDF2F4] to-[#FFFCF7] p-4 sm:p-5`}
      data-testid="admin-leo-executive-cta"
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A1E2C]">{m("nav.leo")}</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E1810]">Your executive operating intelligence</h2>
          <p className="mt-1 text-sm text-[#5C5346]">
            Ask LEO what needs your attention, who is waiting, and what changed — before you dig through queues.
          </p>
        </div>
        <AdminDashboardCta
          href={ADMIN_DASHBOARD_ROUTES.leo}
          label="Talk to LEO"
          variant="primary"
          className="w-full sm:w-auto sm:shrink-0"
          title="Open the LEO executive conversation"
        />
      </div>
    </section>
  );

  const promoCodeGeneratorTopCta = (
    <section
      className={`${adminCardBase} mb-5 border-[#C9B46A]/40 bg-gradient-to-r from-[#FFF8F0] to-[#FFFCF7] p-4 sm:p-5`}
      data-testid="admin-promo-code-generator-top-cta"
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A7164]">Promo codes</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E1810]">Leonix checkout promo codes</h2>
          <p className="mt-1 text-sm text-[#5C5346]">Create and track Leonix checkout promo codes.</p>
        </div>
        <AdminDashboardCta
          href={ADMIN_DASHBOARD_ROUTES.promoCodes}
          label="Promo Code Generator"
          variant="premium"
          className="w-full sm:w-auto sm:shrink-0"
          title="Create and track Leonix checkout promo codes"
        />
      </div>
    </section>
  );

  const priorityStrip = (
    <div className="mb-5 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6" data-testid="admin-ceo-priority-strip">
      <PriorityTile
        label="Leads need reply"
        value={displayCount(leads.leadsNeedingReply, leads.unavailable)}
        hint={leads.unavailable ? leads.unavailableNote ?? undefined : "Launch Leads — new or needs_reply"}
        href={ADMIN_DASHBOARD_ROUTES.launchLeads}
        ctaLabel="Open Launch Leads"
        variant="primary"
      />
      <PriorityTile
        label="Review / pending ads"
        value={pendingReviewCount}
        hint={
          snap.listingsQueryFallback || snap.reviewAttentionTruth.fallback
            ? m("dashboard.pendingAdsHintDb")
            : "Unique listings needing review (deduplicated)"
        }
        href={ADMIN_DASHBOARD_ROUTES.classifiedsReviewQueue}
        ctaLabel={m("dashboard.reviewAds")}
        variant="warning"
      />
      <PriorityTile
        label="Reports"
        value={snap.pendingReports}
        hint={m("dashboard.reportsHint")}
        href={ADMIN_DASHBOARD_ROUTES.reports}
        ctaLabel={m("dashboard.viewReports")}
        variant="warning"
      />
      <PriorityTile
        label="Expired listings"
        value={expired.length}
        hint="Past expiration deadline"
        href="#expiration"
        ctaLabel="See expired"
        variant="danger"
      />
      <PriorityTile
        label="Promo / quote leads"
        value={displayCount(leads.promoLeadsActive, leads.unavailable)}
        href={ADMIN_DASHBOARD_ROUTES.promocionales}
        ctaLabel="Open Promocionales"
        variant="primary"
      />
      <PriorityTile
        label="Newsletter"
        value={displayCount(leads.newsletterActive, leads.unavailable)}
        href={ADMIN_DASHBOARD_ROUTES.newsletter}
        ctaLabel="Newsletter list"
        variant="active"
      />
    </div>
  );

  const todaysCommandSection = (
    <AdminSectionCard
      title="Today's Attention"
      subtitle="The first things to check this morning. Counts are live when Supabase is available; unavailable sources are labeled."
    >
      {leads.unavailable ? (
        <div className={adminWarningCallout}>
          <strong>Lead counts unavailable.</strong> {leads.unavailableNote}
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {systemHealthDegraded ? (
          <OperatorCard
            eyebrow="System"
            title="System issue detected"
            status="real"
            metric={degradedHealthComponents.length}
            body={`${degradedHealthComponents.map((c) => c.label).join(", ")} unreachable right now — this can affect data on every page, not just one section.`}
            primary={{ href: ADMIN_DASHBOARD_ROUTES.systemHealth, label: "Open System Health", variant: "warning" }}
          />
        ) : null}
        <OperatorCard
          eyebrow="Leads"
          title="Needs response"
          status={leads.unavailable ? "needs proof" : "real"}
          metric={displayCount(leads.leadsNeedingReply, leads.unavailable)}
          body={leads.unavailable ? "Lead data needs live Supabase proof before operators rely on it." : "New or needs-reply launch leads that should be handled first."}
          primary={{ href: ADMIN_DASHBOARD_ROUTES.launchLeads, label: "Open leads", variant: "primary" }}
        />
        <OperatorCard
          eyebrow="Listings"
          title="Needs review"
          status={snap.listingsQueryFallback || snap.reviewAttentionTruth.fallback ? "needs proof" : "real"}
          metric={pendingReviewCount}
          body={
            snap.listingsQueryFallback || snap.reviewAttentionTruth.fallback
              ? m("dashboard.pendingAdsHintDb")
              : "Unique listings needing review — flagged/pending status or a pending report, deduplicated so one listing never counts twice."
          }
          primary={{ href: ADMIN_DASHBOARD_ROUTES.classifiedsReviewQueue, label: "Review listings", variant: "warning" }}
        />
        <OperatorCard
          eyebrow="Trust"
          title="Report submissions"
          status="real"
          metric={snap.pendingReports}
          body="Pending report submissions (evidence, not a separate attention count — a listing already counted in “Needs review” may have several of these)."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.reports, label: "Open reports", variant: "warning" }}
        />
        {showPaymentTracker ? (
          <OperatorCard
            eyebrow="Money"
            title="Payments at risk"
            status={paySnap.unavailable ? "needs proof" : "real"}
            metric={paySnap.unavailable ? "Unavailable" : paySnap.failedCanceledRefundedCount}
            body={
              paySnap.unavailable
                ? "Payment Tracker data needs live Supabase proof before operators rely on it."
                : "Failed, canceled, refunded, or disputed payments among the most recent 500 payment records — money that didn't come through as expected."
            }
            primary={{ href: "/admin/workspace/payment-tracker", label: "Open Payment Tracker", variant: "warning" }}
          />
        ) : null}
        <OperatorCard
          eyebrow="Money"
          title="Autos blocked by payment"
          status={snap.autosPaymentBlockedFallback ? "needs proof" : "real"}
          metric={snap.autosPaymentBlockedFallback ? "Unavailable" : snap.autosPaymentBlockedCount}
          body={
            snap.autosPaymentBlockedFallback
              ? "Autos listing data needs live Supabase proof before operators rely on it."
              : "Autos listings stuck in pending_payment or payment_failed — not live until payment clears. Restaurantes has no equivalent status; Comida Local's payment step isn't live yet, so neither is included here."
          }
          primary={{ href: ADMIN_DASHBOARD_ROUTES.autosOps, label: "Open Autos ops", variant: "warning" }}
        />
        <OperatorCard
          eyebrow="Support"
          title="Unresolved support"
          status={snap.openSupportTicketsFallback ? "needs proof" : "real"}
          metric={snap.openSupportTicketsFallback ? "Unavailable" : snap.openSupportTicketsCount}
          body={
            snap.openSupportTicketsFallback
              ? "Support ticket data needs live Supabase proof before operators rely on it."
              : "Open or in-progress internal support tickets (support_tickets.status)."
          }
          primary={{ href: ADMIN_DASHBOARD_ROUTES.support, label: "Open support", variant: "neutral" }}
        />
        <OperatorCard
          eyebrow="Visibility"
          title="Expired listings"
          status="partial"
          metric={expired.length}
          body="Best-effort expiration queue from existing listing fields."
          primary={{ href: "#expiration", label: "See expired", variant: "view" }}
        />
        <OperatorCard
          eyebrow="Visibility"
          title="Expiring soon"
          status="partial"
          metric={expiringSoon.length}
          body={`Listings detected within ${ADMIN_DASHBOARD_EXPIRING_SOON_DAYS} days when expiration fields are available.`}
          primary={{ href: "#expiration", label: "See expiring", variant: "view" }}
        />
      </div>
    </AdminSectionCard>
  );

  const revenuePipelineSection = (
    <AdminSectionCard
      title="Revenue Pulse"
      subtitle="CFO/operator view without fake dollars: leads, quote lanes, package tools, payments, and Tienda."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <OperatorCard
          eyebrow="Lead intake"
          title="Launch Leads"
          status={leads.unavailable ? "needs proof" : "real"}
          metric={displayCount(leads.launchLeadsActive, leads.unavailable)}
          body="Business inquiries captured in the Launch Leads inbox."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.launchLeads, label: "Open Launch Leads", variant: "primary" }}
        />
        <OperatorCard
          eyebrow="Quote lane"
          title="Promo / print quotes"
          status={leads.unavailable ? "needs proof" : "real"}
          metric={displayCount(leads.promoLeadsActive, leads.unavailable)}
          body="Filtered real lead view for promo and print quote follow-up."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.promocionales, label: "Open Promocionales", variant: "primary" }}
        />
        <OperatorCard
          eyebrow="Advertising"
          title="Advertising leads"
          status={leads.unavailable ? "needs proof" : "real"}
          metric={displayCount(leads.advertisingLeadsActive, leads.unavailable)}
          body="Advertising interest tracked in the existing lead table."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.launchLeads, label: "Review advertising", variant: "view" }}
        />
        <OperatorCard
          eyebrow="Media sales"
          title="Media kit requests"
          status={leads.unavailable ? "needs proof" : "real"}
          metric={displayCount(leads.mediaKitActive, leads.unavailable)}
          body="Media kit request queue with lifecycle/export tooling."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.mediaKit, label: "Media kit inbox", variant: "view" }}
        />
        <OperatorCard
          eyebrow="Audience"
          title="Newsletter list"
          status={leads.unavailable ? "needs proof" : "real"}
          metric={displayCount(leads.newsletterActive, leads.unavailable)}
          body="Newsletter subscribers are real."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.newsletter, label: "Newsletter list", variant: "active" }}
        />
        <OperatorCard
          eyebrow="Tienda"
          title="Tienda catalog (live)"
          status={catalogStats.error ? "needs proof" : "real"}
          metric={catalogStats.error ? "Unavailable" : catalogStats.live}
          body={catalogStats.error ? "Catalog data is temporarily unavailable." : `${catalogStats.total} total catalog items from the current catalog data.`}
          primary={{ href: ADMIN_DASHBOARD_ROUTES.catalog, label: "Open catalog", variant: "active" }}
        />
      </div>
      <div className="mt-6">
        <AdminMonetizationLinksCard
          title={m("dashboard.monetizationHubTitle")}
          subtitle={m("dashboard.monetizationHubSub")}
          entitlementsHref="/admin/workspace/package-entitlements"
          entitlementsLabel={m("dashboard.entitlementsHubTitle")}
          entitlementsHint={m("dashboard.entitlementsHubHint")}
          entitlementsCount={entSnap.dataUnavailable ? "—" : String(entSnap.activeCount)}
          promoHref="/admin/workspace/promo-codes"
          promoLabel={m("dashboard.promoCodesActiveTitle")}
          promoHint={m("dashboard.promoCodesActiveHint")}
          promoCount={promoSnap.dataUnavailable ? "—" : String(promoSnap.activeCount)}
          paymentHref={showPaymentTracker ? "/admin/workspace/payment-tracker" : undefined}
          paymentLabel={showPaymentTracker ? m("dashboard.paymentTrackerPendingTitle") : undefined}
          paymentHint={m("dashboard.paymentTrackerPendingHint")}
          paymentCount={paySnap.unavailable ? "—" : String(paySnap.pendingCount)}
          salesHref="/admin/workspace/sales-tracker"
          salesLabel={m("dashboard.salesTrackerLink")}
        />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-1">
        <OperatorCard
          eyebrow="Business Concierge"
          title="Business Concierge"
          status="real"
          body="Understand businesses, follow up, meet prepared, review opportunities, and create from verified truth."
          primary={{ href: "/admin/businesses", label: "Open Business Concierge", variant: "primary" }}
        />
      </div>
    </AdminSectionCard>
  );

  const marketplaceSection = (
    <AdminSectionCard title="Marketplace Ops" subtitle="Classifieds control room: review queues, reports, category ops, and real routed vertical tools.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <OperatorCard
          eyebrow="Queue"
          title="Classifieds queue"
          status="real"
          body="Global review and listing operations queue with filters, owner links, public links, and action proof."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.classifiedsQueue, label: "Open queue", variant: "warning" }}
          secondary={{ href: ADMIN_DASHBOARD_ROUTES.classifiedsReviewQueue, label: "Flagged review", variant: "warning" }}
        />
        <OperatorCard
          eyebrow="Trust"
          title="Report submissions"
          status="real"
          body="Same pending-report total already shown in Today's Attention — not a second count."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.reports, label: "Open reports", variant: "warning" }}
        />
        <OperatorCard
          eyebrow="AI moderation"
          title="AI review queue"
          status="partial"
          body="AI-assisted single and bulk review tools are available; final moderation decisions are always made by staff."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.classifiedsReviewQueue, label: "Open review queue", variant: "view" }}
        />
        <OperatorCard
          eyebrow="Categories"
          title="Category ops"
          status="partial"
          body={`Registry truth: ${regSummary.live} live, ${regSummary.staged} staged, ${regSummary.comingSoon} coming soon.`}
          primary={{ href: ADMIN_DASHBOARD_ROUTES.categories, label: "Open category ops", variant: "view" }}
        />
        <OperatorCard
          eyebrow="Servicios"
          title="Servicios ops"
          status="real"
          body="Routed services admin surface for paid business services operations and moderation."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.serviciosOps, label: "Open Servicios", variant: "active" }}
        />
        <OperatorCard
          eyebrow="Autos"
          title="Autos ops"
          status="real"
          body="Routed auto listings operations for private and business inventory review."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.autosOps, label: "Open Autos", variant: "active" }}
        />
        <OperatorCard
          eyebrow="Restaurantes"
          title="Restaurantes ops"
          status="real"
          body="Routed restaurant operations for paid restaurant listing review."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.restaurantesOps, label: "Open Restaurantes", variant: "active" }}
        />
        <OperatorCard
          eyebrow="Viajes"
          title="Viajes ops"
          status="real"
          body="Routed travel workspace for staged listing review."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.viajesOps, label: "Open Viajes workspace", variant: "view" }}
        />
        <OperatorCard
          eyebrow="Lookup"
          title="Customer/listing search"
          status="real"
          body="Search businesses, users, listings, payments, staff, and more by name, email, phone, or ID."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.customerOps, label: "Open lookup", variant: "view" }}
        />
      </div>
      <div className="mt-4 rounded-xl border border-[#C9B46A]/30 bg-[#FFFCF7]/80 p-3 text-xs text-[#5C5346]">
        Safe next action: review flagged ads first, then reports, then category-specific queues. Destructive listing actions stay inside queue pages.
      </div>
    </AdminSectionCard>
  );

  const websiteSection = (
    <AdminSectionCard title="Website Control" subtitle="Controlled website modules only. No freeform builder, no fake publish tools.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <OperatorCard
          eyebrow="Site modules"
          title="Site sections"
          status="real"
          body="Owner-friendly alias opens the existing workspace module control hub."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.websiteSections, label: "Open site sections", variant: "view" }}
        />
        <OperatorCard
          eyebrow="Magazine"
          title="Magazine Manager"
          status="real"
          body={snap.magazineFeaturedLabel ? `Featured issue: ${snap.magazineFeaturedLabel}` : "Manage magazine issues in the Revista workspace."}
          primary={{ href: "/admin/workspace/revista", label: "Open magazine", variant: "view" }}
        />
        <OperatorCard
          eyebrow="Settings"
          title="Global site settings"
          status="real"
          body="Site-wide settings and configuration."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.siteSettings, label: "Open settings", variant: "neutral" }}
        />
        <OperatorCard
          eyebrow="Quality"
          title="Language audit"
          status="real"
          body="QA tool for multilingual (Spanish/English) coverage across the site."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.languageAudit, label: "Open language audit", variant: "neutral" }}
        />
        <OperatorCard
          eyebrow="Inspect"
          title="View public site"
          status="real"
          body="Safe inspect action only. Does not change public content."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.viewSite, label: "View site", variant: "view" }}
        />
      </div>
      {snap.magazineFeaturedLabel ? (
        <p className="mt-4 text-xs text-[#7A7164]">
          Featured magazine: {snap.magazineFeaturedLabel}
          {snap.magazineUpdated ? ` · updated ${snap.magazineUpdated}` : ""}
        </p>
      ) : null}
    </AdminSectionCard>
  );

  const peopleSupportSection = (
    <AdminSectionCard title="People + Support" subtitle="Clients, team, support, and permission-sensitive actions with safe support rules.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <OperatorCard
          eyebrow="Clients"
          title="Users"
          status="real"
          metric={snap.usersNeedingHelpProxy}
          body={`User/client records are backed by profiles. ${snap.usersNeedingHelpNote}`}
          primary={{ href: ADMIN_DASHBOARD_ROUTES.users, label: "Open users", variant: "view" }}
        />
        <OperatorCard
          eyebrow="Team"
          title="Team roster"
          status="real"
          body="Staff roster with role-based access scoping."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.teamRoster, label: "Manage roster", variant: "active" }}
          secondary={{ href: ADMIN_DASHBOARD_ROUTES.createStaffUser, label: "Create staff login", variant: "primary" }}
        />
        <OperatorCard
          eyebrow="Support"
          title="Support tickets"
          status={snap.openSupportTicketsFallback ? "needs proof" : "real"}
          metric={snap.openSupportTicketsFallback ? "Unavailable" : snap.openSupportTicketsCount}
          body={
            snap.openSupportTicketsFallback
              ? "Support ticket data needs live Supabase proof before operators rely on it."
              : "Open or in-progress internal support tickets."
          }
          primary={{ href: ADMIN_DASHBOARD_ROUTES.support, label: "Open support", variant: "neutral" }}
        />
        <OperatorCard
          eyebrow="Permissions"
          title="Staff permissions"
          status="real"
          body="Role-based access controls what each staff member can see and do."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.team, label: "Open staff workspace", variant: "view" }}
        />
      </div>
    </AdminSectionCard>
  );

  const systemHealthSection = (
    <AdminSectionCard title="System Health" subtitle="Real, live dependency checks. No fake health status.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <OperatorCard
          eyebrow="Dependencies"
          title="System Health"
          status="real"
          body="Live checks: Supabase data access, marketplace data, the audit pipeline, team roster data, and whether Stripe/email/SMS/roster-permission enforcement are configured. Never a fake green."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.systemHealth, label: "Open System Health", variant: "warning" }}
        />
        <OperatorCard
          eyebrow="Audit trail"
          title="Activity log"
          status="real"
          body="Recent admin actions and system events."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.activityLog, label: "Open activity log", variant: "neutral" }}
        />
      </div>
    </AdminSectionCard>
  );

  const reviewWorkbenchSection = (
    <AdminSectionCard
      title="Review workbench preview"
      subtitle="Top flagged/review listings — reasons from persisted fields, not AI. Open the full queue for bulk work."
    >
      <ul className="space-y-2">
        {reviewPreview.length === 0 ? (
          <li className="text-sm text-[#5C5346]/90">{m("dashboard.pendingReviewEmpty")}</li>
        ) : (
          reviewPreview.map((row) => (
            <CompactReviewRow key={`${row.source}-${row.internalId}`} row={row} m={m} locale={locale} />
          ))
        )}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <AdminDashboardCta
          href={ADMIN_DASHBOARD_ROUTES.classifiedsReviewQueue}
          label="Open full review queue"
          variant="warning"
        />
        <AdminDashboardCta href="#review" label="Stay on preview" variant="neutral" />
      </div>
    </AdminSectionCard>
  );

  const expirationWorkbenchSection = (
    <AdminSectionCard
      title="Expiration workbench preview"
      subtitle={`Compact view — expiring soon = within ${ADMIN_DASHBOARD_EXPIRING_SOON_DAYS} days. Full lists live in classifieds queue.`}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold text-[#1E1810]">Expiring soon</h3>
          <ul className="mt-2 space-y-2">
            {expiringSoonPreview.length === 0 ? (
              <li className="text-sm text-[#5C5346]/90">None within {ADMIN_DASHBOARD_EXPIRING_SOON_DAYS} days.</li>
            ) : (
              expiringSoonPreview.map((row) => (
                <CompactExpiringRow key={`soon-${row.source}-${row.internalId}`} row={row} m={m} locale={locale} />
              ))
            )}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#1E1810]">Expired</h3>
          <ul className="mt-2 space-y-2">
            {expiredPreview.length === 0 ? (
              <li className="text-sm text-[#5C5346]/90">No expired ads in preview sample.</li>
            ) : (
              expiredPreview.map((row) => (
                <CompactExpiringRow key={`exp-${row.source}-${row.internalId}`} row={row} m={m} locale={locale} />
              ))
            )}
          </ul>
        </div>
      </div>
      <AdminDashboardCta
        href={ADMIN_DASHBOARD_ROUTES.classifiedsQueue}
        label="Open classifieds queue"
        variant="view"
        className="mt-4"
      />
    </AdminSectionCard>
  );

  const quickActions = (
    <section className={`${adminCardBase} mb-5 border-[#C9B46A]/35 bg-[#FFFCF7]/95 p-4`} data-testid="admin-dashboard-quick-actions">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A7164]">Quick Actions</p>
          <h2 className="mt-1 text-lg font-bold text-[#1E1810]">What should I open next?</h2>
          <p className="mt-1 text-sm text-[#5C5346]">Only working tools are linked here.</p>
        </div>
      </div>
      <div className="mt-4">
        <AdminDashboardCtaGrid columns={3}>
          <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.classifiedsReviewQueue} label="Review listings" variant="warning" />
          <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.launchLeads} label="Open leads" variant="primary" />
          <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.reports} label="Open reports" variant="warning" />
          <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.teamRoster} label="Manage team" variant="active" />
          <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.websiteSections} label="Site sections" variant="view" />
          <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.viewSite} label="View site" variant="view" external />
        </AdminDashboardCtaGrid>
      </div>
    </section>
  );

  const sections: AdminCommandCenterSection[] = [
    { id: "today", label: "Today", content: todaysCommandSection },
    {
      id: "reports",
      label: "Executive Reports",
      content: <AdminExecutiveReportsPanel snapshot={executiveReports} />,
    },
    { id: "revenue", label: "Revenue Pulse", content: revenuePipelineSection },
    { id: "marketplace", label: "Marketplace", content: marketplaceSection },
    { id: "website", label: "Website", content: websiteSection },
    { id: "people", label: "People", content: peopleSupportSection },
    { id: "system", label: "System Health", content: systemHealthSection },
    { id: "review", label: "Review", content: reviewWorkbenchSection },
    { id: "expiration", label: "Expiration", content: expirationWorkbenchSection },
  ];

  return (
    <div className="min-w-0 max-w-7xl overflow-x-hidden" data-testid="admin-ceo-command-center">
      {hero}
      {leoExecutiveCta}
      {promoCodeGeneratorTopCta}
      <AdminPagePurposeCard
        title="Leonix Command Center"
        purpose="Daily operator view for leads, listings, reports, revenue signals, people, website control, and system health without fake counts."
        dataSource="Live Supabase-backed snapshots where available: listings, leads, reports, package entitlements, promo codes, payment records, Tienda catalog, and category registry."
        status="real"
        safeActions={["Open real queues", "Inspect reports and leads", "Navigate to existing admin tools"]}
      />
      {priorityStrip}
      {quickActions}
      <AdminCommandCenterClient sections={sections} />
      <div className="mt-6 rounded-2xl border border-dashed border-[#C9B46A]/50 bg-[#FFF8F0]/80 p-4 text-xs text-[#7A7164] break-words">
        <p>
          <strong className="text-[#5C5346]">{m("dashboard.dataHonestyLabel")}</strong> {m("dashboard.dataHonestyBody")}
        </p>
        <p className="mt-2">
          Review reasons come from saved moderation notes and listing status — not AI-generated explanations.
        </p>
      </div>
    </div>
  );
}
