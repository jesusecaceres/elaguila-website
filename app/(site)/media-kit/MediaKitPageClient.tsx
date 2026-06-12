"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { LeonixHeaderLanguageSelector } from "@/app/(site)/magazine/components/LeonixHeaderLanguageSelector";
import { parseGateLang } from "@/app/(site)/lib/parseGateLang";
import {
  getGoogleTranslatePlacementCopy,
  getGoogleTranslateWebsitesPasteHint,
  googleTranslateWebsitesPasteHintClass,
  translateSiteHref,
} from "@/app/lib/googleTranslateWebsite";
import { getMediaKitPageCopy } from "@/app/lib/leonix/mediaKitPageCopy";
import {
  MAGAZINE_KIT_PDF_EN,
  MAGAZINE_KIT_PDF_ES,
  mediaKitAdvertisingContactHref,
  mediaKitInterestContactHref,
  primaryMediaKitPdfHref,
} from "@/app/lib/leonix/mediaKitRoutes";
import { showDualMediaKitPdfButtons } from "@/app/lib/magazine/qrBridge";
import { getMagazineUi } from "@/app/(site)/magazine/2026/june/issueContent";
const btnPrimary =
  "inline-flex min-h-[2.75rem] items-center justify-center rounded-lg bg-[#7A1E2C] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#5e1721] sm:text-base";
const btnSecondary =
  "inline-flex min-h-[2.75rem] items-center justify-center rounded-lg border border-[#7A1E2C]/35 bg-[#FFFDF7] px-5 py-2.5 text-sm font-bold text-[#7A1E2C] transition hover:bg-[#FBF7EF] sm:text-base";
const btnGold =
  "inline-flex min-h-[2.75rem] items-center justify-center rounded-lg bg-[#C9A84A] px-5 py-2.5 text-sm font-bold text-[#1F241C] shadow-sm transition hover:bg-[#b8963f] sm:text-base";
const sectionEyebrow = "text-xs font-bold uppercase tracking-[0.14em] text-[#556B3E]";
const sectionTitle = "mt-2 font-serif text-2xl font-bold tracking-tight text-[#7A1E2C] sm:text-3xl";
const cardShell =
  "rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-5 shadow-sm sm:p-6";

export default function MediaKitPageClient() {
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/media-kit";
  const lang = useMemo(() => parseGateLang(searchParams?.get("lang")), [searchParams]);
  const copy = getMediaKitPageCopy(lang);
  const googleCopy = getGoogleTranslatePlacementCopy(lang);
  const dualPdf = showDualMediaKitPdfButtons(lang);
  const magazineUi = getMagazineUi(lang);
  const primaryPdf = primaryMediaKitPdfHref(lang);
  const googleHref = translateSiteHref({
    lang,
    sourcePage: "media-kit",
    sourceCta: "media_kit_google_translate",
    returnTo: "/media-kit",
  });
  const websitesPasteHint = getGoogleTranslateWebsitesPasteHint(lang);
  const adContactHref = mediaKitAdvertisingContactHref(lang);
  const mediaKitContactHref = mediaKitInterestContactHref(lang);
  const homeHref = `/coming-soon-v2?lang=${lang}`;

  return (
    <main lang={lang} className="min-h-screen overflow-x-hidden bg-[#F8F4EA] text-[#1F241C]">
      <div className="mx-auto max-w-4xl min-w-0 px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href={homeHref} className="inline-block shrink-0">
            <Image
              src="/logo-clean.png"
              alt="Leonix Media"
              width={160}
              height={56}
              className="h-11 w-auto object-contain"
              priority
            />
          </Link>
          <LeonixHeaderLanguageSelector variant="full" pathnameOverride={pathname} className="self-start sm:self-center" />
        </header>

        <HeroSection copy={copy.hero} adContactHref={adContactHref} primaryPdf={primaryPdf} />

        <ContentSection eyebrow={copy.whatWeOffer.eyebrow} headline={copy.whatWeOffer.headline}>
          <p className="max-w-3xl text-base leading-relaxed text-[#3D3428]">{copy.whatWeOffer.intro}</p>
          <ul className="mt-6 grid list-none gap-4 p-0 sm:grid-cols-2">
            {copy.whatWeOffer.items.map((item) => (
              <li key={item.title} className="flex">
                <article className={`flex h-full w-full flex-col ${cardShell}`}>
                  <h3 className="font-serif text-lg font-bold text-[#7A1E2C]">{item.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{item.body}</p>
                </article>
              </li>
            ))}
          </ul>
        </ContentSection>

        <ContentSection eyebrow={copy.whyAdvertise.eyebrow} headline={copy.whyAdvertise.headline}>
          <ul className="mt-4 grid list-none gap-3 p-0 sm:grid-cols-2">
            {copy.whyAdvertise.points.map((point) => (
              <li key={point.title} className="flex">
                <article className={`flex h-full w-full flex-col ${cardShell} ring-1 ring-[#C9A84A]/15`}>
                  <h3 className="text-base font-bold text-[#2A4536] sm:text-lg">{point.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">{point.body}</p>
                </article>
              </li>
            ))}
          </ul>
        </ContentSection>

        <ContentSection eyebrow={copy.packages.eyebrow} headline={copy.packages.headline}>
          <p className="max-w-3xl text-base leading-relaxed text-[#3D3428]">{copy.packages.body}</p>
          <p className="mt-3 max-w-3xl rounded-xl border border-[#C9A84A]/35 bg-[#FFFDF7] p-4 text-sm leading-relaxed text-[#3D3428]/90">
            {copy.packages.note}
          </p>
        </ContentSection>

        <ContentSection eyebrow={copy.downloads.eyebrow} headline={copy.downloads.headline}>
          <p className="max-w-3xl text-sm leading-relaxed text-[#3D3428]/90 sm:text-[0.9375rem]">
            {copy.downloads.honestyNote}
          </p>
          <div className="mt-5 flex min-w-0 flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            {dualPdf ? (
              <>
                <PdfDownloadLink label={magazineUi.mediaKitPdfEsLabel} href={MAGAZINE_KIT_PDF_ES} action={copy.downloads.downloadAction} />
                <PdfDownloadLink label={magazineUi.mediaKitPdfEnLabel} href={MAGAZINE_KIT_PDF_EN} action={copy.downloads.downloadAction} />
              </>
            ) : (
              <PdfDownloadLink
                label={lang === "en" ? copy.downloads.enPdfLabel : copy.downloads.esPdfLabel}
                href={primaryPdf}
                action={copy.downloads.downloadAction}
              />
            )}
          </div>
        </ContentSection>

        <section className="mt-12 rounded-2xl border border-[#7A1E2C]/25 bg-gradient-to-br from-[#7A1E2C]/10 to-[#FFFDF7] p-6 sm:p-8">
          <h2 className="font-serif text-xl font-bold text-[#7A1E2C] sm:text-2xl">{copy.contactCta.headline}</h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#3D3428]">{copy.contactCta.body}</p>
          <div className="mt-5 flex min-w-0 flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <Link href={adContactHref} className={btnPrimary}>
              {copy.contactCta.primaryCta}
            </Link>
            <Link href={mediaKitContactHref} className={btnSecondary}>
              {copy.contactCta.mediaKitInterestCta}
            </Link>
          </div>
        </section>

        <aside className="mt-8 rounded-lg border border-[#D6C7AD]/60 bg-[#FFFDF7] px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-xs font-semibold text-[#2A4536] sm:text-sm">{copy.googleTranslate.question}</p>
          <p className="mt-1 text-[0.8125rem] leading-snug text-[#3D3428] sm:text-sm">{copy.googleTranslate.body}</p>
          <Link
            href={googleHref}
            className="mt-2 inline-flex min-h-[2.25rem] items-center text-xs font-bold text-[#7A1E2C] underline decoration-[#C9A84A]/60 underline-offset-2 hover:text-[#5e1721] sm:text-sm"
          >
            {googleCopy.comingSoonCta}
          </Link>
          <p className={`mt-1.5 ${googleTranslateWebsitesPasteHintClass} text-[#3D3428]/85`}>
            {websitesPasteHint}
          </p>
        </aside>

        <p className="mt-8 text-center">
          <Link href={homeHref} className="text-sm font-semibold text-[#556B3E] underline underline-offset-2 hover:text-[#2A4536]">
            {copy.backToComingSoon}
          </Link>
        </p>
      </div>
    </main>
  );
}

function HeroSection({
  copy,
  adContactHref,
  primaryPdf,
}: {
  copy: ReturnType<typeof getMediaKitPageCopy>["hero"];
  adContactHref: string;
  primaryPdf: string;
}) {
  return (
    <section className="mb-12">
      <p className={sectionEyebrow}>{copy.eyebrow}</p>
      <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#7A1E2C] sm:text-4xl">{copy.title}</h1>
      <p className="mt-4 max-w-2xl text-lg font-semibold leading-snug text-[#556B3E] sm:text-xl">{copy.positioning}</p>
      <div className="mt-6 flex min-w-0 flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <Link href={adContactHref} className={btnPrimary}>
          {copy.requestAdCta}
        </Link>
        <a href={primaryPdf} target="_blank" rel="noopener noreferrer" className={btnGold}>
          {copy.downloadCta}
        </a>
      </div>
    </section>
  );
}

function ContentSection({
  eyebrow,
  headline,
  children,
}: {
  eyebrow: string;
  headline: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12 border-t border-[#D6C7AD]/60 pt-10">
      <p className={sectionEyebrow}>{eyebrow}</p>
      <h2 className={sectionTitle}>{headline}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PdfDownloadLink({ label, href, action }: { label: string; href: string; action: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${btnSecondary} min-w-0 flex-col gap-0.5 px-4 py-3 text-left sm:inline-flex sm:flex-row sm:items-center sm:gap-3`}
    >
      <span className="block text-sm font-bold leading-snug">{label}</span>
      <span className="block text-xs font-semibold text-[#556B3E] sm:text-sm">{action}</span>
    </a>
  );
}
