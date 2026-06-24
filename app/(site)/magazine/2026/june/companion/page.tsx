"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { LeonixHeaderLanguageSelector } from "@/app/(site)/magazine/components/LeonixHeaderLanguageSelector";
import {
  getGoogleTranslateWebsitesPasteHint,
  googleTranslateWebsitesPasteHintClass,
} from "@/app/lib/googleTranslateWebsite";
import {
  getJune2026CompanionCopy,
  getJune2026CompanionLinks,
} from "@/app/lib/magazine/june2026CompanionContent";
import { resolveRouteLang } from "@/app/lib/language";

const btnPrimary =
  "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-full bg-[#7A1E2C] px-5 py-3 text-center text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721] sm:min-h-[3.125rem]";
const btnOutline =
  "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-full border-2 border-[#7A1E2C]/80 bg-[#FFFDF7] px-5 py-3 text-center text-sm font-bold text-[#7A1E2C] transition hover:bg-[#FBF7EF] sm:min-h-[3.125rem] sm:text-[0.9375rem]";
const btnGold =
  "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-full border-2 border-[#C9A84A] bg-[#FFFDF7] px-5 py-3 text-center text-sm font-bold text-[#1F241C] transition hover:border-[#b89742] hover:bg-[#FBF7EF] sm:min-h-[3.125rem]";
const sectionShell =
  "scroll-mt-28 rounded-2xl border border-[#D6C7AD]/70 bg-[#FFFDF7] p-4 sm:p-5";

function JuneCompanionContent() {
  const params = useSearchParams();
  const lang = resolveRouteLang(params?.get("lang"));
  const copy = useMemo(() => getJune2026CompanionCopy(lang), [lang]);
  const links = useMemo(() => getJune2026CompanionLinks(lang), [lang]);
  const websitesPasteHint = getGoogleTranslateWebsitesPasteHint(lang);

  return (
    <main lang={lang} className="min-h-screen overflow-x-hidden bg-[#FAF6EE] pb-20 text-[#1F241C]">
      <div className="relative mx-auto max-w-lg min-w-0 px-4 pt-24 sm:px-6">
        <div className="mb-4 flex justify-end">
          <LeonixHeaderLanguageSelector
            variant="full"
            pathnameOverride="/magazine/2026/june/companion"
          />
        </div>

        <section className="rounded-2xl border border-[#2A4536]/25 bg-gradient-to-br from-[#FFFDF7] via-[#FFFDF7] to-[#FBF7EF] p-5 shadow-[0_12px_32px_-18px_rgba(31,36,28,0.15)] ring-1 ring-[#C9A84C]/25 sm:p-7">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-xl font-bold leading-tight text-[#2A4536] sm:text-2xl">
            {copy.pageTitle}
          </h1>
          <p className="mt-1 text-xs font-semibold text-[#556B3E]">{copy.issueLabel}</p>
          <p className="mt-3 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
            {copy.introSummary}
          </p>
          <p className="mt-3 rounded-lg border border-[#C9A84A]/35 bg-[#FFFDF7] px-3 py-2.5 text-xs leading-relaxed text-[#3D3428] sm:text-sm">
            {copy.visualTruthNote}
          </p>
          {copy.bodyLanguageNote ? (
            <p className="mt-3 rounded-lg border border-[#D6C7AD]/70 bg-[#FAF6EE] px-3 py-2.5 text-xs leading-relaxed text-[#3D3428] sm:text-sm">
              {copy.bodyLanguageNote}
            </p>
          ) : null}
        </section>

        <div className="mt-5 space-y-4">
          {copy.sections.map((section) => (
            <section key={section.id} id={section.id} className={sectionShell}>
              <h2 className="font-serif text-lg font-bold text-[#2A4536]">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
                {section.summary}
              </p>
              {section.bullets?.length ? (
                <ul className="mt-3 list-disc space-y-1.5 break-words pl-5 text-sm leading-relaxed text-[#3D3428]">
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {section.cards?.length ? (
                <div className="mt-4 grid min-w-0 gap-2.5">
                  {section.cards.map((card) => (
                    <article
                      key={card.id}
                      className="rounded-xl border border-[#D6C7AD]/60 bg-[#FAF6EE]/80 p-3 sm:p-4"
                    >
                      <h3 className="text-sm font-bold text-[#2A4536]">{card.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-[#3D3428]">{card.summary}</p>
                    </article>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>

        <section className={`${sectionShell} mt-5`} aria-labelledby="companion-actions-title">
          <h2 id="companion-actions-title" className="font-serif text-lg font-bold text-[#2A4536]">
            {copy.ctas.actionsTitle}
          </h2>
          <div className="mt-4 grid min-w-0 gap-2.5">
            <Link href={links.visualMagazineHref} className={btnPrimary}>
              {copy.ctas.openVisualMagazine}
            </Link>
            <Link href={links.qrGuideHref} className={btnOutline}>
              {copy.ctas.qrGuide}
            </Link>
            <Link href={links.mediaKitHref} className={btnGold}>
              {copy.ctas.mediaKit}
            </Link>
            <Link href={links.advertiseHref} className={btnOutline}>
              {copy.ctas.advertise}
            </Link>
            <Link href={links.googleTranslateHref} className={btnGold}>
              {copy.ctas.googleTranslate}
            </Link>
            <p className={googleTranslateWebsitesPasteHintClass}>{websitesPasteHint}</p>
          </div>
        </section>

        <p className="mt-6 text-center">
          <Link
            href={links.qrReadGuideHref}
            className="text-sm font-semibold text-[#556B3E] underline underline-offset-2 hover:text-[#2A4536]"
          >
            {copy.ctas.backToQrGuide}
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function June2026CompanionPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center bg-[#FAF6EE] text-[#3D3428]"
          aria-busy="true"
        />
      }
    >
      <JuneCompanionContent />
    </Suspense>
  );
}
