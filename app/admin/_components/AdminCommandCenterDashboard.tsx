import type { ReactNode } from "react";
import { AdminCommandCenterClient, type AdminCommandCenterSection } from "./AdminCommandCenterClient";
import { AdminDashboardCta, AdminDashboardCtaGrid } from "./AdminDashboardCta";
import { AdminMonetizationLinksCard } from "./AdminMonetizationLinksCard";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminSectionCard } from "./AdminSectionCard";
import { AdminStatCard } from "./AdminStatCard";
import {
  adminCardBase,
  adminDashboardMetricChip,
  adminDashboardUrgentBadge,
  adminWarningCallout,
} from "./adminTheme";
import {
  ADMIN_DASHBOARD_EXPIRING_SOON_DAYS,
  adminDashboardReviewReasonLabel,
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

function fmt(iso: string, locale: string) {
  try {
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) : iso;
  } catch {
    return iso;
  }
}

function ExpiringRow({
  row,
  m,
  locale,
}: {
  row: AdminDashboardExpiringQueueRow;
  m: Msg;
  locale: string;
}) {
  return (
    <li className="rounded-2xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 px-3 py-3 text-sm break-words">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#1E1810]">{row.title}</p>
          <p className="text-xs text-[#7A7164]">
            {row.categorySource} · status: {row.status ?? "—"}
          </p>
          <p className="mt-1 text-xs text-[#5C5346]">
            {m("dashboard.expiresLabel")}{" "}
            <time dateTime={row.expiresAtIso}>{fmt(row.expiresAtIso, locale)}</time>
            <span className="text-[#9A9084]"> ({row.expirationFieldLabel})</span>
          </p>
        </div>
        {row.isExpired ? (
          <span className={adminDashboardUrgentBadge}>❗ Expired</span>
        ) : row.isExpiringSoon ? (
          <span className="inline-flex shrink-0 rounded-md border border-[#C9782F]/50 bg-[#FFF4E8] px-2 py-0.5 text-[10px] font-bold uppercase text-[#8B4A12]">
            Expiring soon
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <AdminDashboardCta href={row.adminHref} label={m("dashboard.adminQueue")} variant="view" className="!min-h-[40px] !w-auto !px-3 !py-2 !text-xs" />
        {row.publicHref ? (
          <AdminDashboardCta href={row.publicHref} label={m("dashboard.viewPublic")} variant="active" external className="!min-h-[40px] !w-auto !px-3 !py-2 !text-xs" />
        ) : (
          <span className="rounded-lg border border-dashed border-[#D8D0C4] px-2 py-1 text-[10px] font-semibold text-[#9A9084]">
            {m("dashboard.noPublicUrl")}
          </span>
        )}
      </div>
    </li>
  );
}

function ReviewRow({
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

  return (
    <li className="rounded-2xl border border-[#E8DFD0]/80 bg-white/90 px-3 py-3 text-sm break-words">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {urgent ? <span className={adminDashboardUrgentBadge} aria-label="Urgent review">❗</span> : null}
            <p className="font-medium text-[#1E1810]">{row.title}</p>
          </div>
          <p className="text-xs text-[#7A7164]">
            {row.categorySource} · status: {row.status}
          </p>
          {row.updatedAtIso ? (
            <p className="mt-1 text-xs text-[#5C5346]">
              {m("dashboard.updatedLabel")}{" "}
              <time dateTime={row.updatedAtIso}>{fmt(row.updatedAtIso, locale)}</time>
            </p>
          ) : null}
          <p className="mt-1 text-xs text-[#5C5346]">
            {m("dashboard.reasonLabel")} {reason}
          </p>
        </div>
        <span className="rounded-md border border-[#C9B46A]/40 bg-[#FFFCF7] px-2 py-0.5 text-[10px] font-bold uppercase text-[#5C4E2E]">
          {row.status}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <AdminDashboardCta href={row.adminHref} label={m("dashboard.adminQueue")} variant="warning" className="!min-h-[40px] !w-auto !px-3 !py-2 !text-xs" />
        {row.ownerUserId ? (
          <AdminDashboardCta href={`/admin/usuarios/${row.ownerUserId}`} label={m("dashboard.sellerCard")} variant="neutral" className="!min-h-[40px] !w-auto !px-3 !py-2 !text-xs" />
        ) : null}
      </div>
    </li>
  );
}

function AttentionMetric({
  label,
  value,
  hint,
  href,
  ctaLabel,
  variant,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  href: string;
  ctaLabel: string;
  variant: "primary" | "warning" | "view" | "active" | "neutral";
}) {
  return (
    <div className={`${adminCardBase} break-words p-4`}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-[#1E1810]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[#5C5346]/90">{hint}</p> : null}
      <AdminDashboardCta href={href} label={ctaLabel} variant={variant} className="mt-3" />
    </div>
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
  const urgentReview = snap.pendingReviewQueueItems.filter(isAdminDashboardUrgentReviewRow);

  const summary = (
    <div className={`${adminCardBase} border-[#C9B46A]/40 bg-[#FFFCF7]/95 p-4 sm:p-5`} data-testid="admin-dashboard-summary">
      <h2 className="font-serif text-xl font-bold text-[#1E1810] sm:text-2xl">Today&apos;s command snapshot</h2>
      <p className="mt-1 text-sm text-[#5C5346]">What needs attention, revenue follow-up, and urgent review — live Supabase counts only.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className={adminDashboardMetricChip}>Review {snap.pendingListingsReview + snap.pendingReviewQueueItems.length}</span>
        <span className={adminDashboardMetricChip}>Reports {snap.pendingReports}</span>
        <span className={adminDashboardMetricChip}>
          Leads {leads.unavailable ? "—" : leads.leadsNeedingReply} need reply
        </span>
        <span className={adminDashboardMetricChip}>Expiring {expiringSoon.length}</span>
        <span className={adminDashboardMetricChip}>Expired {expired.length}</span>
      </div>
    </div>
  );

  const attentionSection = (
    <AdminSectionCard title="Today's Attention" subtitle="Urgent review, pending ads, expiring listings, reports, and leads needing response.">
      {leads.unavailable ? (
        <div className={adminWarningCallout}>
          <strong>Lead counts unavailable.</strong> {leads.unavailableNote}
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <AttentionMetric
          label={m("dashboard.pendingAdsTitle")}
          value={snap.pendingListingsReview}
          hint={snap.listingsQueryFallback ? m("dashboard.pendingAdsHintDb") : m("dashboard.pendingAdsHint")}
          href={ADMIN_DASHBOARD_ROUTES.classifiedsQueue}
          ctaLabel={m("dashboard.reviewAds")}
          variant="warning"
        />
        <AttentionMetric
          label={m("dashboard.reportsTitle")}
          value={snap.pendingReports}
          hint={m("dashboard.reportsHint")}
          href={ADMIN_DASHBOARD_ROUTES.reports}
          ctaLabel={m("dashboard.viewReports")}
          variant="warning"
        />
        <AttentionMetric
          label="Leads needing response"
          value={leads.unavailable ? "—" : leads.leadsNeedingReply}
          hint={leads.unavailable ? leads.unavailableNote ?? undefined : "Active Launch Leads with status new or needs_reply."}
          href={ADMIN_DASHBOARD_ROUTES.launchLeads}
          ctaLabel="Open Launch Leads"
          variant="primary"
        />
        <AttentionMetric
          label="Expiring soon"
          value={expiringSoon.length}
          hint={`Real expiration within ${ADMIN_DASHBOARD_EXPIRING_SOON_DAYS} days.`}
          href="#admin-cmd-expiring"
          ctaLabel="See expiring"
          variant="view"
        />
        <AttentionMetric
          label="Expired listings"
          value={expired.length}
          hint="Already past expiration timestamp."
          href="#admin-cmd-expiring"
          ctaLabel="See expired"
          variant="view"
        />
        <AttentionMetric
          label={m("dashboard.usersHelpTitle")}
          value={snap.usersNeedingHelpProxy}
          hint={snap.usersNeedingHelpNote}
          href={ADMIN_DASHBOARD_ROUTES.users}
          ctaLabel={m("dashboard.viewUsers")}
          variant="neutral"
        />
      </div>
      {urgentReview.length > 0 ? (
        <p className="mt-4 text-xs font-semibold text-rose-900">
          ❗ {urgentReview.length} urgent review item(s) — see Review section below.
        </p>
      ) : null}
    </AdminSectionCard>
  );

  const moneySection = (
    <AdminSectionCard title="Money Pipeline" subtitle="Revenue follow-up: leads, promo quotes, advertising, media kit, newsletter, and Tienda ops.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className={`${adminCardBase} p-4`}>
          <p className="text-[11px] font-bold uppercase text-[#7A7164]">Launch Leads</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">{leads.unavailable ? "—" : leads.launchLeadsActive}</p>
          <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.launchLeads} label="Open Launch Leads" variant="primary" className="mt-3" />
        </div>
        <div className={`${adminCardBase} p-4`}>
          <p className="text-[11px] font-bold uppercase text-[#7A7164]">Promocionales</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">{leads.unavailable ? "—" : leads.promoLeadsActive}</p>
          <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.promocionales} label="Open Promocionales" variant="primary" className="mt-3" />
        </div>
        <div className={`${adminCardBase} p-4`}>
          <p className="text-[11px] font-bold uppercase text-[#7A7164]">Advertising leads</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">{leads.unavailable ? "—" : leads.advertisingLeadsActive}</p>
          <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.launchLeads} label="Review advertising" variant="view" className="mt-3" />
        </div>
        <div className={`${adminCardBase} p-4`}>
          <p className="text-[11px] font-bold uppercase text-[#7A7164]">Media kit</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">{leads.unavailable ? "—" : leads.mediaKitActive}</p>
          <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.mediaKit} label="Media kit inbox" variant="view" className="mt-3" />
        </div>
        <div className={`${adminCardBase} p-4`}>
          <p className="text-[11px] font-bold uppercase text-[#7A7164]">Newsletter</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">{leads.unavailable ? "—" : leads.newsletterActive}</p>
          <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.newsletter} label="Newsletter list" variant="active" className="mt-3" />
        </div>
        <div className={`${adminCardBase} p-4`}>
          <p className="text-[11px] font-bold uppercase text-[#7A7164]">Tienda catalog</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">{catalogStats.error ? "—" : catalogStats.live}</p>
          <p className="mt-1 text-xs text-[#7A7164]">{catalogStats.error ? catalogStats.error : `${catalogStats.total} total items`}</p>
          <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.catalog} label="Open catalog" variant="active" className="mt-3" />
        </div>
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

  const quickActionsSection = (
    <AdminSectionCard title="Quick Actions" subtitle="Rectangular command CTAs — full-width on phone, grid on tablet+.">
      <AdminDashboardCtaGrid columns={2}>
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.launchLeads} label="Open Launch Leads" variant="primary" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.promocionales} label="Open Promocionales" variant="primary" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.classifiedsQueue} label="Open Classifieds Queue" variant="warning" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.createStaffUser} label="Create Staff User" variant="active" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.team} label="Manage Team" variant="active" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.websiteSections} label="Open Website Sections" variant="view" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.globalSettings} label="Open Global Settings" variant="view" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.tienda} label="Open Tienda" variant="active" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.catalog} label="Open Catalog" variant="active" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.viewSite} label="View Public Site" variant="view" external />
      </AdminDashboardCtaGrid>
    </AdminSectionCard>
  );

  const reviewSection = (
    <AdminSectionCard title={m("dashboard.pendingReviewTitle")} subtitle={m("dashboard.pendingReviewSub")}>
      <ul className="space-y-3">
        {snap.pendingReviewQueueItems.length === 0 ? (
          <li className="text-sm text-[#5C5346]/90">{m("dashboard.pendingReviewEmpty")}</li>
        ) : (
          snap.pendingReviewQueueItems.map((row) => <ReviewRow key={`${row.source}-${row.internalId}`} row={row} m={m} locale={locale} />)
        )}
      </ul>
    </AdminSectionCard>
  );

  const expiringSection = (
    <AdminSectionCard
      title={m("dashboard.expiringTitle")}
      subtitle={`${m("dashboard.expiringSub")} Expiring soon = within ${ADMIN_DASHBOARD_EXPIRING_SOON_DAYS} days.`}
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-[#1E1810]">Expiring soon ({ADMIN_DASHBOARD_EXPIRING_SOON_DAYS} days)</h3>
          <ul className="mt-3 space-y-3">
            {expiringSoon.length === 0 ? (
              <li className="text-sm text-[#5C5346]/90">No ads expiring within {ADMIN_DASHBOARD_EXPIRING_SOON_DAYS} days.</li>
            ) : (
              expiringSoon.map((row) => <ExpiringRow key={`soon-${row.source}-${row.internalId}`} row={row} m={m} locale={locale} />)
            )}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#1E1810]">Expired</h3>
          <ul className="mt-3 space-y-3">
            {expired.length === 0 ? (
              <li className="text-sm text-[#5C5346]/90">No expired ads in the current queue sample.</li>
            ) : (
              expired.map((row) => <ExpiringRow key={`exp-${row.source}-${row.internalId}`} row={row} m={m} locale={locale} />)
            )}
          </ul>
        </div>
      </div>
    </AdminSectionCard>
  );

  const operationsSection = (
    <AdminSectionCard title="Operations" subtitle="Active admin areas — categories, leads, team, customer ops, Tienda, and site sections.">
      <AdminDashboardCtaGrid columns={2}>
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.categories} label="Categories / ad ops" variant="warning" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.launchLeads} label="Launch Leads" variant="primary" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.promocionales} label="Promocionales" variant="primary" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.teamRoster} label="Team roster" variant="active" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.users} label="Users" variant="view" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.customerOps} label="Customer Ops" variant="view" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.tienda} label="Tienda" variant="active" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.websiteSections} label="Site sections" variant="view" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.newsletter} label="Newsletter" variant="neutral" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.mediaKit} label="Media kit" variant="neutral" />
        <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.siteSettings} label="Site-wide settings" variant="neutral" />
        <AdminDashboardCta href="/admin/workspace/revista" label="Magazine" variant="neutral" />
      </AdminDashboardCtaGrid>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <AdminStatCard
          title={m("dashboard.magazineTitle")}
          value={snap.magazineFeaturedLabel ?? "—"}
          hint={snap.magazineUpdated ? m("dashboard.magazineHintUpdated", { date: snap.magazineUpdated }) : m("dashboard.magazineHintApi")}
          icon="📰"
          actionLabel={m("dashboard.manageMagazines")}
          actionHref="/admin/workspace/revista"
          actionTitle={m("dashboard.manageMagazinesTitle")}
        />
        <AdminSectionCard
          title={m("dashboard.categoriesCommandTitle")}
          subtitle={m("dashboard.categoriesSub", {
            live: String(regSummary.live),
            staged: String(regSummary.staged),
            comingSoon: String(regSummary.comingSoon),
          })}
          className="!p-4"
        >
          <p className="text-sm text-[#5C5346]">{m("dashboard.categoriesCommandBody")}</p>
          <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.categories} label={`${m("dashboard.manageCategories")} →`} variant="warning" className="mt-4 !w-auto" />
        </AdminSectionCard>
      </div>
    </AdminSectionCard>
  );

  const sections: AdminCommandCenterSection[] = [
    { id: "attention", label: "Today", content: attentionSection },
    { id: "money", label: "Money", content: moneySection },
    { id: "actions", label: "Actions", content: quickActionsSection },
    { id: "review", label: "Review", content: reviewSection },
    { id: "expiring", label: "Expiring", content: expiringSection },
    { id: "operations", label: "Ops", content: operationsSection },
  ];

  return (
    <div className="min-w-0 max-w-7xl">
      <AdminPageHeader title={m("dashboard.title")} subtitle={m("dashboard.subtitle")} helperText={m("dashboard.helper")} />

      <div className="mb-6 rounded-2xl border border-[#C9B46A]/35 bg-[#FFFCF7]/95 p-4 text-sm text-[#5C5346] sm:p-5">
        <p className="font-serif text-base font-bold text-[#1E1810]">{m("dashboard.editSectionsTitle")}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-[#7A7164]">{m("dashboard.editSectionsBody")}</p>
        <div className="mt-4">
          <AdminDashboardCtaGrid columns={2}>
            <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.websiteSections} label={m("dashboard.linkWorkspace")} variant="view" title={m("dashboard.linkWorkspaceTitle")} />
            <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.siteSettings} label={m("dashboard.linkSiteSettings")} variant="view" title={m("dashboard.linkSiteSettingsTitle")} />
            <AdminDashboardCta href={ADMIN_DASHBOARD_ROUTES.customerOps} label={m("dashboard.linkOps")} variant="neutral" title={m("dashboard.linkOpsTitle")} />
          </AdminDashboardCtaGrid>
        </div>
      </div>

      <AdminCommandCenterClient summary={summary} sections={sections} />

      <div className="mt-8 rounded-2xl border border-dashed border-[#C9B46A]/50 bg-[#FFF8F0]/80 p-4 text-xs text-[#7A7164] break-words">
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
