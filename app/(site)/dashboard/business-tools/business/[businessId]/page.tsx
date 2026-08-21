"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import {
  AUTHORIZATION_ROLES,
  BROAD_BUSINESS_TYPES,
  BUSINESS_STAGES,
  CONTACT_CAPABILITIES,
  CONTACT_LABELS,
  CUSTOM_LINK_TYPES,
  DIGITAL_PROFILE_PLATFORMS,
  OPERATING_MODELS,
  PREFERRED_RESPONSE_METHODS,
  SALES_CHANNELS,
  SALES_RELATIONSHIPS,
} from "@/app/lib/business/constants";
import { countryLabel } from "@/app/lib/business/countries";
import { businessLanguageLabel } from "@/app/lib/business/languages";
import type { Business, BusinessContact, BusinessCustomLink, BusinessDigitalProfile, BusinessListingLink, BusinessMembership, BusinessServiceArea } from "@/app/lib/business/types";
import { LeonixDashboardShell } from "../../../components/LeonixDashboardShell";
import { businessIdentityCopy, type Lang } from "../../_components/businessIdentityCopy";
import { businessApiFetch } from "../../_components/businessApiClient";
import { BusinessIdentityLangSwitch } from "../../_components/BusinessIdentityLangSwitch";
import { physicalAddressSummary, summarizeServiceCoverage } from "../../onboarding/wizardTypes";
import { formatUsPhoneForDisplay } from "@/app/lib/business/phoneDisplay";

type SummaryResponse = {
  business: Business;
  membership: BusinessMembership;
  contacts: BusinessContact[];
  serviceAreas: BusinessServiceArea[];
  listingLinks: BusinessListingLink[];
  digitalProfiles: BusinessDigitalProfile[];
  customLinks: BusinessCustomLink[];
};

function labelFrom(list: readonly { value: string; es: string; en: string }[], value: string | null | undefined, lang: Lang): string {
  if (!value) return "—";
  return list.find((o) => o.value === value)?.[lang] ?? value;
}

export default function CompletedBusinessIdentityPage() {
  const router = useRouter();
  const params = useParams<{ businessId: string }>();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/dashboard/business-tools";
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const t = businessIdentityCopy(lang);

  const [checkedAuth, setCheckedAuth] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);

  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    let mounted = true;
    async function run() {
      const { data } = await sb.auth.getUser();
      if (!mounted) return;
      if (!data.user) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      setUserId(data.user.id);
      setEmail(data.user.email ?? null);
      setName((data.user.user_metadata?.full_name as string | undefined) || null);
      setCheckedAuth(true);
    }
    void run();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  useEffect(() => {
    if (!checkedAuth) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErrored(false);
      const result = await businessApiFetch<SummaryResponse>("/api/dashboard/business/summary");
      if (cancelled) return;
      if (!result.ok || result.data.business.id !== params?.businessId) {
        setErrored(true);
      } else {
        setSummary(result.data);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [checkedAuth, params?.businessId]);

  const accountRef = useMemo(() => {
    if (!userId) return null;
    const s = userId.replace(/-/g, "");
    return s.length < 8 ? "—" : `${s.slice(0, 4).toUpperCase()}-${s.slice(-4).toUpperCase()}`;
  }, [userId]);

  const primaryArea = summary?.serviceAreas.find((a) => a.isPrimary) ?? summary?.serviceAreas[0] ?? null;
  const verifiedLinks = summary?.listingLinks.filter((l) => l.status === "verified") ?? [];
  const pendingLinks = summary?.listingLinks.filter((l) => l.status === "pending") ?? [];

  return (
    <LeonixDashboardShell lang={lang} activeNav="business" plan="free" userName={name} email={email} accountRef={accountRef} ownerId={userId}>
      {!checkedAuth || loading ? (
        <div role="status" aria-live="polite" className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">
          {t.common.loading}
        </div>
      ) : errored || !summary ? (
        <div role="alert" className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-8 text-center text-sm text-[#5C5346]">
          {t.common.error}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <BusinessIdentityLangSwitch lang={lang} />
          </div>

          <header className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.12)] sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">{t.completed.onboardingComplete}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">
              {summary.business.publicName || summary.business.displayName}
            </h1>
            <p className="mt-1 text-xs text-[#7A7164]">
              {t.completed.createdLabel} {new Date(summary.business.createdAt).toLocaleDateString(lang === "es" ? "es-MX" : "en-US")}
            </p>
          </header>

          <section className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 sm:p-8">
            <h2 className="text-base font-bold text-[#1E1810]">{t.completed.sectionIdentity}</h2>
            <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {summary.business.legalName ? (
                <div>
                  <dt className="text-xs font-semibold text-[#8A6B1F]">{t.completed.legalNameLabel}</dt>
                  <dd className="text-sm text-[#1E1810]">{summary.business.legalName}</dd>
                  <dd className="text-[10px] text-[#9A9184]">{t.completed.legalNameOwnerOnlyNote}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs font-semibold text-[#8A6B1F]">{t.completed.typeLabel}</dt>
                <dd className="text-sm text-[#1E1810]">
                  {labelFrom(BROAD_BUSINESS_TYPES, summary.business.broadBusinessType, lang)}
                  {summary.business.specificBusinessType || summary.business.customSpecificType
                    ? ` — ${summary.business.customSpecificType || summary.business.specificBusinessType}`
                    : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-[#8A6B1F]">{t.completed.stageLabel}</dt>
                <dd className="text-sm text-[#1E1810]">{labelFrom(BUSINESS_STAGES, summary.business.businessStage, lang)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-[#8A6B1F]">{t.completed.languageLabel}</dt>
                <dd className="text-sm text-[#1E1810]">{summary.business.primaryLanguage === "es" ? "Español" : "English"}</dd>
              </div>
              {summary.business.businessPrimaryLanguage ? (
                <div>
                  <dt className="text-xs font-semibold text-[#8A6B1F]">{t.completed.businessLanguagesLabel}</dt>
                  <dd className="text-sm text-[#1E1810]">
                    {businessLanguageLabel(summary.business.businessPrimaryLanguage, lang)}
                    {summary.business.businessAdditionalLanguages.length > 0
                      ? ` + ${summary.business.businessAdditionalLanguages.map((l) => businessLanguageLabel(l, lang)).join(", ")}`
                      : ""}
                  </dd>
                </div>
              ) : null}
              {summary.business.yearStarted ? (
                <div>
                  <dt className="text-xs font-semibold text-[#8A6B1F]">{t.completed.yearStartedLabel}</dt>
                  <dd className="text-sm text-[#1E1810]">{summary.business.yearStarted}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 sm:p-8">
            <h2 className="text-base font-bold text-[#1E1810]">{t.completed.sectionOperatingModel}</h2>
            <dl className="mt-3 space-y-2">
              <div>
                <dt className="text-xs font-semibold text-[#8A6B1F]">{t.wizard.step4.operatingModelLabel}</dt>
                <dd className="text-sm text-[#1E1810]">{summary.business.operatingModels.map((m) => labelFrom(OPERATING_MODELS, m, lang)).join(", ") || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-[#8A6B1F]">{t.wizard.step4.salesRelationshipLabel}</dt>
                <dd className="text-sm text-[#1E1810]">{summary.business.salesRelationships.map((m) => labelFrom(SALES_RELATIONSHIPS, m, lang)).join(", ") || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-[#8A6B1F]">{t.wizard.step4.salesChannelLabel}</dt>
                <dd className="text-sm text-[#1E1810]">{summary.business.salesChannels.map((m) => labelFrom(SALES_CHANNELS, m, lang)).join(", ") || "—"}</dd>
              </div>
            </dl>
          </section>

          {/* Gate BCO-3R-B.5 — business country, physical address, and service area are three
              independent facts, never collapsed into one misleading line. */}
          <section className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 sm:p-8">
            <h2 className="text-base font-bold text-[#1E1810]">{t.completed.sectionBusinessCountry}</h2>
            <p className="mt-2 text-sm text-[#1E1810]">{primaryArea?.country ? countryLabel(primaryArea.country, lang) : "—"}</p>
          </section>

          {primaryArea && physicalAddressSummary(primaryArea.structuredDetails, primaryArea.country ?? "", lang) ? (
            <section className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 sm:p-8">
              <h2 className="text-base font-bold text-[#1E1810]">{t.completed.sectionLocation}</h2>
              <p className="mt-2 text-sm text-[#1E1810]">{physicalAddressSummary(primaryArea.structuredDetails, primaryArea.country ?? "", lang)}</p>
              {primaryArea.structuredDetails.addressVisibility ? (
                <p className="mt-1 text-xs text-[#7A7164]">{t.wizard.step5.addressVisibilityOptions[primaryArea.structuredDetails.addressVisibility]}</p>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 sm:p-8">
            <h2 className="text-base font-bold text-[#1E1810]">{t.completed.sectionCoverage}</h2>
            {primaryArea ? (
              <p className="mt-2 text-sm text-[#1E1810]">{summarizeServiceCoverage(primaryArea.country ?? "", primaryArea.structuredDetails, lang, t.wizard.step5.coverage.summary)}</p>
            ) : (
              <p className="mt-2 text-sm text-[#1E1810]">—</p>
            )}
            <p className="mt-1 text-xs text-[#7A7164]">{primaryArea?.rawText ?? "—"}</p>
          </section>

          <section className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 sm:p-8">
            <h2 className="text-base font-bold text-[#1E1810]">{t.completed.sectionContact}</h2>
            <dl className="mt-3 space-y-3">
              {summary.contacts.map((c) => (
                <div key={c.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <dt className="text-xs font-semibold text-[#8A6B1F]">
                    {labelFrom(CONTACT_LABELS, c.label, lang)}
                    {c.isPrimary ? ` · ${t.wizard.step6.primaryLabel}` : ""}
                  </dt>
                  <dd className="text-sm text-[#1E1810]">{c.contactType === "phone" ? formatUsPhoneForDisplay(c.value) : c.value}</dd>
                  {c.contactType === "phone" && c.capabilities.length > 0 ? (
                    <dd className="text-xs text-[#7A7164]">({c.capabilities.map((cap) => labelFrom(CONTACT_CAPABILITIES, cap, lang)).join(", ")})</dd>
                  ) : null}
                  <dd className="text-[10px] text-[#9A9184]">{c.visibility === "private" ? t.wizard.step6.contactVisibilityOptions.private : t.wizard.step6.contactVisibilityOptions.public}</dd>
                </div>
              ))}
            </dl>
            {summary.business.preferredResponseMethod ? (
              <div className="mt-3 border-t border-[#E8DFD0] pt-3">
                <dt className="text-xs font-semibold text-[#8A6B1F]">{t.wizard.step9.sectionPreferredChannel}</dt>
                <dd className="text-sm text-[#1E1810]">{labelFrom(PREFERRED_RESPONSE_METHODS, summary.business.preferredResponseMethod, lang)}</dd>
              </div>
            ) : null}
          </section>

          {summary.digitalProfiles.length > 0 ? (
            <section className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 sm:p-8">
              <h2 className="text-base font-bold text-[#1E1810]">{t.completed.sectionDigitalProfiles}</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {summary.digitalProfiles.map((p) => (
                  <li key={p.id} className="rounded-full border border-[#E8DFD0] bg-[#FAF7F2] px-3 py-1 text-xs font-semibold text-[#3D3428]">
                    {labelFrom(DIGITAL_PROFILE_PLATFORMS, p.platform, lang)}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {summary.customLinks.length > 0 ? (
            <section className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 sm:p-8">
              <h2 className="text-base font-bold text-[#1E1810]">{t.wizard.step6.customLinksSectionTitle}</h2>
              <ul className="mt-3 space-y-2">
                {summary.customLinks.map((l) => (
                  <li key={l.id} className="flex items-baseline gap-2 text-sm">
                    <span className="font-semibold text-[#3D3428]">{l.linkType === "other" ? l.customLabel : labelFrom(CUSTOM_LINK_TYPES, l.linkType, lang)}</span>
                    <a href={l.displayUrl} target="_blank" rel="noreferrer" className="truncate text-[#8A6B1F] underline">
                      {l.displayUrl}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 sm:p-8">
            <h2 className="text-base font-bold text-[#1E1810]">{t.completed.sectionAuthorization}</h2>
            <p className="mt-2 text-sm text-[#1E1810]">{labelFrom(AUTHORIZATION_ROLES, summary.membership.authorizationRole, lang)}</p>
            {summary.membership.manualReviewFlag ? <p className="mt-1 text-xs text-[#7A7164]">{t.wizard.step7.manualReviewNote}</p> : null}
          </section>

          <section className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 sm:p-8">
            <h2 className="text-base font-bold text-[#1E1810]">{t.completed.sectionListing}</h2>
            <p className="mt-2 text-sm text-[#1E1810]">
              {verifiedLinks.length > 0
                ? `${t.completed.listingVerified} (${verifiedLinks.length})`
                : pendingLinks.length > 0
                  ? `${t.completed.listingPending} (${pendingLinks.length})`
                  : t.completed.noListing}
            </p>
          </section>

          <section className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FBF7EF]/70 p-6 sm:p-8">
            <h2 className="text-base font-bold text-[#1E1810]">{t.completed.sectionDataUse}</h2>
            <ul className="mt-3 space-y-1.5">
              {t.completed.dataUseItems.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-[#5C5346]">
                  <span aria-hidden="true">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-dashed border-[#D6C7AD] bg-[#FAF7F2]/70 p-6 sm:p-8">
            <h2 className="text-base font-bold text-[#1E1810]">{t.completed.sectionNext}</h2>
            <ul className="mt-3 space-y-3">
              {t.completed.nextItems.map((item) => (
                <li key={item.title} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1E1810]">{item.title}</p>
                    <p className="text-xs text-[#7A7164]">{item.body}</p>
                  </div>
                  <span className="shrink-0 inline-flex items-center rounded-full border border-[#D6C7AD]/70 bg-[#F3EBDD]/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">
                    {t.completed.nextBadge}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-2xl border border-[#E8DFD0] bg-white/70 p-4">
              <p className="text-sm font-semibold text-[#1E1810]">{t.completed.helpDiscoveryTitle}</p>
              <p className="mt-1 text-xs text-[#7A7164]">{t.completed.helpDiscoveryBody}</p>
              <span className="mt-2 inline-flex items-center rounded-full border border-[#D6C7AD]/70 bg-[#F3EBDD]/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">
                {t.completed.helpDiscoveryBadge}
              </span>
              <p className="mt-2 text-xs italic text-[#9A9184]">{t.completed.helpDiscoveryCta}</p>
            </div>
            <p className="mt-4 text-xs text-[#7A7164]">{t.completed.editingComingSoon}</p>
          </section>
        </div>
      )}
    </LeonixDashboardShell>
  );
}
