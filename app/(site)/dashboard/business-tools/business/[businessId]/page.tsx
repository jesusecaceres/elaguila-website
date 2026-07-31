"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { Business, BusinessContact, BusinessListingLink, BusinessServiceArea } from "@/app/lib/business/types";
import { LeonixDashboardShell } from "../../../components/LeonixDashboardShell";
import { businessIdentityCopy, type Lang } from "../../_components/businessIdentityCopy";
import { businessApiFetch } from "../../_components/businessApiClient";

type SummaryResponse = { business: Business; contacts: BusinessContact[]; serviceAreas: BusinessServiceArea[]; listingLinks: BusinessListingLink[] };

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

  const primaryContact = summary?.contacts.find((c) => c.isPrimary) ?? summary?.contacts[0] ?? null;
  const preferredContact = summary?.contacts.find((c) => c.preferredChannel) ?? null;
  const primaryArea = summary?.serviceAreas.find((a) => a.isPrimary) ?? summary?.serviceAreas[0] ?? null;
  const verifiedLink = summary?.listingLinks.find((l) => l.status === "verified") ?? null;
  const pendingLink = summary?.listingLinks.find((l) => l.status === "pending") ?? null;

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
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              {summary.business.legalName ? (
                <div>
                  <dt className="text-xs font-semibold text-[#8A6B1F]">{t.completed.legalNameLabel}</dt>
                  <dd className="text-sm text-[#1E1810]">{summary.business.legalName}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs font-semibold text-[#8A6B1F]">{t.completed.typeLabel}</dt>
                <dd className="text-sm text-[#1E1810]">{summary.business.broadBusinessType}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-[#8A6B1F]">{t.completed.stageLabel}</dt>
                <dd className="text-sm text-[#1E1810]">{summary.business.businessStage}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-[#8A6B1F]">{t.completed.languageLabel}</dt>
                <dd className="text-sm text-[#1E1810]">{summary.business.primaryLanguage === "es" ? "Español" : "English"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 sm:p-8">
            <h2 className="text-base font-bold text-[#1E1810]">{t.completed.sectionContact}</h2>
            <dl className="mt-3 space-y-2">
              {primaryContact ? (
                <div>
                  <dt className="text-xs font-semibold text-[#8A6B1F]">{primaryContact.contactType}</dt>
                  <dd className="text-sm text-[#1E1810]">{primaryContact.value}</dd>
                </div>
              ) : null}
              {preferredContact ? (
                <div>
                  <dt className="text-xs font-semibold text-[#8A6B1F]">{lang === "es" ? "Canal preferido" : "Preferred channel"}</dt>
                  <dd className="text-sm text-[#1E1810]">{preferredContact.channelKind}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 sm:p-8">
            <h2 className="text-base font-bold text-[#1E1810]">{t.completed.sectionServiceArea}</h2>
            <p className="mt-2 text-sm text-[#1E1810]">{primaryArea?.rawText ?? "—"}</p>
          </section>

          <section className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 sm:p-8">
            <h2 className="text-base font-bold text-[#1E1810]">{t.completed.sectionListing}</h2>
            <p className="mt-2 text-sm text-[#1E1810]">
              {verifiedLink ? t.completed.listingVerified : pendingLink ? t.completed.listingPending : t.completed.noListing}
            </p>
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
            <p className="mt-4 text-xs text-[#7A7164]">{t.completed.editingComingSoon}</p>
          </section>
        </div>
      )}
    </LeonixDashboardShell>
  );
}
