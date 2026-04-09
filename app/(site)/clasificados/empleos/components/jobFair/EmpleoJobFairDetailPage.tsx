"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import {
  EMPLEO_JOB_FAIR_SAMPLE,
  hasJobFairDetails,
  type EmpleoJobFairSample,
} from "../../data/empleoJobFairSampleData";
import { JobFairCTASection } from "./JobFairCTASection";
import { JobFairDetailsCard } from "./JobFairDetailsCard";
import { JobFairFlyerCard } from "./JobFairFlyerCard";
import { JobFairInfoSection } from "./JobFairInfoSection";
import { JobFairSecondaryDetails } from "./JobFairSecondaryDetails";

const COPY = {
  es: {
    breadcrumbHub: "Clasificados",
    breadcrumbCat: "Empleos",
    publicar: "Publicar Anuncio",
    detailsTitle: "Detalles",
    secondaryDetailsTitle: "Detalles:",
    organizedBy: "Organizado por",
    verFlyer: "Ver Flyer",
    contactOrganizer: "Contactar Organizador",
  },
  en: {
    breadcrumbHub: "Classifieds",
    breadcrumbCat: "Jobs",
    publicar: "Post listing",
    detailsTitle: "Details",
    secondaryDetailsTitle: "Details:",
    organizedBy: "Organized by",
    verFlyer: "View flyer",
    contactOrganizer: "Contact organizer",
  },
} as const;

type Props = {
  data?: EmpleoJobFairSample;
  withSiteChrome?: boolean;
};

export function EmpleoJobFairDetailPage({ data = EMPLEO_JOB_FAIR_SAMPLE, withSiteChrome = true }: Props) {
  const sp = useSearchParams();
  const lang = useMemo<Lang>(() => (sp?.get("lang") === "en" ? "en" : "es"), [sp]);
  const t = COPY[lang];

  const hubHref = appendLangToPath("/clasificados", lang);
  const empleosLandingHref = appendLangToPath("/clasificados/empleos", lang);
  const publicarHref = appendLangToPath("/clasificados/publicar", lang);

  const cityStateLine = `${data.city}, ${data.state}`;
  const showDetailsCard = hasJobFairDetails(data.detailsBullets);
  const showSecondary = hasJobFairDetails(data.secondaryDetails);
  const hasContact = Boolean(data.contactPhone?.trim() || data.contactEmail?.trim());
  const showVerFlyer = Boolean(data.flyerImageSrc?.trim());

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#ECEAE7] pb-20 text-[color:var(--lx-text)]">
      {withSiteChrome ? <Navbar /> : null}

      <header className="bg-[#C41E3A] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-5 sm:py-3 lg:px-6">
          <nav className="text-xs font-medium sm:text-sm" aria-label="Breadcrumb">
            <Link href={hubHref} className="hover:underline">
              {t.breadcrumbHub}
            </Link>
            <span className="mx-1.5 opacity-80">&gt;</span>
            <Link href={empleosLandingHref} className="hover:underline">
              {t.breadcrumbCat}
            </Link>
          </nav>
          <Link
            href={publicarHref}
            className="shrink-0 text-xs font-semibold hover:underline sm:text-sm"
          >
            {t.publicar}
            <span className="ml-0.5" aria-hidden>
              &gt;
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8 lg:px-6">
        <JobFairFlyerCard imageSrc={data.flyerImageSrc} imageAlt={data.flyerImageAlt} />

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <JobFairInfoSection
              title={data.title}
              dateLine={data.dateLine}
              timeLine={data.timeLine?.trim() || undefined}
              venue={data.venue}
              cityStateLine={cityStateLine}
              organizer={data.organizer?.trim() || undefined}
              organizerUrl={data.organizerUrl?.trim() || undefined}
              organizedByLabel={t.organizedBy}
            />
          </div>
          <div className="lg:col-span-5">
            {showDetailsCard ? (
              <JobFairDetailsCard title={t.detailsTitle} items={data.detailsBullets} />
            ) : null}
          </div>
        </div>

        {showSecondary && data.secondaryDetails ? (
          <JobFairSecondaryDetails title={t.secondaryDetailsTitle} items={data.secondaryDetails} />
        ) : null}

        <JobFairCTASection
          intro={data.ctaIntro}
          verFlyerLabel={t.verFlyer}
          contactOrganizerLabel={t.contactOrganizer}
          showVerFlyer={showVerFlyer}
          showContact={hasContact}
        />
      </main>
    </div>
  );
}
