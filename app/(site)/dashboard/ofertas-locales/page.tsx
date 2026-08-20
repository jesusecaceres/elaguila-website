"use client";

import Link from "next/link";
import {useEffect, useMemo, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { OfertaLocalOwnerListItem } from "@/app/lib/ofertas-locales/ofertasLocalesOwnerHelpers";

import { LeonixDashboardShell } from "../components/LeonixDashboardShell";

export const dynamic = "force-dynamic";

type Lang = "es" | "en";

function statusChipClass(status: string): string {
  switch (status) {
    case "pending_review":
    case "submitted":
    case "draft":
      return "bg-amber-100 text-amber-950";
    case "approved":
      return "bg-emerald-100 text-emerald-950";
    case "rejected":
      return "bg-rose-100 text-rose-950";
    case "archived":
      return "bg-slate-200 text-slate-800";
    default:
      return "bg-[#F0E8DA] text-[#5C5346]";
  }
}

function OfertasLocalesOwnerDashboardPageContent() {
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard/ofertas-locales";
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Mis Ofertas Locales",
            subtitle: "Tus envíos a Leonix — estado de revisión sin analíticas falsas.",
            loading: "Cargando…",
            empty: "Todavía no has enviado ofertas locales.",
            publish: "Publicar oferta local",
            manage: "Ver / gestionar",
            colBusiness: "Negocio",
            colOffer: "Oferta",
            colType: "Tipo",
            colCategory: "Categoría",
            colLocation: "Ciudad / ZIP",
            colDates: "Vigencia",
            colCommercial: "Pago",
            colPublicTerm: "Término público",
            colStatus: "Estado",
            colNext: "Siguiente",
            colAssets: "Archivos",
            colAi: "AI",
            colFeatured: "Destacada",
            colSubmitted: "Enviado",
            colActions: "Acciones",
            publicLink: "Ver en resultados",
            rejection: "Motivo",
            blockers: "Bloqueos",
            notStarted: "No iniciado",
            activeTerm: "Activo",
            expiredTerm: "Expirado",
            incompleteTerm: "Incompleto",
            daysRemaining: "días restantes",
          }
        : {
            title: "My Local Deals",
            subtitle: "Your Leonix submissions — review status only, no fake analytics.",
            loading: "Loading…",
            empty: "You have not submitted any local deals yet.",
            publish: "Publish local deal",
            manage: "View / manage",
            colBusiness: "Business",
            colOffer: "Offer",
            colType: "Type",
            colCategory: "Category",
            colLocation: "City / ZIP",
            colDates: "Valid dates",
            colCommercial: "Payment",
            colPublicTerm: "Public term",
            colStatus: "Status",
            colNext: "Next",
            colAssets: "Assets",
            colAi: "AI",
            colFeatured: "Featured",
            colSubmitted: "Submitted",
            colActions: "Actions",
            publicLink: "View in results",
            rejection: "Reason",
            blockers: "Blockers",
            notStarted: "Not started",
            activeTerm: "Active",
            expiredTerm: "Expired",
            incompleteTerm: "Incomplete",
            daysRemaining: "days remaining",
          },
    [lang]
  );

  const [authLoading, setAuthLoading] = useState(true);
  const [offers, setOffers] = useState<OfertaLocalOwnerListItem[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const sb = createSupabaseBrowserClient();
    void (async () => {
      const { data: userData } = await sb.auth.getUser();
      if (!userData.user) {
        const redirect = encodeURIComponent(`${pathname}${typeof window !== "undefined" ? window.location.search || "" : ""}`);
        router.replace(`/login?redirect=${redirect}`);
        return;
      }
      if (!cancelled) setOwnerId(userData.user.id);
      const { data: sess } = await sb.auth.getSession();
      const token = sess.session?.access_token ?? "";
      if (!token) {
        if (!cancelled) setAuthLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/ofertas-locales/owner?lang=${lang}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const j = (await res.json()) as { ok?: boolean; offers?: OfertaLocalOwnerListItem[] };
        if (!cancelled && j.ok && Array.isArray(j.offers)) setOffers(j.offers);
      } catch {
        /* ignore */
      }
      if (!cancelled) setAuthLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, pathname, lang]);

  if (authLoading) {
    return (
      <LeonixDashboardShell lang={lang} activeNav="listings" plan="free" userName={null} email={null} accountRef={null} ownerId={ownerId}>
        <p className="text-sm text-[#5C5346]">{t.loading}</p>
      </LeonixDashboardShell>
    );
  }

  return (
    <LeonixDashboardShell lang={lang} activeNav="listings" plan="free" userName={null} email={null} accountRef={null} ownerId={ownerId}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1810] sm:text-3xl">{t.title}</h1>
          <p className="mt-2 text-sm text-[#5C5346]">{t.subtitle}</p>
        </div>
        <Link
          href={appendLangToPath("/publicar/ofertas-locales", lang)}
          className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-2.5 text-sm font-semibold text-[#1E1810]"
        >
          {t.publish}
        </Link>
      </header>

      {offers.length === 0 ? (
        <p className="mt-10 text-[#5C5346]">{t.empty}</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-[#E8DFD0] bg-white">
          <table className="w-full min-w-[1000px] border-collapse text-left text-xs text-[#1E1810]">
            <thead className="bg-[#FBF7EF] text-[10px] font-bold uppercase tracking-wide text-[#5C5346]">
              <tr>
                <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colBusiness}</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colOffer}</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colType}</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colCategory}</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colLocation}</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colDates}</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colCommercial}</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colPublicTerm}</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colStatus}</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colNext}</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colAssets}</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colAi}</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colFeatured}</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colSubmitted}</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((item) => (
                <tr key={item.id} className="border-b border-[#F0E8DA] align-top hover:bg-[#FFFCF7]">
                  <td className="max-w-[120px] px-3 py-2 font-semibold">{item.businessName}</td>
                  <td className="max-w-[140px] px-3 py-2">{item.title}</td>
                  <td className="px-3 py-2">{item.offerType}</td>
                  <td className="px-3 py-2">{item.businessCategory}</td>
                  <td className="px-3 py-2">
                    {item.city}
                    <div className="font-mono text-[10px] text-[#7A7164]">{item.zipCode}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px]">
                    {item.validFrom}
                    <br />→ {item.validUntil}
                  </td>
                  <td className="px-3 py-2 text-[10px]">
                    <div className="font-mono text-[#7A7164]">{item.leonixAdId || "Sin ID Leonix"}</div>
                    <div className="font-semibold">{item.commercialAmount || "Sin pago"}</div>
                    <div>
                      {item.paymentStatus} · {item.entitlementStatus}
                    </div>
                    <div className="text-[#7A7164]">{item.commercialEligibilitySource}</div>
                    {item.partnerAssignmentId ? (
                      <div className="font-mono text-[10px] text-[#7A7164]">partner {item.partnerAssignmentId.slice(0, 8)}</div>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-[10px]">
                    <span className="font-semibold">
                      {item.publicTermStatus === "active"
                        ? t.activeTerm
                        : item.publicTermStatus === "expired"
                          ? t.expiredTerm
                          : item.publicTermStatus === "incomplete"
                            ? t.incompleteTerm
                            : t.notStarted}
                    </span>
                    {item.publishedAt ? <div className="font-mono">{item.publishedAt.slice(0, 10)}</div> : null}
                    {item.expiresAt ? <div className="font-mono">→ {item.expiresAt.slice(0, 10)}</div> : null}
                    {item.publicTermStatus === "active" && item.publicTermDaysRemaining != null ? (
                      <div className="text-[#5C5346]">
                        {item.publicTermDaysRemaining} {t.daysRemaining}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${statusChipClass(item.status)}`}>
                      {item.displayStatus}
                    </span>
                    {item.rejectionNote ? (
                      <p className="mt-1 text-[10px] text-rose-900" title={item.rejectionNote}>
                        {t.rejection}: {item.rejectionNote.slice(0, 80)}
                        {item.rejectionNote.length > 80 ? "…" : ""}
                      </p>
                    ) : null}
                  </td>
                  <td className="max-w-[180px] px-3 py-2 text-[10px]">
                    <p className="font-semibold text-[#1E1810]">
                      {lang === "es" ? item.operationalStatus.ownerNextActionEs : item.operationalStatus.ownerNextActionEn}
                    </p>
                    {item.operationalStatus.blockingReasons.length > 0 ? (
                      <p className="mt-1 font-mono text-[10px] text-[#7A1E2C]">
                        {t.blockers}: {item.operationalStatus.blockingReasons.join(", ")}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-center">{item.assetCount}</td>
                  <td className="px-3 py-2">{item.wantsAiSearchableSpecials ? "✓" : "—"}</td>
                  <td className="px-3 py-2">{item.featuredRequested ? "✓" : "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px]">
                    {item.submittedAt.slice(0, 10)}
                  </td>
                  <td className="space-y-1 px-3 py-2">
                    <Link
                      href={`/dashboard/ofertas-locales/${item.id}?${q}`}
                      className="block font-semibold text-[#6B5B2E] underline"
                    >
                      {t.manage}
                    </Link>
                    {item.publicResultsHref ? (
                      <Link
                        href={appendLangToPath(item.publicResultsHref, lang)}
                        className="block text-[#6B5B2E] underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t.publicLink}
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </LeonixDashboardShell>
  );
}

export default function OfertasLocalesOwnerDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <OfertasLocalesOwnerDashboardPageContent />
    </Suspense>
  );
}
