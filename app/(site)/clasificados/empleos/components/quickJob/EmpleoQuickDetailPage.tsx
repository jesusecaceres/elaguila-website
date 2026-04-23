"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
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

const COPY = {
  es: {
    breadcrumbHub: "Clasificados",
    breadcrumbCat: "Empleos",
    publicar: "Publicar Anuncio",
    benefits: "Beneficios",
    ubicacion: "Ubicación",
    verUbicacion: "Ver ubicación",
    toastTitle: "Ubicación",
    toastHint: "Haz clic para abrir la ubicación en tu app de mapas.",
    toastMaps: "Abrir en Google Maps",
    toastClose: "Cerrar",
    masEmpleos: "Más empleos",
    verMas: "Ver más",
    ctaEmail: "Enviar Email",
    websiteRow: "Sitio web",
    labels: { jobType: "Tipo", schedule: "Horario", modality: "Modalidad" },
  },
  en: {
    breadcrumbHub: "Classifieds",
    breadcrumbCat: "Jobs",
    publicar: "Post listing",
    benefits: "Benefits",
    ubicacion: "Location",
    verUbicacion: "View location",
    toastTitle: "Location",
    toastHint: "Tap to open directions in your maps app.",
    toastMaps: "Open in Google Maps",
    toastClose: "Close",
    masEmpleos: "More jobs",
    verMas: "View more",
    ctaEmail: "Send email",
    websiteRow: "Website",
    labels: { jobType: "Type", schedule: "Schedule", modality: "Modality" },
  },
} as const;

type Props = {
  data?: QuickJobDetailSample;
  withSiteChrome?: boolean;
  /** Optional slot below main content (e.g. published apply form). */
  publicFooterSlot?: ReactNode;
};

export function EmpleoQuickDetailPage({
  data = EMPLEO_QUICK_JOB_SAMPLE,
  withSiteChrome = true,
  publicFooterSlot = null,
}: Props) {
  const sp = useSearchParams();
  const lang = useMemo<Lang>(() => (sp?.get("lang") === "en" ? "en" : "es"), [sp]);
  const t = COPY[lang];

  const [locationOpen, setLocationOpen] = useState(false);

  const hubHref = appendLangToPath("/clasificados", lang);
  const empleosLandingHref = appendLangToPath("/clasificados/empleos", lang);
  const publicarHref = appendLangToPath("/clasificados/publicar", lang);

  const showLocation = hasQuickJobLocation(data.location);
  const showRelated = data.relatedJobs.length > 0;
  const hasBenefits = data.benefits.length > 0;
  const hasAnyContact = Boolean(
    data.phone?.trim() || data.whatsapp?.trim() || data.email?.trim() || data.websiteUrl?.trim(),
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAF7F2] pb-20 text-[#2A2826]">
      {withSiteChrome ? <Navbar /> : null}

      <header className="border-b border-[#E8DFD0] bg-[#FFFBF7]/95 text-[#2A2826] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-5 sm:py-3 lg:px-8">
          <nav className="text-xs font-medium text-[#5C564E] sm:text-sm" aria-label="Breadcrumb">
            <Link href={hubHref} className="hover:underline">
              {t.breadcrumbHub}
            </Link>
            <span className="mx-1.5 text-[#9A948C]">&gt;</span>
            <Link href={empleosLandingHref} className="hover:underline">
              {t.breadcrumbCat}
            </Link>
          </nav>
          <Link
            href={publicarHref}
            className="shrink-0 text-xs font-semibold text-[#6B5320] hover:underline sm:text-sm"
          >
            {t.publicar}
            <span className="ml-0.5" aria-hidden>
              &gt;
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-8 lg:px-8">
        <QuickJobHeaderCard
          title={data.title}
          businessName={data.businessName}
          logoSrc={data.logoSrc}
          logoAlt={data.logoAlt}
          city={data.city}
          state={data.state}
          filterRegionFootnote={data.filterRegionFootnote}
        />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-[18px] border border-[#E8DFD0] bg-[#FFFBF7] shadow-[0_10px_32px_rgba(42,40,38,0.06)]">
              <div className="relative aspect-[16/9] max-h-[320px] w-full bg-[#EDE8E0] sm:aspect-[16/8]">
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
            {hasBenefits ? (
              <QuickJobBenefitsCard title={t.benefits} items={data.benefits} />
            ) : null}
          </div>

          <div className="lg:col-span-5">
            <QuickJobCTACard
              pay={data.pay}
              jobType={data.jobType}
              schedule={data.schedule}
              workModalityLabel={data.workModalityLabel}
              description={data.description}
              phone={data.phone?.trim() || undefined}
              whatsapp={data.whatsapp?.trim() || undefined}
              email={data.email?.trim() || undefined}
              websiteUrl={data.websiteUrl?.trim() || undefined}
              primaryCta={data.primaryCta}
              emailLabel={t.ctaEmail}
              websiteLabel={t.websiteRow}
              labels={t.labels}
              showContactRow={hasAnyContact}
            />
          </div>
        </div>

        {showLocation && data.location ? (
          <>
            <div className="mt-8">
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

        {showRelated ? (
          <QuickJobMoreJobsSection title={t.masEmpleos} jobs={data.relatedJobs} ctaLabel={t.verMas} />
        ) : null}

        {publicFooterSlot ? <div className="mt-10">{publicFooterSlot}</div> : null}
      </main>
    </div>
  );
}
