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
  adminDashboardReviewReasonLabel,
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
  const reason = adminDashboardReviewReasonLabel(row.reason);
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
            {m("dashboard.reasonLabel")} {reason}
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
      className={`${adminCardBase} mb-5 border-[#C9B46A]/45 bg-gradient-to-br from-[#FFFCF7] to-[#FFF8F0] p-4 sm:p-5`}
      data-testid="admin-command-hero"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B7355]">Leonix Command Center</p>
      <h1 className="mt-1 font-serif text-2xl font-bold text-[#1E1810] sm:text-3xl">Owner dashboard</h1>
      <p className="mt-1 max-w-3xl text-sm text-[#5C5346]">
        Run launch, leads, listings, reports, content, and revenue from one place.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className={adminDashboardMetricChip}>Admin signed in</span>
        <span className={adminDashboardMetricChip}>Real data only</span>
        <span className={adminDashboardMetricChip}>No fake counts</span>
      </div>
    </header>
  );

  const priorityStrip = (
    <div className="mb-5 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" data-testid="admin-ceo-priority-strip">
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
      title="Today's Command"
      subtitle="What needs action today — urgent review, reports, leads, expiring ads, and account signals. Live Supabase counts only."
    >
      {leads.unavailable ? (
        <div className={adminWarningCallout}>
          <strong>Lead counts unavailable.</strong> {leads.unavailableNote}
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <CommandCard
          title={m("dashboard.pendingAdsTitle")}
          count={snap.pendingListingsReview}
          nextAction="Review flagged or pending listings before launch."
          footnote={snap.listingsQueryFallback ? m("dashboard.pendingAdsHintDb") : undefined}
          href={ADMIN_DASHBOARD_ROUTES.classifiedsReviewQueue}
          ctaLabel={m("dashboard.reviewAds")}
          variant="warning"
        />
        <CommandCard
          title={m("dashboard.reportsTitle")}
          count={snap.pendingReports}
          nextAction="Resolve listing reports and complaints."
          href={ADMIN_DASHBOARD_ROUTES.reports}
          ctaLabel={m("dashboard.viewReports")}
          variant="warning"
        />
        <CommandCard
          title="Leads needing response"
          count={displayCount(leads.leadsNeedingReply, leads.unavailable)}
          nextAction="Follow up on Launch Leads inbox."
          href={ADMIN_DASHBOARD_ROUTES.launchLeads}
          ctaLabel="Open Launch Leads"
          variant="primary"
        />
        <CommandCard
          title="Expired listings"
          count={expired.length}
          nextAction="Renew or archive expired ads."
          href="#expiration"
          ctaLabel="See expired"
          variant="view"
        />
        <CommandCard
          title="Expiring soon"
          count={expiringSoon.length}
          nextAction={`Within ${ADMIN_DASHBOARD_EXPIRING_SOON_DAYS} days.`}
          href="#expiration"
          ctaLabel="See expiring"
          variant="view"
        />
        <CommandCard
          title={m("dashboard.usersHelpTitle")}
          count={snap.usersNeedingHelpProxy}
          nextAction={snap.usersNeedingHelpNote}
          href={ADMIN_DASHBOARD_ROUTES.users}
          ctaLabel={m("dashboard.viewUsers")}
          variant="neutral"
        />
      </div>
    </AdminSectionCard>
  );

  const revenuePipelineSection = (
    <AdminSectionCard
      title="Revenue Pipeline"
      subtitle="Money follow-up — leads, quotes, catalog, entitlements, and payment ops."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <CommandCard
          title="Launch Leads"
          count={displayCount(leads.launchLeadsActive, leads.unavailable)}
          nextAction="Respond to new business inquiries."
          href={ADMIN_DASHBOARD_ROUTES.launchLeads}
          ctaLabel="Open Launch Leads"
          variant="primary"
        />
        <CommandCard
          title="Promo / print quotes"
          count={displayCount(leads.promoLeadsActive, leads.unavailable)}
          nextAction="Follow up on promotional product quotes."
          href={ADMIN_DASHBOARD_ROUTES.promocionales}
          ctaLabel="Open Promocionales"
          variant="primary"
        />
        <CommandCard
          title="Advertising leads"
          count={displayCount(leads.advertisingLeadsActive, leads.unavailable)}
          nextAction="Review advertising interest in Launch Leads."
          href={ADMIN_DASHBOARD_ROUTES.launchLeads}
          ctaLabel="Review advertising"
          variant="view"
        />
        <CommandCard
          title="Media kit requests"
          count={displayCount(leads.mediaKitActive, leads.unavailable)}
          nextAction="Reply to media kit interest."
          href={ADMIN_DASHBOARD_ROUTES.mediaKit}
          ctaLabel="Media kit inbox"
          variant="view"
        />
        <CommandCard
          title="Newsletter list"
          count={displayCount(leads.newsletterActive, leads.unavailable)}
          nextAction="Launch signup follow-up."
          href={ADMIN_DASHBOARD_ROUTES.newsletter}
          ctaLabel="Newsletter list"
          variant="active"
        />
        <CommandCard
          title="Tienda catalog (live)"
          count={catalogStats.error ? "Unavailable" : catalogStats.live}
          nextAction={catalogStats.error ? catalogStats.error : `${catalogStats.total} total catalog items`}
          href={ADMIN_DASHBOARD_ROUTES.catalog}
          ctaLabel="Open catalog"
          variant="active"
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
    </AdminSectionCard>
  );

  const marketplaceSection = (
    <AdminSectionCard title="Marketplace Operations" subtitle="Listings, categories, vertical ops, reports, and global lookup.">
      <AdminDashboardCtaGrid columns={2}>
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.categories} label="Categories / ad ops" variant="warning" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.classifiedsReviewQueue} label="Review ads queue" variant="warning" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.serviciosOps} label="Servicios ops" variant="active" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.autosOps} label="Autos ops" variant="active" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.restaurantesOps} label="Restaurantes ops" variant="active" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.viajesOps} label="Viajes ops" variant="active" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.reports} label="Reports & complaints" variant="warning" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.customerOps} label="Global Search" variant="view" />
      </AdminDashboardCtaGrid>
      <div className="mt-4 rounded-xl border border-[#C9B46A]/30 bg-[#FFFCF7]/80 p-3 text-xs text-[#5C5346]">
        Categories: {regSummary.live} live · {regSummary.staged} staged · {regSummary.comingSoon} coming soon (registry truth).
      </div>
    </AdminSectionCard>
  );

  const websiteSection = (
    <AdminSectionCard title="Website & Content Control" subtitle="Public sections, settings, magazine, and language quality.">
      <AdminDashboardCtaGrid columns={2}>
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.websiteSections} label="Site sections" variant="view" title={m("dashboard.linkWorkspaceTitle")} />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.siteSettings} label="Global site settings" variant="view" title={m("dashboard.linkSiteSettingsTitle")} />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.viewSite} label="View public site" variant="view" external />
        <AdminDashboardCta href="/admin/workspace/revista" label="Magazine" variant="neutral" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.newsletter} label="Newsletter" variant="neutral" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.mediaKit} label="Media kit" variant="neutral" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.languageAudit} label="Language audit" variant="neutral" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.globalSettings} label="Admin settings" variant="neutral" />
      </AdminDashboardCtaGrid>
      {snap.magazineFeaturedLabel ? (
        <p className="mt-4 text-xs text-[#7A7164]">
          Featured magazine: {snap.magazineFeaturedLabel}
          {snap.magazineUpdated ? ` · updated ${snap.magazineUpdated}` : ""}
        </p>
      ) : null}
    </AdminSectionCard>
  );

  const systemSection = (
    <AdminSectionCard title="Admin Team & System" subtitle="People, lookup, settings, audit trail, and support.">
      <AdminDashboardCtaGrid columns={2}>
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.teamRoster} label="Team roster" variant="active" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.createStaffUser} label="Create staff user" variant="primary" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.users} label="Users" variant="view" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.customerOps} label="Global Search" variant="view" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.globalSettings} label="Settings" variant="neutral" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.activityLog} label="Activity log" variant="neutral" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.support} label="Support tickets" variant="neutral" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.tienda} label="Tienda" variant="active" />
      </AdminDashboardCtaGrid>
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

  const sections: AdminCommandCenterSection[] = [
    { id: "today", label: "Today", content: todaysCommandSection },
    { id: "revenue", label: "Revenue", content: revenuePipelineSection },
    { id: "marketplace", label: "Marketplace", content: marketplaceSection },
    { id: "website", label: "Website", content: websiteSection },
    { id: "system", label: "System", content: systemSection },
    { id: "review", label: "Review", content: reviewWorkbenchSection },
    { id: "expiration", label: "Expiration", content: expirationWorkbenchSection },
  ];

  return (
    <div className="min-w-0 max-w-7xl overflow-x-hidden" data-testid="admin-ceo-command-center">
      {hero}
      {priorityStrip}
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
