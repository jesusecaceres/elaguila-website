"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import {
  EMPLEO_QUICK_JOB_SAMPLE,
  hasQuickJobLocation,
  type QuickJobDetailSample,
} from "../../data/empleoQuickJobSampleData";
import { QuickJobBenefitsCard } from "./QuickJobBenefitsCard";
import { QuickJobCTACard } from "./QuickJobCTACard";
import { QuickJobHeaderCard } from "./QuickJobHeaderCard";
import { QuickJobLocationCard } from "./QuickJobLocationCard";
import { QuickJobLocationToast } from "./QuickJobLocationToast";
import { QuickJobMoreJobsSection } from "./QuickJobMoreJobsSection";
import { EmpleosClasificadosEngagementRow } from "../EmpleosClasificadosEngagementRow";
import type { EmpleosAnalyticsTrackMeta } from "../../lib/empleosAnalyticsIdentity";

const COPY = {
  es: {
    breadcrumbHub: "Clasificados",
    breadcrumbCat: "Empleos",
    publicar: "Publicar empleo",
    benefits: "Beneficios",
    descripcion: "Descripción del puesto",
    ubicacion: "Ubicación del empleo",
    verUbicacion: "Ver en mapa",
    toastTitle: "Ubicación",
    toastHint: "Haz clic para abrir la ubicación en tu app de mapas.",
    toastMaps: "Abrir en Google Maps",
    toastClose: "Cerrar",
    masEmpleos: "Más empleos",
    verMas: "Ver más",
    ctaEmail: "Enviar Email",
    websiteRow: "Sitio web",
    videos: "Videos del empleo",
    openVideo: "Ver video",
    reportar: "Reportar",
    labels: { jobType: "Tipo", schedule: "Horario", modality: "Modalidad" },
  },
  en: {
    breadcrumbHub: "Classifieds",
    breadcrumbCat: "Jobs",
    publicar: "Post a job",
    benefits: "Benefits",
    descripcion: "Job description",
    ubicacion: "Job location",
    verUbicacion: "View on map",
    toastTitle: "Location",
    toastHint: "Tap to open directions in your maps app.",
    toastMaps: "Open in Google Maps",
    toastClose: "Close",
    masEmpleos: "More jobs",
    verMas: "View more",
    ctaEmail: "Send email",
    websiteRow: "Website",
    videos: "Job videos",
    openVideo: "Watch video",
    reportar: "Report",
    labels: { jobType: "Type", schedule: "Schedule", modality: "Modality" },
  },
} as const;

function videoHostLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host || "Video";
  } catch {
    return "Video";
  }
}

type EngagementProps = {
  listingId: string;
  ownerUserId?: string | null;
  shareUrl?: string;
  persistEngagement?: boolean;
  listingSourceId?: string | null;
  slug?: string | null;
  leonixAdId?: string | null;
};

type Props = {
  data?: QuickJobDetailSample;
  withSiteChrome?: boolean;
  /** Optional slot below main content (e.g. published apply form). */
  publicFooterSlot?: ReactNode;
  contactAnalyticsMeta?: EmpleosAnalyticsTrackMeta;
  /** When provided, renders like/share/report row. */
  engagement?: EngagementProps | null;
};

export function EmpleoQuickDetailPage({
  data = EMPLEO_QUICK_JOB_SAMPLE,
  withSiteChrome = true,
  publicFooterSlot = null,
  contactAnalyticsMeta,
  engagement = null,
}: Props) {
  const sp = useSearchParams();
  const lang = useMemo<Lang>(() => (sp?.get("lang") === "en" ? "en" : "es"), [sp]);
  const t = COPY[lang];

  const [locationOpen, setLocationOpen] = useState(false);
  const [shareAbs, setShareAbs] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") setShareAbs(window.location.href);
  }, []);

  const hubHref = appendLangToPath("/clasificados", lang);
  const empleosLandingHref = appendLangToPath("/clasificados/empleos", lang);
  const publicarHref = appendLangToPath("/publicar/empleos", lang);
  const resultadosHref = appendLangToPath("/clasificados/empleos/resultados", lang);

  const showLocation = hasQuickJobLocation(data.location);
  const showRelated = data.relatedJobs.length > 0;
  const hasBenefits = data.benefits.length > 0;
  const videoUrls = useMemo(
    () =>
      Array.from(new Set((data.videoUrls ?? []).map((u) => String(u ?? "").trim()).filter((u) => /^https?:\/\//i.test(u)))).slice(0, 4),
    [data.videoUrls],
  );
  const hasAnyContact = Boolean(
    data.phone?.trim() || data.whatsapp?.trim() || data.email?.trim() || data.websiteUrl?.trim(),
  );
  const hasEngagement = Boolean(engagement?.listingId);

  return (
    <div
      className="min-h-screen overflow-x-hidden text-[#3D3428]"
      style={{
        backgroundColor: "#F8F4EA",
        backgroundImage: [
          "radial-gradient(ellipse 120% 70% at 50% -15%, rgba(201,168,74,0.13), transparent 58%)",
          "radial-gradient(ellipse 48% 38% at 100% 20%, rgba(255,253,247,0.60), transparent 50%)",
          "radial-gradient(ellipse 42% 32% at 0% 85%, rgba(122,30,44,0.04), transparent 52%)",
        ].join(","),
      }}
    >
      {withSiteChrome ? <Navbar /> : null}

      {/* ── Breadcrumb bar ─────────────────────────────────────────────────── */}
      <header className="border-b border-[#D6C7AD]/85 bg-[#FFFDF7]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[min(100%,90rem)] items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3 lg:px-10">
          <nav className="min-w-0 text-xs font-medium text-[#5C564E] sm:text-sm" aria-label="Breadcrumb">
            <Link href={hubHref} className="hover:underline">
              {t.breadcrumbHub}
            </Link>
            <span className="mx-1.5 text-[#9A948C]">/</span>
            <Link href={empleosLandingHref} className="hover:underline">
              {t.breadcrumbCat}
            </Link>
          </nav>
          <div className="flex shrink-0 items-center gap-4">
            <Link
              href={resultadosHref}
              className="hidden text-xs font-medium text-[#5C564E] hover:underline sm:inline"
            >
              ← {lang === "es" ? "Resultados" : "Results"}
            </Link>
            <Link
              href={publicarHref}
              className="shrink-0 rounded-lg border border-[#C9A84A]/55 bg-[#FFFDF7] px-3 py-1.5 text-xs font-semibold text-[#8A6B1F] transition hover:bg-[#FBF7EF]"
            >
              {t.publicar}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main canvas ────────────────────────────────────────────────────── */}
      <main className="mx-auto w-full min-w-0 max-w-[min(100%,90rem)] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 xl:px-14">

        {/* Header card — employer identity */}
        <QuickJobHeaderCard
          title={data.title}
          businessName={data.businessName}
          logoSrc={data.logoSrc}
          logoAlt={data.logoAlt}
          city={data.city}
          state={data.state}
          stateRegion={data.stateRegion}
          country={data.country}
          filterRegionFootnote={data.filterRegionFootnote}
          chips={[
            data.jobType,
            data.workModalityLabel,
          ].filter((c): c is string => Boolean(c?.trim()) && c !== "—")}
          payHighlight={data.pay && data.pay !== "—" ? data.pay : undefined}
        />

        {/* Engagement row (like / share / report) */}
        {hasEngagement ? (
          <div className="mt-4">
            <EmpleosClasificadosEngagementRow
              lang={lang}
              listingId={engagement!.listingId}
              ownerUserId={engagement!.ownerUserId}
              listingTitle={data.title}
              shareUrl={engagement!.shareUrl || shareAbs}
              persistEngagement={engagement!.persistEngagement ?? false}
              listingSourceId={engagement!.listingSourceId}
              slug={engagement!.slug}
              leonixAdId={engagement!.leonixAdId}
            />
          </div>
        ) : null}

        {/* Two-column grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">

          {/* ── Left column ──────────────────────────────────────────────── */}
          <div className="space-y-5 lg:col-span-7">

            {/* Main image */}
            <div className="overflow-hidden rounded-xl border border-[#D6C7AD]/85 bg-[#FFFDF7] shadow-[0_16px_44px_-18px_rgba(31,36,28,0.2)] ring-1 ring-[#C9A84A]/10">
              <div className="relative aspect-[16/9] max-h-[340px] w-full bg-[#EDE8E0] sm:aspect-[16/8]">
                <Image
                  src={data.mainImageSrc}
                  alt={data.mainImageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  priority
                />
              </div>
            </div>

            {/* Description card */}
            <section className="rounded-xl border border-[#D6C7AD]/80 bg-[#FFFDF7] p-5 shadow-[0_10px_28px_-16px_rgba(31,36,28,0.18)] sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8A6B1F]">{t.descripcion}</p>
              <p className="mt-3 text-sm leading-relaxed text-[#4A4744] whitespace-pre-line">{data.description}</p>
            </section>

            {/* Videos */}
            {videoUrls.length ? (
              <section className="rounded-xl border border-[#D6C7AD]/80 bg-[#FFFDF7] p-5 shadow-[0_10px_28px_-16px_rgba(31,36,28,0.18)] sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8A6B1F]">{t.videos}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {videoUrls.map((url, index) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-[#C9A84A]/45 bg-[#FBF7EF] px-3 py-2 text-sm font-semibold text-[#8A6B1F] transition hover:bg-[#F5EDD8]"
                    >
                      <span>{t.openVideo} {index + 1}</span>
                      <span className="truncate text-xs font-medium text-[#7A7164]">{videoHostLabel(url)}</span>
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Benefits */}
            {hasBenefits ? (
              <QuickJobBenefitsCard title={t.benefits} items={data.benefits} />
            ) : null}
          </div>

          {/* ── Right column — contact/apply card ────────────────────────── */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <QuickJobCTACard
                pay={data.pay}
                jobType={data.jobType}
                schedule={data.schedule}
                workModalityLabel={data.workModalityLabel}
                description={data.description}
                applyLink={data.applyLink?.trim() || undefined}
                phone={data.phone?.trim() || undefined}
                whatsapp={data.whatsapp?.trim() || undefined}
                smsPhone={data.smsPhone?.trim() || undefined}
                email={data.email?.trim() || undefined}
                websiteUrl={data.websiteUrl?.trim() || undefined}
                contactPerson={data.contactPerson?.trim() || undefined}
                contactTitle={data.contactTitle?.trim() || undefined}
                primaryCta={data.primaryCta}
                emailLabel={t.ctaEmail}
                websiteLabel={t.websiteRow}
                labels={t.labels}
                showContactRow={hasAnyContact}
                contactAnalyticsMeta={contactAnalyticsMeta}
                lang={lang}
                companyLinkedIn={data.companyLinkedIn?.trim() || undefined}
                companyFacebook={data.companyFacebook?.trim() || undefined}
                companyInstagram={data.companyInstagram?.trim() || undefined}
                companyTikTok={data.companyTikTok?.trim() || undefined}
                companyYouTube={data.companyYouTube?.trim() || undefined}
                companyX={data.companyX?.trim() || undefined}
                companySnapchat={data.companySnapchat?.trim() || undefined}
                companyOtherLinkLabel={data.companyOtherLinkLabel?.trim() || undefined}
                companyOtherLinkUrl={data.companyOtherLinkUrl?.trim() || undefined}
              />
            </div>
          </div>
        </div>

        {/* Location card */}
        {showLocation && data.location ? (
          <>
            <div className="mt-6">
              <QuickJobLocationCard
                location={data.location}
                sectionTitle={t.ubicacion}
                ctaLabel={t.verUbicacion}
                onOpen={() => setLocationOpen(true)}
              />
            </div>
            <QuickJobLocationToast
              open={locationOpen}
              onClose={() => setLocationOpen(false)}
              location={data.location}
              title={t.toastTitle}
              hint={t.toastHint}
              mapsLabel={t.toastMaps}
              closeLabel={t.toastClose}
            />
          </>
        ) : null}

        {/* Public footer slot (apply form / links) */}
        {publicFooterSlot ? <div className="mt-8">{publicFooterSlot}</div> : null}

        {/* Related jobs */}
        {showRelated ? (
          <QuickJobMoreJobsSection title={t.masEmpleos} jobs={data.relatedJobs} ctaLabel={t.verMas} />
        ) : null}
      </main>
    </div>
  );
}
