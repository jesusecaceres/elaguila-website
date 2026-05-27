import Link from "next/link";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import { AdminQuickActionsRail } from "../_components/AdminQuickActionsRail";
import { AdminSectionCard } from "../_components/AdminSectionCard";
import { AdminStatCard } from "../_components/AdminStatCard";
import { adminCardBase, adminCtaChip, adminCtaChipSecondary } from "../_components/adminTheme";
import { getAdminDashboardSnapshot } from "../_lib/adminDashboardData";
import {
  adminCategoryOpenQueueCtaCopy,
  adminCategoryOperationalStatusLabel,
  adminCategoryWorkspaceLiveListingsHref,
  adminCategoryWorkspaceQueueHref,
} from "../_lib/adminCategoryWorkspaceQueueHref";
import { getClasificadosCategoryRegistryMerged, summarizeRegistryForDashboard } from "@/app/lib/clasificados/clasificadosCategoryRegistry";
import {
  benefitLabels,
  effectiveEntitlementStatus,
  formatEntitlementListingHeadline,
  formatEntitlementPricingPromoLine,
  formatSalesRepAttribution,
  getPackageEntitlementDashboardSnapshot,
} from "../_lib/packageEntitlementData";
import { getPromoCodeDashboardSnapshot } from "../_lib/promoCodeData";
import { getPaymentTrackerDashboardSnapshot } from "../_lib/paymentTrackerData";
import {
  canViewPaymentTracker,
  getCurrentAdminAccessContext,
  isSalesRepRole,
} from "../_lib/adminAccessControl";
import { getAdminLang, adminMessages } from "../_lib/adminI18n";

export const dynamic = "force-dynamic";

function fmt(iso: string, locale: string) {
  try {
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) : iso;
  } catch {
    return iso;
  }
}

export default async function AdminHomePage() {
  const lang = await getAdminLang();
  const m = adminMessages(lang);
  const locale: string = lang === "es" ? "es-MX" : "en-US";
  const access = await getCurrentAdminAccessContext();
  const salesRepLocked = isSalesRepRole(access.normalizedRole);

  if (salesRepLocked) {
    return (
      <div className="max-w-3xl space-y-6">
        <AdminPageHeader
          title={lang === "es" ? "Panel de ventas" : "Sales workspace"}
          subtitle={
            lang === "es"
              ? "Acceso limitado: solo tus códigos promo, paquetes y seguimiento de ventas."
              : "Limited access: your promo codes, package entitlements, and sales tracker only."
          }
          helperText={
            lang === "es"
              ? "Sin acceso a pagos globales, equipo, CMS ni configuración del sitio."
              : "No global payments, team, CMS, or site settings."
          }
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <AdminStatCard
            title={lang === "es" ? "Códigos promo" : "Promo codes"}
            value="→"
            hint={lang === "es" ? "Crear y administrar tus códigos" : "Create and manage your codes"}
            icon="🏷️"
            actionLabel={lang === "es" ? "Abrir" : "Open"}
            actionHref="/admin/workspace/promo-codes"
          />
          <AdminStatCard
            title={lang === "es" ? "Paquetes" : "Package entitlements"}
            value="→"
            hint={lang === "es" ? "Tus paquetes Print-to-Digital" : "Your Print-to-Digital packages"}
            icon="📦"
            actionLabel={lang === "es" ? "Abrir" : "Open"}
            actionHref="/admin/workspace/package-entitlements"
          />
          <AdminStatCard
            title={lang === "es" ? "Seguimiento" : "Sales tracker"}
            value="→"
            hint={lang === "es" ? "Resumen y comisión (preview)" : "Summary and commission preview"}
            icon="📊"
            actionLabel={lang === "es" ? "Abrir" : "Open"}
            actionHref="/admin/workspace/sales-tracker"
          />
        </div>
      </div>
    );
  }

  const [snap, entSnap, promoSnap, paySnap, registry] = await Promise.all([
    getAdminDashboardSnapshot(),
    getPackageEntitlementDashboardSnapshot(),
    getPromoCodeDashboardSnapshot(),
    canViewPaymentTracker(access.normalizedRole)
      ? getPaymentTrackerDashboardSnapshot()
      : Promise.resolve({
          unavailable: true,
          note: null,
          pendingCount: 0,
          paidCount: 0,
          commissionEligibleCount: 0,
        }),
    getClasificadosCategoryRegistryMerged(),
  ]);
  const regSum = summarizeRegistryForDashboard(registry);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
      <div className="min-w-0">
        <AdminPageHeader title={m("dashboard.title")} subtitle={m("dashboard.subtitle")} helperText={m("dashboard.helper")} />

        <div className="mb-6 rounded-2xl border border-[#C9B46A]/35 bg-[#FFFCF7]/95 p-4 text-sm text-[#5C5346] sm:p-5">
          <p className="text-base font-bold text-[#1E1810]">{m("dashboard.editSectionsTitle")}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-[#7A7164]">{m("dashboard.editSectionsBody")}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-3">
            <Link href="/admin/workspace" className={`${adminCtaChip} w-full justify-center sm:w-auto`} title={m("dashboard.linkWorkspaceTitle")}>
              {m("dashboard.linkWorkspace")}
            </Link>
            <Link href="/admin/site-settings" className={`${adminCtaChip} w-full justify-center sm:w-auto`} title={m("dashboard.linkSiteSettingsTitle")}>
              {m("dashboard.linkSiteSettings")}
            </Link>
            <Link href="/admin/ops" className={`${adminCtaChip} w-full justify-center sm:w-auto`} title={m("dashboard.linkOpsTitle")}>
              {m("dashboard.linkOps")}
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard
            title={m("dashboard.entitlementsHubTitle")}
            value={entSnap.dataUnavailable ? "—" : entSnap.activeCount}
            hint={
              entSnap.dataUnavailable
                ? (entSnap.dataUnavailableNote ?? m("dashboard.entitlementsMigrateHint"))
                : m("dashboard.entitlementsHubHint")
            }
            icon="📦"
            actionLabel={m("dashboard.entitlementsCreate")}
            actionHref="/admin/workspace/package-entitlements"
            actionTitle={m("dashboard.entitlementsCreateTitle")}
            accent="amber"
          />
          <AdminStatCard
            title={m("dashboard.entitlementsActiveTitle")}
            value={entSnap.dataUnavailable ? "—" : entSnap.activeCount}
            hint={m("dashboard.entitlementsActiveHint")}
            icon="✓"
            actionLabel={m("dashboard.entitlementsViewAll")}
            actionHref="/admin/workspace/package-entitlements"
            actionTitle={m("dashboard.entitlementsViewAllTitle")}
          />
          <AdminStatCard
            title={m("dashboard.entitlementsExpiringTitle")}
            value={entSnap.dataUnavailable ? "—" : entSnap.expiringSoonCount}
            hint={m("dashboard.entitlementsExpiringHint")}
            icon="⏳"
            actionLabel={m("dashboard.entitlementsViewAll")}
            actionHref="/admin/workspace/package-entitlements"
            actionTitle={m("dashboard.entitlementsViewAllTitle")}
          />
          <AdminStatCard
            title={m("dashboard.entitlementsRevokedTitle")}
            value={entSnap.dataUnavailable ? "—" : entSnap.revokedOrExpiredCount}
            hint={m("dashboard.entitlementsRevokedHint")}
            icon="⊘"
            actionLabel={m("dashboard.entitlementsViewAll")}
            actionHref="/admin/workspace/package-entitlements"
            actionTitle={m("dashboard.entitlementsViewAllTitle")}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <AdminStatCard
            title={m("dashboard.promoCodesActiveTitle")}
            value={promoSnap.dataUnavailable ? "—" : promoSnap.activeCount}
            hint={
              promoSnap.dataUnavailable
                ? (promoSnap.dataUnavailableNote ?? m("dashboard.promoCodesMigrateHint"))
                : m("dashboard.promoCodesActiveHint")
            }
            icon="🏷️"
            actionLabel={m("dashboard.promoCodesViewAll")}
            actionHref="/admin/workspace/promo-codes"
            actionTitle={m("dashboard.promoCodesViewAllTitle")}
          />
          <AdminStatCard
            title={m("dashboard.promoCodesExpiringTitle")}
            value={promoSnap.dataUnavailable ? "—" : promoSnap.expiringSoonCount}
            hint={m("dashboard.promoCodesExpiringHint")}
            icon="⏳"
            actionLabel={m("dashboard.promoCodesViewAll")}
            actionHref="/admin/workspace/promo-codes"
            actionTitle={m("dashboard.promoCodesViewAllTitle")}
          />
          <AdminStatCard
            title={m("dashboard.promoCodesInactiveTitle")}
            value={promoSnap.dataUnavailable ? "—" : promoSnap.revokedOrExpiredCount}
            hint={m("dashboard.promoCodesInactiveHint")}
            icon="⊘"
            actionLabel={m("dashboard.promoCodesViewAll")}
            actionHref="/admin/workspace/promo-codes"
            actionTitle={m("dashboard.promoCodesViewAllTitle")}
          />
        </div>

        {canViewPaymentTracker(access.normalizedRole) ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <AdminStatCard
            title={m("dashboard.paymentTrackerPendingTitle")}
            value={paySnap.unavailable ? "—" : paySnap.pendingCount}
            hint={
              paySnap.unavailable
                ? (paySnap.note ?? m("dashboard.paymentTrackerMigrateHint"))
                : m("dashboard.paymentTrackerPendingHint")
            }
            icon="💳"
            actionLabel={m("dashboard.paymentTrackerViewAll")}
            actionHref="/admin/workspace/payment-tracker"
            actionTitle={m("dashboard.paymentTrackerViewAllTitle")}
          />
          <AdminStatCard
            title={m("dashboard.paymentTrackerPaidTitle")}
            value={paySnap.unavailable ? "—" : paySnap.paidCount}
            hint={m("dashboard.paymentTrackerPaidHint")}
            icon="✓"
            actionLabel={m("dashboard.paymentTrackerViewAll")}
            actionHref="/admin/workspace/payment-tracker"
            actionTitle={m("dashboard.paymentTrackerViewAllTitle")}
          />
          <AdminStatCard
            title={m("dashboard.paymentTrackerCommissionTitle")}
            value={paySnap.unavailable ? "—" : paySnap.commissionEligibleCount}
            hint={m("dashboard.paymentTrackerCommissionHint")}
            icon="📊"
            actionLabel={m("dashboard.paymentTrackerViewAll")}
            actionHref="/admin/workspace/payment-tracker"
            actionTitle={m("dashboard.paymentTrackerViewAllTitle")}
          />
        </div>
        ) : null}

        <div className="mt-8">
          <AdminSectionCard title={m("dashboard.recentEntitlementsTitle")} subtitle={m("dashboard.recentEntitlementsSub")}>
            <ul className="space-y-3">
              {entSnap.recent.length === 0 ? (
                <li className="text-sm text-[#5C5346]/90">
                  {entSnap.dataUnavailable ? m("dashboard.entitlementsEmptyUnavailable") : m("dashboard.entitlementsEmpty")}
                </li>
              ) : (
                entSnap.recent.map((row) => {
                  const effective = effectiveEntitlementStatus(row);
                  const labels = benefitLabels(row.benefits);
                  const pricingLine = formatEntitlementPricingPromoLine(row.metadata);
                  const salesRep = formatSalesRepAttribution(row.metadata);
                  return (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-bold text-[#1E1810]">{row.entitlement_code ?? "—"}</p>
                        <p className="truncate font-semibold text-[#1E1810]">{formatEntitlementListingHeadline(row)}</p>
                        <p className="text-xs text-[#7A7164]">
                          {row.package_tier} · {row.category} · {effective}
                        </p>
                        {pricingLine ? (
                          <p className="mt-0.5 text-[10px] text-[#5C5346]">{pricingLine}</p>
                        ) : null}
                        {salesRep ? <p className="text-[10px] text-[#7A7164]">Sales rep: {salesRep}</p> : null}
                        <p className="mt-0.5 text-[10px] text-[#5C5346]">
                          {labels.length ? labels.join(" · ") : "—"}
                        </p>
                      </div>
                      <Link
                        href="/admin/workspace/package-entitlements"
                        className="shrink-0 text-xs font-bold text-[#6B5B2E] underline"
                        title={m("dashboard.viewEntitlementTitle")}
                      >
                        {m("dashboard.viewEntitlement")}
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/admin/workspace/package-entitlements" className={adminCtaChipSecondary}>
                {m("dashboard.entitlementsViewAll")} →
              </Link>
              <Link href="/admin/workspace/package-entitlements" className={adminCtaChip}>
                {m("dashboard.entitlementsCreate")} →
              </Link>
            </div>
          </AdminSectionCard>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            title={m("dashboard.pendingAdsTitle")}
            value={snap.pendingListingsReview}
            hint={snap.listingsQueryFallback ? m("dashboard.pendingAdsHintDb") : m("dashboard.pendingAdsHint")}
            icon="📣"
            actionLabel={m("dashboard.reviewAds")}
            actionHref="/admin/workspace/clasificados"
            actionTitle={m("dashboard.reviewAdsTitle")}
            accent="rose"
          />
          <AdminStatCard
            title={m("dashboard.usersHelpTitle")}
            value={snap.usersNeedingHelpProxy}
            hint={snap.usersNeedingHelpNote}
            icon="🆘"
            actionLabel={m("dashboard.viewUsers")}
            actionHref="/admin/usuarios"
            actionTitle={m("dashboard.viewUsersTitle")}
          />
          <AdminStatCard
            title={m("dashboard.magazineTitle")}
            value={snap.magazineFeaturedLabel ?? "—"}
            hint={
              snap.magazineUpdated ? m("dashboard.magazineHintUpdated", { date: snap.magazineUpdated }) : m("dashboard.magazineHintApi")
            }
            icon="📰"
            actionLabel={m("dashboard.manageMagazines")}
            actionHref="/admin/workspace/revista"
            actionTitle={m("dashboard.manageMagazinesTitle")}
          />
          <AdminStatCard
            title={m("dashboard.reportsTitle")}
            value={snap.pendingReports}
            hint={m("dashboard.reportsHint")}
            icon="⚠️"
            actionLabel={m("dashboard.viewReports")}
            actionHref="/admin/reportes"
            actionTitle={m("dashboard.viewReportsTitle")}
            accent="amber"
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <AdminSectionCard title={m("dashboard.expiringTitle")} subtitle={m("dashboard.expiringSub")}>
            <ul className="space-y-3">
              {snap.expiringQueueItems.length === 0 ? (
                <li className="text-sm text-[#5C5346]/90">{m("dashboard.expiringEmpty")}</li>
              ) : (
                snap.expiringQueueItems.map((row) => (
                  <li
                    key={`${row.source}-${row.internalId}`}
                    className="rounded-2xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[#1E1810]">{row.title}</p>
                        <p className="text-xs text-[#7A7164]">
                          {row.categorySource} · status: {row.status ?? "—"}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-[#3D3428]">
                          ID: {row.internalId}
                          {row.leonixAdId ? (
                            <>
                              {" "}
                              · Leonix: <span className="font-bold">{row.leonixAdId}</span>
                            </>
                          ) : null}
                        </p>
                        {row.ownerUserId ? (
                          <p className="mt-0.5 font-mono text-[10px] text-[#7A7164]">
                            {row.source === "generic_listings" ? "owner_id" : "owner_user_id"}: {row.ownerUserId}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-[#5C5346]">
                          {m("dashboard.expiresLabel")}{" "}
                          <time dateTime={row.expiresAtIso}>{fmt(row.expiresAtIso, locale)}</time>
                          <span className="text-[#9A9084]"> ({row.expirationFieldLabel})</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {row.isExpired ? (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-900">
                            Expired
                          </span>
                        ) : row.isExpiringSoon ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-950">
                            Expiring soon
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#EEF6FF] px-2 py-0.5 text-[10px] font-bold uppercase text-[#2F4A65]">
                            Active window
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link
                        href={row.adminHref}
                        className="rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] px-2 py-1 text-xs font-semibold text-[#2C2416]"
                        title={m("dashboard.adminQueueTitle")}
                      >
                        {m("dashboard.adminQueue")}
                      </Link>
                      {row.publicHref ? (
                        <Link
                          href={row.publicHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-900"
                          title={m("dashboard.viewPublicTitle")}
                        >
                          {m("dashboard.viewPublic")}
                        </Link>
                      ) : (
                        <span className="rounded-xl border border-dashed border-[#D8D0C4] px-2 py-1 text-[10px] font-semibold text-[#9A9084]">
                          {m("dashboard.noPublicUrl")}
                        </span>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </AdminSectionCard>

          <AdminSectionCard title={m("dashboard.pendingReviewTitle")} subtitle={m("dashboard.pendingReviewSub")}>
            <ul className="space-y-3">
              {snap.pendingReviewQueueItems.length === 0 ? (
                <li className="text-sm text-[#5C5346]/90">{m("dashboard.pendingReviewEmpty")}</li>
              ) : (
                snap.pendingReviewQueueItems.map((row) => (
                  <li
                    key={`${row.source}-${row.internalId}`}
                    className="rounded-2xl border border-[#E8DFD0]/80 bg-white/90 px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[#1E1810]">{row.title}</p>
                        <p className="text-xs text-[#7A7164]">
                          {row.categorySource} · status: {row.status}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-[#3D3428]">
                          ID: {row.internalId}
                          {row.leonixAdId ? (
                            <>
                              {" "}
                              · Leonix: <span className="font-bold">{row.leonixAdId}</span>
                            </>
                          ) : null}
                        </p>
                        {row.ownerUserId ? (
                          <p className="mt-0.5 font-mono text-[10px] text-[#7A7164]">
                            {row.source === "generic_listings" ? "owner_id" : "owner_user_id"}: {row.ownerUserId}
                          </p>
                        ) : null}
                        {row.updatedAtIso ? (
                          <p className="mt-1 text-xs text-[#5C5346]">
                            {m("dashboard.updatedLabel")}{" "}
                            <time dateTime={row.updatedAtIso}>{fmt(row.updatedAtIso, locale)}</time>
                          </p>
                        ) : null}
                        {row.reason ? (
                          <p className="mt-1 text-xs text-[#5C5346]">
                            {m("dashboard.reasonLabel")} {row.reason}
                          </p>
                        ) : null}
                      </div>
                      <span className="rounded-full bg-[#FBF7EF] px-2 py-0.5 text-[10px] font-bold uppercase text-[#5C4E2E]">
                        {row.status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link
                        href={row.adminHref}
                        className="rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] px-2 py-1 text-xs font-semibold text-[#2C2416]"
                        title={m("dashboard.openAdminQueueTitle")}
                      >
                        {m("dashboard.adminQueue")}
                      </Link>
                      {row.ownerUserId ? (
                        <Link
                          href={`/admin/usuarios/${row.ownerUserId}`}
                          className="rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] px-2 py-1 text-xs font-semibold text-[#2C2416]"
                          title={m("dashboard.sellerCardTitle")}
                        >
                          {m("dashboard.sellerCard")}
                        </Link>
                      ) : null}
                      {row.publicHref ? (
                        <Link
                          href={row.publicHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-900"
                          title={m("dashboard.viewPublicTitle")}
                        >
                          {m("dashboard.viewPublic")}
                        </Link>
                      ) : (
                        <span className="rounded-xl border border-dashed border-[#D8D0C4] px-2 py-1 text-[10px] font-semibold text-[#9A9084]">
                          {m("dashboard.noPublicUrl")}
                        </span>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </AdminSectionCard>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <AdminSectionCard
            title={m("dashboard.categoriesTitle")}
            subtitle={m("dashboard.categoriesSub", {
              live: String(regSum.live),
              staged: String(regSum.staged),
              comingSoon: String(regSum.comingSoon),
            })}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {registry.map((c) => {
                const queueHref = adminCategoryWorkspaceQueueHref(c.slug);
                const liveHref = adminCategoryWorkspaceLiveListingsHref(c.slug);
                const cta = adminCategoryOpenQueueCtaCopy(lang);
                return (
                  <div
                    key={c.slug}
                    className={`${adminCardBase} flex flex-col p-4`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xl" aria-hidden>
                        {c.emoji}
                      </span>
                      <div className="flex flex-col items-end gap-1">
                        <span className="rounded-full bg-[#FBF7EF] px-2 py-0.5 text-[10px] font-bold uppercase text-[#5C4E2E]">
                          {adminCategoryOperationalStatusLabel(c.operationalStatus)}
                        </span>
                        {c.configLayer === "database" ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-900">
                            DB
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-2 font-bold text-[#1E1810]">{c.displayNameEs}</p>
                    <p className="text-xs text-[#7A7164]">{c.slug}</p>
                    <div className="mt-3 flex flex-col gap-2">
                      <Link
                        href={queueHref}
                        className="text-xs font-bold text-[#6B5B2E] underline underline-offset-2"
                        aria-label={`${c.displayNameEs}: ${cta.label}`}
                        title={cta.title}
                      >
                        {cta.label} →
                      </Link>
                      <Link
                        href={liveHref}
                        className="text-xs font-bold text-emerald-900 underline underline-offset-2"
                        aria-label={`${c.displayNameEs}: ${m("cta.liveListingsPrimary")}`}
                        title={m("cta.liveListingsPrimaryTitle")}
                      >
                        {m("cta.liveListingsPrimary")} →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link href="/admin/workspace/clasificados" className={`${adminCtaChipSecondary} mt-4 inline-flex`}>
              {m("dashboard.manageCategories")}
            </Link>
          </AdminSectionCard>

          <AdminSectionCard title={m("dashboard.revistaCardTitle")} subtitle={m("dashboard.revistaCardSub")}>
            <div className={`${adminCardBase} p-4`}>
              <p className="text-sm font-semibold text-[#1E1810]">{snap.magazineFeaturedLabel ?? m("dashboard.revistaNoFeatured")}</p>
              <p className="mt-1 text-xs text-[#7A7164]">
                {snap.magazineUpdated ? m("dashboard.revistaUpdated", { date: snap.magazineUpdated }) : m("dashboard.revistaNoDate")}
              </p>
              <p className="mt-3 text-xs text-[#5C5346]/90">{m("dashboard.revistaMetricsNote")}</p>
              <Link href="/admin/workspace/revista" className={`${adminCtaChipSecondary} mt-3 inline-flex`}>
                {m("dashboard.revistaManage")}
              </Link>
            </div>
          </AdminSectionCard>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-[#C9B46A]/50 bg-[#FFF8F0]/80 p-4 text-xs text-[#7A7164]">
          <p>
            <strong className="text-[#5C5346]">{m("dashboard.dataHonestyLabel")}</strong> {m("dashboard.dataHonestyBody")}
          </p>
        </div>
      </div>

      <aside className="mt-10 min-w-0 lg:mt-0">
        <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFF8F0]/95 p-4 shadow-inner sm:p-5 lg:sticky lg:top-32 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto">
          <AdminQuickActionsRail />
        </div>
      </aside>
    </div>
  );
}
