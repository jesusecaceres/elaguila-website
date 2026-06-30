"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  buildCallIntent,
  buildSendEmailIntent,
  buildWebsiteIntent,
  CtaActionSheet,
  type CtaSheetIntent,
} from "@/app/components/cta";

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

function digits(raw: string): string {
  return raw.replace(/\D/g, "");
}

const COPY = {
  es: {
    breadcrumbHub: "Clasificados",
    breadcrumbCat: "Empleos",
    publicar: "Publicar Anuncio",
    detailsTitle: "Detalles del evento",
    secondaryDetailsTitle: "Más información",
    organizedBy: "Organiza",
    verFlyer: "Ver flyer",
    contactOrganizer: "Sitio del organizador",
    registerCta: "Registro / reserva",
    freeBadge: "Gratis",
  },
  en: {
    breadcrumbHub: "Classifieds",
    breadcrumbCat: "Jobs",
    publicar: "Post listing",
    detailsTitle: "Event details",
    secondaryDetailsTitle: "More information",
    organizedBy: "Organized by",
    verFlyer: "View flyer",
    contactOrganizer: "Organizer website",
    registerCta: "Register / reserve",
    freeBadge: "Free",
  },
} as const;

type Props = {
  data?: EmpleoJobFairSample;
  withSiteChrome?: boolean;
  publicFooterSlot?: ReactNode;
};

export function EmpleoJobFairDetailPage({
  data = EMPLEO_JOB_FAIR_SAMPLE,
  withSiteChrome = true,
  publicFooterSlot = null,
}: Props) {
  const sp = useSearchParams();
  const lang = useMemo<Lang>(() => (sp?.get("lang") === "en" ? "en" : "es"), [sp]);
  const t = COPY[lang];

  const hubHref = appendLangToPath("/clasificados", lang);
  const empleosLandingHref = appendLangToPath("/clasificados/empleos", lang);
  const publicarHref = appendLangToPath("/clasificados/publicar", lang);

  const cityStateLine = data.displayCityState?.trim() || `${data.city}, ${data.state}`;
  const showDetailsCard = hasJobFairDetails(data.detailsBullets);
  const showSecondary = hasJobFairDetails(data.secondaryDetails);
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);
  const registerHref = data.contactLink?.trim().startsWith("http") ? data.contactLink.trim() : undefined;
  const organizerUrl = data.organizerUrl?.trim().startsWith("http") ? data.organizerUrl.trim() : undefined;
  const contactEmail = data.contactEmail?.trim() || undefined;
  const contactPhone = data.contactPhone?.trim() || undefined;
  const hasContact = Boolean(registerHref || organizerUrl || contactPhone || contactEmail);

  const openContactSheet = useCallback(() => {
    if (organizerUrl) {
      setCtaIntent(buildWebsiteIntent({ url: organizerUrl, headline: t.contactOrganizer, kind: "website" }));
      return;
    }
    if (contactEmail) {
      setCtaIntent(
        buildSendEmailIntent({
          email: contactEmail,
          subject: "Consulta sobre feria de empleo — Leonix",
          body: "",
          contactShareExtras: { email: contactEmail },
        }),
      );
      return;
    }
    if (contactPhone) {
      setCtaIntent(buildCallIntent({ phone: digits(contactPhone) }));
    }
  }, [contactEmail, contactPhone, organizerUrl, t.contactOrganizer]);
  const showVerFlyer = Boolean(data.flyerImageSrc?.trim());

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAF7F2] pb-20 text-[#2A2826]">
      {withSiteChrome ? <Navbar /> : null}

      <header className="border-b border-[#E8DFD0] bg-[#FFFBF7]/95 backdrop-blur">
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
        <JobFairFlyerCard imageSrc={data.flyerImageSrc} imageAlt={data.flyerImageAlt} />

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <JobFairInfoSection
              title={data.title}
              dateLine={data.dateLine}
              timeLine={data.timeLine?.trim() || undefined}
              venue={data.venue}
              addressLine1={data.addressLine1?.trim() || undefined}
              addressLine2={data.addressLine2?.trim() || undefined}
              cityStateLine={cityStateLine}
              organizer={data.organizer?.trim() || undefined}
              organizerUrl={data.organizerUrl?.trim() || undefined}
              organizedByLabel={t.organizedBy}
              filterRegionFootnote={data.filterRegionFootnote}
              freeLabel={data.freeEntry ? t.freeBadge : undefined}
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
          registerLabel={data.ctaLabel?.trim() || t.registerCta}
          showVerFlyer={showVerFlyer}
          showContact={hasContact}
          registerHref={registerHref}
          onContactClick={hasContact && (organizerUrl || contactEmail || contactPhone) ? openContactSheet : undefined}
        />

        {contactPhone || contactEmail ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {contactPhone ? (
              <button
                type="button"
                onClick={() =>
                  setCtaIntent(buildCallIntent({ phone: digits(contactPhone) }))
                }
                className="inline-flex min-h-10 items-center rounded-full border border-[#E8DFD0] bg-white px-4 text-sm font-semibold text-[#2A2826] hover:bg-[#FAF7F2]"
              >
                {contactPhone}
              </button>
            ) : null}
            {contactEmail ? (
              <button
                type="button"
                onClick={() =>
                  setCtaIntent(
                    buildSendEmailIntent({
                      email: contactEmail,
                      subject: "Consulta sobre feria de empleo — Leonix",
                      body: "",
                      contactShareExtras: { email: contactEmail },
                    }),
                  )
                }
                className="inline-flex min-h-10 items-center rounded-full border border-[#E8DFD0] bg-white px-4 text-sm font-semibold text-[#6B5320] hover:bg-[#FAF7F2]"
              >
                {contactEmail}
              </button>
            ) : null}
          </div>
        ) : null}

        <CtaActionSheet open={ctaIntent != null} onClose={() => setCtaIntent(null)} intent={ctaIntent} lang={lang} />

        {publicFooterSlot ? <div className="mt-10">{publicFooterSlot}</div> : null}
      </main>
    </div>
  );
}
