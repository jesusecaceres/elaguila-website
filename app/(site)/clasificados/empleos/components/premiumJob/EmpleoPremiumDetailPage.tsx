"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import {
  EMPLEO_PREMIUM_JOB_SAMPLE,
  hasPremiumGallery,
  type EmpleoPremiumJobSample,
} from "../../data/empleoPremiumJobSampleData";
import { PremiumJobBenefitsCard } from "./PremiumJobBenefitsCard";
import { PremiumJobGallery } from "./PremiumJobGallery";
import { PremiumJobHeaderCard } from "./PremiumJobHeaderCard";
import { PremiumJobMainContent } from "./PremiumJobMainContent";
import { PremiumJobMoreJobsSection } from "./PremiumJobMoreJobsSection";
import { PremiumJobRequirementsCard } from "./PremiumJobRequirementsCard";
import { PremiumJobSidebarCard } from "./PremiumJobSidebarCard";
import { PremiumJobTabsShell } from "./PremiumJobTabsShell";

const COPY = {
  es: {
    breadcrumbHub: "Clasificados",
    breadcrumbCat: "Empleos",
    publicar: "Publicar Anuncio",
    tabs: ["Descripción del Puesto", "Requisitos", "Ofrecemos", "Sobre la Empresa"] as const,
    responsibilities: "Responsabilidades:",
    companyHeading: "Sobre la Empresa",
    requisitosLower: "Requisitos",
    ofrecemosLower: "Ofrecemos",
    masEmpleos: "Más empleos",
    verMas: "Ver más",
    apply: "Postularse ahora",
    visitSite: "Visitar sitio web",
    trustVisitSite: "Visita nuestro sitio web",
    emailCta: "Enviar Email",
    badgeFeatured: "Destacado",
    badgePremium: "Destacado Empleo PREMIUM",
  },
  en: {
    breadcrumbHub: "Classifieds",
    breadcrumbCat: "Jobs",
    publicar: "Post listing",
    tabs: ["Job description", "Requirements", "What we offer", "About the company"] as const,
    responsibilities: "Responsibilities:",
    companyHeading: "About the company",
    requisitosLower: "Requirements",
    ofrecemosLower: "What we offer",
    masEmpleos: "More jobs",
    verMas: "View more",
    apply: "Apply now",
    visitSite: "Visit website",
    trustVisitSite: "Visit our website",
    emailCta: "Send email",
    badgeFeatured: "Featured",
    badgePremium: "Premium job",
  },
} as const;

type Props = {
  data?: EmpleoPremiumJobSample;
};

export function EmpleoPremiumDetailPage({ data = EMPLEO_PREMIUM_JOB_SAMPLE }: Props) {
  const sp = useSearchParams();
  const lang = useMemo<Lang>(() => (sp?.get("lang") === "en" ? "en" : "es"), [sp]);
  const t = COPY[lang];

  const hubHref = appendLangToPath("/clasificados", lang);
  const empleosLandingHref = appendLangToPath("/clasificados/empleos", lang);
  const publicarHref = appendLangToPath("/clasificados/publicar", lang);

  const galleryImages = hasPremiumGallery(data.gallery) ? data.gallery : [];
  const showRelated = data.relatedJobs.length > 0;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#ECEAE7] pb-20 text-[color:var(--lx-text)]">
      <Navbar />

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
        <PremiumJobHeaderCard
          title={data.title}
          companyName={data.companyName}
          logoSrc={data.logoSrc}
          logoAlt={data.logoAlt}
          city={data.city}
          state={data.state}
        />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <PremiumJobGallery images={galleryImages} />
          </div>
          <div className="lg:col-span-5">
            <PremiumJobSidebarCard
              salaryPrimary={data.salaryPrimary}
              salarySecondary={data.salarySecondary?.trim() || undefined}
              jobType={data.jobType}
              locationLabel={data.locationLabel}
              featured={data.featured}
              premium={data.premium}
              whatsapp={data.whatsapp?.trim() || undefined}
              email={data.email?.trim() || undefined}
              websiteUrl={data.websiteUrl?.trim() || undefined}
              applyLabel={t.apply}
              websiteCtaLabel={t.visitSite}
              emailLabel={t.emailCta}
              badgeFeatured={t.badgeFeatured}
              badgePremium={t.badgePremium}
            />
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-lg border border-black/[0.06] bg-white shadow-[0_4px_24px_rgba(30,24,16,0.06)]">
          <PremiumJobTabsShell labels={t.tabs} />
          <div className="px-4 py-6 sm:px-8 sm:py-8">
            <PremiumJobMainContent
              introduction={data.introduction}
              responsibilities={data.responsibilities}
              companyOverview={data.companyOverview?.trim() || undefined}
              companyName={data.companyName}
              logoSrc={data.logoSrc}
              logoAlt={data.logoAlt}
              employerRating={data.employerRating}
              employerAddress={data.employerAddress?.trim() || undefined}
              websiteUrl={data.websiteUrl?.trim() || undefined}
              trustWebsiteLabel={t.trustVisitSite}
              headings={{
                responsibilities: t.responsibilities,
                company: t.companyHeading,
              }}
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          <PremiumJobRequirementsCard title={t.requisitosLower} items={data.requirements} />
          <PremiumJobBenefitsCard title={t.ofrecemosLower} items={data.offers} />
        </div>

        {showRelated ? (
          <PremiumJobMoreJobsSection title={t.masEmpleos} jobs={data.relatedJobs} ctaLabel={t.verMas} />
        ) : null}
      </main>
    </div>
  );
}
