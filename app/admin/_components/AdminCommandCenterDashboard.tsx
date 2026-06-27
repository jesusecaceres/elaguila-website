import type { ReactNode } from "react";
import { AdminCommandCenterClient, type AdminCommandCenterSection } from "./AdminCommandCenterClient";
import { AdminDashboardCta, AdminDashboardCtaGrid } from "./AdminDashboardCta";
import { AdminDashboardReviewCardActions } from "./AdminDashboardReviewCardActions";
import { AdminMonetizationLinksCard } from "./AdminMonetizationLinksCard";
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
import { classifyDashboardReviewRowFlagTruth } from "../_lib/adminReviewFlagTruth";
import { ADMIN_DASHBOARD_ROUTES } from "../_lib/adminDashboardRoutes";
import type { adminMessages } from "../_lib/adminI18n";

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

function StatusBadge({ status }: { status: DashboardTruthStatus }) {
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_CLASS[status]}`}>
      {status}
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

function PlannedCard({
  title,
  body,
  gate,
}: {
  title: string;
  body: string;
  gate: string;
}) {
  return (
    <article className={`${adminCardBase} min-w-0 border-dashed border-[#C9B46A]/60 bg-[#FFFCF7]/90 p-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A7164]">Planned OS tool</p>
        <StatusBadge status="planned" />
      </div>
      <h3 className="mt-2 text-base font-bold text-[#1E1810]">{title}</h3>
      <p className="mt-2 text-sm leading-snug text-[#5C5346]">{body}</p>
      <p className="mt-3 rounded-lg border border-[#E8DFD0] bg-white/70 px-3 py-2 text-xs font-semibold text-[#5C4E2E]">
        Next gate: {gate}
      </p>
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
  const truth = classifyDashboardReviewRowFlagTruth({
    source: row.source,
    status: row.status,
    reason: row.reason,
  });
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
}: {
  m: Msg;
  locale: string;
  snap: AdminDashboardSnapshot;
  leads: AdminDashboardLeadsCounts;
  regSummary: { live: number; staged: number; comingSoon: number };
  entSnap: { dataUnavailable: boolean; activeCount: number };
  promoSnap: { dataUnavailable: boolean; activeCount: number };
  paySnap: { unavailable: boolean; pendingCount: number };
  catalogStats: { total: number; live: number; error: string | null };
  showPaymentTracker: boolean;
}) {
  const { expiringSoon, expired } = splitAdminDashboardExpiringQueue(snap.expiringQueueItems);
  const reviewPreview = snap.pendingReviewQueueItems.slice(0, REVIEW_PREVIEW_LIMIT);
  const expiringSoonPreview = expiringSoon.slice(0, EXPIRING_PREVIEW_LIMIT);
  const expiredPreview = expired.slice(0, EXPIRING_PREVIEW_LIMIT);
  const pendingReviewCount = snap.pendingListingsReview + snap.pendingReviewQueueItems.length;

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
            Current truth: live Supabase counts where backed, partial tools labeled, future OS tools marked planned until schema proof exists.
          </p>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:max-w-xs lg:justify-end">
          <span className={adminDashboardMetricChip}>Real data only</span>
          <span className={adminDashboardMetricChip}>Mobile-first cards</span>
          <span className={adminDashboardMetricChip}>Partial labeled</span>
          <span className={adminDashboardMetricChip}>390px safe</span>
        </div>
      </div>
    </header>
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
        hint={snap.listingsQueryFallback ? m("dashboard.pendingAdsHintDb") : "Flagged or pending listings"}
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
          status={snap.listingsQueryFallback ? "needs proof" : "real"}
          metric={pendingReviewCount}
          body={snap.listingsQueryFallback ? m("dashboard.pendingAdsHintDb") : "Flagged or pending listings from persisted listing state and review rows."}
          primary={{ href: ADMIN_DASHBOARD_ROUTES.classifiedsReviewQueue, label: "Review listings", variant: "warning" }}
        />
        <OperatorCard
          eyebrow="Trust"
          title="Reports & complaints"
          status="real"
          metric={snap.pendingReports}
          body="Pending reports from listing_reports. Resolution actions still need the action truth gate."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.reports, label: "Open reports", variant: "warning" }}
        />
        <OperatorCard
          eyebrow="Visibility"
          title="Expired listings"
          status="partial"
          metric={expired.length}
          body="Best-effort expiration queue from existing listing fields. Full visibility checker is planned."
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
        <OperatorCard
          eyebrow="System risk"
          title="Bug Finder planned"
          status="planned"
          body="System alerts and high-priority email alerts need the admin_system_alerts schema gate. No fake health status is shown."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.activityLog, label: "View activity log", variant: "neutral" }}
        />
      </div>
    </AdminSectionCard>
  );

  const revenuePipelineSection = (
    <AdminSectionCard
      title="Revenue Pulse"
      subtitle="CFO/operator view without fake dollars: leads, quote lanes, package tools, payments, Tienda, and planned revenue platforms."
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
          body="Newsletter subscribers are real; campaign tooling is still future work."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.newsletter, label: "Newsletter list", variant: "active" }}
        />
        <OperatorCard
          eyebrow="Tienda"
          title="Tienda catalog (live)"
          status={catalogStats.error ? "needs proof" : "real"}
          metric={catalogStats.error ? "Unavailable" : catalogStats.live}
          body={catalogStats.error ? catalogStats.error : `${catalogStats.total} total catalog items from the current catalog data.`}
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
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <PlannedCard
          title="Viajes Affiliate Ops"
          body="Revenue lane for partners, offers, leads, clicks, and health. Existing Viajes admin is partial until affiliate tables are proven."
          gate="ADMIN-SUPABASE-BACKING-MATRIX-01"
        />
        <PlannedCard
          title="Business Concierge"
          body="Future paid service queue for clients who want Leonix to publish, promote, or build for them. No live concierge table yet."
          gate="Concierge schema gate"
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
          title="Reports / complaints"
          status="real"
          metric={snap.pendingReports}
          body="Reads listing_reports. Resolve/dismiss actions still need the action truth map."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.reports, label: "Open reports", variant: "warning" }}
        />
        <OperatorCard
          eyebrow="AI moderation"
          title="AI review queue"
          status="partial"
          body="Single and bulk AI review routes exist, but live provider proof and policy controls still need verification."
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
          status="partial"
          body="Current routed workspace exists as travel; affiliate revenue tables are planned and not presented as live."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.viajesOps, label: "Open Viajes workspace", variant: "view" }}
        />
        <OperatorCard
          eyebrow="Lookup"
          title="Customer/listing search"
          status="partial"
          body="Global lookup exists, but final Support Center workflow needs the User Support View gate."
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
          status="partial"
          body={snap.magazineFeaturedLabel ? `Featured issue: ${snap.magazineFeaturedLabel}` : "Magazine issue actions exist in the Revista workspace; canonical manager still needs cleanup."}
          primary={{ href: "/admin/workspace/revista", label: "Open magazine", variant: "view" }}
        />
        <OperatorCard
          eyebrow="Settings"
          title="Global site settings"
          status="partial"
          body="Existing settings route is live, but Website Control boundaries still need nav architecture cleanup."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.siteSettings, label: "Open settings", variant: "neutral" }}
        />
        <OperatorCard
          eyebrow="Quality"
          title="Language audit"
          status="partial"
          body="Existing audit route helps QA multilingual coverage; final System grouping is planned."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.languageAudit, label: "Open language audit", variant: "neutral" }}
        />
        <OperatorCard
          eyebrow="Inspect"
          title="View public site"
          status="real"
          body="Safe inspect action only. Does not change public content."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.viewSite, label: "View site", variant: "view" }}
        />
        <PlannedCard
          title="Homepage / Banners / Announcements / Category visibility"
          body="Planned controlled modules from the audit. No live route is linked until backing and route gates exist."
          gate="Website Control gate"
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
          body="Staff roster exists with role scoping; final permissions architecture still needs proof."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.teamRoster, label: "Manage roster", variant: "active" }}
          secondary={{ href: ADMIN_DASHBOARD_ROUTES.createStaffUser, label: "Create staff login", variant: "primary" }}
        />
        <OperatorCard
          eyebrow="Support"
          title="Support tickets"
          status="partial"
          body="Internal support log exists. Full safe support view is planned and must avoid passwords, raw cards, and uncontrolled impersonation."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.support, label: "Open support", variant: "neutral" }}
        />
        <OperatorCard
          eyebrow="Support view"
          title="Safe User Support View"
          status="planned"
          body="Needs reason, role permission, audit log, no passwords, no raw cards, and reset links only through an audited flow."
        />
        <OperatorCard
          eyebrow="Passwords"
          title="Password reset support"
          status="planned"
          body="Not shown as live. The audit requires an audited reset-link flow before operators can send resets from admin."
        />
        <OperatorCard
          eyebrow="Permissions"
          title="Staff permissions truth"
          status="partial"
          body="Current roles exist, but final owner/admin/moderator/sales/content/support/viewer mapping needs the permissions gate."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.team, label: "Open staff workspace", variant: "view" }}
        />
      </div>
    </AdminSectionCard>
  );

  const systemHealthSection = (
    <AdminSectionCard title="System Health / Bug Finder" subtitle="Truthful system-risk teaser. No fake health status and no missing routes linked as live.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <PlannedCard
          title="Bug Finder"
          body="Planned command center for publishing, upload, storage, visibility, payment, magazine, and API alerts."
          gate="ADMIN-BUG-FINDER-DASHBOARD-01"
        />
        <PlannedCard
          title="System Alerts"
          body="Needs admin_system_alerts before live alert counts, acknowledge, resolve, dedupe, and safe debug context."
          gate="ADMIN-SYSTEM-ALERTS-SCHEMA-01"
        />
        <PlannedCard
          title="High-priority email alerts"
          body="Planned alerts to chuy@leonixmedia.com with dedupe and no secrets. Not active until schema and Resend proof exist."
          gate="ADMIN-SYSTEM-ALERTS-SCHEMA-01"
        />
        <OperatorCard
          eyebrow="Audit trail"
          title="Activity log"
          status="partial"
          body="Existing audit log route is safe to inspect. Actor detail and coverage still need proof."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.activityLog, label: "Open activity log", variant: "neutral" }}
        />
        <OperatorCard
          eyebrow="Settings"
          title="Admin settings"
          status="partial"
          body="Existing settings route is available. System grouping and controls need the nav architecture gate."
          primary={{ href: ADMIN_DASHBOARD_ROUTES.globalSettings, label: "Open settings", variant: "neutral" }}
        />
        <OperatorCard
          eyebrow="Next proof"
          title="Supabase backing matrix"
          status="planned"
          body="The next recommended gate proves every table, column, and action before new OS tools are built."
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
          <p className="mt-1 text-sm text-[#5C5346]">Only existing routes are linked here. Planned OS tools stay labeled in their cards.</p>
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
      {priorityStrip}
      {quickActions}
      <AdminCommandCenterClient sections={sections} />
      <div className="mt-6 rounded-2xl border border-dashed border-[#C9B46A]/50 bg-[#FFF8F0]/80 p-4 text-xs text-[#7A7164] break-words">
        <p>
          <strong className="text-[#5C5346]">{m("dashboard.dataHonestyLabel")}</strong> {m("dashboard.dataHonestyBody")}
        </p>
        <p className="mt-2">
          Review reasons come from persisted fields (<code className="break-all">moderation_reason</code>,{" "}
          <code className="break-all">review_notes</code>, or listing status). Flagged listings use{" "}
          <code className="break-all">listings.status = flagged</code> — not AI-generated explanations.
        </p>
      </div>
    </div>
  );
}
