"use client";

import Link from "next/link";
import { LX_DASH } from "../lib/dashboardLeonixTheme";
import { businessConciergeHubCopy, businessHomeCopy, type Lang } from "../lib/dashboardI18n";
import type { BusinessHomeResponse, OwnerBusinessSummary } from "../lib/businessHomeClient";
import { mapAdvisorSignalToAttention } from "../lib/ownerAttentionModel";
import { OwnerAttentionItemCard } from "./OwnerAttentionItemCard";

function ModuleCard({
  title,
  body,
  available,
  liveLabel,
  unavailableLabel,
  children,
}: {
  title: string;
  body?: string;
  available: boolean;
  liveLabel: string;
  unavailableLabel: string;
  children?: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-[#D6C7AD]/80 bg-[#FFFCF7] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-bold text-[#1F241C]">{title}</h3>
        <span className={available ? LX_DASH.badgeReady : LX_DASH.badgeSoon}>
          {available ? liveLabel : unavailableLabel}
        </span>
      </div>
      {body ? <p className={`mt-2 ${LX_DASH.bodyMuted}`}>{body}</p> : null}
      {children}
    </article>
  );
}

export function BusinessConciergeOwnerHome({
  lang,
  q,
  hasBusinessListings,
  completenessScore,
  completenessMax,
  completenessRecommendations,
  capabilityRows,
  capabilitiesChecked,
  activeBusiness,
  otherBusinessCount,
  businessHome,
  businessHomeChecked,
}: {
  lang: Lang;
  q: string;
  hasBusinessListings: boolean;
  completenessScore: number | null;
  completenessMax: number | null;
  completenessRecommendations: string[];
  capabilityRows: Array<{ key: string; label: string; href: string; active: boolean }>;
  capabilitiesChecked: boolean;
  /** Gate 2 — the exact public.businesses.id row this owner is authorized for, if any. */
  activeBusiness: OwnerBusinessSummary | null;
  /** Count of additional businesses this owner also has active membership in (switcher is future work). */
  otherBusinessCount: number;
  businessHome: BusinessHomeResponse | null;
  businessHomeChecked: boolean;
}) {
  const t = businessConciergeHubCopy(lang);
  const th = businessHomeCopy(lang);
  const es = lang === "es";
  const home = businessHome;

  return (
    <div className="flex min-w-0 flex-col gap-6 overflow-x-hidden">
      <header className={LX_DASH.pageHero}>
        <p className={LX_DASH.contextLabel}>{t.eyebrow}</p>
        <h1 className={`mt-2 ${LX_DASH.pageTitle}`}>{t.title}</h1>
        <p className={`mt-2 max-w-3xl ${LX_DASH.bodyMuted}`}>{t.subtitle}</p>
      </header>

      {/* BUSINESS IDENTITY — the page's orientation anchor, so it carries the same subtle gold
          ring accent OwnerEntityWorkspace already uses for its own header panel (Pre-QA
          completeness fix for §27's "must not feel like a directory of equal cards" rule; a
          fuller visual-hierarchy pass across every section is a real design decision beyond this
          gate's minimal-repair scope). */}
      <section className={`${LX_DASH.panel} ring-1 ring-[#C9A84A]/15`}>
        <h2 className={LX_DASH.sectionTitle}>{t.identityTitle}</h2>
        {activeBusiness ? (
          <>
            <p className={`mt-2 ${LX_DASH.bodyMuted}`}>{th.activeBusinessLabel}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="font-serif text-lg font-semibold text-[#1F241C]">{activeBusiness.displayName}</span>
              {home?.business?.businessStage ? (
                <span className={LX_DASH.subtleBadge}>{th.stageLabel[home.business.businessStage] ?? home.business.businessStage}</span>
              ) : null}
              {home?.entitlement?.state ? (
                <span className={LX_DASH.subtleBadge}>{th.entitlementState[home.entitlement.state] ?? home.entitlement.state}</span>
              ) : null}
            </div>
            {otherBusinessCount > 0 ? <p className={`mt-2 text-xs ${LX_DASH.bodyMuted}`}>{th.switchBusinessHint}</p> : null}
          </>
        ) : (
          <p className={`mt-2 ${LX_DASH.bodyMuted}`}>{hasBusinessListings ? t.identityListingBased : t.identityMissing}</p>
        )}
      </section>

      {/* No canonical business — honest setup/idea/learning opportunities only, per doctrine. */}
      {!activeBusiness ? (
        <section className={LX_DASH.panel}>
          <h2 className={LX_DASH.sectionTitle}>{t.generalTitle}</h2>
          <p className={`mt-2 max-w-3xl ${LX_DASH.bodyMuted}`}>{t.generalBody}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/publicar?${q}`} className={`${LX_DASH.btnPrimary} min-h-[44px]`}>
              {t.ideaCta}
            </Link>
            <Link href={`/dashboard/perfil?${q}`} className={LX_DASH.btnSecondary}>
              {t.profileCta}
            </Link>
            <a
              href={`mailto:hola@leonix.com?subject=${encodeURIComponent("Leonix Concierge")}`}
              className={LX_DASH.btnManage}
            >
              {t.mailtoCta}
            </a>
          </div>
        </section>
      ) : null}

      {/* Canonical business exists — render the real Business Home hierarchy. */}
      {activeBusiness ? (
        !businessHomeChecked ? (
          <p className={LX_DASH.bodyMuted}>{t.loading}</p>
        ) : !home ? (
          <section className={LX_DASH.emptyState}>{t.identityMissing}</section>
        ) : (
          <>
            {/* WHAT MATTERS NOW: Next Right Move + Needs Your Attention — highest operational
                emphasis per Master Bible §27's locked hierarchy. Reuses the exact pageHero
                treatment (gradient + stronger ring) already used for the page's own header, so
                this tier reads as more urgent than the plain-panel sections below it instead of
                the whole page looking like a flat directory of equal cards. */}
            <section className={`${LX_DASH.pageHero} p-5 sm:p-6`}>
              <h2 className={LX_DASH.sectionTitle}>{t.whatMattersTitle}</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
              <ModuleCard
                title={t.nrmTitle}
                available={!!home.whatMattersNow?.available && !!home.whatMattersNow?.recommendation}
                liveLabel={t.moduleLive}
                unavailableLabel={t.moduleUnavailable}
              >
                {home.whatMattersNow?.recommendation ? (
                  <p className={`mt-2 ${LX_DASH.bodyMuted}`}>
                    {String(
                      es
                        ? (home.whatMattersNow.recommendation as Record<string, unknown>).verifiedNeedEs
                        : (home.whatMattersNow.recommendation as Record<string, unknown>).verifiedNeedEn
                    )}
                  </p>
                ) : (
                  <p className={`mt-2 ${LX_DASH.bodyMuted}`}>{t.nrmUnsupported}</p>
                )}
              </ModuleCard>

              <ModuleCard
                title={t.attentionTitle}
                available={!!home.needsAttention?.available && (home.needsAttention?.signals?.length ?? 0) > 0}
                liveLabel={t.moduleLive}
                unavailableLabel={t.moduleUnavailable}
              >
                {home.needsAttention?.signals && home.needsAttention.signals.length > 0 && activeBusiness ? (
                  <ul className="mt-2 space-y-2">
                    {home.needsAttention.signals.map((s) => (
                      <li key={s.id}>
                        <OwnerAttentionItemCard item={mapAdvisorSignalToAttention(s, lang, activeBusiness.businessId)} lang={lang} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={`mt-2 ${LX_DASH.bodyMuted}`}>{t.whatMattersEmpty}</p>
                )}
              </ModuleCard>
              </div>
            </section>

            {/* BUSINESS HEALTH + YOUR ACTION PLAN — grouped side by side as the secondary
                operational-work tier (same grid pattern as What Matters Now, plain panel weight
                so this tier visibly ranks below it), per Master Bible §27's locked hierarchy. */}
            <section className="grid gap-3 md:grid-cols-2">
              <div className={LX_DASH.panel}>
                <h2 className={LX_DASH.sectionTitle}>{t.healthTitle}</h2>
                {home.businessHealth?.available && (home.businessHealth.strengths.length > 0 || home.businessHealth.needsAttention.length > 0) ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8A6B1F]">{th.healthStrongTitle}</p>
                      {home.businessHealth.strengths.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-sm text-[#3D3428]">
                          {home.businessHealth.strengths.map((d) => (
                            <li key={d.dimensionKey}>{es ? d.explanationEs : d.explanationEn}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className={`mt-2 ${LX_DASH.emptyState}`}>—</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8A6B1F]">{th.healthAttentionTitle}</p>
                      {home.businessHealth.needsAttention.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-sm text-[#3D3428]">
                          {home.businessHealth.needsAttention.map((d) => (
                            <li key={d.dimensionKey}>{es ? d.explanationEs : d.explanationEn}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className={`mt-2 ${LX_DASH.emptyState}`}>—</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className={`mt-2 ${LX_DASH.bodyMuted}`}>{t.healthUnsupported}</p>
                )}
              </div>

              <div className={LX_DASH.panel}>
                <h2 className={LX_DASH.sectionTitle}>{t.actionTitle}</h2>
                {home.actionPlan?.available && home.actionPlan.progress ? (
                  <div className="mt-3 flex flex-wrap gap-4">
                    <div>
                      <p className={LX_DASH.metricLabel}>{th.actionPlanTotal}</p>
                      <p className={LX_DASH.metricValue}>{home.actionPlan.progress.total}</p>
                    </div>
                    <div>
                      <p className={LX_DASH.metricLabel}>{th.actionPlanCompleted}</p>
                      <p className={LX_DASH.metricValue}>{home.actionPlan.progress.completed}</p>
                    </div>
                    <div>
                      <p className={LX_DASH.metricLabel}>{th.actionPlanInProgress}</p>
                      <p className={LX_DASH.metricValue}>{home.actionPlan.progress.inProgressOrAvailable}</p>
                    </div>
                  </div>
                ) : (
                  <p className={`mt-2 ${LX_DASH.bodyMuted}`}>{t.actionUnsupported}</p>
                )}
              </div>
            </section>

            {/* WHAT LEONIX UNDERSTANDS */}
            <section className={LX_DASH.panel}>
              <h2 className={LX_DASH.sectionTitle}>{t.understandTitle}</h2>
              {home.whatLeonixUnderstands?.available ? (
                <div className="mt-3 flex flex-wrap gap-4">
                  <div>
                    <p className={LX_DASH.metricLabel}>{th.understandConfirmed}</p>
                    <p className={LX_DASH.metricValue}>{home.whatLeonixUnderstands.confirmedFactCount}</p>
                  </div>
                  <div>
                    <p className={LX_DASH.metricLabel}>{th.understandNeedsConfirmation}</p>
                    <p className={LX_DASH.metricValue}>{home.whatLeonixUnderstands.needsConfirmationCount}</p>
                  </div>
                  <div>
                    <p className={LX_DASH.metricLabel}>{th.understandOpenQuestions}</p>
                    <p className={LX_DASH.metricValue}>{home.whatLeonixUnderstands.openQuestionsCount}</p>
                  </div>
                </div>
              ) : (
                <p className={`mt-2 ${LX_DASH.bodyMuted}`}>{t.understandUnsupported}</p>
              )}
            </section>

            {/* WORK WITH LEONIX: approvals, service requests, proposals */}
            <section className={LX_DASH.panel}>
              <h2 className={LX_DASH.sectionTitle}>{t.approvalsTitle}</h2>
              <div className="mt-3 flex flex-wrap gap-4">
                <div>
                  <p className={LX_DASH.metricLabel}>{th.approvalsCountLabel}</p>
                  <p className={LX_DASH.metricValue}>{home.workWithLeonix?.pendingApprovalsCount ?? 0}</p>
                </div>
                <div>
                  <p className={LX_DASH.metricLabel}>{th.serviceRequestsCountLabel}</p>
                  <p className={LX_DASH.metricValue}>{home.workWithLeonix?.pendingServiceRequestsCount ?? 0}</p>
                </div>
              </div>
              {(home.workWithLeonix?.pendingApprovalsCount ?? 0) > 0 ||
              (home.workWithLeonix?.pendingServiceRequestsCount ?? 0) > 0 ? (
                // Pre-QA completeness fix: these counts are real but there is no individual
                // review/decision route yet (Master Bible §48). Without this line a real "3
                // pending approvals" with zero clickable affordance reads as a broken feature
                // rather than an intentional read-only summary.
                <p className={`mt-2 ${LX_DASH.bodyMuted}`}>{th.workWithLeonixReadOnlyNote}</p>
              ) : null}
              <p className="mt-4 text-sm font-semibold text-[#5C5346]">{th.proposalsTitle}</p>
              {home.workWithLeonix?.proposalsAwaitingDecision && home.workWithLeonix.proposalsAwaitingDecision.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {home.workWithLeonix.proposalsAwaitingDecision.map((p) => (
                    <li key={p.id} className="rounded-xl border border-[#D6C7AD]/70 bg-white p-3">
                      <p className="text-sm font-semibold text-[#1F241C]">{es ? p.verifiedNeedEs : p.verifiedNeedEn}</p>
                      <p className={`mt-1 ${LX_DASH.bodyMuted}`}>{p.recommendedIntervention}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`mt-2 ${LX_DASH.bodyMuted}`}>{th.proposalsEmpty}</p>
              )}
            </section>

            {/* PROGRESS / RESULTS */}
            <section className={LX_DASH.panel}>
              <h2 className={LX_DASH.sectionTitle}>{t.progressTitle}</h2>
              {home.progress?.available && home.progress.outcomes.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {home.progress.outcomes.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#D6C7AD]/70 bg-white px-4 py-3">
                      <span className="text-sm font-medium text-[#1F241C]">{es ? o.metricLabelEs : o.metricLabelEn}</span>
                      <span className={LX_DASH.subtleBadge}>
                        {o.baselineValue ?? "—"} → {o.measuredValue ?? "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`mt-2 ${LX_DASH.bodyMuted}`}>{home.progress?.available ? th.outcomesEmpty : t.progressUnsupported}</p>
              )}
            </section>

            {/* ASSISTANT — only rendered when genuinely available */}
            {home.assistant?.available ? (
              <section className={LX_DASH.panel}>
                <h2 className={LX_DASH.sectionTitle}>{t.assistantTitle}</h2>
                <p className={`mt-2 ${LX_DASH.bodyMuted}`}>{home.assistant.hasActiveThread ? th.assistantActive : th.assistantInactive}</p>
              </section>
            ) : null}

            {/* LEARNING — intentionally omitted: no real recommendation→lesson mapping exists yet. */}
          </>
        )
      ) : null}

      {completenessScore != null && completenessMax != null ? (
        <section className={LX_DASH.panel}>
          <h2 className={LX_DASH.sectionTitle}>{t.completenessTitle}</h2>
          <p className={`mt-1 ${LX_DASH.bodyMuted}`}>{t.completenessHint}</p>
          <p className="mt-3 font-serif text-3xl font-semibold tabular-nums text-[#1F241C]">
            {completenessScore}/{completenessMax}
          </p>
          {completenessRecommendations.length > 0 ? (
            <>
              <p className="mt-3 text-sm font-semibold text-[#5C5346]">{t.nextSteps}</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#3D3428]">
                {completenessRecommendations.slice(0, 4).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ) : null}

      {capabilitiesChecked ? (
        <section className={LX_DASH.panel}>
          <h2 className={LX_DASH.sectionTitle}>{t.capabilitiesTitle}</h2>
          <p className={`mt-1 ${LX_DASH.bodyMuted}`}>{t.capabilitiesHint}</p>
          {capabilityRows.length === 0 ? (
            <p className={`mt-3 ${LX_DASH.emptyState}`}>{t.capabilitiesEmpty}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {capabilityRows.map((row) => (
                <li key={row.key} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#D6C7AD]/80 bg-white px-4 py-3">
                  <Link href={row.href} className="text-sm font-medium text-[#1F241C] hover:underline">
                    {row.label}
                  </Link>
                  <span className={row.active ? LX_DASH.badgeReady : LX_DASH.badgeSoon}>
                    {row.active ? t.included : t.notIncluded}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <p className={LX_DASH.bodyMuted}>{t.loading}</p>
      )}
    </div>
  );
}
