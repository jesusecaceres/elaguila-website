"use client";

import Link from "next/link";
import { LX_DASH } from "../lib/dashboardLeonixTheme";
import { businessConciergeHubCopy, type Lang } from "../lib/dashboardI18n";

function ModuleCard({
  title,
  body,
  available,
  liveLabel,
  unavailableLabel,
}: {
  title: string;
  body: string;
  available: boolean;
  liveLabel: string;
  unavailableLabel: string;
}) {
  return (
    <article className="rounded-2xl border border-[#D6C7AD]/80 bg-[#FFFCF7] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-bold text-[#1F241C]">{title}</h3>
        <span className={available ? LX_DASH.badgeReady : LX_DASH.badgeSoon}>
          {available ? liveLabel : unavailableLabel}
        </span>
      </div>
      <p className={`mt-2 ${LX_DASH.bodyMuted}`}>{body}</p>
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
}: {
  lang: Lang;
  q: string;
  hasBusinessListings: boolean;
  completenessScore: number | null;
  completenessMax: number | null;
  completenessRecommendations: string[];
  capabilityRows: Array<{ key: string; label: string; href: string; active: boolean }>;
  capabilitiesChecked: boolean;
}) {
  const t = businessConciergeHubCopy(lang);

  return (
    <div className="flex min-w-0 flex-col gap-6 overflow-x-hidden">
      <header className={LX_DASH.pageHero}>
        <p className={LX_DASH.contextLabel}>{t.eyebrow}</p>
        <h1 className={`mt-2 ${LX_DASH.pageTitle}`}>{t.title}</h1>
        <p className={`mt-2 max-w-3xl ${LX_DASH.bodyMuted}`}>{t.subtitle}</p>
      </header>

      {!hasBusinessListings ? (
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
              href={`mailto:hola@leonix.com?subject=${encodeURIComponent(lang === "es" ? "Leonix Concierge" : "Leonix Concierge")}`}
              className={LX_DASH.btnManage}
            >
              {t.mailtoCta}
            </a>
          </div>
        </section>
      ) : null}

      <section className={LX_DASH.panel}>
        <h2 className={LX_DASH.sectionTitle}>{t.identityTitle}</h2>
        <p className={`mt-2 ${LX_DASH.bodyMuted}`}>{hasBusinessListings ? t.identityListingBased : t.identityMissing}</p>
      </section>

      <section className={LX_DASH.panel}>
        <h2 className={LX_DASH.sectionTitle}>{t.whatMattersTitle}</h2>
        {completenessRecommendations.length > 0 ? (
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#3D3428]">
            {completenessRecommendations.slice(0, 3).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className={`mt-2 ${LX_DASH.emptyState}`}>{t.whatMattersEmpty}</p>
        )}
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <ModuleCard title={t.nrmTitle} body={t.nrmUnsupported} available={false} liveLabel={t.moduleLive} unavailableLabel={t.moduleUnavailable} />
        <ModuleCard title={t.healthTitle} body={t.healthUnsupported} available={false} liveLabel={t.moduleLive} unavailableLabel={t.moduleUnavailable} />
        <ModuleCard title={t.actionTitle} body={t.actionUnsupported} available={false} liveLabel={t.moduleLive} unavailableLabel={t.moduleUnavailable} />
        <ModuleCard title={t.understandTitle} body={t.understandUnsupported} available={false} liveLabel={t.moduleLive} unavailableLabel={t.moduleUnavailable} />
        <ModuleCard title={t.learnTitle} body={t.learnUnsupported} available={false} liveLabel={t.moduleLive} unavailableLabel={t.moduleUnavailable} />
        <ModuleCard title={t.progressTitle} body={t.progressUnsupported} available={false} liveLabel={t.moduleLive} unavailableLabel={t.moduleUnavailable} />
        <ModuleCard title={t.assistantTitle} body={t.assistantUnsupported} available={false} liveLabel={t.moduleLive} unavailableLabel={t.moduleUnavailable} />
        <ModuleCard title={t.approvalsTitle} body={t.noPendingApprovals} available={false} liveLabel={t.moduleLive} unavailableLabel={t.moduleUnavailable} />
      </section>

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
